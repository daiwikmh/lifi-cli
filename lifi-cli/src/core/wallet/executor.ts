import { createWalletClient, createPublicClient, http, parseEther, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getWalletKey } from './wallet.js'
import type { TransactionRequest, TxHash, Address, ChainId } from '../../types/index.js'

const PUBLIC_RPC: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  10: 'https://mainnet.optimism.io',
  56: 'https://bsc-dataseed.binance.org',
  137: 'https://polygon-rpc.com',
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
}

function getViemChain(chainId: ChainId) {
  return {
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [PUBLIC_RPC[chainId] ?? `https://rpc.ankr.com/eth`] } },
  }
}

export interface ExecuteResult {
  txHash: TxHash
  chainId: ChainId
}

export async function executeTransaction(
  tx: TransactionRequest,
  walletName: string
): Promise<ExecuteResult> {
  const privateKey = await getWalletKey(walletName)
  const account = privateKeyToAccount(privateKey)
  const chain = getViemChain(tx.chainId)

  const client = createWalletClient({ account, chain, transport: http() })

  const hash = await client.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value,
    gas: tx.gasLimit,
  })

  return { txHash: hash, chainId: tx.chainId }
}

export async function ensureAllowance(
  tokenAddress: Address,
  spender: Address,
  amount: bigint,
  walletName: string,
  chainId: ChainId
): Promise<TxHash | null> {
  const privateKey = await getWalletKey(walletName)
  const account = privateKeyToAccount(privateKey)
  const chain = getViemChain(chainId)

  const publicClient = createPublicClient({ chain, transport: http() })
  const walletClient = createWalletClient({ account, chain, transport: http() })

  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, spender],
  })

  if (allowance >= amount) return null

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spender, amount],
  })

  return hash
}
