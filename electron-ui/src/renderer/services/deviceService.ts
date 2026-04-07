import { api } from './apiClient'
import type {
  DeviceGroup, AccessibleUser, AccessiblePeer,
  DeviceGroupsResponse, AccessibleUsersResponse, AccessiblePeersResponse
} from '../types'

export async function getDeviceGroups(page = 1, pageSize = 100): Promise<DeviceGroup[]> {
  const res = await api.get<DeviceGroupsResponse>(
    `/api/device-group/accessible?current=${page}&pageSize=${pageSize}`
  )
  return res.data || []
}

export async function getAccessibleUsers(page = 1, pageSize = 100): Promise<AccessibleUser[]> {
  const res = await api.get<AccessibleUsersResponse>(
    `/api/users?accessible=&status=1&current=${page}&pageSize=${pageSize}`
  )
  return res.data || []
}

export async function getAccessiblePeers(page = 1, pageSize = 100): Promise<AccessiblePeer[]> {
  const res = await api.get<AccessiblePeersResponse>(
    `/api/peers?accessible=&status=1&current=${page}&pageSize=${pageSize}`
  )
  return res.data || []
}
