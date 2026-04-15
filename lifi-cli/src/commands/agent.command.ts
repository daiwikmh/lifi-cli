import readline from 'readline'
import { Command } from 'commander'
import chalk from 'chalk'
import { runAgent } from '../core/agent/index.js'
import { runAgentSetup, loadSavedAgentConfig } from '../core/agent/setup.js'

export function agentCommand(): Command {
  return new Command('agent')
    .description('Start an interactive AI agent with LI.FI tools (powered by OpenRouter)')
    .option('--model <model>', 'model ID override', 'qwen/qwen3-next-80b-a3b-instruct:free')
    .option('--system <prompt>', 'override system prompt')
    .option('--setup', 'reconfigure agent provider and key')
    .action(async (opts) => {
      try {
        let config = loadSavedAgentConfig()

        if (!config || opts.setup) {
          if (!opts.setup && !config) {
            console.log(chalk.yellow('  No agent configured.'))
          }
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          const saved = await runAgentSetup(rl)
          rl.close()
          if (!saved) {
            console.log(chalk.dim('  Setup cancelled.'))
            process.exit(0)
          }
          // Recreate readline after raw mode password input
          config = saved
          const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
          rl2.close()
        }

        await runAgent({
          ...config,
          model: opts.model ?? config.model,
          systemPrompt: opts.system,
        })
      } catch (err) {
        if (String(err).includes('OPENROUTER_API_KEY')) {
          console.error(chalk.red('Error:'), String(err))
          console.log(chalk.dim('  Run: lifi-cli agent --setup'))
        } else {
          console.error(chalk.red('Error:'), String(err))
        }
        process.exit(1)
      }
    })
}
