import axios from 'axios'
import { getConfigValue } from '../../config/index.js'

export function createKalshiClient() {
  const apiKey = getConfigValue('kalshiApiKey')
  if (!apiKey) throw new Error('Kalshi API key required. Run: lifi config set --kalshi-key <key>  (get one at kalshi.com/api)')
  return axios.create({
    baseURL: 'https://trading-api.kalshi.com/trade-api/v2',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
  })
}
