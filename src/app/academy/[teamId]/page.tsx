import Link from 'next/link'
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Star, ArrowRight, Euro } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { notFound } from 'next/navigation'

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const admin = createAdminClient()

  const [{ data: team }, { count: playerCount }] = await Promise.all([
    admin.from('academy_teams').select('*').eq('id', teamId).single(),
    admin.from('academy_players').select('*', { count: 'exact', head: true }).eq('team_id', teamId).eq('status', 'active'),
  ])

  if (!team) notFound()

  const spotsLeft = team.max_players - (playerCount ?? 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/academy" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Terug naar Academy
          </Link>

          {/* Hero card */}
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm" style={{ background: 'linear-gradient(135deg, #1B9193 0%, #0f6163 100%)' }}>
            <div className="px-8 py-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {team.age_group && (
                    <span className="inline-block text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full mb-3">
                      {team.age_group}
                    </span>
                  )}
                  <h1 className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                    {team.name}
                  </h1>
                  {team.description && (
                    <p className="text-white/70 text-sm max-w-md">{team.description}</p>
                  )}
                </div>
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center border border-white/25">
                  <Trophy className="w-7 h-7 text-white/70" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Details */}
            <div className="bg-white rounded-2xl border border-[#D9D9D9] p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-[#414141] text-sm" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Trainingsinfo</h2>
              {team.training_days && team.training_days.length > 0 && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[#1B9193] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#414141]">{team.training_days.join(', ')}</p>
                    {team.training_time && <p className="text-xs text-[#414141]/50">{team.training_time}</p>}
                  </div>
                </div>
              )}
              {team.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#9FB139] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#414141]/70">{team.location}</p>
                </div>
              )}
              {team.season && (
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#414141]/70">Seizoen {team.season}</p>
                </div>
              )}
              {team.price_per_season != null && (
                <div className="flex items-start gap-3">
                  <Euro className="w-4 h-4 text-[#9FB139] shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-[#414141]">€{Number(team.price_per_season).toFixed(2)} / seizoen</p>
                </div>
              )}
            </div>

            {/* Plaatsen */}
            <div className="bg-white rounded-2xl border border-[#D9D9D9] p-6 shadow-sm">
              <h2 className="font-bold text-[#414141] text-sm mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Beschikbaarheid</h2>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-[#1B9193]" />
                <div>
                  <p className="text-2xl font-extrabold text-[#414141]">{playerCount ?? 0}<span className="text-base font-normal text-[#414141]/40">/{team.max_players}</span></p>
                  <p className="text-xs text-[#414141]/50">spelers ingeschreven</p>
                </div>
              </div>
              <div className="w-full bg-[#F8F8F8] rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((playerCount ?? 0) / team.max_players) * 100)}%`,
                    background: spotsLeft <= 2 ? '#ef4444' : spotsLeft <= 5 ? '#f59e0b' : '#1B9193',
                  }}
                />
              </div>
              {spotsLeft > 0 ? (
                <p className="text-xs font-semibold text-green-600">{spotsLeft} plekken beschikbaar</p>
              ) : (
                <p className="text-xs font-semibold text-red-500">Team is vol</p>
              )}
            </div>
          </div>

          {/* CTA */}
          {spotsLeft > 0 ? (
            <Link
              href={`/academy/register?team=${teamId}`}
              className="w-full flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold py-3.5 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm"
            >
              <Trophy className="w-5 h-5" />
              Schrijf mijn kind in voor dit team
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/academy/register"
              className="w-full flex items-center justify-center gap-2 bg-[#414141]/10 text-[#414141] font-bold py-3.5 rounded-[30px] transition-all"
            >
              Wachtlijst — Schrijf toch in
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
