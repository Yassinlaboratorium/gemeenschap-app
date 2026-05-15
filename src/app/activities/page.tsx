import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { ActivitiesClient } from './ActivitiesClient'
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

  const allActivities = activities ?? []

  const allTags = [...new Set(allActivities.flatMap(a => a.tags ?? []))].sort()

  const count = allActivities.length

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />

      <div className="bg-dark border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
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

      <ActivitiesClient
        activities={allActivities}
        registrations={registrations ?? []}
        isLoggedIn={!!user}
        allTags={allTags}
      />
    </div>
  )
}
