import readline from 'readline'
import chalk from 'chalk'
import { printAgentBanner } from '../../display/banner.js'
import { createOpenRouterClient } from '../../api/openrouter/index.js'
import { getBridgeQuote } from '../bridge/index.js'
import { getSwapQuote } from '../swap/index.js'
import { getEarnQuote, fetchVaults, fetchEarnProtocols, fetchPortfolio } from '../earn/index.js'
import { getMarkets } from '../markets/index.js'
import { getKalshiMarkets } from '../kalshi/index.js'
import { getManifoldMarkets } from '../manifold/index.js'
import { getStatus } from '../../api/lifi/index.js'
import { AGENT_TOOLS } from './tools.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { AgentConfig, AgentMessage } from './agent.types.js'

const DEFAULT_SYSTEM = `You are a DeFi assistant with access to LI.FI tools for bridging, swapping, earning yield, and checking prediction markets on Polymarket, Kalshi, and Manifold. Help users move and grow their crypto. Always confirm transaction details before executing. Present amounts in human-readable form.`

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
  const client = createOpenRouterClient()
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
    console.log(chalk.green('agent> ') + (message.content ?? ''))
    console.log()
  }
}
