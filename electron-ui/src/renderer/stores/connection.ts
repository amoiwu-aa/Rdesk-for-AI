import { create } from 'zustand'
import type { ActiveConnection, RecentConnection } from '../types'

interface ConnectionState {
  myId: string
  myPassword: string
  activeConnections: ActiveConnection[]
  recentConnections: RecentConnection[]

  setMyId: (id: string) => void
  setMyPassword: (pw: string) => void
  addActiveConnection: (conn: ActiveConnection) => void
  removeActiveConnection: (id: string) => void
  clearActiveConnections: () => void
  addRecentConnection: (conn: RecentConnection) => void
  clearRecentConnections: () => void
  loadRecent: () => Promise<void>
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  myId: '',
  myPassword: '',
  activeConnections: [],
  recentConnections: [],

  setMyId: (id) => set({ myId: id }),
  setMyPassword: (pw) => set({ myPassword: pw }),

  addActiveConnection: (conn) =>
    set((s) => ({ activeConnections: [...s.activeConnections, conn] })),

  removeActiveConnection: (id) =>
    set((s) => ({ activeConnections: s.activeConnections.filter(c => c.id !== id) })),

  clearActiveConnections: () => set({ activeConnections: [] }),

  addRecentConnection: async (conn) => {
    const existing = get().recentConnections.filter(c => c.id !== conn.id)
    const updated = [conn, ...existing].slice(0, 20)
    set({ recentConnections: updated })
    await window.api.configSet('recentConnections', updated)
  },

  clearRecentConnections: async () => {
    set({ recentConnections: [] })
    await window.api.configSet('recentConnections', [])
  },

  loadRecent: async () => {
    const config = await window.api.configGetAll()
    const recent = (config.recentConnections || []) as RecentConnection[]
    set({ recentConnections: recent })
  }
}))
