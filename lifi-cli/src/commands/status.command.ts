import { Command } from 'commander'
import chalk from 'chalk'
import { getStatus } from '../api/lifi/index.js'
import { makeTable, withSpinner } from '../display/index.js'

export function statusCommand(): Command {
  return new Command('status')
    .description('Check the status of a cross-chain transaction')
    .argument('<txHash>', 'transaction hash')
    .option('--from-chain <chainId>', 'source chain ID')
    .option('--to-chain <chainId>', 'destination chain ID')
    .option('--json', 'output as JSON')
    .action(async (txHash, opts) => {
      try {
        const status = await withSpinner('Checking status...', async () =>
          getStatus(
            txHash,
            undefined,
            opts.fromChain ? parseInt(opts.fromChain) : undefined,
            opts.toChain ? parseInt(opts.toChain) : undefined
          )
        )

        if (opts.json) {
          console.log(JSON.stringify(status, null, 2))
          return
        }

        const color = status.status === 'DONE' ? chalk.green
          : status.status === 'FAILED' ? chalk.red
          : chalk.yellow

        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Status', color(status.status)],
            ['Substatus', status.substatus ?? 'n/a'],
            ['Sending tx', status.sending?.txHash ?? 'n/a'],
            ['Receiving tx', status.receiving?.txHash ?? 'n/a'],
          ]
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })
}
