use async_trait::async_trait;
use hbb_common::{config::Config, log};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use russh::server::{Auth, Msg, Server as _, Session};
use russh::*;
use russh_keys::key;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tokio::sync::Mutex;

/// A writer that sends data to a tokio mpsc channel.
/// Used to bridge SSH data handler -> bridge task for remote connections.
struct ChannelWriter {
    sender: tokio::sync::mpsc::UnboundedSender<Vec<u8>>,
}

impl Write for ChannelWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.sender
            .send(buf.to_vec())
            .map_err(|_| std::io::Error::new(std::io::ErrorKind::BrokenPipe, "channel closed"))?;
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

#[derive(Clone)]
pub struct SshServer {
    clients: Arc<Mutex<HashMap<(usize, ChannelId), Arc<std::sync::Mutex<Box<dyn Write + Send>>>>>>,
    id: usize,
    /// If set, this SSH session targets a remote RustDesk peer.
    /// Contains (remote_id, password).
    remote_target: Option<(String, String)>,
}

impl SshServer {
    pub fn new() -> Self {
        Self {
            clients: Arc::new(Mutex::new(HashMap::new())),
            id: 0,
            remote_target: None,
        }
    }
}

impl server::Server for SshServer {
    type Handler = Self;
    fn new_client(&mut self, peer_addr: Option<std::net::SocketAddr>) -> Self {
        log::info!("SSH: New client connection from {:?}", peer_addr);
        let s = self.clone();
        self.id += 1;
        s
    }

    fn handle_session_error(&mut self, error: <Self::Handler as server::Handler>::Error) {
        log::error!("SSH session error: {:?}", error);
    }
}

#[async_trait]
impl server::Handler for SshServer {
    type Error = russh::Error;

    async fn auth_password(&mut self, user: &str, pass: &str) -> Result<Auth, Self::Error> {
        log::info!("SSH auth_password called for user: {}", user);
        let rustdesk_id = Config::get_id();

        // Check if it's the local RustDesk ID
        if user == rustdesk_id {
            let temp_pass = crate::ui_interface::temporary_password();
            let perm_pass = crate::ui_interface::permanent_password();
            if pass == temp_pass || (!perm_pass.is_empty() && pass == perm_pass) {
                log::info!("SSH auth successful for local ID: {}", user);
                self.remote_target = None;
                return Ok(Auth::Accept);
            }
        }

        // If the username looks like a RustDesk ID (numeric, >= 6 digits),
        // treat as remote target. Auth will be verified against the remote peer.
        if user != rustdesk_id && user.chars().all(|c| c.is_ascii_digit()) && user.len() >= 6 {
            log::info!("SSH: Accepting auth for remote RustDesk ID: {}", user);
            self.remote_target = Some((user.to_string(), pass.to_string()));
            return Ok(Auth::Accept);
        }

        log::warn!("SSH auth failed for user: {}", user);
        Ok(Auth::Reject {
            proceed_with_methods: Some(MethodSet::PASSWORD | MethodSet::PUBLICKEY),
        })
    }

    async fn auth_publickey_offered(
        &mut self,
        user: &str,
        public_key: &key::PublicKey,
    ) -> Result<Auth, Self::Error> {
        log::info!("SSH auth_publickey_offered called for user: {}", user);
        if let Some(home) = std::env::var_os("USERPROFILE") {
            let mut path = std::path::PathBuf::from(home);
            path.push(".ssh");
            path.push("authorized_keys");

            if let Ok(contents) = std::fs::read_to_string(&path) {
                for line in contents.lines() {
                    if line.trim().is_empty() || line.trim().starts_with('#') {
                        continue;
                    }
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        if let Ok(parsed_key) = russh_keys::parse_public_key_base64(parts[1]) {
                            if public_key == &parsed_key {
                                log::info!("SSH publickey found in authorized_keys");
                                return Ok(Auth::Accept);
                            }
                        }
                    }
                }
            } else {
                log::info!("No authorized_keys file found, pubkey auth will be skipped");
            }
        }
        Ok(Auth::Reject {
            proceed_with_methods: Some(MethodSet::PASSWORD),
        })
    }

    async fn auth_publickey(
        &mut self,
        user: &str,
        _public_key: &key::PublicKey,
    ) -> Result<Auth, Self::Error> {
        log::info!("SSH publickey auth verified for user: {}", user);
        Ok(Auth::Accept)
    }

    async fn channel_open_session(
        &mut self,
        _channel: Channel<Msg>,
        _session: &mut Session,
    ) -> Result<bool, Self::Error> {
        log::info!("SSH channel_open_session called");
        Ok(true)
    }

    async fn pty_request(
        &mut self,
        _channel: ChannelId,
        _term: &str,
        _col_width: u32,
        _row_height: u32,
        _pix_width: u32,
        _pix_height: u32,
        _modes: &[(russh::Pty, u32)],
        _session: &mut Session,
    ) -> Result<(), Self::Error> {
        log::info!("SSH pty_request received");
        Ok(())
    }

    async fn env_request(
        &mut self,
        _channel: ChannelId,
        _variable_name: &str,
        _variable_value: &str,
        _session: &mut Session,
    ) -> Result<(), Self::Error> {
        Ok(())
    }

    async fn shell_request(
        &mut self,
        channel: ChannelId,
        session: &mut Session,
    ) -> Result<(), Self::Error> {
        log::info!("SSH shell_request called");
        let id = self.id;
        let handle = session.handle();

        // Remote bridge mode
        if let Some((remote_id, password)) = self.remote_target.clone() {
            log::info!("SSH: Starting remote bridge to {}", remote_id);

            // Create channel for SSH client data -> bridge task
            let (ssh_data_tx, ssh_data_rx) = tokio::sync::mpsc::unbounded_channel::<Vec<u8>>();

            // Store the channel writer so the `data` handler sends SSH input to the bridge
            let writer = ChannelWriter {
                sender: ssh_data_tx,
            };
            self.clients.lock().await.insert(
                (id, channel),
                Arc::new(std::sync::Mutex::new(
                    Box::new(writer) as Box<dyn Write + Send>
                )),
            );

            // Spawn the bridge task
            tokio::spawn(ssh_bridge::start_bridge(
                remote_id,
                password,
                channel,
                handle,
                ssh_data_rx,
            ));

            return Ok(());
        }

        // Local shell mode - spawn a PTY
        let pty_system = native_pty_system();
        let pair = match pty_system.openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        }) {
            Ok(pair) => pair,
            Err(e) => {
                log::error!("SSH: Failed to open PTY: {}", e);
                let h = handle.clone();
                tokio::spawn(async move {
                    let _ = h.close(channel).await;
                });
                return Ok(());
            }
        };

        let shell = crate::server::terminal_helper::get_default_shell();
        let cmd = CommandBuilder::new(&shell);
        match pair.slave.spawn_command(cmd) {
            Ok(_child) => {}
            Err(e) => {
                log::error!("SSH: Failed to spawn shell '{}': {}", shell, e);
                let h = handle.clone();
                tokio::spawn(async move {
                    let _ = h.close(channel).await;
                });
                return Ok(());
            }
        }

        let mut reader = match pair.master.try_clone_reader() {
            Ok(r) => r,
            Err(e) => {
                log::error!("SSH: Failed to clone PTY reader: {}", e);
                return Ok(());
            }
        };
        let writer = match pair.master.take_writer() {
            Ok(w) => w,
            Err(e) => {
                log::error!("SSH: Failed to take PTY writer: {}", e);
                return Ok(());
            }
        };

        self.clients
            .lock()
            .await
            .insert((id, channel), Arc::new(std::sync::Mutex::new(writer)));

        tokio::task::spawn_blocking(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(n) if n > 0 => {
                        let data = buf[..n].to_vec();
                        let h = handle.clone();
                        tokio::spawn(async move {
                            let _ = h.data(channel, russh::CryptoVec::from_slice(&data)).await;
                        });
                    }
                    _ => break,
                }
            }
        });

        Ok(())
    }

    async fn data(
        &mut self,
        channel: ChannelId,
        data: &[u8],
        _session: &mut Session,
    ) -> Result<(), Self::Error> {
        let clients = self.clients.lock().await;
        if let Some(writer) = clients.get(&(self.id, channel)) {
            let mut w = writer.lock().unwrap();
            let _ = w.write_all(data);
            let _ = w.flush();
        }
        Ok(())
    }
}

// ─── Remote Bridge ──────────────────────────────────────────────────────────

mod ssh_bridge {
    use crate::client::*;
    use async_trait::async_trait;
    use hbb_common::{
        allow_err,
        config::{LocalConfig, READ_TIMEOUT},
        log,
        message_proto::*,
        protobuf::Message as _,
        rendezvous_proto::ConnType,
        timeout,
        tokio::sync::mpsc,
        Stream,
    };
    use russh::{ChannelId, CryptoVec};
    use std::sync::{Arc, RwLock};

    /// Minimal Interface implementation for bridging SSH to a remote RustDesk terminal.
    #[derive(Clone)]
    struct BridgeSession {
        lc: Arc<RwLock<LoginConfigHandler>>,
        sender: mpsc::UnboundedSender<Data>,
        password: String,
    }

    impl BridgeSession {
        fn new(remote_id: &str, password: &str, sender: mpsc::UnboundedSender<Data>) -> Self {
            let session = Self {
                lc: Default::default(),
                sender,
                password: password.to_owned(),
            };
            session.lc.write().unwrap().initialize(
                remote_id.to_owned(),
                ConnType::TERMINAL,
                None,
                false,
                None,
                None,
                None,
            );
            session
        }
    }

    #[async_trait]
    impl Interface for BridgeSession {
        fn get_lch(&self) -> Arc<RwLock<LoginConfigHandler>> {
            self.lc.clone()
        }

        fn send(&self, data: Data) {
            self.sender.send(data).ok();
        }

        fn msgbox(&self, msgtype: &str, title: &str, text: &str, _link: &str) {
            match msgtype {
                "input-password" | "re-input-password" => {
                    self.sender
                        .send(Data::Login((
                            "".to_string(),
                            "".to_string(),
                            self.password.clone(),
                            false,
                        )))
                        .ok();
                }
                msg if msg.contains("error") => {
                    log::error!("SSH Bridge: {}: {}: {}", msgtype, title, text);
                }
                _ => {
                    log::info!("SSH Bridge: {}: {}: {}", msgtype, title, text);
                }
            }
        }

        fn handle_login_error(&self, err: &str) -> bool {
            handle_login_error(self.lc.clone(), err, self)
        }

        fn handle_peer_info(&self, pi: PeerInfo) {
            self.lc.write().unwrap().handle_peer_info(&pi);
        }

        fn set_multiple_windows_session(&self, _sessions: Vec<WindowsSession>) {}

        async fn handle_hash(&self, pass: &str, hash: Hash, peer: &mut Stream) {
            handle_hash(self.lc.clone(), pass, hash, self, peer).await;
        }

        async fn handle_login_from_ui(
            &self,
            os_username: String,
            os_password: String,
            password: String,
            remember: bool,
            peer: &mut Stream,
        ) {
            handle_login_from_ui(
                self.lc.clone(),
                os_username,
                os_password,
                password,
                remember,
                peer,
            )
            .await;
        }

        async fn handle_test_delay(&self, t: TestDelay, peer: &mut Stream) {
            handle_test_delay(t, peer).await;
        }
    }

    /// Connect to a remote RustDesk peer and bridge SSH channel data
    /// to the remote's terminal service.
    pub async fn start_bridge(
        remote_id: String,
        password: String,
        channel: ChannelId,
        handle: russh::server::Handle,
        mut ssh_data_rx: mpsc::UnboundedReceiver<Vec<u8>>,
    ) {
        let (sender, mut receiver) = mpsc::unbounded_channel::<Data>();
        let bridge = BridgeSession::new(&remote_id, &password, sender);

        let key = crate::common::get_key(false).await;
        let token = LocalConfig::get_option("access_token");

        // Step 1: Connect to remote peer
        let ((mut stream, direct, _pk, _kcp, _stream_type), (feedback, rendezvous_server)) =
            match Client::start(&remote_id, &key, &token, ConnType::TERMINAL, bridge.clone()).await
            {
                Err(err) => {
                    log::error!("SSH Bridge: Failed to connect to {}: {}", remote_id, err);
                    send_and_close(
                        &handle,
                        channel,
                        format!("\r\nFailed to connect to remote {}: {}\r\n", remote_id, err)
                            .as_bytes(),
                    )
                    .await;
                    return;
                }
                Ok(result) => result,
            };

        log::info!("SSH Bridge: Connected to {}, direct: {}", remote_id, direct);
        bridge.update_direct(Some(direct));

        let _keep = hc_connection(feedback, rendezvous_server, &token).await;

        // Step 2: Authentication loop
        let mut received = false;
        loop {
            tokio::select! {
                res = timeout(READ_TIMEOUT, stream.next()) => match res {
                    Err(_) => {
                        log::error!("SSH Bridge: Auth timeout");
                        send_and_close(&handle, channel, b"\r\nConnection timeout\r\n").await;
                        return;
                    }
                    Ok(Some(Ok(bytes))) => {
                        if !received {
                            received = true;
                            bridge.update_received(true);
                        }
                        let msg_in = match Message::parse_from_bytes(&bytes) {
                            Ok(m) => m,
                            Err(e) => {
                                log::error!("SSH Bridge: Parse error: {}", e);
                                continue;
                            }
                        };
                        match msg_in.union {
                            Some(message::Union::Hash(hash)) => {
                                bridge.handle_hash(&password, hash, &mut stream).await;
                            }
                            Some(message::Union::LoginResponse(lr)) => match lr.union {
                                Some(login_response::Union::Error(err)) => {
                                    if !bridge.handle_login_error(&err) {
                                        send_and_close(
                                            &handle, channel,
                                            format!("\r\nLogin to remote failed: {}\r\n", err).as_bytes(),
                                        ).await;
                                        return;
                                    }
                                }
                                Some(login_response::Union::PeerInfo(pi)) => {
                                    bridge.handle_peer_info(pi);
                                    break; // Auth success!
                                }
                                _ => {}
                            },
                            Some(message::Union::TestDelay(t)) => {
                                bridge.handle_test_delay(t, &mut stream).await;
                            }
                            _ => {}
                        }
                    }
                    Ok(Some(Err(err))) => {
                        log::error!("SSH Bridge: Connection error: {}", err);
                        send_and_close(
                            &handle, channel,
                            format!("\r\nConnection error: {}\r\n", err).as_bytes(),
                        ).await;
                        return;
                    }
                    _ => {
                        log::error!("SSH Bridge: Connection reset");
                        send_and_close(&handle, channel, b"\r\nConnection reset by peer\r\n").await;
                        return;
                    }
                },
                d = receiver.recv() => {
                    match d {
                        Some(Data::Login((os_username, os_password, password, remember))) => {
                            bridge.handle_login_from_ui(os_username, os_password, password, remember, &mut stream).await;
                        }
                        Some(Data::Message(msg)) => {
                            allow_err!(stream.send(&msg).await);
                        }
                        _ => {}
                    }
                }
            }
        }

        // Step 3: Open terminal on remote
        log::info!(
            "SSH Bridge: Auth succeeded for {}, opening terminal",
            remote_id
        );
        let terminal_id = 1;

        let mut action = TerminalAction::new();
        action.set_open(OpenTerminal {
            terminal_id,
            rows: 24,
            cols: 80,
            ..Default::default()
        });
        let mut msg_out = Message::new();
        msg_out.set_terminal_action(action);
        if let Err(e) = stream.send(&msg_out).await {
            log::error!("SSH Bridge: Failed to send open terminal: {}", e);
            send_and_close(&handle, channel, b"\r\nFailed to open terminal\r\n").await;
            return;
        }

        // Step 4: Bridge loop - SSH channel <-> RustDesk terminal
        let _ = handle
            .data(
                channel,
                CryptoVec::from_slice(
                    format!("\r\nConnected to remote RustDesk peer {}\r\n", remote_id).as_bytes(),
                ),
            )
            .await;

        loop {
            tokio::select! {
                // Data from remote RustDesk peer -> SSH channel
                res = stream.next() => {
                    match res {
                        Some(Ok(bytes)) => {
                            if let Ok(msg) = Message::parse_from_bytes(&bytes) {
                                match msg.union {
                                    Some(message::Union::TerminalResponse(resp)) => {
                                        use terminal_response::Union;
                                        match resp.union {
                                            Some(Union::Opened(opened)) => {
                                                if !opened.success {
                                                    send_and_close(
                                                        &handle, channel,
                                                        b"\r\nFailed to open terminal on remote\r\n",
                                                    ).await;
                                                    return;
                                                }
                                                log::info!("SSH Bridge: Terminal opened on {}", remote_id);
                                            }
                                            Some(Union::Data(data)) => {
                                                let _ = handle.data(
                                                    channel,
                                                    CryptoVec::from_slice(&data.data),
                                                ).await;
                                            }
                                            Some(Union::Closed(_)) => {
                                                log::info!("SSH Bridge: Remote terminal closed");
                                                let _ = handle.close(channel).await;
                                                return;
                                            }
                                            _ => {}
                                        }
                                    }
                                    Some(message::Union::TestDelay(t)) => {
                                        bridge.handle_test_delay(t, &mut stream).await;
                                    }
                                    _ => {}
                                }
                            }
                        }
                        _ => {
                            log::info!("SSH Bridge: Remote stream ended");
                            let _ = handle.close(channel).await;
                            return;
                        }
                    }
                }
                // Data from SSH client -> remote terminal
                data = ssh_data_rx.recv() => {
                    match data {
                        Some(bytes) => {
                            let mut action = TerminalAction::new();
                            action.set_data(TerminalData {
                                terminal_id,
                                data: bytes::Bytes::from(bytes),
                                ..Default::default()
                            });
                            let mut msg_out = Message::new();
                            msg_out.set_terminal_action(action);
                            if let Err(e) = stream.send(&msg_out).await {
                                log::error!("SSH Bridge: Failed to send data: {}", e);
                                break;
                            }
                        }
                        None => {
                            // SSH channel closed, close remote terminal
                            log::info!("SSH Bridge: SSH data channel ended");
                            let mut action = TerminalAction::new();
                            action.set_close(CloseTerminal {
                                terminal_id,
                                ..Default::default()
                            });
                            let mut msg_out = Message::new();
                            msg_out.set_terminal_action(action);
                            let _ = stream.send(&msg_out).await;
                            break;
                        }
                    }
                }
            }
        }
    }

    async fn send_and_close(handle: &russh::server::Handle, channel: ChannelId, msg: &[u8]) {
        let _ = handle.data(channel, CryptoVec::from_slice(msg)).await;
        let _ = handle.close(channel).await;
    }
}

// ─── Host Key Management ────────────────────────────────────────────────────

fn get_host_key_path() -> std::path::PathBuf {
    Config::path("ssh_host_key")
}

fn load_or_generate_host_key() -> Option<russh_keys::key::KeyPair> {
    let key_path = get_host_key_path();

    // Try to load existing key
    if key_path.exists() {
        match std::fs::read(&key_path) {
            Ok(bytes) => {
                if bytes.len() == 64 {
                    let secret =
                        ed25519_dalek::SigningKey::from_bytes(bytes[..32].try_into().unwrap());
                    let kp = russh_keys::key::KeyPair::Ed25519(secret);
                    log::info!("SSH: Loaded existing host key from {:?}", key_path);
                    return Some(kp);
                }
                log::warn!("SSH: Invalid host key file size, regenerating");
            }
            Err(e) => {
                log::warn!("SSH: Failed to read host key: {}, regenerating", e);
            }
        }
    }

    // Generate new key
    let key = russh_keys::key::KeyPair::generate_ed25519()?;

    // Save to disk
    if let russh_keys::key::KeyPair::Ed25519(ref secret) = key {
        let mut bytes = Vec::with_capacity(64);
        bytes.extend_from_slice(secret.as_bytes());
        bytes.extend_from_slice(secret.verifying_key().as_bytes());
        if let Err(e) = std::fs::write(&key_path, &bytes) {
            log::warn!("SSH: Failed to save host key: {}", e);
        } else {
            log::info!("SSH: Generated and saved new host key to {:?}", key_path);
        }
    }

    Some(key)
}

// ─── Server Entry Point ─────────────────────────────────────────────────────

pub async fn start_ssh_server() {
    log::info!("SSH: Loading or generating server host key...");
    let key = match load_or_generate_host_key() {
        Some(k) => k,
        None => {
            log::error!("SSH: Failed to generate host key!");
            return;
        }
    };

    let config = russh::server::Config {
        inactivity_timeout: Some(std::time::Duration::from_secs(3600)),
        auth_rejection_time: std::time::Duration::from_secs(3),
        auth_rejection_time_initial: Some(std::time::Duration::from_secs(0)),
        keys: vec![key],
        ..Default::default()
    };

    let config = std::sync::Arc::new(config);
    let mut server = SshServer::new();

    log::info!("SSH Server starting on 0.0.0.0:2222...");

    match tokio::net::TcpListener::bind("0.0.0.0:2222").await {
        Ok(listener) => {
            log::info!("SSH Server listening on 0.0.0.0:2222");
            if let Err(e) = server.run_on_socket(config, &listener).await {
                log::error!("SSH server socket error: {:?}", e);
            }
        }
        Err(e) => {
            log::error!("SSH: Failed to bind to 0.0.0.0:2222: {:?}", e);
        }
    }
}
