// src/api/lifi/client.ts
import axios from "axios";

// src/config/config.ts
import fs from "fs";

// src/config/defaults.ts
var LIFI_API_BASE = "https://li.quest/v1";
var CHAIN_IDS = {
  ethereum: 1,
  eth: 1,
  arbitrum: 42161,
  base: 8453,
  optimism: 10,
  polygon: 137,
  matic: 137,
  bsc: 56,
  avalanche: 43114,
  avax: 43114
};
var CHAIN_NAMES = Object.fromEntries(
  Object.entries(CHAIN_IDS).map(([name, id]) => [id, name])
);
var NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";
var DEFAULT_CHAIN = "base";
var CONFIG_DIR = `${process.env.HOME}/.lifi`;
var CONFIG_FILE = `${CONFIG_DIR}/config.json`;
var WALLETS_DIR = `${CONFIG_DIR}/wallets`;

// src/config/config.ts
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}
function loadConfig() {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveConfig(updates) {
  ensureConfigDir();
  const current = loadConfig();
  const next = { ...current, ...updates };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2));
}
function getConfigValue(key) {
  const envMap = {
    lifiApiKey: "LIFI_API_KEY",
    openrouterApiKey: "OPENROUTER_API_KEY",
    polymarketApiKey: "POLYMARKET_API_KEY",
    kalshiApiKey: "KALSHI_API_KEY",
    defaultChain: "DEFAULT_CHAIN",
    defaultWallet: "DEFAULT_WALLET",
    agentProvider: "AGENT_PROVIDER",
    agentModel: "AGENT_MODEL",
    agentApiKey: "AGENT_API_KEY",
    agentBaseUrl: "AGENT_BASE_URL",
    telegramBotToken: "TELEGRAM_BOT_TOKEN",
    telegramChatId: "TELEGRAM_CHAT_ID"
  };
  const fromEnv = process.env[envMap[key]];
  if (fromEnv) return fromEnv;
  return loadConfig()[key];
}
function resolveChain(chain) {
  return chain ?? getConfigValue("defaultChain") ?? "base";
}

// src/api/lifi/client.ts
function createLifiClient() {
  const apiKey = getConfigValue("lifiApiKey");
  return axios.create({
    baseURL: LIFI_API_BASE,
    headers: {
      "Content-Type": "application/json",
      ...apiKey ? { "x-lifi-api-key": apiKey } : {}
    }
  });
}

// src/api/lifi/endpoints.ts
var client = createLifiClient();
async function getQuote(params) {
  const { data } = await client.get("/quote", { params });
  return data;
}
async function getStatus(txHash, bridge, fromChain, toChain) {
  const { data } = await client.get("/status", { params: { txHash, bridge, fromChain, toChain } });
  return data;
}

// src/core/bridge/bridge.ts
function resolveChainId(chain) {
  if (typeof chain === "number") return chain;
  const id = CHAIN_IDS[chain.toLowerCase()];
  if (!id) throw new Error(`Unknown chain: ${chain}`);
  return id;
}
async function getBridgeQuote(params) {
  const fromChain = resolveChainId(params.fromChain);
  const toChain = resolveChainId(params.toChain);
  const response = await getQuote({
    fromChain,
    toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress ?? params.fromAddress,
    slippage: params.slippage ?? 5e-3
  });
  return {
    id: response.id,
    fromChain,
    toChain,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    toAmountMin: response.estimate.toAmountMin,
    fromDecimals: response.action.fromToken?.decimals ?? 18,
    toDecimals: response.action.toToken?.decimals ?? 18,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amountUSD ?? "0",
    tool: response.toolDetails?.name ?? response.tool ?? "unknown",
    transactionRequest: response.transactionRequest,
    approvalAddress: response.estimate.approvalAddress
  };
}

// src/core/swap/swap.ts
function resolveChainId2(chain) {
  if (typeof chain === "number") return chain;
  const id = CHAIN_IDS[chain.toLowerCase()];
  if (!id) throw new Error(`Unknown chain: ${chain}`);
  return id;
}
async function getSwapQuote(params) {
  const chainId = resolveChainId2(params.chain);
  const response = await getQuote({
    fromChain: chainId,
    toChain: chainId,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    slippage: params.slippage ?? 5e-3
  });
  return {
    id: response.id,
    chain: chainId,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    toAmountMin: response.estimate.toAmountMin,
    fromDecimals: response.action.fromToken?.decimals ?? 18,
    toDecimals: response.action.toToken?.decimals ?? 18,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amountUSD ?? "0",
    tool: response.toolDetails?.name ?? response.tool ?? "unknown",
    transactionRequest: response.transactionRequest,
    approvalAddress: response.estimate.approvalAddress
  };
}

// src/api/lifi/earn.ts
import axios2 from "axios";
var EARN_API_BASE = "https://earn.li.fi/v1/earn";
function createEarnClient() {
  const apiKey = getConfigValue("lifiApiKey");
  return axios2.create({
    baseURL: EARN_API_BASE,
    headers: {
      "Content-Type": "application/json",
      ...apiKey ? { "x-lifi-api-key": apiKey } : {}
    }
  });
}
var client2 = createEarnClient();
async function listVaults(params) {
  const { data } = await client2.get("/vaults", { params });
  return data;
}
async function getVault(chainId, address) {
  const { data } = await client2.get(`/vaults/${chainId}/${address}`);
  return data;
}
async function listEarnProtocols() {
  const { data } = await client2.get("/protocols");
  return Array.isArray(data) ? data : data.protocols ?? [];
}
async function getPortfolio(userAddress) {
  const { data } = await client2.get(`/portfolio/${userAddress}/positions`);
  return data;
}

// src/core/earn/earn.ts
function resolveChainId3(chain) {
  if (typeof chain === "number") return chain;
  const id = CHAIN_IDS[chain.toLowerCase()];
  if (!id) throw new Error(`Unknown chain: ${chain}`);
  return id;
}
async function resolveVault(protocol, chainId, token) {
  if (protocol.startsWith("0x")) {
    return getVault(chainId, protocol);
  }
  const params = { chainId, protocol, limit: 5 };
  if (token) params.underlyingToken = token;
  const { data: vaults } = await listVaults(params);
  if (!vaults.length) {
    throw new Error(
      `No vault found for protocol "${protocol}" on chain ${chainId}. Run 'lifi-cli earn vaults' to see available vaults.`
    );
  }
  if (token) {
    const match = vaults.find(
      (v) => v.underlyingTokens.some((t) => t.symbol.toLowerCase() === token.toLowerCase())
    );
    if (match) return match;
  }
  return vaults[0];
}
async function getEarnQuote(params) {
  const chainId = resolveChainId3(params.chain);
  const vault = await resolveVault(params.protocol, chainId, params.token);
  const response = await getQuote({
    fromChain: chainId,
    toChain: vault.chainId,
    fromToken: params.token,
    toToken: vault.address,
    // vault address IS the toToken
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress
  });
  const apy = vault.analytics?.apy?.total ?? null;
  const underlying = vault.underlyingTokens[0];
  return {
    protocol: vault.name,
    vaultSlug: vault.slug,
    vaultAddress: vault.address,
    fromToken: underlying?.symbol ?? params.token,
    toToken: vault.name,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    estimatedApy: apy,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amountUSD ?? "0",
    transactionRequest: response.transactionRequest,
    approvalAddress: response.estimate.approvalAddress
  };
}
async function fetchVaults(params) {
  return listVaults(params);
}
async function fetchVault(chainId, address) {
  return getVault(chainId, address);
}
async function fetchEarnProtocols() {
  return listEarnProtocols();
}
async function fetchPortfolio(userAddress) {
  return getPortfolio(userAddress);
}

// src/api/polymarket/client.ts
import axios3 from "axios";
var POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";
function createGammaClient() {
  return axios3.create({ baseURL: POLYMARKET_GAMMA_API });
}

// src/api/polymarket/endpoints.ts
var gamma = createGammaClient();
async function searchEvents(query, limit = 20) {
  const { data } = await gamma.get("/events", {
    params: {
      limit,
      active: true,
      closed: false,
      order: "volume",
      ascending: false,
      ...query ? { title: query } : {}
    }
  });
  return data;
}
async function getEvent(slug) {
  const { data } = await gamma.get(`/events/slug/${slug}`);
  return data;
}

// src/core/markets/polymarket/polymarket.ts
function parseOutcomes(market) {
  try {
    const outcomes = JSON.parse(market.outcomes);
    const prices = JSON.parse(market.outcomePrices).map(Number);
    return { outcomes, prices };
  } catch {
    return { outcomes: [], prices: [] };
  }
}
async function getMarkets(query, limit = 20) {
  const events = await searchEvents(query, limit);
  const markets = [];
  for (const event of events) {
    for (const m of event.markets ?? []) {
      if (!m.active || m.closed) continue;
      const { outcomes, prices } = parseOutcomes(m);
      markets.push({
        id: m.conditionId,
        question: m.question,
        slug: m.slug,
        endDate: m.endDate,
        liquidity: m.liquidity,
        volume: m.volume,
        outcomes,
        prices,
        active: m.active
      });
    }
  }
  return markets.slice(0, limit);
}
async function getMarketBySlug(slug) {
  try {
    const event = await getEvent(slug);
    const m = event.markets?.[0];
    if (!m) return null;
    const { outcomes, prices } = parseOutcomes(m);
    return {
      id: m.conditionId,
      question: m.question,
      slug: m.slug,
      endDate: m.endDate,
      liquidity: m.liquidity,
      volume: m.volume,
      outcomes,
      prices,
      active: m.active
    };
  } catch {
    return null;
  }
}

// src/core/agent/agent.ts
import readline from "readline";
import chalk2 from "chalk";

// src/display/banner.ts
import chalk from "chalk";
function printAgentBanner(model) {
  const lines = [
    "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
    "\u2502                                                         \u2502",
    "\u2502   lifi-cli agent                                        \u2502",
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

// src/api/openrouter/client.ts
import OpenAI from "openai";
function createOpenRouterClient() {
  const apiKey = getConfigValue("openrouterApiKey");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set. Run: lifi-cli config set --openrouter-key <key>");
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/lifi-cli",
      "X-Title": "lifi-cli"
    }
  });
}
function createAgentClient(provider, apiKey, baseUrl) {
  const isOpenRouter = provider === "openrouter";
  return new OpenAI({
    apiKey: apiKey || "ollama",
    baseURL: baseUrl,
    ...isOpenRouter ? {
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/lifi-cli",
        "X-Title": "lifi-cli"
      }
    } : {}
  });
}

// src/core/agent/format.ts
import Table from "cli-table3";
function stripEmoji(text) {
  return text.replace(
    /[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
    ""
  );
}
function parseMarkdownTable(lines) {
  if (lines.length < 3) return null;
  const parseCells = (line) => line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
  const isSeparator = (line) => /^\|[-:| ]+\|$/.test(line.trim());
  const header = parseCells(lines[0]);
  if (!header.length) return null;
  if (!isSeparator(lines[1])) return null;
  const rows = lines.slice(2).map(parseCells).filter((r) => r.length > 0);
  if (!rows.length) return null;
  const table = new Table({
    head: header,
    style: { head: ["cyan"], border: ["dim"] }
  });
  for (const row of rows) {
    table.push(row);
  }
  return table.toString();
}
function formatAgentResponse(text) {
  const lines = text.split("\n");
  const output = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const rendered = parseMarkdownTable(tableLines);
      if (rendered) {
        output.push(rendered);
      } else {
        for (const tl of tableLines) {
          output.push(cleanLine(tl));
        }
      }
      continue;
    }
    output.push(cleanLine(line));
    i++;
  }
  return output.join("\n");
}
function cleanLine(line) {
  let s = line;
  s = stripEmoji(s);
  s = s.replace(/^#{1,6}\s+/, "");
  s = s.replace(/\*\*(.+?)\*\*/g, "$1");
  s = s.replace(/\*(.+?)\*/g, "$1");
  s = s.replace(/__(.+?)__/g, "$1");
  s = s.replace(/_(.+?)_/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  return s;
}

// src/api/kalshi/client.ts
import axios4 from "axios";
function createKalshiClient() {
  const apiKey = getConfigValue("kalshiApiKey");
  if (!apiKey) throw new Error("Kalshi API key required. Run: lifi-cli config set --kalshi-key <key>  (get one at kalshi.com/api)");
  return axios4.create({
    baseURL: "https://trading-api.kalshi.com/trade-api/v2",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }
  });
}

// src/api/kalshi/endpoints.ts
async function fetchKalshiMarkets(params = {}) {
  const client3 = createKalshiClient();
  const { data } = await client3.get("/markets", {
    params: { limit: params.limit ?? 20, status: params.status ?? "open", ...params }
  });
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

// src/api/manifold/client.ts
import axios5 from "axios";
var manifoldClient = axios5.create({
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

// src/core/wallet/wallet.ts
import fs3 from "fs";
import path2 from "path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// src/core/wallet/keychain.ts
import fs2 from "fs";
import path from "path";
import os from "os";
var VAULT_DIR = path.join(os.homedir(), ".lifi-cli");
var VAULT_FILE = path.join(VAULT_DIR, "secrets.json");
function loadVault() {
  if (!fs2.existsSync(VAULT_FILE)) return {};
  try {
    return JSON.parse(fs2.readFileSync(VAULT_FILE, "utf-8"));
  } catch {
    return {};
  }
}
function saveVault(vault) {
  fs2.mkdirSync(VAULT_DIR, { recursive: true, mode: 448 });
  fs2.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), { mode: 384 });
}
async function storeSecret(account, secret) {
  const vault = loadVault();
  vault[account] = secret;
  saveVault(vault);
}
async function getSecret(account) {
  return loadVault()[account] ?? null;
}

// src/core/wallet/wallet.ts
var WALLET_INDEX = path2.join(WALLETS_DIR, "index.json");
function ensureWalletsDir() {
  if (!fs3.existsSync(WALLETS_DIR)) fs3.mkdirSync(WALLETS_DIR, { recursive: true });
}
function readIndex() {
  ensureWalletsDir();
  if (!fs3.existsSync(WALLET_INDEX)) return [];
  try {
    return JSON.parse(fs3.readFileSync(WALLET_INDEX, "utf-8"));
  } catch {
    return [];
  }
}
function writeIndex(wallets) {
  ensureWalletsDir();
  fs3.writeFileSync(WALLET_INDEX, JSON.stringify(wallets, null, 2));
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

// src/api/telegram/client.ts
var BASE = "https://api.telegram.org/bot";
async function call(token, method, body) {
  const res = await fetch(`${BASE}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description ?? `Telegram API error on ${method}`);
  return data.result;
}
async function sendMessage(token, chatId, text) {
  await call(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}

// src/api/telegram/notify.ts
async function notify(text) {
  const token = getConfigValue("telegramBotToken");
  const chatId = getConfigValue("telegramChatId");
  if (!token || !chatId) return;
  try {
    await sendMessage(token, chatId, text);
  } catch {
  }
}
function txNotification(opts) {
  const labels = { bridge: "Bridge", swap: "Swap", earn: "Earn deposit" };
  const chains = {
    1: "Ethereum",
    8453: "Base",
    42161: "Arbitrum",
    10: "Optimism",
    137: "Polygon",
    56: "BSC",
    43114: "Avalanche"
  };
  const chain = chains[opts.chainId] ?? `Chain ${opts.chainId}`;
  const lines = [
    `<b>lifi-cli</b> \u2014 ${labels[opts.type]} submitted`,
    opts.detail ? opts.detail : "",
    `Chain: ${chain}`,
    `Tx: <code>${opts.txHash}</code>`,
    `<i>Run: lifi-cli status ${opts.txHash}</i>`
  ].filter(Boolean);
  return lines.join("\n");
}

// src/core/wallet/executor.ts
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
async function executeTransaction(tx, walletName, notifyOpts) {
  const privateKey = await getWalletKey(walletName);
  const account = privateKeyToAccount2(privateKey);
  const chain = getViemChain(tx.chainId);
  const client3 = createWalletClient({ account, chain, transport: http() });
  const hash = await client3.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    gas: tx.gasLimit
  });
  if (notifyOpts) {
    await notify(txNotification({ ...notifyOpts, txHash: hash, chainId: tx.chainId }));
  }
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
      name: "list_earn_vaults",
      description: "List yield vaults available on LI.FI Earn with live APY and TVL",
      parameters: {
        type: "object",
        properties: {
          chainId: { type: "number", description: "Filter by chain ID as a number (e.g. 8453 for Base, 1 for Ethereum, 42161 for Arbitrum, 10 for Optimism)" },
          protocol: { type: "string", description: "Filter by protocol slug (optional)" },
          underlyingToken: { type: "string", description: "Filter by underlying token symbol (optional)" },
          category: { type: "string", enum: ["vault", "lending", "staking", "yield"], description: "Filter by category (optional)" },
          limit: { type: "number", description: "Max results (default 20)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_earn_protocols",
      description: "List protocols with active vaults on LI.FI Earn",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_earn_portfolio",
      description: "Get all active DeFi positions (yield deposits) for a wallet address",
      parameters: {
        type: "object",
        properties: {
          userAddress: { type: "string", description: "Wallet address (0x...)" }
        },
        required: ["userAddress"]
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
      name: "dryrun_bridge",
      description: "Simulate a cross-chain bridge without submitting \u2014 returns route, gas, approval requirements",
      parameters: {
        type: "object",
        properties: {
          fromChain: { type: "string", description: "Source chain name or ID" },
          toChain: { type: "string", description: "Destination chain name or ID" },
          fromToken: { type: "string", description: "Token to send" },
          toToken: { type: "string", description: "Token to receive" },
          amount: { type: "string", description: "Amount in token units" },
          fromAddress: { type: "string", description: "Sender address (0x...)" },
          slippage: { type: "number", description: "Slippage tolerance (default 0.005)" }
        },
        required: ["fromChain", "toChain", "fromToken", "toToken", "amount", "fromAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "dryrun_swap",
      description: "Simulate a single-chain token swap without submitting \u2014 returns route, price impact, gas",
      parameters: {
        type: "object",
        properties: {
          chain: { type: "string", description: "Chain name or ID" },
          fromToken: { type: "string", description: "Token to swap from" },
          toToken: { type: "string", description: "Token to swap to" },
          amount: { type: "string", description: "Amount in token units" },
          fromAddress: { type: "string", description: "Sender address (0x...)" },
          slippage: { type: "number", description: "Slippage tolerance (default 0.005)" }
        },
        required: ["chain", "fromToken", "toToken", "amount", "fromAddress"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "dryrun_earn",
      description: "Simulate a yield vault deposit without submitting \u2014 returns APY, TVL, projected yield, gas",
      parameters: {
        type: "object",
        properties: {
          protocol: { type: "string", description: "Protocol slug or vault address (0x...)" },
          token: { type: "string", description: "Token to deposit" },
          amount: { type: "string", description: "Amount in smallest unit" },
          chain: { type: "string", description: "Chain name or ID" },
          fromAddress: { type: "string", description: "Sender address (0x...)" }
        },
        required: ["protocol", "token", "amount", "chain", "fromAddress"]
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
  },
  {
    type: "function",
    function: {
      name: "get_wallet_address",
      description: "Get the public address of a saved wallet by name",
      parameters: {
        type: "object",
        properties: {
          walletName: { type: "string", description: "Wallet name (from lifi-cli wallet list)" }
        },
        required: ["walletName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_bridge",
      description: "Execute a cross-chain bridge transaction using a saved wallet. Always show the quote details and ask user to confirm before calling this.",
      parameters: {
        type: "object",
        properties: {
          fromChain: { type: "string", description: "Source chain name or ID" },
          toChain: { type: "string", description: "Destination chain name or ID" },
          fromToken: { type: "string", description: "Token to send" },
          toToken: { type: "string", description: "Token to receive" },
          amount: { type: "string", description: "Amount in smallest unit" },
          walletName: { type: "string", description: "Saved wallet name to sign with" },
          slippage: { type: "number", description: "Slippage tolerance (default 0.005)" }
        },
        required: ["fromChain", "toChain", "fromToken", "toToken", "amount", "walletName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_swap",
      description: "Execute a token swap on a single chain using a saved wallet. Always show the quote details and ask user to confirm before calling this.",
      parameters: {
        type: "object",
        properties: {
          chain: { type: "string", description: "Chain name or ID" },
          fromToken: { type: "string", description: "Token to swap from" },
          toToken: { type: "string", description: "Token to swap to" },
          amount: { type: "string", description: "Amount in smallest unit" },
          walletName: { type: "string", description: "Saved wallet name to sign with" },
          slippage: { type: "number", description: "Slippage tolerance (default 0.005)" }
        },
        required: ["chain", "fromToken", "toToken", "amount", "walletName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "execute_earn",
      description: "Execute a yield vault deposit using a saved wallet. Always show the quote details and ask user to confirm before calling this.",
      parameters: {
        type: "object",
        properties: {
          protocol: { type: "string", description: "Protocol slug or vault address (0x...)" },
          token: { type: "string", description: "Token to deposit" },
          amount: { type: "string", description: "Amount in smallest unit" },
          chain: { type: "string", description: "Chain name or ID" },
          walletName: { type: "string", description: "Saved wallet name to sign with" }
        },
        required: ["protocol", "token", "amount", "chain", "walletName"]
      }
    }
  }
];

// src/core/agent/agent.ts
var DEFAULT_SYSTEM = `You are lifi-cli agent \u2014 a terminal DeFi assistant. You ONLY discuss DeFi, crypto, and the tools listed below. Do not respond to unrelated topics.

YOUR TOOLS (call these functions to answer user requests):
- get_wallet_address: resolve a wallet name to its public address (walletName)
- get_bridge_quote: get a cross-chain bridge quote (fromChain, toChain, fromToken, toToken, amount, fromAddress)
- get_swap_quote: get a same-chain token swap quote (chain, fromToken, toToken, amount, fromAddress)
- get_earn_quote: get a yield deposit quote via LI.FI Composer (protocol, token, amount, chain, fromAddress)
- list_earn_vaults: browse yield vaults (chainId as number e.g. 8453, protocol slug, underlyingToken symbol, limit \u2014 omit filters you don't need)
- list_earn_protocols: list all supported yield protocols (no args)
- get_earn_portfolio: show active yield positions for a wallet (userAddress)
- list_markets: list Polymarket prediction markets (query, limit)
- list_kalshi_markets: list Kalshi prediction markets (query, limit)
- list_manifold_markets: list Manifold prediction markets (query, limit)
- dryrun_bridge: simulate a bridge without submitting
- dryrun_swap: simulate a swap without submitting
- dryrun_earn: simulate an earn deposit with projected APY and yield estimates
- get_tx_status: check cross-chain transaction status (txHash, fromChain, toChain)
- execute_bridge: sign and submit a bridge transaction (fromChain, toChain, fromToken, toToken, amount, walletName)
- execute_swap: sign and submit a swap transaction (chain, fromToken, toToken, amount, walletName)
- execute_earn: sign and submit a yield deposit (protocol, token, amount, chain, walletName)

EXECUTION RULES \u2014 mandatory, never skip:
1. Before calling execute_*, always call the matching quote tool first and show the user the result.
2. After showing the quote, explicitly ask the user to confirm with "yes" before calling execute_*.
3. Only call execute_* after the user has confirmed. The terminal will also prompt for confirmation.
4. Never guess wallet names \u2014 call get_wallet_address first if you need the address.

RULES:
- Always call a tool before answering data questions. Never make up token prices, APYs, or market data.
- When asked "what tools do you have", list the tools above exactly.
- Present token amounts in human-readable form (e.g. "100 USDC" not "100000000").

FORMATTING \u2014 follow exactly, no exceptions:
- Plain text only. No markdown.
- No asterisks, no underscores, no pound signs.
- No emoji.
- Tables: pipe format only (| col | col |) \u2014 the terminal renders these.
- Lists: use dash (-) not asterisk.
- Concise. Every line must earn its place.`;
async function confirm(rl, summary) {
  return new Promise((resolve) => {
    console.log();
    console.log(chalk2.yellow("  -- confirm transaction --"));
    console.log(chalk2.dim(summary));
    console.log();
    rl.question(chalk2.bold('  Type "yes" to proceed: '), (ans) => {
      console.log();
      resolve(ans.trim().toLowerCase() === "yes");
    });
  });
}
async function dispatchTool(name, args, rl) {
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
        const earnArgs = { ...args };
        const addr = earnArgs.fromAddress;
        if (!addr || addr === "wallet_address" || addr === "your_wallet_address") {
          earnArgs.fromAddress = "0x0000000000000000000000000000000000000001";
        }
        const q = await getEarnQuote(earnArgs);
        return JSON.stringify(q, null, 2);
      }
      case "list_earn_vaults": {
        const vaultArgs = { ...args };
        if (typeof vaultArgs.chainId === "string") {
          const resolved = CHAIN_IDS[vaultArgs.chainId.toLowerCase()];
          if (resolved) vaultArgs.chainId = resolved;
          else {
            const n = parseInt(vaultArgs.chainId);
            if (!isNaN(n)) vaultArgs.chainId = n;
          }
        }
        for (const k of Object.keys(vaultArgs)) {
          if (vaultArgs[k] === "" || vaultArgs[k] === null) delete vaultArgs[k];
        }
        delete vaultArgs.category;
        const result = await fetchVaults(vaultArgs);
        return JSON.stringify(result, null, 2);
      }
      case "list_earn_protocols": {
        const protocols = await fetchEarnProtocols();
        return JSON.stringify(protocols, null, 2);
      }
      case "get_earn_portfolio": {
        const portfolio = await fetchPortfolio(args.userAddress);
        return JSON.stringify(portfolio, null, 2);
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
      case "dryrun_bridge": {
        const q = await getBridgeQuote({
          fromChain: args.fromChain,
          toChain: args.toChain,
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          fromAddress: args.fromAddress,
          slippage: args.slippage ?? 5e-3
        });
        return JSON.stringify({ dryRun: true, type: "bridge", quote: q }, null, 2);
      }
      case "dryrun_swap": {
        const q = await getSwapQuote({
          chain: args.chain,
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          fromAddress: args.fromAddress,
          slippage: args.slippage ?? 5e-3
        });
        const priceImpact = q.toAmountMin && q.toAmount ? ((1 - parseFloat(q.toAmountMin) / parseFloat(q.toAmount)) * 100).toFixed(3) : null;
        return JSON.stringify({ dryRun: true, type: "swap", quote: q, priceImpact }, null, 2);
      }
      case "dryrun_earn": {
        const chainId = CHAIN_IDS[String(args.chain).toLowerCase()] ?? parseInt(String(args.chain));
        const q = await getEarnQuote({
          protocol: args.protocol,
          token: args.token,
          amount: args.amount,
          chain: args.chain,
          fromAddress: args.fromAddress
        });
        let vault = null;
        try {
          if (args.protocol.startsWith("0x")) {
            vault = await fetchVault(chainId, args.protocol);
          } else {
            const { data: vaults } = await fetchVaults({ chainId, protocol: args.protocol, limit: 1 });
            vault = vaults[0] ?? null;
          }
        } catch {
        }
        const apy = vault?.analytics?.apy?.total ?? null;
        const projectedYield = apy != null ? {
          daily: parseFloat(args.amount) / 1e6 * apy / 365,
          monthly: parseFloat(args.amount) / 1e6 * apy / 12,
          annual: parseFloat(args.amount) / 1e6 * apy
        } : null;
        return JSON.stringify({ dryRun: true, type: "earn", quote: q, vault, projectedYield }, null, 2);
      }
      case "get_tx_status": {
        const status = await getStatus(args.txHash, void 0, args.fromChain, args.toChain);
        return JSON.stringify(status, null, 2);
      }
      case "get_wallet_address": {
        const wallets = listWallets();
        const w = wallets.find((x) => x.name === args.walletName);
        if (!w) return JSON.stringify({ error: `Wallet not found: ${args.walletName}. Run lifi-cli wallet list to see saved wallets.` });
        return JSON.stringify({ name: w.name, address: w.address });
      }
      case "execute_bridge": {
        const walletName = args.walletName;
        const wallets = listWallets();
        const w = wallets.find((x) => x.name === walletName);
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` });
        const q = await getBridgeQuote({
          fromChain: args.fromChain,
          toChain: args.toChain,
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          fromAddress: w.address,
          slippage: args.slippage ?? 5e-3
        });
        const summary = `  Bridge ${args.fromToken} -> ${args.toToken}
  From: ${args.fromChain} -> ${args.toChain}
  Amount: ${q.fromAmount} | Receive: ${q.toAmount}
  Gas: $${q.gasCostUSD} | Duration: ${q.estimatedDuration}s
  Wallet: ${walletName} (${w.address})`;
        const ok = await confirm(rl, summary);
        if (!ok) return JSON.stringify({ cancelled: true, reason: "User did not confirm" });
        if (q.approvalAddress) {
          console.log(chalk2.dim("  checking token approval..."));
          await ensureAllowance(q.transactionRequest.to, q.approvalAddress, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId);
        }
        console.log(chalk2.dim("  submitting transaction..."));
        const result = await executeTransaction({
          to: q.transactionRequest.to,
          from: q.transactionRequest.from,
          data: q.transactionRequest.data,
          value: BigInt(q.transactionRequest.value ?? "0"),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : void 0,
          chainId: q.transactionRequest.chainId
        }, walletName, { type: "bridge", detail: `${args.fromToken} -> ${args.toToken}` });
        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId });
      }
      case "execute_swap": {
        const walletName = args.walletName;
        const wallets = listWallets();
        const w = wallets.find((x) => x.name === walletName);
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` });
        const q = await getSwapQuote({
          chain: args.chain,
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          fromAddress: w.address,
          slippage: args.slippage ?? 5e-3
        });
        const summary = `  Swap ${args.fromToken} -> ${args.toToken} on ${args.chain}
  Amount: ${q.fromAmount} | Receive: ${q.toAmount}
  Gas: $${q.gasCostUSD}
  Wallet: ${walletName} (${w.address})`;
        const ok = await confirm(rl, summary);
        if (!ok) return JSON.stringify({ cancelled: true, reason: "User did not confirm" });
        if (q.approvalAddress) {
          console.log(chalk2.dim("  checking token approval..."));
          await ensureAllowance(q.transactionRequest.to, q.approvalAddress, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId);
        }
        console.log(chalk2.dim("  submitting transaction..."));
        const result = await executeTransaction({
          to: q.transactionRequest.to,
          from: q.transactionRequest.from,
          data: q.transactionRequest.data,
          value: BigInt(q.transactionRequest.value ?? "0"),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : void 0,
          chainId: q.transactionRequest.chainId
        }, walletName, { type: "swap", detail: `${args.fromToken} -> ${args.toToken} on ${args.chain}` });
        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId });
      }
      case "execute_earn": {
        const walletName = args.walletName;
        const wallets = listWallets();
        const w = wallets.find((x) => x.name === walletName);
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` });
        const q = await getEarnQuote({
          protocol: args.protocol,
          token: args.token,
          amount: args.amount,
          chain: args.chain,
          fromAddress: w.address
        });
        const apy = q.estimatedApy != null ? `${(q.estimatedApy * 100).toFixed(2)}%` : "n/a";
        const summary = `  Earn deposit into ${q.protocol}
  Token: ${args.token} | Amount: ${q.fromAmount}
  APY: ${apy} | Gas: $${q.gasCostUSD}
  Wallet: ${walletName} (${w.address})`;
        const ok = await confirm(rl, summary);
        if (!ok) return JSON.stringify({ cancelled: true, reason: "User did not confirm" });
        if (q.approvalAddress && args.token.toLowerCase() !== "eth") {
          console.log(chalk2.dim("  checking token approval..."));
          await ensureAllowance(q.transactionRequest.to, q.approvalAddress, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId);
        }
        console.log(chalk2.dim("  submitting transaction..."));
        const result = await executeTransaction({
          to: q.transactionRequest.to,
          from: q.transactionRequest.from,
          data: q.transactionRequest.data,
          value: BigInt(q.transactionRequest.value ?? "0"),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : void 0,
          chainId: q.transactionRequest.chainId
        }, walletName, { type: "earn", detail: `${args.token} -> ${q.protocol}` });
        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}
async function runAgent(config) {
  const client3 = config.provider && config.apiKey ? createAgentClient(config.provider, config.apiKey, config.baseUrl) : createOpenRouterClient();
  const messages = [
    { role: "system", content: config.systemPrompt ?? DEFAULT_SYSTEM }
  ];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => new Promise((resolve) => rl.question(chalk2.cyan("you> "), resolve));
  printAgentBanner(config.model);
  while (true) {
    const userInput = await prompt();
    if (!userInput.trim()) continue;
    messages.push({ role: "user", content: userInput });
    try {
      let response = await client3.chat.completions.create({
        model: config.model,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto"
      });
      let message = response.choices[0].message;
      let toolIterations = 0;
      while (message.tool_calls && message.tool_calls.length > 0) {
        if (++toolIterations > 10) {
          console.log(chalk2.yellow("  too many tool calls \u2014 stopping loop"));
          break;
        }
        messages.push(message);
        for (const call2 of message.tool_calls) {
          if (call2.type !== "function") continue;
          const args = JSON.parse(call2.function.arguments);
          console.log(chalk2.dim(`  [tool] ${call2.function.name}(${JSON.stringify(args)})`));
          const result = await dispatchTool(call2.function.name, args, rl);
          messages.push({ role: "tool", tool_call_id: call2.id, content: result });
        }
        response = await client3.chat.completions.create({
          model: config.model,
          messages,
          tools: AGENT_TOOLS,
          tool_choice: "auto"
        });
        message = response.choices[0].message;
      }
      messages.push(message);
      const formatted = formatAgentResponse(message.content ?? "");
      console.log(chalk2.green("agent> ") + formatted);
      console.log();
    } catch (err) {
      const msg = String(err);
      messages.pop();
      if (msg.includes("429")) {
        console.log(chalk2.yellow("  rate limited \u2014 wait a moment and try again"));
        console.log(chalk2.dim(`  or switch model: lifi-cli agent --model meta-llama/llama-3.3-70b-instruct:free`));
      } else if (msg.includes("401") || msg.includes("403")) {
        console.log(chalk2.red("  auth error \u2014 check your API key: lifi-cli agent --setup"));
      } else {
        console.log(chalk2.red("  error: ") + msg);
      }
      console.log();
    }
  }
}
export {
  AGENT_TOOLS,
  CHAIN_IDS,
  CHAIN_NAMES,
  CONFIG_DIR,
  CONFIG_FILE,
  DEFAULT_CHAIN,
  LIFI_API_BASE,
  NATIVE_TOKEN,
  WALLETS_DIR,
  createWallet,
  ensureAllowance,
  executeTransaction,
  fetchEarnProtocols,
  fetchPortfolio,
  fetchVault,
  fetchVaults,
  getBridgeQuote,
  getConfigValue,
  getEarnQuote,
  getMarketBySlug,
  getMarkets,
  getSwapQuote,
  getWalletKey,
  importWallet,
  listWallets,
  loadConfig,
  resolveChain,
  runAgent,
  saveConfig
};
//# sourceMappingURL=index.mjs.map