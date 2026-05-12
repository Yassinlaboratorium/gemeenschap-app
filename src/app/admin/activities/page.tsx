import Link from 'next/link'
import { Plus, Pencil, Calendar, MapPin, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { ActivityWithCount } from '@/types/database'

const TYPE_LABELS = { workshop: 'Workshop', uitstap: 'Uitstap', evenement: 'Evenement' } as const
const TYPE_COLORS = {
  workshop: 'bg-accent/10 text-accent',
  uitstap: 'bg-green-100 text-green-700',
  evenement: 'bg-primary/10 text-primary',
} as const
const SUCCESS_MSG = {
  created: 'Activiteit succesvol aangemaakt.',
  updated: 'Activiteit succesvol bijgewerkt.',
  deleted: 'Activiteit verwijderd.',
} as const

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: activities } = await supabase
    .from('activities_with_count')
    .select('*')
    .order('date', { ascending: true })
    .returns<ActivityWithCount[]>()

  const successMsg = params.success
    ? SUCCESS_MSG[params.success as keyof typeof SUCCESS_MSG]
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark">Activiteiten</h1>
          <p className="text-dark/40 text-sm mt-0.5">{activities?.length ?? 0} in totaal</p>
        </div>
        <Link
          href="/admin/activities/new"
          className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nieuwe activiteit</span>
          <span className="sm:hidden">Nieuw</span>
        </Link>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {params.error}
        </div>
      )}

      {/* Lege staat */}
      {(!activities || activities.length === 0) && (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm py-16 text-center space-y-3">
          <Calendar className="w-10 h-10 text-dark/20 mx-auto" />
          <p className="text-dark/40 font-medium">Nog geen activiteiten</p>
          <Link
            href="/admin/activities/new"
            className="inline-block text-primary font-semibold text-sm hover:underline"
          >
            Maak de eerste activiteit aan
          </Link>
        </div>
      )}

      {/* Lijst */}
      {activities && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-2xl border border-dark/5 shadow-sm p-5"
            >
              <div className="flex items-start gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[activity.type]}`}
                    >
                      {TYPE_LABELS[activity.type]}
                    </span>
                    {activity.is_published ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600">
                        Gepubliceerd
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-dark/5 text-dark/40">
                        Concept
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-dark leading-snug">{activity.title}</h2>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(activity.date).toLocaleDateString('nl-BE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
                      {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
                    </span>
                    {activity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {activity.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      {activity.participants_count}
                      {activity.max_participants ? `/${activity.max_participants}` : ''} ingeschreven
                    </span>
                    {Number(activity.price) > 0 && (
                      <span>€{Number(activity.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {/* Acties */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/activities/${activity.id}/edit`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-dark/50 hover:text-accent px-3 py-2 rounded-xl hover:bg-accent/5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden sm:inline">Bewerken</span>
                  </Link>
                  <DeleteButton id={activity.id} title={activity.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
