import Link from 'next/link'
import { Trophy, Users, CalendarDays, BarChart2, ArrowRight, Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminAcademyPage() {
  const admin = createAdminClient()

  const [
    { data: teams },
    { count: totalPlayers },
    { count: activePlayers },
    { data: recentPlayers },
  ] = await Promise.all([
    admin.from('academy_teams').select('id, name, age_group, max_players, is_active').order('age_group'),
    admin.from('academy_players').select('*', { count: 'exact', head: true }),
    admin.from('academy_players').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('academy_players')
      .select('id, player_name, status, registered_at, team_id, academy_teams(name)')
      .order('registered_at', { ascending: false })
      .limit(10),
  ])

  const teamPlayerCounts = teams
    ? await Promise.all(
        teams.map(t =>
          admin.from('academy_players').select('*', { count: 'exact', head: true }).eq('team_id', t.id).eq('status', 'active')
        )
      )
    : []

  const teamsWithCounts = (teams ?? []).map((t, i) => ({
    ...t,
    playerCount: teamPlayerCounts[i]?.count ?? 0,
  }))

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'Actief', color: 'text-green-700 bg-green-50' },
    inactive: { label: 'Wachtlijst', color: 'text-orange-700 bg-orange-50' },
    trial: { label: 'Proef', color: 'text-blue-700 bg-blue-50' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
            Kids Academy
          </h1>
          <p className="text-sm text-[#414141]/50 mt-0.5">Overzicht en beheer van de jeugdacademy</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/academy/attendance"
            className="flex items-center gap-1.5 bg-[#9FB139] text-white font-semibold px-4 py-2 rounded-[30px] text-sm hover:bg-[#8fa030] transition-all shadow-sm"
          >
            <CalendarDays className="w-4 h-4" />
            Aanwezigheid
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Teams', value: teams?.length ?? 0, icon: Trophy, color: '#1B9193' },
          { label: 'Totaal spelers', value: totalPlayers ?? 0, icon: Users, color: '#9FB139' },
          { label: 'Actieve spelers', value: activePlayers ?? 0, icon: Users, color: '#1B9193' },
          { label: 'Wachtlijst', value: (totalPlayers ?? 0) - (activePlayers ?? 0), icon: BarChart2, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <p className="text-xs font-semibold text-[#414141]/50">{stat.label}</p>
            </div>
            <p className="text-3xl font-extrabold text-[#414141]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Teams */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Teams</h2>
          <Link href="/admin/academy/attendance-overview" className="text-xs text-[#1B9193] font-semibold hover:underline flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" />
            Aanwezigheidsoverzicht
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamsWithCounts.map(team => {
            const pct = Math.min(100, (team.playerCount / team.max_players) * 100)
            const spotsLeft = team.max_players - team.playerCount
            return (
              <Link
                key={team.id}
                href={`/admin/academy/teams/${team.id}`}
                className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm hover:border-[#1B9193]/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#414141]">{team.name}</p>
                    {team.age_group && (
                      <span className="text-xs font-semibold bg-[#9FB139]/10 text-[#9FB139] px-2 py-0.5 rounded-full">{team.age_group}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!team.is_active && (
                      <span className="text-xs font-semibold bg-[#414141]/10 text-[#414141]/50 px-2 py-0.5 rounded-full">Inactief</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[#414141]/30 group-hover:text-[#1B9193] transition-colors" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Users className="w-4 h-4 text-[#1B9193]" />
                  <span className="font-semibold text-[#414141]">{team.playerCount}</span>
                  <span className="text-[#414141]/40">/ {team.max_players} spelers</span>
                </div>
                <div className="w-full bg-[#F8F8F8] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: spotsLeft <= 2 ? '#ef4444' : spotsLeft <= 5 ? '#f59e0b' : '#1B9193',
                    }}
                  />
                </div>
                <p className="text-xs text-[#414141]/45 mt-1">
                  {spotsLeft > 0 ? `${spotsLeft} plaatsen vrij` : 'Team is vol'}
                </p>
              </Link>
            )
          })}
          {teamsWithCounts.length === 0 && (
            <div className="col-span-2 bg-white rounded-2xl border border-[#D9D9D9] py-12 text-center shadow-sm">
              <Trophy className="w-8 h-8 text-[#414141]/20 mx-auto mb-2" />
              <p className="text-sm text-[#414141]/40">Geen teams gevonden</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent registrations */}
      <div>
        <h2 className="font-bold text-[#414141] mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Recente inschrijvingen</h2>
        <div className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
          {!recentPlayers || recentPlayers.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#414141]/40">Geen inschrijvingen</div>
          ) : (
            <div className="divide-y divide-[#F8F8F8]">
              {recentPlayers.map((p) => {
                const statusInfo = STATUS_LABELS[p.status as string] ?? STATUS_LABELS.active
                const teamName = (p.academy_teams as unknown as { name: string } | null)?.name ?? '—'
                return (
                  <div key={p.id as string} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#414141] text-sm">{p.player_name as string}</p>
                      <p className="text-xs text-[#414141]/45">{teamName} · {new Date(p.registered_at as string).toLocaleDateString('nl-BE')}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
