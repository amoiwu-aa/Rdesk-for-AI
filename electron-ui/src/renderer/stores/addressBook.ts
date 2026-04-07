import { create } from 'zustand'
import type { Peer, AbProfile, AbTag, ViewMode } from '../types'
import * as abService from '../services/abService'

interface AddressBookState {
  personalGuid: string
  sharedProfiles: AbProfile[]
  currentAbGuid: string
  currentAbName: string
  currentAbRule: number // 0=personal(full), 1=read, 2=readwrite
  peers: Peer[]
  tags: AbTag[]
  selectedTags: string[]
  viewMode: ViewMode
  searchQuery: string
  loading: boolean
  error: string

  // Actions
  fetchPersonalAb: () => Promise<void>
  fetchSharedProfiles: () => Promise<void>
  selectAb: (guid: string, name?: string, rule?: number) => Promise<void>
  fetchPeers: () => Promise<void>
  fetchTags: () => Promise<void>
  addPeer: (peer: { id: string; alias?: string; tags?: string[] }) => Promise<void>
  updatePeer: (peer: { id: string; alias?: string; tags?: string[]; note?: string }) => Promise<void>
  deletePeers: (ids: string[]) => Promise<void>
  addTag: (name: string, color: number) => Promise<void>
  renameTag: (oldName: string, newName: string) => Promise<void>
  deleteTags: (names: string[]) => Promise<void>
  setViewMode: (mode: ViewMode) => void
  setSearch: (query: string) => void
  toggleTag: (tagName: string) => void
  getFilteredPeers: () => Peer[]
}

export const useAddressBookStore = create<AddressBookState>((set, get) => ({
  personalGuid: '',
  sharedProfiles: [],
  currentAbGuid: '',
  currentAbName: 'My Address Book',
  currentAbRule: 0,
  peers: [],
  tags: [],
  selectedTags: [],
  viewMode: 'grid',
  searchQuery: '',
  loading: false,
  error: '',

  fetchPersonalAb: async () => {
    try {
      const guid = await abService.getPersonalGuid()
      set({ personalGuid: guid })
      // Auto-select personal AB if nothing selected
      if (!get().currentAbGuid) {
        await get().selectAb(guid, 'My Address Book', 0)
      }
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch address book' })
    }
  },

  fetchSharedProfiles: async () => {
    try {
      const profiles = await abService.getSharedProfiles()
      set({ sharedProfiles: profiles })
    } catch { /* ignore */ }
  },

  selectAb: async (guid, name, rule) => {
    set({
      currentAbGuid: guid,
      currentAbName: name || 'Address Book',
      currentAbRule: rule ?? 0,
      peers: [],
      tags: [],
      selectedTags: [],
      searchQuery: ''
    })
    await Promise.all([get().fetchPeers(), get().fetchTags()])
  },

  fetchPeers: async () => {
    const { currentAbGuid, personalGuid } = get()
    if (!currentAbGuid) return
    set({ loading: true })
    try {
      const isPersonal = currentAbGuid === personalGuid
      if (isPersonal) {
        // Personal AB uses legacy endpoint: GET /api/ab
        const abData = await abService.getPersonalAbData()
        set({ peers: abData.peers, tags: abData.tags, loading: false })
      } else {
        // Shared AB uses paginated endpoint: POST /api/ab/peers?ab={guid}
        const peers = await abService.getSharedPeers(currentAbGuid)
        set({ peers, loading: false })
      }
    } catch (err: unknown) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch peers' })
    }
  },

  fetchTags: async () => {
    const { currentAbGuid, personalGuid } = get()
    if (!currentAbGuid) return
    // For personal AB, tags are already loaded in fetchPeers via getPersonalAbData
    if (currentAbGuid === personalGuid) return
    try {
      const tags = await abService.getSharedTags(currentAbGuid)
      set({ tags: Array.isArray(tags) ? tags : [] })
    } catch { /* ignore */ }
  },

  addPeer: async (peer) => {
    const { currentAbGuid } = get()
    await abService.addPeer(currentAbGuid, peer)
    await get().fetchPeers()
  },

  updatePeer: async (peer) => {
    const { currentAbGuid } = get()
    await abService.updatePeer(currentAbGuid, peer)
    await get().fetchPeers()
  },

  deletePeers: async (ids) => {
    const { currentAbGuid } = get()
    await abService.deletePeers(currentAbGuid, ids)
    await get().fetchPeers()
  },

  addTag: async (name, color) => {
    const { currentAbGuid } = get()
    await abService.addTag(currentAbGuid, { name, color })
    await get().fetchTags()
  },

  renameTag: async (oldName, newName) => {
    const { currentAbGuid } = get()
    await abService.renameTag(currentAbGuid, oldName, newName)
    await get().fetchTags()
    await get().fetchPeers() // peers may reference old tag name
  },

  deleteTags: async (names) => {
    const { currentAbGuid } = get()
    await abService.deleteTags(currentAbGuid, names)
    await get().fetchTags()
    // Remove deleted tags from selection
    set({ selectedTags: get().selectedTags.filter(t => !names.includes(t)) })
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearch: (query) => set({ searchQuery: query }),

  toggleTag: (tagName) => {
    const { selectedTags } = get()
    if (selectedTags.includes(tagName)) {
      set({ selectedTags: selectedTags.filter(t => t !== tagName) })
    } else {
      set({ selectedTags: [...selectedTags, tagName] })
    }
  },

  getFilteredPeers: () => {
    const { peers, selectedTags, searchQuery } = get()
    let result = peers
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.alias?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.hostname?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q)
      )
    }
    if (selectedTags.length > 0) {
      result = result.filter(p =>
        p.tags?.some(t => selectedTags.includes(t))
      )
    }
    return result
  }
}))
