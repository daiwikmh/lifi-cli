export default function ConfigPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-text-secondary">{"⚙"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Config</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Manage CLI configuration. Set API keys, default chain, and default wallet.
          Config is stored at <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">~/.lifi/config.json</code>.
          API keys are masked in output.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="set" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi config set
        </h2>
        <p className="text-sm text-text-secondary">Set one or more config values.</p>
        <div className="code-block">
          <code>lifi config set [options]</code>
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
              ["--api-key <key>", "LI.FI API key (required for bridge, swap, earn)"],
              ["--openrouter-key <key>", "OpenRouter API key (required for lifi agent)"],
              ["--polymarket-key <key>", "Polymarket API key"],
              ["--kalshi-key <key>", "Kalshi API key"],
              ["--chain <chain>", "Default chain (e.g. base, arbitrum, ethereum)"],
              ["--wallet <name>", "Default wallet name"],
            ].map(([flag, desc]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-block">
          <code>{`lifi config set --api-key sk-lifi-... --chain base --wallet main`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="show" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi config show
        </h2>
        <p className="text-sm text-text-secondary">
          Print the current config. API keys are truncated for safety.
        </p>
        <div className="code-block">
          <code>lifi config show</code>
        </div>
      </section>
    </article>
  );
}
