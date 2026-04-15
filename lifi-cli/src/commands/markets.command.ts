import { Command } from 'commander'
import chalk from 'chalk'
import { getMarkets, getMarketBySlug } from '../core/markets/index.js'
import { makeTable, withSpinner, formatUSD } from '../display/index.js'

export function marketsCommand(): Command {
  const markets = new Command('markets').description('Browse and interact with prediction markets')

  markets
    .command('list')
    .description('List active Polymarket prediction markets')
    .option('--query <query>', 'search query')
    .option('--limit <limit>', 'max results', '20')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const results = await withSpinner('Fetching markets...', async () =>
          getMarkets(opts.query, parseInt(opts.limit))
        )

        if (opts.json) {
          console.log(JSON.stringify(results, null, 2))
          return
        }

        if (results.length === 0) {
          console.log(chalk.yellow('No active markets found.'))
          return
        }

        console.log(makeTable(
          ['Question', 'Yes %', 'No %', 'Volume', 'Ends'],
          results.map((m) => [
            m.question.slice(0, 50) + (m.question.length > 50 ? '...' : ''),
            m.prices[0] != null ? `${(m.prices[0] * 100).toFixed(1)}%` : 'n/a',
            m.prices[1] != null ? `${(m.prices[1] * 100).toFixed(1)}%` : 'n/a',
            formatUSD(m.volume),
            m.endDate ? new Date(m.endDate).toLocaleDateString() : 'n/a',
          ])
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  markets
    .command('get <slug>')
    .description('Get details of a specific market by slug')
    .option('--json', 'output as JSON')
    .action(async (slug, opts) => {
      try {
        const market = await withSpinner('Fetching market...', async () => getMarketBySlug(slug))

        if (!market) {
          console.error(chalk.red(`Market not found: ${slug}`))
          process.exit(1)
        }

        if (opts.json) {
          console.log(JSON.stringify(market, null, 2))
          return
        }

        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Question', market.question],
            ['Outcomes', market.outcomes.join(' / ')],
            ['Prices', market.prices.map((p) => `${(p * 100).toFixed(1)}%`).join(' / ')],
            ['Volume', formatUSD(market.volume)],
            ['Liquidity', formatUSD(market.liquidity)],
            ['Ends', market.endDate ? new Date(market.endDate).toLocaleDateString() : 'n/a'],
          ]
        ))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  return markets
}
