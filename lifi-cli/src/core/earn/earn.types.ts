import type { ChainId, Address } from '../../types/index.js'

export interface EarnParams {
  protocol: string
  token: string
  amount: string
  chain: ChainId | string
  fromAddress: Address
}

export interface EarnQuote {
  protocol: string
  vaultSlug: string
  vaultAddress: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  estimatedApy: number | null
  estimatedDuration: number
  gasCostUSD: string
  transactionRequest: {
    to: Address
    from: Address
    data: `0x${string}`
    value: string
    gasLimit: string
    chainId: ChainId
  }
  approvalAddress?: Address
}
