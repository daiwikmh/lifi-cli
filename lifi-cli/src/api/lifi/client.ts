import axios from 'axios'
import { LIFI_API_BASE } from '../../config/index.js'
import { getConfigValue } from '../../config/index.js'

export function createLifiClient() {
  const apiKey = getConfigValue('lifiApiKey')
  return axios.create({
    baseURL: LIFI_API_BASE,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-lifi-api-key': apiKey } : {}),
    },
  })
}
