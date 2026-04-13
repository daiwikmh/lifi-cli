import type { ChainId, Address, TxHash } from '../../types/index.js'

export interface Protocol {
  name: string
  symbol: string
  vaultToken: Address
  underlyingToken: string
  chainId: ChainId
  apy?: number
  tvl?: number
  category: 'vault' | 'lending' | 'staking' | 'yield'
}

export interface EarnParams {
  protocol: string
  token: string
  amount: string
  chain: ChainId | string
  fromAddress: Address
}

export interface EarnQuote {
  protocol: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  estimatedApy?: number
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

export interface PortfolioPosition {
  protocol: string
  token: string
  balance: string
  chainId: ChainId
  apy?: number
}
