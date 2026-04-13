import type { Protocol } from './earn.types.js'

export const PROTOCOLS: Protocol[] = [
  // Morpho vaults — Base
  {
    name: 'Morpho USDC (Base)',
    symbol: 'morpho-usdc',
    vaultToken: '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A',
    underlyingToken: 'USDC',
    chainId: 8453,
    category: 'vault',
  },
  {
    name: 'Morpho WETH (Base)',
    symbol: 'morpho-weth',
    vaultToken: '0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',
    underlyingToken: 'WETH',
    chainId: 8453,
    category: 'vault',
  },
  // Aave V3 — Base
  {
    name: 'Aave V3 USDC (Base)',
    symbol: 'aave-usdc-base',
    vaultToken: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    underlyingToken: 'USDC',
    chainId: 8453,
    category: 'lending',
  },
  // Aave V3 — Ethereum
  {
    name: 'Aave V3 USDC (Ethereum)',
    symbol: 'aave-usdc-eth',
    vaultToken: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    underlyingToken: 'USDC',
    chainId: 1,
    category: 'lending',
  },
  {
    name: 'Aave V3 WETH (Ethereum)',
    symbol: 'aave-weth-eth',
    vaultToken: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
    underlyingToken: 'WETH',
    chainId: 1,
    category: 'lending',
  },
  // Liquid staking — Ethereum
  {
    name: 'Lido wstETH',
    symbol: 'lido-wsteth',
    vaultToken: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    underlyingToken: 'ETH',
    chainId: 1,
    category: 'staking',
  },
  {
    name: 'EtherFi eETH',
    symbol: 'etherfi-eeth',
    vaultToken: '0x35fA164735182de50811E8e2E824cFb9B6118ac2',
    underlyingToken: 'ETH',
    chainId: 1,
    category: 'staking',
  },
  {
    name: 'EtherFi weETH',
    symbol: 'etherfi-weeth',
    vaultToken: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    underlyingToken: 'ETH',
    chainId: 1,
    category: 'staking',
  },
  // Yield — Ethereum
  {
    name: 'Pendle PT-USDC',
    symbol: 'pendle-usdc',
    vaultToken: '0x808507121B80c02388fAd14726482e061B8da827',
    underlyingToken: 'USDC',
    chainId: 1,
    category: 'yield',
  },
  {
    name: 'Ethena USDe',
    symbol: 'ethena-usde',
    vaultToken: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    underlyingToken: 'USDC',
    chainId: 1,
    category: 'yield',
  },
  {
    name: 'Ethena sUSDe',
    symbol: 'ethena-susde',
    vaultToken: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    underlyingToken: 'USDe',
    chainId: 1,
    category: 'yield',
  },
  // Seamless — Base
  {
    name: 'Seamless USDC (Base)',
    symbol: 'seamless-usdc',
    vaultToken: '0x13A13869B814Be8F13B86e9875aB51bda882E391',
    underlyingToken: 'USDC',
    chainId: 8453,
    category: 'lending',
  },
  // Euler — Ethereum
  {
    name: 'Euler USDC',
    symbol: 'euler-usdc',
    vaultToken: '0xd9a442856C234a39a81a089C06451EBAa4306a72',
    underlyingToken: 'USDC',
    chainId: 1,
    category: 'lending',
  },
  // Kinetiq — staking
  {
    name: 'Kinetiq kHYPE',
    symbol: 'kinetiq-khype',
    vaultToken: '0x1Ecd4e50Cd792B6B4628de5AC38fAA0f5cf05682',
    underlyingToken: 'HYPE',
    chainId: 999,
    category: 'staking',
  },
]

export function listProtocols(filter?: { chain?: number; category?: string }): Protocol[] {
  return PROTOCOLS.filter((p) => {
    if (filter?.chain && p.chainId !== filter.chain) return false
    if (filter?.category && p.category !== filter.category) return false
    return true
  })
}

export function getProtocolBySymbol(symbol: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.symbol.toLowerCase() === symbol.toLowerCase())
}
