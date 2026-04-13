import { getQuote } from '../../api/lifi/index.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { SwapParams, SwapQuote } from './swap.types.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  const chainId = resolveChainId(params.chain)

  const response = await getQuote({
    fromChain: chainId,
    toChain: chainId,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    slippage: params.slippage ?? 0.005,
  })

  return {
    id: response.id,
    chain: chainId,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    toAmountMin: response.estimate.toAmountMin,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? '0',
    tool: response.steps?.[0]?.tool ?? 'unknown',
    transactionRequest: response.transactionRequest as SwapQuote['transactionRequest'],
    approvalAddress: response.estimate.approvalAddress as SwapQuote['approvalAddress'],
  }
}
