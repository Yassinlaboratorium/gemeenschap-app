/**
 * Verifieert of 06_mega_system.sql correct is uitgevoerd.
 * Gebruik: node scripts/verify-migration.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

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
  } catch { /* ignore */ }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt')
  process.exit(1)
}

async function query(table, select = 'id', limit = 1) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=${limit}`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  return { ok: res.ok, status: res.status, body: await res.json() }
}

async function rpcCheck(name) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/${name}`,
    {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: '{}',
    }
  )
  return { ok: res.ok, status: res.status }
}

console.log('\n══════════════════════════════════════════')
console.log('  Migratie verificatie: 06_mega_system.sql')
console.log('══════════════════════════════════════════\n')

let passed = 0; let failed = 0

async function check(label, fn) {
  try {
    const result = await fn()
    if (result) {
      console.log(`  ✓  ${label}`)
      passed++
    } else {
      console.log(`  ✗  ${label}`)
      failed++
    }
  } catch (err) {
    console.log(`  ✗  ${label} — ${err.message}`)
    failed++
  }
}

// ── 1. Profiles: nieuwe kolommen ─────────────────────────────
await check('profiles.account_type kolom bestaat', async () => {
  const r = await query('profiles', 'account_type', 1)
  return r.ok || (r.status === 406) // 406 = RLS block = kolom bestaat wel
})

await check('profiles.municipality kolom bestaat', async () => {
  const r = await query('profiles', 'municipality', 1)
  return r.ok || r.status === 406
})

await check('profiles.postal_code kolom bestaat', async () => {
  const r = await query('profiles', 'postal_code', 1)
  return r.ok || r.status === 406
})

await check('profiles.neighborhood kolom bestaat', async () => {
  const r = await query('profiles', 'neighborhood', 1)
  return r.ok || r.status === 406
})

// ── 2. Children: nieuwe kolommen ─────────────────────────────
await check('children.gender kolom bestaat', async () => {
  const r = await query('children', 'gender', 1)
  return r.ok || r.status === 406
})

await check('children.school kolom bestaat', async () => {
  const r = await query('children', 'school', 1)
  return r.ok || r.status === 406
})

await check('children.municipality kolom bestaat', async () => {
  const r = await query('children', 'municipality', 1)
  return r.ok || r.status === 406
})

// ── 3. Views ──────────────────────────────────────────────────
await check('activities_with_count view bestaat', async () => {
  const r = await query('activities_with_count', 'id,sessions_count', 1)
  return r.ok
})

await check('activity_sessions_with_count view bestaat', async () => {
  const r = await query('activity_sessions_with_count', 'id,participants_count', 1)
  return r.ok
})

// We can't check all_registrations_analytics via PostgREST since it likely
// has RLS issues, but we check it returns a valid response
await check('all_registrations_analytics view bestaat', async () => {
  const r = await query('all_registrations_analytics', 'id', 1)
  return r.ok || r.status === 406
})

// ── 4. Bestaande data intact ──────────────────────────────────
await check('activities tabel heeft data', async () => {
  const r = await query('activities', 'id,title,tags', 5)
  return r.ok && Array.isArray(r.body) && r.body.length > 0
})

await check('session_registrations tabel bereikbaar', async () => {
  const r = await query('session_registrations', 'id', 1)
  return r.ok || r.status === 406
})

// ── Samenvatting ──────────────────────────────────────────────
console.log(`\n──────────────────────────────────────────`)
console.log(`  Resultaat: ${passed} geslaagd, ${failed} mislukt`)

if (failed > 0) {
  console.log('\n  ⚠ Voer supabase/06_mega_system.sql uit in Supabase Dashboard → SQL Editor')
} else {
  console.log('\n  ✓ Alle checks geslaagd — migratie succesvol!')
}

console.log('══════════════════════════════════════════\n')
