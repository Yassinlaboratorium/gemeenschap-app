import Link from 'next/link'
import { ArrowLeft, Users, CheckCircle2, XCircle, Clock, AlertCircle, Trophy, Calendar } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

type TeamStat = {
  id: string
  name: string
  age_group: string | null
  sessionCount: number
  playerCount: number
  presentCount: number
  avgAttendance: number
}

export default async function AttendanceOverviewPage() {
  const admin = createAdminClient()

  const { data: teams } = await admin
    .from('academy_teams')
    .select('id, name, age_group')
    .eq('is_active', true)
    .order('age_group')

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-10 h-10 text-[#414141]/20 mx-auto mb-3" />
        <p className="text-[#414141]/40">Geen teams gevonden</p>
        <Link href="/admin/academy" className="text-sm text-[#1B9193] hover:underline mt-2 inline-block">← Terug naar Academy</Link>
      </div>
    )
  }

  const teamStats: TeamStat[] = await Promise.all(
    teams.map(async team => {
      const [{ count: sessionCount }, { data: attendance }, { count: playerCount }] = await Promise.all([
        admin.from('academy_sessions').select('*', { count: 'exact', head: true }).eq('team_id', team.id).eq('is_cancelled', false),
        admin.from('academy_attendance')
          .select('status, academy_sessions!inner(team_id)')
          .eq('academy_sessions.team_id', team.id),
        admin.from('academy_players').select('*', { count: 'exact', head: true }).eq('team_id', team.id).eq('status', 'active'),
      ])

      const presentCount = (attendance ?? []).filter(a => a.status === 'present' || a.status === 'late').length
      const totalAttendance = attendance?.length ?? 0
      const avgAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

      return {
        id: team.id,
        name: team.name,
        age_group: team.age_group,
        sessionCount: sessionCount ?? 0,
        playerCount: playerCount ?? 0,
        presentCount,
        avgAttendance,
      }
    })
  )

  const { data: recentSessions } = await admin
    .from('academy_sessions')
    .select('id, title, type, date, start_time, team_id, academy_teams(name)')
    .eq('is_cancelled', false)
    .order('date', { ascending: false })
    .limit(10)

  const sessionAttendanceData = recentSessions
    ? await Promise.all(
        recentSessions.map(async s => {
          const [{ count: present }, { count: absent }, { count: total }] = await Promise.all([
            admin.from('academy_attendance').select('*', { count: 'exact', head: true }).eq('session_id', s.id).in('status', ['present', 'late']),
            admin.from('academy_attendance').select('*', { count: 'exact', head: true }).eq('session_id', s.id).in('status', ['absent', 'excused']),
            admin.from('academy_players').select('*', { count: 'exact', head: true }).eq('team_id', s.team_id).eq('status', 'active'),
          ])
          return { ...s, present: present ?? 0, absent: absent ?? 0, total: total ?? 0 }
        })
      )
    : []

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/academy" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Terug naar Academy
        </Link>
        <h1 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
          Aanwezigheidsoverzicht
        </h1>
        <p className="text-sm text-[#414141]/50 mt-0.5">Statistieken per team en per sessie</p>
      </div>

      {/* Per team */}
      <div>
        <h2 className="font-bold text-[#414141] mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Per team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teamStats.map(team => (
            <div key={team.id} className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-[#414141]">{team.name}</p>
                  {team.age_group && (
                    <span className="text-xs font-semibold bg-[#9FB139]/10 text-[#9FB139] px-2 py-0.5 rounded-full">{team.age_group}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold" style={{ color: team.avgAttendance >= 80 ? '#1B9193' : team.avgAttendance >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {team.avgAttendance}%
                  </p>
                  <p className="text-xs text-[#414141]/40">aanwezigheid</p>
                </div>
              </div>
              <div className="w-full bg-[#F8F8F8] rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${team.avgAttendance}%`,
                    background: team.avgAttendance >= 80 ? '#1B9193' : team.avgAttendance >= 60 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[#414141]/50">
                  <Calendar className="w-3.5 h-3.5" />
                  {team.sessionCount} sessies
                </div>
                <div className="flex items-center gap-1.5 text-[#414141]/50">
                  <Users className="w-3.5 h-3.5" />
                  {team.playerCount} spelers
                </div>
              </div>
              <Link
                href={`/admin/academy/attendance?team=${team.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1B9193] hover:underline"
              >
                Aanwezigheid registreren →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="font-bold text-[#414141] mb-4" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Recente sessies</h2>
        <div className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
          {sessionAttendanceData.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#414141]/40">Geen sessies gevonden</div>
          ) : (
            <div className="divide-y divide-[#F8F8F8]">
              {sessionAttendanceData.map(s => {
                const pct = s.total > 0 ? Math.round(((s.present) / s.total) * 100) : 0
                const d = new Date(s.date)
                return (
                  <div key={s.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <p className="text-sm font-bold text-[#414141]">{d.getDate()}</p>
                      <p className="text-xs text-[#414141]/40">{d.toLocaleDateString('nl-BE', { month: 'short' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#414141] text-sm truncate">
                        {s.title ?? (s.type === 'training' ? 'Training' : s.type === 'match' ? 'Wedstrijd' : s.type)}
                      </p>
                      <p className="text-xs text-[#414141]/45">{(s.academy_teams as unknown as { name: string } | null)?.name} · {s.start_time.slice(0, 5)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#414141]">{s.present}/{s.total}</p>
                      <p className="text-xs" style={{ color: pct >= 80 ? '#1B9193' : pct >= 60 ? '#f59e0b' : '#ef4444' }}>{pct}%</p>
                    </div>
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
