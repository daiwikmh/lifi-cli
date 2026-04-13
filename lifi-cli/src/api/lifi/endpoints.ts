import { createLifiClient } from './client.js'

export interface QuoteParams {
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  fromAmount: string
  fromAddress: string
  toAddress?: string
  slippage?: number
  allowTools?: string[]
  denyTools?: string[]
}

export interface RouteStep {
  type: string
  tool: string
  toolDetails: { name: string; logoURI?: string }
  action: {
    fromToken: { symbol: string; address: string; decimals: number }
    toToken: { symbol: string; address: string; decimals: number }
    fromAmount: string
    toAmount: string
    fromChainId: number
    toChainId: number
  }
  estimate: {
    fromAmount: string
    toAmount: string
    toAmountMin: string
    gasCosts: Array<{ amount: string; token: { symbol: string } }>
    executionDuration: number
  }
}

export interface QuoteResponse {
  id: string
  type: string
  action: QuoteParams
  estimate: {
    fromAmount: string
    toAmount: string
    toAmountMin: string
    approvalAddress: string
    executionDuration: number
    gasCosts: Array<{ amount: string; token: { symbol: string } }>
  }
  steps: RouteStep[]
  transactionRequest: {
    to: string
    from: string
    data: string
    value: string
    gasLimit: string
    chainId: number
  }
}

export interface StatusResponse {
  transactionId: string
  status: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED'
  substatus?: string
  sending?: { txHash: string; chainId: number }
  receiving?: { txHash: string; chainId: number }
}

export interface TokensResponse {
  tokens: Record<string, Array<{ symbol: string; address: string; decimals: number; chainId: number; name: string }>>
}

const client = createLifiClient()

export async function getQuote(params: QuoteParams): Promise<QuoteResponse> {
  const { data } = await client.get('/quote', { params })
  return data
}

export async function getStatus(txHash: string, bridge?: string, fromChain?: number, toChain?: number): Promise<StatusResponse> {
  const { data } = await client.get('/status', { params: { txHash, bridge, fromChain, toChain } })
  return data
}

export async function getTokens(chains?: number[]): Promise<TokensResponse> {
  const { data } = await client.get('/tokens', { params: chains ? { chains: chains.join(',') } : {} })
  return data
}

export async function getChains(): Promise<Array<{ id: number; name: string; nativeCurrency: { symbol: string } }>> {
  const { data } = await client.get('/chains')
  return data.chains
}
