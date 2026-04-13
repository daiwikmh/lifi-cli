import OpenAI from 'openai'
import { getConfigValue } from '../../config/index.js'

export function createOpenRouterClient(): OpenAI {
  const apiKey = getConfigValue('openrouterApiKey')
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set. Run: lifi config set --openrouter-key <key>')
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/lifi-cli',
      'X-Title': 'lifi-cli',
    },
  })
}
