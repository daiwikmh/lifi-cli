import { fetchManifoldMarkets, fetchManifoldMarket } from '../../api/manifold/index.js'
import type { Market } from '../markets/markets.types.js'

function toMarket(m: Awaited<ReturnType<typeof fetchManifoldMarkets>>[0]): Market {
  const prob = m.probability ?? 0.5
  return {
    id: m.id,
    question: m.question,
    slug: m.slug,
    endDate: m.closeTime ? new Date(m.closeTime).toISOString() : '',
    liquidity: Object.values(m.pool ?? {}).reduce((a, b) => a + b, 0),
    volume: m.volume ?? 0,
    outcomes: m.outcomeType === 'BINARY' ? ['Yes', 'No'] : [m.outcomeType],
    prices: m.outcomeType === 'BINARY' ? [prob, 1 - prob] : [1],
    active: !m.isResolved,
  }
}

export async function getManifoldMarkets(query?: string, limit = 20): Promise<Market[]> {
  const markets = await fetchManifoldMarkets({ limit, sort: 'created-time', term: query })
  return markets.filter((m) => !m.isResolved && m.outcomeType === 'BINARY').map(toMarket)
}

export async function getManifoldMarket(slug: string): Promise<Market | null> {
  try {
    const m = await fetchManifoldMarket(slug)
    return toMarket(m)
  } catch {
    return null
  }
}
