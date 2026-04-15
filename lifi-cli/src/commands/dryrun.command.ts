import { Command } from 'commander'
import chalk from 'chalk'
import { getBridgeQuote } from '../core/bridge/index.js'
import { getSwapQuote } from '../core/swap/index.js'
import { getEarnQuote, fetchVault, fetchVaults } from '../core/earn/index.js'
import { makeTable, withSpinner, formatAmount, formatTokenAmount, formatChain, formatAPY, formatUSD } from '../display/index.js'
import { CHAIN_IDS } from '../config/index.js'
import { toSmallestUnit } from '../core/token/amount.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[String(chain).toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

function dryRunHeader(label: string) {
  console.log()
  console.log(chalk.yellow('  DRY RUN') + chalk.dim(` — ${label}`))
  console.log(chalk.dim('  ' + '─'.repeat(52)))
}

function dryRunFooter() {
  console.log()
  console.log(chalk.dim('  ' + '─'.repeat(52)))
  console.log(chalk.yellow('  Transaction NOT submitted.') + chalk.dim(' Remove --dry-run to execute.'))
  console.log()
}

export function dryrunCommand(): Command {
  const dryrun = new Command('dryrun').description('Simulate a transaction without submitting it')

  dryrun
    .command('bridge')
    .description('Simulate a cross-chain bridge')
    .requiredOption('--from <token>', 'token to send (symbol or address)')
    .requiredOption('--to <token>', 'token to receive (symbol or address)')
    .requiredOption('--from-chain <chain>', 'source chain (name or ID)')
    .requiredOption('--to-chain <chain>', 'destination chain (name or ID)')
    .requiredOption('--amount <amount>', 'amount in human units (e.g. 100 for 100 USDC, 0.01 for 0.01 ETH)')
    .requiredOption('--from-address <address>', 'sender address (0x...)')
    .option('--slippage <slippage>', 'slippage tolerance', '0.005')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const rawAmount = await toSmallestUnit(opts.amount, opts.from, opts.fromChain)
        const quote = await withSpinner('Simulating bridge...', async () =>
          getBridgeQuote({
            fromChain: opts.fromChain,
            toChain: opts.toChain,
            fromToken: opts.from,
            toToken: opts.to,
            amount: rawAmount,
            fromAddress: opts.fromAddress,
            slippage: parseFloat(opts.slippage),
          })
        )

        if (opts.json) {
          console.log(JSON.stringify({ dryRun: true, type: 'bridge', quote }, null, 2))
          return
        }

        dryRunHeader('bridge')
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['From', `${formatTokenAmount(quote.fromAmount, quote.fromDecimals)} ${opts.from} on ${formatChain(quote.fromChain)}`],
            ['To', `${formatTokenAmount(quote.toAmount, quote.toDecimals)} ${opts.to} on ${formatChain(quote.toChain)}`],
            ['Min received', `${formatTokenAmount(quote.toAmountMin, quote.toDecimals)} ${opts.to}`],
            ['Slippage', `${(parseFloat(opts.slippage) * 100).toFixed(2)}%`],
            ['Bridge protocol', quote.tool],
            ['Est. duration', `${quote.estimatedDuration}s (~${Math.ceil(quote.estimatedDuration / 60)} min)`],
            ['Gas cost', `$${quote.gasCostUSD}`],
            ['Approval needed', quote.approvalAddress ? chalk.yellow('yes — ' + quote.approvalAddress) : 'no'],
            ['Contract', quote.transactionRequest.to],
            ['Gas limit', quote.transactionRequest.gasLimit],
          ]
        ))
        dryRunFooter()
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  dryrun
    .command('swap')
    .description('Simulate a single-chain token swap')
    .requiredOption('--from <token>', 'token to swap from')
    .requiredOption('--to <token>', 'token to swap to')
    .requiredOption('--amount <amount>', 'amount in human units (e.g. 0.01 for 0.01 ETH, 100 for 100 USDC)')
    .requiredOption('--from-address <address>', 'sender address (0x...)')
    .option('--chain <chain>', 'chain name or ID', 'base')
    .option('--slippage <slippage>', 'slippage tolerance', '0.005')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const rawAmount = await toSmallestUnit(opts.amount, opts.from, opts.chain)
        const quote = await withSpinner('Simulating swap...', async () =>
          getSwapQuote({
            chain: opts.chain,
            fromToken: opts.from,
            toToken: opts.to,
            amount: rawAmount,
            fromAddress: opts.fromAddress,
            slippage: parseFloat(opts.slippage),
          })
        )

        const priceImpact = quote.toAmountMin && quote.toAmount
          ? ((1 - parseFloat(quote.toAmountMin) / parseFloat(quote.toAmount)) * 100).toFixed(3)
          : 'n/a'

        if (opts.json) {
          console.log(JSON.stringify({ dryRun: true, type: 'swap', quote, priceImpact }, null, 2))
          return
        }

        dryRunHeader('swap')
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Chain', formatChain(quote.chain)],
            ['From', `${formatTokenAmount(quote.fromAmount, quote.fromDecimals)} ${opts.from}`],
            ['To', `${formatTokenAmount(quote.toAmount, quote.toDecimals)} ${opts.to}`],
            ['Min received', `${formatTokenAmount(quote.toAmountMin, quote.toDecimals)} ${opts.to}`],
            ['Price impact', `${priceImpact}%`],
            ['Slippage', `${(parseFloat(opts.slippage) * 100).toFixed(2)}%`],
            ['DEX', quote.tool],
            ['Gas cost', `$${quote.gasCostUSD}`],
            ['Approval needed', quote.approvalAddress ? chalk.yellow('yes — ' + quote.approvalAddress) : 'no'],
            ['Contract', quote.transactionRequest.to],
            ['Gas limit', quote.transactionRequest.gasLimit],
          ]
        ))
        dryRunFooter()
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  dryrun
    .command('earn')
    .description('Simulate a yield vault deposit')
    .requiredOption('--protocol <protocol>', 'protocol slug or vault address (0x...)')
    .requiredOption('--token <token>', 'token to deposit (symbol or address)')
    .requiredOption('--amount <amount>', 'amount in human units (e.g. 10 for 10 USDC)')
    .requiredOption('--from-address <address>', 'sender address (0x...)')
    .option('--chain <chain>', 'chain name or ID', 'base')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const chainId = resolveChainId(opts.chain)
        const rawAmount = await toSmallestUnit(opts.amount, opts.token, opts.chain)

        // fetch vault metadata alongside quote
        const [quote, vaultMeta] = await withSpinner('Simulating earn deposit...', async () => {
          const q = await getEarnQuote({
            protocol: opts.protocol,
            token: opts.token,
            amount: rawAmount,
            chain: opts.chain,
            fromAddress: opts.fromAddress,
          })

          let vault = null
          try {
            if (opts.protocol.startsWith('0x')) {
              vault = await fetchVault(chainId, opts.protocol)
            } else {
              const { data: vaults } = await fetchVaults({ chainId, protocol: opts.protocol, limit: 1 })
              vault = vaults[0] ?? null
            }
          } catch { /* vault metadata is best-effort */ }

          return [q, vault] as const
        })

        if (opts.json) {
          console.log(JSON.stringify({ dryRun: true, type: 'earn', quote, vault: vaultMeta }, null, 2))
          return
        }

        const apy = vaultMeta?.analytics?.apy?.total ?? quote.estimatedApy ?? null
        const tvlUsd = vaultMeta?.analytics?.tvl?.usd != null ? parseFloat(vaultMeta.analytics.tvl.usd) : null
        const underlying = vaultMeta?.underlyingTokens?.map((t) => t.symbol).join(', ') ?? opts.token

        dryRunHeader('earn deposit')
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Vault', quote.protocol],
            ['Slug', quote.vaultSlug],
            ['Chain', formatChain(chainId)],
            ['Underlying', underlying],
            ['Deposit', `${opts.amount} ${quote.fromToken}`],
            ['Vault tokens received', formatAmount(quote.toAmount)],
            ['APY (total)', apy != null ? formatAPY(apy) : 'n/a'],
            ['APY (base)', vaultMeta?.analytics?.apy?.base != null ? formatAPY(vaultMeta.analytics.apy.base) : 'n/a'],
            ['APY (reward)', vaultMeta?.analytics?.apy?.reward != null ? formatAPY(vaultMeta.analytics.apy.reward) : 'n/a'],
            ['TVL', tvlUsd != null ? formatUSD(tvlUsd) : 'n/a'],
            ['Protocol', vaultMeta?.protocol?.name ?? 'n/a'],
            ['Vault address', quote.vaultAddress],
            ['Est. duration', `${quote.estimatedDuration}s`],
            ['Gas cost', `$${quote.gasCostUSD}`],
            ['Approval needed', quote.approvalAddress ? chalk.yellow('yes — ' + quote.approvalAddress) : 'no'],
            ['Contract', quote.transactionRequest.to],
          ]
        ))

        if (apy != null) {
          const depositUnits = parseFloat(opts.amount)
          const dailyYield = depositUnits * apy / 365
          const monthlyYield = dailyYield * 30
          console.log()
          console.log(chalk.dim('  Projected yield (on deposit):'))
          console.log(`    daily   ${chalk.cyan(formatUSD(dailyYield))}`)
          console.log(`    monthly ${chalk.cyan(formatUSD(monthlyYield))}`)
        }

        dryRunFooter()
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  return dryrun
}
