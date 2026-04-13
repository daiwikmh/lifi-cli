import { Command } from 'commander'
import chalk from 'chalk'
import { getMarkets, getMarketBySlug } from '../core/markets/index.js'
import { makeTable, withSpinner, formatUSD } from '../display/index.js'

export function polymarketCommand(): Command {
  const cmd = new Command('polymarket').description('Browse Polymarket prediction markets')

  cmd
    .command('list')
    .description('List active markets')
    .option('--query <query>', 'search query')
    .option('--limit <n>', 'max results', '20')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const results = await withSpinner('Fetching Polymarket markets...', () =>
          getMarkets(opts.query, parseInt(opts.limit))
        )
        if (opts.json) { console.log(JSON.stringify(results, null, 2)); return }
        if (!results.length) { console.log(chalk.yellow('No markets found.')); return }
        console.log(makeTable(
          ['Question', 'Yes', 'No', 'Volume', 'Ends'],
          results.slice(0, 20).map((m) => [
            m.question.slice(0, 48) + (m.question.length > 48 ? '..' : ''),
            m.prices[0] != null ? `${(m.prices[0] * 100).toFixed(1)}%` : 'n/a',
            m.prices[1] != null ? `${(m.prices[1] * 100).toFixed(1)}%` : 'n/a',
            formatUSD(m.volume),
            m.endDate ? new Date(m.endDate).toLocaleDateString() : 'n/a',
          ])
        ))
      } catch (err) { console.error(chalk.red('Error:'), String(err)); process.exit(1) }
    })

  cmd
    .command('get <slug>')
    .description('Get a market by slug')
    .option('--json', 'output as JSON')
    .action(async (slug, opts) => {
      try {
        const market = await withSpinner('Fetching market...', () => getMarketBySlug(slug))
        if (!market) { console.error(chalk.red(`Not found: ${slug}`)); process.exit(1) }
        if (opts.json) { console.log(JSON.stringify(market, null, 2)); return }
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Question', market.question],
            ['Yes', `${(market.prices[0] * 100).toFixed(1)}%`],
            ['No', `${(market.prices[1] * 100).toFixed(1)}%`],
            ['Volume', formatUSD(market.volume)],
            ['Liquidity', formatUSD(market.liquidity)],
            ['Ends', market.endDate ? new Date(market.endDate).toLocaleDateString() : 'n/a'],
          ]
        ))
      } catch (err) { console.error(chalk.red('Error:'), String(err)); process.exit(1) }
    })

  return cmd
}
