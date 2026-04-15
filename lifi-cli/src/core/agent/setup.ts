import readline from 'readline'
import chalk from 'chalk'
import { saveConfig, getConfigValue } from '../../config/index.js'
import type { AgentConfig } from './agent.types.js'

const PROVIDERS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'qwen/qwen3-next-80b-a3b-instruct:free' },
  openai:     { baseUrl: 'https://api.openai.com/v1',    defaultModel: 'gpt-4o' },
  ollama:     { baseUrl: 'http://localhost:11434/v1',     defaultModel: 'llama3' },
}

function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve))
}

async function readMasked(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    let buf = ''
    process.stdin.setRawMode?.(true)
    process.stdout.write(prompt)
    const onData = (ch: Buffer) => {
      const c = ch.toString()
      if (c === '\n' || c === '\r') {
        process.stdin.removeListener('data', onData)
        process.stdin.setRawMode?.(false)
        process.stdout.write('\n')
        resolve(buf.trim())
        return
      }
      if (c === '\x7f' || c === '\b') {
        if (buf.length) { buf = buf.slice(0, -1); process.stdout.write('\b \b') }
        return
      }
      if (c === '\x03') process.exit(0)
      buf += c
      process.stdout.write('*')
    }
    process.stdin.resume()
    process.stdin.on('data', onData)
  })
}

export async function runAgentSetup(rl: readline.Interface): Promise<AgentConfig | null> {
  const providerNames = Object.keys(PROVIDERS)

  console.log()
  console.log(chalk.cyan('  Agent Setup'))
  console.log(chalk.dim('  ' + '─'.repeat(40)))
  console.log('  Providers:')
  providerNames.forEach((p, i) => console.log(`    ${chalk.yellow(String(i + 1))}. ${p}`))
  console.log()

  const provInput = (await ask(rl, chalk.bold(chalk.blue('  provider')) + ' › ')).trim()
  const idx = parseInt(provInput)
  let provider: string
  if (idx >= 1 && idx <= providerNames.length) {
    provider = providerNames[idx - 1]
  } else if (providerNames.includes(provInput.toLowerCase())) {
    provider = provInput.toLowerCase()
  } else {
    console.log(chalk.red('  Invalid provider'))
    return null
  }

  const defaults = PROVIDERS[provider]
  const defaultModel = defaults.defaultModel

  const modelInput = (await ask(rl, chalk.bold(chalk.blue('  model')) + ` › [${defaultModel}] `)).trim()
  const model = modelInput || defaultModel

  let baseUrl = defaults.baseUrl
  if (provider === 'ollama') {
    const urlInput = (await ask(rl, chalk.bold(chalk.blue('  base url')) + ` › [${defaults.baseUrl}] `)).trim()
    if (urlInput) baseUrl = urlInput
  }

  rl.pause()
  const apiKey = await readMasked(chalk.bold(chalk.blue('  api key')) + ' › ')
  rl.resume()

  if (!apiKey && provider !== 'ollama') {
    console.log(chalk.red('  API key required'))
    return null
  }

  console.log()
  console.log(`  ${chalk.dim('provider:')} ${chalk.green(provider)}`)
  console.log(`  ${chalk.dim('model:   ')} ${chalk.green(model)}`)
  if (baseUrl !== PROVIDERS[provider]?.baseUrl) {
    console.log(`  ${chalk.dim('base url:')} ${chalk.green(baseUrl)}`)
  }
  console.log(`  ${chalk.dim('api key: ')} ${chalk.green('*'.repeat(Math.min(apiKey.length, 12)))}`)
  console.log()

  const confirm = (await ask(rl, chalk.bold(chalk.blue('  save?')) + ' › [Y/n] ')).trim().toLowerCase()
  if (confirm === 'n' || confirm === 'no') return null

  saveConfig({
    agentProvider: provider,
    agentModel: model,
    agentApiKey: apiKey || undefined,
    agentBaseUrl: baseUrl !== PROVIDERS[provider]?.baseUrl ? baseUrl : undefined,
  })

  return { provider, model, apiKey: apiKey || undefined, baseUrl }
}

export function loadSavedAgentConfig(): AgentConfig | null {
  const provider = getConfigValue('agentProvider')
  const model = getConfigValue('agentModel')
  const apiKey = getConfigValue('agentApiKey')
  const baseUrl = getConfigValue('agentBaseUrl')

  if (!provider || !model) return null

  return {
    provider,
    model,
    apiKey: apiKey || undefined,
    baseUrl: baseUrl || PROVIDERS[provider]?.baseUrl,
  }
}
