import { api } from './apiClient'
import type { LoginResponse, User } from '../types'

export async function login(username: string, password: string, deviceId?: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/api/login', {
    username,
    password,
    id: deviceId || ''
  })
}

export async function logout(): Promise<void> {
  await api.post('/api/logout')
}

export async function getCurrentUser(): Promise<User> {
  return api.post<User>('/api/currentUser')
}
