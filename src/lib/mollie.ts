import { createMollieClient } from '@mollie/api-client'

if (!process.env.MOLLIE_API_KEY) {
  throw new Error('MOLLIE_API_KEY ontbreekt in .env.local')
}

export const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY,
})
