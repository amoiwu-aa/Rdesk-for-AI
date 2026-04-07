use hbb_common::{anyhow::Error, bail, log, ResultType};
use ndk::media::media_codec::{MediaCodec, MediaCodecDirection, MediaFormat};
use std::ops::Deref;
use std::{
    io::Write,
    sync::atomic::{AtomicBool, Ordering},
    time::Duration,
};

use crate::ImageFormat;
use crate::{
    codec::{EncoderApi, EncoderCfg},
    CodecFormat, I420ToABGR, I420ToARGB, ImageRgb,
};

/// MediaCodec mime type name
const H264_MIME_TYPE: &str = "video/avc";
const H265_MIME_TYPE: &str = "video/hevc";

// TODO MediaCodecEncoder
// Full implementation requires:
// 1. Add MediaCodec variant to EncoderCfg in codec.rs
// 2. Implement EncoderApi trait for MediaCodecEncoder
// 3. Wire up in Encoder::new() and codec selection logic
// 4. Test on Android devices with hardware H.264/H.265 encoder support

pub struct MediaCodecEncoder {
    encoder: MediaCodec,
    codec_name: String,
    width: usize,
    height: usize,
    bitrate: u32,
}

pub static H264_ENCODER_SUPPORT: AtomicBool = AtomicBool::new(false);
pub static H265_ENCODER_SUPPORT: AtomicBool = AtomicBool::new(false);

impl MediaCodecEncoder {
    pub fn new(mime: &str, width: usize, height: usize, bitrate: u32) -> Option<Self> {
        let codec = MediaCodec::from_encoder_type(mime)?;
        let format = MediaFormat::new();
        format.set_str("mime", mime);
        format.set_i32("width", width as i32);
        format.set_i32("height", height as i32);
        format.set_i32("bitrate", bitrate as i32);
        format.set_i32("frame-rate", 30);
        format.set_i32("color-format", 19); // COLOR_FormatYUV420Planar
        format.set_i32("i-frame-interval", 2); // keyframe every 2 seconds
        if let Err(e) = codec.configure(&format, None, MediaCodecDirection::Encoder) {
            log::error!("Failed to configure encoder: {:?}", e);
            return None;
        }
        if let Err(e) = codec.start() {
            log::error!("Failed to start encoder: {:?}", e);
            return None;
        }
        log::info!("MediaCodec encoder init success: {}", mime);
        Some(Self {
            encoder: codec,
            codec_name: mime.to_owned(),
            width,
            height,
            bitrate,
        })
    }

    pub fn encode(&mut self, yuv_data: &[u8], pts: i64) -> ResultType<Option<Vec<u8>>> {
        match self
            .encoder
            .dequeue_input_buffer(Duration::from_millis(10))?
        {
            Some(mut input_buffer) => {
                let mut buf = input_buffer.buffer_mut();
                if yuv_data.len() > buf.len() {
                    bail!("YUV data size exceeds input buffer capacity");
                }
                buf.write_all(yuv_data)?;
                self.encoder
                    .queue_input_buffer(input_buffer, 0, yuv_data.len(), pts as u64, 0)?;
            }
            None => {
                log::debug!("MediaCodec encoder: no input buffer available");
            }
        }

        match self
            .encoder
            .dequeue_output_buffer(Duration::from_millis(10))?
        {
            Some(output_buffer) => {
                let data = output_buffer.buffer().to_vec();
                self.encoder.release_output_buffer(output_buffer, false)?;
                Ok(Some(data))
            }
            None => Ok(None),
        }
    }

    pub fn stop(&self) {
        let _ = self.encoder.stop();
    }
}

pub static H264_DECODER_SUPPORT: AtomicBool = AtomicBool::new(false);
pub static H265_DECODER_SUPPORT: AtomicBool = AtomicBool::new(false);

pub struct MediaCodecDecoder {
    decoder: MediaCodec,
    name: String,
}

impl Deref for MediaCodecDecoder {
    type Target = MediaCodec;

    fn deref(&self) -> &Self::Target {
        &self.decoder
    }
}

impl MediaCodecDecoder {
    pub fn new(format: CodecFormat) -> Option<MediaCodecDecoder> {
        match format {
            CodecFormat::H264 => create_media_codec(H264_MIME_TYPE, MediaCodecDirection::Decoder),
            CodecFormat::H265 => create_media_codec(H265_MIME_TYPE, MediaCodecDirection::Decoder),
            _ => {
                log::error!("Unsupported codec format: {}", format);
                None
            }
        }
    }

    // rgb [in/out] fmt and stride must be set in ImageRgb
    pub fn decode(&mut self, data: &[u8], rgb: &mut ImageRgb) -> ResultType<bool> {
        // take dst_stride into account please
        let dst_stride = rgb.stride();
        match self.dequeue_input_buffer(Duration::from_millis(10))? {
            Some(mut input_buffer) => {
                let mut buf = input_buffer.buffer_mut();
                if data.len() > buf.len() {
                    log::error!("Failed to decode, the input data size is bigger than input buf");
                    bail!("The input data size is bigger than input buf");
                }
                buf.write_all(&data)?;
                self.queue_input_buffer(input_buffer, 0, data.len(), 0, 0)?;
            }
            None => {
                log::debug!("Failed to dequeue_input_buffer: No available input_buffer");
            }
        };

        return match self.dequeue_output_buffer(Duration::from_millis(100))? {
            Some(output_buffer) => {
                let res_format = self.output_format();
                let w = res_format
                    .i32("width")
                    .ok_or(Error::msg("Failed to dequeue_output_buffer, width is None"))?
                    as usize;
                let h = res_format.i32("height").ok_or(Error::msg(
                    "Failed to dequeue_output_buffer, height is None",
                ))? as usize;
                let stride = res_format.i32("stride").ok_or(Error::msg(
                    "Failed to dequeue_output_buffer, stride is None",
                ))?;
                let buf = output_buffer.buffer();
                let bps = 4;
                let u = buf.len() * 2 / 3;
                let v = buf.len() * 5 / 6;
                rgb.raw.resize(h * w * bps, 0);
                let y_ptr = buf.as_ptr();
                let u_ptr = buf[u..].as_ptr();
                let v_ptr = buf[v..].as_ptr();
                unsafe {
                    match rgb.fmt() {
                        ImageFormat::ARGB => {
                            I420ToARGB(
                                y_ptr,
                                stride,
                                u_ptr,
                                stride / 2,
                                v_ptr,
                                stride / 2,
                                rgb.raw.as_mut_ptr(),
                                (w * bps) as _,
                                w as _,
                                h as _,
                            );
                        }
                        ImageFormat::ARGB => {
                            I420ToABGR(
                                y_ptr,
                                stride,
                                u_ptr,
                                stride / 2,
                                v_ptr,
                                stride / 2,
                                rgb.raw.as_mut_ptr(),
                                (w * bps) as _,
                                w as _,
                                h as _,
                            );
                        }
                        _ => {
                            bail!("Unsupported image format");
                        }
                    }
                }
                self.release_output_buffer(output_buffer, false)?;
                Ok(true)
            }
            None => {
                log::debug!("Failed to dequeue_output: No available dequeue_output");
                Ok(false)
            }
        };
    }
}

fn create_media_codec(name: &str, direction: MediaCodecDirection) -> Option<MediaCodecDecoder> {
    let codec = MediaCodec::from_decoder_type(name)?;
    let media_format = MediaFormat::new();
    media_format.set_str("mime", name);
    media_format.set_i32("width", 0);
    media_format.set_i32("height", 0);
    media_format.set_i32("color-format", 19); // COLOR_FormatYUV420Planar
    if let Err(e) = codec.configure(&media_format, None, direction) {
        log::error!("Failed to init decoder: {:?}", e);
        return None;
    };
    log::error!("decoder init success");
    if let Err(e) = codec.start() {
        log::error!("Failed to start decoder: {:?}", e);
        return None;
    };
    log::debug!("Init decoder successed!: {:?}", name);
    return Some(MediaCodecDecoder {
        decoder: codec,
        name: name.to_owned(),
    });
}

pub fn check_mediacodec() {
    std::thread::spawn(move || {
        // check decoders
        let decoders = MediaCodecDecoder::new_decoders();
        H264_DECODER_SUPPORT.swap(decoders.h264.is_some(), Ordering::SeqCst);
        H265_DECODER_SUPPORT.swap(decoders.h265.is_some(), Ordering::SeqCst);
        decoders.h264.map(|d| d.stop());
        decoders.h265.map(|d| d.stop());
        // check encoders
        let h264_enc = MediaCodecEncoder::new(H264_MIME_TYPE, 640, 480, 1_000_000);
        H264_ENCODER_SUPPORT.swap(h264_enc.is_some(), Ordering::SeqCst);
        h264_enc.map(|e| e.stop());
        let h265_enc = MediaCodecEncoder::new(H265_MIME_TYPE, 640, 480, 1_000_000);
        H265_ENCODER_SUPPORT.swap(h265_enc.is_some(), Ordering::SeqCst);
        h265_enc.map(|e| e.stop());
    });
}
