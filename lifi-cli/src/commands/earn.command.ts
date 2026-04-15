import { Command } from 'commander'
import chalk from 'chalk'
import { getEarnQuote, fetchVaults, fetchVault, fetchEarnProtocols, fetchPortfolio } from '../core/earn/index.js'
import { executeTransaction, ensureAllowance } from '../core/wallet/index.js'
import { makeTable, withSpinner, formatAmount, formatAPY, formatUSD } from '../display/index.js'
import { resolveChain, CHAIN_IDS } from '../config/index.js'
import { toSmallestUnit } from '../core/token/amount.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[String(chain).toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export function earnCommand(): Command {
  const earn = new Command('earn').description('Discover vaults, earn yield, and track positions via LI.FI Earn')

  earn
    .command('quote')
    .description('Get a quote to deposit into a yield vault')
    .requiredOption('--protocol <protocol>', 'protocol slug (e.g. morpho) or vault address (0x...)')
    .requiredOption('--token <token>', 'token to deposit (symbol or address)')
    .requiredOption('--amount <amount>', 'amount in human units (e.g. 10 for 10 USDC)')
    .requiredOption('--wallet <name>', 'wallet name (from lifi wallet list)')
    .option('--chain <chain>', 'chain name or ID', resolveChain())
    .option('--execute', 'sign and submit the deposit transaction')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const rawAmount = await toSmallestUnit(opts.amount, opts.token, opts.chain)
        const quote = await withSpinner('Fetching earn quote...', async () =>
          getEarnQuote({
            protocol: opts.protocol,
            token: opts.token,
            amount: rawAmount,
            chain: opts.chain,
            fromAddress: opts.wallet,
          })
        )

        if (opts.json && !opts.execute) {
          console.log(JSON.stringify(quote, null, 2))
          return
        }

        if (!opts.execute) {
          console.log(makeTable(
            ['Field', 'Value'],
            [
              ['Vault', quote.protocol],
              ['Slug', quote.vaultSlug],
              ['Deposit', `${formatAmount(quote.fromAmount)} ${quote.fromToken}`],
              ['Vault tokens', formatAmount(quote.toAmount)],
              ['Est. APY', quote.estimatedApy != null ? formatAPY(quote.estimatedApy) : 'n/a'],
              ['Est. duration', `${quote.estimatedDuration}s`],
              ['Gas cost', `$${quote.gasCostUSD}`],
            ]
          ))
          if (quote.approvalAddress) {
            console.log(chalk.yellow(`\nApproval needed: ${quote.approvalAddress}`))
          }
          console.log(chalk.dim('\nAdd --execute to submit this deposit.'))
          return
        }

        const tx = quote.transactionRequest

        if (quote.approvalAddress && opts.token.toLowerCase() !== 'eth') {
          await withSpinner('Checking token approval...', async (spinner) => {
            const approvHash = await ensureAllowance(
              tx.to,
              quote.approvalAddress!,
              BigInt(quote.fromAmount),
              opts.wallet,
              tx.chainId
            )
            if (approvHash) spinner.text = `Approval tx sent: ${approvHash}`
          })
        }

        const result = await withSpinner('Submitting deposit...', async () =>
          executeTransaction(
            {
              to: tx.to as `0x${string}`,
              from: tx.from as `0x${string}`,
              data: tx.data as `0x${string}`,
              value: BigInt(tx.value ?? '0'),
              gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
              chainId: tx.chainId,
            },
            opts.wallet
          )
        )

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2))
          return
        }

        console.log(chalk.green('\nDeposit submitted!'))
        console.log(`Hash: ${chalk.cyan(result.txHash)}`)
        console.log(chalk.dim(`Run: lifi status ${result.txHash} to track`))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('vaults')
    .description('List available yield vaults from the LI.FI Earn API')
    .option('--chain <chain>', 'filter by chain name or ID')
    .option('--protocol <protocol>', 'filter by protocol slug (e.g. morpho, aave-v3)')
    .option('--token <token>', 'filter by underlying token symbol')
    .option('--tags <tags>', 'filter by tags (comma-separated)')
    .option('--limit <limit>', 'max results', '20')
    .option('--cursor <cursor>', 'pagination cursor from previous response')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const params: Record<string, unknown> = { limit: parseInt(opts.limit) }
        if (opts.chain) params.chainId = resolveChainId(opts.chain)
        if (opts.protocol) params.protocol = opts.protocol
        if (opts.token) params.underlyingToken = opts.token
        if (opts.tags) params.tags = opts.tags
        if (opts.cursor) params.cursor = opts.cursor

        const result = await withSpinner('Fetching vaults...', () =>
          fetchVaults(params as Parameters<typeof fetchVaults>[0])
        )

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2))
          return
        }

        if (!result.data.length) {
          console.log(chalk.yellow('No vaults found for the given filters.'))
          return
        }

        console.log(makeTable(
          ['Name', 'Protocol', 'Chain', 'Underlying', 'APY', 'TVL'],
          result.data.map((v) => [
            v.name.slice(0, 30),
            v.protocol.name,
            String(v.chainId),
            v.underlyingTokens.map((t) => t.symbol).join(', '),
            v.analytics?.apy?.total != null ? formatAPY(v.analytics.apy.total) : 'n/a',
            v.analytics?.tvl?.usd != null ? formatUSD(parseFloat(v.analytics.tvl.usd)) : 'n/a',
          ])
        ))
        console.log(chalk.dim(`\nShowing ${result.data.length} of ${result.total} vaults.`))
        if (result.nextCursor) {
          console.log(chalk.dim(`Next page: --cursor ${result.nextCursor}`))
        }
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('vault <chainId> <address>')
    .description('Get full details for a single vault')
    .option('--json', 'output as JSON')
    .action(async (chainId, address, opts) => {
      try {
        const vault = await withSpinner('Fetching vault...', () =>
          fetchVault(parseInt(chainId), address)
        )

        if (opts.json) {
          console.log(JSON.stringify(vault, null, 2))
          return
        }

        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Name', vault.name],
            ['Slug', vault.slug],
            ['Protocol', vault.protocol.name],
            ['Chain', String(vault.chainId)],
            ['Address', vault.address],
            ['Underlying', vault.underlyingTokens.map((t) => `${t.symbol} (${t.address})`).join(', ')],
            ['APY (total)', vault.analytics?.apy?.total != null ? formatAPY(vault.analytics.apy.total) : 'n/a'],
            ['APY (base)', vault.analytics?.apy?.base != null ? formatAPY(vault.analytics.apy.base) : 'n/a'],
            ['APY (reward)', vault.analytics?.apy?.reward != null ? formatAPY(vault.analytics.apy.reward) : 'n/a'],
            ['TVL', vault.analytics?.tvl?.usd != null ? formatUSD(parseFloat(vault.analytics.tvl.usd)) : 'n/a'],
            ['Tags', vault.tags?.join(', ') || 'none'],
            ['Redeemable', vault.isRedeemable ? 'yes' : 'no'],
            ['Transactional', vault.isTransactional ? 'yes' : 'no'],
          ]
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('protocols')
    .description('List protocols with active vaults on LI.FI Earn')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const protocols = await withSpinner('Fetching protocols...', fetchEarnProtocols)

        if (opts.json) {
          console.log(JSON.stringify(protocols, null, 2))
          return
        }

        console.log(makeTable(
          ['Protocol', 'URL'],
          protocols.map((p) => [p.name, p.url])
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('portfolio <address>')
    .description('Show all active yield positions for a wallet address')
    .option('--json', 'output as JSON')
    .action(async (address, opts) => {
      try {
        const portfolio = await withSpinner('Fetching portfolio...', () => fetchPortfolio(address))

        if (opts.json) {
          console.log(JSON.stringify(portfolio, null, 2))
          return
        }

        if (!portfolio.positions?.length) {
          console.log(chalk.yellow('No active positions found for this address.'))
          return
        }

        let totalUsd = 0
        console.log(makeTable(
          ['Protocol', 'Asset', 'Balance', 'Value (USD)', 'Chain'],
          portfolio.positions.map((p) => {
            const usd = parseFloat(p.balanceUsd)
            totalUsd += isNaN(usd) ? 0 : usd
            return [
              p.protocolName,
              p.asset.symbol,
              parseFloat(p.balanceNative).toFixed(6),
              formatUSD(p.balanceUsd),
              String(p.chainId),
            ]
          })
        ))
        if (totalUsd > 0) {
          console.log(chalk.dim(`\nTotal: ${formatUSD(totalUsd)}`))
        }
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  return earn
}
