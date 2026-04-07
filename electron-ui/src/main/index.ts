import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { join } from 'path'
import { hostname, platform, arch, version } from 'os'
import { is } from '@electron-toolkit/utils'
import { createTray } from './tray'
import { configGet, configSet, configGetAll } from './config'
import { startHeartbeat, stopHeartbeat } from './heartbeat'
import native from './native-bridge'

let mainWindow: BrowserWindow | null = null
let ballWindow: BrowserWindow | null = null
let isExpanded = false

// Track remote windows and their sessions for cleanup
const remoteWindows = new Map<number, string>() // windowId → sessionId

function getPreloadPath(): string {
  return join(__dirname, '../preload/index.mjs')
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 680,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    show: false,
    backgroundColor: '#1E1E2E',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createBallWindow(): void {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  ballWindow = new BrowserWindow({
    width: 56,
    height: 56,
    x: screenW - 80,
    y: screenH - 200,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    ballWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/floating-ball`)
  } else {
    ballWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/floating-ball' })
  }

  // Show ball after a brief delay so the main window appears first
  ballWindow.on('ready-to-show', () => {
    setTimeout(() => ballWindow?.show(), 500)
  })
}

// ─── Helper: get BrowserWindow from IPC event sender ────
function getWindowFromEvent(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): BrowserWindow | null {
  try {
    if (event.sender.isDestroyed()) return null
    return BrowserWindow.fromWebContents(event.sender)
  } catch {
    return null
  }
}

// Safe send — wraps sender.send in try-catch to prevent "object destroyed" errors
function safeSend(sender: Electron.WebContents, channel: string, ...args: unknown[]): void {
  try {
    if (!sender.isDestroyed()) {
      sender.send(channel, ...args)
    }
  } catch {
    // Window was destroyed between the check and the send — ignore
  }
}

// ─── IPC Handlers ────────────────────────────────────────

// Config persistence
ipcMain.handle('config:get', (_, key: string) => configGet(key))
ipcMain.handle('config:set', (_, key: string, value: unknown) => {
  configSet(key, value)
  // Restart heartbeat if apiServer changes
  if (key === 'apiServer') {
    stopHeartbeat()
    const deviceId = configGet('deviceId') as string | undefined
    if (value && deviceId) startHeartbeat(value as string, deviceId)
  }
})
ipcMain.handle('config:getAll', () => configGetAll())

// App info
ipcMain.handle('app:version', () => app.getVersion())
ipcMain.handle('app:platformInfo', () => ({
  platform: platform(),
  arch: arch(),
  hostname: hostname(),
  version: version()
}))

// Window controls — operate on the SENDER's window, not hardcoded mainWindow
ipcMain.on('window:minimize', (event) => {
  const win = getWindowFromEvent(event)
  win?.minimize()
})

ipcMain.on('window:maximize', (event) => {
  const win = getWindowFromEvent(event)
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  const win = getWindowFromEvent(event)
  win?.close()
})

ipcMain.handle('window:isMaximized', (event) => {
  const win = getWindowFromEvent(event)
  return win?.isMaximized() ?? false
})

// Floating ball controls
ipcMain.on('ball:show', () => ballWindow?.show())
ipcMain.on('ball:hide', () => ballWindow?.hide())

ipcMain.on('ball:expand', () => {
  if (!ballWindow || isExpanded) return
  isExpanded = true
  ballWindow.setResizable(true)
  ballWindow.setSize(320, 420)
  // Reposition so it doesn't go off-screen
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const [bx, by] = ballWindow.getPosition()
  const newX = Math.min(bx, sw - 330)
  const newY = Math.min(by, sh - 430)
  ballWindow.setPosition(newX, newY)
  ballWindow.setResizable(false)
  ballWindow.webContents.send('ball:expanded', true)
})

ipcMain.on('ball:collapse', () => {
  if (!ballWindow || !isExpanded) return
  isExpanded = false
  ballWindow.setResizable(true)
  ballWindow.setSize(56, 56)
  ballWindow.setResizable(false)
  ballWindow.webContents.send('ball:expanded', false)
})

ipcMain.on('ball:showMain', () => {
  mainWindow?.show()
  mainWindow?.focus()
})

// Ball drag support
ipcMain.on('ball:startDrag', () => {
  // Not needed - we use CSS -webkit-app-region: drag
})

// ─── Native Module IPC Handlers ──────────────────────────

// Initialization (called once on app start)
ipcMain.handle('native:initialize', () => {
  native.initialize(app.getPath('userData'))
})

// Device ID & Config
ipcMain.handle('native:getDeviceId', () => native.mainGetId())
ipcMain.handle('native:getOption', (_, key: string) => native.mainGetOption(key))
ipcMain.handle('native:setOption', (_, key: string, value: string) => native.mainSetOption(key, value))
ipcMain.handle('native:getLocalOption', (_, key: string) => native.mainGetLocalOption(key))
ipcMain.handle('native:setLocalOption', (_, key: string, value: string) => native.mainSetLocalOption(key, value))
ipcMain.handle('native:getVersion', () => native.mainGetVersion())
ipcMain.handle('native:getPeer', (_, id: string) => native.mainGetPeer(id))
ipcMain.handle('native:peerHasPassword', (_, id: string) => native.mainPeerHasPassword(id))
ipcMain.handle('native:getLanPeers', () => native.mainGetLanPeers())
ipcMain.handle('native:discover', () => native.mainDiscover())
ipcMain.handle('native:getOptions', () => native.mainGetOptions())
ipcMain.handle('native:setOptions', (_, json: string) => native.mainSetOptions(json))

// Session lifecycle
ipcMain.handle('native:sessionCreate', (_, sessionId: string, peerId: string, opts?: {
  password?: string, isFileTransfer?: boolean, isPortForward?: boolean,
  isRdp?: boolean, isTerminal?: boolean, forceRelay?: boolean
}) => {
  console.log('[native] sessionCreate:', sessionId, 'peer:', peerId)
  try {
    native.sessionCreate(
      sessionId, peerId,
      opts?.password, opts?.isFileTransfer, opts?.isPortForward,
      opts?.isRdp, opts?.isTerminal, opts?.forceRelay
    )
    console.log('[native] sessionCreate OK:', sessionId)
  } catch (e) {
    console.error('[native] sessionCreate FAILED:', sessionId, e)
    throw e
  }
})

ipcMain.handle('native:sessionStart', (event, sessionId: string) => {
  const sender = event.sender
  native.sessionStart(
    sessionId,
    (eventJson: string) => {
      safeSend(sender, 'native:event', sessionId, eventJson)
    },
    (frameJson: string) => {
      safeSend(sender, 'native:frame', sessionId, frameJson)
    }
  )
})

ipcMain.handle('native:sessionLogin', (_, sessionId: string, osUsername: string, osPassword: string, password: string, remember: boolean) => {
  native.sessionLogin(sessionId, osUsername, osPassword, password, remember)
})

ipcMain.handle('native:sessionClose', (_, sessionId: string) => {
  try {
    native.sessionClose(sessionId)
  } catch (e) {
    console.error('[native] sessionClose error:', sessionId, e)
  }
})

ipcMain.handle('native:sessionReconnect', (_, sessionId: string, forceRelay?: boolean) => {
  native.sessionReconnect(sessionId, forceRelay)
})

// Video frames
ipcMain.handle('native:getFrameRgba', (_, sessionId: string, display: number) => {
  return native.getFrameRgba(sessionId, display)
})


ipcMain.handle('native:consumeFrame', (_, sessionId: string, display: number) => {
  native.consumeFrame(sessionId, display)
})

// Input
ipcMain.handle('native:sendMouse', (_, sessionId: string, msg: string) => {
  native.sessionSendMouse(sessionId, msg)
})

ipcMain.handle('native:inputKey', (_, sessionId: string, name: string, down: boolean, press: boolean, alt: boolean, ctrl: boolean, shift: boolean, command: boolean) => {
  native.sessionInputKey(sessionId, name, down, press, alt, ctrl, shift, command)
})

ipcMain.handle('native:inputString', (_, sessionId: string, value: string) => {
  native.sessionInputString(sessionId, value)
})

// Session options
ipcMain.handle('native:toggleOption', (_, sessionId: string, value: string) => {
  native.sessionToggleOption(sessionId, value)
})

ipcMain.handle('native:getToggleOption', (_, sessionId: string, arg: string) => {
  return native.sessionGetToggleOption(sessionId, arg)
})

ipcMain.handle('native:refresh', (_, sessionId: string, display: number) => {
  native.sessionRefresh(sessionId, display)
})

ipcMain.handle('native:lockScreen', (_, sessionId: string) => {
  native.sessionLockScreen(sessionId)
})

ipcMain.handle('native:ctrlAltDel', (_, sessionId: string) => {
  native.sessionCtrlAltDel(sessionId)
})

// Display quality & codec
ipcMain.handle('native:saveImageQuality', (_, sessionId: string, value: string) => {
  native.sessionSaveImageQuality(sessionId, value)
})

ipcMain.handle('native:setCustomFps', (_, sessionId: string, fps: number) => {
  native.sessionSetCustomFps(sessionId, fps)
})

ipcMain.handle('native:sessionSetOption', (_, sessionId: string, key: string, value: string) => {
  native.sessionSetOption(sessionId, key, value)
})

ipcMain.handle('native:sessionGetOption', (_, sessionId: string, key: string) => {
  return native.sessionGetOption(sessionId, key)
})

ipcMain.handle('native:changePreferCodec', (_, sessionId: string) => {
  native.sessionChangePreferCodec(sessionId)
})

ipcMain.handle('native:alternativeCodecs', (_, sessionId: string) => {
  return native.sessionAlternativeCodecs(sessionId)
})

// ─── Display Management ──────────────────────────────────
ipcMain.handle('native:switchDisplay', (_, sessionId: string, display: number) => {
  native.sessionSwitchDisplay(sessionId, display)
})

ipcMain.handle('native:captureDisplays', (_, sessionId: string, add: number[], sub: number[], set: number[]) => {
  native.sessionCaptureDisplays(sessionId, add, sub, set)
})

// ─── Session Control Actions ─────────────────────────────
ipcMain.handle('native:restartRemoteDevice', (_, sessionId: string) => {
  native.sessionRestartRemoteDevice(sessionId)
})

ipcMain.handle('native:recordScreen', (_, sessionId: string, start: boolean) => {
  native.sessionRecordScreen(sessionId, start)
})

ipcMain.handle('native:takeScreenshot', (_, sessionId: string, display: number) => {
  native.sessionTakeScreenshot(sessionId, display)
})

ipcMain.handle('native:togglePrivacyMode', (_, sessionId: string, implKey: string, on: boolean) => {
  native.sessionTogglePrivacyMode(sessionId, implKey, on)
})

ipcMain.handle('native:elevateDirect', (_, sessionId: string) => {
  native.sessionElevateDirect(sessionId)
})

ipcMain.handle('native:elevateWithLogon', (_, sessionId: string, username: string, password: string) => {
  native.sessionElevateWithLogon(sessionId, username, password)
})

// ─── Keyboard & View ─────────────────────────────────────
ipcMain.handle('native:getKeyboardMode', (_, sessionId: string) => {
  return native.sessionGetKeyboardMode(sessionId)
})

ipcMain.handle('native:saveKeyboardMode', (_, sessionId: string, value: string) => {
  native.sessionSaveKeyboardMode(sessionId, value)
})

ipcMain.handle('native:getViewStyle', (_, sessionId: string) => {
  return native.sessionGetViewStyle(sessionId)
})

ipcMain.handle('native:saveViewStyle', (_, sessionId: string, value: string) => {
  native.sessionSaveViewStyle(sessionId, value)
})

// ─── Chat ────────────────────────────────────────────────
ipcMain.handle('native:sendChat', (_, sessionId: string, text: string) => {
  native.sessionSendChat(sessionId, text)
})

// ─── Clipboard ───────────────────────────────────────────
ipcMain.handle('native:setClipboard', (_, sessionId: string, text: string) => {
  native.sessionSetClipboard(sessionId, text)
})

// ─── File Transfer ───────────────────────────────────────
ipcMain.handle('native:readRemoteDir', (_, sessionId: string, path: string, includeHidden: boolean) => {
  native.sessionReadRemoteDir(sessionId, path, includeHidden)
})

ipcMain.handle('native:sendFiles', (_, sessionId: string, actId: number, path: string, to: string, fileNum: number, includeHidden: boolean, isRemote: boolean) => {
  native.sessionSendFiles(sessionId, actId, path, to, fileNum, includeHidden, isRemote)
})

ipcMain.handle('native:cancelJob', (_, sessionId: string, actId: number) => {
  native.sessionCancelJob(sessionId, actId)
})

ipcMain.handle('native:removeFile', (_, sessionId: string, actId: number, path: string, fileNum: number, isRemote: boolean) => {
  native.sessionRemoveFile(sessionId, actId, path, fileNum, isRemote)
})

ipcMain.handle('native:createDir', (_, sessionId: string, actId: number, path: string, isRemote: boolean) => {
  native.sessionCreateDir(sessionId, actId, path, isRemote)
})

ipcMain.handle('native:readLocalDir', async (_, path: string, _includeHidden: boolean) => {
  // Read local directory using Node.js fs
  const fs = await import('fs')
  const pathModule = await import('path')
  try {
    const entries = fs.readdirSync(path, { withFileTypes: true })
    const result = entries.map(e => ({
      name: e.name,
      isDir: e.isDirectory(),
      size: e.isFile() ? fs.statSync(pathModule.join(path, e.name)).size : 0,
      modified: e.isFile() ? fs.statSync(pathModule.join(path, e.name)).mtimeMs : 0,
    }))
    return JSON.stringify({ path, entries: result })
  } catch (e) {
    return JSON.stringify({ path, entries: [], error: String(e) })
  }
})

// ─── Remote Desktop Window ───────────────────────────────

// Broadcast active connection changes to all windows (for floating ball)
function broadcastActiveConnections(): void {
  const connections: Array<{ id: string; peerId: string; sessionId: string }> = []
  for (const [winId, sid] of remoteWindows) {
    const win = BrowserWindow.fromId(winId)
    if (win && !win.isDestroyed()) {
      const url = win.webContents.getURL()
      const match = url.match(/remote\/([^?]+)\?session=([^&]+)/)
      connections.push({
        id: sid,
        peerId: match?.[1] || 'unknown',
        sessionId: sid
      })
    }
  }

  // Send to all windows (main + ball)
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      try { win.webContents.send('connections:changed', connections) } catch {}
    }
  }
}

function createRemoteWindow(peerId: string, sessionId: string, forceRelay: boolean): BrowserWindow {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize
  const win = new BrowserWindow({
    width: Math.min(1280, screenW - 100),
    height: Math.min(800, screenH - 100),
    minWidth: 640,
    minHeight: 480,
    frame: false,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false
    }
  })

  // Track this window's session for cleanup
  remoteWindows.set(win.id, sessionId)

  const hash = `/remote/${peerId}?session=${sessionId}${forceRelay ? '&relay=1' : ''}`
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#${hash}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
  }

  win.on('ready-to-show', () => {
    win.show()
    broadcastActiveConnections()
  })

  // Clean up session when window is closed
  win.on('closed', () => {
    const sid = remoteWindows.get(win.id)
    remoteWindows.delete(win.id)
    if (sid) {
      console.log('[native] auto-closing session on window close:', sid)
      try {
        native.sessionClose(sid)
      } catch (e) {
        console.error('[native] sessionClose error on window close:', e)
      }
    }
    broadcastActiveConnections()
  })

  return win
}

ipcMain.handle('native:openRemoteWindow', (_, peerId: string, sessionId: string, forceRelay: boolean) => {
  createRemoteWindow(peerId, sessionId, forceRelay)
})

// ─── App Lifecycle ───────────────────────────────────────

app.whenReady().then(() => {
  // Initialize native Rust module
  try {
    native.initialize(app.getPath('userData'))
    console.log('Native module initialized successfully')
  } catch (e) {
    console.error('Failed to initialize native module:', e)
  }

  createMainWindow()
  createBallWindow()
  createTray(mainWindow!, ballWindow!)

  // Start heartbeat if configured
  const apiServer = configGet('apiServer') as string | undefined
  const deviceId = configGet('deviceId') as string | undefined
  if (apiServer && deviceId) {
    startHeartbeat(apiServer, deviceId)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
