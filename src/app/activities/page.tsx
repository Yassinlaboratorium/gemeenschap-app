import { CalendarX, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ActivityCard } from '@/components/activities/ActivityCard'
import type { ActivityWithCount, Registration } from '@/types/database'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: activities }, { data: registrations }] = await Promise.all([
    supabase
      .from('activities_with_count')
      .select('*')
      .eq('is_published', true)
      .order('date', { ascending: true })
      .returns<ActivityWithCount[]>(),

    user
      ? supabase
          .from('registrations')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'cancelled')
          .returns<Registration[]>()
      : Promise.resolve({ data: [] as Registration[] }),
  ])

  const registrationMap = new Map(
    (registrations ?? []).map((r) => [r.activity_id, r])
  )

  const count = activities?.length ?? 0

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      {/* Page header */}
      <div className="bg-dark border-b border-[#2a2a2a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 bg-white/8 text-white/60 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-white/10">
            <CalendarDays className="w-4 h-4" />
            {count} {count === 1 ? 'activiteit' : 'activiteiten'} gepland
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Activiteiten
          </h1>
          <p className="text-[#a0a0a0] mt-2">
            Alle activiteiten van DE GEMEENSCHAP in Sint-Niklaas
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Empty state */}
        {count === 0 && (
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] py-20 text-center space-y-3">
            <CalendarX className="w-10 h-10 text-white/20 mx-auto" />
            <p className="text-[#a0a0a0] font-medium">Geen activiteiten gepland</p>
            <p className="text-white/20 text-sm">Kom later terug voor nieuwe activiteiten.</p>
          </div>
        )}

        {/* Activity cards */}
        {activities?.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            registration={registrationMap.get(activity.id)}
            isLoggedIn={!!user}
          />
        ))}
      </main>
    </div>
  )
}
