import { getBridgeQuote } from '../../core/bridge/index.js'
import type { McpToolDef } from './index.js'

export const bridgeTool: McpToolDef = {
  name: 'lifi_bridge_quote',
  description: 'Get a quote to bridge tokens across chains using LI.FI',
  inputSchema: {
    type: 'object' as const,
    properties: {
      fromChain: { type: 'string', description: 'Source chain (name or ID)' },
      toChain: { type: 'string', description: 'Destination chain (name or ID)' },
      fromToken: { type: 'string', description: 'Token to send' },
      toToken: { type: 'string', description: 'Token to receive' },
      amount: { type: 'string', description: 'Amount in smallest unit' },
      fromAddress: { type: 'string', description: 'Sender address' },
    },
    required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const quote = await getBridgeQuote(args as Parameters<typeof getBridgeQuote>[0])
    return { content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }] }
  },
}
