import { Command } from 'commander'
import chalk from 'chalk'
import { runAgent } from '../core/agent/index.js'

export function agentCommand(): Command {
  return new Command('agent')
    .description('Start an interactive AI agent with LI.FI tools (powered by OpenRouter)')
    .option('--model <model>', 'OpenRouter model ID', 'anthropic/claude-3.5-sonnet')
    .option('--system <prompt>', 'override system prompt')
    .action(async (opts) => {
      try {
        await runAgent({
          model: opts.model,
          systemPrompt: opts.system,
        })
      } catch (err) {
        if (String(err).includes('OPENROUTER_API_KEY')) {
          console.error(chalk.red('Error:'), String(err))
          console.log(chalk.dim('Set your key: lifi config set --openrouter-key <key>'))
        } else {
          console.error(chalk.red('Error:'), String(err))
        }
        process.exit(1)
      }
    })
}
