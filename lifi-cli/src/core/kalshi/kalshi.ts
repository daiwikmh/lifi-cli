import { fetchKalshiMarkets, fetchKalshiMarket } from '../../api/kalshi/index.js'
import type { Market } from '../markets/markets.types.js'

function toMarket(m: Awaited<ReturnType<typeof fetchKalshiMarkets>>['markets'][0]): Market {
  const yesProbability = ((m.yes_bid + m.yes_ask) / 2) / 100
  return {
    id: m.ticker,
    question: m.title,
    slug: m.ticker,
    endDate: m.close_time,
    liquidity: 0,
    volume: m.volume ?? 0,
    outcomes: ['Yes', 'No'],
    prices: [yesProbability, 1 - yesProbability],
    active: m.status === 'open',
  }
}

export async function getKalshiMarkets(query?: string, limit = 20): Promise<Market[]> {
  const response = await fetchKalshiMarkets({ limit, status: 'open' })
  const markets = response.markets.map(toMarket)
  if (!query) return markets
  const q = query.toLowerCase()
  return markets.filter((m) => m.question.toLowerCase().includes(q))
}

export async function getKalshiMarket(ticker: string): Promise<Market | null> {
  try {
    const { market: m } = await fetchKalshiMarket(ticker)
    return toMarket(m)
  } catch {
    return null
  }
}
