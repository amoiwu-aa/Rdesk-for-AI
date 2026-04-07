import { create } from 'zustand'
import type { DeviceGroup, AccessibleUser, AccessiblePeer } from '../types'
import * as deviceService from '../services/deviceService'

interface GroupState {
  groups: DeviceGroup[]
  users: AccessibleUser[]
  peers: AccessiblePeer[]
  selectedType: 'group' | 'user' | null
  selectedName: string
  loading: boolean
  error: string

  fetchAll: () => Promise<void>
  selectGroup: (name: string) => void
  selectUser: (name: string) => void
  clearSelection: () => void
  getFilteredPeers: () => AccessiblePeer[]
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  users: [],
  peers: [],
  selectedType: null,
  selectedName: '',
  loading: false,
  error: '',

  fetchAll: async () => {
    set({ loading: true, error: '' })
    try {
      const [groups, users, peers] = await Promise.all([
        deviceService.getDeviceGroups(),
        deviceService.getAccessibleUsers(),
        deviceService.getAccessiblePeers()
      ])
      set({ groups, users, peers, loading: false })
    } catch (err: unknown) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch' })
    }
  },

  selectGroup: (name) => set({ selectedType: 'group', selectedName: name }),
  selectUser: (name) => set({ selectedType: 'user', selectedName: name }),
  clearSelection: () => set({ selectedType: null, selectedName: '' }),

  getFilteredPeers: () => {
    const { peers, selectedType, selectedName } = get()
    if (!selectedType || !selectedName) return peers
    if (selectedType === 'group') {
      return peers.filter(p => p.device_group_name === selectedName)
    }
    return peers.filter(p => p.user_name === selectedName)
  }
}))
