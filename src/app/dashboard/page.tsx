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
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#D9D9D9] px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/">
          <Image src="/logo.png" alt="DE GEMEENSCHAP" width={130} height={28} className="h-7 w-auto" />
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-6">

        {/* ── HERO WELCOME CARD ── */}
        <div
          className="rounded-2xl overflow-hidden relative min-h-[220px] sm:min-h-[240px] shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1B9193 0%, #157a7c 60%, #0f6163 100%)' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 55% 80% at 95% 15%, rgba(255,255,255,0.08), transparent)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none hidden sm:block"
            style={{ background: 'linear-gradient(to right, rgba(27,145,147,0.9) 35%, rgba(27,145,147,0.55) 58%, transparent 78%)' }}
          />
          <div className="absolute bottom-0 right-0 w-[300px] sm:w-[340px] pointer-events-none hidden sm:block animate-float">
            <YouthIllustration className="w-full h-auto opacity-60" />
          </div>
          <div className="relative z-10 p-7 sm:p-8 sm:pr-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/25">
                <User className="w-7 h-7 text-white/70" />
              </div>
              <div>
                <p className="text-white/65 text-sm font-medium">Welkom terug</p>
                <h1 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Hey, {firstName}!</h1>
                <p className="text-white/40 text-sm mt-0.5 truncate max-w-[200px]">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-[260px]">
              <div className="bg-white/15 rounded-xl px-4 py-3 border border-white/20">
                <p className="text-2xl font-extrabold text-white">{activeRegs.length}</p>
                <p className="text-xs text-white/60 font-medium mt-0.5">Inschrijvingen</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-3 border border-white/20">
                <p className="text-2xl font-extrabold text-white">{upcoming.length}</p>
                <p className="text-xs text-white/60 font-medium mt-0.5">Komend</p>
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
        <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#D9D9D9] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9FB139]/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#9FB139]" />
            </div>
            <div>
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#414141' }}>Mijn activiteiten</h2>
              <p className="text-sm text-[#414141]/45">
                {activeRegs.length === 0
                  ? 'Nog geen inschrijvingen'
                  : `${activeRegs.length} inschrijving${activeRegs.length !== 1 ? 'en' : ''}`}
              </p>
            </div>
          </div>

          {activeRegs.length === 0 ? (
            <div className="py-12 text-center space-y-4 px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#F8F8F8] flex items-center justify-center mx-auto border border-[#D9D9D9]">
                <CalendarDays className="w-6 h-6 text-[#414141]/20" />
              </div>
              <div>
                <p className="text-[#414141]/50 font-medium">Nog geen inschrijvingen</p>
                <p className="text-[#414141]/35 text-sm">Schrijf je in voor activiteiten en ze verschijnen hier.</p>
              </div>
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-semibold px-5 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all text-sm shadow-sm"
              >
                Bekijk activiteiten
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#D9D9D9]">
              {activeRegs.map((reg) => {
                const activity = reg.activities
                const firstTag = activity.tags?.[0]
                const [, month, day] = activity.date.split('-')
                const monthShort = MONTHS_SHORT[parseInt(month, 10) - 1]
                const startTime = activity.start_time?.slice(0, 5)
                const isPast = activity.date < today

                return (
                  <li key={reg.id} className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[#F8F8F8] ${isPast ? 'opacity-50' : ''}`}>
                    <div className="w-11 h-11 rounded-xl bg-[#1B9193]/8 flex flex-col items-center justify-center shrink-0 leading-none border border-[#1B9193]/15">
                      <span className="text-base font-extrabold text-[#1B9193]">{day}</span>
                      <span className="text-[9px] font-semibold text-[#1B9193]/50 uppercase tracking-wider">{monthShort}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#414141] text-sm truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#414141]/40">
                        {firstTag && (
                          <span className="text-[#9FB139]">{firstTag}</span>
                        )}
                        {startTime && (
                          <>
                            {firstTag && <span className="text-[#414141]/20">·</span>}
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
                        <span className="text-xs font-medium text-[#414141]/35 bg-[#F8F8F8] border border-[#D9D9D9] px-2.5 py-1 rounded-full">Voorbij</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
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
            <div className="px-6 py-4 border-t border-[#D9D9D9]">
              <Link
                href="/activities"
                className="inline-flex items-center gap-2 text-[#9FB139] font-semibold text-sm hover:gap-3 transition-all hover:text-[#8fa030]"
              >
                Meer activiteiten bekijken <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* ── ADMIN LINK ── */}
        {profile?.is_admin && (
          <div className="bg-white border border-[#1B9193]/20 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B9193]/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#1B9193]" />
              </div>
              <div>
                <p className="font-bold text-[#414141] text-sm" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Beheerdersmodus</p>
                <p className="text-xs text-[#414141]/45">Activiteiten beheren en inschrijvingen bekijken</p>
              </div>
            </div>
            <Link
              href="/admin/activities"
              className="bg-[#1B9193] text-white text-sm font-semibold px-4 py-2 rounded-[30px] hover:bg-[#157a7c] transition-all shadow-sm"
            >
              Naar admin
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}
