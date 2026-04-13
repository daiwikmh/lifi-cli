import chalk from 'chalk'

const LIFI_LOGO = `
  ██╗     ██╗███████╗██╗      ██████╗██╗     ██╗
  ██║     ██║██╔════╝██║     ██╔════╝██║     ██║
  ██║     ██║█████╗  ██║     ██║     ██║     ██║
  ██║     ██║██╔══╝  ██║     ██║     ██║     ██║
  ███████╗██║██║     ███████╗╚██████╗███████╗██║
  ╚══════╝╚═╝╚═╝     ╚══════╝ ╚═════╝╚══════╝╚═╝`

export function printClibanner(version: string): void {
  console.log(chalk.cyan(LIFI_LOGO))
  console.log()
  console.log(
    '  ' +
    chalk.bold('bridge') + chalk.dim(' ·') + '  ' +
    chalk.bold('swap') + chalk.dim(' ·') + '  ' +
    chalk.bold('earn') + chalk.dim(' ·') + '  ' +
    chalk.bold('markets') + chalk.dim(' ·') + '  ' +
    chalk.bold('agent') + chalk.dim(' ·') + '  ' +
    chalk.bold('mcp')
  )
  console.log()
  console.log(chalk.dim(`  v${version}  ·  Run lifi --help to see all commands`))
  console.log()
}

export function printAgentBanner(model: string): void {
  const lines = [
    '┌─────────────────────────────────────────────────────────┐',
    '│                                                         │',
    '│   lifi agent                                            │',
    '│   Your AI copilot for DeFi · powered by OpenRouter      │',
    '│                                                         │',
    '│   Tools:                                                │',
    '│   ◆  bridge      move tokens across chains              │',
    '│   ◆  swap        swap tokens on a single chain          │',
    '│   ◆  earn        deposit into yield via LI.FI Composer  │',
    '│   ◆  protocols   list supported yield protocols         │',
    '│   ◆  polymarket  browse Polymarket predictions          │',
    '│   ◆  kalshi      browse Kalshi markets                 │',
    '│   ◆  manifold    browse Manifold markets               │',
    '│   ◆  status      track cross-chain transactions         │',
    '│                                                         │',
    '└─────────────────────────────────────────────────────────┘',
  ]

  console.log()
  lines.forEach((line) => console.log(chalk.cyan('  ' + line)))
  console.log()
  console.log(chalk.dim(`  Model: ${model}`))
  console.log(chalk.dim('  Type your question. Ctrl+C to exit.'))
  console.log()
}
