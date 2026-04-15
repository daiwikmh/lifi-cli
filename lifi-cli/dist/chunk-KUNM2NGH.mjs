#!/usr/bin/env node

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
var CONFIG_DIR = `${process.env.HOME}/.lifi`;
var CONFIG_FILE = `${CONFIG_DIR}/config.json`;
var WALLETS_DIR = `${CONFIG_DIR}/wallets`;

// src/config/config.ts
import fs from "fs";
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
import axios from "axios";
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
async function getTokens(chains) {
  const { data } = await client.get("/tokens", { params: chains ? { chains: chains.join(",") } : {} });
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

export {
  CHAIN_IDS,
  CONFIG_FILE,
  WALLETS_DIR,
  loadConfig,
  saveConfig,
  getConfigValue,
  resolveChain,
  getStatus,
  getTokens,
  getBridgeQuote,
  getSwapQuote,
  getEarnQuote,
  fetchVaults,
  fetchVault,
  fetchEarnProtocols,
  fetchPortfolio,
  getMarkets,
  getMarketBySlug
};
//# sourceMappingURL=chunk-KUNM2NGH.mjs.map