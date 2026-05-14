import Link from 'next/link'
import {
  LayoutDashboard, LogIn, UserPlus,
  CalendarDays, Palette, Bus, PartyPopper,
  ArrowRight, Users, Trophy, TrendingUp,
  Heart, Globe, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Samen Groeien',
    desc: 'Ontwikkel nieuwe vaardigheden, ontdek je talenten en groei samen met anderen in een veilige omgeving.',
    color: 'bg-primary/10 text-primary',
    bar: 'bg-primary',
  },
  {
    icon: Users,
    title: 'Jongeren Centraal',
    desc: 'Alles wat we doen staat in teken van jongeren — hun stem, hun noden en hun dromen staan voorop.',
    color: 'bg-orange-500/10 text-orange-400',
    bar: 'bg-orange-400',
  },
  {
    icon: Globe,
    title: 'Diversiteit Verbindt',
    desc: 'We verwelkomen iedereen. Onze kracht ligt in de mix van achtergronden, culturen en perspectieven.',
    color: 'bg-blue-500/10 text-blue-400',
    bar: 'bg-blue-400',
  },
  {
    icon: Zap,
    title: 'Avontuurlijk en Inspirerend',
    desc: 'Van uitstappen en evenementen tot creatieve workshops — er is altijd iets nieuws te beleven.',
    color: 'bg-accent/10 text-accent',
    bar: 'bg-accent',
  },
]

const ACTIVITIES = [
  {
    icon: Palette,
    title: 'Workshops',
    desc: 'Schilderen, koken, muziek en meer — leer bij in een gezellige sfeer.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Bus,
    title: 'Uitstappen',
    desc: 'Ontdek nieuwe plekken samen met andere jongeren uit Sint-Niklaas.',
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: PartyPopper,
    title: 'Evenementen',
    desc: 'Feesten, toernooien en speciale momenten die je niet wil missen.',
    color: 'bg-accent/10 text-accent',
  },
]

const STATS = [
  { icon: Users,        value: '200+', label: 'Leden'        },
  { icon: CalendarDays, value: '50+',  label: 'Activiteiten' },
  { icon: Trophy,       value: '10+',  label: 'Jaar actief'  },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Navbar />

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative bg-secondary overflow-hidden">
        {/* Glow blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 90% 10%, rgba(255,107,53,0.18), transparent)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 10% 90%, rgba(255,140,97,0.08), transparent)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 lg:py-40">
          <div className="max-w-3xl space-y-8 animate-fade-in-up">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2.5 border border-white/10 bg-white/5 text-white/70 rounded-full px-5 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Jeugdhuis · Mercatorstraat 24, Sint-Niklaas
            </div>

            {/* Hoofdtitel */}
            <div>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight">
                DE
              </h1>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight" style={{ color: '#ff6b35' }}>
                GEMEEN
              </h1>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight">
                SCHAP
              </h1>
            </div>

            <p className="text-lg sm:text-xl text-white/40 leading-relaxed max-w-xl font-medium italic">
              for a collective future
            </p>

            <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-xl">
              Schrijf je in voor workshops, uitstappen en alles wat we samen doen.
              Voor jongeren van Sint-Niklaas en omgeving.
            </p>

            {/* CTA knoppen */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/activities"
                className="group inline-flex items-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-accent active:scale-95 transition-all shadow-lg shadow-primary/20 text-base"
              >
                Bekijk activiteiten
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-white/8 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/12 active:scale-95 transition-all border border-white/10 text-base"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Mijn dashboard
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white/8 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-white/12 active:scale-95 transition-all border border-white/10 text-base"
                >
                  <UserPlus className="w-4 h-4" />
                  Lid worden
                </Link>
              )}
            </div>
          </div>

          {/* Stats rij */}
          <div className="mt-16 flex flex-wrap gap-6 sm:gap-12">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center border border-white/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">{value}</p>
                  <p className="text-xs text-white/40 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 PIJLERS ────────────────────────────────── */}
      <section className="bg-dark py-20 sm:py-28 border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-14">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Waar we voor staan</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              for a collective future
            </h2>
            <p className="text-[#a0a0a0] mt-4 leading-relaxed">
              Vier pijlers die alles wat we doen vormgeven — voor elke jongere, elke dag opnieuw.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map(({ icon: Icon, title, desc, color, bar }) => (
              <div
                key={title}
                className="group bg-secondary rounded-2xl p-6 border border-[#2a2a2a] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-default"
              >
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                <p className="text-[#a0a0a0] text-sm leading-relaxed">{desc}</p>
                <div className={`h-0.5 ${bar} rounded-full mt-5 w-8 group-hover:w-full transition-all duration-500 ease-out opacity-60`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAT DOEN WE? ────────────────────────────── */}
      <section className="bg-secondary py-20 sm:py-28 border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-14">
            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">Activiteiten</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Voor elk wat wils — elke week opnieuw
            </h2>
            <p className="text-[#a0a0a0] mt-4 leading-relaxed">
              Van creatieve workshops tot spannende uitstappen. Ontmoet mensen, leer bij en geniet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {ACTIVITIES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-dark rounded-2xl p-7 border border-[#2a2a2a] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-white text-xl mb-2">{title}</h3>
                <p className="text-[#a0a0a0] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/activities"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all hover:text-accent"
            >
              Alle activiteiten bekijken <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────── */}
      {!user && (
        <section className="py-16 sm:py-20 relative overflow-hidden bg-dark border-t border-[#2a2a2a]">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(255,107,53,0.12), transparent)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-2">
              <Heart className="w-3.5 h-3.5" />
              Word lid — het is gratis
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Klaar om mee te doen?
            </h2>
            <p className="text-[#a0a0a0] text-lg">
              Maak een gratis account aan en schrijf je in voor activiteiten.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-2xl hover:bg-accent active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                <UserPlus className="w-4 h-4" />
                Account aanmaken
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-white/60 font-semibold px-5 py-3.5 hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Al lid? Inloggen
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
