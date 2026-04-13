import type { ChainId, Address, TxHash } from '../../types/index.js'

export interface BridgeParams {
  fromChain: ChainId | string
  toChain: ChainId | string
  fromToken: string
  toToken: string
  amount: string
  fromAddress: Address
  toAddress?: Address
  slippage?: number
}

export interface BridgeQuote {
  id: string
  fromChain: ChainId
  toChain: ChainId
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

export interface BridgeResult {
  txHash: TxHash
  fromChain: ChainId
  toChain: ChainId
  status: 'pending' | 'done' | 'failed'
}
