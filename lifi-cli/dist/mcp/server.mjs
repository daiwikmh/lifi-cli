// src/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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

// src/mcp/tools/bridge.tool.ts
var bridgeTool = {
  name: "lifi_bridge_quote",
  description: "Get a quote to bridge tokens across chains using LI.FI",
  inputSchema: {
    type: "object",
    properties: {
      fromChain: { type: "string", description: "Source chain (name or ID)" },
      toChain: { type: "string", description: "Destination chain (name or ID)" },
      fromToken: { type: "string", description: "Token to send" },
      toToken: { type: "string", description: "Token to receive" },
      amount: { type: "string", description: "Amount in smallest unit" },
      fromAddress: { type: "string", description: "Sender address" }
    },
    required: ["fromChain", "toChain", "fromToken", "toToken", "amount", "fromAddress"]
  },
  async handler(args) {
    const quote = await getBridgeQuote(args);
    return { content: [{ type: "text", text: JSON.stringify(quote, null, 2) }] };
  }
};

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

// src/mcp/tools/swap.tool.ts
var swapTool = {
  name: "lifi_swap_quote",
  description: "Get a quote to swap tokens on a single chain using LI.FI",
  inputSchema: {
    type: "object",
    properties: {
      chain: { type: "string", description: "Chain name or ID (e.g. base, ethereum, arbitrum)" },
      fromToken: { type: "string", description: "Token to swap from (symbol or address)" },
      toToken: { type: "string", description: "Token to swap to (symbol or address)" },
      amount: { type: "string", description: "Amount in smallest unit (e.g. 1000000 for 1 USDC)" },
      fromAddress: { type: "string", description: "Wallet address" },
      slippage: { type: "number", description: "Slippage tolerance (e.g. 0.005 for 0.5%)" }
    },
    required: ["chain", "fromToken", "toToken", "amount", "fromAddress"]
  },
  async handler(args) {
    const quote = await getSwapQuote(args);
    return { content: [{ type: "text", text: JSON.stringify(quote, null, 2) }] };
  }
};

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

// src/mcp/tools/earn.tool.ts
var earnQuoteTool = {
  name: "lifi_earn_quote",
  description: "Get a quote to deposit tokens into a yield vault via LI.FI Earn",
  inputSchema: {
    type: "object",
    properties: {
      protocol: { type: "string", description: "Protocol slug (e.g. morpho) or vault address (0x...)" },
      token: { type: "string", description: "Token to deposit (symbol or address)" },
      amount: { type: "string", description: "Amount in smallest unit" },
      chain: { type: "string", description: "Chain name or ID" },
      fromAddress: { type: "string", description: "Wallet address" }
    },
    required: ["protocol", "token", "amount", "chain", "fromAddress"]
  },
  async handler(args) {
    const quote = await getEarnQuote(args);
    return { content: [{ type: "text", text: JSON.stringify(quote, null, 2) }] };
  }
};
var earnVaultsTool = {
  name: "lifi_earn_vaults",
  description: "List available yield vaults from the LI.FI Earn API",
  inputSchema: {
    type: "object",
    properties: {
      chainId: { type: "number", description: "Filter by chain ID" },
      protocol: { type: "string", description: "Filter by protocol slug" },
      underlyingToken: { type: "string", description: "Filter by underlying token symbol" },
      category: { type: "string", enum: ["vault", "lending", "staking", "yield"] },
      limit: { type: "number", description: "Max results (default 20)" },
      offset: { type: "number", description: "Pagination offset" }
    }
  },
  async handler(args) {
    const result = await fetchVaults(args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
};
var earnProtocolsTool = {
  name: "lifi_earn_protocols",
  description: "List protocols with active vaults on LI.FI Earn",
  inputSchema: {
    type: "object",
    properties: {}
  },
  async handler() {
    const protocols = await fetchEarnProtocols();
    return { content: [{ type: "text", text: JSON.stringify(protocols, null, 2) }] };
  }
};

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

// src/mcp/tools/markets.tool.ts
var listMarketsTool = {
  name: "lifi_markets_list",
  description: "List active Polymarket prediction markets",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (optional)" },
      limit: { type: "number", description: "Max results (default 20)" }
    }
  },
  async handler(args) {
    const markets = await getMarkets(args.query, args.limit ?? 20);
    return { content: [{ type: "text", text: JSON.stringify(markets, null, 2) }] };
  }
};
var getMarketTool = {
  name: "lifi_markets_get",
  description: "Get details of a Polymarket market by slug",
  inputSchema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "Market slug" }
    },
    required: ["slug"]
  },
  async handler(args) {
    const market = await getMarketBySlug(args.slug);
    return { content: [{ type: "text", text: JSON.stringify(market, null, 2) }] };
  }
};

// src/mcp/tools/status.tool.ts
var statusTool = {
  name: "lifi_tx_status",
  description: "Check the status of a LI.FI cross-chain transaction",
  inputSchema: {
    type: "object",
    properties: {
      txHash: { type: "string", description: "Transaction hash" },
      fromChain: { type: "number", description: "Source chain ID" },
      toChain: { type: "number", description: "Destination chain ID" }
    },
    required: ["txHash"]
  },
  async handler(args) {
    const status = await getStatus(args.txHash, void 0, args.fromChain, args.toChain);
    return { content: [{ type: "text", text: JSON.stringify(status, null, 2) }] };
  }
};

// src/mcp/tools/dryrun.tool.ts
function resolveChainId4(chain) {
  if (typeof chain === "number") return chain;
  const id = CHAIN_IDS[String(chain).toLowerCase()];
  if (!id) throw new Error(`Unknown chain: ${chain}`);
  return id;
}
var dryrunBridgeTool = {
  name: "lifi_dryrun_bridge",
  description: "Simulate a cross-chain bridge without submitting. Returns full route details, gas estimate, approval requirements.",
  inputSchema: {
    type: "object",
    properties: {
      fromChain: { type: "string", description: "Source chain name or ID" },
      toChain: { type: "string", description: "Destination chain name or ID" },
      fromToken: { type: "string", description: "Token to send (symbol or address)" },
      toToken: { type: "string", description: "Token to receive (symbol or address)" },
      amount: { type: "string", description: "Amount in token units (e.g. 100 for 100 USDC)" },
      fromAddress: { type: "string", description: "Sender address (0x...)" },
      slippage: { type: "number", description: "Slippage tolerance (default 0.005)" }
    },
    required: ["fromChain", "toChain", "fromToken", "toToken", "amount", "fromAddress"]
  },
  async handler(args) {
    const quote = await getBridgeQuote({
      fromChain: args.fromChain,
      toChain: args.toChain,
      fromToken: args.fromToken,
      toToken: args.toToken,
      amount: args.amount,
      fromAddress: args.fromAddress,
      slippage: args.slippage ?? 5e-3
    });
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ dryRun: true, type: "bridge", quote }, null, 2)
      }]
    };
  }
};
var dryrunSwapTool = {
  name: "lifi_dryrun_swap",
  description: "Simulate a single-chain token swap without submitting. Returns route, price impact, gas estimate.",
  inputSchema: {
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
  },
  async handler(args) {
    const quote = await getSwapQuote({
      chain: args.chain,
      fromToken: args.fromToken,
      toToken: args.toToken,
      amount: args.amount,
      fromAddress: args.fromAddress,
      slippage: args.slippage ?? 5e-3
    });
    const priceImpact = quote.toAmountMin && quote.toAmount ? ((1 - parseFloat(quote.toAmountMin) / parseFloat(quote.toAmount)) * 100).toFixed(3) : null;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ dryRun: true, type: "swap", quote, priceImpact }, null, 2)
      }]
    };
  }
};
var dryrunEarnTool = {
  name: "lifi_dryrun_earn",
  description: "Simulate a yield vault deposit without submitting. Returns vault APY, TVL, projected yield, gas estimate.",
  inputSchema: {
    type: "object",
    properties: {
      protocol: { type: "string", description: "Protocol slug or vault address (0x...)" },
      token: { type: "string", description: "Token to deposit (symbol or address)" },
      amount: { type: "string", description: "Amount in smallest unit" },
      chain: { type: "string", description: "Chain name or ID" },
      fromAddress: { type: "string", description: "Sender address (0x...)" }
    },
    required: ["protocol", "token", "amount", "chain", "fromAddress"]
  },
  async handler(args) {
    const chainId = resolveChainId4(args.chain);
    const quote = await getEarnQuote({
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
        const { vaults } = await fetchVaults({ chainId, protocol: args.protocol, limit: 1 });
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
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ dryRun: true, type: "earn", quote, vault, projectedYield }, null, 2)
      }]
    };
  }
};

// src/mcp/server.ts
var ALL_TOOLS = [
  bridgeTool,
  swapTool,
  earnQuoteTool,
  earnVaultsTool,
  earnProtocolsTool,
  listMarketsTool,
  getMarketTool,
  statusTool,
  dryrunBridgeTool,
  dryrunSwapTool,
  dryrunEarnTool
];
async function startMcpServer() {
  const server = new Server(
    { name: "lifi-cli", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: ALL_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = ALL_TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return { content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }], isError: true };
    }
    try {
      return await tool.handler(request.params.arguments ?? {});
    } catch (err) {
      return { content: [{ type: "text", text: String(err) }], isError: true };
    }
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
export {
  startMcpServer
};
//# sourceMappingURL=server.mjs.map