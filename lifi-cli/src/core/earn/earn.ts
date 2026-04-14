import { getQuote } from '../../api/lifi/index.js'
import { listVaults, getVault, listEarnChains, listEarnProtocols, getPortfolio } from '../../api/lifi/earn.js'
import { CHAIN_IDS } from '../../config/index.js'
import type { EarnParams, EarnQuote } from './earn.types.js'
import type { Vault, VaultListParams, EarnChain, EarnProtocol, PortfolioResponse } from '../../api/lifi/earn.js'

export type { Vault, EarnChain, EarnProtocol, PortfolioResponse }

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export async function getEarnQuote(params: EarnParams): Promise<EarnQuote> {
  const chainId = resolveChainId(params.chain)

  // resolve vault: params.protocol can be a vault address or a protocol slug
  let vault: Vault | undefined
  if (params.protocol.startsWith('0x')) {
    vault = await getVault(chainId, params.protocol)
  } else {
    const { vaults } = await listVaults({
      chainId,
      protocol: params.protocol,
      underlyingToken: params.token,
      limit: 1,
    })
    vault = vaults[0]
  }

  if (!vault) {
    throw new Error(
      `No vault found for protocol "${params.protocol}" on chain ${chainId}. ` +
      `Run 'lifi earn vaults' to see available vaults.`
    )
  }

  const response = await getQuote({
    fromChain: chainId,
    toChain: vault.chainId,
    fromToken: params.token,
    toToken: vault.vaultToken.address,
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    toAddress: params.fromAddress,
  })

  return {
    protocol: vault.name,
    fromToken: params.token,
    toToken: vault.vaultToken.symbol,
    fromAmount: response.estimate.fromAmount,
    toAmount: response.estimate.toAmount,
    estimatedApy: vault.apy,
    estimatedDuration: response.estimate.executionDuration,
    gasCostUSD: response.estimate.gasCosts?.[0]?.amount ?? '0',
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

export async function fetchEarnChains(): Promise<EarnChain[]> {
  return listEarnChains()
}

export async function fetchEarnProtocols(): Promise<EarnProtocol[]> {
  return listEarnProtocols()
}

export async function fetchPortfolio(userAddress: string): Promise<PortfolioResponse> {
  return getPortfolio(userAddress)
}
