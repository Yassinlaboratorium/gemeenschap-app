import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollieClient } from '@/lib/mollie'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const isLocalhost = APP_URL.includes('localhost') || APP_URL.includes('127.0.0.1')
const WEBHOOK_URL = isLocalhost ? undefined : `${APP_URL}/api/webhooks/mollie`

interface ChildRegistration {
  child_id: string
  session_ids: string[]
}

async function createMolliePayment(
  totalCents: number,
  title: string,
  insertedIds: string[],
  activityId: string,
  userId: string
) {
  const successUrl = `${APP_URL}/payment/session-success?ids=${insertedIds.join(',')}`
  return mollieClient.payments.create({
    amount: { currency: 'EUR', value: (totalCents / 100).toFixed(2) },
    description: `Sessie-inschrijving: ${title}`,
    redirectUrl: successUrl,
    ...(WEBHOOK_URL ? { webhookUrl: WEBHOOK_URL } : {}),
    metadata: { type: 'session', session_registration_ids: insertedIds, activity_id: activityId, user_id: userId },
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const activityId: string | undefined = body?.activity_id

  if (!activityId) return NextResponse.json({ error: 'Ongeldige invoer.' }, { status: 400 })

  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, is_published')
    .eq('id', activityId)
    .eq('is_published', true)
    .single()

  if (!activity) return NextResponse.json({ error: 'Activiteit niet gevonden.' }, { status: 404 })

  // ── Detect youth vs parent ────────────────────────────────────
  const isYouth = Array.isArray(body?.session_ids) && !body?.registrations

  if (isYouth) {
    return handleYouth(user.id, activityId, body.session_ids, activity.title, supabase)
  }

  // ── Parent flow ───────────────────────────────────────────────
  const registrations: ChildRegistration[] | undefined = body?.registrations
  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ error: 'Ongeldige invoer.' }, { status: 400 })
  }

  // Verifieer kinderen
  const childIds = [...new Set(registrations.map(r => r.child_id))]
  const { data: ownedChildren } = await supabase
    .from('children')
    .select('id')
    .eq('parent_id', user.id)
    .in('id', childIds)

  if (!ownedChildren || ownedChildren.length !== childIds.length) {
    return NextResponse.json({ error: 'Ongeldig kind opgegeven.' }, { status: 403 })
  }

  // Haal sessies + prijzen op
  const allSessionIds = [...new Set(registrations.flatMap(r => r.session_ids))]
  const { data: sessions } = await supabase
    .from('activity_sessions')
    .select('id, price_cents')
    .eq('activity_id', activityId)
    .in('id', allSessionIds)

  if (!sessions) return NextResponse.json({ error: 'Sessies niet gevonden.' }, { status: 404 })

  const priceMap = new Map(sessions.map(s => [s.id, s.price_cents]))

  let grandTotal = 0
  const enriched: { child_id: string; session_ids: string[]; total: number }[] = []

  for (const reg of registrations) {
    if (reg.session_ids.length === 0) continue
    if (reg.session_ids.some(id => !priceMap.has(id))) {
      return NextResponse.json({ error: 'Ongeldige sessie-IDs.' }, { status: 400 })
    }
    const total = reg.session_ids.reduce((s, id) => s + (priceMap.get(id) ?? 0), 0)
    grandTotal += total
    enriched.push({ child_id: reg.child_id, session_ids: reg.session_ids, total })
  }

  if (enriched.length === 0) return NextResponse.json({ error: 'Geen sessies geselecteerd.' }, { status: 400 })

  // Check bestaande inschrijvingen
  const { data: existing } = await supabase
    .from('session_registrations')
    .select('child_id')
    .eq('activity_id', activityId)
    .in('child_id', enriched.map(r => r.child_id))

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Een of meerdere kinderen zijn al ingeschreven voor deze activiteit.' },
      { status: 409 }
    )
  }

  const adminClient = createAdminClient()

  // Gratis
  if (grandTotal === 0) {
    for (const reg of enriched) {
      await adminClient.from('session_registrations').insert({
        activity_id: activityId, user_id: user.id, child_id: reg.child_id,
        session_ids: reg.session_ids, total_price_cents: 0,
        payment_status: 'paid', paid_at: new Date().toISOString(),
      })
    }
    return NextResponse.json({ redirect: `/payment/session-success?free=1&activity_id=${activityId}` })
  }

  // Betaald — maak registraties aan (pending)
  const insertedIds: string[] = []
  for (const reg of enriched) {
    const { data: inserted, error } = await supabase
      .from('session_registrations')
      .insert({
        activity_id: activityId, user_id: user.id, child_id: reg.child_id,
        session_ids: reg.session_ids, total_price_cents: reg.total, payment_status: 'pending',
      })
      .select('id')
      .single()

    if (error || !inserted) return NextResponse.json({ error: 'Inschrijving aanmaken mislukt.' }, { status: 500 })
    insertedIds.push(inserted.id)
  }

  let payment
  try {
    payment = await createMolliePayment(grandTotal, activity.title, insertedIds, activityId, user.id)
  } catch (err) {
    await adminClient.from('session_registrations').update({ payment_status: 'failed' }).in('id', insertedIds)
    console.error('Mollie session payment create error:', err)
    return NextResponse.json({ error: 'Betaling aanmaken mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  const { error: saveErr } = await adminClient
    .from('session_registrations')
    .update({ mollie_payment_id: payment.id })
    .in('id', insertedIds)
  if (saveErr) console.error('[session-regs/create] mollie_payment_id opslaan mislukt:', saveErr)

  const checkoutUrl = payment.getCheckoutUrl()
  if (!checkoutUrl) return NextResponse.json({ error: 'Geen checkout URL ontvangen.' }, { status: 500 })

  return NextResponse.json({ payment_url: checkoutUrl })
}

// ── Youth handler ─────────────────────────────────────────────
async function handleYouth(
  userId: string,
  activityId: string,
  sessionIds: string[],
  activityTitle: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (!sessionIds || sessionIds.length === 0) {
    return NextResponse.json({ error: 'Geen sessies geselecteerd.' }, { status: 400 })
  }

  // Verifieer sessies
  const { data: sessions } = await supabase
    .from('activity_sessions')
    .select('id, price_cents')
    .eq('activity_id', activityId)
    .in('id', sessionIds)

  if (!sessions || sessions.length !== sessionIds.length) {
    return NextResponse.json({ error: 'Ongeldige sessie-IDs.' }, { status: 400 })
  }

  const totalCents = sessions.reduce((s, sess) => s + sess.price_cents, 0)

  // Check bestaande inschrijving (jongere, child_id IS NULL)
  const { data: existing } = await supabase
    .from('session_registrations')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .is('child_id', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Je bent al ingeschreven voor deze activiteit.' },
      { status: 409 }
    )
  }

  const adminClient = createAdminClient()

  // Gratis
  if (totalCents === 0) {
    await adminClient.from('session_registrations').insert({
      activity_id: activityId, user_id: userId, child_id: null,
      session_ids: sessionIds, total_price_cents: 0,
      payment_status: 'paid', paid_at: new Date().toISOString(),
    })
    return NextResponse.json({ redirect: `/payment/session-success?free=1&activity_id=${activityId}` })
  }

  // Betaald
  const { data: inserted, error } = await supabase
    .from('session_registrations')
    .insert({
      activity_id: activityId, user_id: userId, child_id: null,
      session_ids: sessionIds, total_price_cents: totalCents, payment_status: 'pending',
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: 'Inschrijving aanmaken mislukt.' }, { status: 500 })
  }

  let payment
  try {
    payment = await createMolliePayment(totalCents, activityTitle, [inserted.id], activityId, userId)
  } catch (err) {
    await adminClient.from('session_registrations').update({ payment_status: 'failed' }).eq('id', inserted.id)
    console.error('Mollie youth payment create error:', err)
    return NextResponse.json({ error: 'Betaling aanmaken mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  const { error: saveErr } = await adminClient
    .from('session_registrations')
    .update({ mollie_payment_id: payment.id })
    .eq('id', inserted.id)
  if (saveErr) console.error('[session-regs/create] youth mollie_payment_id opslaan mislukt:', saveErr)

  const checkoutUrl = payment.getCheckoutUrl()
  if (!checkoutUrl) return NextResponse.json({ error: 'Geen checkout URL ontvangen.' }, { status: 500 })

  return NextResponse.json({ payment_url: checkoutUrl })
}
