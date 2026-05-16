'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Clock, CreditCard, Loader2,
  CheckCircle2, AlertCircle, Users, Baby, MapPin,
} from 'lucide-react'
import type { Activity, ActivitySessionWithCount, Child } from '@/types/database'

interface Props {
  activity: Activity
  sessions: ActivitySessionWithCount[]
  children: Child[]
  isLoggedIn: boolean
  accountType: string | null
}

type ParentSelection = Record<string, Set<string>>

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (
    now.getMonth() - birth.getMonth() < 0 ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--
  return `${age} jaar`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
}

function formatPrice(cents: number) {
  if (cents === 0) return 'Gratis'
  return `€${(cents / 100).toFixed(2)}`
}

function isFull(s: ActivitySessionWithCount) {
  return s.max_participants !== null && s.participants_count >= s.max_participants
}

function spotsLeft(s: ActivitySessionWithCount): string | null {
  if (s.max_participants === null) return null
  if (isFull(s)) return 'Vol'
  const left = s.max_participants - s.participants_count
  return `${left} plek${left !== 1 ? 'ken' : ''} vrij`
}

function SessionRow({
  session,
  checked,
  disabled,
  onChange,
}: {
  session: ActivitySessionWithCount
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  const timeStr = session.start_time
    ? session.end_time
      ? `${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`
      : session.start_time.slice(0, 5)
    : null
  const full = isFull(session)
  const spots = spotsLeft(session)

  return (
    <label
      className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : checked
          ? 'bg-[#9FB139]/5 cursor-pointer'
          : 'hover:bg-[#F8F8F8] cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 accent-[#9FB139] shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${checked ? 'text-[#414141]' : 'text-[#414141]/60'}`}>
          {session.title ?? formatDate(session.session_date)}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#414141]/45 mt-0.5">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatDate(session.session_date)}
          </span>
          {timeStr && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeStr}
            </span>
          )}
          {session.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {session.location}
            </span>
          )}
          {spots && (
            <span className={full ? 'text-red-500 font-semibold' : ''}>
              {spots}
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-bold shrink-0 ${checked ? 'text-[#9FB139]' : 'text-[#414141]/40'}`}>
        {formatPrice(session.price_cents)}
      </span>
    </label>
  )
}

// ── Niet ingelogd ────────────────────────────────────────────
function NotLoggedIn({ sessions }: { sessions: ActivitySessionWithCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 text-center space-y-4 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#1B9193]/8 flex items-center justify-center mx-auto">
        <Users className="w-7 h-7 text-[#1B9193]/40" />
      </div>
      <h2 className="text-xl font-extrabold text-[#1B9193]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Sessies bekijken</h2>
      <div className="space-y-3 text-left max-w-sm mx-auto">
        {sessions.map(s => (
          <div key={s.id} className="flex items-center justify-between bg-[#F8F8F8] rounded-xl border border-[#D9D9D9] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#414141]">{s.title ?? formatDate(s.session_date)}</p>
              <p className="text-xs text-[#414141]/45">
                {formatDate(s.session_date)}
                {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                {s.location && ` · ${s.location}`}
              </p>
            </div>
            <span className="text-sm font-bold text-[#9FB139]">{formatPrice(s.price_cents)}</span>
          </div>
        ))}
      </div>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-semibold px-6 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all text-sm shadow-sm"
      >
        Log in om in te schrijven
      </Link>
    </div>
  )
}

// ── Totaal + betaalknop (gedeeld) ────────────────────────────
function CheckoutBar({
  total,
  hasSelection,
  loading,
  error,
  onSubmit,
  children: summary,
}: {
  total: number
  hasSelection: boolean
  loading: boolean
  error: string | null
  onSubmit: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] p-5 space-y-4 shadow-sm">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {summary}
      <div className="flex items-center justify-between border-t border-[#D9D9D9] pt-3">
        <div>
          <p className="text-sm text-[#414141]/45">Totaal</p>
          <p className="text-2xl font-extrabold text-[#414141]">
            {total === 0 ? 'Gratis' : `€${(total / 100).toFixed(2)}`}
          </p>
        </div>
        <button
          onClick={onSubmit}
          disabled={!hasSelection || loading}
          className="flex items-center gap-2 bg-[#9FB139] text-white font-semibold px-5 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : total === 0 ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {loading
            ? 'Bezig…'
            : total === 0
            ? 'Inschrijven'
            : `Inschrijven + betaal €${(total / 100).toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

export function SessionPicker({ activity, sessions, children, isLoggedIn, accountType }: Props) {
  // ── Niet ingelogd ──────────────────────────────────────────
  if (!isLoggedIn) return <NotLoggedIn sessions={sessions} />

  const isYouth = accountType === 'youth'

  return isYouth ? (
    <YouthPicker activity={activity} sessions={sessions} />
  ) : (
    <ParentPicker activity={activity} sessions={sessions} children={children} />
  )
}

// ── Jongere-flow ─────────────────────────────────────────────
function YouthPicker({
  activity,
  sessions,
}: {
  activity: Activity
  sessions: ActivitySessionWithCount[]
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionMap = new Map(sessions.map(s => [s.id, s]))

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const total = [...selected].reduce((sum, id) => sum + (sessionMap.get(id)?.price_cents ?? 0), 0)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/session-registrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activity.id, session_ids: [...selected] }),
      })
      const data = await res.json()
      if (data.payment_url) { window.location.href = data.payment_url; return }
      if (data.redirect) { window.location.href = data.redirect; return }
      setError(data.error ?? 'Er ging iets mis. Probeer opnieuw.')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-[#1B9193]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Kies je sessies</h2>
        <p className="text-[#414141]/45 text-sm mt-1">Selecteer welke sessies je wil bijwonen.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden divide-y divide-[#D9D9D9] shadow-sm">
        {sessions.map(s => (
          <SessionRow
            key={s.id}
            session={s}
            checked={selected.has(s.id)}
            disabled={isFull(s) && !selected.has(s.id)}
            onChange={() => toggle(s.id)}
          />
        ))}
      </div>

      <CheckoutBar
        total={total}
        hasSelection={selected.size > 0}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// ── Ouder-flow ───────────────────────────────────────────────
function ParentPicker({
  activity,
  sessions,
  children,
}: {
  activity: Activity
  sessions: ActivitySessionWithCount[]
  children: Child[]
}) {
  const [selection, setSelection] = useState<ParentSelection>(() => {
    const init: ParentSelection = {}
    children.forEach(c => { init[c.id] = new Set() })
    return init
  })
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    children.forEach(c => { init[c.id] = true })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Geen kinderen
  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#9FB139]/10 flex items-center justify-center mx-auto">
          <Baby className="w-7 h-7 text-[#9FB139]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1B9193]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Kind toevoegen vereist</h2>
        <p className="text-[#414141]/60 text-sm max-w-xs mx-auto">
          Voeg eerst een kind toe in je dashboard om je in te schrijven voor activiteiten.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#9FB139] text-white font-semibold px-6 py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all text-sm shadow-sm"
        >
          Ga naar dashboard
        </Link>
      </div>
    )
  }

  const sessionMap = new Map(sessions.map(s => [s.id, s]))

  function toggleSession(childId: string, sessionId: string) {
    setSelection(prev => {
      const next = { ...prev }
      const set = new Set(next[childId] ?? [])
      set.has(sessionId) ? set.delete(sessionId) : set.add(sessionId)
      next[childId] = set
      return next
    })
  }

  function childTotal(childId: string) {
    return [...(selection[childId] ?? [])].reduce(
      (sum, sid) => sum + (sessionMap.get(sid)?.price_cents ?? 0),
      0
    )
  }

  const grandTotal = children.reduce((sum, c) => sum + childTotal(c.id), 0)
  const hasAnySelection = children.some(c => (selection[c.id]?.size ?? 0) > 0)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    const registrations = children
      .filter(c => (selection[c.id]?.size ?? 0) > 0)
      .map(c => ({ child_id: c.id, session_ids: [...(selection[c.id] ?? [])] }))

    try {
      const res = await fetch('/api/session-registrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activity.id, registrations }),
      })
      const data = await res.json()
      if (data.payment_url) { window.location.href = data.payment_url; return }
      if (data.redirect) { window.location.href = data.redirect; return }
      setError(data.error ?? 'Er ging iets mis. Probeer opnieuw.')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-[#1B9193]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>Inschrijven</h2>
        <p className="text-[#414141]/45 text-sm mt-1">Selecteer per kind welke sessies ze bijwonen.</p>
      </div>

      {children.map(child => {
        const isOpen = expanded[child.id]
        const total = childTotal(child.id)
        const count = selection[child.id]?.size ?? 0

        return (
          <div key={child.id} className="bg-white rounded-2xl border border-[#D9D9D9] overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setExpanded(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#F8F8F8] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#9FB139]/10 flex items-center justify-center shrink-0">
                <span className="text-[#9FB139] font-bold">{child.first_name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#414141]">{child.first_name}</p>
                {child.birth_date && <p className="text-xs text-[#414141]/45">{getAge(child.birth_date)}</p>}
              </div>
              <div className="text-right shrink-0">
                {count > 0 && <p className="text-sm font-bold text-[#9FB139]">€{(total / 100).toFixed(2)}</p>}
                <p className="text-xs text-[#414141]/35">{count} sessie{count !== 1 ? 's' : ''} geselecteerd</p>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-[#D9D9D9] divide-y divide-[#D9D9D9]">
                {sessions.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    checked={selection[child.id]?.has(session.id) ?? false}
                    disabled={isFull(session) && !(selection[child.id]?.has(session.id) ?? false)}
                    onChange={() => toggleSession(child.id, session.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      <CheckoutBar
        total={grandTotal}
        hasSelection={hasAnySelection}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          {children.map(child => {
            const count = selection[child.id]?.size ?? 0
            const total = childTotal(child.id)
            if (count === 0) return null
            return (
              <div key={child.id} className="flex items-center justify-between text-sm">
                <span className="text-[#414141]/60">
                  {child.first_name} ({count} sessie{count !== 1 ? 's' : ''})
                </span>
                <span className="text-[#414141] font-semibold">€{(total / 100).toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      </CheckoutBar>
    </div>
  )
}
