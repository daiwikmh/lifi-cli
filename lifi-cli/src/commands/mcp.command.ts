import { Command } from 'commander'

export function mcpCommand(): Command {
  return new Command('mcp')
    .description('Start MCP server over stdio (for Claude Code, Cursor, etc.)')
    .action(async () => {
      const { startMcpServer } = await import('../mcp/server.js')
      await startMcpServer()
    })
}
