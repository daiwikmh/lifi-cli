import { getQuote } from '../../api/lifi/index.js'
import { CHAIN_IDS } from '../../config/index.js'
import { getProtocolBySymbol } from './protocols.js'
import type { EarnParams, EarnQuote } from './earn.types.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export async function getEarnQuote(params: EarnParams): Promise<EarnQuote> {
  const protocol = getProtocolBySymbol(params.protocol)
  if (!protocol) {
    throw new Error(`Unknown protocol: ${params.protocol}. Run 'lifi earn protocols' to list supported protocols.`)
  }

  const chainId = resolveChainId(params.chain)

  const response = await getQuote({
    fromChain: chainId,
    toChain: protocol.chainId,
    fromToken: params.token,
    toToken: protocol.vaultToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress,
  })

  return {
    protocol: protocol.name,
    fromToken: params.token,
    toToken: protocol.vaultToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    estimatedApy: protocol.apy,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? '0',
    transactionRequest: response.transactionRequest as EarnQuote['transactionRequest'],
    approvalAddress: response.estimate.approvalAddress as EarnQuote['approvalAddress'],
  }
}
