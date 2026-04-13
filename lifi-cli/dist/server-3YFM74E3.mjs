#!/usr/bin/env node
import {
  getBridgeQuote,
  getEarnQuote,
  getMarketBySlug,
  getMarkets,
  getStatus,
  getSwapQuote,
  listProtocols
} from "./chunk-AOTGOO3E.mjs";

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
  description: "Get a quote to deposit tokens into a yield protocol via LI.FI Composer",
  inputSchema: {
    type: "object",
    properties: {
      protocol: { type: "string", description: "Protocol symbol (e.g. morpho-usdc, aave-usdc)" },
      token: { type: "string", description: "Token to deposit" },
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
var earnProtocolsTool = {
  name: "lifi_earn_protocols",
  description: "List all yield protocols supported by LI.FI Composer",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ["vault", "lending", "staking", "yield"] }
    }
  },
  async handler(args) {
    const protocols = listProtocols({ category: args.category });
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

// src/mcp/server.ts
var ALL_TOOLS = [
  bridgeTool,
  swapTool,
  earnQuoteTool,
  earnProtocolsTool,
  listMarketsTool,
  getMarketTool,
  statusTool
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
//# sourceMappingURL=server-3YFM74E3.mjs.map