'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type FormState = { error: string } | null

export type SessionDraft = {
  id?: string
  session_date: string
  start_time: string
  end_time: string
  title: string
  description: string
  location: string
  max_participants: string
  price_euros: string
}

function parseFormData(formData: FormData) {
  const maxParticipants = formData.get('max_participants') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string
  const tagsRaw = (formData.get('tags') as string ?? '').trim()
  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : []

  const sessionsJson = formData.get('sessions_json') as string | null
  let sessions: SessionDraft[] = []
  if (sessionsJson) {
    try { sessions = JSON.parse(sessionsJson) } catch { /* ignore */ }
  }

  return {
    title: (formData.get('title') as string).trim(),
    description: (formData.get('description') as string)?.trim() || null,
    tags,
    date: formData.get('date') as string,
    start_time: startTime || null,
    end_time: endTime || null,
    location: (formData.get('location') as string)?.trim() || null,
    max_participants: maxParticipants ? Number(maxParticipants) : null,
    price: Number(formData.get('price') ?? 0),
    is_published: formData.get('is_published') === 'on',
    sessions,
  }
}

function validate(values: ReturnType<typeof parseFormData>): string | null {
  if (!values.title) return 'Titel is verplicht.'
  if (!values.date) return 'Datum is verplicht.'
  if (values.max_participants !== null && values.max_participants < 1)
    return 'Max. deelnemers moet groter dan 0 zijn.'
  if (values.price < 0) return 'Prijs mag niet negatief zijn.'
  for (const s of values.sessions) {
    if (!s.session_date) return 'Elke sessie moet een datum hebben.'
    const pc = Math.round(parseFloat(s.price_euros || '0') * 100)
    if (isNaN(pc) || pc < 0) return 'Sessieprijs mag niet negatief zijn.'
  }
  return null
}

async function saveSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  activityId: string,
  sessions: SessionDraft[],
  existingIds: string[] = []
) {
  const keepIds = sessions.filter(s => s.id).map(s => s.id!)
  const toDelete = existingIds.filter(id => !keepIds.includes(id))
  if (toDelete.length > 0) {
    await supabase.from('activity_sessions').delete().in('id', toDelete)
  }
  for (const s of sessions) {
    const priceCents = Math.round(parseFloat(s.price_euros || '0') * 100)
    const record = {
      activity_id: activityId,
      session_date: s.session_date,
      start_time: s.start_time || null,
      end_time: s.end_time || null,
      title: s.title.trim() || null,
      description: s.description.trim() || null,
      location: s.location?.trim() || null,
      max_participants: s.max_participants ? Number(s.max_participants) : null,
      price_cents: isNaN(priceCents) ? 0 : priceCents,
    }
    if (s.id) {
      await supabase.from('activity_sessions').update(record).eq('id', s.id)
    } else {
      await supabase.from('activity_sessions').insert(record)
    }
  }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd.' as const, supabase: null }
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: 'Geen beheerdersrechten.' as const, supabase: null }
  return { error: null, supabase }
}

export async function createActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const { error: authError, supabase: supabase_ } = await requireAdmin()
  if (authError) return { error: authError }
  const supabase = supabase_!

  const { sessions, ...values } = parseFormData(formData)
  const validationError = validate({ ...values, sessions })
  if (validationError) return { error: validationError }

  const { data: activity, error } = await supabase
    .from('activities')
    .insert(values)
    .select('id')
    .single()

  if (error || !activity) return { error: error?.message ?? 'Aanmaken mislukt.' }

  await saveSessions(supabase, activity.id, sessions)

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=created')
}

export async function updateActivity(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { error: authError, supabase: supabase_ } = await requireAdmin()
  if (authError) return { error: authError }
  const supabase = supabase_!

  const { sessions, ...values } = parseFormData(formData)
  const validationError = validate({ ...values, sessions })
  if (validationError) return { error: validationError }

  const { error } = await supabase.from('activities').update(values).eq('id', id)
  if (error) return { error: error.message }

  const { data: existing } = await supabase
    .from('activity_sessions')
    .select('id')
    .eq('activity_id', id)

  await saveSessions(supabase, id, sessions, (existing ?? []).map(s => s.id))

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=updated')
}

export async function deleteActivity(id: string) {
  const { error: authError, supabase: supabase_ } = await requireAdmin()
  if (authError) throw new Error(authError)
  const supabase = supabase_!

  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/activities')
  redirect('/admin/activities?success=deleted')
}
