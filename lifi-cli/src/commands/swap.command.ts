import { Command } from 'commander'
import chalk from 'chalk'
import { getSwapQuote } from '../core/swap/index.js'
import { executeTransaction, ensureAllowance } from '../core/wallet/index.js'
import { makeTable, withSpinner, formatAmount, formatChain } from '../display/index.js'
import { resolveChain } from '../config/index.js'

export function swapCommand(): Command {
  return new Command('swap')
    .description('Get a quote to swap tokens on a single chain')
    .requiredOption('--from <token>', 'token to swap from')
    .requiredOption('--to <token>', 'token to swap to')
    .requiredOption('--amount <amount>', 'amount in token units')
    .requiredOption('--wallet <name>', 'wallet name (from lifi-cli wallet list)')
    .option('--chain <chain>', 'chain name or ID', resolveChain())
    .option('--slippage <slippage>', 'slippage tolerance', '0.005')
    .option('--execute', 'sign and submit the transaction')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const quote = await withSpinner('Fetching swap quote...', async () =>
          getSwapQuote({
            chain: opts.chain,
            fromToken: opts.from,
            toToken: opts.to,
            amount: opts.amount,
            fromAddress: opts.wallet,
            slippage: parseFloat(opts.slippage),
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
              ['Chain', formatChain(quote.chain)],
              ['From', `${formatAmount(quote.fromAmount)} ${opts.from}`],
              ['To', `${formatAmount(quote.toAmount)} ${opts.to}`],
              ['Min received', formatAmount(quote.toAmountMin)],
              ['Via', quote.tool],
              ['Gas cost', quote.gasCostUSD],
            ]
          ))
          console.log(chalk.dim('\nAdd --execute to submit this transaction.'))
          return
        }

        const tx = quote.transactionRequest

        if (quote.approvalAddress && opts.from.toLowerCase() !== 'eth') {
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

        const result = await withSpinner('Submitting transaction...', async () =>
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

        console.log(chalk.green('\nTransaction submitted!'))
        console.log(`Hash: ${chalk.cyan(result.txHash)}`)
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })
}
