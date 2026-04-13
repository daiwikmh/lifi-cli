import type { ChainId, Address, TxHash } from '../../types/index.js'

export interface SwapParams {
  chain: ChainId | string
  fromToken: string
  toToken: string
  amount: string
  fromAddress: Address
  slippage?: number
}

export interface SwapQuote {
  id: string
  chain: ChainId
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  toAmountMin: string
  estimatedDuration: number
  gasCostUSD: string
  tool: string
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

export interface SwapResult {
  txHash: TxHash
  chain: ChainId
  status: 'pending' | 'done' | 'failed'
}
