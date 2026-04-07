use crate::codec::EncoderApi;
use crate::{EncodeInput, EncodeYuvFormat, ImageFormat, ImageRgb, Pixfmt};
use hbb_common::anyhow::bail;
use hbb_common::log;
use hbb_common::message_proto::{EncodedVideoFrame, EncodedVideoFrames, VideoFrame};
use hbb_common::ResultType;

const TILE_SIZE: usize = 32;
const KEYFRAME_INTERVAL: u64 = 150;
const FPS_LIMIT_MS: i64 = 66;

const TILE_SKIP: u8 = 0;
const TILE_SOLID: u8 = 1;
const TILE_RAW: u8 = 2;
const TILE_DIFF: u8 = 3;
const TILE_SCROLL: u8 = 4;
const TILE_PALETTE: u8 = 5; // Palette + RLE: 10-15x compression for UI/text tiles

const MAX_PALETTE: usize = 2; // Only pure text tiles (2-color: text + background)

const DIFF_TO_RAW_THRESHOLD: usize = (TILE_SIZE * TILE_SIZE * 3) / 4;

// Adaptive Zstd: heavy frames get fast compression, light frames get deep compression
const ZSTD_LEVEL_LIGHT: i32 = 6;  // <50KB raw → squeeze harder
const ZSTD_LEVEL_HEAVY: i32 = 1;  // >50KB raw → speed priority
const LIGHT_THRESHOLD: usize = 500 * 1024; // <500KB raw → light frame, squeeze harder

// Scroll detection: max pixels to search vertically
// const SCROLL_SEARCH_RANGE: i32 = 256;

#[derive(Debug, Clone)]
pub struct SccEncoderConfig {
    pub width: usize,
    pub height: usize,
}

pub struct SccEncoder {
    width: usize,
    height: usize,
    stride: usize,
    prev_frame: Vec<u16>,
    prev_row_hashes: Vec<u64>, // Row hashes from raw BGRA input (independent of prev_frame)
    out_buf: Vec<u8>,
    tile_buf: Vec<u16>,
    frame_count: u64,
    last_pts: i64,
    cached_skip_payload: Vec<u8>,
    cached_skip_dims: (usize, usize),
    yuvfmt: EncodeYuvFormat,
}

impl EncoderApi for SccEncoder {
    fn new(cfg: crate::codec::EncoderCfg, _i444: bool) -> ResultType<Self>
    where
        Self: Sized,
    {
        match cfg {
            crate::codec::EncoderCfg::SCC(c) => {
                let stride = c.width * 4;
                let tiles = ((c.width + TILE_SIZE - 1) / TILE_SIZE)
                    * ((c.height + TILE_SIZE - 1) / TILE_SIZE);
                Ok(Self {
                    width: c.width,
                    height: c.height,
                    stride,
                    prev_frame: vec![0u16; c.width * c.height],
                    prev_row_hashes: vec![0u64; c.height],
                    out_buf: Vec::with_capacity(9 + tiles + 2 * c.width * c.height),
                    tile_buf: vec![0u16; TILE_SIZE * TILE_SIZE],
                    frame_count: 0,
                    last_pts: 0,
                    cached_skip_payload: Vec::new(),
                    cached_skip_dims: (0, 0),
                    yuvfmt: EncodeYuvFormat {
                        pixfmt: Pixfmt::BGRA,
                        w: c.width,
                        h: c.height,
                        stride: [stride, 0, 0, 0],
                        u: 0,
                        v: 0,
                    },
                })
            }
            _ => bail!("SccEncoder::new called with non-SCC config"),
        }
    }

    fn encode_to_message(&mut self, input: EncodeInput, ms: i64) -> ResultType<VideoFrame> {
        let (data, w, h, src_stride) = match &input {
            EncodeInput::BGRA(d, w, h, stride) => (*d, *w, *h, *stride),
            _ => bail!("SCC encoder requires BGRA input"),
        };

        let resized = w != self.width || h != self.height;
        if !resized
            && self.last_pts != 0
            && ms > self.last_pts
            && (ms - self.last_pts) < FPS_LIMIT_MS
        {
            return self.make_skip_frame(ms);
        }
        self.last_pts = ms;

        if resized {
            self.width = w;
            self.height = h;
            self.stride = w * 4;
            self.prev_frame = vec![0u16; w * h];
            self.prev_row_hashes = vec![0u64; h];
            self.frame_count = 0;
            self.yuvfmt.w = w;
            self.yuvfmt.h = h;
            self.yuvfmt.stride[0] = self.stride;
            self.cached_skip_dims = (0, 0);
        }

        let is_key = self.frame_count == 0 || self.frame_count % KEYFRAME_INTERVAL == 0;

        // ── Scroll detection via independent row hashes ──
        // Compute current frame's row hashes from raw BGRA (not affected by prev_frame tolerance)
        let mut cur_row_hashes = Vec::with_capacity(h);
        for row in 0..h {
            cur_row_hashes.push(Self::hash_bgra_row(data, row, w, src_stride));
        }

        if false && !is_key && self.frame_count > 1 { // TODO: scroll encoding needs prev_frame sync fix
            if let Some(dy) = self.detect_scroll_from_hashes(&cur_row_hashes, h) {
                {
                    use std::io::Write;
                    static COUNT: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(0);
                    let n = COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    if n < 20 {
                        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true)
                            .open("C:\\ProgramData\\scc_debug.log") {
                            let _ = writeln!(f, "[SCC-SCROLL] #{} dy={}", n, dy);
                        }
                    }
                }
                // Store current hashes for next frame BEFORE encoding scroll
                self.prev_row_hashes = cur_row_hashes;
                let vf = self.encode_scroll_frame(data, w, h, src_stride, dy, ms)?;
                self.frame_count += 1;
                return Ok(vf);
            }
        }

        // Store hashes for next frame's scroll detection
        self.prev_row_hashes = cur_row_hashes;

        // ── Normal tile-based encoding ──
        let tiles_x = (w + TILE_SIZE - 1) / TILE_SIZE;
        let tiles_y = (h + TILE_SIZE - 1) / TILE_SIZE;

        self.out_buf.clear();
        let out = &mut self.out_buf;

        out.extend_from_slice(&(w as u16).to_le_bytes());
        out.extend_from_slice(&(h as u16).to_le_bytes());
        out.extend_from_slice(&(tiles_x as u16).to_le_bytes());
        out.extend_from_slice(&(tiles_y as u16).to_le_bytes());
        out.push(if is_key { 1 } else { 0 });

        for ty in 0..tiles_y {
            for tx in 0..tiles_x {
                let x0 = tx * TILE_SIZE;
                let y0 = ty * TILE_SIZE;
                let tw = TILE_SIZE.min(w - x0);
                let th = TILE_SIZE.min(h - y0);
                let pixels = tw * th;

                // Single-pass: BGRA→RGB565 + unchanged/solid/diff_count
                let mut unchanged = true;
                let mut is_solid = true;
                let mut diff_count: usize = 0;

                for row in 0..th {
                    let src_off = (y0 + row) * src_stride + x0 * 4;
                    let prev_off = (y0 + row) * w + x0;
                    for col in 0..tw {
                        let s = src_off + col * 4;
                        let cur = bgra_to_rgb565(data[s], data[s + 1], data[s + 2]);
                        let idx = row * tw + col;
                        self.tile_buf[idx] = cur;

                        if !is_key {
                            let prev = self.prev_frame[prev_off + col];
                            // Tolerance=1 for SKIP decision (absorbs GDI noise)
                            // Encoding still uses exact values (no visual drift)
                            if !is_similar_565(cur, prev, 1) {
                                unchanged = false;
                                diff_count += 1;
                            }
                        } else {
                            unchanged = false;
                        }

                        if idx > 0 && cur != self.tile_buf[0] {
                            is_solid = false;
                        }
                    }
                }

                if unchanged {
                    out.push(TILE_SKIP);
                    continue;
                }

                if is_solid {
                    out.push(TILE_SOLID);
                    out.extend_from_slice(&self.tile_buf[0].to_le_bytes());
                    let val = self.tile_buf[0];
                    for row in 0..th {
                        let off = (y0 + row) * w + x0;
                        for col in 0..tw {
                            self.prev_frame[off + col] = val;
                        }
                    }
                    continue;
                }

                // Palette + RLE for low-color UI/text tiles (biggest win for screen content)
                let palette = build_palette_fast(&self.tile_buf, tw * th);
                if palette.len() > 0 && palette.len() <= MAX_PALETTE {
                    out.push(TILE_PALETTE);
                    out.push(palette.len() as u8);
                    for &c in &palette {
                        out.extend_from_slice(&c.to_le_bytes());
                    }
                    // RLE on palette indices: encode as (count, index) pairs
                    encode_palette_rle(out, &self.tile_buf, tw, th, &palette);
                    // Update prev_frame
                    for row in 0..th {
                        let off = (y0 + row) * w + x0;
                        for col in 0..tw {
                            self.prev_frame[off + col] = self.tile_buf[row * tw + col];
                        }
                    }
                } else if is_key || diff_count > DIFF_TO_RAW_THRESHOLD {
                    out.push(TILE_RAW);
                    // Paeth-predict then planar split
                    encode_tile_paeth_planar(out, &self.tile_buf, tw, th);
                    for row in 0..th {
                        let off = (y0 + row) * w + x0;
                        for col in 0..tw {
                            self.prev_frame[off + col] = self.tile_buf[row * tw + col];
                        }
                    }
                } else {
                    out.push(TILE_DIFF);
                    // Subtraction diff + planar
                    for row in 0..th {
                        let off = (y0 + row) * w + x0;
                        for col in 0..tw {
                            let diff = self.tile_buf[row * tw + col]
                                .wrapping_sub(self.prev_frame[off + col]);
                            out.push((diff & 0xFF) as u8);
                        }
                    }
                    for row in 0..th {
                        let off = (y0 + row) * w + x0;
                        for col in 0..tw {
                            let cur = self.tile_buf[row * tw + col];
                            let diff = cur.wrapping_sub(self.prev_frame[off + col]);
                            out.push((diff >> 8) as u8);
                            self.prev_frame[off + col] = cur;
                        }
                    }
                }
            }
        }

        self.frame_count += 1;

        // Adaptive Zstd level
        let level = if out.len() < LIGHT_THRESHOLD {
            ZSTD_LEVEL_LIGHT
        } else {
            ZSTD_LEVEL_HEAVY
        };
        let compressed =
            zstd::bulk::compress(out, level).unwrap_or_else(|_| lz4_flex::compress_prepend_size(out));

        // Stats for first 10 frames
        if self.frame_count <= 10 {
            use std::io::Write;
            if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true)
                .open("C:\\ProgramData\\scc_debug.log")
            {
                let _ = writeln!(f, "[SCC] f={} raw={}B zstd_lv{}={}B ratio={:.1}%",
                    self.frame_count, out.len(), level, compressed.len(),
                    compressed.len() as f64 / out.len().max(1) as f64 * 100.0);
            }
        }

        self.wrap_frame(compressed, is_key, ms)
    }

    fn yuvfmt(&self) -> &EncodeYuvFormat { &self.yuvfmt }
    #[cfg(feature = "vram")]
    fn input_texture(&self) -> bool { false }
    fn set_quality(&mut self, _ratio: f32) -> ResultType<()> { Ok(()) }
    fn bitrate(&self) -> u32 { 0 }
    fn support_changing_quality(&self) -> bool { false }
    fn latency_free(&self) -> bool { true }
    fn is_hardware(&self) -> bool { false }
    fn disable(&self) { log::warn!("SCC encoder disable()"); }
}

impl SccEncoder {
    // ── Scroll detection ──

    /// Hash a BGRA row to u64 (sampled every 4th pixel for speed)
    fn hash_bgra_row(data: &[u8], row: usize, w: usize, src_stride: usize) -> u64 {
        let off = row * src_stride;
        let mut h: u64 = 0xcbf29ce484222325;
        for col in (0..w).step_by(4) {
            let s = off + col * 4;
            // Hash raw RGB bytes (not RGB565) for consistency
            h ^= (data[s] as u64) | ((data[s+1] as u64) << 8) | ((data[s+2] as u64) << 16);
            h = h.wrapping_mul(0x100000001b3);
        }
        h
    }

    /// Compute and store row hashes for current frame (call EVERY frame)
    #[allow(dead_code)]
    fn update_row_hashes(&mut self, data: &[u8], w: usize, h: usize, src_stride: usize) {
        self.prev_row_hashes.resize(h, 0);
        for row in 0..h {
            self.prev_row_hashes[row] = Self::hash_bgra_row(data, row, w, src_stride);
        }
    }

    /// Detect scroll by comparing current row hashes against previous row hashes.
    /// Independent of prev_frame (which has gaps from tolerance-skipped tiles).
    fn detect_scroll_from_hashes(&self, cur_hashes: &[u64], h: usize) -> Option<i32> {
        if h < 64 || self.prev_row_hashes.len() != h { return None; }

        // Pick 5 reference rows spread across the frame
        let refs = [h/6, h/3, h/2, h*2/3, h*5/6];
        let max_dy = (h / 3) as i32; // Search ±1/3 of screen height

        let mut votes = std::collections::HashMap::<i32, usize>::new();

        for &ref_row in &refs {
            let cur_hash = cur_hashes[ref_row];
            // Search prev_row_hashes for this hash
            let lo = (ref_row as i32 - max_dy).max(0) as usize;
            let hi = ((ref_row as i32 + max_dy) as usize).min(h);
            for prev_row in lo..hi {
                if self.prev_row_hashes[prev_row] == cur_hash {
                    let dy = prev_row as i32 - ref_row as i32;
                    if dy != 0 && dy.abs() >= 4 {
                        *votes.entry(dy).or_insert(0) += 1;
                    }
                }
            }
        }

        // Need ≥3 out of 5 refs agreeing
        votes.into_iter()
            .filter(|&(_, c)| c >= 3)
            .max_by_key(|&(_, c)| c)
            .map(|(dy, _)| dy)
    }

    /// Encode a scroll frame: TILE_SCROLL header + residual tiles for edges
    fn encode_scroll_frame(
        &mut self, data: &[u8], w: usize, h: usize, src_stride: usize, dy: i32, ms: i64,
    ) -> ResultType<VideoFrame> {
        let tiles_x = (w + TILE_SIZE - 1) / TILE_SIZE;
        let tiles_y = (h + TILE_SIZE - 1) / TILE_SIZE;

        // Build new prev_frame by scrolling
        let mut new_prev = vec![0u16; w * h];

        // Copy scrolled content from prev_frame
        for row in 0..h {
            let src_row = row as i32 + dy;
            let dst_off = row * w;
            if src_row >= 0 && (src_row as usize) < h {
                let src_off = src_row as usize * w;
                new_prev[dst_off..dst_off + w].copy_from_slice(&self.prev_frame[src_off..src_off + w]);
            }
            // Rows that fall outside bounds stay 0 (will be encoded as dirty)
        }

        self.out_buf.clear();
        let out = &mut self.out_buf;

        out.extend_from_slice(&(w as u16).to_le_bytes());
        out.extend_from_slice(&(h as u16).to_le_bytes());
        out.extend_from_slice(&(tiles_x as u16).to_le_bytes());
        out.extend_from_slice(&(tiles_y as u16).to_le_bytes());
        out.push(0); // not keyframe

        // First byte after header: TILE_SCROLL marker with dy
        out.push(TILE_SCROLL);
        out.extend_from_slice(&(dy as i16).to_le_bytes());

        // Now encode residual tiles against the scrolled prev
        for ty in 0..tiles_y {
            for tx in 0..tiles_x {
                let x0 = tx * TILE_SIZE;
                let y0 = ty * TILE_SIZE;
                let tw = TILE_SIZE.min(w - x0);
                let th = TILE_SIZE.min(h - y0);

                // Convert tile to RGB565
                let mut unchanged = true;
                for row in 0..th {
                    let src_off = (y0 + row) * src_stride + x0 * 4;
                    let prev_off = (y0 + row) * w + x0;
                    for col in 0..tw {
                        let s = src_off + col * 4;
                        let cur = bgra_to_rgb565(data[s], data[s + 1], data[s + 2]);
                        self.tile_buf[row * tw + col] = cur;
                        if cur != new_prev[prev_off + col] {
                            unchanged = false;
                        }
                    }
                }

                if unchanged {
                    out.push(TILE_SKIP);
                } else {
                    // Check if solid
                    let first = self.tile_buf[0];
                    let tile_buf = &self.tile_buf;
                    let mut is_solid = true;
                    for i in 1..tw * th {
                        if tile_buf[i] != first { is_solid = false; break; }
                    }
                    if is_solid {
                        out.push(TILE_SOLID);
                        out.extend_from_slice(&first.to_le_bytes());
                    } else {
                        out.push(TILE_DIFF);
                        for row in 0..th {
                            let off = (y0 + row) * w + x0;
                            for col in 0..tw {
                                let diff = self.tile_buf[row * tw + col]
                                    .wrapping_sub(new_prev[off + col]);
                                out.push((diff & 0xFF) as u8);
                            }
                        }
                        for row in 0..th {
                            let off = (y0 + row) * w + x0;
                            for col in 0..tw {
                                let diff = self.tile_buf[row * tw + col]
                                    .wrapping_sub(new_prev[off + col]);
                                out.push((diff >> 8) as u8);
                            }
                        }
                    }
                }

                // Update prev_frame
                for row in 0..th {
                    let off = (y0 + row) * w + x0;
                    for col in 0..tw {
                        self.prev_frame[off + col] = self.tile_buf[row * tw + col];
                    }
                }
            }
        }

        let level = if out.len() < LIGHT_THRESHOLD { ZSTD_LEVEL_LIGHT } else { ZSTD_LEVEL_HEAVY };
        let compressed = zstd::bulk::compress(out, level)
            .unwrap_or_else(|_| lz4_flex::compress_prepend_size(out));

        self.wrap_frame(compressed, false, ms)
    }

    fn make_skip_frame(&mut self, ms: i64) -> ResultType<VideoFrame> {
        if self.cached_skip_dims != (self.width, self.height) {
            let tiles_x = (self.width + TILE_SIZE - 1) / TILE_SIZE;
            let tiles_y = (self.height + TILE_SIZE - 1) / TILE_SIZE;
            let mut buf = Vec::with_capacity(9 + tiles_x * tiles_y);
            buf.extend_from_slice(&(self.width as u16).to_le_bytes());
            buf.extend_from_slice(&(self.height as u16).to_le_bytes());
            buf.extend_from_slice(&(tiles_x as u16).to_le_bytes());
            buf.extend_from_slice(&(tiles_y as u16).to_le_bytes());
            buf.push(0);
            buf.resize(9 + tiles_x * tiles_y, TILE_SKIP);
            self.cached_skip_payload = zstd::bulk::compress(&buf, 1)
                .unwrap_or_else(|_| lz4_flex::compress_prepend_size(&buf));
            self.cached_skip_dims = (self.width, self.height);
        }
        self.wrap_frame(self.cached_skip_payload.clone(), false, ms)
    }

    fn wrap_frame(&self, compressed: Vec<u8>, is_key: bool, ms: i64) -> ResultType<VideoFrame> {
        let mut frame = EncodedVideoFrame::new();
        frame.data = compressed.into();
        frame.key = is_key;
        frame.pts = ms;
        let mut frames = EncodedVideoFrames::new();
        frames.frames.push(frame);
        let mut vf = VideoFrame::new();
        vf.set_sccs(frames);
        Ok(vf)
    }
}

// ── Paeth prediction (PNG-style) ──

/// Paeth predictor: predict from left (a), above (b), upper-left (c)
#[inline(always)]
fn paeth_predict(a: u16, b: u16, c: u16) -> u16 {
    let p = a as i32 + b as i32 - c as i32;
    let pa = (p - a as i32).unsigned_abs();
    let pb = (p - b as i32).unsigned_abs();
    let pc = (p - c as i32).unsigned_abs();
    if pa <= pb && pa <= pc { a } else if pb <= pc { b } else { c }
}

/// Encode tile with Paeth prediction + planar byte split.
/// Residuals after Paeth are smaller → Zstd compresses much better.
fn encode_tile_paeth_planar(out: &mut Vec<u8>, tile: &[u16], tw: usize, th: usize) {
    let pixels = tw * th;
    let _start = out.len();
    out.reserve(pixels * 2);

    // Low bytes with Paeth prediction
    for row in 0..th {
        for col in 0..tw {
            let cur = tile[row * tw + col];
            let a = if col > 0 { tile[row * tw + col - 1] } else { 0 };
            let b = if row > 0 { tile[(row - 1) * tw + col] } else { 0 };
            let c = if row > 0 && col > 0 { tile[(row - 1) * tw + col - 1] } else { 0 };
            let predicted = paeth_predict(a, b, c);
            let residual = cur.wrapping_sub(predicted);
            out.push((residual & 0xFF) as u8);
        }
    }
    // High bytes with Paeth prediction
    for row in 0..th {
        for col in 0..tw {
            let cur = tile[row * tw + col];
            let a = if col > 0 { tile[row * tw + col - 1] } else { 0 };
            let b = if row > 0 { tile[(row - 1) * tw + col] } else { 0 };
            let c = if row > 0 && col > 0 { tile[(row - 1) * tw + col - 1] } else { 0 };
            let predicted = paeth_predict(a, b, c);
            let residual = cur.wrapping_sub(predicted);
            out.push((residual >> 8) as u8);
        }
    }
}

// ── Decoder ──────────────────────────────────────────────────────────────

pub struct SccDecoder {
    width: usize,
    height: usize,
    frame_buffer: Vec<u16>,
}

impl SccDecoder {
    pub fn new() -> Self {
        Self { width: 0, height: 0, frame_buffer: Vec::new() }
    }

    pub fn decode(&mut self, data: &[u8], rgb: &mut ImageRgb) -> ResultType<bool> {
        if data.is_empty() { return Ok(false); }

        let decompressed = zstd::bulk::decompress(data, 64 * 1024 * 1024)
            .or_else(|_| lz4_flex::decompress_size_prepended(data)
                .map_err(|e| hbb_common::anyhow::anyhow!("decompress failed: {}", e)))?;

        if decompressed.len() < 9 { bail!("SCC frame too short"); }

        let mut pos = 0;
        let w = read_u16(&decompressed, &mut pos) as usize;
        let h = read_u16(&decompressed, &mut pos) as usize;
        let tiles_x = read_u16(&decompressed, &mut pos) as usize;
        let tiles_y = read_u16(&decompressed, &mut pos) as usize;
        let is_key = decompressed[pos] != 0; pos += 1;

        if w == 0 || h == 0 { bail!("SCC invalid dimensions"); }

        if w != self.width || h != self.height {
            self.width = w;
            self.height = h;
            self.frame_buffer = vec![0u16; w * h];
        }

        let mut any_dirty = false;

        // Check for TILE_SCROLL header
        if pos < decompressed.len() && decompressed[pos] == TILE_SCROLL {
            pos += 1;
            if pos + 2 > decompressed.len() { bail!("SCC truncated scroll"); }
            let dy = i16::from_le_bytes([decompressed[pos], decompressed[pos + 1]]) as i32;
            pos += 2;
            any_dirty = true;

            // Apply scroll to frame_buffer
            let mut scrolled = vec![0u16; w * h];
            for row in 0..h {
                let src_row = row as i32 - dy; // Note: decoder reverses the direction
                if src_row >= 0 && (src_row as usize) < h {
                    let s = src_row as usize * w;
                    let d = row * w;
                    scrolled[d..d + w].copy_from_slice(&self.frame_buffer[s..s + w]);
                }
            }
            self.frame_buffer = scrolled;
        }

        // Decode residual tiles
        for ty in 0..tiles_y {
            for tx in 0..tiles_x {
                if pos >= decompressed.len() { bail!("SCC truncated"); }
                let tile_type = decompressed[pos]; pos += 1;
                let x0 = tx * TILE_SIZE;
                let y0 = ty * TILE_SIZE;
                let tw = TILE_SIZE.min(w - x0);
                let th = TILE_SIZE.min(h - y0);

                match tile_type {
                    TILE_SKIP => {}
                    TILE_SOLID => {
                        if pos + 2 > decompressed.len() { bail!("truncated solid"); }
                        let val = u16::from_le_bytes([decompressed[pos], decompressed[pos + 1]]);
                        pos += 2;
                        any_dirty = true;
                        for row in 0..th {
                            let off = (y0 + row) * w + x0;
                            for col in 0..tw { self.frame_buffer[off + col] = val; }
                        }
                    }
                    TILE_RAW => {
                        let pixels = tw * th;
                        if pos + pixels * 2 > decompressed.len() { bail!("truncated raw"); }
                        any_dirty = true;
                        // Paeth de-predict + planar reassemble
                        let low = &decompressed[pos..pos + pixels];
                        let high = &decompressed[pos + pixels..pos + pixels * 2];
                        pos += pixels * 2;
                        decode_tile_paeth_planar(
                            &mut self.frame_buffer, low, high, x0, y0, tw, th, w,
                        );
                    }
                    TILE_DIFF => {
                        let pixels = tw * th;
                        if pos + pixels * 2 > decompressed.len() { bail!("truncated diff"); }
                        any_dirty = true;
                        let low = &decompressed[pos..pos + pixels];
                        let high = &decompressed[pos + pixels..pos + pixels * 2];
                        pos += pixels * 2;
                        let mut i = 0;
                        for row in 0..th {
                            let off = (y0 + row) * w + x0;
                            for col in 0..tw {
                                let diff = (low[i] as u16) | ((high[i] as u16) << 8);
                                self.frame_buffer[off + col] =
                                    self.frame_buffer[off + col].wrapping_add(diff);
                                i += 1;
                            }
                        }
                    }
                    TILE_PALETTE => {
                        if pos >= decompressed.len() { bail!("truncated palette"); }
                        let num_colors = decompressed[pos] as usize; pos += 1;
                        if pos + num_colors * 2 > decompressed.len() { bail!("truncated palette colors"); }
                        let mut palette = Vec::with_capacity(num_colors);
                        for _ in 0..num_colors {
                            palette.push(u16::from_le_bytes([decompressed[pos], decompressed[pos+1]]));
                            pos += 2;
                        }
                        any_dirty = true;
                        pos = decode_palette_rle(&decompressed, pos, &mut self.frame_buffer,
                            &palette, x0, y0, tw, th, w)?;
                    }
                    _ => bail!("SCC unknown tile type: {}", tile_type),
                }
            }
        }

        if !any_dirty && !is_key { return Ok(false); }

        // RGB565 → output
        rgb.w = w;
        rgb.h = h;
        let dst_align = if rgb.align > 0 { rgb.align } else { 1 };
        let dst_stride = (w * 4 + dst_align - 1) & !(dst_align - 1);
        if rgb.raw.len() != h * dst_stride { rgb.raw.resize(h * dst_stride, 0); }
        let needs_rb_swap = matches!(rgb.fmt, ImageFormat::ABGR);

        for row in 0..h {
            let src_off = row * w;
            let dst_off = row * dst_stride;
            for col in 0..w {
                let val = self.frame_buffer[src_off + col];
                let d = dst_off + col * 4;
                let r5 = ((val >> 11) & 0x1F) as u8;
                let g6 = ((val >> 5) & 0x3F) as u8;
                let b5 = (val & 0x1F) as u8;
                let r8 = (r5 << 3) | (r5 >> 2);
                let g8 = (g6 << 2) | (g6 >> 4);
                let b8 = (b5 << 3) | (b5 >> 2);
                if needs_rb_swap {
                    rgb.raw[d] = r8; rgb.raw[d + 1] = g8; rgb.raw[d + 2] = b8;
                } else {
                    rgb.raw[d] = b8; rgb.raw[d + 1] = g8; rgb.raw[d + 2] = r8;
                }
                rgb.raw[d + 3] = 255;
            }
        }

        Ok(true)
    }
}

/// Decode Paeth-predicted tile from planar layout
fn decode_tile_paeth_planar(
    fb: &mut [u16], low: &[u8], high: &[u8],
    x0: usize, y0: usize, tw: usize, th: usize, w: usize,
) {
    // First reconstruct the residuals into a temp buffer, then de-predict
    let pixels = tw * th;
    let mut tile = vec![0u16; pixels]; // Could be optimized with a reusable buffer

    // Reassemble u16 from planar
    for i in 0..pixels {
        tile[i] = (low[i] as u16) | ((high[i] as u16) << 8);
    }

    // De-predict (reverse Paeth): cur = residual + predict(a, b, c)
    for row in 0..th {
        for col in 0..tw {
            let idx = row * tw + col;
            let a = if col > 0 { tile[row * tw + col - 1] } else { 0 };
            let b = if row > 0 { tile[(row - 1) * tw + col] } else { 0 };
            let c = if row > 0 && col > 0 { tile[(row - 1) * tw + col - 1] } else { 0 };
            let predicted = paeth_predict(a, b, c);
            tile[idx] = tile[idx].wrapping_add(predicted);
        }
    }

    // Write to frame buffer
    for row in 0..th {
        let off = (y0 + row) * w + x0;
        for col in 0..tw {
            fb[off + col] = tile[row * tw + col];
        }
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────

#[inline(always)]
fn bgra_to_rgb565(b: u8, g: u8, r: u8) -> u16 {
    (((r as u16) & 0xF8) << 8) | (((g as u16) & 0xFC) << 3) | ((b as u16) >> 3)
}

#[inline]
fn read_u16(data: &[u8], pos: &mut usize) -> u16 {
    let v = u16::from_le_bytes([data[*pos], data[*pos + 1]]);
    *pos += 2;
    v
}

/// Fast palette extraction: scan tile pixels, bail if >MAX_PALETTE unique colors
fn build_palette_fast(tile: &[u16], count: usize) -> Vec<u16> {
    let mut palette: Vec<u16> = Vec::with_capacity(MAX_PALETTE + 1);
    for i in 0..count {
        let c = tile[i];
        if !palette.contains(&c) {
            palette.push(c);
            if palette.len() > MAX_PALETTE {
                return Vec::new(); // Too many colors, bail
            }
        }
    }
    palette
}

/// Encode palette indices with RLE: (run_length, index) pairs
/// For a 2-color text tile with large solid runs, this crushes data to ~20 bytes
fn encode_palette_rle(out: &mut Vec<u8>, tile: &[u16], tw: usize, th: usize, palette: &[u16]) {
    let total = tw * th;
    let mut i = 0;
    while i < total {
        let idx = palette.iter().position(|&c| c == tile[i]).unwrap_or(0) as u8;
        let mut run: usize = 1;
        while i + run < total && tile[i + run] == tile[i] && run < 255 {
            run += 1;
        }
        out.push(run as u8);
        out.push(idx);
        i += run;
    }
}

/// Decode RLE palette indices back to RGB565 pixels in frame_buffer
fn decode_palette_rle(
    data: &[u8], mut pos: usize, fb: &mut [u16],
    palette: &[u16], x0: usize, y0: usize, tw: usize, th: usize, w: usize,
) -> ResultType<usize> {
    let total = tw * th;
    let mut pixel_idx = 0;
    while pixel_idx < total {
        if pos + 2 > data.len() { bail!("truncated palette RLE"); }
        let run = data[pos] as usize; pos += 1;
        let idx = data[pos] as usize; pos += 1;
        if run == 0 { continue; } // Safety: prevent infinite loop on corrupt data
        let color = if idx < palette.len() { palette[idx] } else { 0 };
        let end = (pixel_idx + run).min(total);
        while pixel_idx < end {
            let row = pixel_idx / tw;
            let col = pixel_idx % tw;
            fb[(y0 + row) * w + x0 + col] = color;
            pixel_idx += 1;
        }
    }
    Ok(pos)
}

#[inline(always)]
fn is_similar_565(a: u16, b: u16, tol: u8) -> bool {
    if a == b { return true; }
    let t = tol as i16;
    let ar = ((a >> 11) & 0x1F) as i16;
    let ag = ((a >> 5) & 0x3F) as i16;
    let ab = (a & 0x1F) as i16;
    let br = ((b >> 11) & 0x1F) as i16;
    let bg = ((b >> 5) & 0x3F) as i16;
    let bb = (b & 0x1F) as i16;
    (ar - br).abs() <= t && (ag - bg).abs() <= t && (ab - bb).abs() <= t
}
