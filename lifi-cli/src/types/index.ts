export type ChainId = number
export type Address = `0x${string}`
export type TokenSymbol = string
export type TxHash = `0x${string}`

export interface Token {
  symbol: TokenSymbol
  address: Address
  decimals: number
  chainId: ChainId
  name: string
  logoURI?: string
}

export interface Chain {
  id: ChainId
  name: string
  nativeCurrency: { symbol: string; decimals: number }
}

export interface TransactionRequest {
  to: Address
  from: Address
  data: `0x${string}`
  value: bigint
  gasLimit?: bigint
  chainId: ChainId
}

export interface GlobalOptions {
  json?: boolean
  chain?: string
  wallet?: string
}
