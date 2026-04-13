# lifi-cli Architecture

## Overview

`lifi-cli` is a TypeScript package that ships two surfaces from a single codebase:

1. **CLI binary** — `lifi <command>` for terminal use
2. **Importable library** — `import { getBridgeQuote } from 'lifi-cli'` for programmatic use

It also exposes an **MCP server** (`lifi mcp`) for AI assistant integrations (Claude Code, Cursor, etc.).

---

## Layer Diagram

```
 User / AI Agent
       |
  ┌────┴────────────────────────────────┐
  │  CLI (bin/lifi.js → src/cli.ts)     │  ← terminal entrypoint
  │  MCP Server (src/mcp/server.ts)     │  ← AI assistant entrypoint
  └────┬────────────────────────────────┘
       |
  ┌────┴────────────────────────────────┐
  │  commands/          mcp/tools/      │  ← thin adapters (parse args / format output)
  │  *.command.ts       *.tool.ts       │    no business logic here
  └────┬────────────────────────────────┘
       |
  ┌────┴────────────────────────────────┐
  │  core/                              │  ← business logic, importable library surface
  │  bridge / swap / earn / markets /   │    zero CLI or display dependencies
  │  agent / wallet                     │
  └────┬────────────────────────────────┘
       |
  ┌────┴────────────────────────────────┐
  │  api/                               │  ← raw HTTP clients, one function per endpoint
  │  lifi / polymarket / openrouter     │    no business logic
  └────┬────────────────────────────────┘
       |
  External APIs: LI.FI, Polymarket Gamma, OpenRouter
```

---

## Directory Structure

```
lifi-cli/
│
├── bin/
│   └── lifi.js                          # binary entrypoint — dynamic import of dist/cli.mjs
│
├── src/
│   ├── cli.ts                           # root Commander program, registers all commands
│   ├── index.ts                         # public library re-exports
│   │
│   ├── commands/                        # CLI layer — parse args, call core, render display
│   │   ├── bridge.command.ts            # lifi bridge
│   │   ├── swap.command.ts              # lifi swap
│   │   ├── earn.command.ts              # lifi earn [quote|protocols]
│   │   ├── markets.command.ts           # lifi markets [list|get]
│   │   ├── status.command.ts            # lifi status <txHash>
│   │   ├── wallet.command.ts            # lifi wallet [create|import|list]
│   │   ├── agent.command.ts             # lifi agent
│   │   ├── config.command.ts            # lifi config [set|show]
│   │   ├── mcp.command.ts               # lifi mcp
│   │   └── index.ts
│   │
│   ├── core/                            # importable library (Option B public API)
│   │   ├── bridge/
│   │   │   ├── bridge.ts                # getBridgeQuote()
│   │   │   ├── bridge.types.ts          # BridgeParams, BridgeQuote, BridgeResult
│   │   │   └── index.ts
│   │   ├── swap/
│   │   │   ├── swap.ts                  # getSwapQuote()
│   │   │   ├── swap.types.ts            # SwapParams, SwapQuote, SwapResult
│   │   │   └── index.ts
│   │   ├── earn/
│   │   │   ├── earn.ts                  # getEarnQuote()
│   │   │   ├── protocols.ts             # PROTOCOLS registry, listProtocols(), getProtocolBySymbol()
│   │   │   ├── earn.types.ts            # EarnParams, EarnQuote, Protocol, PortfolioPosition
│   │   │   └── index.ts
│   │   ├── markets/
│   │   │   ├── markets.types.ts         # Market, MarketOrder, Position
│   │   │   ├── polymarket/
│   │   │   │   ├── polymarket.ts        # getMarkets(), getMarketBySlug()
│   │   │   │   ├── polymarket.types.ts  # PolymarketPosition
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── agent/
│   │   │   ├── agent.ts                 # runAgent() — OpenRouter REPL with tool loop
│   │   │   ├── tools.ts                 # AGENT_TOOLS — LLM tool definitions for all core ops
│   │   │   ├── agent.types.ts           # AgentConfig, AgentTool, AgentMessage
│   │   │   └── index.ts
│   │   ├── wallet/
│   │   │   ├── wallet.ts                # createWallet(), importWallet(), listWallets()
│   │   │   ├── keychain.ts              # OS keychain via keytar
│   │   │   ├── wallet.types.ts          # Wallet, WalletStore
│   │   │   └── index.ts
│   │   └── index.ts                     # re-exports all core modules
│   │
│   ├── api/                             # raw HTTP clients — no business logic
│   │   ├── lifi/
│   │   │   ├── client.ts                # axios instance — base URL + API key header
│   │   │   ├── endpoints.ts             # getQuote(), getStatus(), getTokens(), getChains()
│   │   │   └── index.ts
│   │   ├── polymarket/
│   │   │   ├── client.ts                # Gamma API + CLOB API clients
│   │   │   ├── endpoints.ts             # searchEvents(), getEvent(), getMarket()
│   │   │   └── index.ts
│   │   └── openrouter/
│   │       ├── client.ts                # openai-compatible client at openrouter.ai
│   │       └── index.ts
│   │
│   ├── mcp/
│   │   ├── server.ts                    # MCP Server — registers tools, handles stdio transport
│   │   └── tools/
│   │       ├── bridge.tool.ts           # MCP tool: lifi_bridge_quote
│   │       ├── earn.tool.ts             # MCP tools: lifi_earn_quote, lifi_earn_protocols
│   │       ├── markets.tool.ts          # MCP tools: lifi_markets_list, lifi_markets_get
│   │       ├── status.tool.ts           # MCP tool: lifi_tx_status
│   │       └── index.ts                 # McpToolDef interface + re-exports
│   │
│   ├── config/
│   │   ├── config.ts                    # loadConfig(), saveConfig(), getConfigValue(), resolveChain()
│   │   ├── defaults.ts                  # LIFI_API_BASE, CHAIN_IDS, CONFIG_FILE paths
│   │   └── index.ts
│   │
│   ├── display/                         # terminal output — never imported by core/
│   │   ├── format.ts                    # formatAmount(), formatAddress(), formatAPY(), formatUSD(), formatChain()
│   │   ├── spinner.ts                   # withSpinner()
│   │   ├── table.ts                     # makeTable()
│   │   └── index.ts
│   │
│   └── types/
│       └── index.ts                     # ChainId, Address, TxHash, Token, Chain, TransactionRequest
│
├── tests/
│   ├── core/
│   └── api/
│
├── examples/
│
├── bin/lifi.js
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## Key Architectural Rules

**1. commands/ and mcp/tools/ are thin adapters**
They parse input and format output. No business logic. Both call the same `core/` functions.

**2. core/ has zero CLI or display dependencies**
It can be imported in any Node/Bun/Deno app without pulling in `commander`, `chalk`, or `ora`.

**3. api/ has zero business logic**
One function per endpoint. Types match the raw API response. Transformations happen in `core/`.

**4. display/ is never imported by core/**
Keeps the library clean. CLI and MCP format their own output independently.

**5. config/ is shared by both surfaces**
Library users can set config programmatically. CLI users use `lifi config set`.

---

## Data Flow — Bridge Quote

```
lifi bridge --from ETH --to USDC --from-chain ethereum --to-chain base --amount 1e18 --wallet 0x...
      |
      v
commands/bridge.command.ts        parse opts, call withSpinner()
      |
      v
core/bridge/bridge.ts             getBridgeQuote() — resolves chain IDs, validates params
      |
      v
api/lifi/endpoints.ts             getQuote() — GET /v1/quote
      |
      v
LI.FI API (li.quest)
      |
      v
core/bridge/bridge.ts             maps QuoteResponse → BridgeQuote
      |
      v
commands/bridge.command.ts        makeTable() → terminal output
```

---

## Data Flow — LI.FI Composer (Earn)

The Composer API is the same `/v1/quote` endpoint. Setting `toToken` to a vault token address
(e.g. Morpho USDC vault on Base) automatically triggers Composer routing. No extra parameters.

```
lifi earn quote --protocol morpho-usdc --token USDC --amount 1000000 --chain base --wallet 0x...
      |
      v
core/earn/earn.ts                 looks up protocol in PROTOCOLS registry
      |                           resolves vaultToken address
      v
api/lifi/endpoints.ts             getQuote(fromToken=USDC, toToken=morphoVaultAddress)
      |
      v
LI.FI Composer route detected, returns batched tx
      |
      v
commands/earn.command.ts          renders quote table
```

---

## MCP Tool Names

| Tool | Description |
|---|---|
| `lifi_bridge_quote` | Bridge tokens across chains |
| `lifi_earn_quote` | Deposit into a yield protocol via Composer |
| `lifi_earn_protocols` | List all supported protocols |
| `lifi_markets_list` | List active Polymarket markets |
| `lifi_markets_get` | Get a specific market by slug |
| `lifi_tx_status` | Check cross-chain tx status |

Install in Claude Code:
```json
{
  "mcpServers": {
    "lifi": {
      "command": "npx",
      "args": ["lifi-cli", "mcp"]
    }
  }
}
```

---

## External APIs Used

| API | Base URL | Auth | Used For |
|---|---|---|---|
| LI.FI | `https://li.quest/v1` | Optional API key header | Bridge, swap, earn quotes, tx status |
| Polymarket Gamma | `https://gamma-api.polymarket.com` | None | Market listing and search |
| Polymarket CLOB | `https://clob.polymarket.com` | API key | Order placement (future) |
| OpenRouter | `https://openrouter.ai/api/v1` | API key | Agent LLM calls |

---

## Package Exports

```json
{
  ".":         "dist/index.js",        // full library
  "./bridge":  "dist/core/bridge/",   // import { getBridgeQuote } from 'lifi-cli/bridge'
  "./swap":    "dist/core/swap/",
  "./earn":    "dist/core/earn/",
  "./markets": "dist/core/markets/",
  "./agent":   "dist/core/agent/",
  "./mcp":     "dist/mcp/server.js"   // import { startMcpServer } from 'lifi-cli/mcp'
}
```

---

## Next Steps

### P0 — Required for submission (Apr 14)

- [ ] **Transaction execution** — `lifi bridge --execute` and `lifi earn quote --execute`
  Wire up `viem` wallet client to sign and broadcast the `transactionRequest` from the quote.
  Requires `lifi wallet` to be set as the signer.

- [ ] **`lifi swap` MCP tool** — `src/mcp/tools/swap.tool.ts` is missing. Pattern is identical to `bridge.tool.ts`.

- [ ] **More protocols in `protocols.ts`** — Only 5 protocols listed. Pull Euler, HyperLend, Maple,
  Seamless, Felix, Neverland, Kinetiq, Ethena, USDai from Composer docs and add vault token addresses.

- [ ] **`--json` flag on all commands** — Verify every command respects `--json` for piping output.
  `earn protocols` and `markets list` are missing it today.

- [ ] **npm publish** — `npm publish --access public`. Register `lifi-cli` on npm before someone else does.

- [ ] **README.md** — Installation, quickstart, all commands with examples, MCP setup snippet.

### P1 — Strengthens the submission

- [ ] **ERC-20 approval flow** — Before executing a deposit or bridge, check allowance and send an
  approval tx if needed. `approvalAddress` is already in the quote response.

- [ ] **`lifi earn portfolio --wallet <address>`** — Query on-chain vault token balances for known
  protocol addresses. Use `viem` `readContract` with ERC-20 `balanceOf`.

- [ ] **`lifi markets buy`** — Full Polymarket order placement via CLOB API. Requires CLOB auth
  (L1/L2 key setup). The killer demo feature — fund from any chain via LI.FI, bet on Polymarket.

- [ ] **`lifi status --watch`** — Poll `/v1/status` on an interval and exit when `DONE` or `FAILED`.

- [ ] **Config validation on startup** — Warn users if no API key is set for commands that need one.

### P2 — Post-hackathon

- [ ] **More market integrations** — Kalshi, Manifold, or any prediction market with a public API.

- [ ] **`lifi agent --tool bridge --tool earn`** — Let users scope which tools the agent can use.

- [ ] **Streaming agent output** — Use OpenRouter streaming to show agent thinking in real time.

- [ ] **`lifi watch --wallet <address>`** — Stream wallet activity (incoming txs, position changes).

- [ ] **Plugin system** — Let third parties register new `core/` modules and expose them as CLI
  commands and MCP tools automatically.

- [ ] **Full test suite** — `tests/core/` and `tests/api/` are empty. Add vitest unit tests with
  mocked API responses for all core functions.
