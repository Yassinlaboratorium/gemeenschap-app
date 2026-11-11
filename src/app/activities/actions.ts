'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; message: string }

// Alle schrijfacties op `registrations` lopen via de admin client, nadat de
// server zelf de gebruiker, de activiteit en de prijs heeft gecontroleerd.
// Gebruikers hebben in de database geen INSERT/UPDATE-rechten meer op deze
// tabel (zie supabase/11_payment_rls_hardening.sql).

export async function registerForActivity(activityId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Je moet ingelogd zijn om je in te schrijven.' }

  // Activiteit moet gepubliceerd én gratis zijn. Betalende activiteiten lopen
  // uitsluitend via /api/payments/create, anders kan de betaling omzeild worden.
  const { data: activity } = await supabase
    .from('activities')
    .select('id, price, max_participants')
    .eq('id', activityId)
    .eq('is_published', true)
    .maybeSingle()

  if (!activity) return { success: false, message: 'Activiteit niet gevonden.' }
  if (Number(activity.price) > 0) {
    return { success: false, message: 'Voor deze activiteit moet je eerst betalen.' }
  }

  const admin = createAdminClient()

  // Stap 1: check bestaande inschrijving (ongeacht status)
  const { data: existing } = await admin
    .from('registrations')
    .select('id, status')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    // Stap 2a: al actief ingeschreven → error
    if (existing.status === 'confirmed' || existing.status === 'pending') {
      return { success: false, message: 'Je bent al ingeschreven voor deze activiteit.' }
    }

    // Stap 2b: eerder geannuleerd → check capaciteit en heractiveer
    const { count } = await admin
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', activityId)
      .neq('status', 'cancelled')

    if (
      activity.max_participants !== null &&
      activity.max_participants !== undefined &&
      count !== null &&
      count >= activity.max_participants
    ) {
      return { success: false, message: 'Deze activiteit is helaas vol.' }
    }

    const { error } = await admin
      .from('registrations')
      .update({ status: 'confirmed', created_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('user_id', user.id)

    if (error) return { success: false, message: 'Inschrijving mislukt. Probeer opnieuw.' }

    revalidatePath('/activities')
    return { success: true, message: 'Je bent succesvol ingeschreven!' }
  }

  // Stap 3: geen bestaande inschrijving → nieuw aanmaken
  const { error } = await admin.from('registrations').insert({
    activity_id: activityId,
    user_id: user.id,
    status: 'confirmed',
  })

  if (error) {
    if (error.message.includes('volzet')) {
      return { success: false, message: 'Deze activiteit is helaas vol.' }
    }
    return { success: false, message: 'Inschrijving mislukt. Probeer opnieuw.' }
  }

  revalidatePath('/activities')
  return { success: true, message: 'Je bent succesvol ingeschreven!' }
}

export async function cancelRegistration(registrationId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Niet ingelogd.' }

  // Lezen via de gebruikersclient: RLS garandeert dat dit de eigen inschrijving is.
  const { data: reg } = await supabase
    .from('registrations')
    .select('id, payment_status')
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!reg) return { success: false, message: 'Inschrijving niet gevonden.' }

  if (reg.payment_status === 'paid') {
    return {
      success: false,
      message: 'Betaalde inschrijvingen kunnen niet geannuleerd worden. Neem contact op via info@degemeenschap.be voor terugbetaling.',
    }
  }

  const { error } = await createAdminClient()
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('id', reg.id)
    .eq('user_id', user.id)

  if (error) return { success: false, message: 'Annulering mislukt. Probeer opnieuw.' }

  revalidatePath('/activities')
  return { success: true, message: 'Je inschrijving is geannuleerd.' }
}
