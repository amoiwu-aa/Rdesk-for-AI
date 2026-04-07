use napi::threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode};
use std::sync::{Arc, RwLock};

/// Notification sent when a new video frame is ready
#[derive(Clone, Debug)]
pub struct FrameNotify {
    pub display: usize,
    pub width: usize,
    pub height: usize,
}

/// Thread-safe event emitter wrapping napi ThreadsafeFunction
#[derive(Clone)]
pub struct EventEmitter {
    event_cb: Arc<RwLock<Option<ThreadsafeFunction<String, ErrorStrategy::Fatal>>>>,
    frame_cb: Arc<RwLock<Option<ThreadsafeFunction<String, ErrorStrategy::Fatal>>>>,
}

impl Default for EventEmitter {
    fn default() -> Self {
        Self {
            event_cb: Arc::new(RwLock::new(None)),
            frame_cb: Arc::new(RwLock::new(None)),
        }
    }
}

impl EventEmitter {
    pub fn set_event_callback(&self, cb: ThreadsafeFunction<String, ErrorStrategy::Fatal>) {
        *self.event_cb.write().unwrap() = Some(cb);
    }

    pub fn set_frame_callback(&self, cb: ThreadsafeFunction<String, ErrorStrategy::Fatal>) {
        *self.frame_cb.write().unwrap() = Some(cb);
    }

    pub fn clear_callbacks(&self) {
        *self.event_cb.write().unwrap() = None;
        *self.frame_cb.write().unwrap() = None;
    }

    /// Push a JSON event string to JavaScript
    pub fn push_event(&self, json: String) {
        if let Some(cb) = self.event_cb.read().unwrap().as_ref() {
            cb.call(json, ThreadsafeFunctionCallMode::NonBlocking);
        }
    }

    /// Notify JavaScript that a new frame is ready
    pub fn notify_frame(&self, notify: FrameNotify) {
        if let Some(cb) = self.frame_cb.read().unwrap().as_ref() {
            let json = serde_json::json!({
                "display": notify.display,
                "width": notify.width,
                "height": notify.height,
            })
            .to_string();
            cb.call(json, ThreadsafeFunctionCallMode::NonBlocking);
        }
    }
}
