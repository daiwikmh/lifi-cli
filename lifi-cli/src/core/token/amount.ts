import { getTokens } from '../../api/lifi/index.js'
import { CHAIN_IDS } from '../../config/index.js'

const COMMON_DECIMALS: Record<string, number> = {
  eth: 18,
  weth: 18,
  matic: 18,
  bnb: 18,
  avax: 18,
  ftm: 18,
  cro: 18,
  one: 18,
  glmr: 18,
  metis: 18,
  usdc: 6,
  usdt: 6,
  usdbc: 6,
  dai: 18,
  busd: 18,
  frax: 18,
  wbtc: 8,
  btcb: 8,
}

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  return CHAIN_IDS[String(chain).toLowerCase()] ?? 0
}

async function fetchDecimals(token: string, chainId: number): Promise<number> {
  try {
    const resp = await getTokens([chainId])
    const chainTokens = resp.tokens[String(chainId)] ?? []
    const match = chainTokens.find(
      (t) => t.symbol.toLowerCase() === token.toLowerCase() || t.address.toLowerCase() === token.toLowerCase()
    )
    return match?.decimals ?? 18
  } catch {
    return 18
  }
}

export async function toSmallestUnit(humanAmount: string, token: string, chain: string | number): Promise<string> {
  // already in smallest unit if no decimal point and large number
  const parsed = parseFloat(humanAmount)
  if (isNaN(parsed)) throw new Error(`Invalid amount: ${humanAmount}`)

  const sym = token.toLowerCase().replace(/^0x[0-9a-f]{40}$/i, '')
  let decimals = COMMON_DECIMALS[sym]

  if (decimals === undefined) {
    const chainId = resolveChainId(chain)
    decimals = await fetchDecimals(token, chainId)
  }

  const factor = BigInt(10) ** BigInt(decimals)
  // avoid floating point precision issues
  const [whole, frac = ''] = humanAmount.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  const result = BigInt(whole) * factor + BigInt(fracPadded)
  return result.toString()
}
