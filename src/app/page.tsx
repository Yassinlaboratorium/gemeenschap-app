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
    gradient: 'from-blue-500 to-blue-700',
    glow: 'shadow-blue-500/25',
  },
  {
    icon: Users,
    title: 'Jongeren Centraal',
    desc: 'Alles wat we doen staat in teken van jongeren — hun stem, hun noden en hun dromen staan voorop.',
    gradient: 'from-primary to-accent',
    glow: 'shadow-primary/25',
  },
  {
    icon: Globe,
    title: 'Diversiteit Verbindt',
    desc: 'We verwelkomen iedereen. Onze kracht ligt in de mix van achtergronden, culturen en perspectieven.',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'shadow-violet-500/25',
  },
  {
    icon: Zap,
    title: 'Avontuurlijk',
    desc: 'Van uitstappen en evenementen tot creatieve workshops — er is altijd iets nieuws te beleven.',
    gradient: 'from-emerald-500 to-teal-700',
    glow: 'shadow-emerald-500/25',
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
    <div className="flex flex-col min-h-screen bg-secondary">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B1020 0%, #121B33 50%, #0D4C92 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 10%, rgba(29,78,216,0.35), transparent)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 70% at 10% 90%, rgba(13,76,146,0.20), transparent)' }}
        />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2.5 border border-white/10 bg-white/5 text-white/70 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                Erkend jeugdcentrum · Sint-Niklaas
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Samen bouwen aan{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-white">
                  kansen voor jongeren.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
                Jeugdhuis voor jongeren van Sint-Niklaas en omgeving. Workshops, uitstappen en een
                gemeenschap die voor je staat — for a collective future.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/activities"
                  className="inline-flex items-center gap-2 bg-white text-[#0B1020] font-bold px-6 py-3.5 rounded-2xl hover:bg-white/90 active:scale-95 transition-all text-sm shadow-xl shadow-black/20"
                >
                  Ontdek Onze Werking
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/15 active:scale-95 transition-all border border-white/15 backdrop-blur-sm text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/15 active:scale-95 transition-all border border-white/15 backdrop-blur-sm text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Word Vrijwilliger
                  </Link>
                )}
              </div>
            </div>

            {/* Right: glassmorphism stats card */}
            <div className="hidden lg:block">
              <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Community Stats</p>
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Actief
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-300" />
                      </div>
                      <p className="text-sm text-white/60 font-medium">Leden</p>
                    </div>
                    <p className="text-2xl font-black text-white">200+</p>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-white/60 font-medium">Activiteiten</p>
                    </div>
                    <p className="text-2xl font-black text-white">50+</p>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-300" />
                      </div>
                      <p className="text-sm text-white/60 font-medium">Community groei</p>
                    </div>
                    <p className="text-2xl font-black text-emerald-300">+230%</p>
                  </div>
                </div>

                <Link
                  href="/activities"
                  className="flex items-center justify-center gap-2 w-full bg-white/8 hover:bg-white/12 text-white font-semibold py-3 rounded-2xl transition-all text-sm border border-white/10"
                >
                  Bekijk activiteiten <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY DASHBOARD ──────────────────────────────── */}
      <section className="bg-secondary py-20 sm:py-28 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="max-w-xl mb-12">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Community Dashboard</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">Wat is er gaande?</h2>
            <p className="text-[#a0a0a0] mt-3 leading-relaxed">
              Een blik op onze community — leden, activiteiten en wat er binnenkort te doen is.
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: 'Leden', value: membersCount ?? 0, suffix: '+', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { icon: CalendarDays, label: 'Activiteiten', value: activitiesCount ?? 0, suffix: '+', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: Trophy, label: 'Jaar actief', value: 10, suffix: '+', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { icon: Star, label: 'Sint-Niklaas', value: '#1', suffix: '', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map(({ icon: Icon, label, value, suffix, color, bg }) => (
              <div key={label} className="bg-[#131C31] rounded-[28px] border border-white/5 p-5 space-y-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{value}{suffix}</p>
                  <p className="text-xs text-white/40 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming activities + next event */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">

            {/* Activity progress list */}
            <div className="bg-[#131C31] rounded-[28px] border border-white/5 p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-white">Komende activiteiten</p>
                <Link
                  href="/activities"
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  Alles <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {dashboardActivities.length === 0 ? (
                <div className="py-10 text-center">
                  <CalendarDays className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/25 text-sm">Binnenkort meer activiteiten</p>
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
                            <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                              {a.title}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" /> {date}
                              </span>
                              {a.location && (
                                <span className="text-xs text-white/30 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{a.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          {pct !== null && (
                            <span className="text-xs text-white/30 shrink-0 mt-0.5">
                              {a.participants_count}/{a.max_participants}
                            </span>
                          )}
                        </div>
                        {pct !== null ? (
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : (
                          <div className="h-px bg-white/5" />
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
                className="relative overflow-hidden rounded-2xl border border-blue-500/20 p-6 flex flex-col justify-between group"
                style={{ background: 'linear-gradient(145deg, #112240 0%, #0d3566 50%, #1a4d8a 100%)' }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(59,130,246,0.2), transparent)' }}
                />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/20 text-blue-300 rounded-full px-3 py-1 text-xs font-bold mb-4">
                    <Clock className="w-3 h-3" />
                    Volgende activiteit
                  </div>
                  <h3 className="text-white font-black text-xl leading-snug group-hover:text-blue-200 transition-colors">
                    {nextEvent.title}
                  </h3>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-blue-200/50 text-sm flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('nl-BE', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </p>
                    {nextEvent.location && (
                      <p className="text-blue-200/50 text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {nextEvent.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative mt-8 flex items-center gap-2 text-blue-300 text-sm font-semibold">
                  Inschrijven
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ) : (
              <div
                className="relative overflow-hidden rounded-2xl border border-blue-500/20 p-6 flex flex-col items-center justify-center text-center"
                style={{ background: 'linear-gradient(145deg, #112240 0%, #0d3566 50%, #1a4d8a 100%)' }}
              >
                <CalendarDays className="w-10 h-10 text-blue-400/30 mb-3" />
                <p className="text-blue-200/40 text-sm">Binnenkort meer activiteiten</p>
                <Link
                  href="/activities"
                  className="mt-4 text-blue-300 text-sm font-semibold hover:underline"
                >
                  Bekijk agenda
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── WAAR WIJ VOOR STAAN ──────────────────────────────── */}
      <section className="py-20 sm:py-28 border-t border-white/5" style={{ backgroundColor: '#0F172A' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="max-w-xl mb-14">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Onze Missie</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Waar wij voor staan
            </h2>
            <p className="text-[#a0a0a0] mt-4 leading-relaxed">
              Vier pijlers die alles wat we doen vormgeven — voor elke jongere, elke dag opnieuw.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PILLARS.map(({ icon: Icon, title, desc, gradient, glow }) => (
              <div
                key={title}
                className="group bg-white/[0.03] rounded-2xl p-6 border border-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg ${glow} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-14 text-center space-y-4">
              <p className="text-white/30 text-sm">Klaar om mee te doen?</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-accent active:scale-95 transition-all shadow-lg shadow-primary/20"
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
