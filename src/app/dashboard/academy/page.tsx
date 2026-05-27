import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Calendar, MapPin, ArrowRight, Users, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

type PlayerWithTeam = {
  id: string
  player_name: string
  status: string
  registered_at: string
  academy_teams: {
    id: string
    name: string
    age_group: string | null
    training_days: string[] | null
    training_time: string | null
    location: string | null
    price_per_season: number | null
    season: string | null
  } | null
}

export default async function AcademyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: players } = await supabase
    .from('academy_players')
    .select('id, player_name, status, registered_at, academy_teams(id, name, age_group, training_days, training_time, location, price_per_season, season)')
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false })
    .returns<PlayerWithTeam[]>()

  const admin = createAdminClient()
  const upcomingSessions = players && players.length > 0
    ? await admin
        .from('academy_sessions')
        .select('id, title, type, date, start_time, end_time, location, team_id, is_cancelled')
        .in('team_id', players.map(p => p.academy_teams?.id).filter(Boolean) as string[])
        .gte('date', new Date().toISOString().slice(0, 10))
        .eq('is_cancelled', false)
        .order('date', { ascending: true })
        .limit(5)
    : { data: [] }

  const sessionsByTeam = new Map<string, typeof upcomingSessions.data>()
  for (const s of upcomingSessions.data ?? []) {
    const arr = sessionsByTeam.get(s.team_id) ?? []
    arr.push(s)
    sessionsByTeam.set(s.team_id, arr)
  }

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Actief', color: 'text-green-600 bg-green-50' },
    inactive: { label: 'Wachtlijst', color: 'text-orange-600 bg-orange-50' },
    trial: { label: 'Proef', color: 'text-blue-600 bg-blue-50' },
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#1B9193]/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#1B9193]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Mijn Academy
              </h1>
              <p className="text-xs text-[#414141]/50">Jouw inschrijvingen bij De Gemeenschap Kids Academy</p>
            </div>
          </div>

          {!players || players.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D9D9D9] py-16 text-center shadow-sm">
              <Trophy className="w-10 h-10 text-[#414141]/20 mx-auto mb-3" />
              <p className="text-[#414141]/50 font-semibold">Geen inschrijvingen gevonden</p>
              <p className="text-sm text-[#414141]/35 mt-1 mb-6">Schrijf je kind in voor de Kids Academy</p>
              <Link
                href="/academy/register"
                className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm text-sm"
              >
                <Trophy className="w-4 h-4" />
                Inschrijven
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {players.map(player => {
                const team = player.academy_teams
                const statusInfo = STATUS_LABELS[player.status] ?? STATUS_LABELS.active
                const sessions = team ? (sessionsByTeam.get(team.id) ?? []) : []
                return (
                  <div key={player.id} className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-[#F8F8F8]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-[#414141] text-lg">{player.player_name}</p>
                          {team && (
                            <p className="text-sm text-[#414141]/60 font-semibold mt-0.5">{team.name}</p>
                          )}
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Team info */}
                    {team && (
                      <div className="px-6 py-4 space-y-2">
                        {team.training_days && team.training_days.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-[#414141]/60">
                            <Calendar className="w-4 h-4 text-[#1B9193] shrink-0" />
                            {team.training_days.join(', ')}{team.training_time && ` · ${team.training_time}`}
                          </div>
                        )}
                        {team.location && (
                          <div className="flex items-center gap-2 text-sm text-[#414141]/60">
                            <MapPin className="w-4 h-4 text-[#9FB139] shrink-0" />
                            {team.location}
                          </div>
                        )}
                        {team.season && (
                          <div className="flex items-center gap-2 text-sm text-[#414141]/60">
                            <Users className="w-4 h-4 text-[#414141]/30 shrink-0" />
                            Seizoen {team.season}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upcoming sessions */}
                    {sessions.length > 0 && (
                      <div className="px-6 pb-5">
                        <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide mb-3">Volgende sessies</p>
                        <div className="space-y-2">
                          {sessions.slice(0, 3).map(s => {
                            const d = new Date(s.date)
                            return (
                              <div key={s.id} className="flex items-center gap-3 bg-[#F8F8F8] rounded-xl px-4 py-2.5">
                                <div className="text-center min-w-[36px]">
                                  <p className="text-xs font-bold text-[#1B9193]">{d.getDate()}</p>
                                  <p className="text-[10px] text-[#414141]/40">{d.toLocaleDateString('nl-BE', { month: 'short' })}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#414141] truncate">
                                    {s.title ?? (s.type === 'training' ? 'Training' : s.type === 'match' ? 'Wedstrijd' : s.type)}
                                  </p>
                                  {s.start_time && (
                                    <p className="text-xs text-[#414141]/45 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {s.start_time.slice(0, 5)}{s.end_time && ` – ${s.end_time.slice(0, 5)}`}
                                    </p>
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  s.type === 'match' ? 'bg-[#9FB139]/10 text-[#9FB139]' :
                                  s.type === 'tournament' ? 'bg-purple-50 text-purple-600' :
                                  'bg-[#1B9193]/10 text-[#1B9193]'
                                }`}>
                                  {s.type === 'training' ? 'Training' : s.type === 'match' ? 'Match' : s.type === 'tournament' ? 'Tornooi' : 'Event'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="px-6 pb-4">
                      <p className="text-xs text-[#414141]/35">
                        Ingeschreven op {new Date(player.registered_at).toLocaleDateString('nl-BE')}
                      </p>
                    </div>
                  </div>
                )
              })}

              <div className="text-center pt-2">
                <Link
                  href="/academy/register"
                  className="inline-flex items-center gap-2 bg-[#1B9193] text-white font-bold px-6 py-2.5 rounded-[30px] hover:bg-[#0f6163] transition-all shadow-sm text-sm"
                >
                  <Trophy className="w-4 h-4" />
                  Nog een kind inschrijven
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
