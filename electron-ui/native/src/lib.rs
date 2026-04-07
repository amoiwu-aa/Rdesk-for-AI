#[macro_use]
extern crate napi_derive;

mod config_bridge;
mod events;
mod handler;
mod input;
mod session_manager;
mod video;

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ErrorStrategy, ThreadsafeFunction};
use librustdesk::client::{Interface, FileManager};

// ─── Initialization ─────────────────────────────────────────

/// Initialize the RustDesk core. Must be called before any other function.
#[napi]
pub fn initialize(app_dir: String) -> Result<()> {
    // Initialize logging
    hbb_common::init_log(false, "electron");

    // Initialize global state (config, etc.)
    librustdesk::common::global_init();

    Ok(())
}

// ─── Session Lifecycle ──────────────────────────────────────

/// Create a new remote desktop session.
#[napi]
pub fn session_create(
    session_id: String,
    peer_id: String,
    password: Option<String>,
    is_file_transfer: Option<bool>,
    is_port_forward: Option<bool>,
    is_rdp: Option<bool>,
    is_terminal: Option<bool>,
    force_relay: Option<bool>,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;

    session_manager::session_create(
        uuid,
        &peer_id,
        is_file_transfer.unwrap_or(false),
        is_port_forward.unwrap_or(false),
        is_rdp.unwrap_or(false),
        is_terminal.unwrap_or(false),
        force_relay.unwrap_or(false),
        password.unwrap_or_default(),
    )
    .map_err(|e| Error::from_reason(e))?;

    Ok(())
}

/// Start a session. Begins the connection IO loop.
/// `event_callback` receives JSON event strings from Rust.
/// `frame_callback` receives JSON frame notifications when a new frame is ready.
#[napi(ts_args_type = "sessionId: string, eventCallback: (event: string) => void, frameCallback: (notification: string) => void")]
pub fn session_start(
    session_id: String,
    event_callback: JsFunction,
    frame_callback: JsFunction,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;

    // Create threadsafe functions from JS callbacks
    let event_tsfn: ThreadsafeFunction<String, ErrorStrategy::Fatal> = event_callback
        .create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;
    let frame_tsfn: ThreadsafeFunction<String, ErrorStrategy::Fatal> = frame_callback
        .create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

    // Set callbacks on the session's handler
    let handler = session_manager::get_handler(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    handler.emitter.set_event_callback(event_tsfn);
    handler.emitter.set_frame_callback(frame_tsfn);

    // Start the IO loop
    session_manager::session_start(&uuid)
        .map_err(|e| Error::from_reason(e))?;

    Ok(())
}

/// Send login credentials for a session
#[napi]
pub fn session_login(
    session_id: String,
    os_username: String,
    os_password: String,
    password: String,
    remember: bool,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    session_manager::session_login(&uuid, os_username, os_password, password, remember)
        .map_err(|e| Error::from_reason(e))
}

/// Close a session
#[napi]
pub fn session_close(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    session_manager::session_close(&uuid)
        .map_err(|e| Error::from_reason(e))
}

/// Reconnect a session
#[napi]
pub fn session_reconnect(session_id: String, force_relay: Option<bool>) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    session_manager::session_reconnect(&uuid, force_relay.unwrap_or(false))
        .map_err(|e| Error::from_reason(e))
}

// ─── Video Frame Access ─────────────────────────────────────

/// Get the current video frame as a raw BGRA buffer and consume it atomically.
/// Returns null if no frame is available.
/// The BGRA→RGBA swizzle is done in the WebGL fragment shader (zero-cost GPU op).
/// This combines get + consume into one call to avoid an extra IPC round-trip.
#[napi]
pub fn get_frame_rgba(session_id: String, display: u32) -> Result<Option<Buffer>> {
    let uuid = parse_uuid(&session_id)?;
    let handler = session_manager::get_handler(&uuid)
        .map_err(|e| Error::from_reason(e))?;

    match handler.frame_buffers.take_frame(display as usize) {
        Some((data, _w, _h)) => Ok(Some(Buffer::from(data))),
        None => Ok(None),
    }
}

/// Mark the current frame as consumed, allowing Rust to write the next frame.
/// NOTE: With the new take_frame(), calling get_frame_rgba already consumes.
/// This is kept for backward compatibility but is now a no-op.
#[napi]
pub fn consume_frame(session_id: String, display: u32) -> Result<()> {
    // take_frame already marks as consumed, so this is a no-op now
    Ok(())
}


// ─── Input ──────────────────────────────────────────────────

/// Send a mouse event to the remote peer.
/// `msg` is a JSON string: {"type":"move","x":"100","y":"200","buttons":"left",...}
#[napi]
pub fn session_send_mouse(session_id: String, msg: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    input::send_mouse(&uuid, &msg)
        .map_err(|e| Error::from_reason(e))
}

/// Send a key input event to the remote peer.
#[napi]
pub fn session_input_key(
    session_id: String,
    name: String,
    down: bool,
    press: bool,
    alt: bool,
    ctrl: bool,
    shift: bool,
    command: bool,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    input::input_key(&uuid, &name, down, press, alt, ctrl, shift, command)
        .map_err(|e| Error::from_reason(e))
}

/// Send a text string to the remote peer (for paste operations).
#[napi]
pub fn session_input_string(session_id: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    input::input_string(&uuid, &value)
        .map_err(|e| Error::from_reason(e))
}

// ─── Config & Status ────────────────────────────────────────

/// Get this device's RustDesk ID
#[napi]
pub fn main_get_id() -> String {
    config_bridge::get_id()
}

/// Get an option value
#[napi]
pub fn main_get_option(key: String) -> String {
    config_bridge::get_option(&key)
}

/// Set an option value
#[napi]
pub fn main_set_option(key: String, value: String) -> Result<()> {
    config_bridge::set_option(&key, &value);
    Ok(())
}

/// Get a local option value
#[napi]
pub fn main_get_local_option(key: String) -> String {
    config_bridge::get_local_option(&key)
}

/// Set a local option value
#[napi]
pub fn main_set_local_option(key: String, value: String) -> Result<()> {
    config_bridge::set_local_option(&key, &value);
    Ok(())
}

/// Get RustDesk version
#[napi]
pub fn main_get_version() -> String {
    config_bridge::get_version()
}

/// Get peer config as JSON
#[napi]
pub fn main_get_peer(id: String) -> String {
    config_bridge::get_peer(&id)
}

/// Check if a peer has a saved password
#[napi]
pub fn main_peer_has_password(id: String) -> bool {
    config_bridge::peer_has_password(&id)
}

/// Get LAN peers as JSON
#[napi]
pub fn main_get_lan_peers() -> String {
    config_bridge::get_lan_peers()
}

/// Trigger LAN peer discovery
#[napi]
pub fn main_discover() -> Result<()> {
    config_bridge::discover();
    Ok(())
}

/// Get all options as JSON
#[napi]
pub fn main_get_options() -> String {
    config_bridge::get_options()
}

/// Set multiple options from JSON string
#[napi]
pub fn main_set_options(json: String) -> Result<()> {
    config_bridge::set_options(&json);
    Ok(())
}

// ─── Chat ────────────────────────────────────────────────────

/// Send a chat message to the remote peer
#[napi]
pub fn session_send_chat(session_id: String, text: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.send_chat(text);
    Ok(())
}

// ─── Clipboard ───────────────────────────────────────────────

/// Update the clipboard on the remote peer
#[napi]
pub fn session_set_clipboard(session_id: String, text: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    // Send clipboard data using Data::Message with Clipboard protobuf
    let mut clipboard = hbb_common::message_proto::Clipboard::new();
    clipboard.content = bytes::Bytes::from(text.into_bytes());
    let mut msg = hbb_common::message_proto::Message::new();
    msg.set_clipboard(clipboard);
    session.send(librustdesk::client::Data::Message(msg));
    Ok(())
}

// ─── File Transfer ───────────────────────────────────────────

/// Read a remote directory
#[napi]
pub fn session_read_remote_dir(session_id: String, path: String, include_hidden: bool) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.read_remote_dir(path, include_hidden);
    Ok(())
}

/// Send files between local and remote
#[napi]
pub fn session_send_files(
    session_id: String,
    act_id: i32,
    path: String,
    to: String,
    file_num: i32,
    include_hidden: bool,
    is_remote: bool,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    // type 0 = default file transfer
    session.send_files(act_id, 0, path, to, file_num, include_hidden, is_remote);
    Ok(())
}

/// Cancel a file transfer job
#[napi]
pub fn session_cancel_job(session_id: String, act_id: i32) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.cancel_job(act_id);
    Ok(())
}

/// Remove a file on remote
#[napi]
pub fn session_remove_file(
    session_id: String,
    act_id: i32,
    path: String,
    file_num: i32,
    is_remote: bool,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.remove_file(act_id, path, file_num, is_remote);
    Ok(())
}

/// Create a directory on remote
#[napi]
pub fn session_create_dir(session_id: String, act_id: i32, path: String, is_remote: bool) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.create_dir(act_id, path, is_remote);
    Ok(())
}

// ─── Session Display Options ────────────────────────────────

/// Toggle a session option
#[napi]
pub fn session_toggle_option(session_id: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.toggle_option(value);
    Ok(())
}

/// Get a session toggle option value
#[napi]
pub fn session_get_toggle_option(session_id: String, arg: String) -> Result<bool> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    Ok(session.get_toggle_option(arg))
}

/// Refresh the remote screen
#[napi]
pub fn session_refresh(session_id: String, display: i32) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.refresh_video(display);
    Ok(())
}

/// Lock remote screen
#[napi]
pub fn session_lock_screen(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.lock_screen();
    Ok(())
}

/// Send Ctrl+Alt+Del to remote
#[napi]
pub fn session_ctrl_alt_del(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.ctrl_alt_del();
    Ok(())
}

// ─── Display Management ─────────────────────────────────────

/// Switch to a specific display on the remote peer
#[napi]
pub fn session_switch_display(session_id: String, display: i32) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.switch_display(display);
    Ok(())
}

/// Capture multiple displays (for "all displays" mode)
#[napi]
pub fn session_capture_displays(
    session_id: String,
    add: Vec<i32>,
    sub: Vec<i32>,
    set: Vec<i32>,
) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.capture_displays(add, sub, set);
    Ok(())
}

/// Restart the remote device
#[napi]
pub fn session_restart_remote_device(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.restart_remote_device();
    Ok(())
}

/// Start or stop screen recording
#[napi]
pub fn session_record_screen(session_id: String, start: bool) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.record_screen(start);
    Ok(())
}

/// Take a screenshot of the remote display
#[napi]
pub fn session_take_screenshot(session_id: String, display: i32) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.take_screenshot(display, session_id.clone());
    Ok(())
}

/// Toggle privacy mode on the remote device
#[napi]
pub fn session_toggle_privacy_mode(session_id: String, impl_key: String, on: bool) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.toggle_privacy_mode(impl_key, on);
    Ok(())
}

/// Request direct elevation (run as administrator) on the remote device
#[napi]
pub fn session_elevate_direct(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.elevate_direct();
    Ok(())
}

/// Elevate with logon credentials on the remote device
#[napi]
pub fn session_elevate_with_logon(session_id: String, username: String, password: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.elevate_with_logon(username, password);
    Ok(())
}

/// Get the current keyboard mode for a session
#[napi]
pub fn session_get_keyboard_mode(session_id: String) -> Result<String> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    Ok(session.get_keyboard_mode())
}

/// Save keyboard mode for a session
#[napi]
pub fn session_save_keyboard_mode(session_id: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.save_keyboard_mode(value);
    Ok(())
}

/// Get the view style for a session
#[napi]
pub fn session_get_view_style(session_id: String) -> Result<String> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    Ok(session.get_view_style())
}

/// Save the view style for a session
#[napi]
pub fn session_save_view_style(session_id: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.save_view_style(value);
    Ok(())
}

// ─── Display Quality & Codec ─────────────────────────────────

/// Set image quality preset: "best", "balanced", "low", "custom"
#[napi]
pub fn session_save_image_quality(session_id: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.save_image_quality(value);
    Ok(())
}

/// Set custom FPS
#[napi]
pub fn session_set_custom_fps(session_id: String, fps: i32) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.set_custom_fps(fps);
    Ok(())
}

/// Set a peer session option (e.g. "codec-preference" = "vp9")
#[napi]
pub fn session_set_option(session_id: String, key: String, value: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.set_option(key, value);
    Ok(())
}

/// Get a peer session option value
#[napi]
pub fn session_get_option(session_id: String, key: String) -> Result<String> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    Ok(session.get_option(key))
}

/// Notify the server that codec preference has changed.
/// Must be called after session_set_option("codec-preference", ...) to take effect.
#[napi]
pub fn session_change_prefer_codec(session_id: String) -> Result<()> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    session.update_supported_decodings();
    Ok(())
}

/// Get supported alternative codecs as JSON: {"vp8":bool,"av1":bool,"h264":bool,"h265":bool}
#[napi]
pub fn session_alternative_codecs(session_id: String) -> Result<String> {
    let uuid = parse_uuid(&session_id)?;
    let session = session_manager::get_session(&uuid)
        .map_err(|e| Error::from_reason(e))?;
    let (vp8, av1, h264, h265) = session.alternative_codecs();
    Ok(serde_json::json!({
        "vp8": vp8,
        "av1": av1,
        "h264": h264,
        "h265": h265
    }).to_string())
}

// ─── Helpers ────────────────────────────────────────────────

fn parse_uuid(s: &str) -> Result<uuid::Uuid> {
    uuid::Uuid::parse_str(s).map_err(|e| Error::from_reason(format!("Invalid UUID: {}", e)))
}
