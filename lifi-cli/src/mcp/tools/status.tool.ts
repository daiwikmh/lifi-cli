import { getStatus } from '../../api/lifi/index.js'
import type { McpToolDef } from './index.js'

export const statusTool: McpToolDef = {
  name: 'lifi_tx_status',
  description: 'Check the status of a LI.FI cross-chain transaction',
  inputSchema: {
    type: 'object' as const,
    properties: {
      txHash: { type: 'string', description: 'Transaction hash' },
      fromChain: { type: 'number', description: 'Source chain ID' },
      toChain: { type: 'number', description: 'Destination chain ID' },
    },
    required: ['txHash'],
  },
  async handler(args: Record<string, unknown>) {
    const status = await getStatus(args.txHash as string, undefined, args.fromChain as number, args.toChain as number)
    return { content: [{ type: 'text', text: JSON.stringify(status, null, 2) }] }
  },
}
