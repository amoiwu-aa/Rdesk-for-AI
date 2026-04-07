import { nativeImage, Tray, Menu, app, ipcMain, BrowserWindow, screen, shell } from "electron";
import { join } from "path";
import { totalmem, cpus, platform, hostname, version, arch } from "os";
import { is } from "@electron-toolkit/utils";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
let tray = null;
function createTray(mainWindow2, ballWindow2) {
  const icon = nativeImage.createFromBuffer(createTrayIcon());
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Main Window",
      click: () => {
        mainWindow2.show();
        mainWindow2.focus();
      }
    },
    {
      label: "Toggle Floating Ball",
      click: () => {
        if (ballWindow2.isVisible()) {
          ballWindow2.hide();
        } else {
          ballWindow2.show();
        }
      }
    },
    { type: "separator" },
    {
      label: "Quit RDesk",
      click: () => app.quit()
    }
  ]);
  tray.setToolTip("RDesk - Remote Desktop");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    mainWindow2.show();
    mainWindow2.focus();
  });
}
function createTrayIcon() {
  const size = 16;
  const pixels = Buffer.alloc(size * size * 4, 0);
  const cx = 8, cy = 8, r = 6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const i = (y * size + x) * 4;
        pixels[i] = 33;
        pixels[i + 1] = 211;
        pixels[i + 2] = 117;
        pixels[i + 3] = 255;
      }
    }
  }
  return createPNG(size, size, pixels);
}
function createPNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawData.push(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]);
    }
  }
  const { deflateSync } = require2("zlib");
  const compressed = deflateSync(Buffer.from(rawData));
  const chunks = [signature];
  chunks.push(createChunk("IHDR", ihdr));
  chunks.push(createChunk("IDAT", compressed));
  chunks.push(createChunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(chunks);
}
function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeB, data]);
  let crc = 4294967295;
  for (let i = 0; i < crcData.length; i++) {
    crc ^= crcData[i];
    for (let j = 0; j < 8; j++) {
      crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
    }
  }
  crc ^= 4294967295;
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}
const configPath = join(app.getPath("userData"), "rdesk-config.json");
function readConfig() {
  try {
    if (!existsSync(configPath)) return {};
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}
function writeConfig(data) {
  writeFileSync(configPath, JSON.stringify(data, null, 2), "utf-8");
}
function configGet(key) {
  return readConfig()[key];
}
function configSet(key, value) {
  const config = readConfig();
  config[key] = value;
  writeConfig(config);
}
function configGetAll() {
  return readConfig();
}
let heartbeatTimer = null;
let lastModifiedAt = 0;
async function reportSysInfo(apiServer, deviceId) {
  try {
    await fetch(`${apiServer}/api/sysinfo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: deviceId,
        hostname: hostname(),
        os: platform(),
        version: app.getVersion(),
        cpu: cpus()[0]?.model || "",
        memory: `${Math.round(totalmem() / 1024 / 1024 / 1024)}GB`,
        username: process.env.USERNAME || process.env.USER || ""
      })
    });
  } catch {
  }
}
function startHeartbeat(apiServer, deviceId) {
  stopHeartbeat();
  reportSysInfo(apiServer, deviceId);
  heartbeatTimer = setInterval(async () => {
    try {
      const resp = await fetch(`${apiServer}/api/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deviceId,
          modified_at: lastModifiedAt
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.modified_at) {
          lastModifiedAt = data.modified_at;
        }
      }
    } catch {
    }
  }, 3e4);
}
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
const require$1 = createRequire(import.meta.url);
let nativeModule;
try {
  nativeModule = require$1(
    join(__dirname, "../../native/rustdesk-napi.win32-x64-msvc.node")
  );
} catch (e) {
  console.error("Failed to load native module:", e);
  nativeModule = new Proxy({}, {
    get: (_target, prop) => {
      return (..._args) => {
        throw new Error(`Native module not loaded. Cannot call ${String(prop)}`);
      };
    }
  });
}
const native = nativeModule;
let mainWindow = null;
let ballWindow = null;
let isExpanded = false;
const remoteWindows = /* @__PURE__ */ new Map();
function getPreloadPath() {
  return join(__dirname, "../preload/index.mjs");
}
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1e3,
    height: 680,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    show: false,
    backgroundColor: "#1E1E2E",
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
function createBallWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
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
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    ballWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/floating-ball`);
  } else {
    ballWindow.loadFile(join(__dirname, "../renderer/index.html"), { hash: "/floating-ball" });
  }
  ballWindow.on("ready-to-show", () => {
    setTimeout(() => ballWindow?.show(), 500);
  });
}
function getWindowFromEvent(event) {
  try {
    if (event.sender.isDestroyed()) return null;
    return BrowserWindow.fromWebContents(event.sender);
  } catch {
    return null;
  }
}
function safeSend(sender, channel, ...args) {
  try {
    if (!sender.isDestroyed()) {
      sender.send(channel, ...args);
    }
  } catch {
  }
}
ipcMain.handle("config:get", (_, key) => configGet(key));
ipcMain.handle("config:set", (_, key, value) => {
  configSet(key, value);
  if (key === "apiServer") {
    stopHeartbeat();
    const deviceId = configGet("deviceId");
    if (value && deviceId) startHeartbeat(value, deviceId);
  }
});
ipcMain.handle("config:getAll", () => configGetAll());
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:platformInfo", () => ({
  platform: platform(),
  arch: arch(),
  hostname: hostname(),
  version: version()
}));
ipcMain.on("window:minimize", (event) => {
  const win = getWindowFromEvent(event);
  win?.minimize();
});
ipcMain.on("window:maximize", (event) => {
  const win = getWindowFromEvent(event);
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});
ipcMain.on("window:close", (event) => {
  const win = getWindowFromEvent(event);
  win?.close();
});
ipcMain.handle("window:isMaximized", (event) => {
  const win = getWindowFromEvent(event);
  return win?.isMaximized() ?? false;
});
ipcMain.on("ball:show", () => ballWindow?.show());
ipcMain.on("ball:hide", () => ballWindow?.hide());
ipcMain.on("ball:expand", () => {
  if (!ballWindow || isExpanded) return;
  isExpanded = true;
  ballWindow.setResizable(true);
  ballWindow.setSize(320, 420);
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const [bx, by] = ballWindow.getPosition();
  const newX = Math.min(bx, sw - 330);
  const newY = Math.min(by, sh - 430);
  ballWindow.setPosition(newX, newY);
  ballWindow.setResizable(false);
  ballWindow.webContents.send("ball:expanded", true);
});
ipcMain.on("ball:collapse", () => {
  if (!ballWindow || !isExpanded) return;
  isExpanded = false;
  ballWindow.setResizable(true);
  ballWindow.setSize(56, 56);
  ballWindow.setResizable(false);
  ballWindow.webContents.send("ball:expanded", false);
});
ipcMain.on("ball:showMain", () => {
  mainWindow?.show();
  mainWindow?.focus();
});
ipcMain.on("ball:startDrag", () => {
});
ipcMain.handle("native:initialize", () => {
  native.initialize(app.getPath("userData"));
});
ipcMain.handle("native:getDeviceId", () => native.mainGetId());
ipcMain.handle("native:getOption", (_, key) => native.mainGetOption(key));
ipcMain.handle("native:setOption", (_, key, value) => native.mainSetOption(key, value));
ipcMain.handle("native:getLocalOption", (_, key) => native.mainGetLocalOption(key));
ipcMain.handle("native:setLocalOption", (_, key, value) => native.mainSetLocalOption(key, value));
ipcMain.handle("native:getVersion", () => native.mainGetVersion());
ipcMain.handle("native:getPeer", (_, id) => native.mainGetPeer(id));
ipcMain.handle("native:peerHasPassword", (_, id) => native.mainPeerHasPassword(id));
ipcMain.handle("native:getLanPeers", () => native.mainGetLanPeers());
ipcMain.handle("native:discover", () => native.mainDiscover());
ipcMain.handle("native:getOptions", () => native.mainGetOptions());
ipcMain.handle("native:setOptions", (_, json) => native.mainSetOptions(json));
ipcMain.handle("native:sessionCreate", (_, sessionId, peerId, opts) => {
  console.log("[native] sessionCreate:", sessionId, "peer:", peerId);
  try {
    native.sessionCreate(
      sessionId,
      peerId,
      opts?.password,
      opts?.isFileTransfer,
      opts?.isPortForward,
      opts?.isRdp,
      opts?.isTerminal,
      opts?.forceRelay
    );
    console.log("[native] sessionCreate OK:", sessionId);
  } catch (e) {
    console.error("[native] sessionCreate FAILED:", sessionId, e);
    throw e;
  }
});
ipcMain.handle("native:sessionStart", (event, sessionId) => {
  const sender = event.sender;
  native.sessionStart(
    sessionId,
    (eventJson) => {
      safeSend(sender, "native:event", sessionId, eventJson);
    },
    (frameJson) => {
      safeSend(sender, "native:frame", sessionId, frameJson);
    }
  );
});
ipcMain.handle("native:sessionLogin", (_, sessionId, osUsername, osPassword, password, remember) => {
  native.sessionLogin(sessionId, osUsername, osPassword, password, remember);
});
ipcMain.handle("native:sessionClose", (_, sessionId) => {
  try {
    native.sessionClose(sessionId);
  } catch (e) {
    console.error("[native] sessionClose error:", sessionId, e);
  }
});
ipcMain.handle("native:sessionReconnect", (_, sessionId, forceRelay) => {
  native.sessionReconnect(sessionId, forceRelay);
});
ipcMain.handle("native:getFrameRgba", (_, sessionId, display) => {
  return native.getFrameRgba(sessionId, display);
});
ipcMain.handle("native:consumeFrame", (_, sessionId, display) => {
  native.consumeFrame(sessionId, display);
});
ipcMain.handle("native:sendMouse", (_, sessionId, msg) => {
  native.sessionSendMouse(sessionId, msg);
});
ipcMain.handle("native:inputKey", (_, sessionId, name, down, press, alt, ctrl, shift, command) => {
  native.sessionInputKey(sessionId, name, down, press, alt, ctrl, shift, command);
});
ipcMain.handle("native:inputString", (_, sessionId, value) => {
  native.sessionInputString(sessionId, value);
});
ipcMain.handle("native:toggleOption", (_, sessionId, value) => {
  native.sessionToggleOption(sessionId, value);
});
ipcMain.handle("native:getToggleOption", (_, sessionId, arg) => {
  return native.sessionGetToggleOption(sessionId, arg);
});
ipcMain.handle("native:refresh", (_, sessionId, display) => {
  native.sessionRefresh(sessionId, display);
});
ipcMain.handle("native:lockScreen", (_, sessionId) => {
  native.sessionLockScreen(sessionId);
});
ipcMain.handle("native:ctrlAltDel", (_, sessionId) => {
  native.sessionCtrlAltDel(sessionId);
});
ipcMain.handle("native:saveImageQuality", (_, sessionId, value) => {
  native.sessionSaveImageQuality(sessionId, value);
});
ipcMain.handle("native:setCustomFps", (_, sessionId, fps) => {
  native.sessionSetCustomFps(sessionId, fps);
});
ipcMain.handle("native:sessionSetOption", (_, sessionId, key, value) => {
  native.sessionSetOption(sessionId, key, value);
});
ipcMain.handle("native:sessionGetOption", (_, sessionId, key) => {
  return native.sessionGetOption(sessionId, key);
});
ipcMain.handle("native:changePreferCodec", (_, sessionId) => {
  native.sessionChangePreferCodec(sessionId);
});
ipcMain.handle("native:alternativeCodecs", (_, sessionId) => {
  return native.sessionAlternativeCodecs(sessionId);
});
ipcMain.handle("native:switchDisplay", (_, sessionId, display) => {
  native.sessionSwitchDisplay(sessionId, display);
});
ipcMain.handle("native:captureDisplays", (_, sessionId, add, sub, set) => {
  native.sessionCaptureDisplays(sessionId, add, sub, set);
});
ipcMain.handle("native:restartRemoteDevice", (_, sessionId) => {
  native.sessionRestartRemoteDevice(sessionId);
});
ipcMain.handle("native:recordScreen", (_, sessionId, start) => {
  native.sessionRecordScreen(sessionId, start);
});
ipcMain.handle("native:takeScreenshot", (_, sessionId, display) => {
  native.sessionTakeScreenshot(sessionId, display);
});
ipcMain.handle("native:togglePrivacyMode", (_, sessionId, implKey, on) => {
  native.sessionTogglePrivacyMode(sessionId, implKey, on);
});
ipcMain.handle("native:elevateDirect", (_, sessionId) => {
  native.sessionElevateDirect(sessionId);
});
ipcMain.handle("native:elevateWithLogon", (_, sessionId, username, password) => {
  native.sessionElevateWithLogon(sessionId, username, password);
});
ipcMain.handle("native:getKeyboardMode", (_, sessionId) => {
  return native.sessionGetKeyboardMode(sessionId);
});
ipcMain.handle("native:saveKeyboardMode", (_, sessionId, value) => {
  native.sessionSaveKeyboardMode(sessionId, value);
});
ipcMain.handle("native:getViewStyle", (_, sessionId) => {
  return native.sessionGetViewStyle(sessionId);
});
ipcMain.handle("native:saveViewStyle", (_, sessionId, value) => {
  native.sessionSaveViewStyle(sessionId, value);
});
ipcMain.handle("native:sendChat", (_, sessionId, text) => {
  native.sessionSendChat(sessionId, text);
});
ipcMain.handle("native:setClipboard", (_, sessionId, text) => {
  native.sessionSetClipboard(sessionId, text);
});
ipcMain.handle("native:readRemoteDir", (_, sessionId, path, includeHidden) => {
  native.sessionReadRemoteDir(sessionId, path, includeHidden);
});
ipcMain.handle("native:sendFiles", (_, sessionId, actId, path, to, fileNum, includeHidden, isRemote) => {
  native.sessionSendFiles(sessionId, actId, path, to, fileNum, includeHidden, isRemote);
});
ipcMain.handle("native:cancelJob", (_, sessionId, actId) => {
  native.sessionCancelJob(sessionId, actId);
});
ipcMain.handle("native:removeFile", (_, sessionId, actId, path, fileNum, isRemote) => {
  native.sessionRemoveFile(sessionId, actId, path, fileNum, isRemote);
});
ipcMain.handle("native:createDir", (_, sessionId, actId, path, isRemote) => {
  native.sessionCreateDir(sessionId, actId, path, isRemote);
});
ipcMain.handle("native:readLocalDir", async (_, path, _includeHidden) => {
  const fs = await import("fs");
  const pathModule = await import("path");
  try {
    const entries = fs.readdirSync(path, { withFileTypes: true });
    const result = entries.map((e) => ({
      name: e.name,
      isDir: e.isDirectory(),
      size: e.isFile() ? fs.statSync(pathModule.join(path, e.name)).size : 0,
      modified: e.isFile() ? fs.statSync(pathModule.join(path, e.name)).mtimeMs : 0
    }));
    return JSON.stringify({ path, entries: result });
  } catch (e) {
    return JSON.stringify({ path, entries: [], error: String(e) });
  }
});
function broadcastActiveConnections() {
  const connections = [];
  for (const [winId, sid] of remoteWindows) {
    const win = BrowserWindow.fromId(winId);
    if (win && !win.isDestroyed()) {
      const url = win.webContents.getURL();
      const match = url.match(/remote\/([^?]+)\?session=([^&]+)/);
      connections.push({
        id: sid,
        peerId: match?.[1] || "unknown",
        sessionId: sid
      });
    }
  }
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      try {
        win.webContents.send("connections:changed", connections);
      } catch {
      }
    }
  }
}
function createRemoteWindow(peerId, sessionId, forceRelay) {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1280, screenW - 100),
    height: Math.min(800, screenH - 100),
    minWidth: 640,
    minHeight: 480,
    frame: false,
    show: false,
    backgroundColor: "#000000",
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: false
    }
  });
  remoteWindows.set(win.id, sessionId);
  const hash = `/remote/${peerId}?session=${sessionId}${forceRelay ? "&relay=1" : ""}`;
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#${hash}`);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"), { hash });
  }
  win.on("ready-to-show", () => {
    win.show();
    broadcastActiveConnections();
  });
  win.on("closed", () => {
    const sid = remoteWindows.get(win.id);
    remoteWindows.delete(win.id);
    if (sid) {
      console.log("[native] auto-closing session on window close:", sid);
      try {
        native.sessionClose(sid);
      } catch (e) {
        console.error("[native] sessionClose error on window close:", e);
      }
    }
    broadcastActiveConnections();
  });
  return win;
}
ipcMain.handle("native:openRemoteWindow", (_, peerId, sessionId, forceRelay) => {
  createRemoteWindow(peerId, sessionId, forceRelay);
});
app.whenReady().then(() => {
  try {
    native.initialize(app.getPath("userData"));
    console.log("Native module initialized successfully");
  } catch (e) {
    console.error("Failed to initialize native module:", e);
  }
  createMainWindow();
  createBallWindow();
  createTray(mainWindow, ballWindow);
  const apiServer = configGet("apiServer");
  const deviceId = configGet("deviceId");
  if (apiServer && deviceId) {
    startHeartbeat(apiServer, deviceId);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
