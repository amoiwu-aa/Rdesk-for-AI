import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const configPath = join(app.getPath('userData'), 'rdesk-config.json')

function readConfig(): Record<string, unknown> {
  try {
    if (!existsSync(configPath)) return {}
    return JSON.parse(readFileSync(configPath, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfig(data: Record<string, unknown>): void {
  writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8')
}

export function configGet(key: string): unknown {
  return readConfig()[key]
}

export function configSet(key: string, value: unknown): void {
  const config = readConfig()
  config[key] = value
  writeConfig(config)
}

export function configGetAll(): Record<string, unknown> {
  return readConfig()
}
