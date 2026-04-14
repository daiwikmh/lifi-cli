export default function KalshiPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Kalshi</h1>
        <p className="text-text-secondary leading-relaxed">
          Browse open Kalshi prediction markets. Kalshi is a regulated prediction
          market platform. Requires a Kalshi API key to use.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Setup</h2>
        <div className="code-block">
          <code>lifi config set --kalshi-key {"<KALSHI_KEY>"}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Usage</h2>
        <div className="code-block">
          <code>lifi kalshi [options]</code>
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
              ["--query <query>", "Keyword filter for market titles"],
              ["--limit <limit>", "Max results (default: 20)"],
              ["--json", "Output as JSON"],
            ].map(([flag, desc]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-block">
          <code>{`# List open Kalshi markets
lifi kalshi

# Search by keyword
lifi kalshi --query "fed rate"

# Output as JSON
lifi kalshi --json`}</code>
        </div>
      </section>
    </article>
  );
}
