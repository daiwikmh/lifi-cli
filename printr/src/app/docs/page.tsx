export default function DocsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">
          Getting Started
        </h1>
        <p className="text-text-secondary leading-relaxed">
          lifi-cli is a terminal-native DeFi client. Bridge tokens across chains,
          swap on a single chain, deposit into yield protocols, and browse
          prediction markets — all from the command line. Built for humans and
          AI agents via MCP.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Installation
        </h2>
        <div className="code-block">
          <code>{`npm install -g lifi-cli`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Configuration
        </h2>
        <p className="text-sm text-text-secondary">
          Set your API keys and defaults before running any commands.
        </p>
        <div className="code-block">
          <code>{`# LI.FI API key (required for bridge, swap, earn)
lifi config set --api-key <LIFI_KEY>

# Optional: Kalshi and Polymarket keys
lifi config set --kalshi-key <KALSHI_KEY>
lifi config set --polymarket-key <POLY_KEY>

# Set defaults
lifi config set --chain base --wallet main

# Agent provider is configured interactively on first run
lifi agent`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Create a wallet
        </h2>
        <div className="code-block">
          <code>{`# Create a new wallet (key stored in OS keychain)
lifi wallet create --name main

# Or import an existing private key
lifi wallet import --name main --key 0x...

# List wallets
lifi wallet list`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Commands
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["lifi bridge", "Cross-chain token bridge with quote and execution"],
              ["lifi swap", "Single-chain token swap via LI.FI aggregator"],
              ["lifi earn quote", "Get a yield deposit quote via LI.FI Composer"],
              ["lifi earn vaults", "Browse yield vaults with filters"],
              ["lifi earn protocols", "List supported yield protocols"],
              ["lifi earn portfolio <addr>", "Show active yield positions for an address"],
              ["lifi dryrun", "Simulate a transaction without submitting"],
              ["lifi markets list", "Browse Polymarket prediction markets"],
              ["lifi markets get", "Get details for a specific market"],
              ["lifi kalshi", "Browse Kalshi prediction markets"],
              ["lifi manifold", "Browse Manifold prediction markets"],
              ["lifi agent", "Interactive AI agent (openrouter / openai / ollama)"],
              ["lifi wallet create", "Create a new wallet"],
              ["lifi wallet import", "Import wallet from private key"],
              ["lifi wallet list", "List all local wallets"],
              ["lifi config set", "Set API keys and defaults"],
              ["lifi config show", "Show current configuration"],
              ["lifi status", "Track a cross-chain transaction"],
              ["lifi reset", "Remove all config and saved data"],
              ["lifi mcp", "Start MCP server for agent frameworks"],
            ].map(([cmd, desc]) => (
              <tr key={cmd}>
                <td>{cmd}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Quick example
        </h2>
        <div className="code-block">
          <code>{`# Bridge 100 USDC from Base to Arbitrum
lifi bridge \\
  --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main

# Preview first, then add --execute to submit
lifi bridge ... --execute`}</code>
        </div>
      </section>
    </article>
  );
}
