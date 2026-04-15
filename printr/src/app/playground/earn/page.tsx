"use client"

import { useState } from "react"

type Tab = "quote" | "vaults" | "protocols"

const CHAINS = ["base", "ethereum", "arbitrum", "optimism", "polygon", "bsc", "avalanche"]

const SIDEBAR_TOOLS = [
  {
    group: "Earn",
    items: [
      { label: "earn quote",     active: true,  tab: "quote" as Tab,      cmd: "lifi earn quote --protocol morpho --token USDC --amount 100 --wallet main" },
      { label: "earn vaults",    active: true,  tab: "vaults" as Tab,     cmd: "lifi earn vaults --chain base --token USDC" },
      { label: "earn protocols", active: true,  tab: "protocols" as Tab,  cmd: "lifi earn protocols" },
      { label: "earn portfolio", active: false, tab: null,                cmd: "lifi earn portfolio <address>" },
    ],
  },
  {
    group: "Bridge & Swap",
    items: [
      { label: "bridge",  active: false, tab: null, cmd: "lifi bridge --from USDC --to USDC --from-chain base --to-chain arbitrum --amount 100 --wallet main" },
      { label: "swap",    active: false, tab: null, cmd: "lifi swap --from USDC --to ETH --chain base --amount 100 --wallet main" },
      { label: "dryrun",  active: false, tab: null, cmd: "lifi dryrun --type bridge --from USDC --to USDC --from-chain base --to-chain arbitrum --amount 100 --wallet main" },
    ],
  },
  {
    group: "Markets",
    items: [
      { label: "polymarket", active: false, tab: null, cmd: "lifi polymarket list" },
      { label: "kalshi",     active: false, tab: null, cmd: "lifi kalshi list" },
      { label: "manifold",   active: false, tab: null, cmd: "lifi manifold list" },
    ],
  },
  {
    group: "Agent & MCP",
    items: [
      { label: "agent", active: false, tab: null, cmd: "lifi agent" },
      { label: "mcp",   active: false, tab: null, cmd: "lifi mcp" },
    ],
  },
  {
    group: "Wallet & Config",
    items: [
      { label: "wallet create", active: false, tab: null, cmd: "lifi wallet create --name main" },
      { label: "wallet list",   active: false, tab: null, cmd: "lifi wallet list" },
      { label: "config set",    active: false, tab: null, cmd: "lifi config set --api-key <key>" },
      { label: "status",        active: false, tab: null, cmd: "lifi status <txHash>" },
      { label: "reset",         active: false, tab: null, cmd: "lifi reset" },
    ],
  },
]

interface ModalTool { label: string; cmd: string }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-mono text-text-muted uppercase tracking-widest">{children}</label>
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-bg-primary border border-border-dim rounded px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan transition-colors"
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-bg-primary border border-border-dim rounded px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:border-neon-cyan transition-colors"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function RunButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2 rounded font-mono text-sm bg-neon-cyan/10 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? "running..." : "run"}
    </button>
  )
}

function ResultPanel({ result, error }: { result: unknown; error: string | null }) {
  if (!result && !error) return null
  return (
    <div className="mt-4 rounded-lg border border-border-dim bg-bg-primary overflow-auto max-h-96">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border-dim">
        <span className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-neon-green"}`} />
        <span className="text-xs font-mono text-text-muted">{error ? "error" : "result"}</span>
      </div>
      <pre className="p-4 text-xs font-mono text-text-secondary whitespace-pre-wrap break-words">
        {error ?? JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}

function CliModal({ tool, onClose }: { tool: ModalTool; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-bg-secondary border border-border-dim rounded-xl p-8 max-w-lg w-full mx-4 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-neon-cyan">{tool.label}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none">×</button>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-secondary">
            This tool is only available in the CLI. This playground covers <span className="text-neon-cyan">earn</span> tools only.
          </p>
          <p className="text-xs text-text-muted">Run it in your terminal:</p>
          <div className="bg-bg-primary border border-border-dim rounded-lg px-4 py-3 font-mono text-sm text-text-primary">
            <span className="text-neon-green select-none">$ </span>
            {tool.cmd}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <a
            href="/docs"
            className="text-xs font-mono text-text-muted hover:text-neon-cyan transition-colors"
          >
            view docs →
          </a>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-xs font-mono text-text-muted">npm install -g lifi-cli</span>
        </div>
      </div>
    </div>
  )
}

function QuoteTab() {
  const [protocol, setProtocol] = useState("morpho")
  const [token, setToken] = useState("USDC")
  const [amount, setAmount] = useState("100")
  const [chain, setChain] = useState("base")
  const [fromAddress, setFromAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true); setResult(null); setError(null)
    try {
      const decimals = token.toLowerCase() === "usdc" || token.toLowerCase() === "usdt" ? 6 : 18
      const rawAmount = String(Math.floor(parseFloat(amount) * 10 ** decimals))
      const res = await fetch("/api/earn/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol, token, amount: rawAmount, chain, fromAddress: fromAddress || undefined }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Request failed")
      else setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">Preview a yield deposit quote without executing it.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Protocol</Label>
          <Input value={protocol} onChange={setProtocol} placeholder="morpho, aave-v3, lido..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Token</Label>
          <Input value={token} onChange={setToken} placeholder="USDC, WETH, ETH..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Amount (human units)</Label>
          <Input value={amount} onChange={setAmount} placeholder="100" type="number" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Chain</Label>
          <Select value={chain} onChange={setChain} options={CHAINS} />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label>From address (optional)</Label>
          <Input value={fromAddress} onChange={setFromAddress} placeholder="0x..." />
        </div>
      </div>
      <RunButton onClick={run} loading={loading} />
      <ResultPanel result={result} error={error} />
    </div>
  )
}

function VaultsTab() {
  const [chain, setChain] = useState("")
  const [protocol, setProtocol] = useState("")
  const [token, setToken] = useState("")
  const [limit, setLimit] = useState("10")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const CHAIN_IDS: Record<string, number> = {
    ethereum: 1, arbitrum: 42161, base: 8453, optimism: 10, polygon: 137, bsc: 56, avalanche: 43114,
  }

  async function run() {
    setLoading(true); setResult(null); setError(null)
    try {
      const params = new URLSearchParams()
      if (chain) params.set("chainId", String(CHAIN_IDS[chain] ?? chain))
      if (protocol) params.set("protocol", protocol)
      if (token) params.set("underlyingToken", token)
      params.set("limit", limit || "10")
      const res = await fetch(`/api/earn/vaults?${params}`)
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Request failed")
      else setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">Browse available yield vaults. All filters are optional.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Chain (optional)</Label>
          <Select value={chain} onChange={setChain} options={["", ...CHAINS]} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Protocol (optional)</Label>
          <Input value={protocol} onChange={setProtocol} placeholder="morpho, aave-v3, lido..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Token (optional)</Label>
          <Input value={token} onChange={setToken} placeholder="USDC, WETH..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Limit</Label>
          <Input value={limit} onChange={setLimit} placeholder="10" type="number" />
        </div>
      </div>
      <RunButton onClick={run} loading={loading} />
      <ResultPanel result={result} error={error} />
    </div>
  )
}

function ProtocolsTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch("/api/earn/protocols")
      const data = await res.json()
      if (!res.ok) setError(data.error ?? "Request failed")
      else setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-secondary">Fetch all yield protocols supported by LI.FI Earn.</p>
      <RunButton onClick={run} loading={loading} />
      <ResultPanel result={result} error={error} />
    </div>
  )
}

export default function EarnPlayground() {
  const [tab, setTab] = useState<Tab>("quote")
  const [modal, setModal] = useState<ModalTool | null>(null)

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {modal && <CliModal tool={modal} onClose={() => setModal(null)} />}

      {/* sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border-dim py-6 px-3 sticky top-0 h-screen overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-4 px-2">
          All tools
        </div>
        {SIDEBAR_TOOLS.map((group) => (
          <div key={group.group} className="mb-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted/50 mb-1 px-2">
              {group.group}
            </div>
            {group.items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.active && item.tab) { setTab(item.tab) }
                  else { setModal({ label: item.label, cmd: item.cmd }) }
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono transition-colors ${
                  item.active && item.tab === tab
                    ? "bg-neon-cyan/10 text-neon-cyan"
                    : item.active
                    ? "text-text-secondary hover:text-neon-cyan hover:bg-neon-cyan/5"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {item.label}
                {!item.active && (
                  <span className="ml-1.5 text-[9px] text-text-muted/50">cli</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* main content */}
      <div className="flex-1 px-6 py-10 max-w-3xl">
        <header className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-neon-magenta glow-magenta text-xl">{"↑"}</span>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Earn Playground</h1>
          </div>
          <p className="text-sm text-text-secondary">
            Test earn tools live against the LI.FI API. No wallet required for quotes.
            Other tools are CLI-only — click any in the sidebar.
          </p>
        </header>

        <div className="flex gap-1 p-1 rounded-lg bg-bg-secondary border border-border-dim w-fit mb-6">
          {(["quote", "vaults", "protocols"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${
                tab === t
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-xl border border-border-dim bg-bg-secondary">
          {tab === "quote"     && <QuoteTab />}
          {tab === "vaults"    && <VaultsTab />}
          {tab === "protocols" && <ProtocolsTab />}
        </div>

        <div className="mt-6 text-xs font-mono text-text-muted">
          <span className="text-neon-cyan">lifi earn</span> · browser-native ·{" "}
          <a href="/docs/earn" className="hover:text-neon-cyan transition-colors">view docs</a>
        </div>
      </div>
    </div>
  )
}
