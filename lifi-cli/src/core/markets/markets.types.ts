export interface Market {
  id: string
  question: string
  slug: string
  endDate: string
  liquidity: number
  volume: number
  outcomes: string[]
  prices: number[]
  active: boolean
}

export interface MarketOrder {
  marketId: string
  outcome: string
  amount: number
  price: number
  txHash?: string
}
