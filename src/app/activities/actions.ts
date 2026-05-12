'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; message: string }

export async function registerForActivity(activityId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Je moet ingelogd zijn om je in te schrijven.' }

  // Stap 1: check bestaande inschrijving (ongeacht status)
  const { data: existing } = await supabase
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
    const [{ count }, { data: activity }] = await Promise.all([
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
      activity?.max_participants !== null &&
      activity?.max_participants !== undefined &&
      count !== null &&
      count >= activity.max_participants
    ) {
      return { success: false, message: 'Deze activiteit is helaas vol.' }
    }

    const { error } = await supabase
      .from('registrations')
      .update({ status: 'confirmed', created_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) return { success: false, message: 'Inschrijving mislukt. Probeer opnieuw.' }

    revalidatePath('/activities')
    return { success: true, message: 'Je bent succesvol ingeschreven!' }
  }

  // Stap 3: geen bestaande inschrijving → nieuw aanmaken
  const { error } = await supabase.from('registrations').insert({
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

  const { error } = await supabase
    .from('registrations')
    .update({ status: 'cancelled' })
    .eq('id', registrationId)
    .eq('user_id', user.id)

  if (error) return { success: false, message: 'Annulering mislukt. Probeer opnieuw.' }

  revalidatePath('/activities')
  return { success: true, message: 'Je inschrijving is geannuleerd.' }
}
