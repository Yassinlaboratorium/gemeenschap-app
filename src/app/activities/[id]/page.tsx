import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, CalendarDays, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { SessionPicker } from './SessionPicker'
import type { Activity, ActivitySession, Child } from '@/types/database'

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
      .from('activity_sessions')
      .select('*')
      .eq('activity_id', id)
      .order('session_date', { ascending: true })
      .returns<ActivitySession[]>(),
  ])

  if (!activity) notFound()
  if (!sessions || sessions.length === 0) redirect(`/activities`)

  let children: Child[] = []
  if (user) {
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })
      .returns<Child[]>()
    children = data ?? []
  }

  const firstTag = activity.tags?.[0] ?? ''

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-dark border-b border-[#2a2a2a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/activities"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar activiteiten
          </Link>

          {/* Tags */}
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
                {new Date(activity.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
          </div>

          {activity.description && (
            <p className="text-[#a0a0a0] mt-4 leading-relaxed">{activity.description}</p>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <SessionPicker
          activity={activity}
          sessions={sessions}
          children={children}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  )
}
