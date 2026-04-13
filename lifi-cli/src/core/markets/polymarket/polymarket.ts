import { searchEvents, getEvent } from '../../../api/polymarket/index.js'
import type { Market } from '../markets.types.js'

function parseOutcomes(market: { outcomes: string; outcomePrices: string }): { outcomes: string[]; prices: number[] } {
  try {
    const outcomes = JSON.parse(market.outcomes) as string[]
    const prices = JSON.parse(market.outcomePrices).map(Number) as number[]
    return { outcomes, prices }
  } catch {
    return { outcomes: [], prices: [] }
  }
}

export async function getMarkets(query?: string, limit = 20): Promise<Market[]> {
  const events = await searchEvents(query, limit)
  const markets: Market[] = []

  for (const event of events) {
    for (const m of event.markets ?? []) {
      if (!m.active || m.closed) continue
      const { outcomes, prices } = parseOutcomes(m)
      markets.push({
        id: m.conditionId,
        question: m.question,
        slug: m.slug,
        endDate: m.endDate,
        liquidity: m.liquidity,
        volume: m.volume,
        outcomes,
        prices,
        active: m.active,
      })
    }
  }

  return markets
}

export async function getMarketBySlug(slug: string): Promise<Market | null> {
  try {
    const event = await getEvent(slug)
    const m = event.markets?.[0]
    if (!m) return null
    const { outcomes, prices } = parseOutcomes(m)
    return {
      id: m.conditionId,
      question: m.question,
      slug: m.slug,
      endDate: m.endDate,
      liquidity: m.liquidity,
      volume: m.volume,
      outcomes,
      prices,
      active: m.active,
    }
  } catch {
    return null
  }
}
