import axios from 'axios'
import { getConfigValue } from '../../config/index.js'

const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com'
const POLYMARKET_CLOB_API = 'https://clob.polymarket.com'

export function createGammaClient() {
  return axios.create({ baseURL: POLYMARKET_GAMMA_API })
}

export function createClobClient() {
  const apiKey = getConfigValue('polymarketApiKey')
  return axios.create({
    baseURL: POLYMARKET_CLOB_API,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'POLY_ADDRESS': apiKey } : {}),
    },
  })
}
