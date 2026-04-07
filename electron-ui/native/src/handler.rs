use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use hbb_common::base64::Engine as _;
use hbb_common::message_proto::*;
use hbb_common::rendezvous_proto::ConnType;
use librustdesk::client::{LoginConfigHandler, QualityStatus};
use librustdesk::ui_session_interface::InvokeUiSession;

use crate::events::{EventEmitter, FrameNotify};
use crate::video::FrameBufferManager;

/// ElectronHandler implements InvokeUiSession for the Electron/napi-rs UI layer.
/// It replaces Flutter's FlutterHandler, using ThreadsafeFunction for event delivery
/// instead of StreamSink.
#[derive(Clone)]
pub struct ElectronHandler {
    pub emitter: EventEmitter,
    pub frame_buffers: Arc<FrameBufferManager>,
    pub peer_info: Arc<RwLock<PeerInfo>>,
}

impl Default for ElectronHandler {
    fn default() -> Self {
        Self {
            emitter: EventEmitter::default(),
            frame_buffers: Arc::new(FrameBufferManager::default()),
            peer_info: Arc::new(RwLock::new(PeerInfo::default())),
        }
    }
}

impl ElectronHandler {
    /// Push a JSON event to the JavaScript event callback.
    /// Format matches FlutterHandler: {"name": "event_name", "key1": "val1", ...}
    fn push_event(&self, name: &str, fields: &[(&str, &str)]) {
        let mut m = serde_json::Map::new();
        m.insert("name".to_string(), serde_json::json!(name));
        for &(k, v) in fields {
            m.insert(k.to_string(), serde_json::json!(v));
        }
        let json = serde_json::Value::Object(m).to_string();
        self.emitter.push_event(json);
    }

    fn make_displays_msg(displays: &[DisplayInfo]) -> String {
        let mut msg_vec = Vec::new();
        for d in displays.iter() {
            let mut h: HashMap<&str, i32> = Default::default();
            h.insert("x", d.x);
            h.insert("y", d.y);
            h.insert("width", d.width);
            h.insert("height", d.height);
            h.insert(
                "cursor_embedded",
                if d.cursor_embedded { 1 } else { 0 },
            );
            msg_vec.push(h);
        }
        serde_json::to_string(&msg_vec).unwrap_or_default()
    }
}

impl InvokeUiSession for ElectronHandler {
    fn set_cursor_data(&self, cd: CursorData) {
        let mut fields = vec![
            ("id".to_string(), cd.id.to_string()),
            ("hotx".to_string(), cd.hotx.to_string()),
            ("hoty".to_string(), cd.hoty.to_string()),
            ("width".to_string(), cd.width.to_string()),
            ("height".to_string(), cd.height.to_string()),
        ];
        // Encode cursor pixels as base64 for JS side
        let colors_b64 = hbb_common::base64::engine::general_purpose::STANDARD
            .encode(&cd.colors);
        fields.push(("colors".to_string(), colors_b64));

        let field_refs: Vec<(&str, &str)> = fields.iter().map(|(k, v)| (k.as_str(), v.as_str())).collect();
        self.push_event("cursor_data", &field_refs);
    }

    fn set_cursor_id(&self, id: String) {
        self.push_event("cursor_id", &[("id", &id)]);
    }

    fn set_cursor_position(&self, cp: CursorPosition) {
        self.push_event(
            "cursor_position",
            &[("x", &cp.x.to_string()), ("y", &cp.y.to_string())],
        );
    }

    fn set_display(&self, x: i32, y: i32, w: i32, h: i32, cursor_embedded: bool, _scale: f64) {
        self.push_event(
            "display",
            &[
                ("x", &x.to_string()),
                ("y", &y.to_string()),
                ("width", &w.to_string()),
                ("height", &h.to_string()),
                (
                    "cursor_embedded",
                    if cursor_embedded { "1" } else { "0" },
                ),
            ],
        );
    }

    fn switch_display(&self, display: &SwitchDisplay) {
        self.push_event(
            "switch_display",
            &[
                ("display", &display.display.to_string()),
                ("x", &display.x.to_string()),
                ("y", &display.y.to_string()),
                ("width", &display.width.to_string()),
                ("height", &display.height.to_string()),
                (
                    "cursor_embedded",
                    if display.cursor_embedded { "1" } else { "0" },
                ),
            ],
        );
    }

    fn set_peer_info(&self, pi: &PeerInfo) {
        let displays = Self::make_displays_msg(&pi.displays);
        let mut features: HashMap<&str, bool> = Default::default();
        for f in pi.features.iter() {
            features.insert("privacy_mode", f.privacy_mode);
        }
        let features = serde_json::to_string(&features).unwrap_or_default();

        *self.peer_info.write().unwrap() = pi.clone();
        self.push_event(
            "peer_info",
            &[
                ("username", &pi.username),
                ("hostname", &pi.hostname),
                ("platform", &pi.platform),
                ("sas_enabled", &pi.sas_enabled.to_string()),
                ("displays", &displays),
                ("version", &pi.version),
                ("features", &features),
                ("current_display", &pi.current_display.to_string()),
                ("platform_additions", &pi.platform_additions),
            ],
        );
    }

    fn set_displays(&self, displays: &Vec<DisplayInfo>) {
        self.peer_info.write().unwrap().displays = displays.clone();
        self.push_event(
            "sync_peer_info",
            &[("displays", &Self::make_displays_msg(displays))],
        );
    }

    fn set_platform_additions(&self, data: &str) {
        self.push_event("sync_platform_additions", &[("platform_additions", data)]);
    }

    fn on_connected(&self, _conn_type: ConnType) {}

    fn update_privacy_mode(&self) {
        self.push_event("update_privacy_mode", &[]);
    }

    fn set_permission(&self, name: &str, value: bool) {
        self.push_event("permission", &[(name, &value.to_string())]);
    }

    fn close_success(&self) {}

    fn update_quality_status(&self, status: QualityStatus) {
        let null_s = String::new();
        self.push_event(
            "update_quality_status",
            &[
                ("speed", status.speed.as_deref().unwrap_or("")),
                (
                    "fps",
                    &serde_json::to_string(&status.fps).unwrap_or_default(),
                ),
                (
                    "decode_fps",
                    &status.decode_fps.map_or(null_s.clone(), |it| it.to_string()),
                ),
                (
                    "decoder_type",
                    &status.decoder_type.as_deref().unwrap_or(""),
                ),
                (
                    "delay",
                    &status.delay.map_or(null_s.clone(), |it| it.to_string()),
                ),
                (
                    "target_bitrate",
                    &status.target_bitrate.map_or(null_s.clone(), |it| it.to_string()),
                ),
                (
                    "codec_format",
                    &status.codec_format.map_or(null_s.clone(), |it| it.to_string()),
                ),
                (
                    "chroma",
                    &status.chroma.as_deref().unwrap_or(""),
                ),
                (
                    "connection_type",
                    &status.connection_type.as_deref().unwrap_or(""),
                ),
            ],
        );
    }

    fn set_connection_type(&self, is_secured: bool, direct: bool, stream_type: &str) {
        self.push_event(
            "connection_ready",
            &[
                ("secure", &is_secured.to_string()),
                ("direct", &direct.to_string()),
                ("stream_type", stream_type),
            ],
        );
    }

    fn set_fingerprint(&self, fingerprint: String) {
        self.push_event("fingerprint", &[("fingerprint", &fingerprint)]);
    }

    fn job_error(&self, id: i32, err: String, file_num: i32) {
        self.push_event(
            "job_error",
            &[
                ("id", &id.to_string()),
                ("err", &err),
                ("file_num", &file_num.to_string()),
            ],
        );
    }

    fn job_done(&self, id: i32, file_num: i32) {
        self.push_event(
            "job_done",
            &[("id", &id.to_string()), ("file_num", &file_num.to_string())],
        );
    }

    fn clear_all_jobs(&self) {}

    fn new_message(&self, msg: String) {
        self.push_event("chat_client_mode", &[("text", &msg)]);
    }

    fn update_transfer_list(&self) {}

    fn load_last_job(&self, _cnt: i32, job_json: &str, _auto_start: bool) {
        self.push_event("load_last_job", &[("value", job_json)]);
    }

    fn update_folder_files(
        &self,
        id: i32,
        entries: &Vec<FileEntry>,
        path: String,
        _is_local: bool,
        only_count: bool,
    ) {
        if only_count {
            self.push_event(
                "update_folder_files",
                &[("info", &format!("{{\"id\":{},\"num_entries\":{}}}", id, entries.len()))],
            );
        } else {
            self.push_event(
                "file_dir",
                &[
                    ("is_local", "false"),
                    ("value", &librustdesk::common::make_fd_to_json(id, path, entries)),
                ],
            );
        }
    }

    fn confirm_delete_files(&self, _id: i32, _i: i32, _name: String) {}

    fn override_file_confirm(
        &self,
        id: i32,
        file_num: i32,
        to: String,
        is_upload: bool,
        is_identical: bool,
    ) {
        self.push_event(
            "override_file_confirm",
            &[
                ("id", &id.to_string()),
                ("file_num", &file_num.to_string()),
                ("read_path", &to),
                ("is_upload", &is_upload.to_string()),
                ("is_identical", &is_identical.to_string()),
            ],
        );
    }

    fn update_block_input_state(&self, on: bool) {
        self.push_event(
            "update_block_input_state",
            &[("input_state", if on { "on" } else { "off" })],
        );
    }

    fn job_progress(&self, id: i32, file_num: i32, speed: f64, finished_size: f64) {
        self.push_event(
            "job_progress",
            &[
                ("id", &id.to_string()),
                ("file_num", &file_num.to_string()),
                ("speed", &speed.to_string()),
                ("finished_size", &finished_size.to_string()),
            ],
        );
    }

    fn adapt_size(&self) {}

    #[inline]
    fn on_rgba(&self, display: usize, rgba: &mut scrap::ImageRgb) {
        if let Some((w, h)) = self.frame_buffers.store_frame(display, rgba) {
            self.emitter.notify_frame(FrameNotify {
                display,
                width: w,
                height: h,
            });
        }
    }

    fn msgbox(&self, msgtype: &str, title: &str, text: &str, link: &str, retry: bool) {
        let has_retry = if retry { "true" } else { "" };
        self.push_event(
            "msgbox",
            &[
                ("type", msgtype),
                ("title", title),
                ("text", text),
                ("link", link),
                ("hasRetry", has_retry),
            ],
        );
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    fn clipboard(&self, content: String) {
        self.push_event("clipboard", &[("content", &content)]);
    }

    fn cancel_msgbox(&self, tag: &str) {
        self.push_event("cancel_msgbox", &[("tag", tag)]);
    }

    fn switch_back(&self, peer_id: &str) {
        self.push_event("switch_back", &[("peer_id", peer_id)]);
    }

    fn portable_service_running(&self, running: bool) {
        self.push_event(
            "portable_service_running",
            &[("running", &running.to_string())],
        );
    }

    fn on_voice_call_started(&self) {
        self.push_event("on_voice_call_started", &[]);
    }

    fn on_voice_call_closed(&self, reason: &str) {
        self.push_event("on_voice_call_closed", &[("reason", reason)]);
    }

    fn on_voice_call_waiting(&self) {
        self.push_event("on_voice_call_waiting", &[]);
    }

    fn on_voice_call_incoming(&self) {
        self.push_event("on_voice_call_incoming", &[]);
    }

    #[inline]
    fn get_rgba(&self, display: usize) -> *const u8 {
        let displays = self.frame_buffers.displays.read().unwrap();
        if let Some(rgba_data) = displays.get(&display) {
            if rgba_data.dirty {
                return rgba_data.data.as_ptr();
            }
        }
        std::ptr::null()
    }

    #[inline]
    fn next_rgba(&self, display: usize) {
        self.frame_buffers.consume_frame(display);
    }

    #[cfg(all(feature = "vram", feature = "flutter"))]
    fn on_texture(&self, _display: usize, _texture: *mut std::ffi::c_void) {
        // Not applicable for Electron - we use soft render only
    }

    fn set_multiple_windows_session(&self, sessions: Vec<WindowsSession>) {
        let mut msg_vec = Vec::new();
        for d in sessions {
            let mut h: HashMap<&str, String> = Default::default();
            h.insert("sid", d.sid.to_string());
            h.insert("name", d.name);
            msg_vec.push(h);
        }
        self.push_event(
            "set_multiple_windows_session",
            &[(
                "windows_sessions",
                &serde_json::to_string(&msg_vec).unwrap_or_default(),
            )],
        );
    }

    fn set_current_display(&self, disp_idx: i32) {
        self.push_event(
            "follow_current_display",
            &[("display_idx", &disp_idx.to_string())],
        );
    }

    #[cfg(feature = "flutter")]
    fn is_multi_ui_session(&self) -> bool {
        false
    }

    fn update_record_status(&self, start: bool) {
        self.push_event("record_status", &[("start", &start.to_string())]);
    }

    fn update_empty_dirs(&self, _res: ReadEmptyDirsResponse) {}

    fn printer_request(&self, id: i32, path: String) {
        self.push_event(
            "printer_request",
            &[("id", &id.to_string()), ("path", &path)],
        );
    }

    fn handle_screenshot_resp(&self, _sid: String, msg: String) {
        self.push_event("screenshot", &[("msg", &msg)]);
    }

    fn handle_terminal_response(&self, response: TerminalResponse) {
        use hbb_common::message_proto::terminal_response::Union;

        match response.union {
            Some(Union::Opened(opened)) => {
                let json = serde_json::json!({
                    "name": "terminal_response",
                    "type": "opened",
                    "terminal_id": opened.terminal_id,
                    "success": opened.success,
                    "message": opened.message,
                });
                self.emitter.push_event(json.to_string());
            }
            Some(Union::Data(data)) => {
                let output = if data.compressed {
                    hbb_common::compress::decompress(&data.data)
                } else {
                    data.data.to_vec()
                };
                let encoded = hbb_common::base64::engine::general_purpose::STANDARD
                    .encode(&output);
                let json = serde_json::json!({
                    "name": "terminal_response",
                    "type": "data",
                    "terminal_id": data.terminal_id,
                    "data": encoded,
                });
                self.emitter.push_event(json.to_string());
            }
            Some(Union::Closed(closed)) => {
                let json = serde_json::json!({
                    "name": "terminal_response",
                    "type": "closed",
                    "terminal_id": closed.terminal_id,
                    "exit_code": closed.exit_code,
                });
                self.emitter.push_event(json.to_string());
            }
            Some(Union::Error(error)) => {
                let json = serde_json::json!({
                    "name": "terminal_response",
                    "type": "error",
                    "terminal_id": error.terminal_id,
                    "message": error.message,
                });
                self.emitter.push_event(json.to_string());
            }
            _ => {}
        }
    }
}
