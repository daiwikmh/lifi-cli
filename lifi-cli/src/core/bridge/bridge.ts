import { getQuote } from '../../api/lifi/index.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { BridgeParams, BridgeQuote } from './bridge.types.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export async function getBridgeQuote(params: BridgeParams): Promise<BridgeQuote> {
  const fromChain = resolveChainId(params.fromChain)
  const toChain = resolveChainId(params.toChain)

  const response = await getQuote({
    fromChain,
    toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress ?? params.fromAddress,
    slippage: params.slippage ?? 0.005,
  })

  return {
    id: response.id,
    fromChain,
    toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    toAmountMin: response.estimate.toAmountMin,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? '0',
    tool: response.steps?.[0]?.tool ?? 'unknown',
    transactionRequest: response.transactionRequest as BridgeQuote['transactionRequest'],
    approvalAddress: response.estimate.approvalAddress as BridgeQuote['approvalAddress'],
  }
}
