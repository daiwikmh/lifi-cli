#!/usr/bin/env node

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
    defaultWallet: "DEFAULT_WALLET"
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
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? "0",
    tool: response.steps?.[0]?.tool ?? "unknown",
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
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? "0",
    tool: response.steps?.[0]?.tool ?? "unknown",
    transactionRequest: response.transactionRequest,
    approvalAddress: response.estimate.approvalAddress
  };
}

// src/core/earn/protocols.ts
var PROTOCOLS = [
  // Morpho vaults — Base
  {
    name: "Morpho USDC (Base)",
    symbol: "morpho-usdc",
    vaultToken: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",
    underlyingToken: "USDC",
    chainId: 8453,
    category: "vault"
  },
  {
    name: "Morpho WETH (Base)",
    symbol: "morpho-weth",
    vaultToken: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1",
    underlyingToken: "WETH",
    chainId: 8453,
    category: "vault"
  },
  // Aave V3 — Base
  {
    name: "Aave V3 USDC (Base)",
    symbol: "aave-usdc-base",
    vaultToken: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",
    underlyingToken: "USDC",
    chainId: 8453,
    category: "lending"
  },
  // Aave V3 — Ethereum
  {
    name: "Aave V3 USDC (Ethereum)",
    symbol: "aave-usdc-eth",
    vaultToken: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c",
    underlyingToken: "USDC",
    chainId: 1,
    category: "lending"
  },
  {
    name: "Aave V3 WETH (Ethereum)",
    symbol: "aave-weth-eth",
    vaultToken: "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8",
    underlyingToken: "WETH",
    chainId: 1,
    category: "lending"
  },
  // Liquid staking — Ethereum
  {
    name: "Lido wstETH",
    symbol: "lido-wsteth",
    vaultToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    underlyingToken: "ETH",
    chainId: 1,
    category: "staking"
  },
  {
    name: "EtherFi eETH",
    symbol: "etherfi-eeth",
    vaultToken: "0x35fA164735182de50811E8e2E824cFb9B6118ac2",
    underlyingToken: "ETH",
    chainId: 1,
    category: "staking"
  },
  {
    name: "EtherFi weETH",
    symbol: "etherfi-weeth",
    vaultToken: "0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee",
    underlyingToken: "ETH",
    chainId: 1,
    category: "staking"
  },
  // Yield — Ethereum
  {
    name: "Pendle PT-USDC",
    symbol: "pendle-usdc",
    vaultToken: "0x808507121B80c02388fAd14726482e061B8da827",
    underlyingToken: "USDC",
    chainId: 1,
    category: "yield"
  },
  {
    name: "Ethena USDe",
    symbol: "ethena-usde",
    vaultToken: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
    underlyingToken: "USDC",
    chainId: 1,
    category: "yield"
  },
  {
    name: "Ethena sUSDe",
    symbol: "ethena-susde",
    vaultToken: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
    underlyingToken: "USDe",
    chainId: 1,
    category: "yield"
  },
  // Seamless — Base
  {
    name: "Seamless USDC (Base)",
    symbol: "seamless-usdc",
    vaultToken: "0x13A13869B814Be8F13B86e9875aB51bda882E391",
    underlyingToken: "USDC",
    chainId: 8453,
    category: "lending"
  },
  // Euler — Ethereum
  {
    name: "Euler USDC",
    symbol: "euler-usdc",
    vaultToken: "0xd9a442856C234a39a81a089C06451EBAa4306a72",
    underlyingToken: "USDC",
    chainId: 1,
    category: "lending"
  },
  // Kinetiq — staking
  {
    name: "Kinetiq kHYPE",
    symbol: "kinetiq-khype",
    vaultToken: "0x1Ecd4e50Cd792B6B4628de5AC38fAA0f5cf05682",
    underlyingToken: "HYPE",
    chainId: 999,
    category: "staking"
  }
];
function listProtocols(filter) {
  return PROTOCOLS.filter((p) => {
    if (filter?.chain && p.chainId !== filter.chain) return false;
    if (filter?.category && p.category !== filter.category) return false;
    return true;
  });
}
function getProtocolBySymbol(symbol) {
  return PROTOCOLS.find((p) => p.symbol.toLowerCase() === symbol.toLowerCase());
}

// src/core/earn/earn.ts
function resolveChainId3(chain) {
  if (typeof chain === "number") return chain;
  const id = CHAIN_IDS[chain.toLowerCase()];
  if (!id) throw new Error(`Unknown chain: ${chain}`);
  return id;
}
async function getEarnQuote(params) {
  const protocol = getProtocolBySymbol(params.protocol);
  if (!protocol) {
    throw new Error(`Unknown protocol: ${params.protocol}. Run 'lifi earn protocols' to list supported protocols.`);
  }
  const chainId = resolveChainId3(params.chain);
  const response = await getQuote({
    fromChain: chainId,
    toChain: protocol.chainId,
    fromToken: params.token,
    toToken: protocol.vaultToken,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress
  });
  return {
    protocol: protocol.name,
    fromToken: params.token,
    toToken: protocol.vaultToken,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    estimatedApy: protocol.apy,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? "0",
    transactionRequest: response.transactionRequest,
    approvalAddress: response.estimate.approvalAddress
  };
}

// src/api/polymarket/client.ts
import axios2 from "axios";
var POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";
function createGammaClient() {
  return axios2.create({ baseURL: POLYMARKET_GAMMA_API });
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
  return markets;
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
  WALLETS_DIR,
  loadConfig,
  saveConfig,
  getConfigValue,
  resolveChain,
  getStatus,
  getBridgeQuote,
  getSwapQuote,
  listProtocols,
  getEarnQuote,
  getMarkets,
  getMarketBySlug
};
//# sourceMappingURL=chunk-AOTGOO3E.mjs.map