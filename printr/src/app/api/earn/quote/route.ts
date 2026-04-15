import type { NextRequest } from 'next/server'

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1, eth: 1,
  arbitrum: 42161,
  base: 8453,
  optimism: 10,
  polygon: 137, matic: 137,
  bsc: 56,
  avalanche: 43114, avax: 43114,
}

function resolveChainId(chain: string): number {
  const n = parseInt(chain)
  if (!isNaN(n)) return n
  const id = CHAIN_IDS[chain.toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

async function resolveVault(protocol: string, chainId: number, token?: string) {
  if (protocol.startsWith('0x')) {
    const res = await fetch(`https://earn.li.fi/v1/earn/vaults/${chainId}/${protocol}`)
    if (!res.ok) throw new Error(`Vault not found: ${protocol}`)
    return res.json()
  }

  const params = new URLSearchParams({ chainId: String(chainId), protocol, limit: '5' })
  if (token) params.set('underlyingToken', token)

  const res = await fetch(`https://earn.li.fi/v1/earn/vaults?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch vaults: ${res.status}`)
  const { data: vaults } = await res.json()

  if (!vaults?.length) throw new Error(`No vault found for protocol "${protocol}" on chain ${chainId}`)

  if (token) {
    const match = vaults.find((v: { underlyingTokens: Array<{ symbol: string }> }) =>
      v.underlyingTokens.some((t: { symbol: string }) => t.symbol.toLowerCase() === token.toLowerCase())
    )
    if (match) return match
  }
  return vaults[0]
}

export async function POST(request: NextRequest) {
  try {
    const { protocol, token, amount, chain, fromAddress } = await request.json()

    if (!protocol || !token || !amount || !chain) {
      return Response.json({ error: 'protocol, token, amount, chain are required' }, { status: 400 })
    }

    const chainId = resolveChainId(String(chain))
    const vault = await resolveVault(String(protocol), chainId, token)

    const params = new URLSearchParams({
      fromChain: String(chainId),
      toChain: String(vault.chainId),
      fromToken: token,
      toToken: vault.address,
      fromAmount: String(amount),
      fromAddress: fromAddress || '0x0000000000000000000000000000000000000001',
      toAddress: fromAddress || '0x0000000000000000000000000000000000000001',
    })

    const quoteRes = await fetch(`https://li.quest/v1/quote?${params}`)
    if (!quoteRes.ok) {
      const err = await quoteRes.json().catch(() => ({ message: quoteRes.statusText }))
      return Response.json({ error: err.message ?? `Quote failed: ${quoteRes.status}` }, { status: quoteRes.status })
    }
    const quote = await quoteRes.json()

    const apy = vault.analytics?.apy?.total ?? null
    return Response.json({
      protocol: vault.name,
      vaultSlug: vault.slug,
      vaultAddress: vault.address,
      fromToken: vault.underlyingTokens?.[0]?.symbol ?? token,
      fromAmount: quote.estimate.fromAmount,
      toAmount: quote.estimate.toAmount,
      estimatedApy: apy,
      estimatedDuration: quote.estimate.executionDuration,
      gasCostUSD: quote.estimate.gasCosts?.[0]?.amountUSD ?? '0',
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
