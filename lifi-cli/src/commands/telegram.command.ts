import readline from 'readline'
import { Command } from 'commander'
import chalk from 'chalk'
import { getMe, getUpdates, sendMessage } from '../api/telegram/client.js'
import { saveConfig, getConfigValue } from '../config/index.js'

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

export function telegramCommand(): Command {
  const tg = new Command('telegram').description('Configure Telegram notifications')

  tg
    .command('setup')
    .description('Connect a Telegram bot for transaction notifications')
    .action(async () => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

      console.log()
      console.log(chalk.cyan('  Telegram Setup'))
      console.log(chalk.dim('  ' + '─'.repeat(44)))
      console.log(chalk.dim('  Need a bot token? Message @BotFather on Telegram.'))
      console.log(chalk.dim('  Need your chat ID? Message @userinfobot on Telegram.'))
      console.log()

      rl.pause()
      const token = await readMasked(chalk.bold(chalk.blue('  bot token')) + ' › ')
      rl.resume()

      if (!token) {
        console.log(chalk.red('  Bot token required.'))
        rl.close(); return
      }

      // validate token by calling getMe
      let botName: string
      try {
        const me = await getMe(token)
        botName = `@${me.username}`
        console.log(chalk.green(`  Bot verified: ${me.first_name} (${botName})`))
      } catch (err) {
        console.log(chalk.red(`  Invalid token: ${String(err)}`))
        rl.close(); return
      }

      console.log()
      console.log(chalk.dim('  To get your chat ID, send any message to your bot first,'))
      console.log(chalk.dim('  then press Enter to auto-detect, or enter it manually.'))
      console.log()

      const chatInput = (await ask(rl, chalk.bold(chalk.blue('  chat ID')) + ' › [auto-detect] ')).trim()

      let chatId = chatInput
      if (!chatId) {
        try {
          process.stdout.write(chalk.dim('  Detecting...'))
          const updates = await getUpdates(token)
          const latest = updates.find((u) => u.message?.chat?.id)
          if (latest?.message?.chat?.id) {
            chatId = String(latest.message.chat.id)
            process.stdout.write(chalk.green(` found: ${chatId}\n`))
          } else {
            process.stdout.write(chalk.yellow(' no messages found\n'))
            console.log(chalk.dim('  Send a message to your bot and run setup again, or enter the chat ID manually.'))
            rl.close(); return
          }
        } catch (err) {
          process.stdout.write(chalk.red(` failed: ${String(err)}\n`))
          rl.close(); return
        }
      }

      rl.close()

      saveConfig({ telegramBotToken: token, telegramChatId: chatId })

      // send confirmation message
      try {
        await sendMessage(token, chatId,
          `<b>lifi-cli connected</b>\n\nYou will receive notifications here after bridge, swap, and earn transactions are submitted.\n\n<i>Run: lifi-cli telegram test</i>`
        )
        console.log()
        console.log(chalk.green('  Saved. Confirmation message sent.'))
      } catch {
        console.log()
        console.log(chalk.yellow('  Saved, but could not send confirmation. Check your chat ID.'))
      }
      console.log()
    })

  tg
    .command('test')
    .description('Send a test notification to your configured Telegram chat')
    .action(async () => {
      const token = getConfigValue('telegramBotToken')
      const chatId = getConfigValue('telegramChatId')

      if (!token || !chatId) {
        console.error(chalk.red('  Not configured. Run: lifi-cli telegram setup'))
        process.exit(1)
      }

      try {
        await sendMessage(token, chatId,
          `<b>lifi-cli test</b>\n\nNotifications are working. You will be notified here after every transaction submitted with <code>--execute</code>.`
        )
        console.log(chalk.green('  Test message sent.'))
      } catch (err) {
        console.error(chalk.red('  Failed:'), String(err))
        process.exit(1)
      }
    })

  tg
    .command('status')
    .description('Show current Telegram configuration')
    .action(() => {
      const token = getConfigValue('telegramBotToken')
      const chatId = getConfigValue('telegramChatId')

      if (!token || !chatId) {
        console.log(chalk.dim('  Not configured. Run: lifi-cli telegram setup'))
        return
      }

      const masked = token.slice(0, 8) + '...' + token.slice(-4)
      console.log()
      console.log(`  ${chalk.dim('bot token:')} ${masked}`)
      console.log(`  ${chalk.dim('chat ID:  ')} ${chatId}`)
      console.log()
    })

  tg
    .command('disconnect')
    .description('Remove Telegram configuration')
    .action(() => {
      saveConfig({ telegramBotToken: undefined, telegramChatId: undefined })
      console.log(chalk.green('  Telegram disconnected.'))
    })

  return tg
}
