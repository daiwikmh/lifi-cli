# lifi-cli

A terminal-native DeFi client. Bridge, swap, earn yield, and browse prediction markets — all from the command line. Built for humans and AI agents.

```
npm install -g lifi-cli
```

---

## Features

| Command | What it does |
|---------|-------------|
| `lifi bridge` | Cross-chain token bridge with quote preview and execution |
| `lifi swap` | Single-chain token swap via LI.FI aggregator |
| `lifi earn` | Deposit into yield protocols (Morpho, Aave, Lido, etc.) |
| `lifi markets` | Browse Polymarket prediction markets |
| `lifi kalshi` | Browse Kalshi prediction markets |
| `lifi manifold` | Browse Manifold prediction markets |
| `lifi agent` | Interactive AI agent with all tools wired in (OpenRouter) |
| `lifi wallet` | Create, import, and list wallets (keys in OS keychain) |
| `lifi config` | Set API keys, default chain, default wallet |
| `lifi status` | Track cross-chain transaction status |
| `lifi mcp` | Start an MCP server for agent frameworks |

---

## Architecture

```
lifi-cli
├── bin/
│   └── lifi.js                  entry point
│
├── src/
│   ├── cli.ts                   commander root, registers all commands
│   │
│   ├── commands/                thin CLI layer (parse args, call core, render)
│   │   ├── bridge.command.ts
│   │   ├── swap.command.ts
│   │   ├── earn.command.ts
│   │   ├── markets.command.ts
│   │   ├── kalshi.command.ts
│   │   ├── manifold.command.ts
│   │   ├── polymarket.command.ts
│   │   ├── agent.command.ts
│   │   ├── wallet.command.ts
│   │   ├── config.command.ts
│   │   ├── status.command.ts
│   │   └── mcp.command.ts
│   │
│   ├── core/                    business logic, no CLI coupling
│   │   ├── bridge/              get quote, build tx
│   │   ├── swap/                get quote, build tx
│   │   ├── earn/                protocols registry, quote, deposit
│   │   ├── markets/polymarket/  market list and lookup
│   │   ├── kalshi/              market list
│   │   ├── manifold/            market list
│   │   ├── agent/               LLM loop + tool dispatch (OpenRouter)
│   │   └── wallet/              create/import, keychain storage, tx executor
│   │
│   ├── api/                     raw API clients (no business logic)
│   │   ├── lifi/                LI.FI REST client
│   │   ├── polymarket/          Polymarket CLOB client
│   │   ├── kalshi/              Kalshi REST client
│   │   ├── manifold/            Manifold REST client
│   │   └── openrouter/          OpenRouter chat completions client
│   │
│   ├── mcp/                     MCP server for agent frameworks
│   │   ├── server.ts            stdio transport, tool registration
│   │   └── tools/               bridge, swap, earn, markets, status tools
│   │
│   ├── config/                  load/save config, chain resolution
│   └── display/                 table, spinner, formatters
```

### Data flow

```
User / Agent
     |
     v
  commands/          (parse, validate, render)
     |
     v
   core/             (business logic, orchestration)
     |
  +--+--+
  |     |
  v     v
api/  wallet/        (network calls, keychain, tx signing)
  |
  v
External APIs
  LI.FI · Polymarket · Kalshi · Manifold · OpenRouter
```

### MCP mode

```
Agent framework (Claude, Cursor, etc.)
        |   stdio
        v
   mcp/server.ts
        |
        v
   mcp/tools/*      (same core/ functions, MCP-shaped I/O)
```

---

## Setup

```bash
# set your keys
lifi config set --api-key <LIFI_KEY>
lifi config set --openrouter-key <OPENROUTER_KEY>
lifi config set --kalshi-key <KALSHI_KEY>

# create a wallet
lifi wallet create --name main

# set defaults
lifi config set --chain base --wallet main
```

---

## Usage examples

```bash
# bridge 100 USDC from Base to Arbitrum
lifi bridge --from USDC --to USDC --from-chain base --to-chain arbitrum --amount 100 --wallet main

# execute the swap
lifi bridge --from USDC --to USDC --from-chain base --to-chain arbitrum --amount 100 --wallet main --execute

# swap ETH to USDC on Base
lifi swap --from ETH --to USDC --amount 0.01 --wallet main --chain base

# deposit 100 USDC into Morpho
lifi earn quote --protocol morpho-usdc --token USDC --amount 100000000 --wallet main

# browse prediction markets
lifi markets list --query "bitcoin"
lifi kalshi
lifi manifold

# run the AI agent
lifi agent

# start MCP server (add to claude_desktop_config.json or cursor settings)
lifi mcp
```

---

## MCP tools

When running `lifi mcp`, the following tools are exposed:

- `bridge_tokens` — cross-chain bridge quote
- `swap_tokens` — single-chain swap quote
- `earn_quote` — yield deposit quote
- `earn_protocols` — list supported yield protocols
- `list_markets` — Polymarket market list
- `get_market` — Polymarket market detail
- `get_tx_status` — transaction status tracker

---

## Tech

- **LI.FI API** — bridge and swap routing across 30+ chains
- **LI.FI Composer** — yield protocol abstraction (Morpho, Aave, Lido, Compound)
- **Polymarket / Kalshi / Manifold** — prediction market data
- **OpenRouter** — LLM provider for the agent (default: Claude 3.5 Sonnet)
- **viem** — EVM transaction signing
- **keytar** — OS keychain for private key storage
- **MCP SDK** — model context protocol server for agent frameworks

---

## License

MIT
