import axios from 'axios'

export const manifoldClient = axios.create({
  baseURL: 'https://api.manifold.markets',
  headers: { 'Content-Type': 'application/json' },
})
