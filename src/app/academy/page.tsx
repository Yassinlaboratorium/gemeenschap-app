import Link from 'next/link'
import { Trophy, Calendar, MapPin, Users, Star, ArrowRight, Shield, Heart } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type AcademyTeam = {
  id: string
  name: string
  description: string | null
  age_group: string | null
  max_players: number
  training_days: string[] | null
  training_time: string | null
  location: string | null
  season: string | null
  price_per_season: number | null
}

export default async function AcademyPage() {
  const admin = createAdminClient()
  const { data: teams } = await admin
    .from('academy_teams')
    .select('id, name, description, age_group, max_players, training_days, training_time, location, season, price_per_season')
    .eq('is_active', true)
    .order('age_group', { ascending: true })
    .returns<AcademyTeam[]>()

  const { count: totalPlayers } = await admin
    .from('academy_players')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const PERKS = [
    { icon: Shield, title: 'Professionele begeleiding', desc: 'Ervaren coaches begeleiden elk kind individueel' },
    { icon: Calendar, title: 'Wekelijkse trainingen', desc: 'Vaste trainingsdag voor structuur en progressie' },
    { icon: Trophy, title: 'Wedstrijden & toernooien', desc: 'Competitie-ervaring op een veilige manier' },
    { icon: Heart, title: 'Plezier & teambuilding', desc: 'Vriendschappen voor het leven binnen het team' },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F8F8]">

        {/* Hero */}
        <section
          className="relative overflow-hidden py-20 sm:py-28 px-4"
          style={{ background: 'linear-gradient(135deg, #1B9193 0%, #157a7c 60%, #0f6163 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white, transparent 50%)' }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Trophy className="w-4 h-4" />
              Kids Academy — De Gemeenschap
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
              ⚽ Jeugd Futsal<br />bij De Gemeenschap
            </h1>
            <p className="text-white/75 text-lg max-w-xl mx-auto mb-8">
              Professionele futsalbegeleiding voor kinderen van Sint-Niklaas en omgeving. Techniek, plezier, en teamgeest — elke week op het veld.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/academy/register"
                className="inline-flex items-center gap-2 bg-white text-[#1B9193] font-bold px-6 py-3 rounded-[30px] hover:bg-[#F8F8F8] transition-all shadow-sm"
              >
                Schrijf je kind in
                <ArrowRight className="w-4 h-4" />
              </Link>
              {(teams?.length ?? 0) > 0 && (
                <a
                  href="#teams"
                  className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-semibold px-6 py-3 rounded-[30px] hover:bg-white/20 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Bekijk teams
                </a>
              )}
            </div>
            {(totalPlayers ?? 0) > 0 && (
              <p className="text-white/50 text-sm mt-6">{totalPlayers} actieve spelers dit seizoen</p>
            )}
          </div>
        </section>

        {/* Voordelen */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#414141' }}>
              Waarom Kids Academy?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-[#D9D9D9] p-6 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#1B9193]/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#1B9193]" />
                </div>
                <h3 className="font-bold text-[#414141] text-sm mb-1" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{title}</h3>
                <p className="text-xs text-[#414141]/50">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Teams */}
        <section id="teams" className="max-w-5xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-2 mb-8">
            <h2 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#414141' }}>
              Onze teams
            </h2>
            <div className="flex-1 h-px bg-[#D9D9D9]" />
          </div>

          {!teams || teams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D9D9D9] py-16 text-center shadow-sm">
              <Trophy className="w-10 h-10 text-[#414141]/20 mx-auto mb-3" />
              <p className="text-[#414141]/45 font-medium">Teams worden binnenkort bekendgemaakt</p>
              <p className="text-sm text-[#414141]/30 mt-1">Schrijf je alvast in — we contacteren je zodra teams bekend zijn.</p>
              <Link
                href="/academy/register"
                className="inline-flex items-center gap-2 mt-5 bg-[#9FB139] text-white font-semibold px-5 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all text-sm shadow-sm"
              >
                Voorinschrijving
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <Link
                  key={team.id}
                  href={`/academy/${team.id}`}
                  className="bg-white rounded-2xl border border-[#D9D9D9] p-6 hover:border-[#1B9193]/40 hover:shadow-md transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1B9193]/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-[#1B9193]" />
                    </div>
                    {team.age_group && (
                      <span className="text-xs font-semibold bg-[#9FB139]/10 text-[#9FB139] px-2.5 py-1 rounded-full">
                        {team.age_group}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[#414141] mb-1" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>{team.name}</h3>
                  {team.description && (
                    <p className="text-xs text-[#414141]/50 mb-3 line-clamp-2">{team.description}</p>
                  )}
                  <div className="space-y-1.5">
                    {team.training_days && team.training_days.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#414141]/50">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {team.training_days.join(', ')}{team.training_time && ` · ${team.training_time}`}
                      </div>
                    )}
                    {team.location && (
                      <div className="flex items-center gap-1.5 text-xs text-[#414141]/50">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {team.location}
                      </div>
                    )}
                    {team.price_per_season != null && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#414141]">
                        <Star className="w-3.5 h-3.5 text-[#9FB139] shrink-0" />
                        €{team.price_per_season.toFixed(0)} / seizoen
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#1B9193] group-hover:gap-2 transition-all">
                    Meer info <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/academy/register"
              className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-bold px-8 py-3 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm text-sm"
            >
              <Trophy className="w-4 h-4" />
              Schrijf je kind in voor de Academy
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
