'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; message: string }

export async function registerForActivity(activityId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Je moet ingelogd zijn om je in te schrijven.' }

  const { error } = await supabase.from('registrations').insert({
    activity_id: activityId,
    user_id: user.id,
    status: 'confirmed',
  })

  if (error) {
    if (error.message.includes('volzet')) {
      return { success: false, message: 'Deze activiteit is helaas vol.' }
    }
    if (error.message.includes('duplicate') || error.code === '23505') {
      return { success: false, message: 'Je bent al ingeschreven voor deze activiteit.' }
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
