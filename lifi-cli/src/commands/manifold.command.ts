import { Command } from 'commander'
import chalk from 'chalk'
import { getManifoldMarkets, getManifoldMarket } from '../core/manifold/index.js'
import { makeTable, withSpinner, formatUSD } from '../display/index.js'

export function manifoldCommand(): Command {
  const cmd = new Command('manifold').description('Browse Manifold prediction markets')

  cmd
    .command('list')
    .description('List open Manifold markets')
    .option('--query <query>', 'search by keyword')
    .option('--limit <n>', 'max results', '20')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const results = await withSpinner('Fetching Manifold markets...', () =>
          getManifoldMarkets(opts.query, parseInt(opts.limit))
        )
        if (opts.json) { console.log(JSON.stringify(results, null, 2)); return }
        if (!results.length) { console.log(chalk.yellow('No markets found.')); return }
        console.log(makeTable(
          ['Question', 'Prob', 'Volume', 'Closes'],
          results.map((m) => [
            m.question.slice(0, 52) + (m.question.length > 52 ? '..' : ''),
            `${(m.prices[0] * 100).toFixed(1)}%`,
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
        const market = await withSpinner('Fetching market...', () => getManifoldMarket(slug))
        if (!market) { console.error(chalk.red(`Not found: ${slug}`)); process.exit(1) }
        if (opts.json) { console.log(JSON.stringify(market, null, 2)); return }
        console.log(makeTable(
          ['Field', 'Value'],
          [
            ['Question', market.question],
            ['Probability', `${(market.prices[0] * 100).toFixed(1)}%`],
            ['Volume', formatUSD(market.volume)],
            ['Liquidity', formatUSD(market.liquidity)],
            ['Closes', market.endDate ? new Date(market.endDate).toLocaleDateString() : 'n/a'],
          ]
        ))
      } catch (err) { console.error(chalk.red('Error:'), String(err)); process.exit(1) }
    })

  return cmd
}
