import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollieClient } from '@/lib/mollie'
import type { Activity } from '@/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Mollie kan localhost niet bereiken — webhook alleen meegeven in productie
const isLocalhost = APP_URL.includes('localhost') || APP_URL.includes('127.0.0.1')
const WEBHOOK_URL = isLocalhost ? undefined : `${APP_URL}/api/webhooks/mollie`

export async function POST(request: NextRequest) {
  // 1. Authenticatie — alleen ingelogde gebruikers
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  // 2. Verzoek lezen
  const body = await request.json().catch(() => null)
  const activityId: string | undefined = body?.activity_id
  if (!activityId) {
    return NextResponse.json({ error: 'activity_id ontbreekt.' }, { status: 400 })
  }

  // 3. Activiteit ophalen
  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .eq('is_published', true)
    .single<Activity>()

  if (!activity) {
    return NextResponse.json({ error: 'Activiteit niet gevonden.' }, { status: 404 })
  }

  const price = Number(activity.price)
  if (price <= 0) {
    return NextResponse.json({ error: 'Deze activiteit is gratis — gebruik de normale inschrijving.' }, { status: 400 })
  }

  // 4. Controleer bestaande inschrijving
  const { data: existing } = await supabase
    .from('registrations')
    .select('id, status, payment_status, mollie_payment_id')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'confirmed' || existing.payment_status === 'paid') {
      return NextResponse.json({ error: 'Je bent al ingeschreven voor deze activiteit.' }, { status: 409 })
    }
    // Betaling al in behandeling maar nog niet betaald → stuur opnieuw naar Mollie
    if (existing.status === 'pending' && existing.payment_status === 'pending' && existing.mollie_payment_id) {
      try {
        const existingPayment = await mollieClient.payments.get(existing.mollie_payment_id)
        const checkoutUrl = existingPayment.getCheckoutUrl()
        if (checkoutUrl) {
          return NextResponse.json({ payment_url: checkoutUrl })
        }
      } catch {
        // Betaling verlopen of ongeldig — maak nieuwe aan
      }
    }
  }

  // 5. Controleer capaciteit
  const [{ count }, { data: activityFull }] = await Promise.all([
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .neq('status', 'cancelled'),
    supabase
      .from('activities')
      .select('max_participants')
      .eq('id', activityId)
      .single(),
  ])

  if (
    activityFull?.max_participants !== null &&
    activityFull?.max_participants !== undefined &&
    count !== null &&
    count >= activityFull.max_participants
  ) {
    return NextResponse.json({ error: 'Deze activiteit is helaas vol.' }, { status: 409 })
  }

  // 6. Inschrijving aanmaken of heractiveren
  let registrationId: string

  if (existing) {
    const { data: updated, error } = await supabase
      .from('registrations')
      .update({ status: 'pending', payment_status: 'pending', mollie_payment_id: null, paid_at: null })
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error || !updated) {
      return NextResponse.json({ error: 'Inschrijving bijwerken mislukt.' }, { status: 500 })
    }
    registrationId = updated.id
  } else {
    const { data: inserted, error } = await supabase
      .from('registrations')
      .insert({ activity_id: activityId, user_id: user.id, status: 'pending', payment_status: 'pending' })
      .select('id')
      .single()
    if (error || !inserted) {
      return NextResponse.json({ error: 'Inschrijving aanmaken mislukt.' }, { status: 500 })
    }
    registrationId = inserted.id
  }

  // 7. Mollie betaling aanmaken
  let payment
  try {
    payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: price.toFixed(2) },
      description: `Inschrijving: ${activity.title}`,
      redirectUrl: `${APP_URL}/payment/success?registration_id=${registrationId}`,
      ...(WEBHOOK_URL ? { webhookUrl: WEBHOOK_URL } : {}),
      metadata: { registration_id: registrationId, activity_id: activityId, user_id: user.id },
    })
  } catch (err) {
    // Rol de inschrijving terug als Mollie faalt
    await supabase
      .from('registrations')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', registrationId)
    console.error('Mollie payment create error:', err)
    return NextResponse.json({ error: 'Betaling aanmaken mislukt. Probeer opnieuw.' }, { status: 500 })
  }

  // 8. Mollie payment ID opslaan — gebruik admin client want user RLS blokkeert UPDATE
  const { error: saveIdError } = await createAdminClient()
    .from('registrations')
    .update({ mollie_payment_id: payment.id })
    .eq('id', registrationId)
  if (saveIdError) {
    console.error('[payments/create] mollie_payment_id opslaan mislukt:', saveIdError)
  }

  const checkoutUrl = payment.getCheckoutUrl()
  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Geen checkout URL ontvangen van Mollie.' }, { status: 500 })
  }

  return NextResponse.json({ payment_url: checkoutUrl })
}
