import { Command } from 'commander'
import chalk from 'chalk'
import { getKalshiMarkets, getKalshiMarket } from '../core/kalshi/index.js'
import { makeTable, withSpinner, formatUSD } from '../display/index.js'

export function kalshiCommand(): Command {
  const cmd = new Command('kalshi').description('Browse Kalshi prediction markets')

  cmd
    .command('list')
    .description('List open Kalshi markets')
    .option('--query <query>', 'filter by keyword')
    .option('--limit <n>', 'max results', '20')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const results = await withSpinner('Fetching Kalshi markets...', () =>
          getKalshiMarkets(opts.query, parseInt(opts.limit))
        )
        if (opts.json) { console.log(JSON.stringify(results, null, 2)); return }
        if (!results.length) { console.log(chalk.yellow('No markets found.')); return }
        console.log(makeTable(
          ['Ticker', 'Question', 'Yes', 'No', 'Volume', 'Closes'],
          results.map((m) => [
            m.id,
            m.question.slice(0, 40) + (m.question.length > 40 ? '..' : ''),
            `${(m.prices[0] * 100).toFixed(1)}%`,
            `${(m.prices[1] * 100).toFixed(1)}%`,
            formatUSD(m.volume),
            m.endDate ? new Date(m.endDate).toLocaleDateString() : 'n/a',
          ])
        ))
      } catch (err) { console.error(chalk.red('Error:'), String(err)); process.exit(1) }
    })

  cmd
    .command('get <ticker>')
    .description('Get a market by ticker (e.g. FED-RATE-CUT-JUN26)')
    .option('--json', 'output as JSON')
    .action(async (ticker, opts) => {
      try {
        const market = await withSpinner('Fetching market...', () => getKalshiMarket(ticker))
        if (!market) { console.error(chalk.red(`Not found: ${ticker}`)); process.exit(1) }
        if (opts.json) { console.log(JSON.stringify(market, null, 2)); return }
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Ticker', market.id],
            ['Question', market.question],
            ['Yes', `${(market.prices[0] * 100).toFixed(1)}%`],
            ['No', `${(market.prices[1] * 100).toFixed(1)}%`],
            ['Volume', formatUSD(market.volume)],
            ['Closes', market.endDate ? new Date(market.endDate).toLocaleDateString() : 'n/a'],
          ]
        ))
      } catch (err) { console.error(chalk.red('Error:'), String(err)); process.exit(1) }
    })

  return cmd
}
