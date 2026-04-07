let _baseUrl = ''
let _token = ''

export function setBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, '')
}

export function setToken(token: string): void {
  _token = token
}

export function getToken(): string {
  return _token
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!_baseUrl) throw new ApiError(0, 'API server not configured')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const resp = await fetch(`${_baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (resp.status === 401) {
    _token = ''
    throw new ApiError(401, 'Unauthorized')
  }

  if (!resp.ok) {
    let msg = resp.statusText
    try {
      const err = await resp.json()
      msg = err.error || err.message || msg
    } catch { /* ignore */ }
    throw new ApiError(resp.status, msg)
  }

  const text = await resp.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string, body?: unknown) => request<T>('DELETE', path, body),
}
