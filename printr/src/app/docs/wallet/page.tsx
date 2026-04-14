export default function WalletPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-neon-cyan glow-cyan">{"▣"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Wallet</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Create, import, and list local EVM wallets. Private keys are stored in
          the OS keychain (macOS Keychain, Linux Secret Service, Windows Credential
          Manager) — never written to disk in plaintext.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="create" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi wallet create
        </h2>
        <p className="text-sm text-text-secondary">Generate a new EVM wallet and store the private key in the OS keychain.</p>
        <div className="code-block">
          <code>lifi wallet create --name {"<name>"} [--json]</code>
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
            <tr>
              <td>--name {"<name>"}</td>
              <td className="!text-text-secondary">Label for the wallet</td>
              <td><span className="tag tag-required">required</span></td>
            </tr>
            <tr>
              <td>--json</td>
              <td className="!text-text-secondary">Output as JSON</td>
              <td><span className="tag tag-optional">optional</span></td>
            </tr>
          </tbody>
        </table>
        <div className="code-block">
          <code>{`lifi wallet create --name main`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="import" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi wallet import
        </h2>
        <p className="text-sm text-text-secondary">Import an existing wallet from a private key.</p>
        <div className="code-block">
          <code>lifi wallet import --name {"<name>"} --key {"<0x...>"} [--json]</code>
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
              ["--name <name>", "Label for the wallet", true],
              ["--key <0x...>", "Private key (hex, 0x-prefixed)", true],
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
          <code>{`lifi wallet import --name ledger-hot --key 0xabc123...`}</code>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 id="list" className="text-xl font-semibold text-neon-cyan glow-cyan">
          lifi wallet list
        </h2>
        <p className="text-sm text-text-secondary">List all wallets stored in the keychain.</p>
        <div className="code-block">
          <code>lifi wallet list [--json]</code>
        </div>
        <div className="code-block">
          <code>{`lifi wallet list`}</code>
        </div>
      </section>
    </article>
  );
}
