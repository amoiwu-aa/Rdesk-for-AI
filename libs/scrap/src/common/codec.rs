use std::{
    collections::HashMap,
    ops::{Deref, DerefMut},
    sync::{Arc, Mutex},
    time::Instant,
};

#[cfg(feature = "hwcodec")]
use crate::hwcodec::*;
#[cfg(feature = "mediacodec")]
use crate::mediacodec::{MediaCodecDecoder, H264_DECODER_SUPPORT, H265_DECODER_SUPPORT};
#[cfg(feature = "vram")]
use crate::vram::*;
use crate::scc::{SccEncoder, SccEncoderConfig, SccDecoder};
use crate::{CodecFormat, EncodeInput, EncodeYuvFormat, ImageRgb, ImageTexture};

#[cfg(any(
    feature = "hwcodec",
    feature = "mediacodec",
    feature = "vram",
    target_os = "windows"
))]
use hbb_common::config::option2bool;
use hbb_common::{
    anyhow::anyhow,
    config::{Config, PeerConfig},
    lazy_static, log,
    message_proto::{
        supported_decoding::PreferCodec, video_frame, Chroma, EncodedVideoFrames,
        SupportedDecoding, SupportedEncoding, VideoFrame,
    },
    sysinfo::System,
    ResultType,
};

lazy_static::lazy_static! {
    static ref PEER_DECODINGS: Arc<Mutex<HashMap<i32, SupportedDecoding>>> = Default::default();
    static ref ENCODE_CODEC_FORMAT: Arc<Mutex<CodecFormat>> = Arc::new(Mutex::new(CodecFormat::H264));
    static ref THREAD_LOG_TIME: Arc<Mutex<Option<Instant>>> = Arc::new(Mutex::new(None));
    static ref USABLE_ENCODING: Arc<Mutex<Option<SupportedEncoding>>> = Arc::new(Mutex::new(None));
}

pub const ENCODE_NEED_SWITCH: &'static str = "ENCODE_NEED_SWITCH";

#[derive(Debug, Clone)]
pub enum EncoderCfg {
    #[cfg(feature = "hwcodec")]
    HWRAM(HwRamEncoderConfig),
    #[cfg(feature = "vram")]
    VRAM(VRamEncoderConfig),
    SCC(SccEncoderConfig),
}

pub trait EncoderApi {
    fn new(cfg: EncoderCfg, i444: bool) -> ResultType<Self>
    where
        Self: Sized;

    fn encode_to_message(&mut self, frame: EncodeInput, ms: i64) -> ResultType<VideoFrame>;

    fn yuvfmt(&self) -> &EncodeYuvFormat;

    #[cfg(feature = "vram")]
    fn input_texture(&self) -> bool;

    fn set_quality(&mut self, ratio: f32) -> ResultType<()>;

    fn bitrate(&self) -> u32;

    fn support_changing_quality(&self) -> bool;

    fn latency_free(&self) -> bool;

    fn is_hardware(&self) -> bool;

    fn disable(&self);
}

pub struct Encoder {
    pub codec: Box<dyn EncoderApi>,
}

impl Deref for Encoder {
    type Target = Box<dyn EncoderApi>;

    fn deref(&self) -> &Self::Target {
        &self.codec
    }
}

impl DerefMut for Encoder {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.codec
    }
}

pub struct Decoder {
    #[cfg(feature = "hwcodec")]
    h264_ram: Option<HwRamDecoder>,
    #[cfg(feature = "hwcodec")]
    h265_ram: Option<HwRamDecoder>,
    #[cfg(feature = "vram")]
    h264_vram: Option<VRamDecoder>,
    #[cfg(feature = "vram")]
    h265_vram: Option<VRamDecoder>,
    #[cfg(feature = "mediacodec")]
    h264_media_codec: MediaCodecDecoder,
    #[cfg(feature = "mediacodec")]
    h265_media_codec: MediaCodecDecoder,
    scc: Option<SccDecoder>,
    format: CodecFormat,
    valid: bool,
    #[cfg(feature = "hwcodec")]
    i420: Vec<u8>,
}

#[derive(Debug, Clone)]
pub enum EncodingUpdate {
    Update(i32, SupportedDecoding),
    Remove(i32),
    Check,
}

impl Encoder {
    pub fn new(config: EncoderCfg, i444: bool) -> ResultType<Encoder> {
        log::info!("new encoder: {config:?}, i444: {i444}");
        match config {
            #[cfg(feature = "hwcodec")]
            EncoderCfg::HWRAM(_) => match HwRamEncoder::new(config, i444) {
                Ok(hw) => Ok(Encoder {
                    codec: Box::new(hw),
                }),
                Err(e) => {
                    log::error!("new hw encoder failed: {e:?}");
                    Err(e)
                }
            },
            #[cfg(feature = "vram")]
            EncoderCfg::VRAM(_) => match VRamEncoder::new(config, i444) {
                Ok(tex) => Ok(Encoder {
                    codec: Box::new(tex),
                }),
                Err(e) => {
                    log::error!("new vram encoder failed: {e:?}");
                    Err(e)
                }
            },
            EncoderCfg::SCC(_) => match SccEncoder::new(config, i444) {
                Ok(scc) => Ok(Encoder {
                    codec: Box::new(scc),
                }),
                Err(e) => {
                    log::error!("new SCC encoder failed: {e:?}");
                    Err(e)
                }
            },
        }
    }

    pub fn update(update: EncodingUpdate) {
        log::info!("update:{:?}", update);
        let mut decodings = PEER_DECODINGS.lock().unwrap();
        match update {
            EncodingUpdate::Update(id, decoding) => {
                decodings.insert(id, decoding);
            }
            EncodingUpdate::Remove(id) => {
                decodings.remove(&id);
            }
            EncodingUpdate::Check => {}
        }

        let _all_support_h264_decoding =
            decodings.len() > 0 && decodings.iter().all(|(_, s)| s.ability_h264 > 0);
        let _all_support_h265_decoding =
            decodings.len() > 0 && decodings.iter().all(|(_, s)| s.ability_h265 > 0);
        #[allow(unused_mut)]
        let mut h264vram_encoding = false;
        #[allow(unused_mut)]
        let mut h265vram_encoding = false;
        #[cfg(feature = "vram")]
        {
            if _all_support_h264_decoding && !VRamEncoder::available(CodecFormat::H264).is_empty() {
                h264vram_encoding = true;
            }
            if _all_support_h265_decoding && !VRamEncoder::available(CodecFormat::H265).is_empty() {
                h265vram_encoding = true;
            }
        }
        #[allow(unused_mut)]
        let mut h264hw_encoding: Option<String> = None;
        #[allow(unused_mut)]
        let mut h265hw_encoding: Option<String> = None;
        #[cfg(feature = "hwcodec")]
        {
            if _all_support_h264_decoding {
                h264hw_encoding =
                    HwRamEncoder::try_get(CodecFormat::H264).map_or(None, |c| Some(c.name));
            }
            if _all_support_h265_decoding {
                h265hw_encoding =
                    HwRamEncoder::try_get(CodecFormat::H265).map_or(None, |c| Some(c.name));
            }
        }
        let _all_support_av1_decoding =
            decodings.len() > 0 && decodings.iter().all(|(_, s)| s.ability_av1 > 0);
        #[allow(unused_mut)]
        let mut av1vram_encoding = false;
        #[cfg(feature = "vram")]
        {
            if _all_support_av1_decoding && !VRamEncoder::available(CodecFormat::AV1).is_empty() {
                av1vram_encoding = true;
            }
        }
        #[allow(unused_mut)]
        let mut av1hw_encoding: Option<String> = None;
        #[cfg(feature = "hwcodec")]
        {
            if _all_support_av1_decoding {
                av1hw_encoding =
                    HwRamEncoder::try_get(CodecFormat::AV1).map_or(None, |c| Some(c.name));
            }
        }
        let h264_useable =
            _all_support_h264_decoding && (h264vram_encoding || h264hw_encoding.is_some());
        let h265_useable =
            _all_support_h265_decoding && (h265vram_encoding || h265hw_encoding.is_some());
        let av1_useable =
            _all_support_av1_decoding && (av1vram_encoding || av1hw_encoding.is_some());
        let scc_useable =
            decodings.len() > 0 && decodings.iter().all(|(_, s)| s.ability_scc > 0);
        let mut format = ENCODE_CODEC_FORMAT.lock().unwrap();
        let preferences: Vec<_> = decodings
            .iter()
            .filter(|(_, s)| {
                s.prefer == PreferCodec::H264.into() && h264_useable
                    || s.prefer == PreferCodec::H265.into() && h265_useable
                    || s.prefer == PreferCodec::AV1.into() && av1_useable
                    || s.prefer == PreferCodec::SCC.into() && scc_useable
            })
            .map(|(_, s)| s.prefer)
            .collect();
        *USABLE_ENCODING.lock().unwrap() = Some(SupportedEncoding {
            h264: h264_useable,
            h265: h265_useable,
            av1: av1_useable,
            scc: scc_useable,
            ..Default::default()
        });
        // find the most frequent preference
        let mut counts = Vec::new();
        for pref in &preferences {
            match counts.iter_mut().find(|(p, _)| p == pref) {
                Some((_, count)) => *count += 1,
                None => counts.push((pref.clone(), 1)),
            }
        }
        let max_count = counts.iter().map(|(_, count)| *count).max().unwrap_or(0);
        let (most_frequent, _) = counts
            .into_iter()
            .find(|(_, count)| *count == max_count)
            .unwrap_or((PreferCodec::Auto.into(), 0));
        let preference = most_frequent.enum_value_or(PreferCodec::Auto);

        // auto: prefer H264 (matches default) to avoid unnecessary SWITCH on startup.
        // Only use H265 if explicitly preferred by client.
        let previous_format = format.clone();
        let auto_codec = if h264_useable {
            CodecFormat::H264
        } else if h265_useable {
            CodecFormat::H265
        } else if decodings.is_empty() {
            previous_format
        } else {
            CodecFormat::Unknown
        };

        log::info!("[SCC-DEBUG] preference={:?}, scc_useable={}, auto_codec={:?}", preference, scc_useable, auto_codec);
        for (id, s) in decodings.iter() {
            log::info!("[SCC-DEBUG] peer {} ability_scc={} prefer={:?}", id, s.ability_scc, s.prefer);
        }
        *format = if preference == PreferCodec::AV1 {
            if av1_useable { CodecFormat::AV1 } else { auto_codec }
        } else if preference == PreferCodec::SCC {
            if scc_useable {
                CodecFormat::ScreenContent
            } else {
                auto_codec
            }
        } else if preference == PreferCodec::H264 {
            if h264vram_encoding || h264hw_encoding.is_some() {
                CodecFormat::H264
            } else {
                auto_codec
            }
        } else if preference == PreferCodec::H265 {
            if h265vram_encoding || h265hw_encoding.is_some() {
                CodecFormat::H265
            } else {
                auto_codec
            }
        } else {
            auto_codec
        };
        if decodings.len() > 0 {
            log::info!("usable: h264={h264_useable}, h265={h265_useable}, scc={scc_useable}",);
            log::info!(
                "connection count: {}, used preference: {:?}, encoder: {:?}",
                decodings.len(),
                preference,
                *format
            )
        }
        if *format == CodecFormat::Unknown {
            log::error!(
                "No usable negotiated codec after capability check: h264_useable={}, h265_useable={}, peers={}",
                h264_useable,
                h265_useable,
                decodings.len()
            );
        }
    }

    #[inline]
    pub fn negotiated_codec() -> CodecFormat {
        ENCODE_CODEC_FORMAT.lock().unwrap().clone()
    }

    pub fn supported_encoding() -> SupportedEncoding {
        #[allow(unused_mut)]
        let mut encoding = SupportedEncoding {
            ..Default::default()
        };
        #[cfg(feature = "hwcodec")]
        {
            encoding.h264 |= HwRamEncoder::try_get(CodecFormat::H264).is_some();
            encoding.h265 |= HwRamEncoder::try_get(CodecFormat::H265).is_some();
        }
        #[cfg(feature = "vram")]
        {
            encoding.h264 |= !VRamEncoder::available(CodecFormat::H264).is_empty();
            encoding.h265 |= !VRamEncoder::available(CodecFormat::H265).is_empty();
        }
        encoding.scc = true;
        #[cfg(feature = "hwcodec")]
        { encoding.av1 = HwRamEncoder::try_get(CodecFormat::AV1).is_some(); }
        #[cfg(feature = "vram")]
        { encoding.av1 |= !VRamEncoder::available(CodecFormat::AV1).is_empty(); }
        encoding
    }

    pub fn usable_encoding() -> Option<SupportedEncoding> {
        USABLE_ENCODING.lock().unwrap().clone()
    }

    pub fn set_fallback(config: &EncoderCfg) {
        #[cfg(feature = "hwcodec")]
        if let EncoderCfg::HWRAM(hw) = config {
            let format = if hw.name.to_lowercase().contains("h264") {
                CodecFormat::H264
            } else {
                CodecFormat::H265
            };
            let current = ENCODE_CODEC_FORMAT.lock().unwrap().clone();
            if current != format {
                log::info!("codec fallback: {:?} -> {:?}", current, format);
                *ENCODE_CODEC_FORMAT.lock().unwrap() = format;
            }
            return;
        }

        #[cfg(feature = "vram")]
        if let EncoderCfg::VRAM(vram) = config {
            let format = match vram.feature.data_format {
                hwcodec::common::DataFormat::H264 => CodecFormat::H264,
                hwcodec::common::DataFormat::H265 => CodecFormat::H265,
                _ => {
                    log::error!(
                        "should not reach here, vram not support {:?}",
                        vram.feature.data_format
                    );
                    return;
                }
            };
            let current = ENCODE_CODEC_FORMAT.lock().unwrap().clone();
            if current != format {
                log::info!("codec fallback: {:?} -> {:?}", current, format);
                *ENCODE_CODEC_FORMAT.lock().unwrap() = format;
            }
            return;
        }

        if let EncoderCfg::SCC(_) = config {
            let current = ENCODE_CODEC_FORMAT.lock().unwrap().clone();
            if current != CodecFormat::ScreenContent {
                log::info!("codec fallback: {:?} -> {:?}", current, CodecFormat::ScreenContent);
                *ENCODE_CODEC_FORMAT.lock().unwrap() = CodecFormat::ScreenContent;
            }
            return;
        }

        let format = CodecFormat::H264;
        let current = ENCODE_CODEC_FORMAT.lock().unwrap().clone();
        if current != format {
            log::info!("codec fallback: {:?} -> {:?}", current, format);
            *ENCODE_CODEC_FORMAT.lock().unwrap() = format;
        }
    }

    pub fn use_i444(_config: &EncoderCfg) -> bool {
        // i444 is not supported with H264/H265, always use I420
        false
    }
}

impl Decoder {
    pub fn supported_decodings(
        id_for_perfer: Option<&str>,
        _use_texture_render: bool,
        _luid: Option<i64>,
        mark_unsupported: &Vec<CodecFormat>,
    ) -> SupportedDecoding {
        let (prefer, _) = Self::preference(id_for_perfer);

        #[allow(unused_mut)]
        let mut decoding = SupportedDecoding {
            prefer: prefer.into(),
            ..Default::default()
        };
        #[cfg(feature = "hwcodec")]
        {
            decoding.ability_h264 |= if HwRamDecoder::try_get(CodecFormat::H264).is_some() {
                1
            } else {
                0
            };
            decoding.ability_h265 |= if HwRamDecoder::try_get(CodecFormat::H265).is_some() {
                1
            } else {
                0
            };
        }
        #[cfg(feature = "vram")]
        if enable_vram_option(false) && _use_texture_render {
            decoding.ability_h264 |= if VRamDecoder::available(CodecFormat::H264, _luid).len() > 0 {
                1
            } else {
                0
            };
            decoding.ability_h265 |= if VRamDecoder::available(CodecFormat::H265, _luid).len() > 0 {
                1
            } else {
                0
            };
        }
        #[cfg(feature = "mediacodec")]
        if enable_hwcodec_option() {
            decoding.ability_h264 =
                if H264_DECODER_SUPPORT.load(std::sync::atomic::Ordering::SeqCst) {
                    1
                } else {
                    0
                };
            decoding.ability_h265 =
                if H265_DECODER_SUPPORT.load(std::sync::atomic::Ordering::SeqCst) {
                    1
                } else {
                    0
                };
        }
        decoding.ability_scc = 1;
        // AV1 decoding uses same hwcodec/vram decoder infrastructure as H264/H265
        decoding.ability_av1 = decoding.ability_h264.max(decoding.ability_h265);
        for unsupported in mark_unsupported {
            match unsupported {
                CodecFormat::H264 => decoding.ability_h264 = 0,
                CodecFormat::H265 => decoding.ability_h265 = 0,
                CodecFormat::AV1 => decoding.ability_av1 = 0,
                CodecFormat::ScreenContent => decoding.ability_scc = 0,
                _ => {}
            }
        }
        decoding
    }

    pub fn new(format: CodecFormat, _luid: Option<i64>) -> Decoder {
        log::info!("try create new decoder, format: {format:?}, _luid: {_luid:?}");
        #[cfg(feature = "hwcodec")]
        let (mut h264_ram, mut h265_ram) = (None, None);
        #[cfg(feature = "vram")]
        let (mut h264_vram, mut h265_vram) = (None, None);
        #[cfg(feature = "mediacodec")]
        let (mut h264_media_codec, mut h265_media_codec) = (None, None);
        let mut valid = false;

        match format {
            CodecFormat::H264 => {
                #[cfg(feature = "vram")]
                if !valid && enable_vram_option(false) && _luid.clone().unwrap_or_default() != 0 {
                    match VRamDecoder::new(format, _luid) {
                        Ok(v) => {
                            log::info!("H264 VRAM decoder created (GPU texture path)");
                            h264_vram = Some(v);
                        }
                        Err(e) => log::error!("create H264 vram decoder failed: {}", e),
                    }
                    valid = h264_vram.is_some();
                }
                #[cfg(feature = "vram")]
                if !valid {
                    log::warn!(
                        "H264 VRAM skipped: vram_option={}, luid={:?}",
                        enable_vram_option(false),
                        _luid
                    );
                }
                #[cfg(feature = "hwcodec")]
                if !valid {
                    match HwRamDecoder::new(format) {
                        Ok(v) => {
                            log::info!("H264 HwRam decoder created (CPU color conversion path)");
                            h264_ram = Some(v);
                        }
                        Err(e) => log::error!("create H264 ram decoder failed: {}", e),
                    }
                    valid = h264_ram.is_some();
                }
                #[cfg(feature = "mediacodec")]
                if !valid && enable_hwcodec_option() {
                    h264_media_codec = MediaCodecDecoder::new(format);
                    if h264_media_codec.is_none() {
                        log::error!("create H264 media codec decoder failed");
                    }
                    valid = h264_media_codec.is_some();
                }
            }
            CodecFormat::H265 => {
                #[cfg(feature = "vram")]
                if !valid && enable_vram_option(false) && _luid.clone().unwrap_or_default() != 0 {
                    match VRamDecoder::new(format, _luid) {
                        Ok(v) => {
                            log::info!("H265 VRAM decoder created (GPU texture path)");
                            h265_vram = Some(v);
                        }
                        Err(e) => log::error!("create H265 vram decoder failed: {}", e),
                    }
                    valid = h265_vram.is_some();
                }
                #[cfg(feature = "vram")]
                if !valid {
                    log::warn!(
                        "H265 VRAM skipped: vram_option={}, luid={:?}",
                        enable_vram_option(false),
                        _luid
                    );
                }
                #[cfg(feature = "hwcodec")]
                if !valid {
                    match HwRamDecoder::new(format) {
                        Ok(v) => {
                            log::info!("H265 HwRam decoder created (CPU color conversion path)");
                            h265_ram = Some(v);
                        }
                        Err(e) => log::error!("create H265 ram decoder failed: {}", e),
                    }
                    valid = h265_ram.is_some();
                }
                #[cfg(feature = "mediacodec")]
                if !valid && enable_hwcodec_option() {
                    h265_media_codec = MediaCodecDecoder::new(format);
                    if h265_media_codec.is_none() {
                        log::error!("create H265 media codec decoder failed");
                    }
                    valid = h265_media_codec.is_some();
                }
            }
            CodecFormat::AV1 => {
                // AV1 uses the same VRAM/HwRam decoder path as H264/H265
                #[cfg(feature = "vram")]
                if !valid && enable_vram_option(false) && _luid.clone().unwrap_or_default() != 0 {
                    match VRamDecoder::new(format, _luid) {
                        Ok(v) => { h264_vram = Some(v); } // reuse h264_vram field for AV1
                        Err(_) => {}
                    }
                    valid = h264_vram.is_some();
                }
                #[cfg(feature = "hwcodec")]
                if !valid {
                    match HwRamDecoder::new(format) {
                        Ok(v) => { h264_ram = Some(v); } // reuse h264_ram field for AV1
                        Err(e) => log::error!("create AV1 decoder failed: {}", e),
                    }
                    valid = h264_ram.is_some();
                }
            }
            CodecFormat::ScreenContent => {
                valid = true;
            }
            CodecFormat::Unknown => {
                log::error!("unknown codec format, cannot create decoder");
            }
        }
        let scc = Some(SccDecoder::new());
        if !valid {
            log::error!("failed to create {format:?} decoder");
        } else {
            log::info!("create {format:?} decoder success");
        }
        Decoder {
            #[cfg(feature = "hwcodec")]
            h264_ram,
            #[cfg(feature = "hwcodec")]
            h265_ram,
            #[cfg(feature = "vram")]
            h264_vram,
            #[cfg(feature = "vram")]
            h265_vram,
            #[cfg(feature = "mediacodec")]
            h264_media_codec,
            #[cfg(feature = "mediacodec")]
            h265_media_codec,
            scc,
            format,
            valid,
            #[cfg(feature = "hwcodec")]
            i420: vec![],
        }
    }

    pub fn format(&self) -> CodecFormat {
        self.format
    }

    pub fn valid(&self) -> bool {
        self.valid
    }

    pub fn decoder_type(&self) -> &str {
        #[cfg(feature = "vram")]
        {
            if self.h265_vram.is_some() || self.h264_vram.is_some() {
                return "VRAM";
            }
        }
        #[cfg(feature = "hwcodec")]
        {
            if self.h265_ram.is_some() || self.h264_ram.is_some() {
                return "HwRam";
            }
        }
        #[cfg(feature = "mediacodec")]
        {
            if self.h265_media_codec.is_some() || self.h264_media_codec.is_some() {
                return "MC";
            }
        }
        if self.scc.is_some() {
            return "SCC";
        }
        "SW"
    }

    // rgb [in/out] fmt and stride must be set in ImageRgb
    pub fn handle_video_frame(
        &mut self,
        frame: &video_frame::Union,
        rgb: &mut ImageRgb,
        _texture: &mut ImageTexture,
        _pixelbuffer: &mut bool,
        chroma: &mut Option<Chroma>,
    ) -> ResultType<bool> {
        match frame {
            #[cfg(any(feature = "hwcodec", feature = "vram"))]
            video_frame::Union::H264s(h264s) => {
                *chroma = Some(Chroma::I420);
                #[cfg(feature = "vram")]
                if let Some(decoder) = &mut self.h264_vram {
                    *_pixelbuffer = false;
                    return Decoder::handle_vram_video_frame(decoder, h264s, _texture);
                }
                #[cfg(feature = "hwcodec")]
                if let Some(decoder) = &mut self.h264_ram {
                    return Decoder::handle_hwram_video_frame(decoder, h264s, rgb, &mut self.i420);
                }
                Err(anyhow!("don't support h264!"))
            }
            #[cfg(any(feature = "hwcodec", feature = "vram"))]
            video_frame::Union::H265s(h265s) => {
                *chroma = Some(Chroma::I420);
                #[cfg(feature = "vram")]
                if let Some(decoder) = &mut self.h265_vram {
                    *_pixelbuffer = false;
                    return Decoder::handle_vram_video_frame(decoder, h265s, _texture);
                }
                #[cfg(feature = "hwcodec")]
                if let Some(decoder) = &mut self.h265_ram {
                    return Decoder::handle_hwram_video_frame(decoder, h265s, rgb, &mut self.i420);
                }
                Err(anyhow!("don't support h265!"))
            }
            #[cfg(feature = "mediacodec")]
            video_frame::Union::H264s(h264s) => {
                *chroma = Some(Chroma::I420);
                if let Some(decoder) = &mut self.h264_media_codec {
                    Decoder::handle_mediacodec_video_frame(decoder, h264s, rgb)
                } else {
                    Err(anyhow!("don't support h264!"))
                }
            }
            #[cfg(feature = "mediacodec")]
            video_frame::Union::H265s(h265s) => {
                *chroma = Some(Chroma::I420);
                if let Some(decoder) = &mut self.h265_media_codec {
                    Decoder::handle_mediacodec_video_frame(decoder, h265s, rgb)
                } else {
                    Err(anyhow!("don't support h265!"))
                }
            }
            #[cfg(any(feature = "hwcodec", feature = "vram"))]
            video_frame::Union::Av1s(av1s) => {
                *chroma = Some(Chroma::I420);
                #[cfg(feature = "vram")]
                if let Some(decoder) = &mut self.h264_vram {
                    *_pixelbuffer = false;
                    return Decoder::handle_vram_video_frame(decoder, av1s, _texture);
                }
                #[cfg(feature = "hwcodec")]
                if let Some(decoder) = &mut self.h264_ram {
                    return Decoder::handle_hwram_video_frame(decoder, av1s, rgb, &mut self.i420);
                }
                Err(anyhow!("don't support AV1!"))
            }
            video_frame::Union::Sccs(frames) => {
                *chroma = None; // SCC outputs BGRA directly, no chroma subsampling
                if let Some(decoder) = &mut self.scc {
                    let mut got_frame = false;
                    for frame in frames.frames.iter() {
                        if decoder.decode(&frame.data, rgb)? {
                            got_frame = true;
                        }
                    }
                    Ok(got_frame)
                } else {
                    Err(anyhow!("SCC decoder not initialized"))
                }
            }
            _ => Err(anyhow!("unsupported video frame type!")),
        }
    }

    // rgb [in/out] fmt and stride must be set in ImageRgb
    #[cfg(feature = "hwcodec")]
    fn handle_hwram_video_frame(
        decoder: &mut HwRamDecoder,
        frames: &EncodedVideoFrames,
        rgb: &mut ImageRgb,
        i420: &mut Vec<u8>,
    ) -> ResultType<bool> {
        let mut got_frame = false;
        for h264 in frames.frames.iter() {
            let images = decoder.decode(&h264.data)?;
            // Only convert the last decoded image to avoid redundant YUV->RGB work
            if let Some(image) = images.into_iter().last() {
                image.to_fmt(rgb, i420)?;
                got_frame = true;
            }
        }
        Ok(got_frame)
    }

    #[cfg(feature = "vram")]
    fn handle_vram_video_frame(
        decoder: &mut VRamDecoder,
        frames: &EncodedVideoFrames,
        texture: &mut ImageTexture,
    ) -> ResultType<bool> {
        let mut ret = false;
        for h26x in frames.frames.iter() {
            for image in decoder.decode(&h26x.data)? {
                *texture = ImageTexture {
                    texture: image.frame.texture,
                    w: image.frame.width as _,
                    h: image.frame.height as _,
                };
                ret = true;
            }
        }
        return Ok(ret);
    }

    // rgb [in/out] fmt and stride must be set in ImageRgb
    #[cfg(feature = "mediacodec")]
    fn handle_mediacodec_video_frame(
        decoder: &mut MediaCodecDecoder,
        frames: &EncodedVideoFrames,
        rgb: &mut ImageRgb,
    ) -> ResultType<bool> {
        let mut ret = false;
        for h264 in frames.frames.iter() {
            return decoder.decode(&h264.data, rgb);
        }
        return Ok(false);
    }

    fn preference(id: Option<&str>) -> (PreferCodec, Chroma) {
        let id = id.unwrap_or_default();
        if id.is_empty() {
            return (PreferCodec::Auto, Chroma::I420);
        }
        let options = PeerConfig::load(id).options;
        let codec = options
            .get("codec-preference")
            .map_or("".to_owned(), |c| c.to_owned());
        let codec = if codec == "h264" {
            PreferCodec::H264
        } else if codec == "h265" {
            PreferCodec::H265
        } else if codec == "av1" {
            PreferCodec::AV1
        } else if codec == "scc" {
            PreferCodec::SCC
        } else {
            PreferCodec::Auto
        };
        // i444 not supported with H264/H265
        (codec, Chroma::I420)
    }
}

#[cfg(any(feature = "hwcodec", feature = "mediacodec"))]
pub fn enable_hwcodec_option() -> bool {
    use hbb_common::config::keys::OPTION_ENABLE_HWCODEC;

    if !cfg!(target_os = "ios") {
        return option2bool(
            OPTION_ENABLE_HWCODEC,
            &Config::get_option(OPTION_ENABLE_HWCODEC),
        );
    }
    false
}
#[cfg(feature = "vram")]
pub fn enable_vram_option(encode: bool) -> bool {
    use hbb_common::config::keys::OPTION_ENABLE_HWCODEC;

    if cfg!(windows) {
        let enable = option2bool(
            OPTION_ENABLE_HWCODEC,
            &Config::get_option(OPTION_ENABLE_HWCODEC),
        );
        if encode {
            enable && enable_directx_capture()
        } else {
            enable && allow_d3d_render()
        }
    } else {
        false
    }
}

#[cfg(windows)]
pub fn enable_directx_capture() -> bool {
    use hbb_common::config::keys::OPTION_ENABLE_DIRECTX_CAPTURE as OPTION;
    option2bool(OPTION, &Config::get_option(OPTION))
}

#[cfg(windows)]
pub fn allow_d3d_render() -> bool {
    use hbb_common::config::keys::OPTION_ALLOW_D3D_RENDER as OPTION;
    option2bool(OPTION, &hbb_common::config::LocalConfig::get_option(OPTION))
}

pub const BR_BEST: f32 = 1.5;
pub const BR_BALANCED: f32 = 0.67;
pub const BR_SPEED: f32 = 0.5;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Quality {
    Best,
    Balanced,
    Low,
    Custom(f32),
}

impl Default for Quality {
    fn default() -> Self {
        Self::Balanced
    }
}

impl Quality {
    pub fn is_custom(&self) -> bool {
        match self {
            Quality::Custom(_) => true,
            _ => false,
        }
    }

    pub fn ratio(&self) -> f32 {
        match self {
            Quality::Best => BR_BEST,
            Quality::Balanced => BR_BALANCED,
            Quality::Low => BR_SPEED,
            Quality::Custom(v) => *v,
        }
    }
}

pub fn base_bitrate(width: u32, height: u32) -> u32 {
    const RESOLUTION_PRESETS: &[(u32, u32, u32)] = &[
        (640, 480, 400),     // VGA, 307k pixels
        (800, 600, 500),     // SVGA, 480k pixels
        (1024, 768, 800),    // XGA, 786k pixels
        (1280, 720, 1000),   // 720p, 921k pixels
        (1366, 768, 1100),   // HD, 1049k pixels
        (1440, 900, 1300),   // WXGA+, 1296k pixels
        (1600, 900, 1500),   // HD+, 1440k pixels
        (1920, 1080, 2073),  // 1080p, 2073k pixels
        (2048, 1080, 2200),  // 2K DCI, 2211k pixels
        (2560, 1440, 3000),  // 2K QHD, 3686k pixels
        (3440, 1440, 4000),  // UWQHD, 4953k pixels
        (3840, 2160, 5000),  // 4K UHD, 8294k pixels
        (7680, 4320, 12000), // 8K UHD, 33177k pixels
    ];
    let pixels = width * height;

    let (preset_pixels, preset_bitrate) = RESOLUTION_PRESETS
        .iter()
        .map(|(w, h, bitrate)| (w * h, bitrate))
        .min_by_key(|(preset_pixels, _)| {
            if *preset_pixels >= pixels {
                preset_pixels - pixels
            } else {
                pixels - preset_pixels
            }
        })
        .unwrap_or(((1920 * 1080) as u32, &2073)); // default 1080p

    let bitrate = (*preset_bitrate as f32 * (pixels as f32 / preset_pixels as f32)).round() as u32;

    #[cfg(target_os = "android")]
    {
        let fix = crate::Display::fix_quality() as u32;
        log::debug!("Android screen, fix quality:{}", fix);
        bitrate * fix
    }
    #[cfg(not(target_os = "android"))]
    {
        bitrate
    }
}

pub fn codec_thread_num(limit: usize) -> usize {
    let max: usize = num_cpus::get();
    let mut res;
    let info;
    let mut s = System::new();
    s.refresh_memory();
    let memory = s.available_memory() / 1024 / 1024 / 1024;
    #[cfg(windows)]
    {
        res = 0;
        let percent = hbb_common::platform::windows::cpu_uage_one_minute();
        info = format!("cpu usage: {:?}", percent);
        if let Some(pecent) = percent {
            if pecent < 100.0 {
                res = ((100.0 - pecent) * (max as f64) / 200.0).round() as usize;
            }
        }
    }
    #[cfg(not(windows))]
    {
        s.refresh_cpu_usage();
        // https://man7.org/linux/man-pages/man3/getloadavg.3.html
        let avg = s.load_average();
        info = format!("cpu loadavg: {}", avg.one);
        res = (((max as f64) - avg.one) * 0.5).round() as usize;
    }
    res = std::cmp::min(res, max / 2);
    res = std::cmp::min(res, memory as usize / 2);
    // Optimize Thread Allocation for Real-time Video Streaming
    // Over-allocating threads causes cache-misses and high latency context switches
    // We want to be more conservative here compared to offline encoding.
    res = match res {
        _ if res >= 32 => 16, // Cap at 16 even on very high-end CPUs to avoid scheduler contention
        _ if res >= 16 => 12,
        _ if res >= 8 => 6,
        _ if res >= 4 => 3,
        _ if res >= 2 => 2,
        _ => 1,
    };
    // ffmpeg: MAX_AUTO_THREADS = 16
    res = std::cmp::min(res, limit);
    // avoid frequent log
    let log = match THREAD_LOG_TIME.lock().unwrap().clone() {
        Some(instant) => instant.elapsed().as_secs() > 1,
        None => true,
    };
    if log {
        log::info!("cpu num: {max}, {info}, available memory: {memory}G, codec thread: {res}");
        *THREAD_LOG_TIME.lock().unwrap() = Some(Instant::now());
    }
    res
}
