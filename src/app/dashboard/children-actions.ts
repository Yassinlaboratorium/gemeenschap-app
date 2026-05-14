'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addChild(formData: FormData) {
  const firstName = (formData.get('first_name') as string)?.trim()
  const birthDate = (formData.get('birth_date') as string) || null

  if (!firstName) return { error: 'Naam is verplicht.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profiel niet gevonden.' }

  const { data: child, error } = await supabase.from('children').insert({
    parent_id: user.id,
    first_name: firstName,
    birth_date: birthDate,
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, child }
}

export async function updateChild(id: string, formData: FormData) {
  const firstName = (formData.get('first_name') as string)?.trim()
  const birthDate = (formData.get('birth_date') as string) || null

  if (!firstName) return { error: 'Naam is verplicht.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd.' }

  const { error } = await supabase
    .from('children')
    .update({ first_name: firstName, birth_date: birthDate })
    .eq('id', id)
    .eq('parent_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteChild(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd.' }

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', id)
    .eq('parent_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
