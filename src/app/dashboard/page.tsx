import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarDays, Settings, User,
  CheckCircle2, Clock, ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'
import { YouthIllustration } from '@/components/illustrations/YouthIllustration'
import { ChildrenSection } from '@/components/dashboard/ChildrenSection'
import { SessionRegistrationsSection } from '@/components/dashboard/SessionRegistrationsSection'
import type {
  Profile, RegistrationWithActivity, Child,
  ActivitySession, SessionRegistrationWithDetails,
} from '@/types/database'

const MONTHS_SHORT = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

type RawSessionReg = Omit<SessionRegistrationWithDetails, 'sessions'>

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: registrations },
    { data: children },
    { data: sessionRegsRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('registrations')
      .select('*, activities(*)')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .returns<RegistrationWithActivity[]>(),
    supabase
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: true })
      .returns<Child[]>(),
    supabase
      .from('session_registrations')
      .select('*, activities(id, title, tags), children(id, first_name, birth_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<RawSessionReg[]>(),
  ])

  // Haal sessie-details op voor alle session_ids die in de inschrijvingen staan
  const allSessionIds = (sessionRegsRaw ?? []).flatMap(r => r.session_ids)
  let enrichedSessionRegs: SessionRegistrationWithDetails[] = []

  if (allSessionIds.length > 0) {
    const { data: sessions } = await supabase
      .from('activity_sessions')
      .select('*')
      .in('id', allSessionIds)
      .returns<ActivitySession[]>()

    const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))
    enrichedSessionRegs = (sessionRegsRaw ?? []).map(r => ({
      ...r,
      sessions: r.session_ids.map(id => sessionMap.get(id)).filter(Boolean) as ActivitySession[],
    }))
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'daar'
  const activeRegs = registrations ?? []
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = activeRegs.filter(r => r.activities.date >= today)

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="DE GEMEENSCHAP" width={130} height={28} className="h-7 w-auto" />
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-6">

        {/* ── HERO WELCOME CARD ── */}
        <div
          className="rounded-2xl overflow-hidden relative min-h-[220px] sm:min-h-[240px]"
          style={{ background: 'linear-gradient(135deg, #0d1827 0%, #131C31 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 55% 80% at 95% 15%, rgba(37,99,235,0.20), transparent)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none hidden sm:block"
            style={{ background: 'linear-gradient(to right, #0d1827 35%, rgba(13,24,39,0.55) 58%, transparent 78%)' }}
          />
          <div className="absolute bottom-0 right-0 w-[300px] sm:w-[340px] pointer-events-none hidden sm:block animate-float">
            <YouthIllustration className="w-full h-auto opacity-70" />
          </div>
          <div className="relative z-10 p-7 sm:p-8 sm:pr-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/8 flex items-center justify-center shrink-0 border border-white/10">
                <User className="w-7 h-7 text-white/50" />
              </div>
              <div>
                <p className="text-white/40 text-sm font-medium">Welkom terug</p>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Hey, {firstName}!</h1>
                <p className="text-white/25 text-sm mt-0.5 truncate max-w-[200px]">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-[260px]">
              <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-2xl font-extrabold text-white">{activeRegs.length}</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">Inschrijvingen</p>
              </div>
              <div className="bg-white/8 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-2xl font-extrabold text-white">{upcoming.length}</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">Komend</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── MIJN KINDEREN — alleen voor ouders ── */}
        {profile?.account_type === 'parent' && (
          <ChildrenSection initialChildren={children ?? []} />
        )}

        {/* ── SESSIE-INSCHRIJVINGEN ── */}
        <SessionRegistrationsSection
          sessionRegistrations={enrichedSessionRegs}
          accountType={profile?.account_type ?? null}
        />

        {/* ── MIJN ACTIVITEITEN (klassiek) ── */}
        <div className="bg-[#131C31] rounded-[28px] border border-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-white">Mijn activiteiten</h2>
              <p className="text-sm text-white/40">
                {activeRegs.length === 0
                  ? 'Nog geen inschrijvingen'
                  : `${activeRegs.length} inschrijving${activeRegs.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
          </div>

          {activeRegs.length === 0 ? (
            <div className="py-12 text-center space-y-4 px-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6 text-white/20" />
              </div>
              <div>
                <p className="text-white/40 font-medium">Nog geen inschrijvingen</p>
                <p className="text-white/25 text-sm">Schrijf je in voor activiteiten en ze verschijnen hier.</p>
              </div>
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Bekijk activiteiten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {activeRegs.map((reg) => {
                const activity = reg.activities
                const firstTag = activity.tags?.[0]
                const [, month, day] = activity.date.split('-')
                const monthShort = MONTHS_SHORT[parseInt(month, 10) - 1]
                const startTime = activity.start_time?.slice(0, 5)
                const isPast = activity.date < today

                return (
                  <li key={reg.id} className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] ${isPast ? 'opacity-40' : ''}`}>
                    <div className="w-11 h-11 rounded-xl bg-white/5 flex flex-col items-center justify-center shrink-0 leading-none border border-white/10">
                      <span className="text-base font-extrabold text-white">{day}</span>
                      <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">{monthShort}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-white/30">
                        {firstTag && (
                          <span className="text-primary/70">{firstTag}</span>
                        )}
                        {startTime && (
                          <>
                            {firstTag && <span className="text-white/10">·</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {startTime}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isPast ? (
                        <span className="text-xs font-medium text-white/25 bg-white/5 px-2.5 py-1 rounded-full">Voorbij</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Ingeschreven
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {activeRegs.length > 0 && (
            <div className="px-6 py-4 border-t border-white/5">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all hover:text-accent"
              >
                Meer activiteiten bekijken <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* ── ADMIN LINK ── */}
        {profile?.is_admin && (
          <div className="bg-[#131C31] border border-primary/20 rounded-[28px] p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Beheerdersmodus</p>
                <p className="text-xs text-white/40">Activiteiten beheren en inschrijvingen bekijken</p>
              </div>
            </div>
            <Link
              href="/admin/activities"
              className="bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all"
            >
              Naar admin
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
