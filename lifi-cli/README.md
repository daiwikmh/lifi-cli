```
  ██╗     ██╗███████╗██╗      ██████╗██╗     ██╗
  ██║     ██║██╔════╝██║     ██╔════╝██║     ██║
  ██║     ██║█████╗  ██║     ██║     ██║     ██║
  ██║     ██║██╔══╝  ██║     ██║     ██║     ██║
  ███████╗██║██║     ███████╗╚██████╗███████╗██║
  ╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝╚══════╝╚═╝
```

# lifi-cli

Bridge, swap, earn, and bet — from the terminal. For humans and agents.

```
npx lifi-cli
```

---

## What it does

| Command | What it does |
|---|---|
| `lifi-cli bridge` | Bridge tokens across chains via LI.FI routing |
| `lifi-cli swap` | Swap tokens on a single chain |
| `lifi-cli earn` | Deposit into yield vaults via LI.FI Composer |
| `lifi-cli markets` | Browse Polymarket, Kalshi, and Manifold predictions |
| `lifi-cli agent` | AI copilot — chat in natural language to do any of the above |
| `lifi-cli wallet` | Manage encrypted local wallets |
| `lifi-cli status` | Track a cross-chain transaction |
| `lifi-cli dryrun` | Simulate a transaction without submitting |
| `lifi-cli mcp` | Run as an MCP server for Claude Code / Cursor |
| `lifi-cli telegram` | Set up Telegram notifications for transactions |
| `lifi-cli config` | Manage API keys and settings |
| `lifi-cli reset` | Wipe config and saved wallets |

---

## Install

```bash
npm install -g lifi-cli
```

Or run without installing:

```bash
npx lifi-cli
```

---

## Bridge

```bash
lifi-cli bridge \
  --from ETH --to USDC \
  --from-chain ethereum --to-chain base \
  --amount 0.01 \
  --wallet mywallet \
  --execute
```

Drop `--execute` to get a quote without submitting.

---

## Swap

```bash
lifi-cli swap \
  --from ETH --to USDC \
  --amount 0.01 \
  --wallet mywallet \
  --execute
```

---

## Earn

```bash
# List vaults
lifi-cli earn vaults --chain base

# Get a deposit quote
lifi-cli earn quote \
  --protocol morpho \
  --token USDC \
  --amount 100 \
  --wallet mywallet

# Deposit
lifi-cli earn quote \
  --protocol morpho \
  --token USDC \
  --amount 100 \
  --wallet mywallet \
  --execute
```

---

## Agent

An AI copilot with every tool wired in. Supports OpenRouter, OpenAI, and Ollama.

```bash
lifi-cli agent
```

First run launches interactive setup — pick a provider, model, and API key.

```
Providers:
  1. openrouter   (default: qwen/qwen3-next-80b-a3b-instruct:free)
  2. openai       (default: gpt-4o)
  3. ollama       (default: llama3)

provider > 1
model    > [enter for default]
api key  > ****
```

Example prompts:

```
you> get me the best yields on Base
you> bridge 50 USDC from Arbitrum to Base using mywallet
you> what are the top Polymarket markets right now?
you> simulate swapping 0.1 ETH to USDC on Base
```

Override model for a session:

```bash
lifi-cli agent --model anthropic/claude-3.5-sonnet
```

Reconfigure:

```bash
lifi-cli agent --setup
```

---

## Wallets

Wallets are encrypted and stored at `~/.lifi-cli/secrets.json` with `0600` permissions. No external keychain dependency.

```bash
# Create
lifi-cli wallet create --name mywallet

# List
lifi-cli wallet list

# Remove
lifi-cli wallet remove --name mywallet
```

---

## Dry run

Simulate any operation without submitting a transaction:

```bash
lifi-cli dryrun bridge \
  --from ETH --to USDC \
  --from-chain ethereum --to-chain base \
  --amount 0.01 \
  --address 0xYourAddress

lifi-cli dryrun swap --from ETH --to USDC --amount 0.01 --address 0x...

lifi-cli dryrun earn --protocol morpho --token USDC --amount 100 --address 0x...
```

---

## Prediction markets

```bash
lifi-cli markets              # all sources
lifi-cli polymarket           # Polymarket only
lifi-cli kalshi               # Kalshi only (API key required)
lifi-cli manifold             # Manifold only
```

---

## MCP server

Exposes lifi-cli as an MCP server for Claude Code and Cursor.

```bash
lifi-cli mcp
```

Add to your Claude Code config:

```json
{
  "mcpServers": {
    "lifi": {
      "command": "npx",
      "args": ["-y", "lifi-cli", "mcp"]
    }
  }
}
```

Available MCP tools: `get_bridge_quote`, `get_swap_quote`, `get_earn_quote`, `list_earn_vaults`, `list_earn_protocols`, `dryrun_bridge`, `dryrun_swap`, `dryrun_earn`, `get_tx_status`.

---

## Telegram notifications

Get notified after every submitted transaction.

```bash
lifi-cli telegram setup   # interactive setup — bot token + chat ID
lifi-cli telegram test    # send a test message
lifi-cli telegram status  # show current config
```

Create a bot at [t.me/BotFather](https://t.me/BotFather) and paste the token during setup. Chat ID is auto-detected.

---

## Config

```bash
# Set a LI.FI API key (higher rate limits)
lifi-cli config set --lifi-key <key>

# Set OpenRouter key for agent
lifi-cli config set --openrouter-key <key>

# Show all config
lifi-cli config show

# Wipe everything
lifi-cli reset
lifi-cli reset --wallets   # also delete saved wallets
```

Config lives at `~/.lifi/config.json`.

---

## Use as a library

```ts
import { getBridgeQuote } from 'lifi-cli/bridge'
import { getSwapQuote }   from 'lifi-cli/swap'
import { getEarnQuote, fetchVaults } from 'lifi-cli/earn'
import { getMarkets }     from 'lifi-cli/markets'
```

```ts
const quote = await getBridgeQuote({
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '10000000000000000',  // 0.01 ETH in wei
  fromAddress: '0xYourAddress',
})
```

---

## Built with

- [LI.FI API](https://li.fi) — routing for bridge and swap
- [LI.FI Composer / Earn API](https://earn.li.fi) — yield vault discovery and deposits
- [viem](https://viem.sh) — transaction signing
- [OpenRouter](https://openrouter.ai) — multi-model agent support
- [Model Context Protocol](https://modelcontextprotocol.io) — MCP server integration

---

## License

MIT
