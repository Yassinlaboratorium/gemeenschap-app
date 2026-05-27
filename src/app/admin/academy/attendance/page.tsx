'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Check, X, Clock, AlertCircle, Loader2, Plus, Trophy, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Team = { id: string; name: string; age_group: string | null }
type Session = {
  id: string
  title: string | null
  type: string
  date: string
  start_time: string
  end_time: string | null
  location: string | null
  is_cancelled: boolean
}
type Player = { id: string; player_name: string; jersey_number: number | null; position: string | null }
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
type AttendanceRecord = Record<string, AttendanceStatus>

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  present: { label: 'Aanwezig', icon: <Check className="w-5 h-5" />, color: 'text-green-700', bg: 'bg-green-500' },
  late: { label: 'Te laat', icon: <Clock className="w-5 h-5" />, color: 'text-amber-700', bg: 'bg-amber-500' },
  excused: { label: 'Gewettigd', icon: <AlertCircle className="w-5 h-5" />, color: 'text-blue-700', bg: 'bg-blue-500' },
  absent: { label: 'Afwezig', icon: <X className="w-5 h-5" />, color: 'text-red-700', bg: 'bg-red-500' },
}
const STATUS_CYCLE: AttendanceStatus[] = ['present', 'late', 'excused', 'absent']

function nextStatus(current: AttendanceStatus | undefined): AttendanceStatus {
  const idx = current ? STATUS_CYCLE.indexOf(current) : -1
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

export default function AttendancePage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [attendance, setAttendance] = useState<AttendanceRecord>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)
  const [newSession, setNewSession] = useState({ type: 'training', date: new Date().toISOString().slice(0, 10), start_time: '18:00', end_time: '', title: '' })
  const [addingSession, setAddingSession] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const teamParam = urlParams.get('team')

    supabase.from('academy_teams').select('id, name, age_group').eq('is_active', true).order('age_group').then(({ data }) => {
      setTeams(data ?? [])
      setLoadingTeams(false)
      if (teamParam && data?.find(t => t.id === teamParam)) {
        setSelectedTeam(teamParam)
      } else if (data && data.length === 1) {
        setSelectedTeam(data[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedTeam) { setSessions([]); setSelectedSession(''); return }
    setLoadingSessions(true)
    setSelectedSession('')
    setSessions([])
    supabase.from('academy_sessions')
      .select('id, title, type, date, start_time, end_time, location, is_cancelled')
      .eq('team_id', selectedTeam)
      .eq('is_cancelled', false)
      .order('date', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions(data ?? [])
        setLoadingSessions(false)
        if (data && data.length > 0) setSelectedSession(data[0].id)
      })
  }, [selectedTeam])

  useEffect(() => {
    if (!selectedTeam) { setPlayers([]); return }
    setLoadingPlayers(true)
    supabase.from('academy_players')
      .select('id, player_name, jersey_number, position')
      .eq('team_id', selectedTeam)
      .eq('status', 'active')
      .order('player_name')
      .then(({ data }) => {
        setPlayers(data ?? [])
        setLoadingPlayers(false)
      })
  }, [selectedTeam])

  useEffect(() => {
    if (!selectedSession) { setAttendance({}); return }
    supabase.from('academy_attendance')
      .select('player_id, status')
      .eq('session_id', selectedSession)
      .then(({ data }) => {
        const map: AttendanceRecord = {}
        for (const r of data ?? []) map[r.player_id] = r.status as AttendanceStatus
        setAttendance(map)
      })
  }, [selectedSession])

  async function toggleAttendance(playerId: string) {
    if (!selectedSession) return
    const current = attendance[playerId]
    const next = nextStatus(current)

    setAttendance(prev => ({ ...prev, [playerId]: next }))
    setSaving(prev => ({ ...prev, [playerId]: true }))
    setSaved(prev => ({ ...prev, [playerId]: false }))

    const { error } = await supabase.from('academy_attendance').upsert({
      session_id: selectedSession,
      player_id: playerId,
      status: next,
    }, { onConflict: 'session_id,player_id' })

    setSaving(prev => ({ ...prev, [playerId]: false }))
    if (!error) {
      setSaved(prev => ({ ...prev, [playerId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [playerId]: false })), 1500)
    }
  }

  async function addSession() {
    if (!selectedTeam || !newSession.date || !newSession.start_time) return
    setAddingSession(true)
    const { data, error } = await supabase.from('academy_sessions').insert({
      team_id: selectedTeam,
      type: newSession.type,
      date: newSession.date,
      start_time: newSession.start_time,
      end_time: newSession.end_time || null,
      title: newSession.title.trim() || null,
    }).select('id, title, type, date, start_time, end_time, location, is_cancelled').single()

    if (!error && data) {
      setSessions(prev => [data, ...prev])
      setSelectedSession(data.id)
      setShowAddSession(false)
      setNewSession({ type: 'training', date: new Date().toISOString().slice(0, 10), start_time: '18:00', end_time: '', title: '' })
    }
    setAddingSession(false)
  }

  const session = sessions.find(s => s.id === selectedSession)
  const presentCount = Object.values(attendance).filter(v => v === 'present' || v === 'late').length
  const totalCount = players.length

  const INPUT = 'w-full px-3 py-2 rounded-xl border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B9193]/30 focus:border-[#1B9193]'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/academy" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Academy
        </Link>
        <h1 className="text-xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
          Aanwezigheid registreren
        </h1>
      </div>

      {/* Team select */}
      <div className="bg-white rounded-2xl border border-[#D9D9D9] p-4 shadow-sm">
        <label className="block text-xs font-bold text-[#414141]/50 mb-2">Team</label>
        {loadingTeams ? (
          <div className="flex items-center gap-2 text-sm text-[#414141]/50"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t.id)}
                className={`px-4 py-2 rounded-[30px] text-sm font-semibold transition-all ${
                  selectedTeam === t.id ? 'bg-[#1B9193] text-white shadow-sm' : 'bg-[#F8F8F8] border border-[#D9D9D9] text-[#414141] hover:border-[#1B9193]/40'
                }`}
              >
                {t.name}
                {t.age_group && <span className="ml-1 opacity-60 text-xs">({t.age_group})</span>}
              </button>
            ))}
            {teams.length === 0 && <p className="text-sm text-[#414141]/40">Geen actieve teams</p>}
          </div>
        )}
      </div>

      {selectedTeam && (
        <>
          {/* Session select */}
          <div className="bg-white rounded-2xl border border-[#D9D9D9] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-[#414141]/50">Sessie</label>
              <button
                onClick={() => setShowAddSession(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-[#1B9193] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Nieuwe sessie
              </button>
            </div>

            {showAddSession && (
              <div className="bg-[#F8F8F8] rounded-xl p-4 mb-4 space-y-3 border border-[#D9D9D9]">
                <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide">Sessie aanmaken</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#414141]/50 mb-1">Type</label>
                    <select className={INPUT} value={newSession.type} onChange={e => setNewSession(p => ({ ...p, type: e.target.value }))}>
                      <option value="training">Training</option>
                      <option value="match">Wedstrijd</option>
                      <option value="tournament">Tornooi</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#414141]/50 mb-1">Datum</label>
                    <input type="date" className={INPUT} value={newSession.date} onChange={e => setNewSession(p => ({ ...p, date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#414141]/50 mb-1">Starttijd</label>
                    <input type="time" className={INPUT} value={newSession.start_time} onChange={e => setNewSession(p => ({ ...p, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-[#414141]/50 mb-1">Eindtijd (opt.)</label>
                    <input type="time" className={INPUT} value={newSession.end_time} onChange={e => setNewSession(p => ({ ...p, end_time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#414141]/50 mb-1">Titel (optioneel)</label>
                  <input type="text" className={INPUT} value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))} placeholder="bv. Training 1, Wedstrijd vs Club X..." />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addSession}
                    disabled={addingSession}
                    className="flex items-center gap-1.5 bg-[#1B9193] text-white font-semibold px-4 py-2 rounded-[30px] text-sm hover:bg-[#0f6163] transition-all disabled:opacity-60"
                  >
                    {addingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Aanmaken
                  </button>
                  <button onClick={() => setShowAddSession(false)} className="px-4 py-2 rounded-[30px] border border-[#D9D9D9] text-sm text-[#414141]/60 hover:border-[#414141]/30 transition-all">
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {loadingSessions ? (
              <div className="flex items-center gap-2 text-sm text-[#414141]/50"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-[#414141]/40">Geen sessies gevonden. Maak er één aan.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sessions.map(s => {
                  const d = new Date(s.date)
                  const isSelected = selectedSession === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSession(s.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                        isSelected ? 'bg-[#9FB139] text-white shadow-sm' : 'bg-[#F8F8F8] border border-[#D9D9D9] text-[#414141] hover:border-[#9FB139]/40'
                      }`}
                    >
                      <p>{s.title ?? (s.type === 'training' ? 'Training' : s.type === 'match' ? 'Wedstrijd' : s.type)}</p>
                      <p className={isSelected ? 'opacity-75' : 'text-[#414141]/45'}>{d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })} · {s.start_time.slice(0, 5)}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attendance */}
          {selectedSession && (
            <div className="bg-white rounded-2xl border border-[#D9D9D9] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F8F8F8] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#414141] text-sm">
                    {session?.title ?? (session?.type === 'training' ? 'Training' : session?.type === 'match' ? 'Wedstrijd' : session?.type)}
                  </p>
                  {session && (
                    <p className="text-xs text-[#414141]/45">
                      {new Date(session.date).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })} · {session.start_time.slice(0, 5)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[#1B9193]">{presentCount}<span className="text-base font-normal text-[#414141]/40">/{totalCount}</span></p>
                  <p className="text-xs text-[#414141]/45">aanwezig</p>
                </div>
              </div>

              {loadingPlayers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-[#1B9193] animate-spin" />
                </div>
              ) : players.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#414141]/40">
                  <Trophy className="w-8 h-8 text-[#414141]/20 mx-auto mb-2" />
                  Geen actieve spelers in dit team
                </div>
              ) : (
                <div className="divide-y divide-[#F8F8F8]">
                  {players.map(player => {
                    const status = attendance[player.id]
                    const config = status ? STATUS_CONFIG[status] : null
                    const isSaving = saving[player.id]
                    const isJustSaved = saved[player.id]

                    return (
                      <div
                        key={player.id}
                        onClick={() => !isSaving && toggleAttendance(player.id)}
                        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8F8F8] active:bg-[#F0F0F0] transition-colors select-none"
                      >
                        {/* Status button */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isSaving ? 'bg-[#D9D9D9]' :
                          config ? `${config.bg} text-white` :
                          'bg-[#F8F8F8] border-2 border-[#D9D9D9] border-dashed'
                        }`}>
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 text-[#414141]/40 animate-spin" />
                          ) : config ? (
                            <span className="text-white">{config.icon}</span>
                          ) : (
                            <span className="text-[#414141]/25 text-xs font-bold">?</span>
                          )}
                        </div>

                        {/* Player info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="text-xs font-bold text-[#1B9193]/70">#{player.jersey_number}</span>
                            )}
                            <p className="font-semibold text-[#414141] truncate">{player.player_name}</p>
                          </div>
                          {player.position && (
                            <p className="text-xs text-[#414141]/40">{player.position}</p>
                          )}
                        </div>

                        {/* Status label */}
                        <div className="shrink-0 text-right">
                          {isJustSaved ? (
                            <span className="text-xs text-green-600 font-semibold">✓ Opgeslagen</span>
                          ) : config ? (
                            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                          ) : (
                            <span className="text-xs text-[#414141]/30">Tik om in te stellen</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="px-5 py-4 border-t border-[#F8F8F8] flex flex-wrap gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${cfg.bg}`} />
                    <span className="text-xs text-[#414141]/50">{cfg.label}</span>
                  </div>
                ))}
                <span className="text-xs text-[#414141]/35 ml-auto">Tik op een speler om status te wisselen</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
