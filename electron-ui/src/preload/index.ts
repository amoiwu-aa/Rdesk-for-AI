import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Main window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Floating ball controls
  showBall: () => ipcRenderer.send('ball:show'),
  hideBall: () => ipcRenderer.send('ball:hide'),
  expandBall: () => ipcRenderer.send('ball:expand'),
  collapseBall: () => ipcRenderer.send('ball:collapse'),
  showMainWindow: () => ipcRenderer.send('ball:showMain'),

  // Listen for ball expand/collapse events
  onBallExpanded: (callback: (expanded: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, expanded: boolean) => callback(expanded)
    ipcRenderer.on('ball:expanded', handler)
    return () => ipcRenderer.removeListener('ball:expanded', handler)
  },

  // Config persistence
  configGet: (key: string) => ipcRenderer.invoke('config:get', key),
  configSet: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),
  configGetAll: () => ipcRenderer.invoke('config:getAll') as Promise<Record<string, unknown>>,

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version') as Promise<string>,
  getPlatformInfo: () => ipcRenderer.invoke('app:platformInfo') as Promise<{
    platform: string; arch: string; hostname: string; version: string
  }>,

  // ─── Native Rust Module APIs ─────────────────────────────

  // Device ID & Config
  native: {
    initialize: () => ipcRenderer.invoke('native:initialize') as Promise<void>,
    getDeviceId: () => ipcRenderer.invoke('native:getDeviceId') as Promise<string>,
    getOption: (key: string) => ipcRenderer.invoke('native:getOption', key) as Promise<string>,
    setOption: (key: string, value: string) => ipcRenderer.invoke('native:setOption', key, value) as Promise<void>,
    getLocalOption: (key: string) => ipcRenderer.invoke('native:getLocalOption', key) as Promise<string>,
    setLocalOption: (key: string, value: string) => ipcRenderer.invoke('native:setLocalOption', key, value) as Promise<void>,
    getVersion: () => ipcRenderer.invoke('native:getVersion') as Promise<string>,
    getPeer: (id: string) => ipcRenderer.invoke('native:getPeer', id) as Promise<string>,
    peerHasPassword: (id: string) => ipcRenderer.invoke('native:peerHasPassword', id) as Promise<boolean>,
    getLanPeers: () => ipcRenderer.invoke('native:getLanPeers') as Promise<string>,
    discover: () => ipcRenderer.invoke('native:discover') as Promise<void>,
    getOptions: () => ipcRenderer.invoke('native:getOptions') as Promise<string>,
    setOptions: (json: string) => ipcRenderer.invoke('native:setOptions', json) as Promise<void>,

    // Session lifecycle
    sessionCreate: (sessionId: string, peerId: string, opts?: {
      password?: string, isFileTransfer?: boolean, isPortForward?: boolean,
      isRdp?: boolean, isTerminal?: boolean, forceRelay?: boolean
    }) => ipcRenderer.invoke('native:sessionCreate', sessionId, peerId, opts) as Promise<void>,

    sessionStart: (sessionId: string) =>
      ipcRenderer.invoke('native:sessionStart', sessionId) as Promise<void>,

    sessionLogin: (sessionId: string, osUsername: string, osPassword: string, password: string, remember: boolean) =>
      ipcRenderer.invoke('native:sessionLogin', sessionId, osUsername, osPassword, password, remember) as Promise<void>,

    sessionClose: (sessionId: string) =>
      ipcRenderer.invoke('native:sessionClose', sessionId) as Promise<void>,

    sessionReconnect: (sessionId: string, forceRelay?: boolean) =>
      ipcRenderer.invoke('native:sessionReconnect', sessionId, forceRelay) as Promise<void>,

    // Video frames
    getFrameRgba: (sessionId: string, display: number) =>
      ipcRenderer.invoke('native:getFrameRgba', sessionId, display) as Promise<Uint8Array | null>,

    consumeFrame: (sessionId: string, display: number) =>
      ipcRenderer.invoke('native:consumeFrame', sessionId, display) as Promise<void>,

    frameAck: (sessionId: string) =>
      ipcRenderer.invoke('native:frameAck', sessionId) as Promise<void>,

    // Input
    sendMouse: (sessionId: string, msg: string) =>
      ipcRenderer.invoke('native:sendMouse', sessionId, msg) as Promise<void>,

    inputKey: (sessionId: string, name: string, down: boolean, press: boolean, alt: boolean, ctrl: boolean, shift: boolean, command: boolean) =>
      ipcRenderer.invoke('native:inputKey', sessionId, name, down, press, alt, ctrl, shift, command) as Promise<void>,

    inputString: (sessionId: string, value: string) =>
      ipcRenderer.invoke('native:inputString', sessionId, value) as Promise<void>,

    // Session options
    toggleOption: (sessionId: string, value: string) =>
      ipcRenderer.invoke('native:toggleOption', sessionId, value) as Promise<void>,

    getToggleOption: (sessionId: string, arg: string) =>
      ipcRenderer.invoke('native:getToggleOption', sessionId, arg) as Promise<boolean>,

    refresh: (sessionId: string, display: number) =>
      ipcRenderer.invoke('native:refresh', sessionId, display) as Promise<void>,

    lockScreen: (sessionId: string) =>
      ipcRenderer.invoke('native:lockScreen', sessionId) as Promise<void>,

    ctrlAltDel: (sessionId: string) =>
      ipcRenderer.invoke('native:ctrlAltDel', sessionId) as Promise<void>,

    // Display quality & codec
    saveImageQuality: (sessionId: string, value: string) =>
      ipcRenderer.invoke('native:saveImageQuality', sessionId, value) as Promise<void>,
    setCustomFps: (sessionId: string, fps: number) =>
      ipcRenderer.invoke('native:setCustomFps', sessionId, fps) as Promise<void>,
    sessionSetOption: (sessionId: string, key: string, value: string) =>
      ipcRenderer.invoke('native:sessionSetOption', sessionId, key, value) as Promise<void>,
    sessionGetOption: (sessionId: string, key: string) =>
      ipcRenderer.invoke('native:sessionGetOption', sessionId, key) as Promise<string>,
    changePreferCodec: (sessionId: string) =>
      ipcRenderer.invoke('native:changePreferCodec', sessionId) as Promise<void>,
    alternativeCodecs: (sessionId: string) =>
      ipcRenderer.invoke('native:alternativeCodecs', sessionId) as Promise<string>,

    // Display management
    switchDisplay: (sessionId: string, display: number) =>
      ipcRenderer.invoke('native:switchDisplay', sessionId, display) as Promise<void>,
    captureDisplays: (sessionId: string, add: number[], sub: number[], set: number[]) =>
      ipcRenderer.invoke('native:captureDisplays', sessionId, add, sub, set) as Promise<void>,

    // Session control actions
    restartRemoteDevice: (sessionId: string) =>
      ipcRenderer.invoke('native:restartRemoteDevice', sessionId) as Promise<void>,
    recordScreen: (sessionId: string, start: boolean) =>
      ipcRenderer.invoke('native:recordScreen', sessionId, start) as Promise<void>,
    takeScreenshot: (sessionId: string, display: number) =>
      ipcRenderer.invoke('native:takeScreenshot', sessionId, display) as Promise<void>,
    togglePrivacyMode: (sessionId: string, implKey: string, on: boolean) =>
      ipcRenderer.invoke('native:togglePrivacyMode', sessionId, implKey, on) as Promise<void>,
    elevateDirect: (sessionId: string) =>
      ipcRenderer.invoke('native:elevateDirect', sessionId) as Promise<void>,
    elevateWithLogon: (sessionId: string, username: string, password: string) =>
      ipcRenderer.invoke('native:elevateWithLogon', sessionId, username, password) as Promise<void>,

    // Keyboard & view
    getKeyboardMode: (sessionId: string) =>
      ipcRenderer.invoke('native:getKeyboardMode', sessionId) as Promise<string>,
    saveKeyboardMode: (sessionId: string, value: string) =>
      ipcRenderer.invoke('native:saveKeyboardMode', sessionId, value) as Promise<void>,
    getViewStyle: (sessionId: string) =>
      ipcRenderer.invoke('native:getViewStyle', sessionId) as Promise<string>,
    saveViewStyle: (sessionId: string, value: string) =>
      ipcRenderer.invoke('native:saveViewStyle', sessionId, value) as Promise<void>,

    // Event listeners (from main process ThreadsafeFunction callbacks)
    onEvent: (callback: (sessionId: string, eventJson: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, sessionId: string, eventJson: string) =>
        callback(sessionId, eventJson)
      ipcRenderer.on('native:event', handler)
      return () => ipcRenderer.removeListener('native:event', handler)
    },

    onFrame: (callback: (sessionId: string, frameJson: string) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, sessionId: string, frameJson: string) =>
        callback(sessionId, frameJson)
      ipcRenderer.on('native:frame', handler)
      return () => ipcRenderer.removeListener('native:frame', handler)
    },

    // Push-based frame data (main process reads frame and pushes directly)
    onFrameData: (callback: (sessionId: string, display: number, width: number, height: number, data: Uint8Array) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, sessionId: string, display: number, width: number, height: number, data: Uint8Array) =>
        callback(sessionId, display, width, height, data)
      ipcRenderer.on('native:frameData', handler)
      return () => ipcRenderer.removeListener('native:frameData', handler)
    },

    // Open remote desktop in a new window
    openRemoteWindow: (peerId: string, sessionId: string, forceRelay: boolean) =>
      ipcRenderer.invoke('native:openRemoteWindow', peerId, sessionId, forceRelay) as Promise<void>,

    // Send chat message
    sendChat: (sessionId: string, text: string) =>
      ipcRenderer.invoke('native:sendChat', sessionId, text) as Promise<void>,

    // Clipboard
    setClipboard: (sessionId: string, text: string) =>
      ipcRenderer.invoke('native:setClipboard', sessionId, text) as Promise<void>,

    // File transfer
    readRemoteDir: (sessionId: string, path: string, includeHidden: boolean) =>
      ipcRenderer.invoke('native:readRemoteDir', sessionId, path, includeHidden) as Promise<void>,
    sendFiles: (sessionId: string, actId: number, path: string, to: string, fileNum: number, includeHidden: boolean, isRemote: boolean) =>
      ipcRenderer.invoke('native:sendFiles', sessionId, actId, path, to, fileNum, includeHidden, isRemote) as Promise<void>,
    cancelJob: (sessionId: string, actId: number) =>
      ipcRenderer.invoke('native:cancelJob', sessionId, actId) as Promise<void>,
    removeFile: (sessionId: string, actId: number, path: string, fileNum: number, isRemote: boolean) =>
      ipcRenderer.invoke('native:removeFile', sessionId, actId, path, fileNum, isRemote) as Promise<void>,
    createDir: (sessionId: string, actId: number, path: string, isRemote: boolean) =>
      ipcRenderer.invoke('native:createDir', sessionId, actId, path, isRemote) as Promise<void>,
    readLocalDir: (path: string, includeHidden: boolean) =>
      ipcRenderer.invoke('native:readLocalDir', path, includeHidden) as Promise<string>,
  },

  // Active connection tracking
  onConnectionsChanged: (callback: (connections: Array<{ id: string; peerId: string; sessionId: string }>) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, connections: Array<{ id: string; peerId: string; sessionId: string }>) =>
      callback(connections)
    ipcRenderer.on('connections:changed', handler)
    return () => ipcRenderer.removeListener('connections:changed', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

// Type declaration for renderer
export type ElectronAPI = typeof api
