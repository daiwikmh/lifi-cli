# LI.FI Integration Details

## Two APIs, one CLI

| API | Base URL | Used for |
|---|---|---|
| LI.FI Routing API | `https://li.quest/v1` | bridge, swap, earn quotes, tx status |
| LI.FI Earn API | `https://earn.li.fi/v1/earn` | vault discovery, protocols list, portfolio |

---

## 1. Routing API — the one endpoint

```
GET https://li.quest/v1/quote
```

Everything — bridge, swap, and Composer yield deposits — goes through this single endpoint.
The behavior changes entirely based on what you pass as `toToken`.

| `toToken` value | What LI.FI does |
|---|---|
| A normal token (USDC, ETH) | Routes a swap or bridge |
| A vault/staking contract address | Activates Composer — bundles swap + deposit into one tx |

**Parameters:**

| Parameter | Description |
|---|---|
| `fromChain` | Source chain ID (e.g. `8453` for Base) |
| `toChain` | Destination chain ID |
| `fromToken` | Token symbol or address to send |
| `toToken` | Token symbol, address, or vault contract address |
| `fromAmount` | Amount in smallest unit (e.g. `100000000` for 100 USDC) |
| `fromAddress` | Sender wallet address |
| `toAddress` | Recipient (defaults to `fromAddress`) |
| `slippage` | Slippage tolerance, e.g. `0.005` = 0.5% |

**Response key fields:**

```ts
{
  estimate: {
    fromAmount: string,
    toAmount: string,
    toAmountMin: string,
    approvalAddress: string,   // ERC-20 approval target if needed
    executionDuration: number, // seconds
    gasCosts: [{ amount, amountUSD, token }]
  },
  transactionRequest: {
    to: string,       // LI.FI diamond contract
    from: string,
    data: string,     // encoded calldata
    value: string,    // ETH value (0 for ERC-20 sends)
    gasLimit: string,
    chainId: number
  }
}
```

---

## 2. Earn API — vault discovery

```
https://earn.li.fi/v1/earn
```

Used to look up vault addresses before calling the Routing API. The Routing API needs the
vault's contract address as `toToken` to activate Composer. The Earn API is how we find it.

| Endpoint | Description |
|---|---|
| `GET /vaults` | List vaults with optional filters (`chainId`, `protocol`, `underlyingToken`, `limit`) |
| `GET /vaults/:chainId/:address` | Get a single vault by chain + address |
| `GET /protocols` | List all supported protocol names and URLs |
| `GET /portfolio/:address/positions` | Active yield positions for a wallet |

**Auth:** optional `x-lifi-api-key` header for higher rate limits.

---

## Bridge / Swap flow

```
lifi bridge --from USDC --to USDC --from-chain ethereum --to-chain base --amount 100
                                    |
                       src/core/bridge/bridge.ts  getBridgeQuote()
                                    |
                    Resolves chain names → chain IDs
                    Converts amount to smallest unit
                                    |
                    GET https://li.quest/v1/quote
                    fromChain=1  toChain=8453
                    fromToken=USDC  toToken=USDC
                                    |
                    LI.FI picks best bridge route
                    (Stargate, Across, Hop, Connext...)
                                    |
                    Returns: transactionRequest
                                    |
              --execute: src/core/wallet/executor.ts
              ensureAllowance() → executeTransaction()
```

Same-chain swaps work identically with `fromChain === toChain`. LI.FI routes through
DEX aggregators (1inch, 0x, Paraswap, etc.).

---

## Earn / Composer flow

```
lifi earn quote --protocol morpho --token USDC --amount 100 --chain base
                                    |
                       src/core/earn/earn.ts  getEarnQuote()
                                    |
                    Step 1: resolve vault
                    GET https://earn.li.fi/v1/earn/vaults
                        ?chainId=8453&protocol=morpho&underlyingToken=USDC&limit=5
                    → picks best matching vault
                    → vault.address = 0x...  (Morpho USDC vault on Base)
                                    |
                    Step 2: Composer quote
                    GET https://li.quest/v1/quote
                    fromToken=USDC
                    toToken=0x...  ← vault address activates Composer
                    fromChain=toChain=8453
                                    |
                    LI.FI detects Composer route
                    Compiles: ERC-20 approval + vault deposit
                    Returns: single transactionRequest
                                    |
              --execute: ensureAllowance() → executeTransaction()
              One tx. One signature.
```

**Vault resolution logic** (`src/core/earn/earn.ts`):

1. If `--protocol` starts with `0x` — fetch vault directly by address from Earn API
2. Otherwise — query `/vaults?chainId=&protocol=&limit=5`, pick vault whose `underlyingTokens` matches `--token`
3. Fall back to first result if no exact token match

**Why Composer is powerful:**

Without it, depositing ETH from Ethereum into a Morpho USDC vault on Base requires:
1. Bridge ETH → Base
2. Swap ETH → USDC on Base
3. Approve USDC spend on Morpho
4. Call `deposit()` on Morpho

With Composer — one quote, one transaction, one signature.

---

## ERC-20 approvals

Before submitting any earn or bridge transaction involving an ERC-20 token, we check the
allowance and approve if needed:

```ts
// src/core/wallet/keychain.ts  ensureAllowance()
const allowance = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'allowance',
  args: [walletAddress, spenderAddress],
})

if (allowance < requiredAmount) {
  // send approve() tx first, wait for confirmation
}
```

The `approvalAddress` comes from `quote.estimate.approvalAddress` — the LI.FI contract
that needs to spend the token.

---

## Transaction execution

```ts
// src/core/wallet/keychain.ts  executeTransaction()
const walletClient = createWalletClient({
  account: privateKeyToAccount(privateKey),
  chain: viemChain,
  transport: http(rpcUrl),
})

const hash = await walletClient.sendTransaction({
  to: tx.to,
  data: tx.data,
  value: tx.value,
  gas: tx.gasLimit,
})
```

Private keys are stored in the OS keychain (keytar) and never written to disk in plaintext.

---

## Status tracking

```
GET https://li.quest/v1/status?txHash=0x...&fromChain=1&toChain=8453
```

Statuses: `PENDING` → `DONE` or `FAILED`

```bash
lifi status 0xabc123... --from-chain 1 --to-chain 8453
```

---

## Authentication

The Routing API and Earn API both work without a key (rate-limited). A Partner Portal
API key removes limits and is passed as a header on every request:

```
x-lifi-api-key: YOUR_KEY
```

```bash
lifi config set --api-key YOUR_KEY
# or
export LIFI_API_KEY=YOUR_KEY
```

---

## Code map

| File | Role |
|---|---|
| `src/api/lifi/client.ts` | axios instance with base URL + auth header |
| `src/api/lifi/endpoints.ts` | `getQuote()`, `getStatus()`, `getTokens()`, `getChains()` |
| `src/api/lifi/earn.ts` | `listVaults()`, `getVault()`, `listEarnProtocols()`, `getPortfolio()` |
| `src/core/bridge/bridge.ts` | `getBridgeQuote()` — resolves chains/amounts, calls `getQuote()` |
| `src/core/swap/swap.ts` | `getSwapQuote()` — same-chain bridge quote |
| `src/core/earn/earn.ts` | `getEarnQuote()` — resolves vault via Earn API, calls `getQuote()` |
| `src/core/wallet/keychain.ts` | Wallet storage (keytar), `executeTransaction()`, `ensureAllowance()` |
| `src/config/defaults.ts` | Chain IDs, config file paths |
