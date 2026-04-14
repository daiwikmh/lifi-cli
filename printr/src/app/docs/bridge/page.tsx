export default function BridgePage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-cyan glow-cyan">{"→"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Bridge</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Bridge tokens across chains using the LI.FI aggregator. Quotes the
          best route and optionally submits the transaction. Token approvals are
          handled automatically.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>lifi bridge [options]</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="options" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Options
        </h2>
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
              ["--from <token>", "Token to send (symbol or address)", true],
              ["--to <token>", "Token to receive (symbol or address)", true],
              ["--from-chain <chain>", "Source chain (name or ID, e.g. base, 8453)", true],
              ["--to-chain <chain>", "Destination chain (name or ID)", true],
              ["--amount <amount>", "Amount in token units (e.g. 100 for 100 USDC)", true],
              ["--wallet <name>", "Wallet name from lifi wallet list", true],
              ["--slippage <slippage>", "Slippage tolerance (default: 0.005)", false],
              ["--execute", "Sign and submit the transaction", false],
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
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="examples" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Examples
        </h2>
        <p className="text-sm text-text-secondary">Preview a quote:</p>
        <div className="code-block">
          <code>{`lifi bridge \\
  --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main`}</code>
        </div>
        <p className="text-sm text-text-secondary">Execute the transaction:</p>
        <div className="code-block">
          <code>{`lifi bridge \\
  --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main --execute`}</code>
        </div>
        <p className="text-sm text-text-secondary">Bridge ETH from Ethereum to Base:</p>
        <div className="code-block">
          <code>{`lifi bridge \\
  --from ETH --to ETH \\
  --from-chain ethereum --to-chain base \\
  --amount 0.05 --wallet main --execute`}</code>
        </div>
        <p className="text-sm text-text-secondary">Output as JSON for scripting:</p>
        <div className="code-block">
          <code>{`lifi bridge --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main --json`}</code>
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
              ["From", "Amount and token sent, with chain"],
              ["To", "Amount and token received, with chain"],
              ["Min received", "Minimum output after slippage"],
              ["Via", "Bridge protocol selected (e.g. Stargate, Across)"],
              ["Est. duration", "Estimated time for the bridge to complete (seconds)"],
              ["Gas cost", "Estimated gas cost in USD"],
            ].map(([field, desc]) => (
              <tr key={field as string}>
                <td>{field}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Track status
        </h2>
        <p className="text-sm text-text-secondary">
          After execution, track the transaction with:
        </p>
        <div className="code-block">
          <code>lifi status {"<txHash>"}</code>
        </div>
      </section>
    </article>
  );
}
