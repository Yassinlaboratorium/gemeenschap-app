'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Clock, CreditCard, Loader2,
  CheckCircle2, AlertCircle, Users, Baby,
} from 'lucide-react'
import type { Activity, ActivitySession, Child } from '@/types/database'

interface Props {
  activity: Activity
  sessions: ActivitySession[]
  children: Child[]
  isLoggedIn: boolean
}

type Selection = Record<string, Set<string>>

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() - birth.getMonth() < 0 || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return `${age} jaar`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
}

function formatPrice(cents: number) {
  if (cents === 0) return 'Gratis'
  return `€${(cents / 100).toFixed(2)}`
}

export function SessionPicker({ activity, sessions, children, isLoggedIn }: Props) {
  const [selection, setSelection] = useState<Selection>(() => {
    const init: Selection = {}
    children.forEach(c => { init[c.id] = new Set() })
    return init
  })
  const [childExpanded, setChildExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    children.forEach(c => { init[c.id] = true })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSession(childId: string, sessionId: string) {
    setSelection(prev => {
      const next = { ...prev }
      const childSet = new Set(next[childId] ?? [])
      if (childSet.has(sessionId)) {
        childSet.delete(sessionId)
      } else {
        childSet.add(sessionId)
      }
      next[childId] = childSet
      return next
    })
  }

  function toggleChild(childId: string) {
    setChildExpanded(prev => ({ ...prev, [childId]: !prev[childId] }))
  }

  // Bereken totaalprijs
  const sessionMap = new Map(sessions.map(s => [s.id, s]))

  function childTotal(childId: string): number {
    return [...(selection[childId] ?? [])].reduce((sum, sid) => {
      return sum + (sessionMap.get(sid)?.price_cents ?? 0)
    }, 0)
  }

  const grandTotal = children.reduce((sum, c) => sum + childTotal(c.id), 0)
  const hasAnySelection = children.some(c => (selection[c.id]?.size ?? 0) > 0)

  async function handleRegister() {
    setError(null)
    setLoading(true)

    const registrations = children
      .filter(c => (selection[c.id]?.size ?? 0) > 0)
      .map(c => ({
        child_id: c.id,
        session_ids: [...(selection[c.id] ?? [])],
      }))

    try {
      const res = await fetch('/api/session-registrations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activity.id, registrations }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
        return
      }
      if (data.redirect) {
        window.location.href = data.redirect
        return
      }
      setError(data.error ?? 'Er ging iets mis. Probeer opnieuw.')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    }
    setLoading(false)
  }

  // ── Niet ingelogd ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7 text-white/20" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Sessies bekijken</h2>
        <div className="space-y-3 text-left max-w-sm mx-auto">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-secondary rounded-xl border border-[#2a2a2a] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{s.title ?? formatDate(s.session_date)}</p>
                <p className="text-xs text-white/40">{formatDate(s.session_date)}{s.start_time && ` · ${s.start_time.slice(0, 5)}`}</p>
              </div>
              <span className="text-sm font-bold text-primary">{formatPrice(s.price_cents)}</span>
            </div>
          ))}
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent transition-all text-sm"
        >
          Log in om in te schrijven
        </Link>
      </div>
    )
  }

  // ── Ingelogd maar geen kinderen ───────────────────────────────
  if (children.length === 0) {
    return (
      <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Baby className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-extrabold text-white">Kind toevoegen vereist</h2>
        <p className="text-[#a0a0a0] text-sm max-w-xs mx-auto">
          Voeg eerst een kind toe in je dashboard om je in te schrijven voor activiteiten.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent transition-all text-sm"
        >
          Ga naar dashboard
        </Link>
      </div>
    )
  }

  // ── Sessie-keuze per kind ─────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-white">Inschrijven</h2>
        <p className="text-white/40 text-sm mt-1">
          Selecteer per kind welke sessies ze bijwonen.
        </p>
      </div>

      {children.map(child => {
        const isOpen = childExpanded[child.id]
        const total = childTotal(child.id)
        const count = selection[child.id]?.size ?? 0

        return (
          <div key={child.id} className="bg-dark rounded-2xl border border-[#2a2a2a] overflow-hidden">
            {/* Kind-header */}
            <button
              type="button"
              onClick={() => toggleChild(child.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">{child.first_name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{child.first_name}</p>
                {child.birth_date && (
                  <p className="text-xs text-white/40">{getAge(child.birth_date)}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {count > 0 && (
                  <p className="text-sm font-bold text-primary">€{(total / 100).toFixed(2)}</p>
                )}
                <p className="text-xs text-white/30">
                  {count} sessie{count !== 1 ? 's' : ''} geselecteerd
                </p>
              </div>
            </button>

            {/* Sessie-checkboxes */}
            {isOpen && (
              <div className="border-t border-[#2a2a2a] divide-y divide-[#1a1a1a]">
                {sessions.map(session => {
                  const isChecked = selection[child.id]?.has(session.id) ?? false
                  const timeStr = session.start_time
                    ? session.end_time
                      ? `${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`
                      : session.start_time.slice(0, 5)
                    : null

                  return (
                    <label
                      key={session.id}
                      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
                        isChecked ? 'bg-primary/5' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSession(child.id, session.id)}
                        className="w-4 h-4 accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isChecked ? 'text-white' : 'text-white/60'}`}>
                          {session.title ?? formatDate(session.session_date)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-white/30 mt-0.5">
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
                          {session.description && (
                            <span className="truncate max-w-[120px]">{session.description}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${isChecked ? 'text-primary' : 'text-white/30'}`}>
                        {formatPrice(session.price_cents)}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Totaal + betaalknop */}
      <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Overzicht per kind */}
        <div className="space-y-2">
          {children.map(child => {
            const count = selection[child.id]?.size ?? 0
            const total = childTotal(child.id)
            if (count === 0) return null
            return (
              <div key={child.id} className="flex items-center justify-between text-sm">
                <span className="text-white/60">
                  {child.first_name} ({count} sessie{count !== 1 ? 's' : ''})
                </span>
                <span className="text-white font-semibold">€{(total / 100).toFixed(2)}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-3">
          <div>
            <p className="text-sm text-white/40">Totaal</p>
            <p className="text-2xl font-extrabold text-white">
              {grandTotal === 0 ? 'Gratis' : `€${(grandTotal / 100).toFixed(2)}`}
            </p>
          </div>
          <button
            onClick={handleRegister}
            disabled={!hasAnySelection || loading}
            className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : grandTotal === 0 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {loading
              ? 'Bezig…'
              : grandTotal === 0
                ? 'Inschrijven'
                : `Inschrijven + betaal €${(grandTotal / 100).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
