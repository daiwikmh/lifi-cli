# How We Use LI.FI

## Overview

This CLI is built on two LI.FI surfaces:

1. **LI.FI Routing API** — for bridge and swap quotes
2. **LI.FI Composer** — for yield deposits (Morpho, Aave, Lido, Ethena, etc.)

Both use the **same single endpoint**: `GET https://li.quest/v1/quote`

The distinction is entirely in what you pass as `toToken`. If it's a DEX token — you get a swap. If it's a vault or staking token from a supported protocol — LI.FI automatically routes it through Composer.

---

## The One Endpoint

```
GET https://li.quest/v1/quote
```

| Parameter | Description |
|---|---|
| `fromChain` | Source chain ID (e.g. `1` for Ethereum, `8453` for Base) |
| `toChain` | Destination chain ID |
| `fromToken` | Token address or symbol to send |
| `toToken` | Token address or symbol to receive |
| `fromAmount` | Amount in smallest unit (wei for ETH, 1e6 for 1 USDC) |
| `fromAddress` | Sender wallet address |
| `toAddress` | Recipient address (defaults to `fromAddress`) |
| `slippage` | Slippage tolerance (e.g. `0.005` = 0.5%) |

The response includes:
- `estimate` — amounts, gas cost, duration
- `transactionRequest` — a ready-to-sign EVM transaction object
- `estimate.approvalAddress` — address to approve if sending an ERC-20

---

## Bridge / Swap Flow

```
User runs: lifi bridge --from ETH --to USDC --from-chain ethereum --to-chain base
                                 |
                    src/core/bridge/bridge.ts
                    getBridgeQuote()
                                 |
                    GET /v1/quote
                    fromChain=1, toChain=8453
                    fromToken=ETH, toToken=USDC
                                 |
                    LI.FI picks the best bridge route
                    (Stargate, Across, Hop, etc.)
                                 |
                    Returns: transactionRequest
                                 |
              --execute flag: src/core/wallet/executor.ts
              executeTransaction() signs and broadcasts
```

For same-chain swaps, `fromChain === toChain`. LI.FI routes through DEX aggregators
(1inch, 0x, Paraswap, etc.).

---

## Earn / Composer Flow

The Composer API is **not a separate endpoint**. It activates automatically when `toToken`
is set to a recognized vault or staking contract address.

```
User runs: lifi earn quote --protocol morpho-usdc --token USDC --chain base
                                 |
                    src/core/earn/protocols.ts
                    getProtocolBySymbol('morpho-usdc')
                    → vaultToken: 0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A
                                 |
                    src/core/earn/earn.ts
                    getEarnQuote()
                                 |
                    GET /v1/quote
                    fromToken=USDC
                    toToken=0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A  ← Morpho vault token
                                 |
                    LI.FI detects: this is a Composer route
                    Compiles: swap (if needed) + vault deposit
                    Simulates: full execution path
                                 |
                    Returns: single transactionRequest
                    (one tx = swap + deposit, atomic)
                                 |
              --execute flag: signs and broadcasts
```

### Why Composer is Powerful

Without Composer, a USDC → Morpho deposit requires:
1. Approve USDC spend
2. Call Morpho `deposit()` directly

With Composer, even cross-chain flows work in one tx:
```
ETH on Ethereum
    → bridge to Base
    → swap to USDC
    → deposit into Morpho vault
= one transaction, one signature
```

---

## Protocol Registry

We maintain a local registry of vault token addresses in `src/core/earn/protocols.ts`.
This is necessary because Composer activation depends on passing the correct `toToken` address.

```ts
{
  symbol: 'morpho-usdc',
  vaultToken: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',  // Morpho USDC vault on Base
  underlyingToken: 'USDC',
  chainId: 8453,
  category: 'vault',
}
```

When a user runs `lifi earn quote --protocol morpho-usdc`, we:
1. Look up the protocol by symbol
2. Use `vaultToken` as the `toToken` in the quote request
3. Let LI.FI handle the routing and batching

---

## Transaction Execution

After getting a quote, the `transactionRequest` object is a standard EVM transaction:

```ts
{
  to: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",  // LI.FI diamond contract
  from: "0xYourWallet",
  data: "0x...",   // encoded calldata
  value: "0",      // ETH value (non-zero for native token sends)
  gasLimit: "250000",
  chainId: 8453
}
```

We sign and broadcast this using `viem`:

```ts
// src/core/wallet/executor.ts
const client = createWalletClient({ account, chain, transport: http() })
const hash = await client.sendTransaction({ to, data, value, gas })
```

For ERC-20 tokens, we first check the allowance and send an approval transaction if needed,
using `viem`'s `readContract` + `writeContract` with the standard ERC-20 ABI.

---

## Status Tracking

Cross-chain transactions (bridge + earn across chains) are tracked via:

```
GET https://li.quest/v1/status?txHash=0x...&fromChain=1&toChain=8453
```

Response statuses: `PENDING` → `DONE` or `FAILED`

```bash
lifi status 0xabc123... --from-chain 1 --to-chain 8453
```

---

## API Authentication

The LI.FI API works without a key for basic usage with rate limits.
A Partner Portal API key (`LIFI_API_KEY`) removes rate limits and unlocks higher throughput.

Set it with:
```bash
lifi config set --api-key YOUR_KEY
# or
export LIFI_API_KEY=YOUR_KEY
```

The key is passed as an `x-lifi-api-key` header on every request (`src/api/lifi/client.ts`).

---

## Code Map

| File | Role |
|---|---|
| `src/api/lifi/client.ts` | axios instance with base URL + auth header |
| `src/api/lifi/endpoints.ts` | `getQuote()`, `getStatus()`, `getTokens()`, `getChains()` |
| `src/core/bridge/bridge.ts` | `getBridgeQuote()` — resolves chains, calls `getQuote()` |
| `src/core/swap/swap.ts` | `getSwapQuote()` — same chain bridge quote |
| `src/core/earn/earn.ts` | `getEarnQuote()` — looks up vault token, calls `getQuote()` |
| `src/core/earn/protocols.ts` | Registry of vault token addresses by protocol symbol |
| `src/core/wallet/executor.ts` | `executeTransaction()`, `ensureAllowance()` via viem |
