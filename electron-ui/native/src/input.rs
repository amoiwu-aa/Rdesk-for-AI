use uuid::Uuid;

use crate::session_manager;

/// Send a mouse event to the remote peer.
pub fn send_mouse(session_id: &Uuid, msg: &str) -> Result<(), String> {
    session_manager::session_send_mouse(session_id, msg)
}

/// Send a key input event to the remote peer.
pub fn input_key(
    session_id: &Uuid,
    name: &str,
    down: bool,
    press: bool,
    alt: bool,
    ctrl: bool,
    shift: bool,
    command: bool,
) -> Result<(), String> {
    session_manager::session_input_key(session_id, name, down, press, alt, ctrl, shift, command)
}

/// Send an input string (for text paste) to the remote peer.
pub fn input_string(session_id: &Uuid, value: &str) -> Result<(), String> {
    let session = session_manager::get_session(session_id)?;
    session.input_string(value);
    Ok(())
}
