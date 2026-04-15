import { getBridgeQuote } from '../../core/bridge/index.js'
import { getSwapQuote } from '../../core/swap/index.js'
import { getEarnQuote, fetchVaults, fetchVault } from '../../core/earn/index.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { McpToolDef } from './index.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[String(chain).toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export const dryrunBridgeTool: McpToolDef = {
  name: 'lifi_dryrun_bridge',
  description: 'Simulate a cross-chain bridge without submitting. Returns full route details, gas estimate, approval requirements.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      fromChain: { type: 'string', description: 'Source chain name or ID' },
      toChain: { type: 'string', description: 'Destination chain name or ID' },
      fromToken: { type: 'string', description: 'Token to send (symbol or address)' },
      toToken: { type: 'string', description: 'Token to receive (symbol or address)' },
      amount: { type: 'string', description: 'Amount in token units (e.g. 100 for 100 USDC)' },
      fromAddress: { type: 'string', description: 'Sender address (0x...)' },
      slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
    },
    required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const quote = await getBridgeQuote({
      fromChain: args.fromChain as string,
      toChain: args.toChain as string,
      fromToken: args.fromToken as string,
      toToken: args.toToken as string,
      amount: args.amount as string,
      fromAddress: args.fromAddress as `0x${string}`,
      slippage: (args.slippage as number) ?? 0.005,
    })
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ dryRun: true, type: 'bridge', quote }, null, 2),
      }],
    }
  },
}

export const dryrunSwapTool: McpToolDef = {
  name: 'lifi_dryrun_swap',
  description: 'Simulate a single-chain token swap without submitting. Returns route, price impact, gas estimate.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chain: { type: 'string', description: 'Chain name or ID' },
      fromToken: { type: 'string', description: 'Token to swap from' },
      toToken: { type: 'string', description: 'Token to swap to' },
      amount: { type: 'string', description: 'Amount in token units' },
      fromAddress: { type: 'string', description: 'Sender address (0x...)' },
      slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
    },
    required: ['chain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const quote = await getSwapQuote({
      chain: args.chain as string,
      fromToken: args.fromToken as string,
      toToken: args.toToken as string,
      amount: args.amount as string,
      fromAddress: args.fromAddress as `0x${string}`,
      slippage: (args.slippage as number) ?? 0.005,
    })
    const priceImpact = quote.toAmountMin && quote.toAmount
      ? ((1 - parseFloat(quote.toAmountMin) / parseFloat(quote.toAmount)) * 100).toFixed(3)
      : null
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ dryRun: true, type: 'swap', quote, priceImpact }, null, 2),
      }],
    }
  },
}

export const dryrunEarnTool: McpToolDef = {
  name: 'lifi_dryrun_earn',
  description: 'Simulate a yield vault deposit without submitting. Returns vault APY, TVL, projected yield, gas estimate.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      protocol: { type: 'string', description: 'Protocol slug or vault address (0x...)' },
      token: { type: 'string', description: 'Token to deposit (symbol or address)' },
      amount: { type: 'string', description: 'Amount in smallest unit' },
      chain: { type: 'string', description: 'Chain name or ID' },
      fromAddress: { type: 'string', description: 'Sender address (0x...)' },
    },
    required: ['protocol', 'token', 'amount', 'chain', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const chainId = resolveChainId(args.chain as string)
    const quote = await getEarnQuote({
      protocol: args.protocol as string,
      token: args.token as string,
      amount: args.amount as string,
      chain: args.chain as string,
      fromAddress: args.fromAddress as `0x${string}`,
    })

    let vault = null
    try {
      if ((args.protocol as string).startsWith('0x')) {
        vault = await fetchVault(chainId, args.protocol as string)
      } else {
        const { vaults } = await fetchVaults({ chainId, protocol: args.protocol as string, limit: 1 })
        vault = vaults[0] ?? null
      }
    } catch { /* best-effort */ }

    const apy = vault?.analytics?.apy?.total ?? null
    const projectedYield = apy != null
      ? {
          daily: (parseFloat(args.amount as string) / 1e6) * apy / 365,
          monthly: (parseFloat(args.amount as string) / 1e6) * apy / 12,
          annual: (parseFloat(args.amount as string) / 1e6) * apy,
        }
      : null

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ dryRun: true, type: 'earn', quote, vault, projectedYield }, null, 2),
      }],
    }
  },
}
