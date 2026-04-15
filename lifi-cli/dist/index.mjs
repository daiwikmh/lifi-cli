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
    agentBaseUrl: "AGENT_BASE_URL"
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
      `No vault found for protocol "${protocol}" on chain ${chainId}. Run 'lifi earn vaults' to see available vaults.`
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

// src/api/kalshi/client.ts
import axios4 from "axios";
function createKalshiClient() {
  const apiKey = getConfigValue("kalshiApiKey");
  if (!apiKey) throw new Error("Kalshi API key required. Run: lifi config set --kalshi-key <key>  (get one at kalshi.com/api)");
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
          chainId: { type: "number", description: "Filter by chain ID (optional)" },
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
      case "list_earn_vaults": {
        const result = await fetchVaults(args);
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
    let response = await client3.chat.completions.create({
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
        console.log(chalk2.dim(`  [tool] ${call.function.name}(${JSON.stringify(args)})`));
        const result = await dispatchTool(call.function.name, args);
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
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
    console.log(chalk2.green("agent> ") + (message.content ?? ""));
    console.log();
  }
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
  const client3 = createWalletClient({ account, chain, transport: http() });
  const hash = await client3.sendTransaction({
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