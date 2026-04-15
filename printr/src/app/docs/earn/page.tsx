import Link from "next/link"

export default function EarnPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-magenta glow-magenta">{"↑"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Earn</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Deposit tokens into yield protocols via the LI.FI Composer. Browse vaults,
          get quotes, and track positions — all from the terminal.
        </p>
        <Link
          href="/playground/earn"
          className="w-fit text-xs font-mono px-3 py-1.5 rounded-full border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
        >
          Try it in the playground →
        </Link>
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
              ["--protocol <protocol>", "Protocol slug (e.g. morpho, aave-v3) or vault address (0x...)", true],
              ["--token <token>", "Token to deposit (symbol, e.g. USDC, WETH)", true],
              ["--amount <amount>", "Amount in human units (e.g. 100 for 100 USDC)", true],
              ["--wallet <name>", "Wallet name from lifi wallet list", true],
              ["--chain <chain>", "Chain name or ID (default: base)", false],
              ["--execute", "Sign and submit the deposit transaction", false],
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
        <div className="code-block">
          <code>{`# Preview a deposit quote (100 USDC into Morpho on Base)
lifi earn quote \\
  --protocol morpho --token USDC \\
  --amount 100 --wallet main

# Execute the deposit
lifi earn quote \\
  --protocol morpho --token USDC \\
  --amount 100 --wallet main --execute

# Use a vault address directly
lifi earn quote \\
  --protocol 0xd63070114470f685b75B74D60EEc7c1113d33a3d \\
  --token USDC --amount 100 --wallet main`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="vaults" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi earn vaults
        </h2>
        <p className="text-sm text-text-secondary">
          Browse available yield vaults from the LI.FI Earn API.
        </p>
        <div className="code-block">
          <code>lifi earn vaults [options]</code>
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
              ["--chain <chain>", "Filter by chain name or ID"],
              ["--protocol <protocol>", "Filter by protocol slug (e.g. morpho, aave-v3)"],
              ["--token <token>", "Filter by underlying token symbol"],
              ["--limit <n>", "Max results (default: 20)"],
              ["--cursor <cursor>", "Pagination cursor from previous response"],
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
          <code>{`# List all vaults
lifi earn vaults

# Filter by chain and token
lifi earn vaults --chain base --token USDC

# Filter by protocol
lifi earn vaults --protocol morpho --limit 5`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="protocols" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi earn protocols
        </h2>
        <p className="text-sm text-text-secondary">
          List all yield protocols supported by LI.FI Earn.
        </p>
        <div className="code-block">
          <code>lifi earn protocols [--json]</code>
        </div>
        <div className="code-block">
          <code>{`lifi earn protocols
lifi earn protocols --json`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="portfolio" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi earn portfolio
        </h2>
        <p className="text-sm text-text-secondary">
          Show all active yield positions for a wallet address.
        </p>
        <div className="code-block">
          <code>lifi earn portfolio {"<address>"} [--json]</code>
        </div>
        <div className="code-block">
          <code>{`lifi earn portfolio 0xYourAddress
lifi earn portfolio 0xYourAddress --json`}</code>
        </div>
      </section>
    </article>
  )
}
