// ─── Auth ─────────────────────────────────────────────────
export interface User {
  name: string
  email: string
  note: string
  status: number // 0 = disabled, 1 = active
  is_admin: boolean
}

export interface LoginRequest {
  username: string
  password: string
  id?: string // device_id
}

export interface LoginResponse {
  access_token: string
  type: string
  user: User
}

// ─── Server Config ────────────────────────────────────────
export interface ServerConfig {
  id_server: string
  relay_server: string
  api_server: string
  key: string
}

// ─── Address Book ─────────────────────────────────────────
export interface Peer {
  id: string
  hash?: string
  username?: string
  hostname?: string
  platform?: string
  alias?: string
  tags?: string[]
  note?: string
}

export interface AbProfile {
  guid: string
  name: string
  owner: string
  rule: number // 1 = read, 2 = read+write
  note: string
}

export interface AbTag {
  name: string
  color: number
}

export interface PeersResponse {
  total: number
  data: Peer[]
}

export interface SharedProfilesResponse {
  total: number
  data: AbProfile[]
}

// ─── Accessible Devices ──────────────────────────────────
export interface DeviceGroup {
  name: string
}

export interface AccessibleUser {
  name: string
}

export interface AccessiblePeer {
  id: string
  info: {
    username: string
    os: string
    device_name: string
  }
  user: string
  user_name: string
  device_group_name: string
  note: string
  status: number
}

export interface AccessiblePeersResponse {
  total: number
  data: AccessiblePeer[]
}

export interface DeviceGroupsResponse {
  total: number
  data: DeviceGroup[]
}

export interface AccessibleUsersResponse {
  total: number
  data: AccessibleUser[]
}

// ─── Connection ───────────────────────────────────────────
export interface ActiveConnection {
  id: string
  name: string
  duration: string
  peerId: string
}

export interface RecentConnection {
  id: string
  name: string
  platform?: string
  lastConnected: number // timestamp
}

// ─── Heartbeat & SysInfo ─────────────────────────────────
export interface HeartbeatRequest {
  id: string
  modified_at: number
}

export interface HeartbeatResponse {
  modified_at: number
  strategy?: {
    config_options: Record<string, string>
    extra: Record<string, unknown>
  }
}

// ─── Settings ────────────────────────────────────────────
export type ViewMode = 'grid' | 'tile' | 'list'
export type Theme = 'dark' | 'light'
export type Language = 'zh-CN' | 'en'
