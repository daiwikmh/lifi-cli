export default function AgentPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-purple">{"◉"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Agent</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          An interactive AI agent with all DeFi tools wired in. Supports OpenRouter,
          OpenAI, and Ollama. Chat in natural language to bridge, swap, check markets, and more.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>lifi agent [options]</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["--model <model>", "Model ID override for this session"],
              ["--system <prompt>", "Override the system prompt"],
              ["--setup", "Reconfigure provider, model, and API key"],
            ].map(([flag, desc]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-block">
          <code>{`# First run — interactive setup launches automatically
lifi agent

# Force reconfigure
lifi agent --setup

# Override model for this session
lifi agent --model gpt-4o`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="setup" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Setup
        </h2>
        <p className="text-sm text-text-secondary">
          On first run (or with <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">--setup</code>),
          an interactive prompt guides you through configuration:
        </p>
        <div className="code-block">
          <code>{`  Agent Setup
  ────────────────────────────────────────
  Providers:
    1. openrouter
    2. openai
    3. ollama

  provider › 1
  model › [anthropic/claude-3.5-sonnet]
  api key › ************
  save? › [Y/n]`}</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Default model</th>
              <th>API key source</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["openrouter", "qwen/qwen3-next-80b-a3b-instruct:free", "openrouter.ai/keys"],
              ["openai", "gpt-4o", "platform.openai.com"],
              ["ollama", "llama3", "none (local)"],
            ].map(([p, m, src]) => (
              <tr key={p as string}>
                <td>{p}</td>
                <td className="!text-text-secondary">{m}</td>
                <td className="!text-text-muted">{src}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-text-muted">
          Config is saved to <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">~/.lifi/config.json</code>.
          Run <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">lifi reset</code> to clear it.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="tools" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Available tools
        </h2>
        <p className="text-sm text-text-secondary">
          The agent has access to all lifi-cli operations as function calls:
        </p>
        <table className="param-table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["get_bridge_quote", "Get a cross-chain bridge quote"],
              ["get_swap_quote", "Get a single-chain swap quote"],
              ["get_earn_quote", "Get a yield deposit quote"],
              ["list_earn_vaults", "Browse yield vaults with filters"],
              ["list_earn_protocols", "List supported yield protocols"],
              ["get_earn_portfolio", "Show yield positions for an address"],
              ["list_markets", "List Polymarket prediction markets"],
              ["list_kalshi_markets", "List Kalshi prediction markets"],
              ["list_manifold_markets", "List Manifold prediction markets"],
              ["dryrun_bridge", "Simulate a bridge without submitting"],
              ["dryrun_swap", "Simulate a swap without submitting"],
              ["dryrun_earn", "Simulate an earn deposit with projected yield"],
              ["get_tx_status", "Check cross-chain transaction status"],
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
          Example prompts
        </h2>
        <div className="flex flex-col gap-2">
          {[
            "Bridge 100 USDC from Base to Arbitrum for me",
            "What are the top 5 prediction markets right now?",
            "Swap 0.01 ETH to USDC on Base",
            "What yield protocols are available for USDC on Base?",
            "Show projected yield if I deposit 1000 USDC into Morpho",
            "Check the status of transaction 0xabc...",
          ].map((prompt) => (
            <div key={prompt} className="px-4 py-2.5 rounded-lg bg-bg-card border border-border-dim text-sm text-text-secondary font-mono">
              <span className="text-neon-green mr-2">{">"}</span>
              {prompt}
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
