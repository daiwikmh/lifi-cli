#!/usr/bin/env node
import {
  CHAIN_IDS,
  WALLETS_DIR,
  getBridgeQuote,
  getConfigValue,
  getEarnQuote,
  getMarketBySlug,
  getMarkets,
  getStatus,
  getSwapQuote,
  listProtocols,
  loadConfig,
  resolveChain,
  saveConfig
} from "./chunk-AOTGOO3E.mjs";

// src/cli.ts
import { Command as Command13 } from "commander";

// src/display/banner.ts
import chalk from "chalk";
var LIFI_LOGO = `
  \u2588\u2588\u2557     \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557      \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557     \u2588\u2588\u2557
  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2551     \u2588\u2588\u2551
  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551
  \u2588\u2588\u2551     \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2551
  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551
  \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D\u255A\u2550\u255D`;
function printClibanner(version) {
  console.log(chalk.cyan(LIFI_LOGO));
  console.log();
  console.log(
    "  " + chalk.bold("bridge") + chalk.dim(" \xB7") + "  " + chalk.bold("swap") + chalk.dim(" \xB7") + "  " + chalk.bold("earn") + chalk.dim(" \xB7") + "  " + chalk.bold("markets") + chalk.dim(" \xB7") + "  " + chalk.bold("agent") + chalk.dim(" \xB7") + "  " + chalk.bold("mcp")
  );
  console.log();
  console.log(chalk.dim(`  v${version}  \xB7  Run lifi --help to see all commands`));
  console.log();
}
function printAgentBanner(model) {
  const lines = [
    "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
    "\u2502                                                         \u2502",
    "\u2502   lifi agent                                            \u2502",
    "\u2502   Your AI copilot for DeFi \xB7 powered by OpenRouter      \u2502",
    "\u2502                                                         \u2502",
    "\u2502   Tools:                                                \u2502",
    "\u2502   \u25C6  bridge      move tokens across chains              \u2502",
    "\u2502   \u25C6  swap        swap tokens on a single chain          \u2502",
    "\u2502   \u25C6  earn        deposit into yield via LI.FI Composer  \u2502",
    "\u2502   \u25C6  protocols   list supported yield protocols         \u2502",
    "\u2502   \u25C6  polymarket  browse Polymarket predictions          \u2502",
    "\u2502   \u25C6  kalshi      browse Kalshi markets                 \u2502",
    "\u2502   \u25C6  manifold    browse Manifold markets               \u2502",
    "\u2502   \u25C6  status      track cross-chain transactions         \u2502",
    "\u2502                                                         \u2502",
    "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518"
  ];
  console.log();
  lines.forEach((line) => console.log(chalk.cyan("  " + line)));
  console.log();
  console.log(chalk.dim(`  Model: ${model}`));
  console.log(chalk.dim("  Type your question. Ctrl+C to exit."));
  console.log();
}

// src/commands/bridge.command.ts
import { Command } from "commander";
import chalk2 from "chalk";

// src/core/wallet/wallet.ts
import fs from "fs";
import path from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// src/core/wallet/keychain.ts
var SERVICE = "lifi-cli";
async function storeSecret(account, secret) {
  const keytar = await import("keytar");
  await keytar.setPassword(SERVICE, account, secret);
}
async function getSecret(account) {
  const keytar = await import("keytar");
  return keytar.getPassword(SERVICE, account);
}

// src/core/wallet/wallet.ts
var WALLET_INDEX = path.join(WALLETS_DIR, "index.json");
function ensureWalletsDir() {
  if (!fs.existsSync(WALLETS_DIR)) fs.mkdirSync(WALLETS_DIR, { recursive: true });
}
function readIndex() {
  ensureWalletsDir();
  if (!fs.existsSync(WALLET_INDEX)) return [];
  try {
    return JSON.parse(fs.readFileSync(WALLET_INDEX, "utf-8"));
  } catch {
    return [];
  }
}
function writeIndex(wallets) {
  ensureWalletsDir();
  fs.writeFileSync(WALLET_INDEX, JSON.stringify(wallets, null, 2));
}
async function createWallet(name) {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const wallet = {
    name,
    address: account.address,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await storeSecret(name, privateKey);
  const index = readIndex();
  index.push(wallet);
  writeIndex(index);
  return wallet;
}
async function importWallet(name, privateKey) {
  const account = privateKeyToAccount(privateKey);
  const wallet = {
    name,
    address: account.address,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await storeSecret(name, privateKey);
  const index = readIndex();
  index.push(wallet);
  writeIndex(index);
  return wallet;
}
function listWallets() {
  return readIndex();
}
async function getWalletKey(name) {
  const key = await getSecret(name);
  if (!key) throw new Error(`Wallet not found: ${name}`);
  return key;
}

// src/core/wallet/executor.ts
import { createWalletClient, createPublicClient, http, erc20Abi } from "viem";
import { privateKeyToAccount as privateKeyToAccount2 } from "viem/accounts";
var PUBLIC_RPC = {
  1: "https://eth.llamarpc.com",
  10: "https://mainnet.optimism.io",
  56: "https://bsc-dataseed.binance.org",
  137: "https://polygon-rpc.com",
  8453: "https://mainnet.base.org",
  42161: "https://arb1.arbitrum.io/rpc",
  43114: "https://api.avax.network/ext/bc/C/rpc"
};
function getViemChain(chainId) {
  return {
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [PUBLIC_RPC[chainId] ?? `https://rpc.ankr.com/eth`] } }
  };
}
async function executeTransaction(tx, walletName) {
  const privateKey = await getWalletKey(walletName);
  const account = privateKeyToAccount2(privateKey);
  const chain = getViemChain(tx.chainId);
  const client = createWalletClient({ account, chain, transport: http() });
  const hash = await client.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    gas: tx.gasLimit
  });
  return { txHash: hash, chainId: tx.chainId };
}
async function ensureAllowance(tokenAddress, spender, amount, walletName, chainId) {
  const privateKey = await getWalletKey(walletName);
  const account = privateKeyToAccount2(privateKey);
  const chain = getViemChain(chainId);
  const publicClient = createPublicClient({ chain, transport: http() });
  const walletClient = createWalletClient({ account, chain, transport: http() });
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account.address, spender]
  });
  if (allowance >= amount) return null;
  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [spender, amount]
  });
  return hash;
}

// src/display/format.ts
function formatAmount(amount, decimals = 6) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}
function formatAPY(apy) {
  return `${(apy * 100).toFixed(2)}%`;
}
function formatUSD(amount) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatChain(chainId) {
  const names = {
    1: "Ethereum",
    42161: "Arbitrum",
    8453: "Base",
    10: "Optimism",
    137: "Polygon",
    56: "BSC",
    43114: "Avalanche"
  };
  return names[chainId] ?? `Chain ${chainId}`;
}

// src/display/spinner.ts
import ora from "ora";
async function withSpinner(text, fn) {
  const spinner = ora(text).start();
  try {
    const result = await fn(spinner);
    spinner.succeed();
    return result;
  } catch (err) {
    spinner.fail();
    throw err;
  }
}

// src/display/table.ts
import Table from "cli-table3";
function makeTable(head, rows) {
  const table = new Table({ head, style: { head: ["cyan"] } });
  rows.forEach((row) => table.push(row));
  return table.toString();
}

// src/commands/bridge.command.ts
function bridgeCommand() {
  return new Command("bridge").description("Get a quote to bridge tokens across chains").requiredOption("--from <token>", "token to send (symbol or address)").requiredOption("--to <token>", "token to receive (symbol or address)").requiredOption("--from-chain <chain>", "source chain (name or ID)").requiredOption("--to-chain <chain>", "destination chain (name or ID)").requiredOption("--amount <amount>", "amount in token units (e.g. 100 for 100 USDC)").requiredOption("--wallet <name>", "wallet name (from lifi wallet list)").option("--slippage <slippage>", "slippage tolerance (e.g. 0.005 for 0.5%)", "0.005").option("--execute", "sign and submit the transaction").option("--json", "output as JSON").action(async (opts) => {
    try {
      const quote = await withSpinner(
        "Fetching bridge quote...",
        async () => getBridgeQuote({
          fromChain: opts.fromChain,
          toChain: opts.toChain,
          fromToken: opts.from,
          toToken: opts.to,
          amount: opts.amount,
          fromAddress: opts.wallet,
          slippage: parseFloat(opts.slippage)
        })
      );
      if (opts.json && !opts.execute) {
        console.log(JSON.stringify(quote, null, 2));
        return;
      }
      if (!opts.execute) {
        console.log(makeTable(
          ["Field", "Value"],
          [
            ["From", `${formatAmount(quote.fromAmount)} ${opts.from} on ${formatChain(quote.fromChain)}`],
            ["To", `${formatAmount(quote.toAmount)} ${opts.to} on ${formatChain(quote.toChain)}`],
            ["Min received", formatAmount(quote.toAmountMin)],
            ["Via", quote.tool],
            ["Est. duration", `${quote.estimatedDuration}s`],
            ["Gas cost", quote.gasCostUSD]
          ]
        ));
        if (quote.approvalAddress) {
          console.log(chalk2.yellow(`
Approval needed: ${quote.approvalAddress}`));
        }
        console.log(chalk2.dim("\nAdd --execute to submit this transaction."));
        return;
      }
      const tx = quote.transactionRequest;
      if (quote.approvalAddress && opts.from.toLowerCase() !== "eth") {
        await withSpinner("Checking token approval...", async (spinner) => {
          const approvHash = await ensureAllowance(
            tx.to,
            quote.approvalAddress,
            BigInt(quote.fromAmount),
            opts.wallet,
            tx.chainId
          );
          if (approvHash) {
            spinner.text = `Approval tx sent: ${approvHash}`;
          }
        });
      }
      const result = await withSpinner(
        "Submitting transaction...",
        async () => executeTransaction(
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: BigInt(tx.value ?? "0"),
            gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : void 0,
            chainId: tx.chainId
          },
          opts.wallet
        )
      );
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(chalk2.green(`
Transaction submitted!`));
      console.log(`Hash: ${chalk2.cyan(result.txHash)}`);
      console.log(chalk2.dim(`Run: lifi status ${result.txHash} to track progress`));
    } catch (err) {
      console.error(chalk2.red("Error:"), String(err));
      process.exit(1);
    }
  });
}

// src/commands/swap.command.ts
import { Command as Command2 } from "commander";
import chalk3 from "chalk";
function swapCommand() {
  return new Command2("swap").description("Get a quote to swap tokens on a single chain").requiredOption("--from <token>", "token to swap from").requiredOption("--to <token>", "token to swap to").requiredOption("--amount <amount>", "amount in token units").requiredOption("--wallet <name>", "wallet name (from lifi wallet list)").option("--chain <chain>", "chain name or ID", resolveChain()).option("--slippage <slippage>", "slippage tolerance", "0.005").option("--execute", "sign and submit the transaction").option("--json", "output as JSON").action(async (opts) => {
    try {
      const quote = await withSpinner(
        "Fetching swap quote...",
        async () => getSwapQuote({
          chain: opts.chain,
          fromToken: opts.from,
          toToken: opts.to,
          amount: opts.amount,
          fromAddress: opts.wallet,
          slippage: parseFloat(opts.slippage)
        })
      );
      if (opts.json && !opts.execute) {
        console.log(JSON.stringify(quote, null, 2));
        return;
      }
      if (!opts.execute) {
        console.log(makeTable(
          ["Field", "Value"],
          [
            ["Chain", formatChain(quote.chain)],
            ["From", `${formatAmount(quote.fromAmount)} ${opts.from}`],
            ["To", `${formatAmount(quote.toAmount)} ${opts.to}`],
            ["Min received", formatAmount(quote.toAmountMin)],
            ["Via", quote.tool],
            ["Gas cost", quote.gasCostUSD]
          ]
        ));
        console.log(chalk3.dim("\nAdd --execute to submit this transaction."));
        return;
      }
      const tx = quote.transactionRequest;
      if (quote.approvalAddress && opts.from.toLowerCase() !== "eth") {
        await withSpinner("Checking token approval...", async (spinner) => {
          const approvHash = await ensureAllowance(
            tx.to,
            quote.approvalAddress,
            BigInt(quote.fromAmount),
            opts.wallet,
            tx.chainId
          );
          if (approvHash) spinner.text = `Approval tx sent: ${approvHash}`;
        });
      }
      const result = await withSpinner(
        "Submitting transaction...",
        async () => executeTransaction(
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: BigInt(tx.value ?? "0"),
            gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : void 0,
            chainId: tx.chainId
          },
          opts.wallet
        )
      );
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(chalk3.green("\nTransaction submitted!"));
      console.log(`Hash: ${chalk3.cyan(result.txHash)}`);
    } catch (err) {
      console.error(chalk3.red("Error:"), String(err));
      process.exit(1);
    }
  });
}

// src/commands/earn.command.ts
import { Command as Command3 } from "commander";
import chalk4 from "chalk";
function earnCommand() {
  const earn = new Command3("earn").description("Deposit into yield protocols via LI.FI Composer");
  earn.command("quote").description("Get a quote to deposit into a yield protocol").requiredOption("--protocol <protocol>", "protocol symbol (e.g. morpho-usdc)").requiredOption("--token <token>", "token to deposit (symbol or address)").requiredOption("--amount <amount>", "amount in smallest unit (e.g. 1000000 for 1 USDC)").requiredOption("--wallet <name>", "wallet name (from lifi wallet list)").option("--chain <chain>", "chain name or ID", resolveChain()).option("--execute", "sign and submit the deposit transaction").option("--json", "output as JSON").action(async (opts) => {
    try {
      const quote = await withSpinner(
        "Fetching earn quote...",
        async () => getEarnQuote({
          protocol: opts.protocol,
          token: opts.token,
          amount: opts.amount,
          chain: opts.chain,
          fromAddress: opts.wallet
        })
      );
      if (opts.json && !opts.execute) {
        console.log(JSON.stringify(quote, null, 2));
        return;
      }
      if (!opts.execute) {
        console.log(makeTable(
          ["Field", "Value"],
          [
            ["Protocol", quote.protocol],
            ["Deposit", `${formatAmount(quote.fromAmount)} ${opts.token}`],
            ["Vault tokens", formatAmount(quote.toAmount)],
            ["Est. APY", quote.estimatedApy ? formatAPY(quote.estimatedApy) : "n/a"],
            ["Est. duration", `${quote.estimatedDuration}s`],
            ["Gas cost", quote.gasCostUSD]
          ]
        ));
        if (quote.approvalAddress) {
          console.log(chalk4.yellow(`
Approval needed: ${quote.approvalAddress}`));
        }
        console.log(chalk4.dim("\nAdd --execute to submit this deposit."));
        return;
      }
      const tx = quote.transactionRequest;
      if (quote.approvalAddress && opts.token.toLowerCase() !== "eth") {
        await withSpinner("Checking token approval...", async (spinner) => {
          const approvHash = await ensureAllowance(
            tx.to,
            quote.approvalAddress,
            BigInt(quote.fromAmount),
            opts.wallet,
            tx.chainId
          );
          if (approvHash) spinner.text = `Approval tx sent: ${approvHash}`;
        });
      }
      const result = await withSpinner(
        "Submitting deposit...",
        async () => executeTransaction(
          {
            to: tx.to,
            from: tx.from,
            data: tx.data,
            value: BigInt(tx.value ?? "0"),
            gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : void 0,
            chainId: tx.chainId
          },
          opts.wallet
        )
      );
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(chalk4.green("\nDeposit submitted!"));
      console.log(`Hash: ${chalk4.cyan(result.txHash)}`);
      console.log(chalk4.dim(`Run: lifi status ${result.txHash} to track`));
    } catch (err) {
      console.error(chalk4.red("Error:"), String(err));
      process.exit(1);
    }
  });
  earn.command("protocols").description("List all supported yield protocols").option("--chain <chain>", "filter by chain").option("--category <category>", "filter by category (vault, lending, staking, yield)").option("--json", "output as JSON").action((opts) => {
    const protocols = listProtocols({ category: opts.category });
    if (opts.json) {
      console.log(JSON.stringify(protocols, null, 2));
      return;
    }
    console.log(makeTable(
      ["Symbol", "Name", "Chain", "Category", "Underlying"],
      protocols.map((p) => [p.symbol, p.name, String(p.chainId), p.category, p.underlyingToken])
    ));
  });
  return earn;
}

// src/commands/markets.command.ts
import { Command as Command4 } from "commander";
import chalk5 from "chalk";
function marketsCommand() {
  const markets = new Command4("markets").description("Browse and interact with prediction markets");
  markets.command("list").description("List active Polymarket prediction markets").option("--query <query>", "search query").option("--limit <limit>", "max results", "20").option("--json", "output as JSON").action(async (opts) => {
    try {
      const results = await withSpinner(
        "Fetching markets...",
        async () => getMarkets(opts.query, parseInt(opts.limit))
      );
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      if (results.length === 0) {
        console.log(chalk5.yellow("No active markets found."));
        return;
      }
      console.log(makeTable(
        ["Question", "Yes %", "No %", "Volume", "Ends"],
        results.slice(0, 20).map((m) => [
          m.question.slice(0, 50) + (m.question.length > 50 ? "..." : ""),
          m.prices[0] != null ? `${(m.prices[0] * 100).toFixed(1)}%` : "n/a",
          m.prices[1] != null ? `${(m.prices[1] * 100).toFixed(1)}%` : "n/a",
          formatUSD(m.volume),
          m.endDate ? new Date(m.endDate).toLocaleDateString() : "n/a"
        ])
      ));
    } catch (err) {
      console.error(chalk5.red("Error:"), String(err));
      process.exit(1);
    }
  });
  markets.command("get <slug>").description("Get details of a specific market by slug").option("--json", "output as JSON").action(async (slug, opts) => {
    try {
      const market = await withSpinner("Fetching market...", async () => getMarketBySlug(slug));
      if (!market) {
        console.error(chalk5.red(`Market not found: ${slug}`));
        process.exit(1);
      }
      if (opts.json) {
        console.log(JSON.stringify(market, null, 2));
        return;
      }
      console.log(makeTable(
        ["Field", "Value"],
        [
          ["Question", market.question],
          ["Outcomes", market.outcomes.join(" / ")],
          ["Prices", market.prices.map((p) => `${(p * 100).toFixed(1)}%`).join(" / ")],
          ["Volume", formatUSD(market.volume)],
          ["Liquidity", formatUSD(market.liquidity)],
          ["Ends", market.endDate ? new Date(market.endDate).toLocaleDateString() : "n/a"]
        ]
      ));
    } catch (err) {
      console.error(chalk5.red("Error:"), String(err));
      process.exit(1);
    }
  });
  return markets;
}

// src/commands/polymarket.command.ts
import { Command as Command5 } from "commander";
import chalk6 from "chalk";
function polymarketCommand() {
  const cmd = new Command5("polymarket").description("Browse Polymarket prediction markets");
  cmd.command("list").description("List active markets").option("--query <query>", "search query").option("--limit <n>", "max results", "20").option("--json", "output as JSON").action(async (opts) => {
    try {
      const results = await withSpinner(
        "Fetching Polymarket markets...",
        () => getMarkets(opts.query, parseInt(opts.limit))
      );
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      if (!results.length) {
        console.log(chalk6.yellow("No markets found."));
        return;
      }
      console.log(makeTable(
        ["Question", "Yes", "No", "Volume", "Ends"],
        results.slice(0, 20).map((m) => [
          m.question.slice(0, 48) + (m.question.length > 48 ? ".." : ""),
          m.prices[0] != null ? `${(m.prices[0] * 100).toFixed(1)}%` : "n/a",
          m.prices[1] != null ? `${(m.prices[1] * 100).toFixed(1)}%` : "n/a",
          formatUSD(m.volume),
          m.endDate ? new Date(m.endDate).toLocaleDateString() : "n/a"
        ])
      ));
    } catch (err) {
      console.error(chalk6.red("Error:"), String(err));
      process.exit(1);
    }
  });
  cmd.command("get <slug>").description("Get a market by slug").option("--json", "output as JSON").action(async (slug, opts) => {
    try {
      const market = await withSpinner("Fetching market...", () => getMarketBySlug(slug));
      if (!market) {
        console.error(chalk6.red(`Not found: ${slug}`));
        process.exit(1);
      }
      if (opts.json) {
        console.log(JSON.stringify(market, null, 2));
        return;
      }
      console.log(makeTable(
        ["Field", "Value"],
        [
          ["Question", market.question],
          ["Yes", `${(market.prices[0] * 100).toFixed(1)}%`],
          ["No", `${(market.prices[1] * 100).toFixed(1)}%`],
          ["Volume", formatUSD(market.volume)],
          ["Liquidity", formatUSD(market.liquidity)],
          ["Ends", market.endDate ? new Date(market.endDate).toLocaleDateString() : "n/a"]
        ]
      ));
    } catch (err) {
      console.error(chalk6.red("Error:"), String(err));
      process.exit(1);
    }
  });
  return cmd;
}

// src/commands/kalshi.command.ts
import { Command as Command6 } from "commander";
import chalk7 from "chalk";

// src/api/kalshi/client.ts
import axios from "axios";
function createKalshiClient() {
  const apiKey = getConfigValue("kalshiApiKey");
  if (!apiKey) throw new Error("Kalshi API key required. Run: lifi config set --kalshi-key <key>  (get one at kalshi.com/api)");
  return axios.create({
    baseURL: "https://trading-api.kalshi.com/trade-api/v2",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }
  });
}

// src/api/kalshi/endpoints.ts
async function fetchKalshiMarkets(params = {}) {
  const client = createKalshiClient();
  const { data } = await client.get("/markets", {
    params: { limit: params.limit ?? 20, status: params.status ?? "open", ...params }
  });
  return data;
}
async function fetchKalshiMarket(ticker) {
  const client = createKalshiClient();
  const { data } = await client.get(`/markets/${ticker}`);
  return data;
}

// src/core/kalshi/kalshi.ts
function toMarket(m) {
  const yesProbability = (m.yes_bid + m.yes_ask) / 2 / 100;
  return {
    id: m.ticker,
    question: m.title,
    slug: m.ticker,
    endDate: m.close_time,
    liquidity: 0,
    volume: m.volume ?? 0,
    outcomes: ["Yes", "No"],
    prices: [yesProbability, 1 - yesProbability],
    active: m.status === "open"
  };
}
async function getKalshiMarkets(query, limit = 20) {
  const response = await fetchKalshiMarkets({ limit, status: "open" });
  const markets = response.markets.map(toMarket);
  if (!query) return markets;
  const q = query.toLowerCase();
  return markets.filter((m) => m.question.toLowerCase().includes(q));
}
async function getKalshiMarket(ticker) {
  try {
    const { market: m } = await fetchKalshiMarket(ticker);
    return toMarket(m);
  } catch {
    return null;
  }
}

// src/commands/kalshi.command.ts
function kalshiCommand() {
  const cmd = new Command6("kalshi").description("Browse Kalshi prediction markets");
  cmd.command("list").description("List open Kalshi markets").option("--query <query>", "filter by keyword").option("--limit <n>", "max results", "20").option("--json", "output as JSON").action(async (opts) => {
    try {
      const results = await withSpinner(
        "Fetching Kalshi markets...",
        () => getKalshiMarkets(opts.query, parseInt(opts.limit))
      );
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      if (!results.length) {
        console.log(chalk7.yellow("No markets found."));
        return;
      }
      console.log(makeTable(
        ["Ticker", "Question", "Yes", "No", "Volume", "Closes"],
        results.map((m) => [
          m.id,
          m.question.slice(0, 40) + (m.question.length > 40 ? ".." : ""),
          `${(m.prices[0] * 100).toFixed(1)}%`,
          `${(m.prices[1] * 100).toFixed(1)}%`,
          formatUSD(m.volume),
          m.endDate ? new Date(m.endDate).toLocaleDateString() : "n/a"
        ])
      ));
    } catch (err) {
      console.error(chalk7.red("Error:"), String(err));
      process.exit(1);
    }
  });
  cmd.command("get <ticker>").description("Get a market by ticker (e.g. FED-RATE-CUT-JUN26)").option("--json", "output as JSON").action(async (ticker, opts) => {
    try {
      const market = await withSpinner("Fetching market...", () => getKalshiMarket(ticker));
      if (!market) {
        console.error(chalk7.red(`Not found: ${ticker}`));
        process.exit(1);
      }
      if (opts.json) {
        console.log(JSON.stringify(market, null, 2));
        return;
      }
      console.log(makeTable(
        ["Field", "Value"],
        [
          ["Ticker", market.id],
          ["Question", market.question],
          ["Yes", `${(market.prices[0] * 100).toFixed(1)}%`],
          ["No", `${(market.prices[1] * 100).toFixed(1)}%`],
          ["Volume", formatUSD(market.volume)],
          ["Closes", market.endDate ? new Date(market.endDate).toLocaleDateString() : "n/a"]
        ]
      ));
    } catch (err) {
      console.error(chalk7.red("Error:"), String(err));
      process.exit(1);
    }
  });
  return cmd;
}

// src/commands/manifold.command.ts
import { Command as Command7 } from "commander";
import chalk8 from "chalk";

// src/api/manifold/client.ts
import axios2 from "axios";
var manifoldClient = axios2.create({
  baseURL: "https://api.manifold.markets",
  headers: { "Content-Type": "application/json" }
});

// src/api/manifold/endpoints.ts
async function fetchManifoldMarkets(params = {}) {
  const { data } = await manifoldClient.get("/v0/markets", {
    params: {
      limit: params.limit ?? 20,
      sort: params.sort ?? "created-time",
      ...params.term ? { term: params.term } : {}
    }
  });
  return data;
}
async function fetchManifoldMarket(slug) {
  const { data } = await manifoldClient.get(`/v0/slug/${slug}`);
  return data;
}

// src/core/manifold/manifold.ts
function toMarket2(m) {
  const prob = m.probability ?? 0.5;
  return {
    id: m.id,
    question: m.question,
    slug: m.slug,
    endDate: m.closeTime ? new Date(m.closeTime).toISOString() : "",
    liquidity: Object.values(m.pool ?? {}).reduce((a, b) => a + b, 0),
    volume: m.volume ?? 0,
    outcomes: m.outcomeType === "BINARY" ? ["Yes", "No"] : [m.outcomeType],
    prices: m.outcomeType === "BINARY" ? [prob, 1 - prob] : [1],
    active: !m.isResolved
  };
}
async function getManifoldMarkets(query, limit = 20) {
  const markets = await fetchManifoldMarkets({ limit, sort: "created-time", term: query });
  return markets.filter((m) => !m.isResolved && m.outcomeType === "BINARY").map(toMarket2);
}
async function getManifoldMarket(slug) {
  try {
    const m = await fetchManifoldMarket(slug);
    return toMarket2(m);
  } catch {
    return null;
  }
}

// src/commands/manifold.command.ts
function manifoldCommand() {
  const cmd = new Command7("manifold").description("Browse Manifold prediction markets");
  cmd.command("list").description("List open Manifold markets").option("--query <query>", "search by keyword").option("--limit <n>", "max results", "20").option("--json", "output as JSON").action(async (opts) => {
    try {
      const results = await withSpinner(
        "Fetching Manifold markets...",
        () => getManifoldMarkets(opts.query, parseInt(opts.limit))
      );
      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      if (!results.length) {
        console.log(chalk8.yellow("No markets found."));
        return;
      }
      console.log(makeTable(
        ["Question", "Prob", "Volume", "Closes"],
        results.map((m) => [
          m.question.slice(0, 52) + (m.question.length > 52 ? ".." : ""),
          `${(m.prices[0] * 100).toFixed(1)}%`,
          formatUSD(m.volume),
          m.endDate ? new Date(m.endDate).toLocaleDateString() : "n/a"
        ])
      ));
    } catch (err) {
      console.error(chalk8.red("Error:"), String(err));
      process.exit(1);
    }
  });
  cmd.command("get <slug>").description("Get a market by slug").option("--json", "output as JSON").action(async (slug, opts) => {
    try {
      const market = await withSpinner("Fetching market...", () => getManifoldMarket(slug));
      if (!market) {
        console.error(chalk8.red(`Not found: ${slug}`));
        process.exit(1);
      }
      if (opts.json) {
        console.log(JSON.stringify(market, null, 2));
        return;
      }
      console.log(makeTable(
        ["Field", "Value"],
        [
          ["Question", market.question],
          ["Probability", `${(market.prices[0] * 100).toFixed(1)}%`],
          ["Volume", formatUSD(market.volume)],
          ["Liquidity", formatUSD(market.liquidity)],
          ["Closes", market.endDate ? new Date(market.endDate).toLocaleDateString() : "n/a"]
        ]
      ));
    } catch (err) {
      console.error(chalk8.red("Error:"), String(err));
      process.exit(1);
    }
  });
  return cmd;
}

// src/commands/status.command.ts
import { Command as Command8 } from "commander";
import chalk9 from "chalk";
function statusCommand() {
  return new Command8("status").description("Check the status of a cross-chain transaction").argument("<txHash>", "transaction hash").option("--from-chain <chainId>", "source chain ID").option("--to-chain <chainId>", "destination chain ID").option("--json", "output as JSON").action(async (txHash, opts) => {
    try {
      const status = await withSpinner(
        "Checking status...",
        async () => getStatus(
          txHash,
          void 0,
          opts.fromChain ? parseInt(opts.fromChain) : void 0,
          opts.toChain ? parseInt(opts.toChain) : void 0
        )
      );
      if (opts.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      const color = status.status === "DONE" ? chalk9.green : status.status === "FAILED" ? chalk9.red : chalk9.yellow;
      console.log(makeTable(
        ["Field", "Value"],
        [
          ["Status", color(status.status)],
          ["Substatus", status.substatus ?? "n/a"],
          ["Sending tx", status.sending?.txHash ?? "n/a"],
          ["Receiving tx", status.receiving?.txHash ?? "n/a"]
        ]
      ));
    } catch (err) {
      console.error(chalk9.red("Error:"), String(err));
      process.exit(1);
    }
  });
}

// src/commands/wallet.command.ts
import { Command as Command9 } from "commander";
import chalk10 from "chalk";
function walletCommand() {
  const wallet = new Command9("wallet").description("Manage local wallets");
  wallet.command("create").description("Create a new wallet").requiredOption("--name <name>", "wallet label").option("--json", "output as JSON").action(async (opts) => {
    try {
      const w = await createWallet(opts.name);
      if (opts.json) {
        console.log(JSON.stringify(w, null, 2));
        return;
      }
      console.log(chalk10.green(`Wallet created: ${w.name}`));
      console.log(`Address: ${chalk10.cyan(w.address)}`);
      console.log(chalk10.dim("Private key stored in OS keychain."));
    } catch (err) {
      console.error(chalk10.red("Error:"), String(err));
      process.exit(1);
    }
  });
  wallet.command("import").description("Import a wallet from a private key").requiredOption("--name <name>", "wallet label").requiredOption("--key <key>", "private key (0x...)").option("--json", "output as JSON").action(async (opts) => {
    try {
      const w = await importWallet(opts.name, opts.key);
      if (opts.json) {
        console.log(JSON.stringify(w, null, 2));
        return;
      }
      console.log(chalk10.green(`Wallet imported: ${w.name}`));
      console.log(`Address: ${chalk10.cyan(w.address)}`);
    } catch (err) {
      console.error(chalk10.red("Error:"), String(err));
      process.exit(1);
    }
  });
  wallet.command("list").description("List all local wallets").option("--json", "output as JSON").action((opts) => {
    const wallets = listWallets();
    if (opts.json) {
      console.log(JSON.stringify(wallets, null, 2));
      return;
    }
    if (wallets.length === 0) {
      console.log(chalk10.yellow("No wallets found. Run: lifi wallet create --name <name>"));
      return;
    }
    console.log(makeTable(
      ["Name", "Address", "Created"],
      wallets.map((w) => [w.name, w.address, new Date(w.createdAt).toLocaleDateString()])
    ));
  });
  return wallet;
}

// src/commands/agent.command.ts
import { Command as Command10 } from "commander";
import chalk12 from "chalk";

// src/core/agent/agent.ts
import readline from "readline";
import chalk11 from "chalk";

// src/api/openrouter/client.ts
import OpenAI from "openai";
function createOpenRouterClient() {
  const apiKey = getConfigValue("openrouterApiKey");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set. Run: lifi config set --openrouter-key <key>");
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/lifi-cli",
      "X-Title": "lifi-cli"
    }
  });
}

// src/core/agent/tools.ts
var AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_bridge_quote",
      description: "Get a quote to bridge tokens from one chain to another using LI.FI",
      parameters: {
        type: "object",
        properties: {
          fromChain: { type: "string", description: "Source chain name or ID (e.g. ethereum, base, arbitrum)" },
          toChain: { type: "string", description: "Destination chain name or ID" },
          fromToken: { type: "string", description: "Token symbol or address to send" },
          toToken: { type: "string", description: "Token symbol or address to receive" },
          amount: { type: "string", description: "Amount in smallest unit (wei for ETH, 1e6 for 1 USDC)" },
          fromAddress: { type: "string", description: "Sender wallet address" }
        },
        required: ["fromChain", "toChain", "fromToken", "toToken", "amount", "fromAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_swap_quote",
      description: "Get a quote to swap tokens on a single chain using LI.FI",
      parameters: {
        type: "object",
        properties: {
          chain: { type: "string", description: "Chain name or ID" },
          fromToken: { type: "string", description: "Token to swap from" },
          toToken: { type: "string", description: "Token to swap to" },
          amount: { type: "string", description: "Amount in smallest unit" },
          fromAddress: { type: "string", description: "Wallet address" }
        },
        required: ["chain", "fromToken", "toToken", "amount", "fromAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_earn_quote",
      description: "Get a quote to deposit tokens into a yield protocol via LI.FI Composer",
      parameters: {
        type: "object",
        properties: {
          protocol: { type: "string", description: "Protocol symbol (e.g. morpho-usdc, aave-usdc, lido-wsteth)" },
          token: { type: "string", description: "Token to deposit" },
          amount: { type: "string", description: "Amount in smallest unit" },
          chain: { type: "string", description: "Chain name or ID" },
          fromAddress: { type: "string", description: "Wallet address" }
        },
        required: ["protocol", "token", "amount", "chain", "fromAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_earn_protocols",
      description: "List all yield protocols supported by LI.FI Composer",
      parameters: {
        type: "object",
        properties: {
          chain: { type: "string", description: "Filter by chain name or ID (optional)" },
          category: { type: "string", enum: ["vault", "lending", "staking", "yield"], description: "Filter by category (optional)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_markets",
      description: "List active prediction markets on Polymarket",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query to filter markets by title (optional)" },
          limit: { type: "number", description: "Max number of markets to return (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tx_status",
      description: "Check the status of a cross-chain transaction",
      parameters: {
        type: "object",
        properties: {
          txHash: { type: "string", description: "Transaction hash" },
          fromChain: { type: "number", description: "Source chain ID" },
          toChain: { type: "number", description: "Destination chain ID" }
        },
        required: ["txHash"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_kalshi_markets",
      description: "List open Kalshi prediction markets",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Keyword filter (optional)" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_manifold_markets",
      description: "List open Manifold prediction markets",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (optional)" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  }
];

// src/core/agent/agent.ts
var DEFAULT_SYSTEM = `You are a DeFi assistant with access to LI.FI tools for bridging, swapping, earning yield, and checking prediction markets on Polymarket, Kalshi, and Manifold. Help users move and grow their crypto. Always confirm transaction details before executing. Present amounts in human-readable form.`;
async function dispatchTool(name, args) {
  try {
    switch (name) {
      case "get_bridge_quote": {
        const q = await getBridgeQuote(args);
        return JSON.stringify(q, null, 2);
      }
      case "get_swap_quote": {
        const q = await getSwapQuote(args);
        return JSON.stringify(q, null, 2);
      }
      case "get_earn_quote": {
        const q = await getEarnQuote(args);
        return JSON.stringify(q, null, 2);
      }
      case "list_earn_protocols": {
        const chainId = args.chain ? CHAIN_IDS[String(args.chain).toLowerCase()] : void 0;
        const protocols = listProtocols({ chain: chainId, category: args.category });
        return JSON.stringify(protocols, null, 2);
      }
      case "list_markets": {
        const markets = await getMarkets(args.query, args.limit ?? 20);
        return JSON.stringify(markets.slice(0, 10), null, 2);
      }
      case "list_kalshi_markets": {
        const markets = await getKalshiMarkets(args.query, args.limit ?? 20);
        return JSON.stringify(markets.slice(0, 10), null, 2);
      }
      case "list_manifold_markets": {
        const markets = await getManifoldMarkets(args.query, args.limit ?? 20);
        return JSON.stringify(markets.slice(0, 10), null, 2);
      }
      case "get_tx_status": {
        const status = await getStatus(args.txHash, void 0, args.fromChain, args.toChain);
        return JSON.stringify(status, null, 2);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
async function runAgent(config) {
  const client = createOpenRouterClient();
  const messages = [
    { role: "system", content: config.systemPrompt ?? DEFAULT_SYSTEM }
  ];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => new Promise((resolve) => rl.question(chalk11.cyan("you> "), resolve));
  printAgentBanner(config.model);
  while (true) {
    const userInput = await prompt();
    if (!userInput.trim()) continue;
    messages.push({ role: "user", content: userInput });
    let response = await client.chat.completions.create({
      model: config.model,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: "auto"
    });
    let message = response.choices[0].message;
    while (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);
      for (const call of message.tool_calls) {
        if (call.type !== "function") continue;
        const args = JSON.parse(call.function.arguments);
        console.log(chalk11.dim(`  [tool] ${call.function.name}(${JSON.stringify(args)})`));
        const result = await dispatchTool(call.function.name, args);
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
      response = await client.chat.completions.create({
        model: config.model,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto"
      });
      message = response.choices[0].message;
    }
    messages.push(message);
    console.log(chalk11.green("agent> ") + (message.content ?? ""));
    console.log();
  }
}

// src/commands/agent.command.ts
function agentCommand() {
  return new Command10("agent").description("Start an interactive AI agent with LI.FI tools (powered by OpenRouter)").option("--model <model>", "OpenRouter model ID", "anthropic/claude-3.5-sonnet").option("--system <prompt>", "override system prompt").action(async (opts) => {
    try {
      await runAgent({
        model: opts.model,
        systemPrompt: opts.system
      });
    } catch (err) {
      if (String(err).includes("OPENROUTER_API_KEY")) {
        console.error(chalk12.red("Error:"), String(err));
        console.log(chalk12.dim("Set your key: lifi config set --openrouter-key <key>"));
      } else {
        console.error(chalk12.red("Error:"), String(err));
      }
      process.exit(1);
    }
  });
}

// src/commands/config.command.ts
import { Command as Command11 } from "commander";
import chalk13 from "chalk";
function configCommand() {
  const config = new Command11("config").description("Manage CLI configuration");
  config.command("set").description("Set configuration values").option("--api-key <key>", "LI.FI API key").option("--openrouter-key <key>", "OpenRouter API key").option("--polymarket-key <key>", "Polymarket API key").option("--kalshi-key <key>", "Kalshi API key (kalshi.com/api)").option("--chain <chain>", "default chain").option("--wallet <name>", "default wallet name").action((opts) => {
    const updates = {};
    if (opts.apiKey) updates.lifiApiKey = opts.apiKey;
    if (opts.openrouterKey) updates.openrouterApiKey = opts.openrouterKey;
    if (opts.polymarketKey) updates.polymarketApiKey = opts.polymarketKey;
    if (opts.kalshiKey) updates.kalshiApiKey = opts.kalshiKey;
    if (opts.chain) updates.defaultChain = opts.chain;
    if (opts.wallet) updates.defaultWallet = opts.wallet;
    if (Object.keys(updates).length === 0) {
      console.log(chalk13.yellow("No values provided. Use --help to see options."));
      return;
    }
    saveConfig(updates);
    console.log(chalk13.green("Config updated."));
  });
  config.command("show").description("Show current configuration").action(() => {
    const cfg = loadConfig();
    const display = {
      ...cfg,
      lifiApiKey: cfg.lifiApiKey ? `${cfg.lifiApiKey.slice(0, 6)}...` : void 0,
      openrouterApiKey: cfg.openrouterApiKey ? `${cfg.openrouterApiKey.slice(0, 6)}...` : void 0,
      polymarketApiKey: cfg.polymarketApiKey ? `${cfg.polymarketApiKey.slice(0, 6)}...` : void 0,
      kalshiApiKey: cfg.kalshiApiKey ? `${cfg.kalshiApiKey.slice(0, 6)}...` : void 0
    };
    console.log(JSON.stringify(display, null, 2));
  });
  return config;
}

// src/commands/mcp.command.ts
import { Command as Command12 } from "commander";
function mcpCommand() {
  return new Command12("mcp").description("Start MCP server over stdio (for Claude Code, Cursor, etc.)").action(async () => {
    const { startMcpServer } = await import("./server-3YFM74E3.mjs");
    await startMcpServer();
  });
}

// src/cli.ts
var VERSION = "0.1.0";
var program = new Command13();
program.name("lifi").description("LI.FI CLI \u2014 bridge, swap, earn, and bet from the terminal.").version(VERSION).action(() => {
  printClibanner(VERSION);
  program.help();
});
program.addCommand(bridgeCommand());
program.addCommand(swapCommand());
program.addCommand(earnCommand());
program.addCommand(marketsCommand());
program.addCommand(polymarketCommand());
program.addCommand(kalshiCommand());
program.addCommand(manifoldCommand());
program.addCommand(statusCommand());
program.addCommand(walletCommand());
program.addCommand(agentCommand());
program.addCommand(configCommand());
program.addCommand(mcpCommand());
program.parse();
//# sourceMappingURL=cli.mjs.map