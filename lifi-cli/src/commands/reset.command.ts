import readline from 'readline'
import fs from 'fs'
import { Command } from 'commander'
import chalk from 'chalk'
import { CONFIG_FILE, CONFIG_DIR, WALLETS_DIR } from '../config/index.js'

function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve))
}

export function resetCommand(): Command {
  return new Command('reset')
    .description('Remove all lifi-cli config and saved data')
    .option('--wallets', 'also delete saved wallets (irreversible)')
    .option('--yes', 'skip confirmation prompt')
    .action(async (opts) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

      console.log()
      console.log(chalk.yellow('  This will delete:'))
      console.log(chalk.dim(`    config  ${CONFIG_FILE}`))
      if (opts.wallets) {
        console.log(chalk.red(`    wallets ${WALLETS_DIR}  (private keys — unrecoverable)`))
      }
      console.log()

      if (!opts.yes) {
        const answer = (await ask(rl, chalk.bold('  Continue? [y/N] '))).trim().toLowerCase()
        if (answer !== 'y' && answer !== 'yes') {
          console.log(chalk.dim('  Cancelled.'))
          rl.close()
          return
        }
      }

      if (opts.wallets) {
        const confirm2 = opts.yes
          ? 'yes'
          : (await ask(rl, chalk.red('  Delete wallets? This cannot be undone. [yes/N] '))).trim().toLowerCase()
        if (confirm2 !== 'yes') {
          console.log(chalk.dim('  Wallet deletion skipped.'))
          opts.wallets = false
        }
      }

      rl.close()

      try {
        if (fs.existsSync(CONFIG_FILE)) {
          fs.unlinkSync(CONFIG_FILE)
          console.log(chalk.green('  config cleared'))
        } else {
          console.log(chalk.dim('  no config found'))
        }
      } catch (err) {
        console.error(chalk.red('  failed to remove config:'), String(err))
      }

      if (opts.wallets) {
        try {
          if (fs.existsSync(WALLETS_DIR)) {
            fs.rmSync(WALLETS_DIR, { recursive: true, force: true })
            console.log(chalk.green('  wallets deleted'))
          } else {
            console.log(chalk.dim('  no wallets found'))
          }
        } catch (err) {
          console.error(chalk.red('  failed to remove wallets:'), String(err))
        }
      }

      console.log()
      console.log(chalk.dim('  Done. Run lifi-cli to start fresh.'))
      console.log()
    })
}
