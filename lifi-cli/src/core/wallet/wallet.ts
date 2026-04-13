import fs from 'fs'
import path from 'path'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { WALLETS_DIR } from '../../config/index.js'
import { storeSecret, getSecret } from './keychain.js'
import type { Wallet } from './wallet.types.js'

const WALLET_INDEX = path.join(WALLETS_DIR, 'index.json')

function ensureWalletsDir(): void {
  if (!fs.existsSync(WALLETS_DIR)) fs.mkdirSync(WALLETS_DIR, { recursive: true })
}

function readIndex(): Wallet[] {
  ensureWalletsDir()
  if (!fs.existsSync(WALLET_INDEX)) return []
  try {
    return JSON.parse(fs.readFileSync(WALLET_INDEX, 'utf-8'))
  } catch {
    return []
  }
}

function writeIndex(wallets: Wallet[]): void {
  ensureWalletsDir()
  fs.writeFileSync(WALLET_INDEX, JSON.stringify(wallets, null, 2))
}

export async function createWallet(name: string): Promise<Wallet> {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  const wallet: Wallet = {
    name,
    address: account.address,
    createdAt: new Date().toISOString(),
  }
  await storeSecret(name, privateKey)
  const index = readIndex()
  index.push(wallet)
  writeIndex(index)
  return wallet
}

export async function importWallet(name: string, privateKey: `0x${string}`): Promise<Wallet> {
  const account = privateKeyToAccount(privateKey)
  const wallet: Wallet = {
    name,
    address: account.address,
    createdAt: new Date().toISOString(),
  }
  await storeSecret(name, privateKey)
  const index = readIndex()
  index.push(wallet)
  writeIndex(index)
  return wallet
}

export function listWallets(): Wallet[] {
  return readIndex()
}

export async function getWalletKey(name: string): Promise<`0x${string}`> {
  const key = await getSecret(name)
  if (!key) throw new Error(`Wallet not found: ${name}`)
  return key as `0x${string}`
}
