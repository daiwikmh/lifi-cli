const BASE = 'https://api.telegram.org/bot'

async function call(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json() as { ok: boolean; description?: string; result?: unknown }
  if (!data.ok) throw new Error(data.description ?? `Telegram API error on ${method}`)
  return data.result
}

export async function sendMessage(token: string, chatId: string, text: string): Promise<void> {
  await call(token, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' })
}

export async function getMe(token: string): Promise<{ username: string; first_name: string }> {
  return call(token, 'getMe', {}) as Promise<{ username: string; first_name: string }>
}

export async function getUpdates(token: string): Promise<Array<{
  update_id: number
  message?: { chat: { id: number; username?: string }; text?: string }
}>> {
  return call(token, 'getUpdates', { limit: 5, timeout: 2 }) as Promise<Array<unknown>> as Promise<ReturnType<typeof getUpdates>>
}
