import { hostname, platform, arch, cpus, totalmem, version } from 'os'
import { app } from 'electron'

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let lastModifiedAt = 0

export async function reportSysInfo(apiServer: string, deviceId: string): Promise<void> {
  try {
    await fetch(`${apiServer}/api/sysinfo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: deviceId,
        hostname: hostname(),
        os: platform(),
        version: app.getVersion(),
        cpu: cpus()[0]?.model || '',
        memory: `${Math.round(totalmem() / 1024 / 1024 / 1024)}GB`,
        username: process.env.USERNAME || process.env.USER || ''
      })
    })
  } catch {
    // Silently ignore - server may not be reachable
  }
}

export function startHeartbeat(apiServer: string, deviceId: string): void {
  stopHeartbeat()

  // Report sysinfo once on start
  reportSysInfo(apiServer, deviceId)

  // Heartbeat every 30 seconds
  heartbeatTimer = setInterval(async () => {
    try {
      const resp = await fetch(`${apiServer}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deviceId,
          modified_at: lastModifiedAt
        })
      })
      if (resp.ok) {
        const data = await resp.json()
        if (data.modified_at) {
          lastModifiedAt = data.modified_at
        }
      }
    } catch {
      // Silently ignore
    }
  }, 30000)
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}
