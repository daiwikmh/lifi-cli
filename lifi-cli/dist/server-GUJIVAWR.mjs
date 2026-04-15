#!/usr/bin/env node
import {
  CHAIN_IDS,
  fetchEarnProtocols,
  fetchVault,
  fetchVaults,
  getBridgeQuote,
  getEarnQuote,
  getMarketBySlug,
  getMarkets,
  getStatus,
  getSwapQuote
} from "./chunk-KUNM2NGH.mjs";

// src/mcp/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

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
function resolveChainId(chain) {
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
    const chainId = resolveChainId(args.chain);
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
//# sourceMappingURL=server-GUJIVAWR.mjs.map