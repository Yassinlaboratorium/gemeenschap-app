import { CalendarX } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-dark">Activiteiten</h1>
          <p className="text-dark/50">
            Alle activiteiten van vzw De Gemeenschap in Sint-Niklaas
          </p>
        </div>

        {/* Lege staat */}
        {(!activities || activities.length === 0) && (
          <div className="bg-white rounded-2xl border border-dark/5 shadow-sm py-20 text-center space-y-3">
            <CalendarX className="w-10 h-10 text-dark/20 mx-auto" />
            <p className="text-dark/40 font-medium">Geen activiteiten gepland</p>
            <p className="text-dark/30 text-sm">Kom later terug voor nieuwe activiteiten.</p>
          </div>
        )}

        {/* Activiteitenkaarten */}
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
