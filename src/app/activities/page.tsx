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
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="bg-white border-b border-[#D9D9D9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 bg-[#1B9193]/8 text-[#1B9193] rounded-full px-4 py-1.5 text-sm font-semibold mb-4 border border-[#1B9193]/15">
            <CalendarDays className="w-4 h-4" />
            {count} {count === 1 ? 'activiteit' : 'activiteiten'} gepland
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>
            Activiteiten
          </h1>
          <p className="text-[#414141]/55 mt-2">
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
