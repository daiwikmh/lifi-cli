export default function AgentPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-purple">{"◉"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Agent</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          An interactive AI agent with all DeFi tools wired in. Powered by
          OpenRouter. Chat in natural language to bridge, swap, check markets,
          and more.
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
              ["--model <model>", "OpenRouter model ID (default: anthropic/claude-3.5-sonnet)"],
              ["--system <prompt>", "Override the system prompt"],
            ].map(([flag, desc]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-block">
          <code>{`# Start with default model (Claude 3.5 Sonnet)
lifi agent

# Use a different model
lifi agent --model openai/gpt-4o

# Use a free model
lifi agent --model meta-llama/llama-3.1-8b-instruct:free`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Setup
        </h2>
        <p className="text-sm text-text-secondary">
          Requires an OpenRouter API key:
        </p>
        <div className="code-block">
          <code>lifi config set --openrouter-key {"<OPENROUTER_KEY>"}</code>
        </div>
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
              ["list_earn_protocols", "List supported yield protocols"],
              ["list_markets", "List Polymarket prediction markets"],
              ["list_kalshi_markets", "List Kalshi prediction markets"],
              ["list_manifold_markets", "List Manifold prediction markets"],
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
            "What yield protocols are available for USDC?",
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
  );
}
