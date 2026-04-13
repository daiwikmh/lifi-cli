export const LIFI_API_BASE = 'https://li.quest/v1'

export const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  eth: 1,
  arbitrum: 42161,
  base: 8453,
  optimism: 10,
  polygon: 137,
  matic: 137,
  bsc: 56,
  avalanche: 43114,
  avax: 43114,
}

export const CHAIN_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_IDS).map(([name, id]) => [id, name])
)

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

export const DEFAULT_CHAIN = 'base'
export const CONFIG_DIR = `${process.env.HOME}/.lifi`
export const CONFIG_FILE = `${CONFIG_DIR}/config.json`
export const WALLETS_DIR = `${CONFIG_DIR}/wallets`
