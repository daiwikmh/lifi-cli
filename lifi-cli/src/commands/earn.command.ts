import { Command } from 'commander'
import chalk from 'chalk'
import { getEarnQuote, fetchVaults, fetchVault, fetchEarnChains, fetchEarnProtocols, fetchPortfolio } from '../core/earn/index.js'
import { executeTransaction, ensureAllowance } from '../core/wallet/index.js'
import { makeTable, withSpinner, formatAmount, formatAPY } from '../display/index.js'
import { resolveChain, CHAIN_IDS } from '../config/index.js'

function resolveChainId(chain: string | number): number {
  if (typeof chain === 'number') return chain
  const id = CHAIN_IDS[String(chain).toLowerCase()]
  if (!id) throw new Error(`Unknown chain: ${chain}`)
  return id
}

export function earnCommand(): Command {
  const earn = new Command('earn').description('Discover vaults, earn yield, and track positions via LI.FI Earn API')

  earn
    .command('quote')
    .description('Get a quote to deposit into a yield vault')
    .requiredOption('--protocol <protocol>', 'protocol slug (e.g. morpho) or vault address (0x...)')
    .requiredOption('--token <token>', 'token to deposit (symbol or address)')
    .requiredOption('--amount <amount>', 'amount in smallest unit (e.g. 1000000 for 1 USDC)')
    .requiredOption('--wallet <name>', 'wallet name (from lifi wallet list)')
    .option('--chain <chain>', 'chain name or ID', resolveChain())
    .option('--execute', 'sign and submit the deposit transaction')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const quote = await withSpinner('Fetching earn quote...', async () =>
          getEarnQuote({
            protocol: opts.protocol,
            token: opts.token,
            amount: opts.amount,
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
              ['Protocol', quote.protocol],
              ['Deposit', `${formatAmount(quote.fromAmount)} ${opts.token}`],
              ['Vault tokens', formatAmount(quote.toAmount)],
              ['Est. APY', quote.estimatedApy != null ? formatAPY(quote.estimatedApy) : 'n/a'],
              ['Est. duration', `${quote.estimatedDuration}s`],
              ['Gas cost', quote.gasCostUSD],
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
    .option('--chain <chain>', 'filter by chain (name or ID)')
    .option('--protocol <protocol>', 'filter by protocol slug')
    .option('--token <token>', 'filter by underlying token symbol')
    .option('--category <category>', 'filter by category (vault, lending, staking, yield)')
    .option('--limit <limit>', 'max results', '20')
    .option('--offset <offset>', 'pagination offset', '0')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const params: Record<string, unknown> = {
          limit: parseInt(opts.limit),
          offset: parseInt(opts.offset),
        }
        if (opts.chain) params.chainId = resolveChainId(opts.chain)
        if (opts.protocol) params.protocol = opts.protocol
        if (opts.token) params.underlyingToken = opts.token
        if (opts.category) params.category = opts.category

        const result = await withSpinner('Fetching vaults...', () => fetchVaults(params as Parameters<typeof fetchVaults>[0]))

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2))
          return
        }

        if (!result.vaults.length) {
          console.log(chalk.yellow('No vaults found for the given filters.'))
          return
        }

        console.log(makeTable(
          ['Name', 'Protocol', 'Chain', 'Token', 'APY', 'TVL'],
          result.vaults.map((v) => [
            v.name.slice(0, 30),
            v.protocol,
            String(v.chainId),
            v.underlyingToken.symbol,
            v.apy != null ? formatAPY(v.apy) : 'n/a',
            v.tvl != null ? `$${(v.tvl / 1e6).toFixed(1)}M` : 'n/a',
          ])
        ))
        console.log(chalk.dim(`\nShowing ${result.vaults.length} of ${result.total} vaults. Use --offset to paginate.`))
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
        const vault = await withSpinner('Fetching vault...', () => fetchVault(parseInt(chainId), address))

        if (opts.json) {
          console.log(JSON.stringify(vault, null, 2))
          return
        }

        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Name', vault.name],
            ['Protocol', vault.protocol],
            ['Chain', String(vault.chainId)],
            ['Address', vault.address],
            ['Underlying', `${vault.underlyingToken.symbol} (${vault.underlyingToken.address})`],
            ['Vault token', `${vault.vaultToken.symbol} (${vault.vaultToken.address})`],
            ['APY', vault.apy != null ? formatAPY(vault.apy) : 'n/a'],
            ['TVL', vault.tvl != null ? `$${(vault.tvl / 1e6).toFixed(2)}M` : 'n/a'],
            ['Category', vault.category],
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
          ['Protocol', 'Slug', 'Vaults'],
          protocols.map((p) => [p.name, p.slug, String(p.vaultCount)])
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('chains')
    .description('List chains with active vaults on LI.FI Earn')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const chains = await withSpinner('Fetching chains...', fetchEarnChains)

        if (opts.json) {
          console.log(JSON.stringify(chains, null, 2))
          return
        }

        console.log(makeTable(
          ['Chain ID', 'Name', 'Vaults'],
          chains.map((c) => [String(c.id), c.name, String(c.vaultCount)])
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  earn
    .command('portfolio <address>')
    .description('Show all DeFi positions for a wallet address')
    .option('--json', 'output as JSON')
    .action(async (address, opts) => {
      try {
        const portfolio = await withSpinner('Fetching portfolio...', () => fetchPortfolio(address))

        if (opts.json) {
          console.log(JSON.stringify(portfolio, null, 2))
          return
        }

        if (!portfolio.positions.length) {
          console.log(chalk.yellow('No active positions found for this address.'))
          return
        }

        console.log(makeTable(
          ['Vault', 'Protocol', 'Token', 'Balance', 'APY', 'Value (USD)'],
          portfolio.positions.map((p) => [
            p.vault.name.slice(0, 28),
            p.vault.protocol,
            p.vault.underlyingToken.symbol,
            formatAmount(p.balance),
            p.vault.apy != null ? formatAPY(p.vault.apy) : 'n/a',
            p.balanceUSD != null ? `$${p.balanceUSD.toFixed(2)}` : 'n/a',
          ])
        ))
        console.log(chalk.dim(`\nTotal: $${portfolio.totalUSD?.toFixed(2) ?? 'n/a'}`))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  return earn
}
