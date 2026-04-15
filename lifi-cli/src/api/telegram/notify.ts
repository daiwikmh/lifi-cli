import { getConfigValue } from '../../config/index.js'
import { sendMessage } from './client.js'

export async function notify(text: string): Promise<void> {
  const token = getConfigValue('telegramBotToken')
  const chatId = getConfigValue('telegramChatId')
  if (!token || !chatId) return
  try {
    await sendMessage(token, chatId, text)
  } catch {
    // silent — notifications are best-effort, never block the main flow
  }
}

export function txNotification(opts: {
  type: 'bridge' | 'swap' | 'earn'
  txHash: string
  chainId: number
  detail?: string
}): string {
  const labels: Record<string, string> = { bridge: 'Bridge', swap: 'Swap', earn: 'Earn deposit' }
  const chains: Record<number, string> = {
    1: 'Ethereum', 8453: 'Base', 42161: 'Arbitrum',
    10: 'Optimism', 137: 'Polygon', 56: 'BSC', 43114: 'Avalanche',
  }
  const chain = chains[opts.chainId] ?? `Chain ${opts.chainId}`
  const lines = [
    `<b>lifi-cli</b> — ${labels[opts.type]} submitted`,
    opts.detail ? opts.detail : '',
    `Chain: ${chain}`,
    `Tx: <code>${opts.txHash}</code>`,
    `<i>Run: lifi-cli status ${opts.txHash}</i>`,
  ].filter(Boolean)
  return lines.join('\n')
}
