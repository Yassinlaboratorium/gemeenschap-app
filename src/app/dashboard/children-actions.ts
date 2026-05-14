'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addChild(formData: FormData) {
  const firstName = (formData.get('first_name') as string)?.trim()
  const birthDate = (formData.get('birth_date') as string) || null

  if (!firstName) return { error: 'Naam is verplicht.' }
  if (!birthDate) return { error: 'Geboortedatum is verplicht.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd.' }

  const { data: child, error } = await supabase.from('children').insert({
    parent_id: user.id,
    first_name: firstName,
    birth_date: birthDate,
    gender: (formData.get('gender') as string) || null,
    school: (formData.get('school') as string)?.trim() || null,
    postal_code: (formData.get('postal_code') as string)?.trim() || null,
    municipality: (formData.get('municipality') as string) || null,
    neighborhood: (formData.get('neighborhood') as string)?.trim() || null,
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
    .update({
      first_name: firstName,
      birth_date: birthDate,
      gender: (formData.get('gender') as string) || null,
      school: (formData.get('school') as string)?.trim() || null,
      postal_code: (formData.get('postal_code') as string)?.trim() || null,
      municipality: (formData.get('municipality') as string) || null,
      neighborhood: (formData.get('neighborhood') as string)?.trim() || null,
    })
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
