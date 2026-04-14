import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import {
  bridgeTool,
  swapTool,
  earnQuoteTool,
  earnVaultsTool,
  earnProtocolsTool,
  listMarketsTool,
  getMarketTool,
  statusTool,
} from './tools/index.js'
import type { McpToolDef } from './tools/index.js'

const ALL_TOOLS: McpToolDef[] = [
  bridgeTool,
  swapTool,
  earnQuoteTool,
  earnVaultsTool,
  earnProtocolsTool,
  listMarketsTool,
  getMarketTool,
  statusTool,
]

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    { name: 'lifi-cli', version: '0.1.0' },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = ALL_TOOLS.find((t) => t.name === request.params.name)
    if (!tool) {
      return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true }
    }
    try {
      return await tool.handler((request.params.arguments ?? {}) as Record<string, unknown>)
    } catch (err) {
      return { content: [{ type: 'text', text: String(err) }], isError: true }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}
