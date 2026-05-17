import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ActivityForm } from '@/components/admin/ActivityForm'
import { updateActivity } from '../../actions'
import type { FormState } from '../../actions'
import type { Activity, ActivitySession } from '@/types/database'

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: activity }, { data: sessions }] = await Promise.all([
    supabase.from('activities').select('*').eq('id', id).single<Activity>(),
    supabase
      .from('activity_sessions')
      .select('*')
      .eq('activity_id', id)
      .order('session_date', { ascending: true })
      .returns<ActivitySession[]>(),
  ])

  if (!activity) notFound()

  async function action(prev: FormState, formData: FormData) {
    'use server'
    return updateActivity(id, prev, formData)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/activities"
          className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Bewerken</h1>
        <p className="text-[#414141]/45 text-sm mt-0.5">{activity.title}</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#D9D9D9] p-6 sm:p-8 shadow-sm">
        <ActivityForm action={action} activity={activity} initialSessions={sessions ?? []} />
      </div>
    </div>
  )
}
