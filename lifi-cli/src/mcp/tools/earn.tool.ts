import { getEarnQuote, listProtocols } from '../../core/earn/index.js'
import type { McpToolDef } from './index.js'

export const earnQuoteTool: McpToolDef = {
  name: 'lifi_earn_quote',
  description: 'Get a quote to deposit tokens into a yield protocol via LI.FI Composer',
  inputSchema: {
    type: 'object' as const,
    properties: {
      protocol: { type: 'string', description: 'Protocol symbol (e.g. morpho-usdc, aave-usdc)' },
      token: { type: 'string', description: 'Token to deposit' },
      amount: { type: 'string', description: 'Amount in smallest unit' },
      chain: { type: 'string', description: 'Chain name or ID' },
      fromAddress: { type: 'string', description: 'Wallet address' },
    },
    required: ['protocol', 'token', 'amount', 'chain', 'fromAddress'],
  },
  async handler(args: Record<string, unknown>) {
    const quote = await getEarnQuote(args as Parameters<typeof getEarnQuote>[0])
    return { content: [{ type: 'text', text: JSON.stringify(quote, null, 2) }] }
  },
}

export const earnProtocolsTool: McpToolDef = {
  name: 'lifi_earn_protocols',
  description: 'List all yield protocols supported by LI.FI Composer',
  inputSchema: {
    type: 'object' as const,
    properties: {
      category: { type: 'string', enum: ['vault', 'lending', 'staking', 'yield'] },
    },
  },
  async handler(args: Record<string, unknown>) {
    const protocols = listProtocols({ category: args.category as string | undefined })
    return { content: [{ type: 'text', text: JSON.stringify(protocols, null, 2) }] }
  },
}
