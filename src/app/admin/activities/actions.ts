'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type FormState = { error: string } | null

function parseFormData(formData: FormData) {
  const maxParticipants = formData.get('max_participants') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string

  return {
    title: (formData.get('title') as string).trim(),
    description: (formData.get('description') as string)?.trim() || null,
    type: formData.get('type') as string,
    date: formData.get('date') as string,
    start_time: startTime || null,
    end_time: endTime || null,
    location: (formData.get('location') as string)?.trim() || null,
    max_participants: maxParticipants ? Number(maxParticipants) : null,
    price: Number(formData.get('price') ?? 0),
    is_published: formData.get('is_published') === 'on',
  }
}

function validate(values: ReturnType<typeof parseFormData>): string | null {
  if (!values.title) return 'Titel is verplicht.'
  if (!values.type) return 'Type is verplicht.'
  if (!values.date) return 'Datum is verplicht.'
  if (values.max_participants !== null && values.max_participants < 1)
    return 'Max. deelnemers moet groter dan 0 zijn.'
  if (values.price < 0) return 'Prijs mag niet negatief zijn.'
  return null
}

export async function createActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = parseFormData(formData)
  const validationError = validate(values)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await supabase.from('activities').insert(values)
  if (error) return { error: error.message }

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=created')
}

export async function updateActivity(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const values = parseFormData(formData)
  const validationError = validate(values)
  if (validationError) return { error: validationError }

  const supabase = await createClient()
  const { error } = await supabase.from('activities').update(values).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=updated')
}

export async function deleteActivity(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=deleted')
}
