import { getMarkets, getMarketBySlug } from '../../core/markets/index.js'
import type { McpToolDef } from './index.js'

export const listMarketsTool: McpToolDef = {
  name: 'lifi_markets_list',
  description: 'List active Polymarket prediction markets',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Search query (optional)' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  async handler(args: Record<string, unknown>) {
    const markets = await getMarkets(args.query as string | undefined, (args.limit as number) ?? 20)
    return { content: [{ type: 'text', text: JSON.stringify(markets, null, 2) }] }
  },
}

export const getMarketTool: McpToolDef = {
  name: 'lifi_markets_get',
  description: 'Get details of a Polymarket market by slug',
  inputSchema: {
    type: 'object' as const,
    properties: {
      slug: { type: 'string', description: 'Market slug' },
    },
    required: ['slug'],
  },
  async handler(args: Record<string, unknown>) {
    const market = await getMarketBySlug(args.slug as string)
    return { content: [{ type: 'text', text: JSON.stringify(market, null, 2) }] }
  },
}
