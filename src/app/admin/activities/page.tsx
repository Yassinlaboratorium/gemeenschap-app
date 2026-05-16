import Link from 'next/link'
import { Plus, Pencil, Calendar, MapPin, Users, CheckCircle2, AlertCircle, LayoutGrid, UserCheck, CalendarClock, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { SendPushButton } from '@/components/admin/SendPushButton'
import type { ActivityWithCount } from '@/types/database'

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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    { data: activities },
    { count: totalRegistrations },
    { count: thisMonthCount },
  ] = await Promise.all([
    supabase
      .from('activities_with_count')
      .select('*')
      .order('date', { ascending: true })
      .returns<ActivityWithCount[]>(),
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'cancelled'),
    supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .gte('date', monthStart)
      .lte('date', monthEnd),
  ])

  const successMsg = params.success
    ? SUCCESS_MSG[params.success as keyof typeof SUCCESS_MSG]
    : null

  const STATS = [
    { icon: LayoutGrid,    label: 'Activiteiten',  value: activities?.length ?? 0,  color: 'bg-primary/10 text-primary' },
    { icon: UserCheck,     label: 'Inschrijvingen',value: totalRegistrations ?? 0,  color: 'bg-accent/10 text-accent' },
    { icon: CalendarClock, label: 'Deze maand',    value: thisMonthCount ?? 0,       color: 'bg-blue-500/10 text-blue-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Activiteiten</h1>
          <p className="text-white/40 text-sm mt-0.5">Beheer alle activiteiten</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SendPushButton />
          <Link
            href="/admin/activities/new"
            className="flex items-center gap-2 bg-[#9FB139] text-white font-semibold px-4 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nieuwe activiteit</span>
            <span className="sm:hidden">Nieuw</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {STATS.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#131C31] rounded-[28px] border border-white/5 p-4 sm:p-5">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-white">{value}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {params.error}
        </div>
      )}

      {(!activities || activities.length === 0) && (
        <div className="bg-[#131C31] rounded-[28px] border border-white/5 py-16 text-center space-y-3">
          <Calendar className="w-10 h-10 text-white/20 mx-auto" />
          <p className="text-white/40 font-medium">Nog geen activiteiten</p>
          <Link href="/admin/activities/new" className="inline-block text-primary font-semibold text-sm hover:underline">
            Maak de eerste activiteit aan
          </Link>
        </div>
      )}

      {activities && activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-[#131C31] rounded-[28px] border border-white/5 p-5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activity.tags?.length > 0 ? (
                      activity.tags.map(tag => (
                        <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-white/30">
                        Geen tags
                      </span>
                    )}
                    {activity.sessions_count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                        {activity.sessions_count} sessies
                      </span>
                    )}
                    {activity.is_published ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">
                        Gepubliceerd
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-white/30">
                        Concept
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-white leading-snug">{activity.title}</h2>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(activity.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
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
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/activities/${activity.id}/registrations`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-primary px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors"
                    title="Inschrijvingen"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Inschrijvingen</span>
                  </Link>
                  <Link
                    href={`/admin/activities/${activity.id}/edit`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-accent px-3 py-2 rounded-xl hover:bg-accent/5 transition-colors"
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
