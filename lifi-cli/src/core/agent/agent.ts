import readline from 'readline'
import chalk from 'chalk'
import { printAgentBanner } from '../../display/banner.js'
import { createOpenRouterClient, createAgentClient } from '../../api/openrouter/index.js'
import { formatAgentResponse } from './format.js'
import { getBridgeQuote } from '../bridge/index.js'
import { getSwapQuote } from '../swap/index.js'
import { getEarnQuote, fetchVaults, fetchVault, fetchEarnProtocols, fetchPortfolio } from '../earn/index.js'
import { getMarkets } from '../markets/index.js'
import { getKalshiMarkets } from '../kalshi/index.js'
import { getManifoldMarkets } from '../manifold/index.js'
import { getStatus } from '../../api/lifi/index.js'
import { listWallets, getWalletKey, executeTransaction, ensureAllowance } from '../wallet/index.js'
import { notify, txNotification } from '../../api/telegram/notify.js'
import { AGENT_TOOLS } from './tools.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { AgentConfig, AgentMessage } from './agent.types.js'

const DEFAULT_SYSTEM = `You are lifi-cli agent — a terminal DeFi assistant. You ONLY discuss DeFi, crypto, and the tools listed below. Do not respond to unrelated topics.

YOUR TOOLS (call these functions to answer user requests):
- get_wallet_address: resolve a wallet name to its public address (walletName)
- get_bridge_quote: get a cross-chain bridge quote (fromChain, toChain, fromToken, toToken, amount, fromAddress)
- get_swap_quote: get a same-chain token swap quote (chain, fromToken, toToken, amount, fromAddress)
- get_earn_quote: get a yield deposit quote via LI.FI Composer (protocol, token, amount, chain, fromAddress)
- list_earn_vaults: browse yield vaults (chainId as number e.g. 8453, protocol slug, underlyingToken symbol, limit — omit filters you don't need)
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

EXECUTION RULES — mandatory, never skip:
1. Before calling execute_*, always call the matching quote tool first and show the user the result.
2. After showing the quote, explicitly ask the user to confirm with "yes" before calling execute_*.
3. Only call execute_* after the user has confirmed. The terminal will also prompt for confirmation.
4. Never guess wallet names — call get_wallet_address first if you need the address.

RULES:
- Always call a tool before answering data questions. Never make up token prices, APYs, or market data.
- When asked "what tools do you have", list the tools above exactly.
- Present token amounts in human-readable form (e.g. "100 USDC" not "100000000").

FORMATTING — follow exactly, no exceptions:
- Plain text only. No markdown.
- No asterisks, no underscores, no pound signs.
- No emoji.
- Tables: pipe format only (| col | col |) — the terminal renders these.
- Lists: use dash (-) not asterisk.
- Concise. Every line must earn its place.`

async function confirm(rl: readline.Interface, summary: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log()
    console.log(chalk.yellow('  -- confirm transaction --'))
    console.log(chalk.dim(summary))
    console.log()
    rl.question(chalk.bold('  Type "yes" to proceed: '), (ans) => {
      console.log()
      resolve(ans.trim().toLowerCase() === 'yes')
    })
  })
}

async function dispatchTool(name: string, args: Record<string, unknown>, rl: readline.Interface): Promise<string> {
  try {
    switch (name) {
      case 'get_bridge_quote': {
        const q = await getBridgeQuote(args as unknown as Parameters<typeof getBridgeQuote>[0])
        return JSON.stringify(q, null, 2)
      }
      case 'get_swap_quote': {
        const q = await getSwapQuote(args as unknown as Parameters<typeof getSwapQuote>[0])
        return JSON.stringify(q, null, 2)
      }
      case 'get_earn_quote': {
        const earnArgs = { ...args } as Record<string, unknown>
        const addr = earnArgs.fromAddress as string | undefined
        if (!addr || addr === 'wallet_address' || addr === 'your_wallet_address') {
          earnArgs.fromAddress = '0x0000000000000000000000000000000000000001'
        }
        const q = await getEarnQuote(earnArgs as unknown as Parameters<typeof getEarnQuote>[0])
        return JSON.stringify(q, null, 2)
      }
      case 'list_earn_vaults': {
        const vaultArgs = { ...args } as Record<string, unknown>
        if (typeof vaultArgs.chainId === 'string') {
          const resolved = CHAIN_IDS[vaultArgs.chainId.toLowerCase()]
          if (resolved) vaultArgs.chainId = resolved
          else { const n = parseInt(vaultArgs.chainId); if (!isNaN(n)) vaultArgs.chainId = n }
        }
        // strip empty strings — API treats "" as a literal filter, returns zero results
        for (const k of Object.keys(vaultArgs)) {
          if (vaultArgs[k] === '' || vaultArgs[k] === null) delete vaultArgs[k]
        }
        // remove unsupported params the LLM sometimes adds
        delete vaultArgs.category
        const result = await fetchVaults(vaultArgs as Parameters<typeof fetchVaults>[0])
        return JSON.stringify(result, null, 2)
      }
      case 'list_earn_protocols': {
        const protocols = await fetchEarnProtocols()
        return JSON.stringify(protocols, null, 2)
      }
      case 'get_earn_portfolio': {
        const portfolio = await fetchPortfolio(args.userAddress as string)
        return JSON.stringify(portfolio, null, 2)
      }
      case 'list_markets': {
        const markets = await getMarkets(args.query as string | undefined, (args.limit as number) ?? 20)
        return JSON.stringify(markets.slice(0, 10), null, 2)
      }
      case 'list_kalshi_markets': {
        const markets = await getKalshiMarkets(args.query as string | undefined, (args.limit as number) ?? 20)
        return JSON.stringify(markets.slice(0, 10), null, 2)
      }
      case 'list_manifold_markets': {
        const markets = await getManifoldMarkets(args.query as string | undefined, (args.limit as number) ?? 20)
        return JSON.stringify(markets.slice(0, 10), null, 2)
      }
      case 'dryrun_bridge': {
        const q = await getBridgeQuote({
          fromChain: args.fromChain as string,
          toChain: args.toChain as string,
          fromToken: args.fromToken as string,
          toToken: args.toToken as string,
          amount: args.amount as string,
          fromAddress: args.fromAddress as `0x${string}`,
          slippage: (args.slippage as number) ?? 0.005,
        })
        return JSON.stringify({ dryRun: true, type: 'bridge', quote: q }, null, 2)
      }
      case 'dryrun_swap': {
        const q = await getSwapQuote({
          chain: args.chain as string,
          fromToken: args.fromToken as string,
          toToken: args.toToken as string,
          amount: args.amount as string,
          fromAddress: args.fromAddress as `0x${string}`,
          slippage: (args.slippage as number) ?? 0.005,
        })
        const priceImpact = q.toAmountMin && q.toAmount
          ? ((1 - parseFloat(q.toAmountMin) / parseFloat(q.toAmount)) * 100).toFixed(3)
          : null
        return JSON.stringify({ dryRun: true, type: 'swap', quote: q, priceImpact }, null, 2)
      }
      case 'dryrun_earn': {
        const chainId = CHAIN_IDS[String(args.chain).toLowerCase()] ?? parseInt(String(args.chain))
        const q = await getEarnQuote({
          protocol: args.protocol as string,
          token: args.token as string,
          amount: args.amount as string,
          chain: args.chain as string,
          fromAddress: args.fromAddress as `0x${string}`,
        })
        let vault = null
        try {
          if ((args.protocol as string).startsWith('0x')) {
            vault = await fetchVault(chainId, args.protocol as string)
          } else {
            const { data: vaults } = await fetchVaults({ chainId, protocol: args.protocol as string, limit: 1 })
            vault = vaults[0] ?? null
          }
        } catch { /* best-effort */ }
        const apy = vault?.analytics?.apy?.total ?? null
        const projectedYield = apy != null ? {
          daily: (parseFloat(args.amount as string) / 1e6) * apy / 365,
          monthly: (parseFloat(args.amount as string) / 1e6) * apy / 12,
          annual: (parseFloat(args.amount as string) / 1e6) * apy,
        } : null
        return JSON.stringify({ dryRun: true, type: 'earn', quote: q, vault, projectedYield }, null, 2)
      }
      case 'get_tx_status': {
        const status = await getStatus(args.txHash as string, undefined, args.fromChain as number, args.toChain as number)
        return JSON.stringify(status, null, 2)
      }
      case 'get_wallet_address': {
        const wallets = listWallets()
        const w = wallets.find((x) => x.name === args.walletName)
        if (!w) return JSON.stringify({ error: `Wallet not found: ${args.walletName}. Run lifi-cli wallet list to see saved wallets.` })
        return JSON.stringify({ name: w.name, address: w.address })
      }
      case 'execute_bridge': {
        const walletName = args.walletName as string
        const wallets = listWallets()
        const w = wallets.find((x) => x.name === walletName)
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` })

        const q = await getBridgeQuote({
          fromChain: args.fromChain as string,
          toChain: args.toChain as string,
          fromToken: args.fromToken as string,
          toToken: args.toToken as string,
          amount: args.amount as string,
          fromAddress: w.address,
          slippage: (args.slippage as number) ?? 0.005,
        })

        const summary = `  Bridge ${args.fromToken} -> ${args.toToken}\n  From: ${args.fromChain} -> ${args.toChain}\n  Amount: ${q.fromAmount} | Receive: ${q.toAmount}\n  Gas: $${q.gasCostUSD} | Duration: ${q.estimatedDuration}s\n  Wallet: ${walletName} (${w.address})`
        const ok = await confirm(rl, summary)
        if (!ok) return JSON.stringify({ cancelled: true, reason: 'User did not confirm' })

        if (q.approvalAddress) {
          console.log(chalk.dim('  checking token approval...'))
          await ensureAllowance(q.transactionRequest.to as `0x${string}`, q.approvalAddress as `0x${string}`, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId)
        }

        console.log(chalk.dim('  submitting transaction...'))
        const result = await executeTransaction({
          to: q.transactionRequest.to as `0x${string}`,
          from: q.transactionRequest.from as `0x${string}`,
          data: q.transactionRequest.data as `0x${string}`,
          value: BigInt(q.transactionRequest.value ?? '0'),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : undefined,
          chainId: q.transactionRequest.chainId,
        }, walletName, { type: 'bridge', detail: `${args.fromToken} -> ${args.toToken}` })

        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId })
      }
      case 'execute_swap': {
        const walletName = args.walletName as string
        const wallets = listWallets()
        const w = wallets.find((x) => x.name === walletName)
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` })

        const q = await getSwapQuote({
          chain: args.chain as string,
          fromToken: args.fromToken as string,
          toToken: args.toToken as string,
          amount: args.amount as string,
          fromAddress: w.address,
          slippage: (args.slippage as number) ?? 0.005,
        })

        const summary = `  Swap ${args.fromToken} -> ${args.toToken} on ${args.chain}\n  Amount: ${q.fromAmount} | Receive: ${q.toAmount}\n  Gas: $${q.gasCostUSD}\n  Wallet: ${walletName} (${w.address})`
        const ok = await confirm(rl, summary)
        if (!ok) return JSON.stringify({ cancelled: true, reason: 'User did not confirm' })

        if (q.approvalAddress) {
          console.log(chalk.dim('  checking token approval...'))
          await ensureAllowance(q.transactionRequest.to as `0x${string}`, q.approvalAddress as `0x${string}`, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId)
        }

        console.log(chalk.dim('  submitting transaction...'))
        const result = await executeTransaction({
          to: q.transactionRequest.to as `0x${string}`,
          from: q.transactionRequest.from as `0x${string}`,
          data: q.transactionRequest.data as `0x${string}`,
          value: BigInt(q.transactionRequest.value ?? '0'),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : undefined,
          chainId: q.transactionRequest.chainId,
        }, walletName, { type: 'swap', detail: `${args.fromToken} -> ${args.toToken} on ${args.chain}` })

        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId })
      }
      case 'execute_earn': {
        const walletName = args.walletName as string
        const wallets = listWallets()
        const w = wallets.find((x) => x.name === walletName)
        if (!w) return JSON.stringify({ error: `Wallet not found: ${walletName}` })

        const q = await getEarnQuote({
          protocol: args.protocol as string,
          token: args.token as string,
          amount: args.amount as string,
          chain: args.chain as string,
          fromAddress: w.address,
        })

        const apy = q.estimatedApy != null ? `${(q.estimatedApy * 100).toFixed(2)}%` : 'n/a'
        const summary = `  Earn deposit into ${q.protocol}\n  Token: ${args.token} | Amount: ${q.fromAmount}\n  APY: ${apy} | Gas: $${q.gasCostUSD}\n  Wallet: ${walletName} (${w.address})`
        const ok = await confirm(rl, summary)
        if (!ok) return JSON.stringify({ cancelled: true, reason: 'User did not confirm' })

        if (q.approvalAddress && (args.token as string).toLowerCase() !== 'eth') {
          console.log(chalk.dim('  checking token approval...'))
          await ensureAllowance(q.transactionRequest.to as `0x${string}`, q.approvalAddress as `0x${string}`, BigInt(q.fromAmount), walletName, q.transactionRequest.chainId)
        }

        console.log(chalk.dim('  submitting transaction...'))
        const result = await executeTransaction({
          to: q.transactionRequest.to as `0x${string}`,
          from: q.transactionRequest.from as `0x${string}`,
          data: q.transactionRequest.data as `0x${string}`,
          value: BigInt(q.transactionRequest.value ?? '0'),
          gasLimit: q.transactionRequest.gasLimit ? BigInt(q.transactionRequest.gasLimit) : undefined,
          chainId: q.transactionRequest.chainId,
        }, walletName, { type: 'earn', detail: `${args.token} -> ${q.protocol}` })

        return JSON.stringify({ success: true, txHash: result.txHash, chainId: result.chainId })
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) })
  }
}

export async function runAgent(config: AgentConfig): Promise<void> {
  const client = config.provider && config.apiKey
    ? createAgentClient(config.provider, config.apiKey, config.baseUrl)
    : createOpenRouterClient()
  const messages: AgentMessage[] = [
    { role: 'system', content: config.systemPrompt ?? DEFAULT_SYSTEM },
  ]

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = () => new Promise<string>((resolve) => rl.question(chalk.cyan('you> '), resolve))

  printAgentBanner(config.model)

  while (true) {
    const userInput = await prompt()
    if (!userInput.trim()) continue

    messages.push({ role: 'user', content: userInput })

    try {
      let response = await client.chat.completions.create({
        model: config.model,
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
      })

      let message = response.choices[0].message
      let toolIterations = 0

      while (message.tool_calls && message.tool_calls.length > 0) {
        if (++toolIterations > 10) {
          console.log(chalk.yellow('  too many tool calls — stopping loop'))
          break
        }
        messages.push(message)

        for (const call of message.tool_calls) {
          if (call.type !== 'function') continue
          const args = JSON.parse(call.function.arguments) as Record<string, unknown>
          console.log(chalk.dim(`  [tool] ${call.function.name}(${JSON.stringify(args)})`))
          const result = await dispatchTool(call.function.name, args, rl)
          messages.push({ role: 'tool', tool_call_id: call.id, content: result })
        }

        response = await client.chat.completions.create({
          model: config.model,
          messages,
          tools: AGENT_TOOLS,
          tool_choice: 'auto',
        })
        message = response.choices[0].message
      }

      messages.push(message)
      const formatted = formatAgentResponse(message.content ?? '')
      console.log(chalk.green('agent> ') + formatted)
      console.log()
    } catch (err) {
      const msg = String(err)
      messages.pop() // remove user message so history stays clean
      if (msg.includes('429')) {
        console.log(chalk.yellow('  rate limited — wait a moment and try again'))
        console.log(chalk.dim(`  or switch model: lifi-cli agent --model meta-llama/llama-3.3-70b-instruct:free`))
      } else if (msg.includes('401') || msg.includes('403')) {
        console.log(chalk.red('  auth error — check your API key: lifi-cli agent --setup'))
      } else {
        console.log(chalk.red('  error: ') + msg)
      }
      console.log()
    }
  }
}
