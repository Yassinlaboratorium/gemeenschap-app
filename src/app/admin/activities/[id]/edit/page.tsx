import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ActivityForm } from '@/components/admin/ActivityForm'
import { updateActivity } from '../../actions'
import type { FormState } from '../../actions'
import type { Activity } from '@/types/database'

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('id', id)
    .single<Activity>()

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
          className="inline-flex items-center gap-1.5 text-sm text-dark/40 hover:text-dark transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <h1 className="text-2xl font-extrabold text-dark">Bewerken</h1>
        <p className="text-dark/40 text-sm mt-0.5">{activity.title}</p>
      </div>
      <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-6 sm:p-8">
        <ActivityForm action={action} activity={activity} />
      </div>
    </div>
  )
}
