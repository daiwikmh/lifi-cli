import { Command } from 'commander'
import { printClibanner } from './display/banner.js'
import {
  bridgeCommand,
  swapCommand,
  earnCommand,
  marketsCommand,
  polymarketCommand,
  kalshiCommand,
  manifoldCommand,
  statusCommand,
  walletCommand,
  agentCommand,
  configCommand,
  mcpCommand,
  dryrunCommand,
  resetCommand,
} from './commands/index.js'

const VERSION = '0.1.6'

const program = new Command()

program
  .name('lifi')
  .description('LI.FI CLI — bridge, swap, earn, and bet from the terminal.')
  .version(VERSION)
  .action(() => {
    printClibanner(VERSION)
    program.help()
  })

program.addCommand(bridgeCommand())
program.addCommand(swapCommand())
program.addCommand(earnCommand())
program.addCommand(marketsCommand())
program.addCommand(polymarketCommand())
program.addCommand(kalshiCommand())
program.addCommand(manifoldCommand())
program.addCommand(statusCommand())
program.addCommand(walletCommand())
program.addCommand(agentCommand())
program.addCommand(configCommand())
program.addCommand(mcpCommand())
program.addCommand(dryrunCommand())
program.addCommand(resetCommand())

program.parse()
