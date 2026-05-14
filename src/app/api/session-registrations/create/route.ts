import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollieClient } from '@/lib/mollie'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const isLocalhost = APP_URL.includes('localhost') || APP_URL.includes('127.0.0.1')
const WEBHOOK_URL = isLocalhost ? undefined : `${APP_URL}/api/webhooks/mollie`

interface RegistrationInput {
  child_id: string
  session_ids: string[]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const activityId: string | undefined = body?.activity_id
  const registrations: RegistrationInput[] | undefined = body?.registrations

  if (!activityId || !registrations || registrations.length === 0) {
    return NextResponse.json({ error: 'Ongeldige invoer.' }, { status: 400 })
  }

  // Verifieer activiteit
  const { data: activity } = await supabase
    .from('activities')
    .select('id, title, is_published')
    .eq('id', activityId)
    .eq('is_published', true)
    .single()

  if (!activity) {
    return NextResponse.json({ error: 'Activiteit niet gevonden.' }, { status: 404 })
  }

  // Verifieer dat alle kinderen van deze ouder zijn
  const childIds = [...new Set(registrations.map(r => r.child_id))]
  const { data: ownedChildren } = await supabase
    .from('children')
    .select('id')
    .eq('parent_id', user.id)
    .in('id', childIds)

  if (!ownedChildren || ownedChildren.length !== childIds.length) {
    return NextResponse.json({ error: 'Ongeldig kind opgegeven.' }, { status: 403 })
  }

  // Haal alle sessies op voor deze activiteit
  const allSessionIds = [...new Set(registrations.flatMap(r => r.session_ids))]
  const { data: sessions } = await supabase
    .from('activity_sessions')
    .select('id, price_cents')
    .eq('activity_id', activityId)
    .in('id', allSessionIds)

  if (!sessions) {
    return NextResponse.json({ error: 'Sessies niet gevonden.' }, { status: 404 })
  }

  const sessionPriceMap = new Map(sessions.map(s => [s.id, s.price_cents]))

  // Berekenen totaalprijs + valideer session_ids
  let grandTotalCents = 0
  const enriched: Array<{ child_id: string; session_ids: string[]; total_price_cents: number }> = []

  for (const reg of registrations) {
    if (reg.session_ids.length === 0) continue

    const validSessions = reg.session_ids.filter(id => sessionPriceMap.has(id))
    if (validSessions.length !== reg.session_ids.length) {
      return NextResponse.json({ error: 'Ongeldige sessie-IDs.' }, { status: 400 })
    }

    const total = validSessions.reduce((sum, id) => sum + (sessionPriceMap.get(id) ?? 0), 0)
    grandTotalCents += total
    enriched.push({ child_id: reg.child_id, session_ids: validSessions, total_price_cents: total })
  }

  if (enriched.length === 0) {
    return NextResponse.json({ error: 'Geen sessies geselecteerd.' }, { status: 400 })
  }

  // Controleer op bestaande inschrijvingen voor dezelfde kinderen in deze activiteit
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

  // Gratis inschrijving → direct bevestigen
  if (grandTotalCents === 0) {
    const adminClient = createAdminClient()
    for (const reg of enriched) {
      await adminClient.from('session_registrations').insert({
        activity_id: activityId,
        user_id: user.id,
        child_id: reg.child_id,
        session_ids: reg.session_ids,
        total_price_cents: 0,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
    }
    return NextResponse.json({
      redirect: `/payment/session-success?free=1&activity_id=${activityId}`,
    })
  }

  // Betaalde inschrijving → sessie-registraties aanmaken (pending) + Mollie
  const insertedIds: string[] = []
  for (const reg of enriched) {
    const { data: inserted, error } = await supabase
      .from('session_registrations')
      .insert({
        activity_id: activityId,
        user_id: user.id,
        child_id: reg.child_id,
        session_ids: reg.session_ids,
        total_price_cents: reg.total_price_cents,
        payment_status: 'pending',
      })
      .select('id')
      .single()

    if (error || !inserted) {
      return NextResponse.json({ error: 'Inschrijving aanmaken mislukt.' }, { status: 500 })
    }
    insertedIds.push(inserted.id)
  }

  // Mollie betaling aanmaken — redirectUrl bevat de IDs zodat de success-pagina de juiste records vindt
  const successRedirectUrl = `${APP_URL}/payment/session-success?ids=${insertedIds.join(',')}`

  let payment
  try {
    payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: (grandTotalCents / 100).toFixed(2) },
      description: `Sessie-inschrijving: ${activity.title}`,
      redirectUrl: successRedirectUrl,
      ...(WEBHOOK_URL ? { webhookUrl: WEBHOOK_URL } : {}),
      metadata: {
        type: 'session',
        session_registration_ids: insertedIds,
        activity_id: activityId,
        user_id: user.id,
      },
    })
  } catch (err) {
    // Rol inschrijvingen terug
    const adminClient = createAdminClient()
    await adminClient
      .from('session_registrations')
      .update({ payment_status: 'failed' })
      .in('id', insertedIds)
    console.error('Mollie session payment create error:', err)
    return NextResponse.json({ error: 'Betaling aanmaken mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  // Sla Mollie payment ID op in alle registraties — gebruik admin client want user heeft geen UPDATE policy
  const adminClient = createAdminClient()
  const { error: saveIdError } = await adminClient
    .from('session_registrations')
    .update({ mollie_payment_id: payment.id })
    .in('id', insertedIds)
  if (saveIdError) {
    console.error('[session-regs/create] mollie_payment_id opslaan mislukt:', saveIdError)
  }

  const checkoutUrl = payment.getCheckoutUrl()
  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Geen checkout URL ontvangen.' }, { status: 500 })
  }

  return NextResponse.json({ payment_url: checkoutUrl })
}
