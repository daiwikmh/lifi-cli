export default function ResetPage() {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl text-red-400">{"✕"}</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Reset</h1>
        </div>
        <p className="text-text-secondary leading-relaxed">
          Remove all lifi-cli configuration and saved data from your machine.
          Useful for a clean reinstall or switching accounts.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 id="usage" className="text-xl font-semibold text-neon-cyan glow-cyan">
          Usage
        </h2>
        <div className="code-block">
          <code>lifi reset [options]</code>
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
              ["--wallets", "Also delete all saved wallets (private keys — unrecoverable)"],
              ["--yes", "Skip confirmation prompt (for scripting)"],
            ].map(([flag, desc]) => (
              <tr key={flag as string}>
                <td>{flag}</td>
                <td className="!text-text-secondary">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          What gets deleted
        </h2>
        <table className="param-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Path</th>
              <th>Flag required</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Config file", "~/.lifi/config.json", "none (default)"],
              ["Saved wallets", "~/.lifi/wallets/", "--wallets"],
            ].map(([res, path, flag]) => (
              <tr key={res as string}>
                <td>{res}</td>
                <td className="!text-text-secondary font-mono text-xs">{path}</td>
                <td className="!text-text-muted">{flag}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-text-muted">
          Config holds API keys, default chain, default wallet, and agent provider settings.
          Wallets hold private keys — deleting them is permanent with no recovery path.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-neon-cyan glow-cyan">
          Examples
        </h2>
        <div className="code-block">
          <code>{`# Clear config only (interactive confirmation)
lifi reset

# Clear config and wallets
lifi reset --wallets

# Non-interactive (CI / scripting)
lifi reset --yes`}</code>
        </div>
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-400 font-mono">
          {"--wallets"} requires typing <strong>yes</strong> (not just y) to confirm. Private keys cannot be recovered.
        </div>
      </section>
    </article>
  )
}
