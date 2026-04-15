import type { AgentTool } from './agent.types.js'

export const AGENT_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_bridge_quote',
      description: 'Get a quote to bridge tokens from one chain to another using LI.FI',
      parameters: {
        type: 'object',
        properties: {
          fromChain: { type: 'string', description: 'Source chain name or ID (e.g. ethereum, base, arbitrum)' },
          toChain: { type: 'string', description: 'Destination chain name or ID' },
          fromToken: { type: 'string', description: 'Token symbol or address to send' },
          toToken: { type: 'string', description: 'Token symbol or address to receive' },
          amount: { type: 'string', description: 'Amount in smallest unit (wei for ETH, 1e6 for 1 USDC)' },
          fromAddress: { type: 'string', description: 'Sender wallet address' },
        },
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_swap_quote',
      description: 'Get a quote to swap tokens on a single chain using LI.FI',
      parameters: {
        type: 'object',
        properties: {
          chain: { type: 'string', description: 'Chain name or ID' },
          fromToken: { type: 'string', description: 'Token to swap from' },
          toToken: { type: 'string', description: 'Token to swap to' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          fromAddress: { type: 'string', description: 'Wallet address' },
        },
        required: ['chain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_earn_quote',
      description: 'Get a quote to deposit tokens into a yield protocol via LI.FI Composer',
      parameters: {
        type: 'object',
        properties: {
          protocol: { type: 'string', description: 'Protocol symbol (e.g. morpho-usdc, aave-usdc, lido-wsteth)' },
          token: { type: 'string', description: 'Token to deposit' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          chain: { type: 'string', description: 'Chain name or ID' },
          fromAddress: { type: 'string', description: 'Wallet address' },
        },
        required: ['protocol', 'token', 'amount', 'chain', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_earn_vaults',
      description: 'List yield vaults available on LI.FI Earn with live APY and TVL',
      parameters: {
        type: 'object',
        properties: {
          chainId: { type: 'number', description: 'Filter by chain ID as a number (e.g. 8453 for Base, 1 for Ethereum, 42161 for Arbitrum, 10 for Optimism)' },
          protocol: { type: 'string', description: 'Filter by protocol slug (optional)' },
          underlyingToken: { type: 'string', description: 'Filter by underlying token symbol (optional)' },
          category: { type: 'string', enum: ['vault', 'lending', 'staking', 'yield'], description: 'Filter by category (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_earn_protocols',
      description: 'List protocols with active vaults on LI.FI Earn',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_earn_portfolio',
      description: 'Get all active DeFi positions (yield deposits) for a wallet address',
      parameters: {
        type: 'object',
        properties: {
          userAddress: { type: 'string', description: 'Wallet address (0x...)' },
        },
        required: ['userAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_markets',
      description: 'List active prediction markets on Polymarket',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query to filter markets by title (optional)' },
          limit: { type: 'number', description: 'Max number of markets to return (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dryrun_bridge',
      description: 'Simulate a cross-chain bridge without submitting — returns route, gas, approval requirements',
      parameters: {
        type: 'object',
        properties: {
          fromChain: { type: 'string', description: 'Source chain name or ID' },
          toChain: { type: 'string', description: 'Destination chain name or ID' },
          fromToken: { type: 'string', description: 'Token to send' },
          toToken: { type: 'string', description: 'Token to receive' },
          amount: { type: 'string', description: 'Amount in token units' },
          fromAddress: { type: 'string', description: 'Sender address (0x...)' },
          slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
        },
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dryrun_swap',
      description: 'Simulate a single-chain token swap without submitting — returns route, price impact, gas',
      parameters: {
        type: 'object',
        properties: {
          chain: { type: 'string', description: 'Chain name or ID' },
          fromToken: { type: 'string', description: 'Token to swap from' },
          toToken: { type: 'string', description: 'Token to swap to' },
          amount: { type: 'string', description: 'Amount in token units' },
          fromAddress: { type: 'string', description: 'Sender address (0x...)' },
          slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
        },
        required: ['chain', 'fromToken', 'toToken', 'amount', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dryrun_earn',
      description: 'Simulate a yield vault deposit without submitting — returns APY, TVL, projected yield, gas',
      parameters: {
        type: 'object',
        properties: {
          protocol: { type: 'string', description: 'Protocol slug or vault address (0x...)' },
          token: { type: 'string', description: 'Token to deposit' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          chain: { type: 'string', description: 'Chain name or ID' },
          fromAddress: { type: 'string', description: 'Sender address (0x...)' },
        },
        required: ['protocol', 'token', 'amount', 'chain', 'fromAddress'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tx_status',
      description: 'Check the status of a cross-chain transaction',
      parameters: {
        type: 'object',
        properties: {
          txHash: { type: 'string', description: 'Transaction hash' },
          fromChain: { type: 'number', description: 'Source chain ID' },
          toChain: { type: 'number', description: 'Destination chain ID' },
        },
        required: ['txHash'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_kalshi_markets',
      description: 'List open Kalshi prediction markets',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keyword filter (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_manifold_markets',
      description: 'List open Manifold prediction markets',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wallet_address',
      description: 'Get the public address of a saved wallet by name',
      parameters: {
        type: 'object',
        properties: {
          walletName: { type: 'string', description: 'Wallet name (from lifi-cli wallet list)' },
        },
        required: ['walletName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_bridge',
      description: 'Execute a cross-chain bridge transaction using a saved wallet. Always show the quote details and ask user to confirm before calling this.',
      parameters: {
        type: 'object',
        properties: {
          fromChain: { type: 'string', description: 'Source chain name or ID' },
          toChain: { type: 'string', description: 'Destination chain name or ID' },
          fromToken: { type: 'string', description: 'Token to send' },
          toToken: { type: 'string', description: 'Token to receive' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          walletName: { type: 'string', description: 'Saved wallet name to sign with' },
          slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
        },
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount', 'walletName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_swap',
      description: 'Execute a token swap on a single chain using a saved wallet. Always show the quote details and ask user to confirm before calling this.',
      parameters: {
        type: 'object',
        properties: {
          chain: { type: 'string', description: 'Chain name or ID' },
          fromToken: { type: 'string', description: 'Token to swap from' },
          toToken: { type: 'string', description: 'Token to swap to' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          walletName: { type: 'string', description: 'Saved wallet name to sign with' },
          slippage: { type: 'number', description: 'Slippage tolerance (default 0.005)' },
        },
        required: ['chain', 'fromToken', 'toToken', 'amount', 'walletName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_earn',
      description: 'Execute a yield vault deposit using a saved wallet. Always show the quote details and ask user to confirm before calling this.',
      parameters: {
        type: 'object',
        properties: {
          protocol: { type: 'string', description: 'Protocol slug or vault address (0x...)' },
          token: { type: 'string', description: 'Token to deposit' },
          amount: { type: 'string', description: 'Amount in smallest unit' },
          chain: { type: 'string', description: 'Chain name or ID' },
          walletName: { type: 'string', description: 'Saved wallet name to sign with' },
        },
        required: ['protocol', 'token', 'amount', 'chain', 'walletName'],
      },
    },
  },
]
