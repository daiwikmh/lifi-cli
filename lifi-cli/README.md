# lifi-cli

Bridge, swap, earn yield, and browse prediction markets — from the terminal.

Built for developers and AI agents using the [LI.FI](https://li.fi) Composer API.

```
npm install -g lifi-cli
lifi --help
```

---

## What it does

- **Bridge** — move tokens across any chain via LI.FI routing
- **Swap** — swap tokens on a single chain
- **Earn** — deposit into yield protocols (Morpho, Aave, Lido, EtherFi, Ethena, Pendle, and more) via the LI.FI Composer API
- **Markets** — browse live Polymarket prediction markets
- **Agent** — chat with an AI agent that has all of the above as tools (powered by OpenRouter)
- **MCP server** — expose everything as tools for Claude Code, Cursor, or any MCP-compatible AI assistant

---

## Installation

```bash
npm install -g lifi-cli
```

Or run without installing:

```bash
npx lifi-cli --help
```

---

## Setup

```bash
# Set your LI.FI API key (get one at the LI.FI Partner Portal)
lifi config set --api-key YOUR_LIFI_KEY

# Set OpenRouter key for the agent (get one at openrouter.ai)
lifi config set --openrouter-key YOUR_OPENROUTER_KEY

# Set default chain
lifi config set --chain base
```

All config values can also be set via environment variables:

```bash
LIFI_API_KEY=...
OPENROUTER_API_KEY=...
DEFAULT_CHAIN=base
```

---

## Commands

### Wallet

```bash
lifi wallet create --name my-wallet        # create new wallet (key stored in OS keychain)
lifi wallet import --name my-wallet --key 0x...   # import from private key
lifi wallet list                           # list all local wallets
```

### Bridge

```bash
# Get a quote
lifi bridge \
  --from USDC \
  --to USDC \
  --from-chain ethereum \
  --to-chain base \
  --amount 1000000 \
  --wallet my-wallet

# Get quote as JSON
lifi bridge ... --json

# Execute the transaction
lifi bridge ... --execute
```

### Swap

```bash
# Quote a swap on Base
lifi swap \
  --from USDC \
  --to ETH \
  --chain base \
  --amount 1000000 \
  --wallet my-wallet

# Execute
lifi swap ... --execute
```

### Earn

```bash
# List all supported protocols
lifi earn protocols
lifi earn protocols --category vault
lifi earn protocols --json

# Get a deposit quote (Morpho USDC vault on Base)
lifi earn quote \
  --protocol morpho-usdc \
  --token USDC \
  --amount 1000000 \
  --chain base \
  --wallet my-wallet

# Execute the deposit
lifi earn quote \
  --protocol morpho-usdc \
  --token USDC \
  --amount 1000000 \
  --chain base \
  --wallet my-wallet \
  --execute
```

Supported protocols:

| Symbol | Protocol | Chain | Type |
|---|---|---|---|
| `morpho-usdc` | Morpho USDC | Base | vault |
| `morpho-weth` | Morpho WETH | Base | vault |
| `aave-usdc-base` | Aave V3 USDC | Base | lending |
| `aave-usdc-eth` | Aave V3 USDC | Ethereum | lending |
| `aave-weth-eth` | Aave V3 WETH | Ethereum | lending |
| `lido-wsteth` | Lido wstETH | Ethereum | staking |
| `etherfi-eeth` | EtherFi eETH | Ethereum | staking |
| `etherfi-weeth` | EtherFi weETH | Ethereum | staking |
| `pendle-usdc` | Pendle PT-USDC | Ethereum | yield |
| `ethena-usde` | Ethena USDe | Ethereum | yield |
| `ethena-susde` | Ethena sUSDe | Ethereum | yield |
| `seamless-usdc` | Seamless USDC | Base | lending |
| `euler-usdc` | Euler USDC | Ethereum | lending |
| `kinetiq-khype` | Kinetiq kHYPE | Hyperliquid | staking |

### Markets

```bash
# List active Polymarket markets
lifi markets list
lifi markets list --query "bitcoin"
lifi markets list --limit 50 --json

# Get a specific market
lifi markets get will-btc-hit-100k-before-2025
```

### Status

```bash
lifi status 0xabc123...
lifi status 0xabc123... --from-chain 1 --to-chain 8453
```

### Agent

```bash
# Start an interactive AI agent with all LI.FI tools
lifi agent

# Use a specific OpenRouter model
lifi agent --model openrouter/mistral-7b-instruct
lifi agent --model anthropic/claude-3.5-sonnet
lifi agent --model google/gemini-flash-1.5
```

The agent can answer questions, look up markets, and prepare quotes. Example session:

```
you> what's the current yes price on the bitcoin etf approval market?
agent> [fetches market] The current yes price is 78.3%, meaning the market gives ~78%
       probability to BTC ETF approval. Volume is $12.4M.

you> get me an earn quote for 100 USDC into morpho on base
agent> [calls lifi_earn_quote] Here's the quote: depositing 100 USDC into Morpho USDC
       vault on Base...
```

### MCP Server

```bash
lifi mcp    # starts MCP server over stdio
```

Add to your Claude Code config (`~/.claude/settings.json`):

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

Available MCP tools:

| Tool | Description |
|---|---|
| `lifi_bridge_quote` | Quote a cross-chain bridge |
| `lifi_swap_quote` | Quote a same-chain swap |
| `lifi_earn_quote` | Quote a yield deposit via Composer |
| `lifi_earn_protocols` | List supported protocols |
| `lifi_markets_list` | List Polymarket markets |
| `lifi_markets_get` | Get a specific market |
| `lifi_tx_status` | Check tx status |

### Config

```bash
lifi config set --api-key KEY
lifi config set --openrouter-key KEY
lifi config set --chain base
lifi config show
```

---

## Use as a library

```bash
npm install lifi-cli
```

```ts
import { getBridgeQuote, getEarnQuote, getMarkets } from 'lifi-cli'

// Get a bridge quote
const quote = await getBridgeQuote({
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: 'USDC',
  toToken: 'USDC',
  amount: '1000000',
  fromAddress: '0xYourAddress',
})

// Get an earn (Composer) quote
const earnQuote = await getEarnQuote({
  protocol: 'morpho-usdc',
  token: 'USDC',
  amount: '1000000',
  chain: 'base',
  fromAddress: '0xYourAddress',
})

// List Polymarket markets
const markets = await getMarkets('bitcoin', 10)
```

Sub-path imports:

```ts
import { getBridgeQuote } from 'lifi-cli/bridge'
import { getEarnQuote, listProtocols } from 'lifi-cli/earn'
import { getMarkets } from 'lifi-cli/markets'
import { runAgent } from 'lifi-cli/agent'
import { startMcpServer } from 'lifi-cli/mcp'
```

---

## How it works

The earn commands use the **LI.FI Composer API** — the same `/v1/quote` endpoint as bridge and swap. Setting `toToken` to a supported vault or staking token address automatically triggers Composer routing, which bundles any required swaps and the deposit into a single transaction.

```
lifi earn quote --protocol morpho-usdc --token ETH --chain ethereum
```

This flow: ETH on Ethereum → swap to USDC → bridge to Base → deposit into Morpho vault. One quote. One transaction.

---

## Global flags

All commands support:

| Flag | Description |
|---|---|
| `--json` | Output raw JSON instead of formatted tables |
| `--help` | Show command help |

---

## Development

```bash
git clone https://github.com/yourname/lifi-cli
cd lifi-cli
npm install
npm run dev       # watch mode
npm run build     # production build
npm test          # run tests
npm run typecheck # type check only
```

---

## License

MIT
