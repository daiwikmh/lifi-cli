import { OpenAI } from 'openai';

type ChainId = number;
type Address = `0x${string}`;
type TokenSymbol = string;
type TxHash = `0x${string}`;
interface Token {
    symbol: TokenSymbol;
    address: Address;
    decimals: number;
    chainId: ChainId;
    name: string;
    logoURI?: string;
}
interface Chain {
    id: ChainId;
    name: string;
    nativeCurrency: {
        symbol: string;
        decimals: number;
    };
}
interface TransactionRequest {
    to: Address;
    from: Address;
    data: `0x${string}`;
    value: bigint;
    gasLimit?: bigint;
    chainId: ChainId;
}
interface GlobalOptions {
    json?: boolean;
    chain?: string;
    wallet?: string;
}

interface BridgeParams {
    fromChain: ChainId | string;
    toChain: ChainId | string;
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress: Address;
    toAddress?: Address;
    slippage?: number;
}
interface BridgeQuote {
    id: string;
    fromChain: ChainId;
    toChain: ChainId;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    estimatedDuration: number;
    gasCostUSD: string;
    tool: string;
    transactionRequest: {
        to: Address;
        from: Address;
        data: `0x${string}`;
        value: string;
        gasLimit: string;
        chainId: ChainId;
    };
    approvalAddress?: Address;
}
interface BridgeResult {
    txHash: TxHash;
    fromChain: ChainId;
    toChain: ChainId;
    status: 'pending' | 'done' | 'failed';
}

declare function getBridgeQuote(params: BridgeParams): Promise<BridgeQuote>;

interface SwapParams {
    chain: ChainId | string;
    fromToken: string;
    toToken: string;
    amount: string;
    fromAddress: Address;
    slippage?: number;
}
interface SwapQuote {
    id: string;
    chain: ChainId;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    toAmountMin: string;
    estimatedDuration: number;
    gasCostUSD: string;
    tool: string;
    transactionRequest: {
        to: Address;
        from: Address;
        data: `0x${string}`;
        value: string;
        gasLimit: string;
        chainId: ChainId;
    };
    approvalAddress?: Address;
}
interface SwapResult {
    txHash: TxHash;
    chain: ChainId;
    status: 'pending' | 'done' | 'failed';
}

declare function getSwapQuote(params: SwapParams): Promise<SwapQuote>;

interface Vault {
    chainId: number;
    address: string;
    name: string;
    protocol: string;
    underlyingToken: {
        symbol: string;
        address: string;
        decimals: number;
    };
    vaultToken: {
        symbol: string;
        address: string;
        decimals: number;
    };
    apy: number;
    tvl: number;
    category: string;
}
interface VaultListParams {
    chainId?: number;
    protocol?: string;
    underlyingToken?: string;
    category?: string;
    limit?: number;
    offset?: number;
}
interface VaultListResponse {
    vaults: Vault[];
    total: number;
    limit: number;
    offset: number;
}
interface EarnChain {
    id: number;
    name: string;
    vaultCount: number;
}
interface EarnProtocol {
    name: string;
    slug: string;
    vaultCount: number;
}
interface Position {
    vault: Vault;
    balance: string;
    balanceUSD: number;
}
interface PortfolioResponse {
    positions: Position[];
    totalUSD: number;
}

interface EarnParams {
    protocol: string;
    token: string;
    amount: string;
    chain: ChainId | string;
    fromAddress: Address;
}
interface EarnQuote {
    protocol: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    estimatedApy?: number;
    estimatedDuration: number;
    gasCostUSD: string;
    transactionRequest: {
        to: Address;
        from: Address;
        data: `0x${string}`;
        value: string;
        gasLimit: string;
        chainId: ChainId;
    };
    approvalAddress?: Address;
}

declare function getEarnQuote(params: EarnParams): Promise<EarnQuote>;
declare function fetchVaults(params?: VaultListParams): Promise<VaultListResponse>;
declare function fetchVault(chainId: number, address: string): Promise<Vault>;
declare function fetchEarnChains(): Promise<EarnChain[]>;
declare function fetchEarnProtocols(): Promise<EarnProtocol[]>;
declare function fetchPortfolio(userAddress: string): Promise<PortfolioResponse>;

interface Market {
    id: string;
    question: string;
    slug: string;
    endDate: string;
    liquidity: number;
    volume: number;
    outcomes: string[];
    prices: number[];
    active: boolean;
}
interface MarketOrder {
    marketId: string;
    outcome: string;
    amount: number;
    price: number;
    txHash?: string;
}

declare function getMarkets(query?: string, limit?: number): Promise<Market[]>;
declare function getMarketBySlug(slug: string): Promise<Market | null>;

interface PolymarketPosition {
    marketId: string;
    question: string;
    outcome: string;
    shares: number;
    currentValue: number;
}

interface AgentConfig {
    model: string;
    systemPrompt?: string;
    maxIterations?: number;
}
type AgentTool = OpenAI.Chat.Completions.ChatCompletionTool;
type AgentMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

declare function runAgent(config: AgentConfig): Promise<void>;

declare const AGENT_TOOLS: AgentTool[];

interface Wallet {
    name: string;
    address: Address;
    chainId?: number;
    createdAt: string;
}
interface WalletStore {
    wallets: Wallet[];
}

declare function createWallet(name: string): Promise<Wallet>;
declare function importWallet(name: string, privateKey: `0x${string}`): Promise<Wallet>;
declare function listWallets(): Wallet[];
declare function getWalletKey(name: string): Promise<`0x${string}`>;

interface ExecuteResult {
    txHash: TxHash;
    chainId: ChainId;
}
declare function executeTransaction(tx: TransactionRequest, walletName: string): Promise<ExecuteResult>;
declare function ensureAllowance(tokenAddress: Address, spender: Address, amount: bigint, walletName: string, chainId: ChainId): Promise<TxHash | null>;

interface Config {
    lifiApiKey?: string;
    openrouterApiKey?: string;
    polymarketApiKey?: string;
    kalshiApiKey?: string;
    defaultChain?: string;
    defaultWallet?: string;
}
declare function loadConfig(): Config;
declare function saveConfig(updates: Partial<Config>): void;
declare function getConfigValue<K extends keyof Config>(key: K): Config[K];
declare function resolveChain(chain?: string): string;

declare const LIFI_API_BASE = "https://li.quest/v1";
declare const CHAIN_IDS: Record<string, number>;
declare const CHAIN_NAMES: Record<number, string>;
declare const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";
declare const DEFAULT_CHAIN = "base";
declare const CONFIG_DIR: string;
declare const CONFIG_FILE: string;
declare const WALLETS_DIR: string;

export { AGENT_TOOLS, type Address, type AgentConfig, type AgentMessage, type AgentTool, type BridgeParams, type BridgeQuote, type BridgeResult, CHAIN_IDS, CHAIN_NAMES, CONFIG_DIR, CONFIG_FILE, type Chain, type ChainId, DEFAULT_CHAIN, type EarnChain, type EarnParams, type EarnProtocol, type EarnQuote, type ExecuteResult, type GlobalOptions, LIFI_API_BASE, type Market, type MarketOrder, NATIVE_TOKEN, type PolymarketPosition, type PortfolioResponse, type SwapParams, type SwapQuote, type SwapResult, type Token, type TokenSymbol, type TransactionRequest, type TxHash, type Vault, WALLETS_DIR, type Wallet, type WalletStore, createWallet, ensureAllowance, executeTransaction, fetchEarnChains, fetchEarnProtocols, fetchPortfolio, fetchVault, fetchVaults, getBridgeQuote, getConfigValue, getEarnQuote, getMarketBySlug, getMarkets, getSwapQuote, getWalletKey, importWallet, listWallets, loadConfig, resolveChain, runAgent, saveConfig };
