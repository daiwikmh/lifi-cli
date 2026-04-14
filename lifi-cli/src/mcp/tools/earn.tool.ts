import { getEarnQuote, fetchVaults, fetchEarnProtocols } from '../../core/earn/index.js'
import type { McpToolDef } from './index.js'

export const earnQuoteTool: McpToolDef = {
  name: 'lifi_earn_quote',
  description: 'Get a quote to deposit tokens into a yield vault via LI.FI Earn',
  inputSchema: {
    type: 'object' as const,
    properties: {
      protocol: { type: 'string', description: 'Protocol slug (e.g. morpho) or vault address (0x...)' },
      token: { type: 'string', description: 'Token to deposit (symbol or address)' },
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

export const earnVaultsTool: McpToolDef = {
  name: 'lifi_earn_vaults',
  description: 'List available yield vaults from the LI.FI Earn API',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chainId: { type: 'number', description: 'Filter by chain ID' },
      protocol: { type: 'string', description: 'Filter by protocol slug' },
      underlyingToken: { type: 'string', description: 'Filter by underlying token symbol' },
      category: { type: 'string', enum: ['vault', 'lending', 'staking', 'yield'] },
      limit: { type: 'number', description: 'Max results (default 20)' },
      offset: { type: 'number', description: 'Pagination offset' },
    },
  },
  async handler(args: Record<string, unknown>) {
    const result = await fetchVaults(args as Parameters<typeof fetchVaults>[0])
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  },
}

export const earnProtocolsTool: McpToolDef = {
  name: 'lifi_earn_protocols',
  description: 'List protocols with active vaults on LI.FI Earn',
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
  async handler() {
    const protocols = await fetchEarnProtocols()
    return { content: [{ type: 'text', text: JSON.stringify(protocols, null, 2) }] }
  },
}
