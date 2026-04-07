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
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

/// Minimal Interface implementation for MCP bridge connections.
#[derive(Clone)]
pub struct McpBridgeSession {
    lc: Arc<RwLock<LoginConfigHandler>>,
    sender: mpsc::UnboundedSender<Data>,
    password: String,
}

impl McpBridgeSession {
    pub fn new(
        remote_id: &str,
        password: &str,
        conn_type: ConnType,
        sender: mpsc::UnboundedSender<Data>,
    ) -> Self {
        let session = Self {
            lc: Default::default(),
            sender,
            password: password.to_owned(),
        };
        session.lc.write().unwrap().initialize(
            remote_id.to_owned(),
            conn_type,
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
impl Interface for McpBridgeSession {
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
                log::error!("MCP Bridge: {}: {}: {}", msgtype, title, text);
            }
            _ => {
                log::info!("MCP Bridge: {}: {}: {}", msgtype, title, text);
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

/// Result of a successful connection + authentication
pub struct AuthedConnection {
    pub stream: Stream,
    pub bridge: McpBridgeSession,
    pub receiver: mpsc::UnboundedReceiver<Data>,
    pub _keep: Option<mpsc::UnboundedSender<()>>,
}

/// Connect to a remote peer and complete authentication.
pub async fn connect_and_auth(
    peer_id: &str,
    password: &str,
    conn_type: ConnType,
) -> Result<AuthedConnection, String> {
    let (sender, mut receiver) = mpsc::unbounded_channel::<Data>();
    let bridge = McpBridgeSession::new(peer_id, password, conn_type, sender);

    let key = crate::common::get_key(false).await;
    let token = LocalConfig::get_option("access_token");

    let ((mut stream, direct, _pk, _kcp, _stream_type), (feedback, rendezvous_server)) =
        Client::start(peer_id, &key, &token, conn_type, bridge.clone())
            .await
            .map_err(|e| format!("Connection failed: {}", e))?;

    log::info!("MCP: Connected to {}, direct: {}", peer_id, direct);
    bridge.update_direct(Some(direct));

    let _keep = hc_connection(feedback, rendezvous_server, &token).await;

    // Authentication loop
    let mut received = false;
    loop {
        tokio::select! {
            res = timeout(READ_TIMEOUT, stream.next()) => match res {
                Err(_) => return Err("Auth timeout".into()),
                Ok(Some(Ok(bytes))) => {
                    if !received {
                        received = true;
                        bridge.update_received(true);
                    }
                    let msg_in = Message::parse_from_bytes(&bytes)
                        .map_err(|e| format!("Parse error: {}", e))?;
                    match msg_in.union {
                        Some(message::Union::Hash(hash)) => {
                            bridge.handle_hash(password, hash, &mut stream).await;
                        }
                        Some(message::Union::LoginResponse(lr)) => match lr.union {
                            Some(login_response::Union::Error(err)) => {
                                if !bridge.handle_login_error(&err) {
                                    return Err(format!("Login failed: {}", err));
                                }
                            }
                            Some(login_response::Union::PeerInfo(pi)) => {
                                bridge.handle_peer_info(pi);
                                break; // Auth success
                            }
                            _ => {}
                        },
                        Some(message::Union::TestDelay(t)) => {
                            bridge.handle_test_delay(t, &mut stream).await;
                        }
                        _ => {}
                    }
                }
                Ok(Some(Err(err))) => return Err(format!("Connection error: {}", err)),
                _ => return Err("Connection reset by peer".into()),
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

    log::info!("MCP: Auth succeeded for {}", peer_id);
    Ok(AuthedConnection {
        stream,
        bridge,
        receiver,
        _keep,
    })
}

/// A managed terminal session. The stream is owned by a background task.
/// Communication happens through channels.
pub struct TerminalSession {
    pub peer_id: String,
    pub terminal_id: i32,
    /// Send protobuf messages to the stream task
    pub cmd_tx: mpsc::UnboundedSender<Message>,
    /// Receive terminal output data from the stream task
    pub output_rx: mpsc::UnboundedReceiver<Vec<u8>>,
    /// Login config handler (for peer info)
    pub lc: Arc<RwLock<LoginConfigHandler>>,
    pub created_at: Instant,
}

/// Spawn a background task that owns the stream and bridges between channels.
/// Returns (cmd_tx, output_rx) for sending commands and receiving output.
pub fn spawn_stream_task(
    mut stream: Stream,
    mut data_receiver: mpsc::UnboundedReceiver<Data>,
    _keep: Option<mpsc::UnboundedSender<()>>,
    session_id: String,
) -> (
    mpsc::UnboundedSender<Message>,
    mpsc::UnboundedReceiver<Vec<u8>>,
) {
    let (cmd_tx, mut cmd_rx) = mpsc::unbounded_channel::<Message>();
    let (output_tx, output_rx) = mpsc::unbounded_channel::<Vec<u8>>();

    tokio::spawn(async move {
        // Keep _keep alive for the duration of this task
        let _keepalive = _keep;

        loop {
            tokio::select! {
                // Read from stream
                msg = stream.next() => {
                    match msg {
                        Some(Ok(bytes)) => {
                            if let Ok(parsed) = Message::parse_from_bytes(&bytes) {
                                match parsed.union {
                                    Some(message::Union::TerminalResponse(tr)) => match tr.union {
                                        Some(terminal_response::Union::Data(td)) => {
                                            let bytes = if td.compressed {
                                                hbb_common::compress::decompress(&td.data)
                                            } else {
                                                td.data.to_vec()
                                            };
                                            if output_tx.send(bytes).is_err() {
                                                log::info!("MCP: Output receiver dropped for {}", session_id);
                                                break;
                                            }
                                        }
                                        Some(terminal_response::Union::Opened(opened)) => {
                                            // Forward opened status as a special marker
                                            let marker = if opened.success {
                                                format!("__TERMINAL_OPENED__:{}", opened.terminal_id)
                                            } else {
                                                format!("__TERMINAL_OPEN_FAILED__:{}", opened.message)
                                            };
                                            let _ = output_tx.send(marker.into_bytes());
                                        }
                                        Some(terminal_response::Union::Closed(_)) => {
                                            log::info!("MCP: Terminal closed for {}", session_id);
                                            break;
                                        }
                                        Some(terminal_response::Union::Error(e)) => {
                                            log::error!("MCP: Terminal error for {}: {}", session_id, e.message);
                                            break;
                                        }
                                        _ => {}
                                    },
                                    _ => {} // ignore non-terminal messages
                                }
                            }
                        }
                        Some(Err(e)) => {
                            log::error!("MCP: Stream error for {}: {}", session_id, e);
                            break;
                        }
                        None => {
                            log::info!("MCP: Stream closed for {}", session_id);
                            break;
                        }
                    }
                }
                // Send commands to stream
                cmd = cmd_rx.recv() => {
                    match cmd {
                        Some(msg) => {
                            if let Err(e) = stream.send(&msg).await {
                                log::error!("MCP: Failed to send to stream {}: {}", session_id, e);
                                break;
                            }
                        }
                        None => {
                            log::info!("MCP: Command channel closed for {}", session_id);
                            break;
                        }
                    }
                }
                // Handle Data messages from the bridge (auth follow-ups etc.)
                d = data_receiver.recv() => {
                    match d {
                        Some(Data::Message(msg)) => {
                            allow_err!(stream.send(&msg).await);
                        }
                        None => {} // channel closed, that's fine
                        _ => {}
                    }
                }
            }
        }
        log::info!("MCP: Stream task exiting for {}", session_id);
    });

    (cmd_tx, output_rx)
}

/// Session manager for all active connections
#[derive(Clone)]
pub struct SessionManager {
    sessions: Arc<tokio::sync::Mutex<HashMap<String, TerminalSession>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        }
    }

    pub async fn add(&self, id: String, session: TerminalSession) {
        self.sessions.lock().await.insert(id, session);
    }

    pub async fn remove(&self, id: &str) -> Option<TerminalSession> {
        self.sessions.lock().await.remove(id)
    }

    pub async fn with_session<F, R>(&self, id: &str, f: F) -> Option<R>
    where
        F: FnOnce(&mut TerminalSession) -> R,
    {
        let mut sessions = self.sessions.lock().await;
        sessions.get_mut(id).map(f)
    }

    pub async fn cleanup_expired(&self, max_age: Duration) {
        let mut sessions = self.sessions.lock().await;
        let expired: Vec<String> = sessions
            .iter()
            .filter(|(_, s)| s.created_at.elapsed() > max_age)
            .map(|(k, _)| k.clone())
            .collect();
        for id in expired {
            log::info!("MCP: Cleaning up expired session {}", id);
            sessions.remove(&id);
        }
    }
}
