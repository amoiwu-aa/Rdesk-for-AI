import { api } from './apiClient'
import type { Peer, AbTag, AbProfile, SharedProfilesResponse } from '../types'

export async function getPersonalGuid(): Promise<string> {
  const res = await api.post<{ guid: string }>('/api/ab/personal')
  return res.guid
}

export async function getSharedProfiles(): Promise<AbProfile[]> {
  const res = await api.post<SharedProfilesResponse>('/api/ab/shared/profiles')
  return res.data || []
}

/**
 * Fetch personal address book (legacy format).
 * GET /api/ab → { data: "<json_string>" }
 * The json_string contains { peers: [...], tags: [...], tag_colors: {...} }
 */
export async function getPersonalAbData(): Promise<{ peers: Peer[]; tags: AbTag[] }> {
  const res = await api.get<{ data?: string }>('/api/ab')
  if (!res.data) return { peers: [], tags: [] }

  let parsed: { peers?: Peer[]; tags?: string[]; tag_colors?: Record<string, number> }
  try {
    parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
  } catch {
    return { peers: [], tags: [] }
  }

  const peers: Peer[] = (parsed.peers || []).map((p) => ({
    id: p.id,
    alias: p.alias,
    tags: p.tags,
    hash: p.hash,
    username: p.username,
    hostname: p.hostname,
    platform: p.platform,
    note: p.note,
  }))

  const tagColors = parsed.tag_colors || {}
  const tags: AbTag[] = (parsed.tags || []).map((name) => ({
    name,
    color: tagColors[name] || 0,
  }))

  return { peers, tags }
}

/**
 * Fetch peers for shared address book (paginated).
 * POST /api/ab/peers?ab={guid}&current=1&pageSize=100 → { total, data: [...] }
 */
export async function getSharedPeers(
  abGuid: string,
  page = 1,
  pageSize = 100
): Promise<Peer[]> {
  const allPeers: Peer[] = []
  let current = page
  let total = 0

  do {
    const params = new URLSearchParams({
      current: String(current),
      pageSize: String(pageSize),
      ab: abGuid,
    })
    const res = await api.post<{ total?: number; data?: Peer[] }>(`/api/ab/peers?${params}`)
    if (res.total && total === 0) total = res.total
    if (Array.isArray(res.data)) {
      allPeers.push(...res.data)
    }
    current++
  } while (current * pageSize < total)

  return allPeers
}

/**
 * Fetch tags for a shared address book.
 * POST /api/ab/tags/{guid}
 */
export async function getSharedTags(abGuid: string): Promise<AbTag[]> {
  try {
    const res = await api.post<AbTag[] | { data?: AbTag[] }>(`/api/ab/tags/${abGuid}`)
    if (Array.isArray(res)) return res
    if (Array.isArray((res as { data?: AbTag[] }).data)) return (res as { data?: AbTag[] }).data!
    return []
  } catch {
    return []
  }
}

/**
 * Push personal address book (legacy format).
 * POST /api/ab with { data: "<json_string>" }
 */
export async function pushPersonalAb(peers: Peer[], tags: AbTag[]): Promise<void> {
  const tagNames = tags.map((t) => t.name)
  const tagColors: Record<string, number> = {}
  tags.forEach((t) => { if (t.color) tagColors[t.name] = t.color })
  const data = JSON.stringify({ peers, tags: tagNames, tag_colors: tagColors })
  await api.post('/api/ab', { data })
}

export async function addPeer(
  abGuid: string,
  peer: { id: string; alias?: string; tags?: string[] }
): Promise<void> {
  await api.post(`/api/ab/peer/add/${abGuid}`, peer)
}

export async function updatePeer(
  abGuid: string,
  peer: { id: string; alias?: string; tags?: string[]; note?: string }
): Promise<void> {
  await api.post(`/api/ab/peer/update/${abGuid}`, peer)
}

export async function deletePeers(abGuid: string, peerIds: string[]): Promise<void> {
  await api.del(`/api/ab/peer/${abGuid}`, peerIds)
}

export async function addTag(abGuid: string, tag: { name: string; color: number }): Promise<void> {
  await api.post(`/api/ab/tag/add/${abGuid}`, tag)
}

export async function renameTag(abGuid: string, oldName: string, newName: string): Promise<void> {
  await api.put(`/api/ab/tag/rename/${abGuid}`, { old: oldName, new: newName })
}

export async function deleteTags(abGuid: string, tagNames: string[]): Promise<void> {
  await api.del(`/api/ab/tag/${abGuid}`, tagNames)
}
