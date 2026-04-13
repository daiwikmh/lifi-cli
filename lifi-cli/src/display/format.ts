export function formatAmount(amount: string | number, decimals = 6): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatAPY(apy: number): string {
  return `${(apy * 100).toFixed(2)}%`
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatChain(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    42161: 'Arbitrum',
    8453: 'Base',
    10: 'Optimism',
    137: 'Polygon',
    56: 'BSC',
    43114: 'Avalanche',
  }
  return names[chainId] ?? `Chain ${chainId}`
}
