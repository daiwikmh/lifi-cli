import fs from 'fs'
import path from 'path'
import os from 'os'

const VAULT_DIR = path.join(os.homedir(), '.lifi-cli')
const VAULT_FILE = path.join(VAULT_DIR, 'secrets.json')

function loadVault(): Record<string, string> {
  if (!fs.existsSync(VAULT_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveVault(vault: Record<string, string>): void {
  fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 })
  fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), { mode: 0o600 })
}

export async function storeSecret(account: string, secret: string): Promise<void> {
  const vault = loadVault()
  vault[account] = secret
  saveVault(vault)
}

export async function getSecret(account: string): Promise<string | null> {
  return loadVault()[account] ?? null
}

export async function deleteSecret(account: string): Promise<void> {
  const vault = loadVault()
  delete vault[account]
  saveVault(vault)
}
