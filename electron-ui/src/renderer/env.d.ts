/// <reference types="vite/client" />

interface Window {
  api: {
    // Window controls
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>

    // Floating ball controls
    showBall: () => void
    hideBall: () => void
    expandBall: () => void
    collapseBall: () => void
    showMainWindow: () => void
    onBallExpanded: (callback: (expanded: boolean) => void) => () => void

    // Config persistence
    configGet: (key: string) => Promise<unknown>
    configSet: (key: string, value: unknown) => Promise<void>
    configGetAll: () => Promise<Record<string, unknown>>

    // App info
    getAppVersion: () => Promise<string>
    getPlatformInfo: () => Promise<{
      platform: string
      arch: string
      hostname: string
      version: string
    }>

    // Active connection tracking
    onConnectionsChanged: (callback: (connections: Array<{ id: string; peerId: string; sessionId: string }>) => void) => () => void

    // ─── Native Rust Module APIs ─────────────────────────────
    native: {
      // Device ID & Config
      initialize: () => Promise<void>
      getDeviceId: () => Promise<string>
      getOption: (key: string) => Promise<string>
      setOption: (key: string, value: string) => Promise<void>
      getLocalOption: (key: string) => Promise<string>
      setLocalOption: (key: string, value: string) => Promise<void>
      getVersion: () => Promise<string>
      getPeer: (id: string) => Promise<string>
      peerHasPassword: (id: string) => Promise<boolean>
      getLanPeers: () => Promise<string>
      discover: () => Promise<void>
      getOptions: () => Promise<string>
      setOptions: (json: string) => Promise<void>

      // Session lifecycle
      sessionCreate: (sessionId: string, peerId: string, opts?: {
        password?: string
        isFileTransfer?: boolean
        isPortForward?: boolean
        isRdp?: boolean
        isTerminal?: boolean
        forceRelay?: boolean
      }) => Promise<void>
      sessionStart: (sessionId: string) => Promise<void>
      sessionLogin: (
        sessionId: string,
        osUsername: string,
        osPassword: string,
        password: string,
        remember: boolean
      ) => Promise<void>
      sessionClose: (sessionId: string) => Promise<void>
      sessionReconnect: (sessionId: string, forceRelay?: boolean) => Promise<void>

      // Video frames
      getFrameRgba: (sessionId: string, display: number) => Promise<Uint8Array | null>
      consumeFrame: (sessionId: string, display: number) => Promise<void>
      frameAck: (sessionId: string) => Promise<void>

      // Input
      sendMouse: (sessionId: string, msg: string) => Promise<void>
      inputKey: (
        sessionId: string,
        name: string,
        down: boolean,
        press: boolean,
        alt: boolean,
        ctrl: boolean,
        shift: boolean,
        command: boolean
      ) => Promise<void>
      inputString: (sessionId: string, value: string) => Promise<void>

      // Session options
      toggleOption: (sessionId: string, value: string) => Promise<void>
      getToggleOption: (sessionId: string, arg: string) => Promise<boolean>
      refresh: (sessionId: string, display: number) => Promise<void>
      lockScreen: (sessionId: string) => Promise<void>
      ctrlAltDel: (sessionId: string) => Promise<void>

      // Display quality & codec
      saveImageQuality: (sessionId: string, value: string) => Promise<void>
      setCustomFps: (sessionId: string, fps: number) => Promise<void>
      sessionSetOption: (sessionId: string, key: string, value: string) => Promise<void>
      sessionGetOption: (sessionId: string, key: string) => Promise<string>
      changePreferCodec: (sessionId: string) => Promise<void>
      alternativeCodecs: (sessionId: string) => Promise<string>

      // Display management
      switchDisplay: (sessionId: string, display: number) => Promise<void>
      captureDisplays: (sessionId: string, add: number[], sub: number[], set: number[]) => Promise<void>

      // Session control actions
      restartRemoteDevice: (sessionId: string) => Promise<void>
      recordScreen: (sessionId: string, start: boolean) => Promise<void>
      takeScreenshot: (sessionId: string, display: number) => Promise<void>
      togglePrivacyMode: (sessionId: string, implKey: string, on: boolean) => Promise<void>
      elevateDirect: (sessionId: string) => Promise<void>
      elevateWithLogon: (sessionId: string, username: string, password: string) => Promise<void>

      // Keyboard & view
      getKeyboardMode: (sessionId: string) => Promise<string>
      saveKeyboardMode: (sessionId: string, value: string) => Promise<void>
      getViewStyle: (sessionId: string) => Promise<string>
      saveViewStyle: (sessionId: string, value: string) => Promise<void>

      // Chat
      sendChat: (sessionId: string, text: string) => Promise<void>

      // Clipboard
      setClipboard: (sessionId: string, text: string) => Promise<void>

      // File transfer
      readRemoteDir: (sessionId: string, path: string, includeHidden: boolean) => Promise<void>
      sendFiles: (sessionId: string, actId: number, path: string, to: string, fileNum: number, includeHidden: boolean, isRemote: boolean) => Promise<void>
      cancelJob: (sessionId: string, actId: number) => Promise<void>
      removeFile: (sessionId: string, actId: number, path: string, fileNum: number, isRemote: boolean) => Promise<void>
      createDir: (sessionId: string, actId: number, path: string, isRemote: boolean) => Promise<void>
      readLocalDir: (path: string, includeHidden: boolean) => Promise<string>

      // Event listeners
      onEvent: (callback: (sessionId: string, eventJson: string) => void) => () => void
      onFrame: (callback: (sessionId: string, frameJson: string) => void) => () => void
      onFrameData: (callback: (sessionId: string, display: number, width: number, height: number, data: Uint8Array) => void) => () => void

      // Open remote desktop in a new window
      openRemoteWindow: (peerId: string, sessionId: string, forceRelay: boolean) => Promise<void>
    }
  }
}
