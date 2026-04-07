import { createRequire } from 'module'
import { join } from 'path'

const require = createRequire(import.meta.url)

// Load the compiled native module (.node file)
// In development, it's in the native/ directory
// In production, it should be packaged alongside the app
let nativeModule: NativeModule

try {
  nativeModule = require(
    join(__dirname, '../../native/rustdesk-napi.win32-x64-msvc.node')
  )
} catch (e) {
  console.error('Failed to load native module:', e)
  // Provide a stub that throws on any call
  nativeModule = new Proxy({} as NativeModule, {
    get: (_target, prop) => {
      return (..._args: unknown[]) => {
        throw new Error(`Native module not loaded. Cannot call ${String(prop)}`)
      }
    }
  })
}

export interface FrameNotification {
  display: number
  width: number
  height: number
}

export interface NativeModule {
  // Initialization
  initialize(appDir: string): void

  // Session lifecycle
  sessionCreate(
    sessionId: string,
    peerId: string,
    password?: string,
    isFileTransfer?: boolean,
    isPortForward?: boolean,
    isRdp?: boolean,
    isTerminal?: boolean,
    forceRelay?: boolean
  ): void
  sessionStart(
    sessionId: string,
    eventCallback: (event: string) => void,
    frameCallback: (notification: string) => void
  ): void
  sessionLogin(
    sessionId: string,
    osUsername: string,
    osPassword: string,
    password: string,
    remember: boolean
  ): void
  sessionClose(sessionId: string): void
  sessionReconnect(sessionId: string, forceRelay?: boolean): void

  // Video frames
  getFrameRgba(sessionId: string, display: number): Buffer | null
  consumeFrame(sessionId: string, display: number): void

  // Input
  sessionSendMouse(sessionId: string, msg: string): void
  sessionInputKey(
    sessionId: string,
    name: string,
    down: boolean,
    press: boolean,
    alt: boolean,
    ctrl: boolean,
    shift: boolean,
    command: boolean
  ): void
  sessionInputString(sessionId: string, value: string): void

  // Config & status
  mainGetId(): string
  mainGetOption(key: string): string
  mainSetOption(key: string, value: string): void
  mainGetLocalOption(key: string): string
  mainSetLocalOption(key: string, value: string): void
  mainGetVersion(): string
  mainGetPeer(id: string): string
  mainPeerHasPassword(id: string): boolean
  mainGetLanPeers(): string
  mainDiscover(): void
  mainGetOptions(): string
  mainSetOptions(json: string): void

  // Session options
  sessionToggleOption(sessionId: string, value: string): void
  sessionGetToggleOption(sessionId: string, arg: string): boolean
  sessionRefresh(sessionId: string, display: number): void
  sessionLockScreen(sessionId: string): void
  sessionCtrlAltDel(sessionId: string): void

  // Display quality & codec
  sessionSaveImageQuality(sessionId: string, value: string): void
  sessionSetCustomFps(sessionId: string, fps: number): void
  sessionSetOption(sessionId: string, key: string, value: string): void
  sessionGetOption(sessionId: string, key: string): string
  sessionChangePreferCodec(sessionId: string): void
  sessionAlternativeCodecs(sessionId: string): string

  // Chat
  sessionSendChat(sessionId: string, text: string): void

  // Clipboard
  sessionSetClipboard(sessionId: string, text: string): void

  // File transfer
  sessionReadRemoteDir(sessionId: string, path: string, includeHidden: boolean): void
  sessionSendFiles(sessionId: string, actId: number, path: string, to: string, fileNum: number, includeHidden: boolean, isRemote: boolean): void
  sessionCancelJob(sessionId: string, actId: number): void
  sessionRemoveFile(sessionId: string, actId: number, path: string, fileNum: number, isRemote: boolean): void
  sessionCreateDir(sessionId: string, actId: number, path: string, isRemote: boolean): void
}

export default nativeModule
