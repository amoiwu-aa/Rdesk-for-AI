import { useState, useEffect, useCallback, useRef } from 'react'

export type SessionStatus = 'connecting' | 'connected' | 'login_required' | 'disconnected' | 'error'

export interface PeerInfo {
  username: string
  hostname: string
  platform: string
  displays: Array<{ x: number; y: number; width: number; height: number }>
  currentDisplay: number
}

export interface FrameInfo {
  display: number
  width: number
  height: number
}

export interface QualityStatus {
  speed: string
  fps: number | null
  decodeFps: number | null
  delay: number | null
  codecFormat: string
  decoderType: string
  targetBitrate: string
  chroma: string
  connectionType: string
}

export interface ConnectionInfo {
  secure: boolean
  direct: boolean
  streamType: string
}

export interface Permissions {
  keyboard: boolean
  clipboard: boolean
  audio: boolean
  file: boolean
  restart: boolean
  recording: boolean
  blockInput: boolean
}

/** Parse fps from QualityStatus - can be a plain number "30" or HashMap JSON '{"0":30}' */
function parseFps(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  const str = String(raw)
  // Try plain number first
  const num = Number(str)
  if (!isNaN(num) && str.indexOf('{') === -1) return num
  // Try HashMap JSON: {"0": 30, "1": 25}
  try {
    const map = JSON.parse(str)
    if (typeof map === 'object' && map !== null) {
      const vals = Object.values(map) as number[]
      if (vals.length > 0) return vals[0]
    }
  } catch { /* not JSON */ }
  return null
}

interface SessionEvent {
  name: string
  [key: string]: unknown
}

interface UseRemoteSessionOptions {
  sessionId: string
  peerId: string
  forceRelay?: boolean
  onFrame?: (frame: FrameInfo) => void
}

// Network errors that should trigger auto-relay fallback
const NETWORK_ERROR_PATTERNS = [
  'os error 10053',  // WSAECONNABORTED
  'os error 10054',  // WSAECONNRESET
  'os error 10060',  // WSAETIMEDOUT
  'os error 10061',  // WSAECONNREFUSED
  'connection reset',
  'connection refused',
  'connection timed out',
  'connection aborted',
  'timed out',
  'timeout',
]

function isNetworkError(text: string): boolean {
  const lower = text.toLowerCase()
  return NETWORK_ERROR_PATTERNS.some(p => lower.includes(p))
}

export function useRemoteSession({ sessionId, peerId: rawPeerId, forceRelay = false, onFrame }: UseRemoteSessionOptions) {
  // Strip spaces from peer ID — RustDesk IDs are pure digits
  const peerId = rawPeerId.replace(/\s/g, '')
  const [status, setStatus] = useState<SessionStatus>('connecting')
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null)
  const [error, setError] = useState<string>('')
  const [msgbox, setMsgbox] = useState<{ type: string; title: string; text: string; link: string; hasRetry: boolean } | null>(null)
  const [usingRelay, setUsingRelay] = useState(forceRelay)
  const [qualityStatus, setQualityStatus] = useState<QualityStatus | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null)
  const [permissions, setPermissions] = useState<Permissions>({
    keyboard: true, clipboard: true, audio: true, file: true,
    restart: true, recording: true, blockInput: false,
  })
  const [recording, setRecording] = useState(false)
  const [blockInput, setBlockInput] = useState(false)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  // Track whether we've already tried auto-relay to avoid infinite retries
  const triedAutoRelayRef = useRef(forceRelay)

  const handleEvent = useCallback((evtSessionId: string, eventJson: string) => {
    if (evtSessionId !== sessionId) return

    try {
      const evt: SessionEvent = JSON.parse(eventJson)
      const name = evt.name as string

      switch (name) {
        case 'peer_info': {
          const info: PeerInfo = {
            username: (evt.username as string) || '',
            hostname: (evt.hostname as string) || '',
            platform: (evt.platform as string) || '',
            displays: (evt.displays as PeerInfo['displays']) || [],
            currentDisplay: (evt.current_display as number) || 0
          }
          setPeerInfo(info)
          setStatus('connected')
          setMsgbox(null)
          break
        }

        case 'msgbox': {
          const msgType = (evt.type as string) || ''
          const title = (evt.title as string) || ''
          const text = (evt.text as string) || ''
          const link = (evt.link as string) || ''
          const hasRetry = (evt.hasRetry as boolean) || false

          // Password required
          if (msgType === 'input-password' || msgType === 'password') {
            setStatus('login_required')
            setMsgbox({ type: msgType, title, text, link, hasRetry })
          } else if (msgType === 'error' || msgType === 're-input-password') {
            if (msgType === 're-input-password') {
              setStatus('login_required')
            } else {
              // Check if this is a network error and we haven't tried relay yet
              if (!triedAutoRelayRef.current && isNetworkError(text)) {
                console.log('[session] Direct connection failed, auto-retrying via relay:', text)
                triedAutoRelayRef.current = true
                setUsingRelay(true)
                setStatus('connecting')
                setError('')
                // Auto-retry with relay
                window.api.native.sessionReconnect(sessionId, true).catch((e) => {
                  console.error('[session] Auto-relay retry failed:', e)
                  setStatus('error')
                  setError(text)
                  setMsgbox({ type: msgType, title, text, link, hasRetry })
                })
                return // Don't set error state, we're retrying
              }
              setStatus('error')
            }
            setError(text)
            setMsgbox({ type: msgType, title, text, link, hasRetry })
          } else if (msgType === 'connecting') {
            setStatus('connecting')
          } else {
            setMsgbox({ type: msgType, title, text, link, hasRetry })
          }
          break
        }

        case 'connection_ready':
          setStatus('connected')
          setConnectionInfo({
            secure: evt.secure === 'true',
            direct: evt.direct === 'true',
            streamType: (evt.stream_type as string) || '',
          })
          break

        case 'permission': {
          // Update individual permission flags
          const permUpdates: Partial<Permissions> = {}
          for (const [key, val] of Object.entries(evt)) {
            if (key === 'name') continue
            const boolVal = val === 'true' || val === true
            if (key === 'keyboard') permUpdates.keyboard = boolVal
            else if (key === 'clipboard') permUpdates.clipboard = boolVal
            else if (key === 'audio') permUpdates.audio = boolVal
            else if (key === 'file') permUpdates.file = boolVal
            else if (key === 'restart') permUpdates.restart = boolVal
            else if (key === 'recording') permUpdates.recording = boolVal
            else if (key === 'block_input') permUpdates.blockInput = boolVal
          }
          setPermissions(prev => ({ ...prev, ...permUpdates }))
          break
        }

        case 'record_status':
          setRecording(evt.start === 'true' || evt.start === true)
          break

        case 'update_block_input_state':
          setBlockInput(evt.input_state === 'on')
          break

        case 'update_quality_status': {
          // Merge with previous state — delay comes from TestDelay (frequent),
          // fps/speed/codec come from status_timer (every ~1s). They are separate events.
          setQualityStatus(prev => {
            const incoming = {
              speed: (evt.speed as string) || '',
              fps: parseFps(evt.fps),
              decodeFps: evt.decode_fps ? Number(evt.decode_fps) || null : null,
              delay: evt.delay ? Number(evt.delay) || null : null,
              codecFormat: (evt.codec_format as string) || '',
              decoderType: (evt.decoder_type as string) || '',
              targetBitrate: (evt.target_bitrate as string) || '',
              chroma: (evt.chroma as string) || '',
              connectionType: (evt.connection_type as string) || '',
            }
            if (!prev) return incoming
            return {
              speed: incoming.speed || prev.speed,
              fps: incoming.fps ?? prev.fps,
              decodeFps: incoming.decodeFps ?? prev.decodeFps,
              delay: incoming.delay ?? prev.delay,
              codecFormat: incoming.codecFormat || prev.codecFormat,
              decoderType: incoming.decoderType || prev.decoderType,
              targetBitrate: incoming.targetBitrate || prev.targetBitrate,
              chroma: incoming.chroma || prev.chroma,
              connectionType: incoming.connectionType || prev.connectionType,
            }
          })
          break
        }

        case 'close':
          setStatus('disconnected')
          break

        default:
          break
      }
    } catch {
      // Ignore parse errors
    }
  }, [sessionId])

  // Start session on mount, properly handle StrictMode double-mount
  useEffect(() => {
    let cancelled = false
    const native = window.api.native

    // Register event listeners
    const unsubEvent = native.onEvent(handleEvent)
    const unsubFrame = native.onFrame((sid: string, frameJson: string) => {
      if (sid !== sessionId) return
      try {
        const frame: FrameInfo = JSON.parse(frameJson)
        onFrameRef.current?.(frame)
      } catch {
        // Ignore
      }
    })

    const startSession = async () => {
      try {
        // Create session with forceRelay option
        await native.sessionCreate(sessionId, peerId, {
          forceRelay: forceRelay
        })

        // Check if component was unmounted during the await.
        if (cancelled) return

        // Start session (this triggers the io_loop on a new thread)
        await native.sessionStart(sessionId)
      } catch (e) {
        if (!cancelled) {
          console.error('Session start failed:', e)
          setStatus('error')
          setError(e instanceof Error ? e.message : String(e))
        }
      }
    }

    startSession()

    return () => {
      cancelled = true
      unsubEvent()
      unsubFrame()
      native.sessionClose(sessionId).catch(() => {})
    }
  }, [sessionId, peerId, forceRelay, handleEvent])

  const login = useCallback(async (password: string, remember: boolean) => {
    try {
      setStatus('connecting')
      setMsgbox(null)
      setError('')
      await window.api.native.sessionLogin(sessionId, '', '', password, remember)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [sessionId])

  const reconnect = useCallback(async (forceRelay?: boolean) => {
    try {
      setStatus('connecting')
      setError('')
      setMsgbox(null)
      if (forceRelay) {
        setUsingRelay(true)
        triedAutoRelayRef.current = true
      }
      await window.api.native.sessionReconnect(sessionId, forceRelay)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [sessionId])

  const disconnect = useCallback(async () => {
    try {
      await window.api.native.sessionClose(sessionId)
      setStatus('disconnected')
    } catch {
      // Already closed
    }
  }, [sessionId])

  return {
    status,
    peerInfo,
    error,
    msgbox,
    usingRelay,
    qualityStatus,
    connectionInfo,
    permissions,
    recording,
    blockInput,
    login,
    reconnect,
    disconnect
  }
}
