/**
 * Test script: verifieert dat de Mollie API key werkt en haalt een betaling op.
 *
 * Gebruik:
 *   node scripts/test-mollie.mjs
 *   node scripts/test-mollie.mjs tr_xxxxx   ← specifiek payment ID controleren
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Laad .env.local handmatig (geen dotenv dependency nodig)
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = val
    }
    console.log('✓ .env.local geladen')
  } catch {
    console.warn('⚠ .env.local niet gevonden, gebruik omgevingsvariabelen')
  }
}

loadEnv()

const apiKey = process.env.MOLLIE_API_KEY
if (!apiKey) {
  console.error('✗ MOLLIE_API_KEY niet ingesteld')
  process.exit(1)
}

const keyPrefix = apiKey.slice(0, 5)
console.log(`✓ MOLLIE_API_KEY gevonden (begint met: ${keyPrefix}…)`)
console.log(`  Mode: ${keyPrefix === 'live_' ? 'LIVE' : keyPrefix === 'test_' ? 'TEST' : 'ONBEKEND'}`)

const paymentId = process.argv[2]

async function listRecentPayments() {
  console.log('\n── Recente betalingen ophalen ──────────────────────')
  const res = await fetch('https://api.mollie.com/v2/payments?limit=5', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const body = await res.json()
  if (!res.ok) {
    console.error('✗ Mollie API fout:', res.status, JSON.stringify(body, null, 2))
    return
  }
  const payments = body._embedded?.payments ?? []
  if (payments.length === 0) {
    console.log('  Geen betalingen gevonden.')
    return
  }
  for (const p of payments) {
    console.log(`  ${p.id}  status=${p.status}  €${p.amount?.value}  ${p.description ?? ''}`)
  }
}

async function getPayment(id) {
  console.log(`\n── Payment ophalen: ${id} ──────────────────────────`)
  const res = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const body = await res.json()
  if (!res.ok) {
    console.error('✗ Mollie API fout:', res.status, JSON.stringify(body, null, 2))
    return
  }
  console.log('  id:          ', body.id)
  console.log('  status:      ', body.status)
  console.log('  amount:      ', body.amount?.currency, body.amount?.value)
  console.log('  description: ', body.description)
  console.log('  paidAt:      ', body.paidAt ?? '(nog niet betaald)')
  console.log('  metadata:    ', JSON.stringify(body.metadata))
  console.log('  redirectUrl: ', body.redirectUrl)
  console.log('  webhookUrl:  ', body.webhookUrl ?? '(geen webhook)')
}

try {
  if (paymentId) {
    await getPayment(paymentId)
  } else {
    await listRecentPayments()
  }
} catch (err) {
  console.error('✗ Onverwachte fout:', err.message)
  process.exit(1)
}
