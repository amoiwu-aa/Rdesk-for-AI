use super::*;
use scrap::codec::{Quality, BR_BALANCED, BR_BEST, BR_SPEED};
use std::sync::LazyLock;
use std::{
    sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering},
    time::{Duration, Instant},
};

pub struct VideoQoSFastSnapshot {
    pub spf_micros: AtomicU64,
    pub ratio_bits: AtomicU32,
    pub bitrate: AtomicU32,
    pub record: AtomicBool,
    pub vbr: AtomicBool,
    pub custom_quality: AtomicBool,
}

pub static VIDEO_QOS_FAST: LazyLock<VideoQoSFastSnapshot> =
    LazyLock::new(|| VideoQoSFastSnapshot {
        spf_micros: AtomicU64::new((1_000_000f32 / FPS as f32) as u64),
        ratio_bits: AtomicU32::new(BR_BALANCED.to_bits()),
        bitrate: AtomicU32::new(0),
        record: AtomicBool::new(false),
        vbr: AtomicBool::new(false),
        custom_quality: AtomicBool::new(false),
    });

/*
FPS adjust:
a. new user connected =>set to INIT_FPS
b. TestDelay receive => update user's fps according to network delay
    When network delay < DELAY_THRESHOLD_150MS, set minimum fps according to image quality, and increase fps;
    When network delay >= DELAY_THRESHOLD_150MS, set minimum fps according to image quality, and decrease fps;
c. second timeout / TestDelay receive => update real fps to the minimum fps from all users

ratio adjust:
a. user set image quality => update to the maximum ratio of the latest quality
b. 3 seconds timeout => update ratio according to network delay
    When network delay < DELAY_THRESHOLD_150MS, increase ratio, max 150kbps;
    When network delay >= DELAY_THRESHOLD_150MS, decrease ratio;

adjust between FPS and ratio:
    When network delay < DELAY_THRESHOLD_150MS, fps is always higher than the minimum fps, and ratio is increasing;
    When network delay >= DELAY_THRESHOLD_150MS, fps is always lower than the minimum fps, and ratio is decreasing;

delay:
    use delay minus RTT as the actual network delay
*/

// Constants
pub const FPS: u32 = 60;
pub const MIN_FPS: u32 = 1;
pub const MAX_FPS: u32 = 120;
pub const INIT_FPS: u32 = 30;

// Bitrate ratio constants for different quality levels
const BR_MAX: f32 = 40.0; // 2000 * 2 / 100
const BR_MIN: f32 = 0.2;
const BR_MIN_HIGH_RESOLUTION: f32 = 0.1; // For high resolution, BR_MIN is still too high, so we set a lower limit
const MAX_BR_MULTIPLE: f32 = 1.0;

const HISTORY_DELAY_LEN: usize = 2;
const ADJUST_RATIO_INTERVAL: usize = 2; // Adjust quality ratio every 2 seconds
const DYNAMIC_SCREEN_THRESHOLD: usize = 2; // Allow increase quality ratio if encode more than 2 times in one second
const DELAY_THRESHOLD_150MS: u32 = 150; // 150ms is the threshold for good network condition

#[derive(Default, Debug, Clone)]
struct UserDelay {
    response_delayed: bool,
    delay_history: [u32; HISTORY_DELAY_LEN],
    delay_head: usize,
    delay_count: usize,
    running_sum: u64,
    fps: Option<u32>,
    rtt_calculator: RttCalculator,
    increase_fps_count: usize,
}

impl UserDelay {
    fn add_delay(&mut self, delay: u32) {
        self.rtt_calculator.update(delay);
        if self.delay_count >= HISTORY_DELAY_LEN {
            self.running_sum -= self.delay_history[self.delay_head] as u64;
        }
        self.delay_history[self.delay_head] = delay;
        self.delay_head = (self.delay_head + 1) % HISTORY_DELAY_LEN;
        if self.delay_count < HISTORY_DELAY_LEN {
            self.delay_count += 1;
        }
        self.running_sum += delay as u64;
    }

    // Average delay minus RTT
    fn avg_delay(&self) -> u32 {
        if self.delay_count > 0 {
            let avg_delay = (self.running_sum / self.delay_count as u64) as u32;

            // If RTT is available, subtract it from average delay to get actual network latency
            if let Some(rtt) = self.rtt_calculator.get_rtt() {
                if avg_delay > rtt {
                    avg_delay - rtt
                } else {
                    avg_delay
                }
            } else {
                avg_delay
            }
        } else {
            DELAY_THRESHOLD_150MS
        }
    }
}

// User session data structure
#[derive(Default, Debug, Clone)]
struct UserData {
    auto_adjust_fps: Option<u32>, // reserve for compatibility
    custom_fps: Option<u32>,
    quality: Option<(i64, Quality)>, // (time, quality)
    delay: UserDelay,
    record: bool,
}

#[derive(Default, Debug, Clone)]
struct DisplayData {
    send_counter: usize, // Number of times encode during period
    support_changing_quality: bool,
}

// Main QoS controller structure
pub struct VideoQoS {
    fps: u32,
    ratio: f32,
    users: HashMap<i32, UserData>,
    displays: HashMap<String, DisplayData>,
    bitrate_store: u32,
    adjust_ratio_instant: Instant,
    abr_config: bool,
    new_user_instant: Instant,
    pid: PidController,
    fast_spf_micros: AtomicU64,
    fast_ratio_bits: AtomicU32,
    fast_bitrate: AtomicU32,
    fast_record: AtomicBool,
}

impl Default for VideoQoS {
    fn default() -> Self {
        VideoQoS {
            fps: FPS,
            ratio: BR_BALANCED,
            users: Default::default(),
            displays: Default::default(),
            bitrate_store: 0,
            adjust_ratio_instant: Instant::now(),
            abr_config: true,
            new_user_instant: Instant::now(),
            pid: Default::default(),
            fast_spf_micros: AtomicU64::new((1_000_000f32 / FPS as f32) as u64),
            fast_ratio_bits: AtomicU32::new(BR_BALANCED.to_bits()),
            fast_bitrate: AtomicU32::new(0),
            fast_record: AtomicBool::new(false),
        }
    }
}

// Basic functionality
impl VideoQoS {
    // Calculate seconds per frame based on current FPS
    pub fn spf(&self) -> Duration {
        Duration::from_secs_f32(1. / (self.fps() as f32))
    }

    pub fn fast_spf(&self) -> Duration {
        Duration::from_micros(self.fast_spf_micros.load(Ordering::Relaxed).max(1))
    }

    // Get current FPS within valid range
    pub fn fps(&self) -> u32 {
        let fps = self.fps;
        if fps >= MIN_FPS && fps <= MAX_FPS {
            fps
        } else {
            FPS
        }
    }

    // Store bitrate for later use
    pub fn store_bitrate(&mut self, bitrate: u32) {
        self.bitrate_store = bitrate;
        self.fast_bitrate.store(bitrate, Ordering::Release);
    }

    // Get stored bitrate
    pub fn bitrate(&self) -> u32 {
        self.bitrate_store
    }

    pub fn fast_bitrate(&self) -> u32 {
        self.fast_bitrate.load(Ordering::Relaxed)
    }

    pub fn current_ratio_value(&self) -> f32 {
        self.ratio
    }

    pub fn target_ratio_value(&self) -> f32 {
        self.latest_quality().ratio()
    }

    pub fn max_custom_fps_value(&self) -> u32 {
        self.users
            .values()
            .filter_map(|u| u.custom_fps)
            .max()
            .unwrap_or(0)
    }

    pub fn auto_adjust_fps_value(&self) -> Option<u32> {
        self.users.values().filter_map(|u| u.auto_adjust_fps).min()
    }

    pub fn max_delay_value(&self) -> Option<u32> {
        self.users.iter().map(|u| u.1.delay.avg_delay()).max()
    }

    pub fn response_delayed_value(&self) -> bool {
        self.users.iter().any(|u| u.1.delay.response_delayed)
    }

    pub fn abr_enabled_value(&self) -> bool {
        self.in_vbr_state()
    }

    // Get current bitrate ratio with bounds checking
    pub fn ratio(&mut self) -> f32 {
        if self.ratio < BR_MIN_HIGH_RESOLUTION || self.ratio > BR_MAX {
            self.ratio = BR_BALANCED;
        }
        self.fast_ratio_bits
            .store(self.ratio.to_bits(), Ordering::Release);
        self.ratio
    }

    pub fn fast_ratio(&self) -> f32 {
        f32::from_bits(self.fast_ratio_bits.load(Ordering::Relaxed))
    }

    // Check if any user is in recording mode
    pub fn record(&self) -> bool {
        self.users.iter().any(|u| u.1.record)
    }

    pub fn fast_record(&self) -> bool {
        self.fast_record.load(Ordering::Relaxed)
    }

    pub fn refresh_fast_path(&mut self) {
        self.sync_fast_path();
    }

    fn sync_fast_path(&self) {
        self.fast_spf_micros
            .store(self.spf().as_micros() as u64, Ordering::Release);
        self.fast_ratio_bits
            .store(self.ratio.to_bits(), Ordering::Release);
        self.fast_bitrate
            .store(self.bitrate_store, Ordering::Release);
        self.fast_record.store(self.record(), Ordering::Release);
        VIDEO_QOS_FAST
            .spf_micros
            .store(self.spf().as_micros() as u64, Ordering::Release);
        VIDEO_QOS_FAST
            .ratio_bits
            .store(self.ratio.to_bits(), Ordering::Release);
        VIDEO_QOS_FAST
            .bitrate
            .store(self.bitrate_store, Ordering::Release);
        VIDEO_QOS_FAST
            .record
            .store(self.record(), Ordering::Release);
        VIDEO_QOS_FAST
            .vbr
            .store(self.in_vbr_state(), Ordering::Release);
        VIDEO_QOS_FAST
            .custom_quality
            .store(self.latest_quality().is_custom(), Ordering::Release);
    }

    pub fn set_support_changing_quality(&mut self, video_service_name: &str, support: bool) {
        if let Some(display) = self.displays.get_mut(video_service_name) {
            display.support_changing_quality = support;
        }
    }

    // Check if variable bitrate encoding is supported and enabled
    pub fn in_vbr_state(&self) -> bool {
        self.abr_config && self.displays.iter().all(|e| e.1.support_changing_quality)
    }
}

// User session management
impl VideoQoS {
    // Initialize new user session
    pub fn on_connection_open(&mut self, id: i32) {
        self.users.insert(id, UserData::default());
        self.abr_config = Config::get_option("enable-abr") != "N";
        self.new_user_instant = Instant::now();
        self.sync_fast_path();
    }

    // Clean up user session
    pub fn on_connection_close(&mut self, id: i32) {
        self.users.remove(&id);
        if self.users.is_empty() {
            *self = Default::default();
        } else {
            self.sync_fast_path();
        }
    }

    pub fn user_custom_fps(&mut self, id: i32, fps: u32) {
        if fps < MIN_FPS || fps > MAX_FPS {
            return;
        }
        if let Some(user) = self.users.get_mut(&id) {
            user.custom_fps = Some(fps);
        }
        // Immediately recalculate so the new fps ceiling takes effect without
        // waiting for the next network-delay message.
        self.adjust_fps();
        self.sync_fast_path();
    }

    pub fn user_auto_adjust_fps(&mut self, id: i32, fps: u32) {
        if fps < MIN_FPS || fps > MAX_FPS {
            return;
        }
        if let Some(user) = self.users.get_mut(&id) {
            user.auto_adjust_fps = Some(fps);
        }
        self.sync_fast_path();
    }

    pub fn user_image_quality(&mut self, id: i32, image_quality: i32) {
        let convert_quality = |q: i32| -> Quality {
            if q == ImageQuality::Balanced.value() {
                Quality::Balanced
            } else if q == ImageQuality::Low.value() {
                Quality::Low
            } else if q == ImageQuality::Best.value() {
                Quality::Best
            } else {
                let b = ((q >> 8 & 0xFFF) * 2) as f32 / 100.0;
                Quality::Custom(b.clamp(BR_MIN, BR_MAX))
            }
        };

        let quality = Some((hbb_common::get_time(), convert_quality(image_quality)));
        if let Some(user) = self.users.get_mut(&id) {
            user.quality = quality;
            // update ratio directly
            self.ratio = self.latest_quality().ratio();
        }
        self.sync_fast_path();
    }

    pub fn user_record(&mut self, id: i32, v: bool) {
        if let Some(user) = self.users.get_mut(&id) {
            user.record = v;
        }
        self.sync_fast_path();
    }

    pub fn user_network_delay(&mut self, id: i32, delay: u32, game_mode: bool) {
        let highest_fps = self.highest_fps();
        let target_ratio = self.latest_quality().ratio();

        let (mut min_fps, mut normal_fps) = if target_ratio >= BR_BEST {
            (15, 45)
        } else if target_ratio >= BR_BALANCED {
            (20, 50)
        } else {
            (24, 55)
        };
        if highest_fps > normal_fps {
            min_fps = (min_fps * highest_fps / normal_fps).min(highest_fps / 2);
            normal_fps = highest_fps;
        }

        let mut adjust_ratio = false;
        if let Some(user) = self.users.get_mut(&id) {
            let delay = delay.max(10);
            user.delay.add_delay(delay);
            let mut fps = self.fps;

            if game_mode {
                let base_rtt = user.delay.rtt_calculator.window_min_rtt.unwrap_or(0);
                let current_rtt = user.delay.rtt_calculator.smoothed_rtt.unwrap_or(delay);

                // Queuing Delay (SOTA model)
                let queuing_delay = current_rtt.saturating_sub(base_rtt);

                if queuing_delay > 30 {
                    // Multiplicative Decrease
                    let target_fps = ((fps as f32) * 0.85).ceil() as u32;
                    fps = target_fps.max(min_fps);
                    user.delay.increase_fps_count = 0;
                } else {
                    // Additive Increase
                    user.delay.increase_fps_count += 1;
                    let step = if fps < normal_fps { 10 } else { 2 };
                    if user.delay.increase_fps_count >= 2 {
                        fps += step;
                        user.delay.increase_fps_count = 0;
                    }
                }
            } else {
                // Standard mode (Conservative algorithm for free users, prioritizes quality / bandwidth stability)
                if delay > 250 {
                    let target_fps = ((fps as f32) * 0.90).ceil() as u32;
                    fps = target_fps.max(min_fps);
                    user.delay.increase_fps_count = 0;
                } else {
                    user.delay.increase_fps_count += 1;
                    let step = if fps < normal_fps { 5 } else { 1 };
                    if user.delay.increase_fps_count >= 4 {
                        fps += step;
                        user.delay.increase_fps_count = 0;
                    }
                }
            }

            fps = fps.clamp(MIN_FPS, highest_fps);
            adjust_ratio = user.delay.fps.is_none();
            user.delay.fps = Some(fps);
        }
        self.adjust_fps();
        if adjust_ratio && !cfg!(target_os = "linux") {
            self.adjust_ratio(false);
        }
        self.sync_fast_path();
    }

    pub fn user_delay_response_elapsed(&mut self, id: i32, elapsed: u128) {
        if let Some(user) = self.users.get_mut(&id) {
            user.delay.response_delayed = elapsed > 2000;
            if user.delay.response_delayed {
                user.delay.add_delay(elapsed as u32);
                self.adjust_fps();
                self.sync_fast_path();
            }
        }
    }
}

// Common adjust functions
impl VideoQoS {
    pub fn new_display(&mut self, video_service_name: String) {
        self.displays
            .insert(video_service_name, DisplayData::default());
    }

    pub fn remove_display(&mut self, video_service_name: &str) {
        self.displays.remove(video_service_name);
    }

    pub fn update_display_data(&mut self, video_service_name: &str, send_counter: usize) {
        if let Some(display) = self.displays.get_mut(video_service_name) {
            display.send_counter += send_counter;
        }
        self.adjust_fps();
        let abr_enabled = self.in_vbr_state();
        if abr_enabled {
            if self.adjust_ratio_instant.elapsed().as_secs() >= ADJUST_RATIO_INTERVAL as u64 {
                let dynamic_screen = self
                    .displays
                    .iter()
                    .any(|d| d.1.send_counter >= ADJUST_RATIO_INTERVAL * DYNAMIC_SCREEN_THRESHOLD);
                self.displays.iter_mut().for_each(|d| {
                    d.1.send_counter = 0;
                });
                self.adjust_ratio(dynamic_screen);
            }
        } else {
            self.ratio = self.latest_quality().ratio();
        }
        self.sync_fast_path();
    }

    #[inline]
    fn highest_fps(&self) -> u32 {
        let user_fps = |u: &UserData| {
            let custom = u.custom_fps.unwrap_or(FPS);
            let mut fps = custom;
            if let Some(auto_adjust_fps) = u.auto_adjust_fps {
                if fps == 0 || auto_adjust_fps < fps {
                    // Don't let auto_adjust_fps drop below 50% of user's custom_fps
                    let floor = custom / 2;
                    fps = auto_adjust_fps.max(floor);
                }
            }
            fps
        };

        let fps = self
            .users
            .iter()
            .map(|(_, u)| user_fps(u))
            .filter(|u| *u >= MIN_FPS)
            .max()
            .unwrap_or(FPS);

        fps.clamp(MIN_FPS, MAX_FPS)
    }

    // Get latest quality settings from all users
    pub fn latest_quality(&self) -> Quality {
        self.users
            .values()
            .filter_map(|u| u.quality)
            .max_by_key(|(time, _)| *time)
            .map(|(_, q)| q)
            .unwrap_or(Quality::Balanced)
    }

    // Adjust quality ratio based on network delay and screen changes
    fn adjust_ratio(&mut self, dynamic_screen: bool) {
        if !self.in_vbr_state() {
            return;
        }
        // Get maximum delay from all users
        let max_delay = self.users.iter().map(|u| u.1.delay.avg_delay()).max();
        let Some(max_delay) = max_delay else {
            return;
        };

        let target_quality = self.latest_quality();
        let target_ratio = self.latest_quality().ratio();
        let current_ratio = self.ratio;
        let current_bitrate = self.bitrate();

        // Calculate minimum ratio for high resolution (1Mbps baseline)
        let ratio_1mbps = if current_bitrate > 0 {
            Some((current_ratio * 1000.0 / current_bitrate as f32).max(BR_MIN_HIGH_RESOLUTION))
        } else {
            None
        };

        // Calculate ratio for adding 150kbps bandwidth
        let ratio_add_300kbps = if current_bitrate > 0 {
            Some((current_bitrate + 300) as f32 * current_ratio / current_bitrate as f32)
        } else {
            None
        };

        // Set minimum ratio based on quality mode
        let min = match target_quality {
            Quality::Best => {
                // For Best quality, ensure minimum 1Mbps for high resolution
                let mut min = BR_BEST / 2.5;
                if let Some(ratio_1mbps) = ratio_1mbps {
                    if min > ratio_1mbps {
                        min = ratio_1mbps;
                    }
                }
                min.max(BR_MIN)
            }
            Quality::Balanced => {
                let mut min = (BR_BALANCED / 2.0).min(0.4);
                if let Some(ratio_1mbps) = ratio_1mbps {
                    if min > ratio_1mbps {
                        min = ratio_1mbps;
                    }
                }
                min.max(BR_MIN_HIGH_RESOLUTION)
            }
            Quality::Low => BR_MIN_HIGH_RESOLUTION,
            Quality::Custom(_) => BR_MIN_HIGH_RESOLUTION,
        };
        let max = target_ratio * MAX_BR_MULTIPLE;

        let mut v = current_ratio;

        // Target delay of 120ms
        let target_delay = 120.0;
        let error = target_delay - max_delay as f32; // Positive error means network is good

        // Only apply PID when actively probing/adjusting (dynamic screen) or when network is bad
        if dynamic_screen || error < 0.0 {
            let factor = self.pid.calculate(error);
            v = current_ratio * factor;
        }

        // Limit quality increase rate for better stability
        if let Some(ratio_add_300kbps) = ratio_add_300kbps {
            if v > ratio_add_300kbps
                && ratio_add_300kbps > current_ratio
                && current_ratio >= BR_SPEED
            {
                v = ratio_add_300kbps;
            }
        }

        self.ratio = v.clamp(min, max);
        self.adjust_ratio_instant = Instant::now();
    }

    // Adjust fps based on network delay and user response time
    fn adjust_fps(&mut self) {
        let mut highest_fps = FPS;
        let mut min_target_fps = u32::MAX;
        let mut max_delay = 0;
        let mut any_response_delayed = false;
        let mut max_custom_fps = 0;

        // Loop Fusion: Single-Pass O(N)
        for user in self.users.values() {
            let mut u_fps = user.custom_fps.unwrap_or(FPS);
            if let Some(auto) = user.auto_adjust_fps {
                u_fps = auto.max(u_fps / 2);
            }
            highest_fps = highest_fps.max(u_fps);

            if let Some(cf) = user.custom_fps {
                max_custom_fps = max_custom_fps.max(cf);
            }

            if let Some(fps) = user.delay.fps {
                min_target_fps = min_target_fps.min(fps);
            }

            max_delay = max_delay.max(user.delay.avg_delay());
            any_response_delayed |= user.delay.response_delayed;
        }

        highest_fps = highest_fps.clamp(MIN_FPS, MAX_FPS);
        let init = highest_fps.max(INIT_FPS);
        let mut fps = if min_target_fps == u32::MAX {
            init
        } else {
            min_target_fps
        };

        let target_ratio = self.latest_quality().ratio();
        let current_ratio = self.ratio;

        let latest_quality = self.latest_quality();
        let is_game_mode = max_custom_fps >= 120 || matches!(latest_quality, Quality::Best);
        let is_standard_mode = !is_game_mode && target_ratio >= BR_BALANCED;

        let ratio_bottomed = current_ratio <= (target_ratio * 0.5).max(BR_MIN_HIGH_RESOLUTION);

        let mut target_fps = fps;

        if max_delay >= DELAY_THRESHOLD_150MS {
            if ratio_bottomed || any_response_delayed {
                let badness_factor = (max_delay as f32 / DELAY_THRESHOLD_150MS as f32).min(5.0);
                target_fps = (fps as f32 / badness_factor).ceil() as u32;

                if is_game_mode {
                    target_fps = target_fps.max(60);
                } else if is_standard_mode {
                    target_fps = target_fps.max(30);
                }
            } else if max_delay > 300 {
                target_fps = (fps as f32 * 0.8).ceil() as u32;
                if is_game_mode {
                    target_fps = target_fps.max(60);
                } else if is_standard_mode {
                    target_fps = target_fps.max(30);
                }
            }
        } else if max_delay < DELAY_THRESHOLD_150MS && fps < init {
            let step = if fps < init / 2 {
                (init - fps).min(20)
            } else {
                5
            };
            target_fps = (fps + step).min(init);
        }

        fps = target_fps.max(MIN_FPS + 1);

        if self.new_user_instant.elapsed().as_secs() < 1 {
            if fps > init {
                fps = init;
            }
        }

        self.fps = fps.clamp(MIN_FPS, highest_fps);
        self.sync_fast_path();
    }
}

#[derive(Debug, Clone)]
struct RttCalculator {
    min_rtt: Option<u32>,
    window_min_rtt: Option<u32>,
    smoothed_rtt: Option<u32>,
    samples: [u32; 60],
    head: usize,
    count: usize,
}

impl Default for RttCalculator {
    fn default() -> Self {
        Self {
            min_rtt: None,
            window_min_rtt: None,
            smoothed_rtt: None,
            samples: [0; 60],
            head: 0,
            count: 0,
        }
    }
}

impl RttCalculator {
    const WINDOW_SAMPLES: usize = 60;
    const MIN_SAMPLES: usize = 10;
    const ALPHA: f32 = 0.5;

    pub fn update(&mut self, delay: u32) {
        self.min_rtt = Some(self.min_rtt.unwrap_or(delay).min(delay));

        self.samples[self.head] = delay;
        self.head = (self.head + 1) % Self::WINDOW_SAMPLES;
        self.count = self.count.saturating_add(1).min(Self::WINDOW_SAMPLES);

        self.window_min_rtt = self.samples[0..self.count].iter().copied().min();

        if self.count >= Self::WINDOW_SAMPLES {
            if let (Some(min), Some(window_min)) = (self.min_rtt, self.window_min_rtt) {
                let new_srtt =
                    ((1.0 - Self::ALPHA) * min as f32 + Self::ALPHA * window_min as f32) as u32;
                self.smoothed_rtt = Some(new_srtt);
            }
        }
    }

    pub fn get_rtt(&self) -> Option<u32> {
        if let Some(rtt) = self.smoothed_rtt {
            return Some(rtt);
        }
        if self.count >= Self::MIN_SAMPLES {
            if let Some(rtt) = self.min_rtt {
                return Some(rtt);
            }
        }
        None
    }
}

// PID Controller for smooth bitrate adjust
#[derive(Debug, Clone)]
struct PidController {
    kp: f32,
    ki: f32,
    kd: f32,
    integral: f32,
    prev_error: f32,
    last_update: Instant,
}

impl Default for PidController {
    fn default() -> Self {
        Self {
            kp: 0.005,
            ki: 0.0001,
            kd: 0.001,
            integral: 0.0,
            prev_error: 0.0,
            last_update: Instant::now(),
        }
    }
}

impl PidController {
    fn calculate(&mut self, error: f32) -> f32 {
        let now = Instant::now();
        let mut dt = now.duration_since(self.last_update).as_secs_f32();
        self.last_update = now;

        if dt > 2.0 {
            self.integral = 0.0;
            self.prev_error = error;
            return 1.0;
        }

        dt = dt.max(0.01);
        self.integral += error * dt;
        self.integral = self.integral.clamp(-500.0, 500.0);

        let derivative = (error - self.prev_error) / dt;
        self.prev_error = error;

        let output = (self.kp * error) + (self.ki * self.integral) + (self.kd * derivative);

        1.0 + output.clamp(-0.2, 0.15)
    }
}
