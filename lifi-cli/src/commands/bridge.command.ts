import { Command } from 'commander'
import chalk from 'chalk'
import { getBridgeQuote } from '../core/bridge/index.js'
import { executeTransaction, ensureAllowance } from '../core/wallet/index.js'
import { makeTable, withSpinner, formatAmount, formatChain } from '../display/index.js'

export function bridgeCommand(): Command {
  return new Command('bridge')
    .description('Get a quote to bridge tokens across chains')
    .requiredOption('--from <token>', 'token to send (symbol or address)')
    .requiredOption('--to <token>', 'token to receive (symbol or address)')
    .requiredOption('--from-chain <chain>', 'source chain (name or ID)')
    .requiredOption('--to-chain <chain>', 'destination chain (name or ID)')
    .requiredOption('--amount <amount>', 'amount in token units (e.g. 100 for 100 USDC)')
    .requiredOption('--wallet <name>', 'wallet name (from lifi-cli wallet list)')
    .option('--slippage <slippage>', 'slippage tolerance (e.g. 0.005 for 0.5%)', '0.005')
    .option('--execute', 'sign and submit the transaction')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const quote = await withSpinner('Fetching bridge quote...', async () =>
          getBridgeQuote({
            fromChain: opts.fromChain,
            toChain: opts.toChain,
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
              ['From', `${formatAmount(quote.fromAmount)} ${opts.from} on ${formatChain(quote.fromChain)}`],
              ['To', `${formatAmount(quote.toAmount)} ${opts.to} on ${formatChain(quote.toChain)}`],
              ['Min received', formatAmount(quote.toAmountMin)],
              ['Via', quote.tool],
              ['Est. duration', `${quote.estimatedDuration}s`],
              ['Gas cost', quote.gasCostUSD],
            ]
          ))
          if (quote.approvalAddress) {
            console.log(chalk.yellow(`\nApproval needed: ${quote.approvalAddress}`))
          }
          console.log(chalk.dim('\nAdd --execute to submit this transaction.'))
          return
        }

        // execute path
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
            if (approvHash) {
              spinner.text = `Approval tx sent: ${approvHash}`
            }
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

        console.log(chalk.green(`\nTransaction submitted!`))
        console.log(`Hash: ${chalk.cyan(result.txHash)}`)
        console.log(chalk.dim(`Run: lifi-cli status ${result.txHash} to track progress`))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })
}
