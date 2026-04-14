export default function EarnPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-magenta glow-magenta">{"↑"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Earn</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Deposit tokens into yield protocols via the LI.FI Composer. Supports
          Morpho, Aave, Lido, and Compound. Get a quote before committing.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="quote" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi earn quote
        </h2>
        <p className="text-sm text-text-secondary">
          Get a quote to deposit into a yield protocol, and optionally execute.
        </p>
        <div className="code-block">
          <code>lifi earn quote [options]</code>
        </div>
        <table className="param-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Description</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["--protocol <protocol>", "Protocol symbol (e.g. morpho-usdc, aave-usdc, lido-wsteth)", true],
              ["--token <token>", "Token to deposit (symbol or address)", true],
              ["--amount <amount>", "Amount in smallest unit (e.g. 1000000 for 1 USDC)", true],
              ["--wallet <name>", "Wallet name from lifi wallet list", true],
              ["--chain <chain>", "Chain name or ID (default: from lifi config)", false],
              ["--execute", "Sign and submit the deposit", false],
              ["--json", "Output as JSON", false],
            ].map(([flag, desc, req]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
                <td>
                  {req ? (
                    <span className="tag tag-required">required</span>
                  ) : (
                    <span className="tag tag-optional">optional</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-text-secondary">Example:</p>
        <div className="code-block">
          <code>{`# Preview deposit quote
lifi earn quote \\
  --protocol morpho-usdc --token USDC \\
  --amount 100000000 --wallet main

# Execute deposit (amount in smallest unit: 100 USDC = 100000000)
lifi earn quote \\
  --protocol morpho-usdc --token USDC \\
  --amount 100000000 --wallet main --execute`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="protocols" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi earn protocols
        </h2>
        <p className="text-sm text-text-secondary">
          List all yield protocols supported by LI.FI Composer.
        </p>
        <div className="code-block">
          <code>lifi earn protocols [options]</code>
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
              ["--category <category>", "Filter by type: vault, lending, staking, yield"],
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
          <code>{`# List all protocols
lifi earn protocols

# Filter by category
lifi earn protocols --category lending`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Supported protocols
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["morpho-usdc", "Morpho USDC Vault", "vault"],
              ["aave-usdc", "Aave USDC Market", "lending"],
              ["lido-wsteth", "Lido wstETH", "staking"],
              ["compound-usdc", "Compound USDC", "lending"],
            ].map(([sym, name, cat]) => (
              <tr key={sym as string}>
                <td>{sym}</td>
                <td className="!text-text-secondary">{name}</td>
                <td className="!text-text-muted">{cat}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-text-muted">
          Run <code className="text-xs bg-bg-secondary px-1.5 py-0.5 rounded">lifi earn protocols --json</code> for the full list.
        </p>
      </section>
    </article>
  );
}
