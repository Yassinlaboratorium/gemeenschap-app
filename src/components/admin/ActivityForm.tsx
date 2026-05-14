'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Save, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { FormState, SessionDraft } from '@/app/admin/activities/actions'
import type { Activity, ActivitySession } from '@/types/database'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

const INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-[#2a2a2a] bg-secondary text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors'
const LABEL = 'block text-sm font-semibold text-white mb-1.5'
const SMALL_INPUT =
  'w-full px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#111] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors'

function sessionToEuros(priceCents: number) {
  return (priceCents / 100).toFixed(2)
}

function dbSessionToDraft(s: ActivitySession): SessionDraft {
  return {
    id: s.id,
    session_date: s.session_date,
    start_time: s.start_time?.slice(0, 5) ?? '',
    end_time: s.end_time?.slice(0, 5) ?? '',
    title: s.title ?? '',
    description: s.description ?? '',
    max_participants: s.max_participants?.toString() ?? '',
    price_euros: sessionToEuros(s.price_cents),
  }
}

function emptySession(): SessionDraft {
  return {
    session_date: '',
    start_time: '',
    end_time: '',
    title: '',
    description: '',
    max_participants: '',
    price_euros: '0.00',
  }
}

interface Props {
  action: Action
  activity?: Activity
  initialSessions?: ActivitySession[]
}

export function ActivityForm({ action, activity, initialSessions }: Props) {
  const [state, formAction, isPending] = useActionState(action, null)
  const [sessions, setSessions] = useState<SessionDraft[]>(
    initialSessions ? initialSessions.map(dbSessionToDraft) : []
  )
  const [expanded, setExpanded] = useState<number | null>(null)

  function addSession() {
    const idx = sessions.length
    setSessions(prev => [...prev, emptySession()])
    setExpanded(idx)
  }

  function removeSession(idx: number) {
    setSessions(prev => prev.filter((_, i) => i !== idx))
    setExpanded(null)
  }

  function updateSession(idx: number, field: keyof SessionDraft, value: string) {
    setSessions(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  const tagsDefault = activity?.tags?.join(', ') ?? ''

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden sessions field — altijd in sync met state */}
      <input type="hidden" name="sessions_json" value={JSON.stringify(sessions)} />

      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Titel */}
      <div>
        <label className={LABEL}>
          Titel <span className="text-primary">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={activity?.title}
          placeholder="bv. Zomerkamp 2025"
          className={INPUT}
        />
      </div>

      {/* Beschrijving */}
      <div>
        <label className={LABEL}>Beschrijving</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={activity?.description ?? ''}
          placeholder="Korte omschrijving van de activiteit..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Tags */}
      <div>
        <label className={LABEL}>
          Tags{' '}
          <span className="text-white/30 font-normal">(komma-gescheiden, bv. sport, zomer, outdoor)</span>
        </label>
        <input
          name="tags"
          type="text"
          defaultValue={tagsDefault}
          placeholder="workshop, kinderen, 6-12 jaar"
          className={INPUT}
        />
      </div>

      {/* Datum */}
      <div>
        <label className={LABEL}>
          Datum <span className="text-primary">*</span>
        </label>
        <input
          name="date"
          type="date"
          required
          defaultValue={activity?.date}
          className={INPUT}
        />
      </div>

      {/* Tijden */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Starttijd</label>
          <input
            name="start_time"
            type="time"
            defaultValue={activity?.start_time?.slice(0, 5) ?? ''}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>
            Eindtijd{' '}
            <span className="text-white/30 font-normal">(optioneel)</span>
          </label>
          <input
            name="end_time"
            type="time"
            defaultValue={activity?.end_time?.slice(0, 5) ?? ''}
            className={INPUT}
          />
        </div>
      </div>

      {/* Locatie */}
      <div>
        <label className={LABEL}>Locatie</label>
        <input
          name="location"
          type="text"
          defaultValue={activity?.location ?? ''}
          placeholder="bv. Jeugdhuis De Schakel, Sint-Niklaas"
          className={INPUT}
        />
      </div>

      {/* Max deelnemers + Prijs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Max. deelnemers{' '}
            <span className="text-white/30 font-normal">(optioneel)</span>
          </label>
          <input
            name="max_participants"
            type="number"
            min="1"
            defaultValue={activity?.max_participants ?? ''}
            placeholder="Onbeperkt"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Basisprijs (€)</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={activity?.price ?? 0}
            className={INPUT}
          />
        </div>
      </div>

      {/* ── Sessies ────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2 border-t border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Sessies</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Optioneel — voor activiteiten met meerdere losse momenten
            </p>
          </div>
          <button
            type="button"
            onClick={addSession}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Sessie toevoegen
          </button>
        </div>

        {sessions.length === 0 && (
          <p className="text-xs text-white/25 italic">Geen sessies — activiteit is één geheel.</p>
        )}

        {sessions.map((s, idx) => (
          <div key={idx} className="bg-[#111] rounded-xl border border-[#2a2a2a] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="flex items-center gap-2 text-sm font-semibold text-white hover:text-primary transition-colors flex-1 text-left"
              >
                {expanded === idx
                  ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
                {s.title || `Sessie ${idx + 1}`}
                {s.session_date && (
                  <span className="text-white/30 font-normal text-xs">
                    — {new Date(s.session_date + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                    {s.price_euros && Number(s.price_euros) > 0 && ` · €${Number(s.price_euros).toFixed(2)}`}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => removeSession(idx)}
                className="ml-2 text-white/20 hover:text-red-400 transition-colors"
                title="Sessie verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {expanded === idx && (
              <div className="px-4 pb-4 space-y-3 border-t border-[#2a2a2a] pt-3">
                {/* Titel */}
                <div>
                  <label className="text-xs font-semibold text-white/60 mb-1 block">Sessietitel</label>
                  <input
                    type="text"
                    value={s.title}
                    onChange={e => updateSession(idx, 'title', e.target.value)}
                    placeholder="bv. Paintball"
                    className={SMALL_INPUT}
                  />
                </div>

                {/* Datum + tijden */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-white/60 mb-1 block">
                      Datum <span className="text-primary">*</span>
                    </label>
                    <input
                      type="date"
                      value={s.session_date}
                      onChange={e => updateSession(idx, 'session_date', e.target.value)}
                      className={SMALL_INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60 mb-1 block">Van</label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={e => updateSession(idx, 'start_time', e.target.value)}
                      className={SMALL_INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60 mb-1 block">Tot</label>
                    <input
                      type="time"
                      value={s.end_time}
                      onChange={e => updateSession(idx, 'end_time', e.target.value)}
                      className={SMALL_INPUT}
                    />
                  </div>
                </div>

                {/* Prijs + max deelnemers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-white/60 mb-1 block">Prijs (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={s.price_euros}
                      onChange={e => updateSession(idx, 'price_euros', e.target.value)}
                      className={SMALL_INPUT}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/60 mb-1 block">Max. deelnemers</label>
                    <input
                      type="number"
                      min="1"
                      value={s.max_participants}
                      onChange={e => updateSession(idx, 'max_participants', e.target.value)}
                      placeholder="Onbeperkt"
                      className={SMALL_INPUT}
                    />
                  </div>
                </div>

                {/* Beschrijving */}
                <div>
                  <label className="text-xs font-semibold text-white/60 mb-1 block">Beschrijving</label>
                  <textarea
                    rows={2}
                    value={s.description}
                    onChange={e => updateSession(idx, 'description', e.target.value)}
                    placeholder="Optionele beschrijving van deze sessie..."
                    className={SMALL_INPUT + ' resize-none'}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gepubliceerd */}
      <div className="flex items-center gap-3 bg-secondary rounded-xl border border-[#2a2a2a] px-4 py-3">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={activity?.is_published ?? false}
          className="w-4 h-4 accent-primary"
        />
        <label htmlFor="is_published" className="cursor-pointer">
          <span className="text-sm font-semibold text-white">Gepubliceerd</span>
          <span className="block text-xs text-white/40">Zichtbaar voor alle bezoekers</span>
        </label>
      </div>

      {/* Acties */}
      <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a]">
        <Link
          href="/admin/activities"
          className="text-sm font-semibold text-white/40 hover:text-white transition-colors"
        >
          Annuleren
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-60 text-sm"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Bezig…' : activity ? 'Opslaan' : 'Activiteit aanmaken'}
        </button>
      </div>
    </form>
  )
}
