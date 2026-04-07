use std::collections::HashMap;
use std::sync::RwLock;

/// Per-display RGBA frame buffer with double-buffering
#[derive(Default)]
pub struct RgbaData {
    /// Raw RGBA pixel data
    pub data: Vec<u8>,
    /// Whether a new frame is ready to be read
    pub dirty: bool,
    /// Frame width
    pub width: usize,
    /// Frame height
    pub height: usize,
}

/// Manages RGBA frame buffers for all displays in a session
pub struct FrameBufferManager {
    pub displays: RwLock<HashMap<usize, RgbaData>>,
}

impl Default for FrameBufferManager {
    fn default() -> Self {
        Self {
            displays: RwLock::new(HashMap::new()),
        }
    }
}

impl FrameBufferManager {
    /// Store a new frame for a display.
    /// ALWAYS overwrites — never drops a frame. The buffer is swapped for zero-copy reuse.
    /// Returns (width, height) on success.
    pub fn store_frame(
        &self,
        display: usize,
        rgba: &mut scrap::ImageRgb,
    ) -> Option<(usize, usize)> {
        let mut displays = self.displays.write().unwrap();

        let entry = displays.entry(display).or_insert_with(RgbaData::default);
        entry.width = rgba.w;
        entry.height = rgba.h;
        // Swap buffers — rgba.raw gets the old buffer for codec to reuse (avoids allocation)
        std::mem::swap(&mut rgba.raw, &mut entry.data);
        entry.dirty = true;

        Some((entry.width, entry.height))
    }

    /// Get the current frame as raw BGRA bytes.
    /// Clones the data (keeps buffer in place for swap reuse).
    /// Returns None if no new frame since last take.
    pub fn take_frame(&self, display: usize) -> Option<(Vec<u8>, usize, usize)> {
        let mut displays = self.displays.write().unwrap();
        if let Some(entry) = displays.get_mut(&display) {
            if entry.dirty && !entry.data.is_empty() {
                entry.dirty = false;
                // Clone instead of take — keeps the buffer allocated for next swap
                return Some((entry.data.clone(), entry.width, entry.height));
            }
        }
        None
    }

    /// Mark the frame as consumed
    pub fn consume_frame(&self, display: usize) {
        if let Some(entry) = self.displays.write().unwrap().get_mut(&display) {
            entry.dirty = false;
        }
    }
}
