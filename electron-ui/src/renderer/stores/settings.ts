import { create } from 'zustand'
import type { Theme, Language } from '../types'
import { setBaseUrl } from '../services/apiClient'
import * as configService from '../services/configService'

// Mapping from our setting keys to RustDesk native config keys
const NATIVE_OPTION_MAP: Record<string, string> = {
  idServer: 'custom-rendezvous-server',
  relayServer: 'relay-server',
  key: 'key',
  apiServer: 'api-server',
}

interface SettingsState {
  // Server
  apiServer: string
  idServer: string
  relayServer: string
  key: string

  // General
  theme: Theme
  language: Language

  // Display (placeholder - needs Rust core)
  displayQuality: string
  fps: number
  codec: string

  // Actions
  updateSetting: (key: string, value: unknown) => Promise<void>
  fetchServerConfig: () => Promise<void>
  loadFromConfig: () => Promise<void>
}

function applyTheme(theme: string) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

/** Sync a setting to the Rust native module if it's a server config key */
async function syncToNative(key: string, value: string): Promise<void> {
  const nativeKey = NATIVE_OPTION_MAP[key]
  if (nativeKey) {
    try {
      await window.api.native.setOption(nativeKey, value)
    } catch {
      // Native module may not be ready yet — ignore
    }
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiServer: '',
  idServer: '',
  relayServer: '',
  key: '',
  theme: 'dark',
  language: 'zh-CN',
  displayQuality: 'balanced',
  fps: 30,
  codec: 'auto',

  updateSetting: async (key, value) => {
    set({ [key]: value } as Partial<SettingsState>)
    await window.api.configSet(key, value)

    // Sync server settings to Rust native module
    if (typeof value === 'string') {
      await syncToNative(key, value)
    }

    // If apiServer changed, update the HTTP client
    if (key === 'apiServer' && typeof value === 'string') {
      setBaseUrl(value)
    }
    // If theme changed, apply to document root
    if (key === 'theme') {
      applyTheme(value as string)
    }
  },

  fetchServerConfig: async () => {
    try {
      const config = await configService.getServerConfig()
      set({
        idServer: config.id_server || '',
        relayServer: config.relay_server || '',
        key: config.key || ''
      })
      // Persist fetched values to Electron config
      await window.api.configSet('idServer', config.id_server || '')
      await window.api.configSet('relayServer', config.relay_server || '')
      await window.api.configSet('key', config.key || '')
      // Sync to Rust native module
      await syncToNative('idServer', config.id_server || '')
      await syncToNative('relayServer', config.relay_server || '')
      await syncToNative('key', config.key || '')
    } catch {
      // Ignore - server might not be reachable
    }
  },

  loadFromConfig: async () => {
    const config = await window.api.configGetAll()
    const state: Partial<SettingsState> = {}
    if (config.apiServer) state.apiServer = config.apiServer as string
    if (config.idServer) state.idServer = config.idServer as string
    if (config.relayServer) state.relayServer = config.relayServer as string
    if (config.key) state.key = config.key as string
    if (config.theme) state.theme = config.theme as Theme
    if (config.language) state.language = config.language as Language
    if (config.displayQuality) state.displayQuality = config.displayQuality as string
    if (config.fps) state.fps = config.fps as number
    if (config.codec) state.codec = config.codec as string

    set(state)
    if (state.apiServer) setBaseUrl(state.apiServer)
    applyTheme(state.theme || 'dark')

    // Sync all server settings to Rust native module on startup
    await syncToNative('idServer', state.idServer || '')
    await syncToNative('relayServer', state.relayServer || '')
    await syncToNative('key', state.key || '')
    await syncToNative('apiServer', state.apiServer || '')
  }
}))
