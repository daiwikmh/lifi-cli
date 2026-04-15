import { getQuote } from '../../api/lifi/index.js'
import { listVaults, getVault, listEarnProtocols, getPortfolio } from '../../api/lifi/earn.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { EarnParams, EarnQuote } from './earn.types.js'
import type { Vault, VaultListParams, EarnProtocol, PortfolioResponse } from '../../api/lifi/earn.js'

export type { Vault, VaultListParams, EarnProtocol, PortfolioResponse }

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

async function resolveVault(protocol: string, chainId: number, token?: string): Promise<Vault> {
  // vault address passed directly
  if (protocol.startsWith('0x')) {
    return getVault(chainId, protocol)
  }

  // protocol slug — find best matching vault
  const params: VaultListParams = { chainId, protocol, limit: 5 }
  if (token) params.underlyingToken = token

  const { data: vaults } = await listVaults(params)

  if (!vaults.length) {
    throw new Error(
      `No vault found for protocol "${protocol}" on chain ${chainId}. ` +
      `Run 'lifi earn vaults' to see available vaults.`
    )
  }

  // prefer vault whose underlying token matches
  if (token) {
    const match = vaults.find((v) =>
      v.underlyingTokens.some((t) => t.symbol.toLowerCase() === token.toLowerCase())
    )
    if (match) return match
  }

  return vaults[0]
}

export async function getEarnQuote(params: EarnParams): Promise<EarnQuote> {
  const chainId = resolveChainId(params.chain)
  const vault = await resolveVault(params.protocol, chainId, params.token)

  // Composer: same /quote endpoint, toToken = vault address
  const response = await getQuote({
    fromChain: chainId,
    toChain: vault.chainId,
    fromToken: params.token,
    toToken: vault.address,       // vault address IS the toToken
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress,
  })

  const apy = vault.analytics?.apy?.total ?? null
  const underlying = vault.underlyingTokens[0]

  return {
    protocol: vault.name,
    vaultSlug: vault.slug,
    vaultAddress: vault.address,
    fromToken: underlying?.symbol ?? params.token,
    toToken: vault.name,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    estimatedApy: apy,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amountUSD ?? '0',
    transactionRequest: response.transactionRequest as EarnQuote['transactionRequest'],
    approvalAddress: response.estimate.approvalAddress as EarnQuote['approvalAddress'],
  }
}

export async function fetchVaults(params?: VaultListParams) {
  return listVaults(params)
}

export async function fetchVault(chainId: number, address: string) {
  return getVault(chainId, address)
}

export async function fetchEarnProtocols(): Promise<EarnProtocol[]> {
  return listEarnProtocols()
}

export async function fetchPortfolio(userAddress: string): Promise<PortfolioResponse> {
  return getPortfolio(userAddress)
}
