import { getSwapQuote } from '../../core/swap/index.js'
import type { McpToolDef } from './index.js'

export const swapTool: McpToolDef = {
  name: 'lifi_swap_quote',
  description: 'Get a quote to swap tokens on a single chain using LI.FI',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chain: { type: 'string', description: 'Chain name or ID (e.g. base, ethereum, arbitrum)' },
      fromToken: { type: 'string', description: 'Token to swap from (symbol or address)' },
      toToken: { type: 'string', description: 'Token to swap to (symbol or address)' },
      amount: { type: 'string', description: 'Amount in smallest unit (e.g. 1000000 for 1 USDC)' },
      fromAddress: { type: 'string', description: 'Wallet address' },
      slippage: { type: 'number', description: 'Slippage tolerance (e.g. 0.005 for 0.5%)' },
    },
    required: ['chain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const quote = await getSwapQuote(args as unknown as Parameters<typeof getSwapQuote>[0])
    return { content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }] }
  },
}
