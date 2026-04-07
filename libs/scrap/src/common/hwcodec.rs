use crate::{
    codec::{base_bitrate, codec_thread_num, enable_hwcodec_option, EncoderApi, EncoderCfg},
    convert::*,
    CodecFormat, EncodeInput, ImageFormat, ImageRgb, Pixfmt, HW_STRIDE_ALIGN,
};
use hbb_common::{
    anyhow::{anyhow, bail, Context},
    bytes::Bytes,
    log,
    message_proto::{EncodedVideoFrame, EncodedVideoFrames, VideoFrame},
    serde_derive::{Deserialize, Serialize},
    serde_json, ResultType,
};
use hwcodec::{
    common::{
        DataFormat, HwcodecErrno,
        Quality::{self, *},
        RateControl::{self, *},
    },
    ffmpeg::AVPixelFormat,
    ffmpeg_ram::{
        decode::{DecodeContext, DecodeFrame, Decoder},
        encode::{EncodeContext, EncodeFrame, Encoder},
        ffmpeg_linesize_offset_length, CodecInfo,
    },
};

const DEFAULT_PIXFMT: AVPixelFormat = AVPixelFormat::AV_PIX_FMT_NV12;
pub const DEFAULT_FPS: i32 = 120; // Match game mode target; QoS will cap actual FPS
const DEFAULT_GOP: i32 = i32::MAX;
const DEFAULT_HW_QUALITY: Quality = Quality_Low; // Fastest encoding speed for low latency
pub const ERR_HEVC_POC: i32 = HwcodecErrno::HWCODEC_ERR_HEVC_COULD_NOT_FIND_POC as i32;

crate::generate_call_macro!(call_yuv, false);

#[cfg(not(target_os = "android"))]
lazy_static::lazy_static! {
    static ref CONFIG: std::sync::RwLock<Option<HwCodecConfig>> = std::sync::RwLock::new(None);
    static ref CONFIG_SET_BY_IPC: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);
}

#[derive(Debug, Clone)]
pub struct HwRamEncoderConfig {
    pub name: String,
    pub mc_name: Option<String>,
    pub width: usize,
    pub height: usize,
    pub quality: f32,
    pub keyframe_interval: Option<usize>,
}

pub struct HwRamEncoder {
    encoder: Encoder,
    pub format: DataFormat,
    pub pixfmt: AVPixelFormat,
    bitrate: u32, //kbs
    config: HwRamEncoderConfig,
    yuvfmt: crate::EncodeYuvFormat,
}

impl EncoderApi for HwRamEncoder {
    fn new(cfg: EncoderCfg, _i444: bool) -> ResultType<Self>
    where
        Self: Sized,
    {
        match cfg {
            EncoderCfg::HWRAM(config) => {
                let rc = Self::rate_control(&config);
                let mut bitrate =
                    Self::bitrate(&config.name, config.width, config.height, config.quality);
                bitrate = Self::check_bitrate_range(&config, bitrate);
                let gop = config.keyframe_interval.unwrap_or(DEFAULT_GOP as _) as i32;
                let ctx = EncodeContext {
                    name: config.name.clone(),
                    mc_name: config.mc_name.clone(),
                    width: config.width as _,
                    height: config.height as _,
                    pixfmt: DEFAULT_PIXFMT,
                    align: HW_STRIDE_ALIGN as _,
                    kbs: bitrate as i32,
                    fps: DEFAULT_FPS,
                    gop,
                    quality: DEFAULT_HW_QUALITY,
                    rc,
                    q: -1,
                    thread_count: codec_thread_num(16) as _, // ffmpeg's thread_count is used for cpu
                };
                let format = match Encoder::format_from_name(config.name.clone()) {
                    Ok(format) => format,
                    Err(_) => {
                        return Err(anyhow!(format!(
                            "failed to get format from name:{}",
                            config.name
                        )))
                    }
                };
                match Encoder::new(ctx.clone()) {
                    Ok(encoder) => {
                        let pixfmt_val = if ctx.pixfmt == AVPixelFormat::AV_PIX_FMT_NV12 {
                            Pixfmt::NV12
                        } else {
                            Pixfmt::I420
                        };
                        let mut stride = [0usize; 4];
                        for (i, &v) in encoder.linesize.iter().enumerate().take(4) {
                            stride[i] = v as usize;
                        }
                        let yuvfmt = crate::EncodeYuvFormat {
                            pixfmt: pixfmt_val,
                            w: ctx.width as _,
                            h: ctx.height as _,
                            stride,
                            u: encoder.offset[0] as _,
                            v: if pixfmt_val == Pixfmt::NV12 {
                                0
                            } else {
                                encoder.offset[1] as _
                            },
                        };
                        Ok(HwRamEncoder {
                            encoder,
                            format,
                            pixfmt: ctx.pixfmt,
                            bitrate,
                            config,
                            yuvfmt,
                        })
                    }
                    Err(_) => Err(anyhow!(format!("Failed to create encoder"))),
                }
            }
            _ => Err(anyhow!("encoder type mismatch")),
        }
    }

    fn encode_to_message(&mut self, input: EncodeInput, ms: i64) -> ResultType<VideoFrame> {
        let mut vf = VideoFrame::new();
        let mut frames = Vec::new();
        for frame in self
            .encode(input.yuv()?, ms)
            .with_context(|| "Failed to encode")?
        {
            frames.push(EncodedVideoFrame {
                data: Bytes::from(frame.data),
                pts: frame.pts,
                key: frame.key == 1,
                ..Default::default()
            });
        }
        if frames.len() > 0 {
            let frames = EncodedVideoFrames {
                frames: frames.into(),
                ..Default::default()
            };
            match self.format {
                DataFormat::H264 => vf.set_h264s(frames),
                DataFormat::H265 => vf.set_h265s(frames),
                DataFormat::AV1 => vf.set_av1s(frames),
                _ => bail!("unsupported format: {:?}", self.format),
            }
            Ok(vf)
        } else {
            Err(anyhow!("no valid frame"))
        }
    }

    fn yuvfmt(&self) -> &crate::EncodeYuvFormat {
        &self.yuvfmt
    }

    #[cfg(feature = "vram")]
    fn input_texture(&self) -> bool {
        false
    }

    fn set_quality(&mut self, ratio: f32) -> ResultType<()> {
        let mut bitrate = Self::bitrate(
            &self.config.name,
            self.config.width,
            self.config.height,
            ratio,
        );
        if bitrate > 0 {
            bitrate = Self::check_bitrate_range(&self.config, bitrate);
            self.encoder.set_bitrate(bitrate as _).ok();
            self.bitrate = bitrate;
        }
        self.config.quality = ratio;
        Ok(())
    }

    fn bitrate(&self) -> u32 {
        self.bitrate
    }

    fn support_changing_quality(&self) -> bool {
        ["vaapi"].iter().all(|&x| !self.config.name.contains(x))
    }

    fn latency_free(&self) -> bool {
        ["mediacodec", "videotoolbox"]
            .iter()
            .all(|&x| !self.config.name.contains(x))
    }

    fn is_hardware(&self) -> bool {
        true
    }

    fn disable(&self) {
        log::warn!("HwRamEncoder::disable called, ignoring (no software fallback available)");
    }
}

impl HwRamEncoder {
    pub fn try_get(format: CodecFormat) -> Option<CodecInfo> {
        let best = CodecInfo::prioritized(HwCodecConfig::get().ram_encode);
        match format {
            CodecFormat::H264 => best.h264,
            CodecFormat::H265 => best.h265,
            CodecFormat::AV1 => best.av1,
            _ => None,
        }
    }

    pub fn encode(&mut self, yuv: &[u8], ms: i64) -> ResultType<Vec<EncodeFrame>> {
        match self.encoder.encode(yuv, ms) {
            Ok(v) => {
                let mut data = Vec::new();
                data.append(v);
                Ok(data)
            }
            Err(_) => Ok(vec![]),
        }
    }

    fn rate_control(_config: &HwRamEncoderConfig) -> RateControl {
        #[cfg(target_os = "android")]
        if _config.name.contains("mediacodec") {
            return RC_VBR;
        }
        RC_CBR
    }

    pub fn bitrate(name: &str, width: usize, height: usize, ratio: f32) -> u32 {
        let mut b = Self::calc_bitrate(width, height, ratio, name.contains("h264"));
        if name.to_lowercase().contains("av1") {
            b = (b as f32 * 0.6) as u32;
        } else if name.to_lowercase().contains("h265") || name.to_lowercase().contains("hevc") {
            b = (b as f32 * 0.75) as u32;
        }
        std::cmp::max(b, 200)
    }

    pub fn calc_bitrate(width: usize, height: usize, ratio: f32, _h264: bool) -> u32 {
        let base = base_bitrate(width as _, height as _) as f32 * ratio;
        let threshold = 1500.0;
        let bwe_decay = 0.0005;

        let factor: f32 = if cfg!(target_os = "android") {
            if base > threshold {
                1.0 + 3.0 / (1.0 + (base - threshold) * bwe_decay)
            } else {
                4.0
            }
        } else {
            // H264/H265/AV1 use unified congestion control parameters
            if base > threshold {
                1.0 + 1.2 / (1.0 + (base - threshold) * (bwe_decay * 1.5))
            } else {
                2.2
            }
        };

        std::cmp::max((base * factor) as u32, 500)
    }

    pub fn check_bitrate_range(_config: &HwRamEncoderConfig, bitrate: u32) -> u32 {
        #[cfg(target_os = "android")]
        if _config.name.contains("mediacodec") {
            let info = crate::android::ffi::get_codec_info();
            if let Some(info) = info {
                if let Some(codec) = info
                    .codecs
                    .iter()
                    .find(|c| Some(c.name.clone()) == _config.mc_name && c.is_encoder)
                {
                    if codec.max_bitrate > codec.min_bitrate {
                        if bitrate > codec.max_bitrate {
                            return codec.max_bitrate;
                        }
                        if bitrate < codec.min_bitrate {
                            return codec.min_bitrate;
                        }
                    }
                }
            }
        }
        bitrate
    }
}

pub struct HwRamDecoder {
    decoder: Decoder,
    pub info: CodecInfo,
}

impl HwRamDecoder {
    pub fn try_get(format: CodecFormat) -> Option<CodecInfo> {
        let soft = CodecInfo::soft();
        let base_info = match format {
            CodecFormat::H264 => soft.h264,
            CodecFormat::H265 => soft.h265,
            _ => None,
        };

        if enable_hwcodec_option() {
            let best = CodecInfo::prioritized(HwCodecConfig::get().ram_decode);
            match format {
                CodecFormat::H264 => best.h264,
                CodecFormat::H265 => best.h265,
                CodecFormat::AV1 => best.av1,
                _ => None,
            }
            .or(base_info)
        } else {
            base_info
        }
    }

    pub fn new(format: CodecFormat) -> ResultType<Self> {
        let info = HwRamDecoder::try_get(format);
        log::info!("try create {info:?} ram decoder");
        let Some(info) = info else {
            bail!("unsupported format: {:?}", format);
        };
        let ctx = DecodeContext {
            name: info.name.clone(),
            device_type: info.hwdevice.clone(),
            thread_count: codec_thread_num(16) as _,
        };
        match Decoder::new(ctx) {
            Ok(decoder) => Ok(HwRamDecoder { decoder, info }),
            Err(_) => {
                HwCodecConfig::clear(false, false);
                Err(anyhow!(format!("Failed to create decoder")))
            }
        }
    }
    pub fn decode<'a>(&'a mut self, data: &[u8]) -> ResultType<Vec<HwRamDecoderImage<'a>>> {
        match self.decoder.decode(data) {
            Ok(v) => Ok(v.iter().map(|f| HwRamDecoderImage { frame: f }).collect()),
            Err(e) => Err(anyhow!(e)),
        }
    }
}

pub struct HwRamDecoderImage<'a> {
    frame: &'a DecodeFrame,
}

impl HwRamDecoderImage<'_> {
    // rgb [in/out] fmt and stride must be set in ImageRgb
    pub fn to_fmt(&self, rgb: &mut ImageRgb, i420: &mut Vec<u8>) -> ResultType<()> {
        let frame = self.frame;
        let width = frame.width;
        let height = frame.height;
        rgb.w = width as _;
        rgb.h = height as _;
        let dst_align = rgb.align();
        let bytes_per_row = (rgb.w * 4 + dst_align - 1) & !(dst_align - 1);
        // Avoid zero-filling memory that will be fully overwritten by YUV conversion
        let expected_len = rgb.h * bytes_per_row;
        rgb.raw.clear();
        rgb.raw.reserve(expected_len);
        unsafe { rgb.raw.set_len(expected_len); }
        match frame.pixfmt {
            AVPixelFormat::AV_PIX_FMT_NV12 => {
                // I420ToARGB is much faster than NV12ToARGB in tests on Windows
                if cfg!(windows) {
                    let Ok((linesize_i420, offset_i420, len_i420)) = ffmpeg_linesize_offset_length(
                        AVPixelFormat::AV_PIX_FMT_YUV420P,
                        width as _,
                        height as _,
                        HW_STRIDE_ALIGN,
                    ) else {
                        bail!("failed to get i420 linesize, offset, length");
                    };
                    let expected_i420_len = len_i420 as usize;
                    i420.clear();
                    i420.reserve(expected_i420_len);
                    unsafe { i420.set_len(expected_i420_len); }
                    // Use as_mut_ptr() to avoid UB from casting const ptr to mutable
                    let i420_ptr = i420.as_mut_ptr();
                    let i420_offset_y = i420_ptr as _;
                    let i420_offset_u = unsafe { i420_ptr.add(offset_i420[0] as _) as _ };
                    let i420_offset_v = unsafe { i420_ptr.add(offset_i420[1] as _) as _ };
                    call_yuv!(NV12ToI420(
                        frame.data[0].as_ptr(),
                        frame.linesize[0],
                        frame.data[1].as_ptr(),
                        frame.linesize[1],
                        i420_offset_y,
                        linesize_i420[0],
                        i420_offset_u,
                        linesize_i420[1],
                        i420_offset_v,
                        linesize_i420[2],
                        width,
                        height,
                    ));
                    let f = match rgb.fmt() {
                        ImageFormat::ARGB => I420ToARGB,
                        ImageFormat::ABGR => I420ToABGR,
                        _ => bail!("unsupported format: {:?} -> {:?}", frame.pixfmt, rgb.fmt()),
                    };
                    call_yuv!(f(
                        i420_offset_y,
                        linesize_i420[0],
                        i420_offset_u,
                        linesize_i420[1],
                        i420_offset_v,
                        linesize_i420[2],
                        rgb.raw.as_mut_ptr(),
                        bytes_per_row as _,
                        width,
                        height,
                    ));
                } else {
                    let f = match rgb.fmt() {
                        ImageFormat::ARGB => NV12ToARGB,
                        ImageFormat::ABGR => NV12ToABGR,
                        _ => bail!("unsupported format: {:?} -> {:?}", frame.pixfmt, rgb.fmt()),
                    };
                    call_yuv!(f(
                        frame.data[0].as_ptr(),
                        frame.linesize[0],
                        frame.data[1].as_ptr(),
                        frame.linesize[1],
                        rgb.raw.as_mut_ptr(),
                        bytes_per_row as _,
                        width,
                        height,
                    ));
                }
            }
            AVPixelFormat::AV_PIX_FMT_YUV420P => {
                let f = match rgb.fmt() {
                    ImageFormat::ARGB => I420ToARGB,
                    ImageFormat::ABGR => I420ToABGR,
                    _ => bail!("unsupported format: {:?} -> {:?}", frame.pixfmt, rgb.fmt()),
                };
                call_yuv!(f(
                    frame.data[0].as_ptr(),
                    frame.linesize[0],
                    frame.data[1].as_ptr(),
                    frame.linesize[1],
                    frame.data[2].as_ptr(),
                    frame.linesize[2],
                    rgb.raw.as_mut_ptr(),
                    bytes_per_row as _,
                    width,
                    height,
                ));
            }
        }
        Ok(())
    }
}

#[cfg(target_os = "android")]
fn get_mime_type(codec: DataFormat) -> &'static str {
    match codec {
        DataFormat::H264 => "video/avc",
        DataFormat::H265 => "video/hevc",
        _ => "video/avc", // unsupported codecs fallback to H264
    }
}

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct HwCodecConfig {
    #[serde(default)]
    pub signature: u64,
    #[serde(default)]
    pub ram_encode: Vec<CodecInfo>,
    #[serde(default)]
    pub ram_decode: Vec<CodecInfo>,
    #[cfg(feature = "vram")]
    #[serde(default)]
    pub vram_encode: Vec<hwcodec::vram::FeatureContext>,
    #[cfg(feature = "vram")]
    #[serde(default)]
    pub vram_decode: Vec<hwcodec::vram::DecodeContext>,
}

// HwCodecConfig2 is used to store the config in json format,
// confy can't serde HwCodecConfig successfully if the non-first struct Vec is empty due to old toml version.
// struct T { a: Vec<A>, b: Vec<String>} will fail if b is empty, but struct T { a: Vec<String>, b: Vec<String>} is ok.
#[derive(Debug, Default, Serialize, Deserialize, Clone)]
struct HwCodecConfig2 {
    #[serde(default)]
    pub config: String,
}

// ipc server process start check process once, other process get from ipc server once
// install: --server start check process, check process send to --server,  ui get from --server
// portable: ui start check process, check process send to ui
// sciter and unilink: get from ipc server
impl HwCodecConfig {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    pub fn set(config: String) {
        let config = serde_json::from_str(&config).unwrap_or_default();
        log::info!("set hwcodec config");
        log::debug!("{config:?}");
        #[cfg(any(windows, target_os = "macos"))]
        hbb_common::config::common_store(
            &HwCodecConfig2 {
                config: serde_json::to_string_pretty(&config).unwrap_or_default(),
            },
            "_hwcodec",
        );
        *CONFIG.write().unwrap() = Some(config);
        CONFIG_SET_BY_IPC.store(true, std::sync::atomic::Ordering::Release);
    }

    pub fn get() -> HwCodecConfig {
        #[cfg(target_os = "android")]
        {
            let info = crate::android::ffi::get_codec_info();
            log::info!("all codec info: {info:?}");
            struct T {
                name_prefix: &'static str,
                data_format: DataFormat,
            }
            let ts = vec![
                T {
                    name_prefix: "h264",
                    data_format: DataFormat::H264,
                },
                T {
                    name_prefix: "hevc",
                    data_format: DataFormat::H265,
                },
            ];
            let mut e = vec![];
            if let Some(info) = info {
                ts.iter().for_each(|t| {
                    let codecs: Vec<_> = info
                        .codecs
                        .iter()
                        .filter(|c| {
                            c.is_encoder
                                && c.mime_type.as_str() == get_mime_type(t.data_format)
                                && c.nv12
                                && c.hw == Some(true) //only use hardware codec
                        })
                        .collect();
                    let screen_wh = std::cmp::max(info.w, info.h);
                    let mut best = None;
                    if let Some(codec) = codecs
                        .iter()
                        .find(|c| c.max_width >= screen_wh && c.max_height >= screen_wh)
                    {
                        best = Some(codec.name.clone());
                    } else {
                        // find the max resolution
                        let mut max_area = 0;
                        for codec in codecs.iter() {
                            if codec.max_width * codec.max_height > max_area {
                                best = Some(codec.name.clone());
                                max_area = codec.max_width * codec.max_height;
                            }
                        }
                    }
                    if let Some(best) = best {
                        e.push(CodecInfo {
                            name: format!("{}_mediacodec", t.name_prefix),
                            mc_name: Some(best),
                            format: t.data_format,
                            hwdevice: hwcodec::ffmpeg::AVHWDeviceType::AV_HWDEVICE_TYPE_NONE,
                            priority: 0,
                        });
                    }
                });
            }
            log::debug!("e: {e:?}");
            HwCodecConfig {
                ram_encode: e,
                ..Default::default()
            }
        }
        #[cfg(any(windows, target_os = "macos"))]
        {
            if let Some(c) = CONFIG.read().unwrap().clone() {
                return c;
            }

            log::info!("try load cached hwcodec config");
            let c = hbb_common::config::common_load::<HwCodecConfig2>("_hwcodec");
            let c: HwCodecConfig = serde_json::from_str(&c.config).unwrap_or_default();
            let new_signature = hwcodec::common::get_gpu_signature();

            let final_config = if c.signature == new_signature {
                log::debug!("load cached hwcodec config: {c:?}");
                c
            } else {
                log::info!("gpu signature changed, {} -> {}", c.signature, new_signature);
                HwCodecConfig::default()
            };

            *CONFIG.write().unwrap() = Some(final_config.clone());
            final_config
        }
        #[cfg(target_os = "linux")]
        {
            CONFIG.read().unwrap().clone().unwrap_or_default()
        }
        #[cfg(target_os = "ios")]
        {
            HwCodecConfig::default()
        }
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    pub fn get_set_value() -> Option<HwCodecConfig> {
        if CONFIG_SET_BY_IPC.load(std::sync::atomic::Ordering::Acquire) {
            CONFIG.read().unwrap().clone()
        } else {
            None
        }
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    pub fn already_set() -> bool {
        CONFIG_SET_BY_IPC.load(std::sync::atomic::Ordering::Acquire)
    }

    pub fn clear(vram: bool, encode: bool) {
        log::info!("clear hwcodec config, vram: {vram}, encode: {encode}");
        #[cfg(target_os = "android")]
        crate::android::ffi::clear_codec_info();
        #[cfg(not(target_os = "android"))]
        {
            let mut c = CONFIG.write().unwrap();
            if let Some(c) = c.as_mut() {
                if vram {
                    #[cfg(feature = "vram")]
                    if encode {
                        c.vram_encode = vec![];
                    } else {
                        c.vram_decode = vec![];
                    }
                } else {
                    if encode {
                        c.ram_encode = vec![];
                    } else {
                        c.ram_decode = vec![];
                    }
                }
            }
        }
        crate::codec::Encoder::update(crate::codec::EncodingUpdate::Check);
    }
}

pub fn check_available_hwcodec() -> String {
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    hwcodec::common::setup_parent_death_signal();
    let ctx = EncodeContext {
        name: String::from(""),
        mc_name: None,
        width: 1280,
        height: 720,
        pixfmt: DEFAULT_PIXFMT,
        align: HW_STRIDE_ALIGN as _,
        kbs: 1000,
        fps: DEFAULT_FPS,
        gop: DEFAULT_GOP,
        quality: DEFAULT_HW_QUALITY,
        rc: RC_CBR,
        q: -1,
        thread_count: 4,
    };
    #[cfg(feature = "vram")]
    let vram = crate::vram::check_available_vram();
    #[cfg(feature = "vram")]
    let vram_string = vram.2;
    #[cfg(not(feature = "vram"))]
    let vram_string = "".to_owned();
    let c = HwCodecConfig {
        ram_encode: Encoder::available_encoders(ctx, Some(vram_string)),
        ram_decode: Decoder::available_decoders(),
        #[cfg(feature = "vram")]
        vram_encode: vram.0,
        #[cfg(feature = "vram")]
        vram_decode: vram.1,
        signature: hwcodec::common::get_gpu_signature(),
    };
    log::debug!("{c:?}");
    serde_json::to_string(&c).unwrap_or_default()
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
pub fn start_check_process() {
    if !enable_hwcodec_option() || HwCodecConfig::already_set() {
        return;
    }
    use hbb_common::allow_err;
    use std::sync::Once;
    let f = || {
        if let Ok(exe) = std::env::current_exe() {
            if let Some(_) = exe.file_name().to_owned() {
                let arg = "--check-hwcodec-config";
                if let Ok(mut child) = std::process::Command::new(exe).arg(arg).spawn() {
                    #[cfg(windows)]
                    hwcodec::common::child_exit_when_parent_exit(child.id());
                    // wait up to 30 seconds with fine-grained polling for faster response
                    for _ in 0..300 {
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        if let Ok(Some(_)) = child.try_wait() {
                            break;
                        }
                    }
                    allow_err!(child.kill());
                    std::thread::sleep(std::time::Duration::from_millis(30));
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            log::info!("Check hwcodec config, exit with: {status}")
                        }
                        Ok(None) => {
                            log::info!(
                                "Check hwcodec config, status not ready yet, let's really wait"
                            );
                            let res = child.wait();
                            log::info!("Check hwcodec config, wait result: {res:?}");
                        }
                        Err(e) => {
                            log::error!("Check hwcodec config, error attempting to wait: {e}")
                        }
                    }
                }
            }
        };
    };
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        std::thread::spawn(f);
    });
}
