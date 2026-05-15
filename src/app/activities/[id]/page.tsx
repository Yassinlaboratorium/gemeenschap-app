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
    if (accountType !== 'youth') {
      children = childrenRes.data ?? []
    }
    registration = regRes.data ?? undefined
  }

  const price = Number(activity.price)

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Navbar />

      <div className="bg-[#131C31] border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/activities"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar activiteiten
          </Link>

          {activity.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {activity.tags.map(tag => (
                <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
            {activity.title}
          </h1>

          <div className="flex flex-col gap-2 text-sm text-[#a0a0a0]">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-white/20" />
              <span>
                {new Date(activity.date + 'T00:00:00').toLocaleDateString('nl-BE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </div>
            {(activity.start_time || activity.end_time) && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-white/20" />
                <span>
                  {activity.start_time?.slice(0, 5)}
                  {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
                </span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0 text-white/20" />
                <span>{activity.location}</span>
              </div>
            )}
            {!hasSessions && price > 0 && (
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 shrink-0 text-white/20" />
                <span className="font-semibold text-white">€{price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {activity.description && (
            <p className="text-[#a0a0a0] mt-4 leading-relaxed">{activity.description}</p>
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
