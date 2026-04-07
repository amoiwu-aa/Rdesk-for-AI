// 24FPS (actually 23.976FPS) is what video professionals ages ago determined to be the
// slowest playback rate that still looks smooth enough to feel real.
// Our eyes can see a slight difference and even though 30FPS actually shows
// more information and is more realistic.
// 60FPS is commonly used in game, teamviewer 12 support this for video editing user.

// how to capture with mouse cursor:
// https://docs.microsoft.com/zh-cn/windows/win32/direct3ddxgi/desktop-dup-api?redirectedfrom=MSDN

// RECORD: The following Project has implemented audio capture, hardware codec and mouse cursor drawn.
// https://github.com/PHZ76/DesktopSharing

// dxgi memory leak issue
// https://stackoverflow.com/questions/47801238/memory-leak-in-creating-direct2d-device
// but per my test, it is more related to AcquireNextFrame,
// https://forums.developer.nvidia.com/t/dxgi-outputduplication-memory-leak-when-using-nv-but-not-amd-drivers/108582

// to-do:
// https://slhck.info/video/2017/03/01/rate-control.html

use super::{
    display_service::check_display_changed,
    service::ServiceTmpl,
    video_qos::{VideoQoS, VIDEO_QOS_FAST},
    *,
};
#[cfg(target_os = "linux")]
use crate::common::SimpleCallOnReturn;
#[cfg(target_os = "linux")]
use crate::platform::linux::is_x11;
use crate::privacy_mode::{get_privacy_mode_conn_id, INVALID_PRIVACY_MODE_CONN_ID};
#[cfg(windows)]
use crate::{
    platform::windows::is_process_consent_running,
    privacy_mode::{is_current_privacy_mode_impl, PRIVACY_MODE_IMPL_WIN_MAG},
    ui_interface::is_installed,
};
#[cfg(all(windows, feature = "vram"))]
use crossbeam_channel::{bounded, Receiver as CbReceiver, Sender as CbSender, TrySendError};
use hbb_common::{anyhow::anyhow, config};
#[cfg(feature = "hwcodec")]
use scrap::hwcodec::{HwRamEncoder, HwRamEncoderConfig};
#[cfg(feature = "vram")]
use scrap::vram::{VRamEncoder, VRamEncoderConfig};
#[cfg(not(windows))]
use scrap::Capturer;
use scrap::{
    codec::{Encoder, EncoderApi, EncoderCfg},
    record::{Recorder, RecorderContext},
    CodecFormat, Display, EncodeInput, TraitCapturer, TraitPixelBuffer,
};
#[cfg(windows)]
use std::sync::Once;
use std::{
    io::ErrorKind::WouldBlock,
    ops::{Deref, DerefMut},
    sync::mpsc::{self, Receiver as StdReceiver, Sender as StdSender},
    sync::{
        atomic::{AtomicBool, Ordering as AtomicOrdering},
        Arc,
    },
    time::{self, Duration, Instant},
};

pub const OPTION_REFRESH: &'static str = "refresh";

#[cfg(all(windows, feature = "vram"))]
#[derive(Clone)]
struct EncodeJob {
    frame: scrap::OwnedTextureFrame,
    ms: i64,
    width: usize,
    height: usize,
}

#[cfg(all(windows, feature = "vram"))]
struct CapturePipelineGuard {
    stop: Arc<AtomicBool>,
    handle: Option<std::thread::JoinHandle<()>>,
}

#[cfg(all(windows, feature = "vram"))]
impl Drop for CapturePipelineGuard {
    fn drop(&mut self) {
        self.stop.store(true, AtomicOrdering::Release);
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
    }
}

#[cfg(all(windows, feature = "vram"))]
struct EncodeWorkerOutput {
    send_conn_ids: Vec<i32>,
}

#[inline]
fn hybrid_sleep_until(target_time: Instant) {
    let now = Instant::now();
    if now < target_time {
        let sleep_dur = target_time.saturating_duration_since(now);
        // 让出 CPU 睡眠，但故意扣除 2ms 余量，防止 Windows 睡过头！
        if sleep_dur.as_millis() > 2 {
            std::thread::sleep(sleep_dur - Duration::from_millis(2));
        }
        // 剩下的时间使用 CPU 自旋锁精确对齐微秒级，彻底解放极限高刷新率
        while Instant::now() < target_time {
            std::hint::spin_loop();
        }
    }
}

#[inline]
fn is_game_mode(sp: &GenericService) -> bool {
    sp.get_option("performance-mode")
        .map(|v| v == "game")
        .unwrap_or(false)
}

type FrameFetchedNotifierSender = StdSender<(i32, Option<Instant>)>;
type FrameFetchedNotifierReceiver = Arc<Mutex<StdReceiver<(i32, Option<Instant>)>>>;

lazy_static::lazy_static! {
    static ref FRAME_FETCHED_NOTIFIERS: Mutex<HashMap<usize, (FrameFetchedNotifierSender, FrameFetchedNotifierReceiver)>> = Mutex::new(HashMap::default());

    // display_idx -> set of conn id.
    // Used to record which connections need to be notified when
    // 1. A new frame is received from a web client.
    //   Because web client does not send the display index in message `VideoReceived`.
    // 2. The client is closing.
    static ref DISPLAY_CONN_IDS: Arc<Mutex<HashMap<usize, Arc<Vec<i32>>>>> = Default::default();
    // Reverse index: conn_id -> list of display_idx
    static ref CONN_DISPLAY_IDS: Arc<Mutex<HashMap<i32, Vec<usize>>>> = Default::default();
    pub static ref VIDEO_QOS: Arc<Mutex<VideoQoS>> = Default::default();
    pub static ref IS_UAC_RUNNING: Arc<std::sync::atomic::AtomicBool> = Arc::new(std::sync::atomic::AtomicBool::new(false));
    pub static ref IS_FOREGROUND_WINDOW_ELEVATED: Arc<std::sync::atomic::AtomicBool> = Arc::new(std::sync::atomic::AtomicBool::new(false));
    static ref SCREENSHOTS: Mutex<HashMap<usize, Screenshot>> = Default::default();
}

struct Screenshot {
    sid: String,
    tx: Sender,
    restore_vram: bool,
}

#[inline]
pub fn notify_video_frame_fetched(display_idx: usize, conn_id: i32, frame_tm: Option<Instant>) {
    if let Some(notifier) = FRAME_FETCHED_NOTIFIERS.lock().unwrap().get(&display_idx) {
        notifier.0.send((conn_id, frame_tm)).ok();
    }
}

#[inline]
pub fn notify_video_frame_fetched_by_conn_id(conn_id: i32, frame_tm: Option<Instant>) {
    let vec_display_idx = {
        let conn_display_ids = CONN_DISPLAY_IDS.lock().unwrap();
        match conn_display_ids.get(&conn_id) {
            Some(idxes) => idxes.clone(),
            None => return,
        }
    };
    let notifiers = FRAME_FETCHED_NOTIFIERS.lock().unwrap();
    for display_idx in vec_display_idx {
        if let Some(notifier) = notifiers.get(&display_idx) {
            notifier.0.send((conn_id, frame_tm)).ok();
        }
    }
}

struct VideoFrameController {
    display_idx: usize,
    cur: Instant,
    send_conn_ids: Arc<Vec<i32>>,
}

impl VideoFrameController {
    fn new(display_idx: usize) -> Self {
        Self {
            display_idx,
            cur: Instant::now(),
            send_conn_ids: Arc::new(Vec::new()),
        }
    }

    fn reset(&mut self) {
        self.send_conn_ids = Arc::new(Vec::new());
    }

    fn set_send(&mut self, tm: Instant, conn_ids: Vec<i32>) {
        if !conn_ids.is_empty() {
            self.cur = tm;
            let shared = Arc::new(conn_ids);
            self.send_conn_ids = shared.clone();

            DISPLAY_CONN_IDS
                .lock()
                .unwrap()
                .insert(self.display_idx, shared.clone());

            let mut conn_display_ids = CONN_DISPLAY_IDS.lock().unwrap();
            for &conn_id in shared.iter() {
                let displays = conn_display_ids.entry(conn_id).or_insert_with(Vec::new);
                if !displays.contains(&self.display_idx) {
                    displays.push(self.display_idx);
                }
            }
        }
    }

    fn try_wait_next(&mut self, fetched_conn_ids: &mut Vec<i32>, timeout_millis: u64) {
        if self.send_conn_ids.is_empty() {
            return;
        }

        let timeout_dur = Duration::from_millis(timeout_millis as u64);
        let receiver = {
            match FRAME_FETCHED_NOTIFIERS
                .lock()
                .unwrap()
                .get(&self.display_idx)
            {
                Some(notifier) => notifier.1.clone(),
                None => {
                    return;
                }
            }
        };
        let receiver_guard = receiver.lock().unwrap();
        match receiver_guard.recv_timeout(timeout_dur) {
            Ok((id, instant)) => {
                if let Some(tm) = instant {
                    log::trace!("Channel recv latency: {}", tm.elapsed().as_secs_f32());
                }
                if !fetched_conn_ids.contains(&id) {
                    fetched_conn_ids.push(id);
                }
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {}
            Err(mpsc::RecvTimeoutError::Disconnected) => return,
        }
        while let Ok((id, instant)) = receiver_guard.try_recv() {
            if let Some(tm) = instant {
                log::trace!("Channel recv latency: {}", tm.elapsed().as_secs_f32());
            }
            if !fetched_conn_ids.contains(&id) {
                fetched_conn_ids.push(id);
            }
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum VideoSource {
    Monitor,
    Camera,
}

impl VideoSource {
    pub fn service_name_prefix(&self) -> &'static str {
        match self {
            VideoSource::Monitor => "monitor",
            VideoSource::Camera => "camera",
        }
    }

    pub fn is_monitor(&self) -> bool {
        matches!(self, VideoSource::Monitor)
    }

    pub fn is_camera(&self) -> bool {
        matches!(self, VideoSource::Camera)
    }
}

#[derive(Clone)]
pub struct VideoService {
    sp: GenericService,
    idx: usize,
    source: VideoSource,
}

impl Deref for VideoService {
    type Target = ServiceTmpl<ConnInner>;

    fn deref(&self) -> &Self::Target {
        &self.sp
    }
}

impl DerefMut for VideoService {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.sp
    }
}

pub fn get_service_name(source: VideoSource, idx: usize) -> String {
    format!("{}{}", source.service_name_prefix(), idx)
}

pub fn new(source: VideoSource, idx: usize) -> GenericService {
    let _ = FRAME_FETCHED_NOTIFIERS
        .lock()
        .unwrap()
        .entry(idx)
        .or_insert_with(|| {
            let (tx, rx) = mpsc::channel();
            (tx, Arc::new(Mutex::new(rx)))
        });
    let vs = VideoService {
        sp: GenericService::new(get_service_name(source, idx), true),
        idx,
        source,
    };
    GenericService::run(&vs, run);
    vs.sp
}

// Capturer object is expensive, avoiding to create it frequently.
fn create_capturer(
    privacy_mode_id: i32,
    display: Display,
    _current: usize,
    _portable_service_running: bool,
) -> ResultType<Box<dyn TraitCapturer>> {
    #[cfg(not(windows))]
    let c: Option<Box<dyn TraitCapturer>> = None;
    #[cfg(windows)]
    let mut c: Option<Box<dyn TraitCapturer>> = None;
    if privacy_mode_id > 0 {
        #[cfg(windows)]
        {
            if let Some(c1) = crate::privacy_mode::win_mag::create_capturer(
                privacy_mode_id,
                display.origin(),
                display.width(),
                display.height(),
            )? {
                c = Some(Box::new(c1));
            }
        }
    }

    match c {
        Some(c1) => return Ok(c1),
        None => {
            #[cfg(windows)]
            {
                log::debug!("Create capturer dxgi|gdi");
                return crate::portable_service::client::create_capturer(
                    _current,
                    display,
                    _portable_service_running,
                );
            }
            #[cfg(not(windows))]
            {
                log::debug!("Create capturer from scrap");
                return Ok(Box::new(
                    Capturer::new(display).with_context(|| "Failed to create capturer")?,
                ));
            }
        }
    };
}

// This function works on privacy mode. Windows only for now.
pub fn test_create_capturer(
    privacy_mode_id: i32,
    display_idx: usize,
    timeout_millis: u64,
) -> String {
    let test_begin = Instant::now();
    loop {
        let err = match Display::all() {
            Ok(mut displays) => {
                if displays.len() <= display_idx {
                    anyhow!(
                        "Failed to get display {}, the displays' count is {}",
                        display_idx,
                        displays.len()
                    )
                } else {
                    let display = displays.remove(display_idx);
                    match create_capturer(privacy_mode_id, display, display_idx, false) {
                        Ok(_) => return "".to_owned(),
                        Err(e) => e,
                    }
                }
            }
            Err(e) => e.into(),
        };
        if test_begin.elapsed().as_millis() >= timeout_millis as _ {
            return err.to_string();
        }
        std::thread::sleep(Duration::from_millis(300));
    }
}

// Note: This function is extremely expensive, do not call it frequently.
#[cfg(windows)]
fn check_uac_switch(privacy_mode_id: i32, capturer_privacy_mode_id: i32) -> ResultType<()> {
    if capturer_privacy_mode_id != INVALID_PRIVACY_MODE_CONN_ID
        && is_current_privacy_mode_impl(PRIVACY_MODE_IMPL_WIN_MAG)
    {
        if !is_installed() {
            if privacy_mode_id != capturer_privacy_mode_id {
                if !is_process_consent_running()? {
                    bail!("consent.exe is not running");
                }
            }
            if is_process_consent_running()? {
                bail!("consent.exe is running");
            }
        }
    }
    Ok(())
}

pub(super) struct CapturerInfo {
    pub origin: (i32, i32),
    pub width: usize,
    pub height: usize,
    pub ndisplay: usize,
    pub current: usize,
    pub privacy_mode_id: i32,
    pub _capturer_privacy_mode_id: i32,
    pub capturer: Box<dyn TraitCapturer>,
}

impl Deref for CapturerInfo {
    type Target = Box<dyn TraitCapturer>;

    fn deref(&self) -> &Self::Target {
        &self.capturer
    }
}

impl DerefMut for CapturerInfo {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.capturer
    }
}

fn get_capturer_monitor(
    current: usize,
    portable_service_running: bool,
) -> ResultType<CapturerInfo> {
    #[cfg(target_os = "linux")]
    {
        if !is_x11() {
            return super::wayland::get_capturer_for_display(current);
        }
    }

    let mut displays = Display::all()?;
    let ndisplay = displays.len();
    if ndisplay <= current {
        bail!(
            "Failed to get display {}, displays len: {}",
            current,
            ndisplay
        );
    }

    let display = displays.remove(current);

    #[cfg(target_os = "linux")]
    if let Display::X11(inner) = &display {
        if let Err(err) = inner.get_shm_status() {
            log::warn!(
                "MIT-SHM extension not working properly on select X11 server: {:?}",
                err
            );
        }
    }

    let (origin, width, height) = (display.origin(), display.width(), display.height());
    let name = display.name();
    log::debug!(
        "#displays={}, current={}, origin: {:?}, width={}, height={}, cpus={}/{}, name:{}",
        ndisplay,
        current,
        &origin,
        width,
        height,
        num_cpus::get_physical(),
        num_cpus::get(),
        &name,
    );

    let privacy_mode_id = get_privacy_mode_conn_id().unwrap_or(INVALID_PRIVACY_MODE_CONN_ID);
    #[cfg(not(windows))]
    let capturer_privacy_mode_id = privacy_mode_id;
    #[cfg(windows)]
    let mut capturer_privacy_mode_id = privacy_mode_id;
    #[cfg(windows)]
    {
        if capturer_privacy_mode_id != INVALID_PRIVACY_MODE_CONN_ID
            && is_current_privacy_mode_impl(PRIVACY_MODE_IMPL_WIN_MAG)
        {
            if !is_installed() {
                if is_process_consent_running()? {
                    capturer_privacy_mode_id = INVALID_PRIVACY_MODE_CONN_ID;
                }
            }
        }
    }
    log::debug!(
        "Try create capturer with capturer privacy mode id {}",
        capturer_privacy_mode_id,
    );

    if privacy_mode_id != INVALID_PRIVACY_MODE_CONN_ID {
        if privacy_mode_id != capturer_privacy_mode_id {
            log::info!("In privacy mode, but show UAC prompt window for now");
        } else {
            log::info!("In privacy mode, the peer side cannot watch the screen");
        }
    }
    let capturer = create_capturer(
        capturer_privacy_mode_id,
        display,
        current,
        portable_service_running,
    )?;
    Ok(CapturerInfo {
        origin,
        width,
        height,
        ndisplay,
        current,
        privacy_mode_id,
        _capturer_privacy_mode_id: capturer_privacy_mode_id,
        capturer,
    })
}

fn get_capturer_camera(current: usize) -> ResultType<CapturerInfo> {
    let cameras = camera::Cameras::get_sync_cameras();
    let ncamera = cameras.len();
    if ncamera <= current {
        bail!("Failed to get camera {}, cameras len: {}", current, ncamera,);
    }
    let Some(camera) = cameras.get(current) else {
        bail!(
            "Camera of index {} doesn't exist or platform not supported",
            current
        );
    };
    let capturer = camera::Cameras::get_capturer(current)?;
    let (width, height) = (camera.width as usize, camera.height as usize);
    let origin = (camera.x as i32, camera.y as i32);
    let name = &camera.name;
    let privacy_mode_id = get_privacy_mode_conn_id().unwrap_or(INVALID_PRIVACY_MODE_CONN_ID);
    let _capturer_privacy_mode_id = privacy_mode_id;
    log::debug!(
        "#cameras={}, current={}, origin: {:?}, width={}, height={}, cpus={}/{}, name:{}",
        ncamera,
        current,
        &origin,
        width,
        height,
        num_cpus::get_physical(),
        num_cpus::get(),
        name,
    );
    return Ok(CapturerInfo {
        origin,
        width,
        height,
        ndisplay: ncamera,
        current,
        privacy_mode_id,
        _capturer_privacy_mode_id: privacy_mode_id,
        capturer,
    });
}
fn get_capturer(
    source: VideoSource,
    current: usize,
    portable_service_running: bool,
) -> ResultType<CapturerInfo> {
    match source {
        VideoSource::Monitor => get_capturer_monitor(current, portable_service_running),
        VideoSource::Camera => get_capturer_camera(current),
    }
}

fn run(vs: VideoService) -> ResultType<()> {
    let mut _raii = Raii::new(vs.idx, vs.sp.name());
    // Wayland only support one video capturer for now. It is ok to call ensure_inited() here.
    //
    // ensure_inited() is needed because clear() may be called.
    // to-do: wayland ensure_inited should pass current display index.
    // But for now, we do not support multi-screen capture on wayland.
    #[cfg(target_os = "linux")]
    super::wayland::ensure_inited()?;
    #[cfg(target_os = "linux")]
    let _wayland_call_on_ret = {
        // Increment active display count when starting
        let _display_count = super::wayland::increment_active_display_count();

        SimpleCallOnReturn {
            b: true,
            f: Box::new(|| {
                // Decrement active display count and only clear if this was the last display
                let remaining_count = super::wayland::decrement_active_display_count();
                if remaining_count == 0 {
                    super::wayland::clear();
                }
            }),
        }
    };

    #[cfg(windows)]
    let last_portable_service_running = crate::portable_service::client::running();
    #[cfg(not(windows))]
    let last_portable_service_running = false;

    let display_idx = vs.idx;
    let sp = vs.sp;

    // Extract performance-mode BEFORE capturer creation to prevent dirty textures
    let perf_mode_init = sp.get_option("performance-mode").unwrap_or_default();
    let want_scc = perf_mode_init == "office"; // maintenance now uses H264
    {
        use std::io::Write;
        if let Ok(mut f) = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open("C:\\ProgramData\\scc_debug.log")
        {
            let _ = writeln!(
                f,
                "[{}] run() START: perf_mode_init='{}', want_scc={}, negotiated={:?}",
                chrono::Local::now().format("%H:%M:%S"),
                perf_mode_init,
                want_scc,
                Encoder::negotiated_codec()
            );
        }
    }
    if want_scc {
        #[cfg(feature = "vram")]
        {
            VRamEncoder::set_not_use(sp.name(), true);
            _raii.try_vram = false; // Prevent Raii::drop from re-enabling VRAM
        }
    }

    let mut c = get_capturer(vs.source, display_idx, last_portable_service_running)?;
    #[cfg(windows)]
    if !scrap::codec::enable_directx_capture() && !c.is_gdi() {
        log::info!("disable dxgi with option, fall back to gdi");
        c.set_gdi();
    }
    // SCC needs PixelBuffer (CPU), force GDI capture mode
    #[cfg(windows)]
    if want_scc && !c.is_gdi() {
        log::info!("[SCC] Forcing GDI capture for PixelBuffer output");
        c.set_gdi();
    }
    let video_qos = VIDEO_QOS.lock().unwrap();
    let mut spf = video_qos.fast_spf();
    let mut quality = video_qos.fast_ratio();
    let record_incoming = config::option2bool(
        "allow-auto-record-incoming",
        &Config::get_option("allow-auto-record-incoming"),
    );
    let client_record = video_qos.record();
    drop(video_qos);
    let (mut encoder, encoder_cfg, codec_format, _use_i444, recorder) = match setup_encoder(
        &c,
        sp.name(),
        quality,
        client_record,
        record_incoming,
        last_portable_service_running,
        vs.source,
        display_idx,
        want_scc,
    ) {
        Ok(result) => {
            {
                use std::io::Write;
                if let Ok(mut f) = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open("C:\\ProgramData\\scc_debug.log")
                {
                    let _ = writeln!(
                        f,
                        "[{}] setup_encoder OK: codec_format={:?}, encoder_type={}",
                        chrono::Local::now().format("%H:%M:%S"),
                        result.2,
                        if want_scc { "SCC" } else { "H264/H265" }
                    );
                }
            }
            result
        }
        Err(err) => {
            {
                use std::io::Write;
                if let Ok(mut f) = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open("C:\\ProgramData\\scc_debug.log")
                {
                    let _ = writeln!(
                        f,
                        "[{}] setup_encoder FAILED: {}",
                        chrono::Local::now().format("%H:%M:%S"),
                        err
                    );
                }
            }
            return Err(err);
        }
    };
    #[cfg(feature = "vram")]
    c.set_output_texture(encoder.input_texture());
    #[cfg(target_os = "android")]
    if vs.source.is_monitor() {
        if let Err(e) = check_change_scale(encoder.is_hardware()) {
            try_broadcast_display_changed(&sp, display_idx, &c, true).ok();
            bail!(e);
        }
    }
    {
        let mut qos = VIDEO_QOS.lock().unwrap();
        qos.store_bitrate(encoder.bitrate());
        qos.set_support_changing_quality(&sp.name(), encoder.support_changing_quality());
        qos.refresh_fast_path();
    }
    log::info!("initial quality: {quality:?}");

    if sp.is_option_true(OPTION_REFRESH) {
        sp.set_option_bool(OPTION_REFRESH, false);
    }

    let mut frame_controller = VideoFrameController::new(display_idx);

    let start = time::Instant::now();
    let mut last_check_displays = time::Instant::now();
    #[cfg(windows)]
    log::info!("gdi: {}", c.is_gdi());
    #[cfg(windows)]
    start_uac_elevation_check();

    #[cfg(target_os = "linux")]
    let mut would_block_count = 0u32;
    let capture_width = c.width;
    let capture_height = c.height;
    let yuv_size = capture_width * capture_height * 3 / 2; // I420 size estimate
    let mut yuv = Vec::with_capacity(yuv_size);
    let mut mid_data = Vec::with_capacity(yuv_size);
    let mut repeat_encode_counter = 0;
    let repeat_encode_max = 10;
    let mut encode_fail_counter = 0;
    let mut first_frame = true;
    let (mut second_instant, mut send_counter) = (Instant::now(), 0);

    #[cfg(all(windows, feature = "vram"))]
    let high_fps_pipeline_enabled =
        encoder.input_texture() && vs.source.is_monitor() && is_game_mode(&sp);
    #[cfg(all(windows, feature = "vram"))]
    let (capture_tx, capture_rx): (CbSender<EncodeJob>, CbReceiver<EncodeJob>) = bounded(64);
    #[cfg(all(windows, feature = "vram"))]
    let (encode_result_tx, encode_result_rx): (
        CbSender<ResultType<EncodeWorkerOutput>>,
        CbReceiver<ResultType<EncodeWorkerOutput>>,
    ) = bounded(64);
    #[cfg(all(windows, feature = "vram"))]
    let _capture_pipeline = if high_fps_pipeline_enabled {
        let stop = Arc::new(AtomicBool::new(false));
        let stop_clone = stop.clone();
        let tx = capture_tx.clone();
        let current = display_idx;
        let portable_running = last_portable_service_running;
        let handle = std::thread::spawn(move || {
            let start = Instant::now();
            let Ok(mut displays) = Display::all() else {
                return;
            };
            if current >= displays.len() {
                return;
            }
            let display = displays.remove(current);
            let mut capturer = match crate::server::portable_service::client::create_capturer(
                current,
                display,
                portable_running,
            ) {
                Ok(c) => c,
                Err(_) => return,
            };
            capturer.set_output_texture(true);
            let width = c.width;
            let height = c.height;
            while !stop_clone.load(AtomicOrdering::Acquire) {
                match capturer.owned_texture_frame(Duration::from_millis(8)) {
                    Ok(frame) => {
                        let time = Instant::now() - start;
                        let ms = (time.as_secs() * 1000 + time.subsec_millis() as u64) as i64;
                        match tx.try_send(EncodeJob {
                            frame,
                            ms,
                            width,
                            height,
                        }) {
                            Ok(()) => {}
                            Err(TrySendError::Full(_)) => std::thread::yield_now(),
                            Err(TrySendError::Disconnected(_)) => break,
                        }
                    }
                    Err(ref e) if e.kind() == WouldBlock => std::thread::yield_now(),
                    Err(_) => std::thread::yield_now(),
                }
            }
        });
        Some(CapturePipelineGuard {
            stop,
            handle: Some(handle),
        })
    } else {
        None
    };

    #[cfg(all(windows, feature = "vram"))]
    let _encode_worker = if high_fps_pipeline_enabled {
        let sp_worker = sp.clone();
        let recorder_worker = recorder.clone();
        let result_tx = encode_result_tx.clone();
        let current = display_idx;
        let portable_running = last_portable_service_running;
        let codec = codec_format;
        let initial_quality = quality;
        let keyframe_interval = match encoder_cfg.clone() {
            EncoderCfg::VRAM(cfg) => cfg.keyframe_interval,
            _ => None,
        };
        Some(std::thread::spawn(move || {
            let Ok(mut displays) = Display::all() else {
                return;
            };
            if current >= displays.len() {
                return;
            }
            let display = displays.remove(current);
            let init_capturer = match crate::server::portable_service::client::create_capturer(
                current,
                display,
                portable_running,
            ) {
                Ok(c) => c,
                Err(_) => return,
            };
            let Some(feature) = VRamEncoder::try_get(&init_capturer.device(), codec) else {
                return;
            };
            let cfg = EncoderCfg::VRAM(VRamEncoderConfig {
                device: init_capturer.device(),
                width: capture_width,
                height: capture_height,
                quality: initial_quality,
                feature,
                keyframe_interval,
            });
            let Ok(mut worker_encoder) = VRamEncoder::new(cfg, false) else {
                return;
            };
            let mut encode_fail_counter = 0usize;
            let mut first_frame = true;
            while let Ok(job) = capture_rx.recv() {
                let result = handle_one_frame_with_encoder_api(
                    display_idx,
                    &sp_worker,
                    EncodeInput::Texture(job.frame.raw()),
                    job.ms,
                    &mut worker_encoder,
                    recorder_worker.clone(),
                    &mut encode_fail_counter,
                    &mut first_frame,
                    job.width,
                    job.height,
                )
                .map(|send_conn_ids| EncodeWorkerOutput { send_conn_ids });
                if result_tx.send(result).is_err() {
                    break;
                }
            }
        }))
    } else {
        None
    };

    // [EXTREME LOW BANDWIDTH] State for dynamic fps
    let mut prev_y_data: Vec<u8> = Vec::new();
    let mut current_dynamic_spf = Duration::from_millis(500); // Start with 2 FPS

    // Trace: confirm we entered the main loop
    {
        use std::io::Write;
        static ENTERED: std::sync::Once = std::sync::Once::new();
        ENTERED.call_once(|| {
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("C:\\ProgramData\\scc_debug.log")
            {
                let _ = writeln!(
                    f,
                    "[{}] ENTERING MAIN LOOP: sp.ok()={}, codec={:?}, is_gdi={}",
                    chrono::Local::now().format("%H:%M:%S"),
                    sp.ok(),
                    codec_format,
                    c.is_gdi()
                );
            }
        });
    }
    while sp.ok() {
        #[cfg(windows)]
        check_uac_switch(c.privacy_mode_id, c._capturer_privacy_mode_id)?;
        #[cfg(all(windows, feature = "vram"))]
        if high_fps_pipeline_enabled && is_game_mode(&sp) {
            while let Ok(result) = encode_result_rx.try_recv() {
                let result = result?;
                frame_controller.set_send(Instant::now(), result.send_conn_ids);
                send_counter += 1;
            }
        }
        check_qos(
            &mut encoder,
            &mut quality,
            &mut spf,
            client_record,
            &mut send_counter,
            &mut second_instant,
            &sp.name(),
            sp.is_option_true("extreme-low-bandwidth"),
        )?;
        if sp.is_option_true(OPTION_REFRESH) {
            if vs.source.is_monitor() {
                let _ = try_broadcast_display_changed(&sp, display_idx, &c, true);
            }
            log::info!("switch to refresh");
            bail!("SWITCH");
        }
        let perf_mode = sp.get_option("performance-mode").unwrap_or_default();
        let want_scc = perf_mode == "office"; // maintenance now uses H264
                                              // Direct file debug - log when perf_mode changes
        {
            use std::io::Write;
            static LAST_MODE: std::sync::Mutex<String> = std::sync::Mutex::new(String::new());
            let mut last = LAST_MODE.lock().unwrap();
            if *last != perf_mode {
                if let Ok(mut f) = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open("C:\\ProgramData\\scc_debug.log")
                {
                    let _ = writeln!(f, "[{}] video_service: perf_mode changed '{}' -> '{}', want_scc={}, codec_format={:?}",
                        chrono::Local::now().format("%H:%M:%S"), last, perf_mode, want_scc, codec_format);
                }
                *last = perf_mode.clone();
            }
        }

        if codec_format != Encoder::negotiated_codec() {
            let is_scc_swap = want_scc && codec_format == scrap::CodecFormat::ScreenContent;
            let pending_restore = !want_scc && codec_format == scrap::CodecFormat::ScreenContent;

            if !is_scc_swap && !pending_restore {
                log::info!(
                    "switch due to codec changed, {:?} -> {:?}",
                    codec_format,
                    Encoder::negotiated_codec()
                );
                bail!("SWITCH");
            }
        }
        {
            let is_scc = codec_format == scrap::CodecFormat::ScreenContent;
            if want_scc && !is_scc {
                {
                    use std::io::Write;
                    if let Ok(mut f) = std::fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open("C:\\ProgramData\\scc_debug.log")
                    {
                        let _ = writeln!(
                            f,
                            "[{}] HOT-SWAP: want_scc=true, triggering restart...",
                            chrono::Local::now().format("%H:%M:%S")
                        );
                    }
                }
                Encoder::set_fallback(&scrap::codec::EncoderCfg::SCC(
                    scrap::scc::SccEncoderConfig {
                        width: 0,
                        height: 0,
                    },
                ));
                return Err(hbb_common::anyhow::anyhow!("HOT_SWAP_RESTART_REQUIRED"));
            } else if !want_scc && is_scc {
                log::info!("[SCC] Switching back from SCC to H264...");
                // Re-enable VRAM (was disabled for SCC) and restore Raii cleanup rights
                #[cfg(feature = "vram")]
                {
                    VRamEncoder::set_not_use(sp.name(), false);
                    _raii.try_vram = true;
                }
                scrap::codec::Encoder::update(scrap::codec::EncodingUpdate::Check);
                bail!("SWITCH");
            }
        }
        #[cfg(windows)]
        if last_portable_service_running != crate::portable_service::client::running() {
            log::info!("switch due to portable service running changed");
            bail!("SWITCH");
        }
        #[cfg(all(windows, feature = "vram"))]
        if c.is_gdi() && encoder.input_texture() {
            log::info!("changed to gdi when using vram");
            VRamEncoder::set_fallback_gdi(sp.name(), true);
            bail!("SWITCH");
        }
        if vs.source.is_monitor() {
            check_privacy_mode_changed(&sp, display_idx, &c)?;
        }
        #[cfg(windows)]
        {
            if crate::platform::windows::desktop_changed()
                && !crate::portable_service::client::running()
            {
                bail!("Desktop changed");
            }
        }
        let now = time::Instant::now();
        if vs.source.is_monitor() && last_check_displays.elapsed().as_millis() > 1000 {
            last_check_displays = now;
            // This check may be redundant, but it is better to be safe.
            // The previous check in `sp.is_option_true(OPTION_REFRESH)` block may be enough.
            try_broadcast_display_changed(&sp, display_idx, &c, false)?;
        }

        frame_controller.reset();

        let time = now - start;
        let ms = (time.as_secs() * 1000 + time.subsec_millis() as u64) as i64;
        let res = match c.frame(spf) {
            Ok(frame) => {
                repeat_encode_counter = 0;
                if frame.valid() {
                    let screenshot = SCREENSHOTS.lock().unwrap().remove(&display_idx);
                    if let Some(mut screenshot) = screenshot {
                        let restore_vram = screenshot.restore_vram;
                        let (msg, w, h, data) = match &frame {
                            scrap::Frame::PixelBuffer(f) => match get_rgba_from_pixelbuf(f) {
                                Ok(rgba) => ("".to_owned(), f.width(), f.height(), rgba),
                                Err(e) => {
                                    let serr = e.to_string();
                                    log::error!(
                                        "Failed to convert the pix format into rgba, {}",
                                        &serr
                                    );
                                    (format!("Convert pixfmt: {}", serr), 0, 0, vec![])
                                }
                            },
                            scrap::Frame::Texture(_) => {
                                if restore_vram {
                                    // Already set one time, just ignore to break infinite loop.
                                    // Though it's unreachable, this branch is kept to avoid infinite loop.
                                    (
                                        "Please change codec and try again.".to_owned(),
                                        0,
                                        0,
                                        vec![],
                                    )
                                } else {
                                    #[cfg(all(windows, feature = "vram"))]
                                    VRamEncoder::set_not_use(sp.name(), true);
                                    screenshot.restore_vram = true;
                                    SCREENSHOTS.lock().unwrap().insert(display_idx, screenshot);
                                    _raii.try_vram = false;
                                    bail!("SWITCH");
                                }
                            }
                        };
                        std::thread::spawn(move || {
                            handle_screenshot(screenshot, msg, w, h, data);
                        });
                        if restore_vram {
                            bail!("SWITCH");
                        }
                    }

                    let target_high_fps = spf <= Duration::from_millis(16);

                    #[cfg(all(windows, feature = "vram"))]
                    if high_fps_pipeline_enabled && target_high_fps && is_game_mode(&sp) {
                        let mut produced = false;
                        while let Ok(job) = encode_result_rx.try_recv() {
                            produced = true;
                            let send_conn_ids = job?;
                            frame_controller.set_send(now, send_conn_ids.send_conn_ids);
                            send_counter += 1;
                        }
                        if produced {
                            continue;
                        }
                    }

                    let mut texture_data = None;
                    let mut bgra_data: Option<Vec<u8>> = None;
                    let mut bgra_stride: usize = 0;
                    // SCC frame type trace (first 3 frames)
                    if codec_format == scrap::CodecFormat::ScreenContent {
                        static SCC_FRAME_COUNT: std::sync::atomic::AtomicU32 =
                            std::sync::atomic::AtomicU32::new(0);
                        let n = SCC_FRAME_COUNT.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                        if n < 3 {
                            use std::io::Write;
                            let is_tex = matches!(frame, scrap::Frame::Texture(_));
                            if let Ok(mut f) = std::fs::OpenOptions::new()
                                .create(true)
                                .append(true)
                                .open("C:\\ProgramData\\scc_debug.log")
                            {
                                let _ = writeln!(f, "[SCC-FRAME] #{}: is_texture={}", n, is_tex);
                            }
                        }
                    }
                    match frame {
                        scrap::Frame::Texture(t) => {
                            if codec_format == scrap::CodecFormat::ScreenContent {
                                // Stale GPU texture from before SCC switch — silently drop
                                {
                                    use std::io::Write;
                                    if let Ok(mut f) = std::fs::OpenOptions::new()
                                        .create(true)
                                        .append(true)
                                        .open("C:\\ProgramData\\scc_debug.log")
                                    {
                                        let _ = writeln!(f, "[SCC-FRAME] GOT TEXTURE - dropping!");
                                    }
                                }
                                continue;
                            }
                            texture_data = Some(t);
                        }
                        scrap::Frame::PixelBuffer(ref pb) => {
                            if codec_format == scrap::CodecFormat::ScreenContent {
                                // SCC operates on raw BGRA, skip YUV conversion
                                // Store stride alongside data for correct row access
                                bgra_stride = pb.stride()[0];
                                bgra_data = Some(pb.data().to_vec());
                            } else {
                                // The dedicated high-fps texture worker already short-circuits above
                                // when it has produced encoded frames. If we drop the normal path here
                                // as well, a worker init/runtime failure leaves the session connected
                                // forever without sending a first video frame.
                                match frame.to(encoder.yuvfmt(), &mut yuv, &mut mid_data) {
                                    Ok(EncodeInput::YUV(_)) => {}
                                    Ok(EncodeInput::Texture(t)) => texture_data = Some(t),
                                    Ok(EncodeInput::BGRA(..)) => {} // unreachable for non-SCC
                                    Err(e) => {
                                        log::error!("frame format conversion failed: {}", e);
                                        bail!("SWITCH");
                                    }
                                }
                            }
                        }
                    }

                    // [EXTREME LOW BANDWIDTH]: Monochrome / Grayscale transformation & Dynamic FPS
                    // Strip UV color channels to drastically reduce encoder bitrate
                    // (not applicable for SCC which operates on BGRA directly)
                    let extreme_low_bw = sp.is_option_true("extreme-low-bandwidth");
                    if codec_format != scrap::CodecFormat::ScreenContent
                        && texture_data.is_none()
                        && extreme_low_bw
                        && yuv.len() > 0
                    {
                        let y_len = encoder.yuvfmt().w as usize * encoder.yuvfmt().h as usize;

                        // Dynamic FPS calculation based on Y channel diff
                        if yuv.len() >= y_len {
                            let current_y = &yuv[0..y_len];
                            let sample_step = 16_usize;
                            let total_samples = (y_len + sample_step - 1) / sample_step;

                            if prev_y_data.len() != total_samples {
                                prev_y_data.resize(total_samples, 0);
                                let mut sample_idx = 0;
                                for i in (0..y_len).step_by(sample_step) {
                                    prev_y_data[sample_idx] = current_y[i];
                                    sample_idx += 1;
                                }
                            } else {
                                let mut diff_count = 0u32;
                                let mut sample_idx = 0;

                                for i in (0..y_len).step_by(sample_step) {
                                    let curr_val = current_y[i];
                                    if curr_val.abs_diff(prev_y_data[sample_idx]) > 10 {
                                        diff_count += 1;
                                    }
                                    prev_y_data[sample_idx] = curr_val;
                                    sample_idx += 1;
                                }

                                let diff_ratio = if total_samples > 0 {
                                    diff_count as f32 / total_samples as f32
                                } else {
                                    0.0
                                };

                                // Map diff_ratio to FPS (0.01 -> 2 FPS, 0.10 -> 10 FPS)
                                let min_fps = 2.0;
                                let max_fps = 10.0;
                                let target_fps = if diff_ratio < 0.01 {
                                    min_fps
                                } else if diff_ratio > 0.10 {
                                    max_fps
                                } else {
                                    // Linear interpolation
                                    min_fps + (diff_ratio - 0.01) / 0.09 * (max_fps - min_fps)
                                };

                                let target_spf_ms = (1000.0 / target_fps) as u64;

                                // Asymmetric EMA for smooth transition
                                let current_ms = current_dynamic_spf.as_millis() as f64;
                                let new_ms = if (target_spf_ms as f64) < current_ms {
                                    target_spf_ms as f64
                                } else {
                                    current_ms * 0.7 + target_spf_ms as f64 * 0.3
                                };
                                current_dynamic_spf = Duration::from_millis(new_ms as u64);
                            }
                        }

                        if yuv.len() > y_len {
                            yuv[y_len..].fill(128); // Neutral gray
                        }
                    }

                    let frame = if let Some(t) = texture_data {
                        EncodeInput::Texture(t)
                    } else if let Some(ref bgra) = bgra_data {
                        EncodeInput::BGRA(bgra, capture_width, capture_height, bgra_stride)
                    } else {
                        EncodeInput::YUV(&yuv)
                    };

                    let send_conn_ids = handle_one_frame(
                        display_idx,
                        &sp,
                        frame,
                        ms,
                        &mut encoder,
                        recorder.clone(),
                        &mut encode_fail_counter,
                        &mut first_frame,
                        capture_width,
                        capture_height,
                    )?;
                    frame_controller.set_send(now, send_conn_ids);
                    send_counter += 1;
                }
                Ok(())
            }
            Err(err) => Err(err),
        };

        match res {
            Err(ref e) if e.kind() == WouldBlock => {
                #[cfg(target_os = "linux")]
                {
                    would_block_count += 1;
                    if !is_x11() {
                        if would_block_count >= 100 {
                            // to-do: Unknown reason for WouldBlock 100 times (seconds = 100 * 1 / fps)
                            // https://github.com/rustdesk/rustdesk/blob/63e6b2f8ab51743e77a151e2b7ff18816f5fa2fb/libs/scrap/src/common/wayland.rs#L81
                            //
                            // Do not reset the capturer for now, as it will cause the prompt to show every few minutes.
                            // https://github.com/rustdesk/rustdesk/issues/4276
                            //
                            // super::wayland::clear();
                            // bail!("Wayland capturer none 100 times, try restart capture");
                        }
                    }
                }
                if !encoder.latency_free() && yuv.len() > 0 {
                    // yun.len() > 0 means the frame is not texture.
                    if repeat_encode_counter < repeat_encode_max {
                        repeat_encode_counter += 1;
                        let send_conn_ids = handle_one_frame(
                            display_idx,
                            &sp,
                            EncodeInput::YUV(&yuv),
                            ms,
                            &mut encoder,
                            recorder.clone(),
                            &mut encode_fail_counter,
                            &mut first_frame,
                            capture_width,
                            capture_height,
                        )?;
                        frame_controller.set_send(now, send_conn_ids);
                        send_counter += 1;
                    }
                }

                #[cfg(all(windows, feature = "vram"))]
                if high_fps_pipeline_enabled && is_game_mode(&sp) {
                    let target_high_fps = spf <= Duration::from_millis(16);
                    if target_high_fps {
                        while let Ok(job) = encode_result_rx.try_recv() {
                            if let Ok(output) = job {
                                frame_controller
                                    .set_send(time::Instant::now(), output.send_conn_ids);
                                send_counter += 1;
                            }
                        }
                    }
                }

                std::thread::yield_now();
                continue;
            }
            Err(err) => {
                // This check may be redundant, but it is better to be safe.
                // The previous check in `sp.is_option_true(OPTION_REFRESH)` block may be enough.
                if vs.source.is_monitor() {
                    try_broadcast_display_changed(&sp, display_idx, &c, true)?;
                }

                return Err(err.into());
            }
            _ => {
                #[cfg(target_os = "linux")]
                {
                    would_block_count = 0;
                }
            }
        }

        let mut fetched_conn_ids = Vec::new();
        // 120帧每帧只有 8.3ms，如果是高帧率模式(spf <= 16ms)，最多只等 2ms，拒绝死等
        let timeout_millis = if spf.as_millis() <= 16 {
            2u64
        } else {
            1_000u64
        };
        let wait_begin = Instant::now();
        while wait_begin.elapsed().as_millis() < timeout_millis as _ {
            if vs.source.is_monitor() {
                check_privacy_mode_changed(&sp, display_idx, &c)?;
            }
            // 将单次等待从 100ms 降为 1ms，极速轮询防阻塞
            frame_controller.try_wait_next(&mut fetched_conn_ids, 1);
            // break if all connections have received current frame
            if fetched_conn_ids.len() >= frame_controller.send_conn_ids.len() {
                break;
            }
        }
        DISPLAY_CONN_IDS.lock().unwrap().remove(&display_idx);

        let elapsed = now.elapsed();
        // may need to enable frame(timeout)
        log::trace!("{:?} {:?}", time::Instant::now(), elapsed);
        // [EXTREME LOW BANDWIDTH] Use dynamic SPF if enabled
        let extreme_low_bw = sp.is_option_true("extreme-low-bandwidth");
        let actual_spf = if extreme_low_bw {
            std::cmp::max(spf, current_dynamic_spf)
        } else {
            spf
        };

        if let Err(e) = check_qos(
            &mut encoder,
            &mut quality,
            &mut spf,
            client_record,
            &mut send_counter,
            &mut second_instant,
            &sp.name(),
            extreme_low_bw,
        ) {
            bail!(e);
        }

        if elapsed < actual_spf {
            let target_time = now + (actual_spf - elapsed);
            hybrid_sleep_until(target_time);
        }
    }

    Ok(())
}

struct Raii {
    display_idx: usize,
    name: String,
    try_vram: bool,
}

impl Raii {
    fn new(display_idx: usize, name: String) -> Self {
        log::info!("new video service: {}", name);
        VIDEO_QOS.lock().unwrap().new_display(name.clone());
        Raii {
            display_idx,
            name,
            try_vram: true,
        }
    }
}

impl Drop for Raii {
    fn drop(&mut self) {
        log::info!("stop video service: {}", self.name);
        #[cfg(feature = "vram")]
        if self.try_vram {
            VRamEncoder::set_not_use(self.name.clone(), false);
        }
        #[cfg(feature = "vram")]
        Encoder::update(scrap::codec::EncodingUpdate::Check);
        VIDEO_QOS.lock().unwrap().remove_display(&self.name);
        DISPLAY_CONN_IDS.lock().unwrap().remove(&self.display_idx);
    }
}

fn setup_encoder(
    c: &CapturerInfo,
    name: String,
    quality: f32,
    client_record: bool,
    record_incoming: bool,
    last_portable_service_running: bool,
    source: VideoSource,
    display_idx: usize,
    want_scc: bool,
) -> ResultType<(
    Encoder,
    EncoderCfg,
    CodecFormat,
    bool,
    Arc<Mutex<Option<Recorder>>>,
)> {
    let encoder_cfg = get_encoder_config(
        &c,
        name.to_string(),
        quality,
        client_record || record_incoming,
        last_portable_service_running,
        source,
        want_scc,
    )?;
    Encoder::set_fallback(&encoder_cfg);
    // Force correct codec_format regardless of negotiation timing
    let codec_format = if want_scc {
        CodecFormat::ScreenContent
    } else {
        // Never return ScreenContent when SCC is not wanted
        // (codec preference update may not have arrived yet)
        let nc = Encoder::negotiated_codec();
        if nc == CodecFormat::ScreenContent {
            CodecFormat::H264
        } else {
            nc
        }
    };
    let recorder = get_recorder(record_incoming, display_idx, source == VideoSource::Camera);
    let encoder = Encoder::new(encoder_cfg.clone(), false)?;
    Ok((encoder, encoder_cfg, codec_format, false, recorder))
}

fn get_encoder_config(
    c: &CapturerInfo,
    _name: String,
    quality: f32,
    record: bool,
    _portable_service: bool,
    _source: VideoSource,
    want_scc: bool,
) -> ResultType<EncoderCfg> {
    #[cfg(all(windows, feature = "vram"))]
    if _portable_service || c.is_gdi() || _source == VideoSource::Camera || want_scc {
        log::info!(
            "gdi:{}, portable:{}, want_scc:{}",
            c.is_gdi(),
            _portable_service,
            want_scc
        );
        VRamEncoder::set_not_use(_name.clone(), true);
    }
    #[cfg(feature = "vram")]
    Encoder::update(scrap::codec::EncodingUpdate::Check);
    let keyframe_interval = if record { Some(240) } else { None };
    // Force correct codec based on performance mode, not negotiation timing
    let negotiated_codec = if want_scc {
        CodecFormat::ScreenContent
    } else {
        let nc = Encoder::negotiated_codec();
        if nc == CodecFormat::ScreenContent {
            CodecFormat::H264
        } else {
            nc
        }
    };
    match negotiated_codec {
        CodecFormat::H264 | CodecFormat::H265 | CodecFormat::AV1 => {
            #[cfg(feature = "vram")]
            if let Some(feature) = VRamEncoder::try_get(&c.device(), negotiated_codec) {
                return Ok(EncoderCfg::VRAM(VRamEncoderConfig {
                    device: c.device(),
                    width: c.width,
                    height: c.height,
                    quality,
                    feature,
                    keyframe_interval,
                }));
            }
            #[cfg(feature = "hwcodec")]
            if let Some(hw) = HwRamEncoder::try_get(negotiated_codec) {
                return Ok(EncoderCfg::HWRAM(HwRamEncoderConfig {
                    name: hw.name,
                    mc_name: hw.mc_name,
                    width: c.width,
                    height: c.height,
                    quality,
                    keyframe_interval,
                }));
            }
            bail!("No H264/H265 encoder path available for the current environment")
        }
        CodecFormat::ScreenContent => {
            // SCC needs PixelBuffer (CPU), not GPU Texture.
            // Force VRAM encoder off so capturer returns PixelBuffer.
            #[cfg(feature = "vram")]
            VRamEncoder::set_not_use(_name.clone(), true);
            return Ok(EncoderCfg::SCC(scrap::scc::SccEncoderConfig {
                width: c.width,
                height: c.height,
            }));
        }
        _ => bail!("Negotiated codec {:?} is not supported", negotiated_codec),
    }
}

fn get_recorder(
    record_incoming: bool,
    display_idx: usize,
    camera: bool,
) -> Arc<Mutex<Option<Recorder>>> {
    #[cfg(windows)]
    let root = crate::platform::is_root();
    #[cfg(not(windows))]
    let root = false;
    let recorder = if record_incoming {
        use crate::hbbs_http::record_upload;

        let tx = if record_upload::is_enable() {
            let (tx, rx) = std::sync::mpsc::channel();
            record_upload::run(rx);
            Some(tx)
        } else {
            None
        };
        Recorder::new(RecorderContext {
            server: true,
            id: Config::get_id(),
            dir: crate::ui_interface::video_save_directory(root),
            display_idx,
            camera,
            tx,
        })
        .map_or(Default::default(), |r| Arc::new(Mutex::new(Some(r))))
    } else {
        Default::default()
    };

    recorder
}

#[cfg(target_os = "android")]
fn check_change_scale(hardware: bool) -> ResultType<()> {
    use hbb_common::config::keys::OPTION_ENABLE_ANDROID_SOFTWARE_ENCODING_HALF_SCALE as SCALE_SOFT;

    // isStart flag is set at the end of startCapture() in Android, wait it to be set.
    let n = 60; // 3s
    for i in 0..n {
        if scrap::is_start() == Some(true) {
            log::info!("start flag is set");
            break;
        }
        log::info!("wait for start, {i}");
        std::thread::sleep(Duration::from_millis(50));
        if i == n - 1 {
            log::error!("wait for start timeout");
        }
    }
    let screen_size = scrap::screen_size();
    let scale_soft = hbb_common::config::option2bool(SCALE_SOFT, &Config::get_option(SCALE_SOFT));
    let half_scale = !hardware && scale_soft;
    log::info!("hardware: {hardware}, scale_soft: {scale_soft}, screen_size: {screen_size:?}",);
    scrap::android::call_main_service_set_by_name(
        "half_scale",
        Some(half_scale.to_string().as_str()),
        None,
    )
    .ok();
    let old_scale = screen_size.2;
    let new_scale = scrap::screen_size().2;
    log::info!("old_scale: {old_scale}, new_scale: {new_scale}");
    if old_scale != new_scale {
        log::info!("switch due to scale changed, {old_scale} -> {new_scale}");
        // switch is not a must, but it is better to do so.
        bail!("SWITCH");
    }
    Ok(())
}

fn check_privacy_mode_changed(
    sp: &GenericService,
    display_idx: usize,
    ci: &CapturerInfo,
) -> ResultType<()> {
    let privacy_mode_id_2 = get_privacy_mode_conn_id().unwrap_or(INVALID_PRIVACY_MODE_CONN_ID);
    if ci.privacy_mode_id != privacy_mode_id_2 {
        if privacy_mode_id_2 != INVALID_PRIVACY_MODE_CONN_ID {
            let msg_out = crate::common::make_privacy_mode_msg(
                back_notification::PrivacyModeState::PrvOnByOther,
                "".to_owned(),
            );
            sp.send_to_others(msg_out, privacy_mode_id_2);
        }
        log::info!("switch due to privacy mode changed");
        try_broadcast_display_changed(&sp, display_idx, ci, true).ok();
        bail!("SWITCH");
    }
    Ok(())
}

#[inline]
fn handle_one_frame_with_encoder_api(
    display: usize,
    sp: &GenericService,
    frame: EncodeInput,
    ms: i64,
    encoder: &mut dyn scrap::codec::EncoderApi,
    recorder: Arc<Mutex<Option<Recorder>>>,
    encode_fail_counter: &mut usize,
    first_frame: &mut bool,
    width: usize,
    height: usize,
) -> ResultType<Vec<i32>> {
    sp.snapshot(|sps| {
        // so that new sub and old sub share the same encoder after switch
        if sps.has_subscribes() {
            log::info!("switch due to new subscriber");
            bail!("SWITCH");
        }
        Ok(())
    })?;

    let mut send_conn_ids: Vec<i32> = Default::default();
    let first = *first_frame;
    *first_frame = false;
    match encoder.encode_to_message(frame, ms) {
        Ok(mut vf) => {
            *encode_fail_counter = 0;
            vf.display = display as _;
            let mut msg = Message::new();
            msg.set_video_frame(vf);
            recorder
                .lock()
                .unwrap()
                .as_mut()
                .map(|r| r.write_message(&msg, width, height));
            send_conn_ids = sp.send_video_frame(msg);
        }
        Err(e) => {
            *encode_fail_counter += 1;
            // Encoding errors are not frequent except on Android
            if !cfg!(target_os = "android") {
                log::error!("encode fail: {e:?}, times: {}", *encode_fail_counter,);
            }
            let max_fail_times = if cfg!(target_os = "android") && encoder.is_hardware() {
                9
            } else {
                3
            };
            let repeat = !encoder.latency_free();
            // repeat encoders can reach max_fail_times on the first frame
            if (first && !repeat) || *encode_fail_counter >= max_fail_times {
                *encode_fail_counter = 0;
                if encoder.is_hardware() {
                    encoder.disable();
                    log::error!("switch due to encoding fails, first frame: {first}, error: {e:?}");
                    bail!("SWITCH");
                }
            }
            match e.to_string().as_str() {
                scrap::codec::ENCODE_NEED_SWITCH => {
                    encoder.disable();
                    log::error!("switch due to encoder need switch");
                    bail!("SWITCH");
                }
                _ => {}
            }
        }
    }
    Ok(send_conn_ids)
}

#[inline]
fn handle_one_frame(
    display: usize,
    sp: &GenericService,
    frame: EncodeInput,
    ms: i64,
    encoder: &mut Encoder,
    recorder: Arc<Mutex<Option<Recorder>>>,
    encode_fail_counter: &mut usize,
    first_frame: &mut bool,
    width: usize,
    height: usize,
) -> ResultType<Vec<i32>> {
    handle_one_frame_with_encoder_api(
        display,
        sp,
        frame,
        ms,
        encoder.codec.as_mut(),
        recorder,
        encode_fail_counter,
        first_frame,
        width,
        height,
    )
}

#[inline]
pub fn refresh() {
    #[cfg(target_os = "android")]
    Display::refresh_size();
}

#[cfg(windows)]
fn start_uac_elevation_check() {
    static START: Once = Once::new();
    START.call_once(|| {
        if !crate::platform::is_installed() && !crate::platform::is_root() {
            std::thread::spawn(|| loop {
                std::thread::sleep(std::time::Duration::from_secs(1));
                if let Ok(uac) = is_process_consent_running() {
                    IS_UAC_RUNNING.store(uac, std::sync::atomic::Ordering::Relaxed);
                }
                if !crate::platform::is_elevated(None).unwrap_or(false) {
                    if let Ok(elevated) = crate::platform::is_foreground_window_elevated() {
                        IS_FOREGROUND_WINDOW_ELEVATED
                            .store(elevated, std::sync::atomic::Ordering::Relaxed);
                    }
                }
            });
        }
    });
}

#[inline]
fn try_broadcast_display_changed(
    sp: &GenericService,
    display_idx: usize,
    cap: &CapturerInfo,
    refresh: bool,
) -> ResultType<()> {
    if refresh {
        // Get display information immediately.
        crate::display_service::check_displays_changed().ok();
    }
    if let Some(display) = check_display_changed(
        cap.ndisplay,
        cap.current,
        (cap.origin.0, cap.origin.1, cap.width, cap.height),
    ) {
        log::info!("Display {} changed", display);
        if let Some(msg_out) =
            make_display_changed_msg(display_idx, Some(display), VideoSource::Monitor)
        {
            let msg_out = Arc::new(msg_out);
            sp.send_shared(msg_out.clone());
            // switch display may occur before the first video frame, add snapshot to send to new subscribers
            sp.snapshot(move |sps| {
                sps.send_shared(msg_out.clone());
                Ok(())
            })?;
            bail!("SWITCH");
        }
    }
    Ok(())
}

pub fn make_display_changed_msg(
    display_idx: usize,
    opt_display: Option<DisplayInfo>,
    source: VideoSource,
) -> Option<Message> {
    let display = match opt_display {
        Some(d) => d,
        None => match source {
            VideoSource::Monitor => display_service::get_display_info(display_idx)?,
            VideoSource::Camera => camera::Cameras::get_sync_cameras()
                .get(display_idx)?
                .clone(),
        },
    };
    let mut misc = Misc::new();
    misc.set_switch_display(SwitchDisplay {
        display: display_idx as _,
        x: display.x,
        y: display.y,
        width: display.width,
        height: display.height,
        cursor_embedded: match source {
            VideoSource::Monitor => display_service::capture_cursor_embedded(),
            VideoSource::Camera => false,
        },
        #[cfg(not(target_os = "android"))]
        resolutions: Some(SupportedResolutions {
            resolutions: match source {
                VideoSource::Monitor => {
                    if display.name.is_empty() {
                        vec![]
                    } else {
                        crate::platform::resolutions(&display.name)
                    }
                }
                VideoSource::Camera => camera::Cameras::get_camera_resolution(display_idx)
                    .ok()
                    .into_iter()
                    .collect(),
            },
            ..SupportedResolutions::default()
        })
        .into(),
        original_resolution: display.original_resolution,
        ..Default::default()
    });
    let mut msg_out = Message::new();
    msg_out.set_misc(misc);
    Some(msg_out)
}

fn check_qos(
    encoder: &mut Encoder,
    ratio: &mut f32,
    spf: &mut Duration,
    client_record: bool,
    send_counter: &mut usize,
    second_instant: &mut Instant,
    name: &str,
    extreme_low_bw: bool,
) -> ResultType<()> {
    *spf = Duration::from_micros(
        VIDEO_QOS_FAST
            .spf_micros
            .load(std::sync::atomic::Ordering::Relaxed)
            .max(1),
    );

    // [EXTREME LOW BANDWIDTH]: Frame rate is now dynamically managed in the main loop
    // But we still apply a baseline minimum cap here to prevent completely uncapped FPS
    if extreme_low_bw {
        let max_bw_spf = std::time::Duration::from_millis(100); // Max 10 FPS
        if *spf < max_bw_spf {
            *spf = max_bw_spf;
        }
    }

    let target_ratio = f32::from_bits(
        VIDEO_QOS_FAST
            .ratio_bits
            .load(std::sync::atomic::Ordering::Relaxed),
    );
    if *ratio != target_ratio {
        *ratio = target_ratio;
        if encoder.support_changing_quality() {
            allow_err!(encoder.set_quality(*ratio));
            let mut video_qos = VIDEO_QOS.lock().unwrap();
            video_qos.store_bitrate(encoder.bitrate());
            video_qos.refresh_fast_path();
        } else {
            // Now only vaapi doesn't support changing quality
            let should_switch = !VIDEO_QOS_FAST
                .vbr
                .load(std::sync::atomic::Ordering::Relaxed)
                && !VIDEO_QOS_FAST
                    .custom_quality
                    .load(std::sync::atomic::Ordering::Relaxed);
            if should_switch {
                log::info!("switch to change quality");
                bail!("SWITCH");
            }
        }
    }
    let fast_record = VIDEO_QOS_FAST
        .record
        .load(std::sync::atomic::Ordering::Relaxed);
    if client_record != fast_record {
        log::info!("switch due to record changed");
        bail!("SWITCH");
    }
    if second_instant.elapsed() > Duration::from_secs(1) {
        *second_instant = Instant::now();
        let mut video_qos = VIDEO_QOS.lock().unwrap();
        video_qos.update_display_data(&name, *send_counter);
        *send_counter = 0;
    }
    Ok(())
}

pub fn set_take_screenshot(display_idx: usize, sid: String, tx: Sender) {
    SCREENSHOTS.lock().unwrap().insert(
        display_idx,
        Screenshot {
            sid,
            tx,
            restore_vram: false,
        },
    );
}

// We need to this function, because the `stride` may be larger than `width * 4`.
fn get_rgba_from_pixelbuf<'a>(pixbuf: &scrap::PixelBuffer<'a>) -> ResultType<Vec<u8>> {
    let w = pixbuf.width();
    let h = pixbuf.height();
    let stride = pixbuf.stride();
    let Some(s) = stride.get(0) else {
        bail!("Invalid pixel buf stride.")
    };

    if *s == w * 4 {
        let mut rgba = vec![];
        scrap::convert(pixbuf, scrap::Pixfmt::RGBA, &mut rgba)?;
        Ok(rgba)
    } else {
        let bgra = pixbuf.data();
        let mut bit_flipped = vec![0u8; w * h * 4];
        for y in 0..h {
            let row_start = *s * y;
            let src_row = &bgra[row_start..row_start + w * 4];
            let dst_row = &mut bit_flipped[(w * 4 * y)..(w * 4 * (y + 1))];

            for (dst, src) in dst_row.chunks_exact_mut(4).zip(src_row.chunks_exact(4)) {
                dst[0] = src[2];
                dst[1] = src[1];
                dst[2] = src[0];
                dst[3] = src[3];
            }
        }
        Ok(bit_flipped)
    }
}

fn handle_screenshot(screenshot: Screenshot, msg: String, w: usize, h: usize, data: Vec<u8>) {
    let mut response = ScreenshotResponse::new();
    response.sid = screenshot.sid;
    if msg.is_empty() {
        if data.is_empty() {
            response.msg = "Failed to take screenshot, please try again later.".to_owned();
        } else {
            fn encode_png(width: usize, height: usize, rgba: Vec<u8>) -> ResultType<Vec<u8>> {
                let mut png = Vec::new();
                let mut encoder =
                    repng::Options::smallest(width as _, height as _).build(&mut png)?;
                encoder.write(&rgba)?;
                encoder.finish()?;
                Ok(png)
            }
            match encode_png(w as _, h as _, data) {
                Ok(png) => {
                    response.data = png.into();
                }
                Err(e) => {
                    response.msg = format!("Error encoding png: {}", e);
                }
            }
        }
    } else {
        response.msg = msg;
    }
    let mut msg_out = Message::new();
    msg_out.set_screenshot_response(response);
    if let Err(e) = screenshot
        .tx
        .send((hbb_common::tokio::time::Instant::now(), Arc::new(msg_out)))
    {
        log::error!("Failed to send screenshot, {}", e);
    }
}
