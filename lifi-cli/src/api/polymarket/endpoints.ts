import { createGammaClient } from './client.js'

export interface PolymarketEvent {
  id: string
  title: string
  slug: string
  endDate: string
  volume: number
  liquidity: number
  markets: PolymarketMarket[]
}

export interface PolymarketMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  resolutionSource?: string
  endDate: string
  liquidity: number
  volume: number
  outcomePrices: string
  outcomes: string
  active: boolean
  closed: boolean
}

const gamma = createGammaClient()

export async function searchEvents(query?: string, limit = 20): Promise<PolymarketEvent[]> {
  const { data } = await gamma.get('/events', {
    params: {
      limit,
      active: true,
      closed: false,
      order: 'volume',
      ascending: false,
      ...(query ? { title: query } : {}),
    },
  })
  return data
}

export async function getEvent(slug: string): Promise<PolymarketEvent> {
  const { data } = await gamma.get(`/events/slug/${slug}`)
  return data
}

export async function getMarket(conditionId: string): Promise<PolymarketMarket> {
  const { data } = await gamma.get(`/markets/${conditionId}`)
  return data
}
