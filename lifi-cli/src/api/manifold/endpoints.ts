import { manifoldClient } from './client.js'

export interface ManifoldMarket {
  id: string
  slug: string
  url: string
  question: string
  probability: number
  volume: number
  volume24Hours: number
  pool: Record<string, number>
  closeTime: number
  createdTime: number
  outcomeType: string
  mechanism: string
  isResolved: boolean
  creatorUsername: string
}

export async function fetchManifoldMarkets(params: {
  limit?: number
  sort?: string
  term?: string
} = {}): Promise<ManifoldMarket[]> {
  const { data } = await manifoldClient.get('/v0/markets', {
    params: {
      limit: params.limit ?? 20,
      sort: params.sort ?? 'created-time',
      ...(params.term ? { term: params.term } : {}),
    },
  })
  return data
}

export async function fetchManifoldMarket(slug: string): Promise<ManifoldMarket> {
  const { data } = await manifoldClient.get(`/v0/slug/${slug}`)
  return data
}
