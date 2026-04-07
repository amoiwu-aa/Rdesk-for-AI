use std::collections::HashMap;
use std::sync::{atomic::AtomicUsize, Arc, RwLock};

use hbb_common::rendezvous_proto::ConnType;
use librustdesk::client::Interface;
use librustdesk::ui_session_interface::{io_loop, Session};
use uuid::Uuid;

use crate::handler::ElectronHandler;

pub type ElectronSession = Session<ElectronHandler>;

lazy_static::lazy_static! {
    /// Global session map: session_id -> session
    static ref SESSIONS: RwLock<HashMap<Uuid, Arc<ElectronSession>>> =
        RwLock::new(HashMap::new());
}

/// Create a new session for connecting to a peer.
/// Reimplements the logic from flutter.rs session_add() without flutter_rust_bridge.
pub fn session_create(
    session_id: Uuid,
    peer_id: &str,
    is_file_transfer: bool,
    is_port_forward: bool,
    is_rdp: bool,
    is_terminal: bool,
    force_relay: bool,
    password: String,
) -> Result<Arc<ElectronSession>, String> {
    // Determine connection type
    let conn_type = if is_file_transfer {
        ConnType::FILE_TRANSFER
    } else if is_terminal {
        ConnType::TERMINAL
    } else if is_port_forward {
        if is_rdp {
            ConnType::RDP
        } else {
            ConnType::PORT_FORWARD
        }
    } else {
        ConnType::DEFAULT_CONN
    };

    // Check for duplicate session
    if SESSIONS.read().unwrap().contains_key(&session_id) {
        return Err("Session already exists".to_string());
    }

    // Set last remote ID
    hbb_common::config::LocalConfig::set_remote_id(peer_id);

    // Create session with ElectronHandler
    let session: ElectronSession = Session {
        password,
        server_keyboard_enabled: Arc::new(RwLock::new(true)),
        server_file_transfer_enabled: Arc::new(RwLock::new(true)),
        server_clipboard_enabled: Arc::new(RwLock::new(true)),
        reconnect_count: Arc::new(AtomicUsize::new(0)),
        ..Default::default()
    };

    // Initialize the login config handler
    session.lc.write().unwrap().initialize(
        peer_id.to_owned(),
        conn_type,
        None,        // switch_uuid
        force_relay,
        None,        // adapter_luid (no GPU texture for Electron)
        None,        // shared_password
        None,        // conn_token
    );

    let session = Arc::new(session);
    SESSIONS
        .write()
        .unwrap()
        .insert(session_id, session.clone());

    Ok(session)
}

/// Start a session's IO loop in a new thread.
pub fn session_start(session_id: &Uuid) -> Result<(), String> {
    let session = SESSIONS
        .read()
        .unwrap()
        .get(session_id)
        .cloned()
        .ok_or_else(|| format!("Session {} not found", session_id))?;

    // Clone the session for the spawned thread
    let session_clone = (*session).clone();
    std::thread::spawn(move || {
        let round = session_clone
            .connection_round_state
            .lock()
            .unwrap()
            .new_round();
        // This runs the async io_loop with its own Tokio runtime
        io_loop(session_clone, round);
    });

    Ok(())
}

/// Send login credentials for a session
pub fn session_login(
    session_id: &Uuid,
    os_username: String,
    os_password: String,
    password: String,
    remember: bool,
) -> Result<(), String> {
    let session = get_session(session_id)?;
    // Use the Interface trait's send method
    session.send(librustdesk::client::Data::Login((
        os_username,
        os_password,
        password,
        remember,
    )));
    Ok(())
}

/// Close and remove a session
pub fn session_close(session_id: &Uuid) -> Result<(), String> {
    if let Some(session) = SESSIONS.write().unwrap().remove(session_id) {
        session.send(librustdesk::client::Data::Close);
        // Clear callbacks to prevent further notifications
        session.ui_handler.emitter.clear_callbacks();
    }
    Ok(())
}

/// Reconnect a session
pub fn session_reconnect(session_id: &Uuid, force_relay: bool) -> Result<(), String> {
    let session = get_session(session_id)?;
    if force_relay {
        session.lc.write().unwrap().force_relay = true;
    }
    // Close existing connection and start new one
    session.send(librustdesk::client::Data::Close);

    let session_clone = (*session).clone();
    std::thread::spawn(move || {
        let round = session_clone
            .connection_round_state
            .lock()
            .unwrap()
            .new_round();
        io_loop(session_clone, round);
    });

    Ok(())
}

/// Send mouse event using the session's built-in method.
/// Accepts JSON with numeric mask/x/y and boolean modifiers.
pub fn session_send_mouse(session_id: &Uuid, msg: &str) -> Result<(), String> {
    let session = get_session(session_id)?;
    if let Ok(m) = serde_json::from_str::<serde_json::Value>(msg) {
        let alt = m.get("alt").and_then(|v| v.as_bool()).unwrap_or(false);
        let ctrl = m.get("ctrl").and_then(|v| v.as_bool()).unwrap_or(false);
        let shift = m.get("shift").and_then(|v| v.as_bool()).unwrap_or(false);
        let command = m.get("command").and_then(|v| v.as_bool()).unwrap_or(false);
        let x = m.get("x").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        let y = m.get("y").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
        let mask = m.get("mask").and_then(|v| v.as_i64()).unwrap_or(0) as i32;

        session.send_mouse(mask, x, y, alt, ctrl, shift, command);
    }
    Ok(())
}

/// Send a key input event to the remote peer
pub fn session_input_key(
    session_id: &Uuid,
    name: &str,
    down: bool,
    press: bool,
    alt: bool,
    ctrl: bool,
    shift: bool,
    command: bool,
) -> Result<(), String> {
    let session = get_session(session_id)?;
    session.input_key(name, down, press, alt, ctrl, shift, command);
    Ok(())
}

/// Get a reference to a session by ID
pub fn get_session(session_id: &Uuid) -> Result<Arc<ElectronSession>, String> {
    SESSIONS
        .read()
        .unwrap()
        .get(session_id)
        .cloned()
        .ok_or_else(|| format!("Session {} not found", session_id))
}

/// Get the ElectronHandler for a session
pub fn get_handler(session_id: &Uuid) -> Result<ElectronHandler, String> {
    let session = get_session(session_id)?;
    Ok(session.ui_handler.clone())
}
