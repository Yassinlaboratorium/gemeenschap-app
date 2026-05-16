import Link from 'next/link'
import {
  LayoutDashboard, UserPlus, ArrowRight,
  Users, CalendarDays, Trophy, TrendingUp,
  Globe, Zap, Star, MapPin, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import type { ActivityWithCount } from '@/types/database'

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Samen Groeien',
    desc: 'Ontwikkel nieuwe vaardigheden, ontdek je talenten en groei samen met anderen in een veilige omgeving.',
    color: 'bg-[#1B9193]/10 text-[#1B9193]',
  },
  {
    icon: Users,
    title: 'Jongeren Centraal',
    desc: 'Alles wat we doen staat in teken van jongeren — hun stem, hun noden en hun dromen staan voorop.',
    color: 'bg-[#9FB139]/10 text-[#9FB139]',
  },
  {
    icon: Globe,
    title: 'Diversiteit Verbindt',
    desc: 'We verwelkomen iedereen. Onze kracht ligt in de mix van achtergronden, culturen en perspectieven.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Zap,
    title: 'Avontuurlijk',
    desc: 'Van uitstappen en evenementen tot creatieve workshops — er is altijd iets nieuws te beleven.',
    color: 'bg-amber-50 text-amber-600',
  },
]

export default async function Home() {
  const supabase = await createClient()
  const [
    { data: { user } },
    { count: membersCount },
    { count: activitiesCount },
    { data: upcoming },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('activities').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase
      .from('activities_with_count')
      .select('*')
      .eq('is_published', true)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .limit(4)
      .returns<ActivityWithCount[]>(),
  ])

  const nextEvent = upcoming?.[0] ?? null
  const dashboardActivities = upcoming?.slice(0, 3) ?? []

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B9193 0%, #157a7c 60%, #0f5e60 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 10%, rgba(255,255,255,0.12), transparent)' }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-white/20" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 border border-white/25 bg-white/15 text-white/90 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9FB139] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9FB139]" />
                </span>
                Erkend jeugdcentrum · Sint-Niklaas
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: 'white' }}>
                Samen bouwen aan{' '}
                <span className="text-[#9FB139]">
                  kansen voor jongeren.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-lg">
                Jeugdhuis voor jongeren van Sint-Niklaas en omgeving. Workshops, uitstappen en een
                gemeenschap die voor je staat — for a collective future.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/activities"
                  className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-3.5 rounded-[30px] hover:bg-[#8fa030] active:scale-95 transition-all text-sm shadow-lg"
                >
                  Ontdek Onze Werking
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-6 py-3.5 rounded-[30px] hover:bg-white/25 active:scale-95 transition-all border border-white/25 backdrop-blur-sm text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-6 py-3.5 rounded-[30px] hover:bg-white/25 active:scale-95 transition-all border border-white/25 backdrop-blur-sm text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Word Vrijwilliger
                  </Link>
                )}
              </div>
            </div>

            {/* Right: stats card */}
            <div className="hidden lg:block">
              <div className="bg-white/15 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Community Stats</p>
                  <div className="flex items-center gap-1.5 text-xs text-[#9FB139] font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#9FB139]" />
                    Actief
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between py-4 border-b border-white/15">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-white/75 font-medium">Leden</p>
                    </div>
                    <p className="text-2xl font-black text-white">200+</p>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-white/15">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#9FB139]/25 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#9FB139]" />
                      </div>
                      <p className="text-sm text-white/75 font-medium">Activiteiten</p>
                    </div>
                    <p className="text-2xl font-black text-white">50+</p>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm text-white/75 font-medium">Community groei</p>
                    </div>
                    <p className="text-2xl font-black text-[#9FB139]">+230%</p>
                  </div>
                </div>

                <Link
                  href="/activities"
                  className="flex items-center justify-center gap-2 w-full bg-white/15 hover:bg-white/25 text-white font-semibold py-3 rounded-[30px] transition-all text-sm border border-white/25"
                >
                  Bekijk activiteiten <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY DASHBOARD ──────────────────────────────── */}
      <section className="bg-[#F8F8F8] py-20 sm:py-28 border-t border-[#D9D9D9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="max-w-xl mb-12">
            <p className="text-[#9FB139] font-bold text-sm uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Community Dashboard</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Wat is er gaande?</h2>
            <p className="text-[#414141]/60 mt-3 leading-relaxed">
              Een blik op onze community — leden, activiteiten en wat er binnenkort te doen is.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: 'Leden', value: membersCount ?? 0, suffix: '+', color: 'text-[#1B9193]', bg: 'bg-[#1B9193]/10' },
              { icon: CalendarDays, label: 'Activiteiten', value: activitiesCount ?? 0, suffix: '+', color: 'text-[#9FB139]', bg: 'bg-[#9FB139]/10' },
              { icon: Trophy, label: 'Jaar actief', value: 10, suffix: '+', color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: Star, label: 'Sint-Niklaas', value: '#1', suffix: '', color: 'text-[#1B9193]', bg: 'bg-[#1B9193]/10' },
            ].map(({ icon: Icon, label, value, suffix, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-[#D9D9D9] p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{value}{suffix}</p>
                  <p className="text-xs text-[#414141]/50 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming activities + next event */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">

            {/* Activity list */}
            <div className="bg-white rounded-2xl border border-[#D9D9D9] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Komende activiteiten</p>
                <Link
                  href="/activities"
                  className="text-xs text-[#9FB139] font-semibold hover:underline flex items-center gap-1"
                >
                  Alles <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {dashboardActivities.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarDays className="w-8 h-8 text-[#414141]/15 mx-auto mb-2" />
                  <p className="text-[#414141]/35 text-sm">Binnenkort meer activiteiten</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {dashboardActivities.map(a => {
                    const pct = a.max_participants
                      ? Math.min(100, Math.round((a.participants_count / a.max_participants) * 100))
                      : null
                    const date = new Date(a.date + 'T00:00:00').toLocaleDateString('nl-BE', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })
                    return (
                      <Link href={`/activities/${a.id}`} key={a.id} className="block group">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#414141] group-hover:text-[#1B9193] transition-colors truncate">
                              {a.title}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs text-[#414141]/40 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> {date}
                              </span>
                              {a.location && (
                                <span className="text-xs text-[#414141]/40 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{a.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {pct !== null && (
                            <span className="text-xs text-[#414141]/40 shrink-0 mt-0.5">
                              {a.participants_count}/{a.max_participants}
                            </span>
                          )}
                        </div>
                        {pct !== null ? (
                          <div className="h-1.5 bg-[#D9D9D9] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#9FB139] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : (
                          <div className="h-px bg-[#D9D9D9]" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Next event card */}
            {nextEvent ? (
              <Link
                href={`/activities/${nextEvent.id}`}
                className="relative overflow-hidden rounded-2xl border border-[#1B9193]/20 p-6 flex flex-col justify-between group shadow-sm hover:shadow-md transition-shadow"
                style={{ background: 'linear-gradient(145deg, #1B9193 0%, #157a7c 50%, #0f6163 100%)' }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.1), transparent)' }}
                />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white rounded-full px-3 py-1 text-xs font-bold mb-4">
                    <Clock className="w-3 h-3" />
                    Volgende activiteit
                  </div>
                  <h3 className="text-white font-black text-xl leading-snug group-hover:text-white/90 transition-colors" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                    {nextEvent.title}
                  </h3>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-white/70 text-sm flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('nl-BE', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </p>
                    {nextEvent.location && (
                      <p className="text-white/70 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {nextEvent.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative mt-8 flex items-center gap-2 text-white text-sm font-semibold">
                  Inschrijven
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ) : (
              <div
                className="relative overflow-hidden rounded-2xl border border-[#1B9193]/20 p-6 flex flex-col items-center justify-center text-center shadow-sm"
                style={{ background: 'linear-gradient(145deg, #1B9193 0%, #157a7c 50%, #0f6163 100%)' }}
              >
                <CalendarDays className="w-10 h-10 text-white/30 mb-3" />
                <p className="text-white/60 text-sm">Binnenkort meer activiteiten</p>
                <Link
                  href="/activities"
                  className="mt-4 text-white text-sm font-semibold hover:underline"
                >
                  Bekijk agenda
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── WAAR WIJ VOOR STAAN ──────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-[#D9D9D9] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="max-w-xl mb-14">
            <p className="text-[#9FB139] font-bold text-sm uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Onze Missie</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>
              Waar wij voor staan
            </h2>
            <p className="text-[#414141]/60 mt-4 leading-relaxed">
              Vier pijlers die alles wat we doen vormgeven — voor elke jongere, elke dag opnieuw.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-[#F8F8F8] rounded-2xl p-6 border border-[#D9D9D9] hover:border-[#1B9193]/30 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1B9193] text-base mb-2" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{title}</h3>
                <p className="text-[#414141]/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-14 text-center space-y-4">
              <p className="text-[#414141]/45 text-sm">Klaar om mee te doen?</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-bold px-7 py-3.5 rounded-[30px] hover:bg-[#8fa030] active:scale-95 transition-all shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                Word lid — gratis
              </Link>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
