export interface McpToolDef {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>
}

export { bridgeTool } from './bridge.tool.js'
export { swapTool } from './swap.tool.js'
export { earnQuoteTool, earnVaultsTool, earnProtocolsTool } from './earn.tool.js'
export { listMarketsTool, getMarketTool } from './markets.tool.js'
export { statusTool } from './status.tool.js'
