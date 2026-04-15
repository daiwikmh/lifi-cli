import axios from 'axios'
import { getConfigValue } from '../../config/index.js'

const EARN_API_BASE = 'https://earn.li.fi/v1/earn'

function createEarnClient() {
  const apiKey = getConfigValue('lifiApiKey')
  return axios.create({
    baseURL: EARN_API_BASE,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-lifi-api-key': apiKey } : {}),
    },
  })
}

export interface UnderlyingToken {
  symbol: string
  address: string
  decimals: number
}

export interface VaultAnalytics {
  apy: {
    base: number
    total: number
    reward: number | null
  }
  tvl: {
    usd: string
  }
  apy1d: number | null
  apy7d: number | null
  apy30d: number | null
  updatedAt: string
}

export interface Vault {
  name: string
  slug: string
  address: string
  chainId: number
  network: string
  tags: string[]
  protocol: { name: string; url: string }
  provider: string
  description: string
  analytics: VaultAnalytics
  underlyingTokens: UnderlyingToken[]
  depositPacks: Array<{ name: string; stepsType: string }>
  redeemPacks: Array<{ name: string; stepsType: string }>
  isRedeemable: boolean
  isTransactional: boolean
  syncedAt: string
}

export interface VaultListParams {
  chainId?: number
  protocol?: string
  underlyingToken?: string
  tags?: string
  limit?: number
  cursor?: string
}

export interface VaultListResponse {
  data: Vault[]
  nextCursor: string | null
  total: number
}

export interface EarnProtocol {
  name: string
  url: string
}

export interface Position {
  chainId: number
  address: string
  protocolName: string
  asset: { address: string; name: string; symbol: string; decimals: number }
  balanceUsd: string
  balanceNative: string
}

export interface PortfolioResponse {
  positions: Position[]
}

const client = createEarnClient()

export async function listVaults(params?: VaultListParams): Promise<VaultListResponse> {
  const { data } = await client.get('/vaults', { params })
  return data
}

export async function getVault(chainId: number, address: string): Promise<Vault> {
  const { data } = await client.get(`/vaults/${chainId}/${address}`)
  return data
}

export async function listEarnProtocols(): Promise<EarnProtocol[]> {
  const { data } = await client.get('/protocols')
  return Array.isArray(data) ? data : (data.protocols ?? [])
}

export async function getPortfolio(userAddress: string): Promise<PortfolioResponse> {
  const { data } = await client.get(`/portfolio/${userAddress}/positions`)
  return data
}
