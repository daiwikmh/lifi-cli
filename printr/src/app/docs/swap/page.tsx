export default function SwapPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-green glow-green">{"⇄"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Swap</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Swap tokens on a single chain via the LI.FI aggregator. Routes
          across DEXes to find the best rate. Approvals are handled automatically.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>lifi swap [options]</code>
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
              ["--from <token>", "Token to swap from (symbol or address)", true],
              ["--to <token>", "Token to swap to (symbol or address)", true],
              ["--amount <amount>", "Amount in token units (e.g. 0.01 for 0.01 ETH)", true],
              ["--wallet <name>", "Wallet name from lifi wallet list", true],
              ["--chain <chain>", "Chain to swap on (default: from lifi config)", false],
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
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Examples
        </h2>
        <p className="text-sm text-text-secondary">Preview a swap quote:</p>
        <div className="code-block">
          <code>{`lifi swap --from ETH --to USDC --amount 0.01 --wallet main --chain base`}</code>
        </div>
        <p className="text-sm text-text-secondary">Execute the swap:</p>
        <div className="code-block">
          <code>{`lifi swap --from ETH --to USDC --amount 0.01 --wallet main --chain base --execute`}</code>
        </div>
        <p className="text-sm text-text-secondary">Swap on Arbitrum with custom slippage:</p>
        <div className="code-block">
          <code>{`lifi swap --from USDC --to ARB \\
  --amount 50 --wallet main \\
  --chain arbitrum --slippage 0.01 --execute`}</code>
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
              ["Chain", "Chain the swap executes on"],
              ["From", "Amount and token sent"],
              ["To", "Amount and token received"],
              ["Min received", "Minimum output after slippage"],
              ["Via", "DEX protocol used (e.g. Uniswap, Odos)"],
              ["Gas cost", "Estimated gas in USD"],
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
