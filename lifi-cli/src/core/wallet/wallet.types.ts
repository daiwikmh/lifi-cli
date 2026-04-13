import type { Address } from '../../types/index.js'

export interface Wallet {
  name: string
  address: Address
  chainId?: number
  createdAt: string
}

export interface WalletStore {
  wallets: Wallet[]
}
