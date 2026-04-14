export default function McpPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-orange">{"⬡"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">MCP Tools</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Run lifi-cli as a Model Context Protocol server and expose all DeFi
          operations to any MCP-compatible AI agent framework. Uses stdio transport.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Start the server</h2>
        <div className="code-block">
          <code>lifi mcp</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Claude Desktop setup
        </h2>
        <div className="code-block">
          <code>{`// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "lifi": {
      "command": "lifi-cli",
      "args": ["mcp"]
    }
  }
}`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Available tools</h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["bridge_tokens", "Get a cross-chain bridge quote (optionally execute)"],
              ["swap_tokens", "Get a single-chain swap quote (optionally execute)"],
              ["earn_quote", "Get a yield protocol deposit quote"],
              ["earn_protocols", "List all supported yield protocols"],
              ["list_markets", "List active Polymarket prediction markets"],
              ["get_market", "Get details of a Polymarket market by slug"],
              ["get_tx_status", "Track a cross-chain transaction by hash"],
            ].map(([tool, desc]) => (
              <tr key={tool as string}>
                <td>{tool}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Tool schemas
        </h2>

        <h3 className="text-base font-semibold text-text-primary">bridge_tokens</h3>
        <table className="param-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["fromChain", "string", "Source chain name or ID"],
              ["toChain", "string", "Destination chain name or ID"],
              ["fromToken", "string", "Token symbol or address to send"],
              ["toToken", "string", "Token symbol or address to receive"],
              ["amount", "string", "Amount in smallest unit (wei/base unit)"],
              ["fromAddress", "string", "Sender wallet address"],
            ].map(([param, type, desc]) => (
              <tr key={param as string}>
                <td>{param}</td>
                <td className="!text-text-muted">{type}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-base font-semibold text-text-primary mt-4">swap_tokens</h3>
        <table className="param-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["chain", "string", "Chain name or ID"],
              ["fromToken", "string", "Token to swap from"],
              ["toToken", "string", "Token to swap to"],
              ["amount", "string", "Amount in smallest unit"],
              ["fromAddress", "string", "Wallet address"],
            ].map(([param, type, desc]) => (
              <tr key={param as string}>
                <td>{param}</td>
                <td className="!text-text-muted">{type}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-base font-semibold text-text-primary mt-4">earn_quote</h3>
        <table className="param-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["protocol", "string", "Protocol symbol (e.g. morpho-usdc)"],
              ["token", "string", "Token to deposit"],
              ["amount", "string", "Amount in smallest unit"],
              ["chain", "string", "Chain name or ID"],
              ["fromAddress", "string", "Wallet address"],
            ].map(([param, type, desc]) => (
              <tr key={param as string}>
                <td>{param}</td>
                <td className="!text-text-muted">{type}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-base font-semibold text-text-primary mt-4">list_markets / get_market / get_tx_status</h3>
        <table className="param-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Parameters</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>list_markets</td>
              <td className="!text-text-secondary">query (optional), limit (optional)</td>
            </tr>
            <tr>
              <td>get_market</td>
              <td className="!text-text-secondary">slug (required)</td>
            </tr>
            <tr>
              <td>get_tx_status</td>
              <td className="!text-text-secondary">txHash (required), fromChain (optional), toChain (optional)</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
