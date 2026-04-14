export default function ManifoldPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Manifold</h1>
        <p className="text-text-secondary leading-relaxed">
          Browse open Manifold prediction markets. Manifold is a play-money
          prediction market platform with a broad range of topics. No API key required.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Usage</h2>
        <div className="code-block">
          <code>lifi manifold [options]</code>
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
              ["--query <query>", "Search query to filter markets"],
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
          <code>{`# List open Manifold markets
lifi manifold

# Search
lifi manifold --query "AI"

# JSON output for scripting
lifi manifold --json`}</code>
        </div>
      </section>
    </article>
  );
}
