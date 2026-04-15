```
  ██╗     ██╗███████╗██╗      ██████╗██╗     ██╗
  ██║     ██║██╔════╝██║     ██╔════╝██║     ██║
  ██║     ██║█████╗  ██║     ██║     ██║     ██║
  ██║     ██║██╔══╝  ██║     ██║     ██║     ██║
  ███████╗██║██║     ███████╗╚██████╗███████╗██║
  ╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝╚══════╝╚═╝

  bridge · swap · earn · markets · agent · mcp
```

**Terminal-native DeFi.** Bridge tokens across chains, swap, deposit into yield protocols, and browse prediction markets — all from the command line. Built for humans and AI agents using the [LI.FI Composer API](https://li.fi).

[![npm](https://img.shields.io/npm/v/lifi-cli?color=00fff5&labelColor=0a0a0f)](https://www.npmjs.com/package/lifi-cli)
[![license](https://img.shields.io/badge/license-MIT-39ff14?labelColor=0a0a0f)](./LICENSE)

---

## Install

```bash
npm install -g lifi-cli
```

```bash
npx lifi-cli --help
```

---

## Quick start

```bash
# 1. Create a wallet
lifi wallet create --name main

# 2. Set your LI.FI API key
lifi config set --api-key YOUR_LIFI_KEY

# 3. Bridge USDC from Ethereum to Base
lifi bridge \
  --from USDC --to USDC \
  --from-chain ethereum --to-chain base \
  --amount 100 --wallet main

# 4. Deposit into Morpho yield vault
lifi earn quote \
  --protocol morpho --token USDC \
  --amount 100 --chain base --wallet main

# 5. Start the AI agent
lifi agent
```

---

## Commands

<details>
<summary><strong>wallet</strong> — manage local wallets</summary>

```bash
lifi wallet create --name main          # new wallet (key in OS keychain)
lifi wallet import --name main --key 0x...  # import from private key
lifi wallet list                        # list all wallets
```

</details>

<details>
<summary><strong>bridge</strong> — cross-chain token transfers</summary>

```bash
lifi bridge \
  --from USDC --to USDC \
  --from-chain ethereum --to-chain base \
  --amount 100 --wallet main

lifi bridge ... --execute   # sign and submit
lifi bridge ... --json      # raw JSON output
```

</details>

<details>
<summary><strong>swap</strong> — single-chain token swaps</summary>

```bash
lifi swap \
  --from USDC --to ETH \
  --chain base --amount 100 --wallet main

lifi swap ... --execute
```

</details>

<details>
<summary><strong>earn</strong> — yield deposits via LI.FI Composer</summary>

```bash
# browse vaults
lifi earn vaults --chain base --token USDC

# list supported protocols
lifi earn protocols

# get a deposit quote (amount in human units)
lifi earn quote \
  --protocol morpho --token USDC \
  --amount 100 --chain base --wallet main

# execute the deposit
lifi earn quote ... --execute

# show active positions for an address
lifi earn portfolio 0xYourAddress
```

Supported protocols include: Morpho, Aave v3, Lido, EtherFi, Ethena, Pendle, Euler, Seamless, Kinetiq, Maple, Upshift, and more. Run `lifi earn protocols` for the live list.

> **How Composer works:** setting `toToken` to a vault address on the LI.FI `/v1/quote` endpoint triggers Composer routing — any required swaps, bridging, and the vault deposit are bundled into a single transaction.

</details>

<details>
<summary><strong>dryrun</strong> — simulate without submitting</summary>

```bash
lifi dryrun --type bridge \
  --from USDC --to USDC \
  --from-chain base --to-chain arbitrum \
  --amount 100 --wallet main

lifi dryrun --type earn \
  --protocol morpho --token USDC \
  --amount 100 --chain base --wallet main
# returns projected APY, daily/monthly/annual yield estimate
```

</details>

<details>
<summary><strong>markets</strong> — prediction markets</summary>

```bash
# Polymarket (no auth)
lifi polymarket list
lifi polymarket list --query "bitcoin"
lifi polymarket get <slug>

# Kalshi (requires API key)
lifi config set --kalshi-key YOUR_KEY
lifi kalshi list --query "fed rate"

# Manifold (no auth)
lifi manifold list
```

</details>

<details>
<summary><strong>agent</strong> — interactive AI agent</summary>

On first run, an interactive setup prompt configures your provider:

```
  Agent Setup
  ────────────────────────────────────────
  Providers:
    1. openrouter
    2. openai
    3. ollama

  provider › 1
  model › [nvidia/nemotron-3-super-120b-a12b:free]
  api key › ************
  save? › [Y/n]
```

```bash
lifi agent            # start (launches setup if unconfigured)
lifi agent --setup    # reconfigure provider and key
lifi agent --model google/gemini-flash-1.5  # override model for this session
```

The agent has access to 13 tools: bridge, swap, earn, vault browsing, portfolio, prediction markets (Polymarket/Kalshi/Manifold), dryrun simulations, and tx status.

Example:

```
you> what yield can I get on 1000 USDC on Base?
agent> Fetching vaults...

  Vault              APY     TVL
  Morpho USDC        4.07%   $371M
  Seamless USDC      3.2%    $28M
  Aave v3 USDC       2.9%    $190M

  At 4.07% APY on $1000: ~$11.15/month, ~$40.70/year.
```

</details>

<details>
<summary><strong>mcp</strong> — MCP server for Claude Code / Cursor</summary>

```bash
lifi mcp    # starts MCP server over stdio
```

Add to `~/.claude/settings.json`:

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

| Tool | Description |
|---|---|
| `lifi_bridge_quote` | Cross-chain bridge quote |
| `lifi_swap_quote` | Same-chain swap quote |
| `lifi_earn_quote` | Yield deposit quote via Composer |
| `lifi_earn_protocols` | List supported protocols |
| `lifi_markets_list` | List Polymarket markets |
| `lifi_markets_get` | Get a specific market |
| `lifi_tx_status` | Check transaction status |

</details>

<details>
<summary><strong>config</strong> — API keys and defaults</summary>

```bash
lifi config set --api-key KEY          # LI.FI API key
lifi config set --kalshi-key KEY       # Kalshi API key
lifi config set --chain base           # default chain
lifi config set --wallet main          # default wallet
lifi config show                       # print current config (keys masked)
```

Config stored at `~/.lifi/config.json`. Can also be set via env vars:

```bash
LIFI_API_KEY=...
DEFAULT_CHAIN=base
DEFAULT_WALLET=main
```

</details>

<details>
<summary><strong>reset</strong> — wipe config and data</summary>

```bash
lifi reset              # clear config (interactive confirmation)
lifi reset --wallets    # also delete wallet keys (unrecoverable — requires typing "yes")
lifi reset --yes        # non-interactive (for scripting)
```

</details>

---

## Use as a library

```bash
npm install lifi-cli
```

```ts
import { getBridgeQuote, getEarnQuote, getMarkets } from 'lifi-cli'

const quote = await getBridgeQuote({
  fromChain: 'ethereum',
  toChain: 'base',
  fromToken: 'USDC',
  toToken: 'USDC',
  amount: '100000000',
  fromAddress: '0xYourAddress',
})

const earnQuote = await getEarnQuote({
  protocol: 'morpho',
  token: 'USDC',
  amount: '100000000',  // smallest unit
  chain: 'base',
  fromAddress: '0xYourAddress',
})

const markets = await getMarkets('bitcoin', 10)
```

Sub-path imports:

```ts
import { getBridgeQuote } from 'lifi-cli/bridge'
import { getEarnQuote, fetchVaults, fetchEarnProtocols } from 'lifi-cli/earn'
import { getMarkets } from 'lifi-cli/markets'
import { runAgent } from 'lifi-cli/agent'
```

---

## Development

```bash
git clone https://github.com/daiwikmh/lifi-cli
cd lifi-cli
npm install
npm run dev       # watch mode
npm run build     # production build
npm test          # run tests
npm run typecheck
```

---

## License

MIT
