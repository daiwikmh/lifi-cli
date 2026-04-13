import { Command } from 'commander'
import chalk from 'chalk'
import { createWallet, importWallet, listWallets } from '../core/wallet/index.js'
import { makeTable } from '../display/index.js'

export function walletCommand(): Command {
  const wallet = new Command('wallet').description('Manage local wallets')

  wallet
    .command('create')
    .description('Create a new wallet')
    .requiredOption('--name <name>', 'wallet label')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const w = await createWallet(opts.name)
        if (opts.json) {
          console.log(JSON.stringify(w, null, 2))
          return
        }
        console.log(chalk.green(`Wallet created: ${w.name}`))
        console.log(`Address: ${chalk.cyan(w.address)}`)
        console.log(chalk.dim('Private key stored in OS keychain.'))
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  wallet
    .command('import')
    .description('Import a wallet from a private key')
    .requiredOption('--name <name>', 'wallet label')
    .requiredOption('--key <key>', 'private key (0x...)')
    .option('--json', 'output as JSON')
    .action(async (opts) => {
      try {
        const w = await importWallet(opts.name, opts.key as `0x${string}`)
        if (opts.json) {
          console.log(JSON.stringify(w, null, 2))
          return
        }
        console.log(chalk.green(`Wallet imported: ${w.name}`))
        console.log(`Address: ${chalk.cyan(w.address)}`)
      } catch (err) {
        console.error(chalk.red('Error:'), String(err))
        process.exit(1)
      }
    })

  wallet
    .command('list')
    .description('List all local wallets')
    .option('--json', 'output as JSON')
    .action((opts) => {
      const wallets = listWallets()
      if (opts.json) {
        console.log(JSON.stringify(wallets, null, 2))
        return
      }
      if (wallets.length === 0) {
        console.log(chalk.yellow('No wallets found. Run: lifi wallet create --name <name>'))
        return
      }
      console.log(makeTable(
        ['Name', 'Address', 'Created'],
        wallets.map((w) => [w.name, w.address, new Date(w.createdAt).toLocaleDateString()])
      ))
    })

  return wallet
}
