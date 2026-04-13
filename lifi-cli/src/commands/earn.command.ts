import { Command } from 'commander'
import chalk from 'chalk'
import { getEarnQuote, listProtocols } from '../core/earn/index.js'
import { executeTransaction, ensureAllowance } from '../core/wallet/index.js'
import { makeTable, withSpinner, formatAmount, formatAPY } from '../display/index.js'
import { resolveChain } from '../config/index.js'

export function earnCommand(): Command {
  const earn = new Command('earn').description('Deposit into yield protocols via LI.FI Composer')

  earn
    .command('quote')
    .description('Get a quote to deposit into a yield protocol')
    .requiredOption('--protocol <protocol>', 'protocol symbol (e.g. morpho-usdc)')
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
              ['Est. APY', quote.estimatedApy ? formatAPY(quote.estimatedApy) : 'n/a'],
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
    .command('protocols')
    .description('List all supported yield protocols')
    .option('--chain <chain>', 'filter by chain')
    .option('--category <category>', 'filter by category (vault, lending, staking, yield)')
    .option('--json', 'output as JSON')
    .action((opts) => {
      const protocols = listProtocols({ category: opts.category })

      if (opts.json) {
        console.log(JSON.stringify(protocols, null, 2))
        return
      }

      console.log(makeTable(
        ['Symbol', 'Name', 'Chain', 'Category', 'Underlying'],
        protocols.map((p) => [p.symbol, p.name, String(p.chainId), p.category, p.underlyingToken])
      ))
    })

  return earn
}
