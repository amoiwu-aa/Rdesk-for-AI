use hbb_common::{
    get_time,
    message_proto::{Message, VoiceCallRequest, VoiceCallResponse},
};
use scrap::CodecFormat;
use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct QualityStatus {
    pub speed: Option<String>,
    pub fps: HashMap<usize, i32>,
    pub decode_fps: Option<usize>,
    pub decoder_type: Option<String>,
    pub performance_mode: Option<String>,
    pub quality: Option<String>,
    pub requested_fps: Option<u32>,
    pub auto_adjust_fps: Option<u32>,
    pub fps_limit: Option<u32>,
    pub game_mode: Option<bool>,
    pub server_performance_mode: Option<String>,
    pub server_game_mode: Option<bool>,
    pub server_game_mode_reason: Option<String>,
    pub server_qos_fps: Option<u32>,
    pub server_max_delay: Option<u32>,
    pub server_response_delayed: Option<bool>,
    pub server_current_ratio: Option<f32>,
    pub server_target_ratio: Option<f32>,
    pub server_max_custom_fps: Option<u32>,
    pub server_abr: Option<bool>,
    pub delay: Option<i32>,
    pub target_bitrate: Option<i32>,
    pub codec_format: Option<CodecFormat>,
    pub chroma: Option<String>,
    pub connection_type: Option<String>,
}

#[inline]
pub fn new_voice_call_request(is_connect: bool) -> Message {
    let mut req = VoiceCallRequest::new();
    req.is_connect = is_connect;
    req.req_timestamp = get_time();
    let mut msg = Message::new();
    msg.set_voice_call_request(req);
    msg
}

#[inline]
pub fn new_voice_call_response(request_timestamp: i64, accepted: bool) -> Message {
    let mut resp = VoiceCallResponse::new();
    resp.accepted = accepted;
    resp.req_timestamp = request_timestamp;
    resp.ack_timestamp = get_time();
    let mut msg = Message::new();
    msg.set_voice_call_response(resp);
    msg
}
