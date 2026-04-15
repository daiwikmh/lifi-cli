import fs from 'fs'
import path from 'path'
import { CONFIG_DIR, CONFIG_FILE } from './defaults.js'

interface Config {
  lifiApiKey?: string
  openrouterApiKey?: string
  polymarketApiKey?: string
  kalshiApiKey?: string
  defaultChain?: string
  defaultWallet?: string
  agentProvider?: string
  agentModel?: string
  agentApiKey?: string
  agentBaseUrl?: string
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

export function loadConfig(): Config {
  ensureConfigDir()
  if (!fs.existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveConfig(updates: Partial<Config>): void {
  ensureConfigDir()
  const current = loadConfig()
  const next = { ...current, ...updates }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2))
}

export function getConfigValue<K extends keyof Config>(key: K): Config[K] {
  const envMap: Record<keyof Config, string> = {
    lifiApiKey: 'LIFI_API_KEY',
    openrouterApiKey: 'OPENROUTER_API_KEY',
    polymarketApiKey: 'POLYMARKET_API_KEY',
    kalshiApiKey: 'KALSHI_API_KEY',
    defaultChain: 'DEFAULT_CHAIN',
    defaultWallet: 'DEFAULT_WALLET',
    agentProvider: 'AGENT_PROVIDER',
    agentModel: 'AGENT_MODEL',
    agentApiKey: 'AGENT_API_KEY',
    agentBaseUrl: 'AGENT_BASE_URL',
  }
  const fromEnv = process.env[envMap[key]]
  if (fromEnv) return fromEnv as Config[K]
  return loadConfig()[key]
}

export function resolveChain(chain?: string): string {
  return chain ?? getConfigValue('defaultChain') ?? 'base'
}
