import { contextBridge, ipcRenderer } from "electron";
const api = {
  // Main window controls
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  // Floating ball controls
  showBall: () => ipcRenderer.send("ball:show"),
  hideBall: () => ipcRenderer.send("ball:hide"),
  expandBall: () => ipcRenderer.send("ball:expand"),
  collapseBall: () => ipcRenderer.send("ball:collapse"),
  showMainWindow: () => ipcRenderer.send("ball:showMain"),
  // Listen for ball expand/collapse events
  onBallExpanded: (callback) => {
    const handler = (_event, expanded) => callback(expanded);
    ipcRenderer.on("ball:expanded", handler);
    return () => ipcRenderer.removeListener("ball:expanded", handler);
  },
  // Config persistence
  configGet: (key) => ipcRenderer.invoke("config:get", key),
  configSet: (key, value) => ipcRenderer.invoke("config:set", key, value),
  configGetAll: () => ipcRenderer.invoke("config:getAll"),
  // App info
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  getPlatformInfo: () => ipcRenderer.invoke("app:platformInfo"),
  // ─── Native Rust Module APIs ─────────────────────────────
  // Device ID & Config
  native: {
    initialize: () => ipcRenderer.invoke("native:initialize"),
    getDeviceId: () => ipcRenderer.invoke("native:getDeviceId"),
    getOption: (key) => ipcRenderer.invoke("native:getOption", key),
    setOption: (key, value) => ipcRenderer.invoke("native:setOption", key, value),
    getLocalOption: (key) => ipcRenderer.invoke("native:getLocalOption", key),
    setLocalOption: (key, value) => ipcRenderer.invoke("native:setLocalOption", key, value),
    getVersion: () => ipcRenderer.invoke("native:getVersion"),
    getPeer: (id) => ipcRenderer.invoke("native:getPeer", id),
    peerHasPassword: (id) => ipcRenderer.invoke("native:peerHasPassword", id),
    getLanPeers: () => ipcRenderer.invoke("native:getLanPeers"),
    discover: () => ipcRenderer.invoke("native:discover"),
    getOptions: () => ipcRenderer.invoke("native:getOptions"),
    setOptions: (json) => ipcRenderer.invoke("native:setOptions", json),
    // Session lifecycle
    sessionCreate: (sessionId, peerId, opts) => ipcRenderer.invoke("native:sessionCreate", sessionId, peerId, opts),
    sessionStart: (sessionId) => ipcRenderer.invoke("native:sessionStart", sessionId),
    sessionLogin: (sessionId, osUsername, osPassword, password, remember) => ipcRenderer.invoke("native:sessionLogin", sessionId, osUsername, osPassword, password, remember),
    sessionClose: (sessionId) => ipcRenderer.invoke("native:sessionClose", sessionId),
    sessionReconnect: (sessionId, forceRelay) => ipcRenderer.invoke("native:sessionReconnect", sessionId, forceRelay),
    // Video frames
    getFrameRgba: (sessionId, display) => ipcRenderer.invoke("native:getFrameRgba", sessionId, display),
    consumeFrame: (sessionId, display) => ipcRenderer.invoke("native:consumeFrame", sessionId, display),
    frameAck: (sessionId) => ipcRenderer.invoke("native:frameAck", sessionId),
    // Input
    sendMouse: (sessionId, msg) => ipcRenderer.invoke("native:sendMouse", sessionId, msg),
    inputKey: (sessionId, name, down, press, alt, ctrl, shift, command) => ipcRenderer.invoke("native:inputKey", sessionId, name, down, press, alt, ctrl, shift, command),
    inputString: (sessionId, value) => ipcRenderer.invoke("native:inputString", sessionId, value),
    // Session options
    toggleOption: (sessionId, value) => ipcRenderer.invoke("native:toggleOption", sessionId, value),
    getToggleOption: (sessionId, arg) => ipcRenderer.invoke("native:getToggleOption", sessionId, arg),
    refresh: (sessionId, display) => ipcRenderer.invoke("native:refresh", sessionId, display),
    lockScreen: (sessionId) => ipcRenderer.invoke("native:lockScreen", sessionId),
    ctrlAltDel: (sessionId) => ipcRenderer.invoke("native:ctrlAltDel", sessionId),
    // Display quality & codec
    saveImageQuality: (sessionId, value) => ipcRenderer.invoke("native:saveImageQuality", sessionId, value),
    setCustomFps: (sessionId, fps) => ipcRenderer.invoke("native:setCustomFps", sessionId, fps),
    sessionSetOption: (sessionId, key, value) => ipcRenderer.invoke("native:sessionSetOption", sessionId, key, value),
    sessionGetOption: (sessionId, key) => ipcRenderer.invoke("native:sessionGetOption", sessionId, key),
    changePreferCodec: (sessionId) => ipcRenderer.invoke("native:changePreferCodec", sessionId),
    alternativeCodecs: (sessionId) => ipcRenderer.invoke("native:alternativeCodecs", sessionId),
    // Display management
    switchDisplay: (sessionId, display) => ipcRenderer.invoke("native:switchDisplay", sessionId, display),
    captureDisplays: (sessionId, add, sub, set) => ipcRenderer.invoke("native:captureDisplays", sessionId, add, sub, set),
    // Session control actions
    restartRemoteDevice: (sessionId) => ipcRenderer.invoke("native:restartRemoteDevice", sessionId),
    recordScreen: (sessionId, start) => ipcRenderer.invoke("native:recordScreen", sessionId, start),
    takeScreenshot: (sessionId, display) => ipcRenderer.invoke("native:takeScreenshot", sessionId, display),
    togglePrivacyMode: (sessionId, implKey, on) => ipcRenderer.invoke("native:togglePrivacyMode", sessionId, implKey, on),
    elevateDirect: (sessionId) => ipcRenderer.invoke("native:elevateDirect", sessionId),
    elevateWithLogon: (sessionId, username, password) => ipcRenderer.invoke("native:elevateWithLogon", sessionId, username, password),
    // Keyboard & view
    getKeyboardMode: (sessionId) => ipcRenderer.invoke("native:getKeyboardMode", sessionId),
    saveKeyboardMode: (sessionId, value) => ipcRenderer.invoke("native:saveKeyboardMode", sessionId, value),
    getViewStyle: (sessionId) => ipcRenderer.invoke("native:getViewStyle", sessionId),
    saveViewStyle: (sessionId, value) => ipcRenderer.invoke("native:saveViewStyle", sessionId, value),
    // Event listeners (from main process ThreadsafeFunction callbacks)
    onEvent: (callback) => {
      const handler = (_e, sessionId, eventJson) => callback(sessionId, eventJson);
      ipcRenderer.on("native:event", handler);
      return () => ipcRenderer.removeListener("native:event", handler);
    },
    onFrame: (callback) => {
      const handler = (_e, sessionId, frameJson) => callback(sessionId, frameJson);
      ipcRenderer.on("native:frame", handler);
      return () => ipcRenderer.removeListener("native:frame", handler);
    },
    // Push-based frame data (main process reads frame and pushes directly)
    onFrameData: (callback) => {
      const handler = (_e, sessionId, display, width, height, data) => callback(sessionId, display, width, height, data);
      ipcRenderer.on("native:frameData", handler);
      return () => ipcRenderer.removeListener("native:frameData", handler);
    },
    // Open remote desktop in a new window
    openRemoteWindow: (peerId, sessionId, forceRelay) => ipcRenderer.invoke("native:openRemoteWindow", peerId, sessionId, forceRelay),
    // Send chat message
    sendChat: (sessionId, text) => ipcRenderer.invoke("native:sendChat", sessionId, text),
    // Clipboard
    setClipboard: (sessionId, text) => ipcRenderer.invoke("native:setClipboard", sessionId, text),
    // File transfer
    readRemoteDir: (sessionId, path, includeHidden) => ipcRenderer.invoke("native:readRemoteDir", sessionId, path, includeHidden),
    sendFiles: (sessionId, actId, path, to, fileNum, includeHidden, isRemote) => ipcRenderer.invoke("native:sendFiles", sessionId, actId, path, to, fileNum, includeHidden, isRemote),
    cancelJob: (sessionId, actId) => ipcRenderer.invoke("native:cancelJob", sessionId, actId),
    removeFile: (sessionId, actId, path, fileNum, isRemote) => ipcRenderer.invoke("native:removeFile", sessionId, actId, path, fileNum, isRemote),
    createDir: (sessionId, actId, path, isRemote) => ipcRenderer.invoke("native:createDir", sessionId, actId, path, isRemote),
    readLocalDir: (path, includeHidden) => ipcRenderer.invoke("native:readLocalDir", path, includeHidden)
  },
  // Active connection tracking
  onConnectionsChanged: (callback) => {
    const handler = (_e, connections) => callback(connections);
    ipcRenderer.on("connections:changed", handler);
    return () => ipcRenderer.removeListener("connections:changed", handler);
  }
};
contextBridge.exposeInMainWorld("api", api);
