import { api } from './apiClient'
import type { ServerConfig } from '../types'

export async function getServerConfig(): Promise<ServerConfig> {
  return api.get<ServerConfig>('/api/server-config')
}
