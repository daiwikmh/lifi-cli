export default function StatusPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight gradient-text">Status</h1>
        <p className="text-text-secondary leading-relaxed">
          Track the status of a cross-chain transaction submitted via{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">lifi bridge</code> or{" "}
          <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded text-text-primary">lifi earn</code>.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">Usage</h2>
        <div className="code-block">
          <code>lifi status {"<txHash>"} [options]</code>
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
              ["<txHash>", "Transaction hash from lifi bridge or lifi earn"],
              ["--from-chain <chain>", "Source chain ID (optional, improves lookup accuracy)"],
              ["--to-chain <chain>", "Destination chain ID (optional)"],
              ["--json", "Output as JSON"],
            ].map(([arg, desc]) => (
              <tr key={arg as string}>
                <td>{arg}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="code-block">
          <code>{`lifi status 0xabc123...

# With chain context for faster lookup
lifi status 0xabc123... --from-chain 8453 --to-chain 42161`}</code>
        </div>
      </section>
    </article>
  );
}
