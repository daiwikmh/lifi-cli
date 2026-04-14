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

export interface Vault {
  chainId: number
  address: string
  name: string
  protocol: string
  underlyingToken: { symbol: string; address: string; decimals: number }
  vaultToken: { symbol: string; address: string; decimals: number }
  apy: number
  tvl: number
  category: string
}

export interface VaultListParams {
  chainId?: number
  protocol?: string
  underlyingToken?: string
  category?: string
  limit?: number
  offset?: number
}

export interface VaultListResponse {
  vaults: Vault[]
  total: number
  limit: number
  offset: number
}

export interface EarnChain {
  id: number
  name: string
  vaultCount: number
}

export interface EarnProtocol {
  name: string
  slug: string
  vaultCount: number
}

export interface Position {
  vault: Vault
  balance: string
  balanceUSD: number
}

export interface PortfolioResponse {
  positions: Position[]
  totalUSD: number
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

export async function listEarnChains(): Promise<EarnChain[]> {
  const { data } = await client.get('/chains')
  return data.chains ?? data
}

export async function listEarnProtocols(): Promise<EarnProtocol[]> {
  const { data } = await client.get('/protocols')
  return data.protocols ?? data
}

export async function getPortfolio(userAddress: string): Promise<PortfolioResponse> {
  const { data } = await client.get(`/portfolio/${userAddress}/positions`)
  return data
}
