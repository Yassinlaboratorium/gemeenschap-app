import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, CalendarDays, Clock, Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { SessionPicker } from './SessionPicker'
import { SimpleRegistration } from './SimpleRegistration'
import type { Activity, ActivitySessionWithCount, Child, Profile, Registration } from '@/types/database'

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: activity }, { data: sessions }] = await Promise.all([
    supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single<Activity>(),
    supabase
      .from('activity_sessions_with_count')
      .select('*')
      .eq('activity_id', id)
      .order('session_date', { ascending: true })
      .returns<ActivitySessionWithCount[]>(),
  ])

  if (!activity) notFound()

  const hasSessions = (sessions ?? []).length > 0

  let children: Child[] = []
  let accountType: string | null = null
  let registration: Registration | undefined

  if (user) {
    const [profileRes, childrenRes, regRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single<Pick<Profile, 'account_type'>>(),
      supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true })
        .returns<Child[]>(),
      hasSessions
        ? Promise.resolve({ data: null })
        : supabase
            .from('registrations')
            .select('*')
            .eq('activity_id', id)
            .eq('user_id', user.id)
            .maybeSingle<Registration>(),
    ])

    accountType = profileRes.data?.account_type ?? null
    if (accountType !== 'deelnemer') {
      children = childrenRes.data ?? []
    }
    registration = regRes.data ?? undefined
  }

  const price = Number(activity.price)

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Navbar />

      <div className="bg-white border-b border-[#D9D9D9]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/activities"
            className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar activiteiten
          </Link>

          {activity.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {activity.tags.map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#9FB139]/10 text-[#9FB139] border border-[#9FB139]/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>
            {activity.title}
          </h1>

          <div className="flex flex-col gap-2 text-sm text-[#414141]/55">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-[#1B9193]/50" />
              <span>
                {new Date(activity.date + 'T00:00:00').toLocaleDateString('nl-BE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            {(activity.start_time || activity.end_time) && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-[#1B9193]/50" />
                <span>
                  {activity.start_time?.slice(0, 5)}
                  {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
                </span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0 text-[#1B9193]/50" />
                <span>{activity.location}</span>
              </div>
            )}
            {!hasSessions && price > 0 && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 shrink-0 text-[#1B9193]/50" />
                <span className="font-semibold text-[#9FB139]">€{price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-[#414141]/60 mt-4 leading-relaxed">{activity.description}</p>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {hasSessions ? (
          <SessionPicker
            activity={activity}
            sessions={sessions!}
            children={children}
            isLoggedIn={!!user}
            accountType={accountType}
          />
        ) : (
          <SimpleRegistration
            activity={activity}
            registration={registration}
            isLoggedIn={!!user}
          />
        )}
      </main>
    </div>
  )
}
