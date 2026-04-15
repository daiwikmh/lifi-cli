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
import { AGENT_TOOLS } from './tools.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { AgentConfig, AgentMessage } from './agent.types.js'

const DEFAULT_SYSTEM = `You are a DeFi assistant with access to LI.FI tools for bridging, swapping, earning yield, and checking prediction markets on Polymarket, Kalshi, and Manifold. Help users move and grow their crypto. Always confirm transaction details before executing. Present amounts in human-readable form.

IMPORTANT FORMATTING RULES — follow these exactly:
- Plain text only. No markdown of any kind.
- No asterisks (* or **), no underscores for emphasis, no pound signs (#) for headers.
- No emoji characters.
- For tables, use pipe-separated markdown table format (| col | col |) so the terminal can render them — no other table format.
- No bullet points with asterisks. Use a dash (-) for lists if needed.
- Keep responses concise and scannable.`

async function dispatchTool(name: string, args: Record<string, unknown>): Promise<string> {
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
        const q = await getEarnQuote(args as unknown as Parameters<typeof getEarnQuote>[0])
        return JSON.stringify(q, null, 2)
      }
      case 'list_earn_vaults': {
        const result = await fetchVaults(args as Parameters<typeof fetchVaults>[0])
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

    let response = await client.chat.completions.create({
      model: config.model,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
    })

    let message = response.choices[0].message

    while (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message)

      for (const call of message.tool_calls) {
        if (call.type !== 'function') continue
        const args = JSON.parse(call.function.arguments) as Record<string, unknown>
        console.log(chalk.dim(`  [tool] ${call.function.name}(${JSON.stringify(args)})`))
        const result = await dispatchTool(call.function.name, args)
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
  }
}
