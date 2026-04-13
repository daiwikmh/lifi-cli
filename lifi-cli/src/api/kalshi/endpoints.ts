import { createKalshiClient } from './client.js'

export interface KalshiMarket {
  ticker: string
  title: string
  yes_bid: number
  yes_ask: number
  no_bid: number
  no_ask: number
  volume: number
  volume_24h: number
  open_time: string
  close_time: string
  result: string
  status: string
  category: string
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[]
  cursor: string
}

export async function fetchKalshiMarkets(params: {
  limit?: number
  cursor?: string
  status?: string
  series_ticker?: string
  event_ticker?: string
} = {}): Promise<KalshiMarketsResponse> {
  const client = createKalshiClient()
  const { data } = await client.get('/markets', {
    params: { limit: params.limit ?? 20, status: params.status ?? 'open', ...params },
  })
  return data
}

export async function fetchKalshiMarket(ticker: string): Promise<{ market: KalshiMarket }> {
  const client = createKalshiClient()
  const { data } = await client.get(`/markets/${ticker}`)
  return data
}
