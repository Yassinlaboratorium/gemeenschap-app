import Link from 'next/link'
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Mail, Phone, Download } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

type Player = {
  id: string
  player_name: string
  date_of_birth: string | null
  position: string | null
  jersey_number: number | null
  medical_notes: string | null
  emergency_contact: string
  emergency_phone: string
  parent_name: string
  parent_email: string
  parent_phone: string
  status: string
  registered_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Actief', color: 'text-green-700 bg-green-50' },
  inactive: { label: 'Wachtlijst', color: 'text-orange-700 bg-orange-50' },
  trial: { label: 'Proef', color: 'text-blue-700 bg-blue-50' },
}

export default async function AdminTeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const admin = createAdminClient()

  const [{ data: team }, { data: players }] = await Promise.all([
    admin.from('academy_teams').select('*').eq('id', teamId).single(),
    admin.from('academy_players')
      .select('*')
      .eq('team_id', teamId)
      .order('status', { ascending: true })
      .order('player_name', { ascending: true })
      .returns<Player[]>(),
  ])

  if (!team) notFound()

  const activePlayers = (players ?? []).filter(p => p.status === 'active')
  const waitlist = (players ?? []).filter(p => p.status !== 'active')

  function age(dob: string | null): string {
    if (!dob) return '—'
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / 31557600000) + ' jr'
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/academy" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Terug naar Academy
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
              {team.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {team.age_group && (
                <span className="text-xs font-semibold bg-[#9FB139]/10 text-[#9FB139] px-2 py-0.5 rounded-full">{team.age_group}</span>
              )}
              {team.season && (
                <span className="text-xs text-[#414141]/45">Seizoen {team.season}</span>
              )}
            </div>
          </div>
          <Link
            href={`/admin/academy/attendance?team=${teamId}`}
            className="flex items-center gap-1.5 bg-[#9FB139] text-white font-semibold px-4 py-2 rounded-[30px] text-sm hover:bg-[#8fa030] transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            Aanwezigheid
          </Link>
        </div>
      </div>

      {/* Team info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#1B9193]" />
            <p className="text-xs font-semibold text-[#414141]/50">Spelers</p>
          </div>
          <p className="text-3xl font-extrabold text-[#414141]">{activePlayers.length}<span className="text-base font-normal text-[#414141]/40">/{team.max_players}</span></p>
          <div className="w-full bg-[#F8F8F8] rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, (activePlayers.length / team.max_players) * 100)}%`,
                background: activePlayers.length >= team.max_players ? '#ef4444' : '#1B9193',
              }}
            />
          </div>
        </div>
        {team.training_days && team.training_days.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#1B9193]" />
              <p className="text-xs font-semibold text-[#414141]/50">Training</p>
            </div>
            <p className="font-semibold text-[#414141] text-sm">{team.training_days.join(', ')}</p>
            {team.training_time && <p className="text-xs text-[#414141]/50">{team.training_time}</p>}
          </div>
        )}
        {team.location && (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-[#9FB139]" />
              <p className="text-xs font-semibold text-[#414141]/50">Locatie</p>
            </div>
            <p className="font-semibold text-[#414141] text-sm">{team.location}</p>
          </div>
        )}
      </div>

      {/* Active players */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
            Actieve spelers ({activePlayers.length})
          </h2>
        </div>
        <div className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
          {activePlayers.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#414141]/40">Geen actieve spelers</div>
          ) : (
            <div className="divide-y divide-[#F8F8F8]">
              {activePlayers.map(p => (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {p.jersey_number && (
                          <span className="text-xs font-bold bg-[#1B9193]/10 text-[#1B9193] w-6 h-6 rounded-full flex items-center justify-center">
                            {p.jersey_number}
                          </span>
                        )}
                        <p className="font-bold text-[#414141]">{p.player_name}</p>
                        {p.position && (
                          <span className="text-xs text-[#414141]/45">{p.position}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#414141]/45 mt-0.5">{age(p.date_of_birth)}</p>
                    </div>
                    <div className="text-right text-xs text-[#414141]/50">
                      <div className="flex items-center gap-1 justify-end">
                        <Phone className="w-3 h-3" />
                        {p.parent_phone}
                      </div>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <Mail className="w-3 h-3" />
                        {p.parent_email}
                      </div>
                    </div>
                  </div>
                  {p.medical_notes && (
                    <p className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg mt-2">
                      ⚕️ {p.medical_notes}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-[#414141]/35">
                    Ouder: {p.parent_name} · Nood: {p.emergency_contact} ({p.emergency_phone})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div>
          <h2 className="font-bold text-[#414141] mb-3" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
            Wachtlijst ({waitlist.length})
          </h2>
          <div className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
            <div className="divide-y divide-[#F8F8F8]">
              {waitlist.map(p => {
                const statusInfo = STATUS_LABELS[p.status] ?? STATUS_LABELS.inactive
                return (
                  <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#414141] text-sm">{p.player_name}</p>
                      <p className="text-xs text-[#414141]/45">{p.parent_name} · {p.parent_phone}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
