export default function MarketsPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-yellow">{"◈"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Markets</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Browse active Polymarket prediction markets from the terminal. List
          markets with live prices and volume, or look up a specific market by slug.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="list" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi markets list
        </h2>
        <p className="text-sm text-text-secondary">List active Polymarket prediction markets.</p>
        <div className="code-block">
          <code>lifi markets list [options]</code>
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
              ["--query <query>", "Filter markets by keyword"],
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
          <code>{`# Browse all active markets
lifi markets list

# Search for Bitcoin markets
lifi markets list --query bitcoin

# Get top 5 markets as JSON
lifi markets list --limit 5 --json`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="get" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi markets get
        </h2>
        <p className="text-sm text-text-secondary">
          Get detailed information about a specific market by its Polymarket slug.
        </p>
        <div className="code-block">
          <code>lifi markets get {"<slug>"} [options]</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Argument / Flag</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["<slug>", "Polymarket market slug (from the URL)"],
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
          <code>{`lifi markets get will-bitcoin-hit-100k-in-2025`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Output fields
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Question", "Market question"],
              ["Yes %", "Current implied probability for Yes"],
              ["No %", "Current implied probability for No"],
              ["Volume", "Total trading volume in USD"],
              ["Liquidity", "Current liquidity in USD"],
              ["Ends", "Market resolution date"],
            ].map(([field, desc]) => (
              <tr key={field as string}>
                <td>{field}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}
