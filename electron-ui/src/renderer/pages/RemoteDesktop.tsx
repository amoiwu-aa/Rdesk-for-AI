import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useRemoteSession, type FrameInfo, type QualityStatus } from '../hooks/useRemoteSession'
import RemoteCanvas from '../components/RemoteCanvas'
import ChatPanel from '../components/ChatPanel'
import FileTransferPanel from '../components/FileTransferPanel'
import { useT } from '../i18n'
import { useSettingsStore } from '../stores/settings'

// ─── Icons as small components ────────────────────────────────────

function PasswordDialog({
  error,
  onSubmit,
  onCancel
}: {
  error?: string
  onSubmit: (password: string, remember: boolean) => void
  onCancel: () => void
}) {
  const t = useT()
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
      <div className="bg-surface-light rounded-xl p-6 w-80 border border-surface-lighter shadow-2xl">
        <h3 className="text-lg font-bold text-text-primary mb-1">{t('remote.passwordRequired')}</h3>
        <p className="text-xs text-text-secondary mb-4">{t('remote.enterPassword')}</p>

        {error && (
          <div className="text-xs text-red-400 bg-red-400/10 rounded-lg p-2 mb-3">{error}</div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && password && onSubmit(password, remember)}
          placeholder={t('remote.password')}
          autoFocus
          className="w-full bg-surface border border-surface-lighter rounded-lg px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors mb-3"
        />

        <label className="flex items-center gap-2 text-xs text-text-secondary mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-surface-lighter"
          />
          {t('remote.rememberPassword')}
        </label>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            {t('remote.cancel')}
          </button>
          <button
            onClick={() => password && onSubmit(password, remember)}
            disabled={!password}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark disabled:bg-surface-lighter disabled:text-text-secondary rounded-lg text-white text-sm transition-colors"
          >
            {t('remote.login')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RemoteDesktop() {
  const t = useT()
  const loadSettings = useSettingsStore(s => s.loadFromConfig)
  const { peerId } = useParams<{ peerId: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || ''
  const forceRelay = searchParams.get('relay') === '1'
  const [frameInfo, setFrameInfo] = useState<FrameInfo | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showDisplays, setShowDisplays] = useState(false)
  const qualityRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const displaysRef = useRef<HTMLDivElement>(null)

  // Phase 2: Actions state
  const [screenshotCooldown, setScreenshotCooldown] = useState(false)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)

  // Phase 4: Toolbar pin/collapse
  const [toolbarPinned, setToolbarPinned] = useState(true)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const toolbarHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Phase 1: Current display selection
  const [currentDisplay, setCurrentDisplay] = useState(0)
  const [allDisplaysMode, setAllDisplaysMode] = useState(false)

  // Track current quality settings for UI feedback
  const [curQuality, setCurQuality] = useState('balanced')
  const [curCodec, setCurCodec] = useState('')
  const [curFps, setCurFps] = useState(60)
  const [curMode, setCurMode] = useState('standard')
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})

  // Load settings (language/theme) for new window
  useEffect(() => {
    loadSettings()
  }, [])

  // Sync fullscreen state with browser fullscreen API (handles Escape key exit)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Check initial maximized state
  useEffect(() => {
    window.api.isMaximized().then(setMaximized)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showQuality && !showActions && !showDisplays) return
    const handler = (e: MouseEvent) => {
      if (showQuality && qualityRef.current && !qualityRef.current.contains(e.target as Node)) {
        setShowQuality(false)
      }
      if (showActions && actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
      if (showDisplays && displaysRef.current && !displaysRef.current.contains(e.target as Node)) {
        setShowDisplays(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showQuality, showActions, showDisplays])

  // Phase 4: Toolbar auto-hide when unpinned
  useEffect(() => {
    if (toolbarPinned || isFullscreen) return
    if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current)
    toolbarHideTimer.current = setTimeout(() => {
      setToolbarVisible(false)
    }, 2000)
    return () => {
      if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current)
    }
  }, [toolbarPinned, isFullscreen, toolbarVisible])

  // Clipboard sync: listen for Ctrl+V in canvas and send local clipboard
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        try {
          const text = await navigator.clipboard.readText()
          if (text) {
            window.api.native.setClipboard(sessionId, text).catch(() => {})
          }
        } catch {}
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [sessionId])

  const onFrame = useCallback((frame: FrameInfo) => {
    setFrameInfo(frame)
  }, [])

  const {
    status, peerInfo, error, usingRelay, qualityStatus,
    connectionInfo, permissions, recording, blockInput,
    login, reconnect, disconnect
  } = useRemoteSession({
    sessionId,
    peerId: peerId || '',
    forceRelay,
    onFrame
  })

  const handleDisconnect = async () => {
    await disconnect()
    window.api.close()
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleMaximize = () => {
    window.api.maximize()
    setMaximized(!maximized)
  }

  const handleCtrlAltDel = () => {
    window.api.native.ctrlAltDel(sessionId).catch(() => {})
  }

  const handleLockScreen = () => {
    window.api.native.lockScreen(sessionId).catch(() => {})
  }

  const handleRefresh = () => {
    window.api.native.refresh(sessionId, frameInfo?.display || 0).catch(() => {})
  }

  const handleToggleOption = async (opt: string) => {
    await window.api.native.toggleOption(sessionId, opt).catch(() => {})
    // Update local state
    const newVal = await window.api.native.getToggleOption(sessionId, opt).catch(() => false)
    setToggleStates(prev => ({ ...prev, [opt]: newVal as boolean }))
  }

  // ─── Phase 1: Display switching ─────────────────────────────
  const handleSwitchDisplay = async (display: number) => {
    setCurrentDisplay(display)
    setAllDisplaysMode(false)
    await window.api.native.switchDisplay(sessionId, display).catch(() => {})
    setShowDisplays(false)
  }

  const handleAllDisplays = async () => {
    if (!peerInfo?.displays) return
    const allIndices = peerInfo.displays.map((_, i) => i)
    setAllDisplaysMode(true)
    await window.api.native.captureDisplays(sessionId, [], [], allIndices).catch(() => {})
    setShowDisplays(false)
  }

  // ─── Phase 2: Session control actions ─────────────────────────
  const handleRestartDevice = async () => {
    await window.api.native.restartRemoteDevice(sessionId).catch(() => {})
    setShowRestartConfirm(false)
    setShowActions(false)
  }

  const handleToggleBlockInput = async () => {
    await window.api.native.toggleOption(sessionId, 'block-input').catch(() => {})
  }

  const handleScreenshot = async () => {
    if (screenshotCooldown) return
    setScreenshotCooldown(true)
    await window.api.native.takeScreenshot(sessionId, frameInfo?.display || 0).catch(() => {})
    setTimeout(() => setScreenshotCooldown(false), 3000)
  }

  const handleToggleRecording = async () => {
    await window.api.native.recordScreen(sessionId, !recording).catch(() => {})
  }

  const handleTogglePrivacyMode = async () => {
    // Toggle privacy mode — uses default implementation key
    const currentlyOn = toggleStates['privacy-mode'] || false
    await window.api.native.togglePrivacyMode(sessionId, '', !currentlyOn).catch(() => {})
    setToggleStates(prev => ({ ...prev, 'privacy-mode': !currentlyOn }))
  }

  const handleElevation = async () => {
    await window.api.native.elevateDirect(sessionId).catch(() => {})
    setShowActions(false)
  }

  const handleToggleViewOnly = async () => {
    await handleToggleOption('view-only')
  }

  // ─── Phase 3: Keyboard mode ─────────────────────────────────
  const [curKeyboardMode, setCurKeyboardMode] = useState('')

  // ─── Phase 4: Toolbar hover handlers ─────────────────────────
  const handleToolbarMouseEnter = () => {
    if (toolbarHideTimer.current) clearTimeout(toolbarHideTimer.current)
    setToolbarVisible(true)
  }

  const handleToolbarMouseLeave = () => {
    if (toolbarPinned || isFullscreen) return
    toolbarHideTimer.current = setTimeout(() => {
      setToolbarVisible(false)
    }, 2000)
  }

  // Load toggle states when quality dropdown opens
  useEffect(() => {
    if (!showQuality || !sessionId) return
    const opts = ['show-remote-cursor', 'disable-audio', 'disable-clipboard', 'lock-after-session-end', 'view-only', 'reverse-mouse-wheel', 'swap-left-right-mouse', 'allow_swap_key', 'i444', 'follow-remote-cursor', 'zoom-cursor']
    Promise.all(opts.map(async opt => {
      const val = await window.api.native.getToggleOption(sessionId, opt).catch(() => false)
      return [opt, val] as [string, boolean]
    })).then(pairs => {
      setToggleStates(Object.fromEntries(pairs))
    })
    // Also load current codec preference and keyboard mode
    window.api.native.sessionGetOption(sessionId, 'codec-preference').then(v => setCurCodec(v || '')).catch(() => {})
    window.api.native.getKeyboardMode(sessionId).then(v => setCurKeyboardMode(v || 'legacy')).catch(() => {})
  }, [showQuality, sessionId])

  // Apply performance mode preset
  const applyPerformanceMode = async (mode: string) => {
    let quality: string, fps: number, codec: string
    switch (mode) {
      case 'office':
        quality = 'low'; fps = 30; codec = 'vp9'; break
      case 'game':
        quality = 'best'; fps = 120; codec = 'h264'; break
      case 'standard':
      default:
        quality = 'balanced'; fps = 60; codec = ''; break
    }
    setCurMode(mode)
    setCurQuality(quality)
    setCurFps(fps)
    setCurCodec(codec)
    await window.api.native.saveImageQuality(sessionId, quality).catch(() => {})
    await window.api.native.setCustomFps(sessionId, fps).catch(() => {})
    await window.api.native.sessionSetOption(sessionId, 'codec-preference', codec).catch(() => {})
    window.api.native.changePreferCodec(sessionId).catch(() => {})
    setShowQuality(false)
  }

  if (!peerId || !sessionId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-text-secondary">{t('remote.invalidSession')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black relative">
      {/* Toolbar with drag region + window controls */}
      {(!isFullscreen && (toolbarPinned || toolbarVisible)) && (
        <div
          className="flex items-center justify-between bg-surface border-b border-surface-lighter shrink-0 select-none"
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
        >
          {/* Left: drag region + session info */}
          <div className="drag-region flex-1 flex items-center gap-3 px-4 py-2">
            <button
              onClick={handleDisconnect}
              className="no-drag text-text-secondary hover:text-red-400 transition-colors"
              title={t('remote.disconnect')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="text-sm text-text-primary font-medium">
              {peerInfo?.hostname || peerId}
            </div>
            {peerInfo && (
              <span className="text-xs text-text-secondary">
                {peerInfo.username}@{peerInfo.platform}
              </span>
            )}
            <StatusBadge status={status} />

            {/* Connection info badges */}
            {connectionInfo && status === 'connected' && (
              <>
                <span className={`no-drag text-[10px] px-2 py-0.5 rounded-full ${
                  connectionInfo.secure ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {connectionInfo.secure ? t('remote.connectionSecure') : t('remote.connectionInsecure')}
                </span>
                <span className={`no-drag text-[10px] px-2 py-0.5 rounded-full ${
                  connectionInfo.direct ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {connectionInfo.direct ? t('remote.connectionDirect') : t('remote.connectionRelay')}
                </span>
              </>
            )}
            {!connectionInfo && usingRelay && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                Relay
              </span>
            )}
            {/* Quality monitor */}
            {qualityStatus && status === 'connected' && (
              <div className="flex items-center gap-2 text-[10px] text-text-secondary ml-2">
                {qualityStatus.fps != null && (
                  <span title="FPS">{qualityStatus.fps} fps</span>
                )}
                {qualityStatus.decodeFps != null && (
                  <span title="Decode FPS">d:{qualityStatus.decodeFps}</span>
                )}
                {qualityStatus.delay != null && (
                  <span title="Latency" className={qualityStatus.delay > 200 ? 'text-red-400' : qualityStatus.delay > 100 ? 'text-orange-400' : ''}>
                    {qualityStatus.delay}ms
                  </span>
                )}
                {qualityStatus.speed && (
                  <span title="Speed">{qualityStatus.speed}</span>
                )}
                {(qualityStatus.codecFormat || qualityStatus.decoderType) && (
                  <span className="px-1.5 py-0 rounded bg-surface-lighter/50" title="Codec / Decoder">
                    {qualityStatus.codecFormat || qualityStatus.decoderType}
                  </span>
                )}
                {qualityStatus.chroma && (
                  <span title="Chroma">{qualityStatus.chroma}</span>
                )}
                {qualityStatus.connectionType && (
                  <span className="px-1.5 py-0 rounded bg-surface-lighter/50" title="Connection Type">
                    {qualityStatus.connectionType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: session tools + window controls */}
          <div className="no-drag flex items-center">
            {/* Display selector (Phase 1) */}
            {peerInfo && peerInfo.displays.length > 1 && (
              <div ref={displaysRef} className="relative">
                <ToolbarButton title={t('remote.displays')} onClick={() => setShowDisplays(!showDisplays)} active={showDisplays}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </ToolbarButton>
                {showDisplays && (
                  <div className="absolute top-full right-0 mt-1 w-44 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20">
                    {peerInfo.displays.map((disp, i) => (
                      <button
                        key={i}
                        onClick={() => handleSwitchDisplay(i)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                          !allDisplaysMode && currentDisplay === i ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        {t('remote.displays')} {i + 1}
                        <span className="text-[9px] text-text-secondary/60 ml-auto">{disp.width}x{disp.height}</span>
                      </button>
                    ))}
                    <div className="border-t border-surface-lighter/30 my-1" />
                    <button
                      onClick={handleAllDisplays}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        allDisplaysMode ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="10" height="7" rx="1" />
                        <rect x="13" y="4" width="10" height="7" rx="1" />
                        <line x1="8" y1="18" x2="16" y2="18" />
                        <line x1="12" y1="14" x2="12" y2="18" />
                      </svg>
                      {t('remote.allDisplays')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Session tools */}
            <ToolbarButton title={t('remote.refresh')} onClick={handleRefresh}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </ToolbarButton>

            {/* Quality control (expanded with Phase 3 & 5 options) */}
            <div ref={qualityRef} className="relative">
              <ToolbarButton title={t('remote.quality')} onClick={() => setShowQuality(!showQuality)} active={showQuality}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </ToolbarButton>
              {showQuality && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20 max-h-[80vh] overflow-y-auto">
                  {/* Performance Modes */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">{t('remote.performanceMode')}</div>
                  {[
                    { label: t('remote.modeOffice'), value: 'office', desc: '30fps / Low / VP9' },
                    { label: t('remote.modeStandard'), value: 'standard', desc: '60fps / Balanced / Auto' },
                    { label: t('remote.modeGame'), value: 'game', desc: '120fps / Best / H264' },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => applyPerformanceMode(item.value)}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                        curMode === item.value ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[9px] text-text-secondary/60">{item.desc}</span>
                    </button>
                  ))}

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Image Quality */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">{t('remote.qualitySettings')}</div>
                  {[
                    { label: t('settings.qualityBest'), value: 'best' },
                    { label: t('settings.qualityBalanced'), value: 'balanced' },
                    { label: t('settings.qualityLow'), value: 'low' },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setCurQuality(item.value)
                        setCurMode('')
                        window.api.native.saveImageQuality(sessionId, item.value).catch(() => {})
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        curQuality === item.value ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                      }`}
                    >
                      <span className={`w-3 text-center ${curQuality === item.value ? '' : 'opacity-0'}`}>&#10003;</span>
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* FPS */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">FPS</div>
                  <div className="px-3 py-1 flex flex-wrap gap-1">
                    {[15, 30, 60, 120].map(fps => (
                      <button
                        key={fps}
                        onClick={() => {
                          setCurFps(fps)
                          setCurMode('')
                          window.api.native.setCustomFps(sessionId, fps).catch(() => {})
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                          curFps === fps
                            ? 'bg-primary text-white'
                            : 'bg-surface-lighter/60 text-text-secondary hover:bg-surface-lighter hover:text-text-primary'
                        }`}
                      >
                        {fps}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Codec */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">{t('settings.codec')}</div>
                  {[
                    { label: 'Auto', value: '' },
                    { label: 'VP9', value: 'vp9' },
                    { label: 'H264', value: 'h264' },
                    { label: 'H265', value: 'h265' },
                    { label: 'AV1', value: 'av1' },
                  ].map(item => (
                    <button
                      key={item.value || 'auto'}
                      onClick={async () => {
                        setCurCodec(item.value)
                        setCurMode('')
                        await window.api.native.sessionSetOption(sessionId, 'codec-preference', item.value).catch(() => {})
                        window.api.native.changePreferCodec(sessionId).catch(() => {})
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        curCodec === item.value ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                      }`}
                    >
                      <span className={`w-3 text-center ${curCodec === item.value ? '' : 'opacity-0'}`}>&#10003;</span>
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Keyboard Mode (Phase 3) */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">{t('remote.keyboardMode')}</div>
                  {[
                    { label: t('remote.modeLegacy'), value: 'legacy' },
                    { label: t('remote.modeMap'), value: 'map' },
                    { label: t('remote.modeTranslate'), value: 'translate' },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={async () => {
                        setCurKeyboardMode(item.value)
                        await window.api.native.saveKeyboardMode(sessionId, item.value).catch(() => {})
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                        curKeyboardMode === item.value ? 'text-primary bg-primary/10' : 'text-text-primary hover:bg-surface-lighter/50'
                      }`}
                    >
                      <span className={`w-3 text-center ${curKeyboardMode === item.value ? '' : 'opacity-0'}`}>&#10003;</span>
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Toggles (extended with Phase 3 & 5 options) */}
                  <div className="px-3 py-1 text-[10px] text-text-secondary/50 uppercase tracking-wide">{t('remote.toggles')}</div>
                  {[
                    { label: t('remote.showRemoteCursor'), opt: 'show-remote-cursor' },
                    { label: t('remote.disableAudio'), opt: 'disable-audio' },
                    { label: t('remote.disableClipboard'), opt: 'disable-clipboard' },
                    { label: t('remote.lockAfterDisconnect'), opt: 'lock-after-session-end' },
                    { label: t('remote.viewOnly'), opt: 'view-only' },
                    { label: t('remote.reverseWheel'), opt: 'reverse-mouse-wheel' },
                    { label: t('remote.swapMouse'), opt: 'swap-left-right-mouse' },
                    { label: t('remote.swapCtrlCmd'), opt: 'allow_swap_key' },
                    { label: t('remote.trueColor'), opt: 'i444' },
                    { label: t('remote.followCursor'), opt: 'follow-remote-cursor' },
                    { label: t('remote.zoomCursor'), opt: 'zoom-cursor' },
                  ].map(item => (
                    <button
                      key={item.opt}
                      onClick={() => handleToggleOption(item.opt)}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                    >
                      <span className={`w-8 h-4 rounded-full relative transition-colors inline-block ${
                        toggleStates[item.opt] ? 'bg-primary' : 'bg-surface-lighter'
                      }`}>
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          toggleStates[item.opt] ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions dropdown (Phase 2) */}
            <div ref={actionsRef} className="relative">
              <ToolbarButton title={t('remote.actions')} onClick={() => setShowActions(!showActions)} active={showActions}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </ToolbarButton>
              {showActions && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-surface-light border border-surface-lighter rounded-lg shadow-xl py-1 z-20">
                  {/* Restart remote device */}
                  {permissions.restart && (
                    <button
                      onClick={() => setShowRestartConfirm(true)}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      {t('remote.restartDevice')}
                    </button>
                  )}

                  {/* Block input */}
                  <button
                    onClick={handleToggleBlockInput}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                  >
                    <span className={`w-8 h-4 rounded-full relative transition-colors inline-block ${
                      blockInput ? 'bg-primary' : 'bg-surface-lighter'
                    }`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        blockInput ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </span>
                    {blockInput ? t('remote.unblockInput') : t('remote.blockInput')}
                  </button>

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Screenshot */}
                  <button
                    onClick={handleScreenshot}
                    disabled={screenshotCooldown}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 ${
                      screenshotCooldown ? 'text-text-secondary/50' : 'text-text-primary hover:bg-surface-lighter/50'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {screenshotCooldown ? t('remote.screenshotTaking') : t('remote.screenshot')}
                  </button>

                  {/* Recording */}
                  {permissions.recording && (
                    <button
                      onClick={handleToggleRecording}
                      className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full inline-block ${recording ? 'bg-red-500 animate-pulse' : 'bg-text-secondary/30'}`} />
                      {recording ? t('remote.recordStop') : t('remote.recordStart')}
                    </button>
                  )}

                  <div className="border-t border-surface-lighter/30 my-1" />

                  {/* Privacy mode */}
                  <button
                    onClick={handleTogglePrivacyMode}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                      {toggleStates['privacy-mode'] && <line x1="1" y1="1" x2="23" y2="23" />}
                    </svg>
                    {t('remote.privacyMode')}
                  </button>

                  {/* Elevation */}
                  <button
                    onClick={handleElevation}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-lighter/50 transition-colors flex items-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {t('remote.elevation')}
                  </button>
                </div>
              )}
            </div>

            <ToolbarButton title="Ctrl+Alt+Del" onClick={handleCtrlAltDel}>
              <span className="text-[10px] font-mono">C+A+D</span>
            </ToolbarButton>
            <ToolbarButton title={t('remote.lockScreen')} onClick={handleLockScreen}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </ToolbarButton>

            {/* Chat toggle */}
            <ToolbarButton title={t('remote.chat')} onClick={() => { setShowChat(!showChat); setShowFiles(false) }} active={showChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </ToolbarButton>

            {/* File transfer toggle */}
            <ToolbarButton title={t('remote.fileTransfer')} onClick={() => { setShowFiles(!showFiles); setShowChat(false) }} active={showFiles}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
            </ToolbarButton>

            <ToolbarButton title={t('remote.fullscreen')} onClick={handleToggleFullscreen}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </ToolbarButton>

            {/* Pin toolbar (Phase 4) */}
            <ToolbarButton
              title={toolbarPinned ? t('remote.unpinToolbar') : t('remote.pinToolbar')}
              onClick={() => setToolbarPinned(!toolbarPinned)}
              active={toolbarPinned}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {toolbarPinned ? (
                  <>
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
                  </>
                ) : (
                  <>
                    <line x1="2" y1="2" x2="22" y2="22" />
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24z" />
                  </>
                )}
              </svg>
            </ToolbarButton>

            {/* Separator */}
            <div className="w-px h-5 bg-surface-lighter mx-1" />

            {/* Window controls */}
            <button
              onClick={() => window.api.minimize()}
              className="w-11 h-9 flex items-center justify-center hover:bg-surface-light transition-colors"
              title={t('titlebar.minimize')}
            >
              <svg width="10" height="1" viewBox="0 0 10 1">
                <rect width="10" height="1" fill="#A0A0B0" />
              </svg>
            </button>
            <button
              onClick={handleMaximize}
              className="w-11 h-9 flex items-center justify-center hover:bg-surface-light transition-colors"
              title={maximized ? t('titlebar.restore') : t('titlebar.maximize')}
            >
              {maximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M2 0h8v8h-2v2H0V2h2V0zm1 1v1h5v5h1V1H3zM1 3v6h6V3H1z" fill="#A0A0B0" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <rect x="0" y="0" width="10" height="10" stroke="#A0A0B0" strokeWidth="1" fill="none" />
                </svg>
              )}
            </button>
            <button
              onClick={() => window.api.close()}
              className="w-11 h-9 flex items-center justify-center hover:bg-red-600 transition-colors"
              title={t('titlebar.close')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M1 1l8 8M9 1l-8 8" stroke="#A0A0B0" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toolbar hover trigger zone when hidden (Phase 4) */}
      {!isFullscreen && !toolbarPinned && !toolbarVisible && (
        <div
          className="h-1 bg-primary/30 shrink-0 cursor-pointer hover:h-2 hover:bg-primary/60 transition-all"
          onMouseEnter={() => setToolbarVisible(true)}
        />
      )}

      {/* Restart confirmation dialog (Phase 2) */}
      {showRestartConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <div className="bg-surface-light rounded-xl p-6 w-80 border border-surface-lighter shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-3">{t('remote.restartDevice')}</h3>
            <p className="text-xs text-text-secondary mb-4">{t('remote.restartConfirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                {t('remote.cancel')}
              </button>
              <button
                onClick={handleRestartDevice}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm transition-colors"
              >
                {t('remote.restartDevice')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
          {status === 'connected' && frameInfo && (
            <RemoteCanvas sessionId={sessionId} frameInfo={frameInfo} />
          )}

          {/* Connecting overlay */}
          {status === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="text-text-secondary text-sm">
                {usingRelay ? t('remote.connectingViaRelay') : t('remote.connectingTo')} {peerId}...
              </div>
            </div>
          )}

          {/* Password dialog */}
          {status === 'login_required' && (
            <PasswordDialog
              error={error}
              onSubmit={login}
              onCancel={handleDisconnect}
            />
          )}

          {/* Error overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-red-400 text-lg">{t('remote.connectionError')}</div>
              <div className="text-text-secondary text-sm max-w-md text-center">{error}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => reconnect()}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm transition-colors"
                >
                  {t('remote.retry')}
                </button>
                <button
                  onClick={() => reconnect(true)}
                  className="px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  {t('remote.retryViaRelay')}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  {t('remote.close')}
                </button>
              </div>
            </div>
          )}

          {/* Disconnected overlay */}
          {status === 'disconnected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-text-secondary text-lg">{t('remote.disconnected')}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => reconnect()}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-white text-sm transition-colors"
                >
                  {t('remote.reconnect')}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-surface-lighter rounded-lg text-text-secondary hover:text-text-primary text-sm transition-colors"
                >
                  {t('remote.close')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panels */}
        {showChat && <ChatPanel sessionId={sessionId} onClose={() => setShowChat(false)} />}
        {showFiles && (
          <div className="w-[520px] shrink-0">
            <FileTransferPanel sessionId={sessionId} onClose={() => setShowFiles(false)} />
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const t = useT()
  const colors: Record<string, string> = {
    connecting: 'bg-yellow-500/20 text-yellow-400',
    connected: 'bg-green-500/20 text-green-400',
    login_required: 'bg-blue-500/20 text-blue-400',
    disconnected: 'bg-gray-500/20 text-gray-400',
    error: 'bg-red-500/20 text-red-400'
  }

  const labelKeys: Record<string, string> = {
    connecting: 'remote.status.connecting',
    connected: 'remote.status.connected',
    login_required: 'remote.status.loginRequired',
    disconnected: 'remote.status.disconnected',
    error: 'remote.status.error'
  }

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors[status] || colors.disconnected}`}>
      {t(labelKeys[status] || status)}
    </span>
  )
}

function ToolbarButton({ title, onClick, children, active }: { title: string, onClick: () => void, children: React.ReactNode, active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-surface-lighter text-text-secondary hover:text-text-primary transition-colors ${active ? 'bg-surface-lighter text-primary' : ''}`}
    >
      {children}
    </button>
  )
}
