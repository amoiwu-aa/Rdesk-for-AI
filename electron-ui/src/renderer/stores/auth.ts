import { create } from 'zustand'
import type { User } from '../types'
import { setToken, setBaseUrl } from '../services/apiClient'
import * as authService from '../services/authService'

interface AuthState {
  user: User | null
  accessToken: string
  isLoggedIn: boolean
  loading: boolean
  error: string

  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearAuth: () => void
  initFromConfig: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: '',
  isLoggedIn: false,
  loading: false,
  error: '',

  login: async (username, password) => {
    set({ loading: true, error: '' })
    try {
      const res = await authService.login(username, password)
      setToken(res.access_token)
      set({
        user: res.user,
        accessToken: res.access_token,
        isLoggedIn: true,
        loading: false,
        error: ''
      })
      // Persist token
      await window.api.configSet('accessToken', res.access_token)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      set({ loading: false, error: msg })
      throw err
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } catch { /* ignore */ }
    setToken('')
    set({ user: null, accessToken: '', isLoggedIn: false })
    await window.api.configSet('accessToken', '')
  },

  refreshUser: async () => {
    try {
      const user = await authService.getCurrentUser()
      set({ user, isLoggedIn: true })
    } catch {
      // Token invalid
      get().clearAuth()
    }
  },

  clearAuth: () => {
    setToken('')
    set({ user: null, accessToken: '', isLoggedIn: false })
    window.api.configSet('accessToken', '')
  },

  initFromConfig: async () => {
    const config = await window.api.configGetAll()
    const apiServer = config.apiServer as string | undefined
    const token = config.accessToken as string | undefined

    if (apiServer) setBaseUrl(apiServer)
    if (token) {
      setToken(token)
      set({ accessToken: token })
      // Verify token is still valid
      try {
        const user = await authService.getCurrentUser()
        set({ user, isLoggedIn: true })
      } catch {
        // Token expired
        setToken('')
        set({ accessToken: '' })
        await window.api.configSet('accessToken', '')
      }
    }
  }
}))
