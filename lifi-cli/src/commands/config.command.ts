import { Command } from 'commander'
import chalk from 'chalk'
import { loadConfig, saveConfig } from '../config/index.js'

export function configCommand(): Command {
  const config = new Command('config').description('Manage CLI configuration')

  config
    .command('set')
    .description('Set configuration values')
    .option('--api-key <key>', 'LI.FI API key')
    .option('--openrouter-key <key>', 'OpenRouter API key')
    .option('--polymarket-key <key>', 'Polymarket API key')
    .option('--kalshi-key <key>', 'Kalshi API key (kalshi.com/api)')
    .option('--chain <chain>', 'default chain')
    .option('--wallet <name>', 'default wallet name')
    .action((opts) => {
      const updates: Record<string, string> = {}
      if (opts.apiKey) updates.lifiApiKey = opts.apiKey
      if (opts.openrouterKey) updates.openrouterApiKey = opts.openrouterKey
      if (opts.polymarketKey) updates.polymarketApiKey = opts.polymarketKey
      if (opts.kalshiKey) updates.kalshiApiKey = opts.kalshiKey
      if (opts.chain) updates.defaultChain = opts.chain
      if (opts.wallet) updates.defaultWallet = opts.wallet

      if (Object.keys(updates).length === 0) {
        console.log(chalk.yellow('No values provided. Use --help to see options.'))
        return
      }

      saveConfig(updates)
      console.log(chalk.green('Config updated.'))
    })

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const cfg = loadConfig()
      const display = {
        ...cfg,
        lifiApiKey: cfg.lifiApiKey ? `${cfg.lifiApiKey.slice(0, 6)}...` : undefined,
        openrouterApiKey: cfg.openrouterApiKey ? `${cfg.openrouterApiKey.slice(0, 6)}...` : undefined,
        polymarketApiKey: cfg.polymarketApiKey ? `${cfg.polymarketApiKey.slice(0, 6)}...` : undefined,
        kalshiApiKey: cfg.kalshiApiKey ? `${cfg.kalshiApiKey.slice(0, 6)}...` : undefined,
      }
      console.log(JSON.stringify(display, null, 2))
    })

  return config
}
