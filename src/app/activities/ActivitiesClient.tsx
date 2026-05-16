'use client'

import { useState, useMemo } from 'react'
import { SlidersHorizontal, X, RotateCcw, CalendarDays, CalendarX } from 'lucide-react'
import { ActivityCard } from '@/components/activities/ActivityCard'
import type { ActivityWithCount, Registration } from '@/types/database'

interface Props {
  activities: ActivityWithCount[]
  registrations: Registration[]
  isLoggedIn: boolean
  allTags: string[]
}

type Quick = 'all' | 'week' | 'month' | '3months'

const QUICK_LABELS: Record<Quick, string> = {
  all: 'Alles',
  week: 'Deze week',
  month: 'Deze maand',
  '3months': 'Komende 3 maanden',
}

function quickRange(q: Quick): { from: string; to: string } | null {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  if (q === 'week') {
    const end = new Date(now); end.setDate(now.getDate() + 6)
    return { from: today, to: end.toISOString().slice(0, 10) }
  }
  if (q === 'month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: today, to: end.toISOString().slice(0, 10) }
  }
  if (q === '3months') {
    const end = new Date(now); end.setMonth(now.getMonth() + 3)
    return { from: today, to: end.toISOString().slice(0, 10) }
  }
  return null
}

export function ActivitiesClient({ activities, registrations, isLoggedIn, allTags }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [gemeente, setGemeente] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [quick, setQuick] = useState<Quick>('all')

  const registrationMap = useMemo(
    () => new Map(registrations.map(r => [r.activity_id, r])),
    [registrations]
  )

  const effectiveRange = useMemo(() => {
    if (quick !== 'all') return quickRange(quick)
    if (dateFrom || dateTo) return { from: dateFrom, to: dateTo }
    return null
  }, [quick, dateFrom, dateTo])

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (selectedTags.length > 0 && !selectedTags.some(t => a.tags?.includes(t))) return false
      if (gemeente.trim()) {
        const q = gemeente.trim().toLowerCase()
        const inLocation = a.location?.toLowerCase().includes(q) ?? false
        if (!inLocation) return false
      }
      if (effectiveRange?.from && a.date < effectiveRange.from) return false
      if (effectiveRange?.to && a.date > effectiveRange.to) return false
      return true
    })
  }, [activities, selectedTags, gemeente, effectiveRange])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function setQuickFilter(q: Quick) {
    setQuick(q)
    setDateFrom('')
    setDateTo('')
  }

  function reset() {
    setSelectedTags([])
    setGemeente('')
    setDateFrom('')
    setDateTo('')
    setQuick('all')
  }

  const hasFilters =
    selectedTags.length > 0 || gemeente || dateFrom || dateTo || quick !== 'all'

  const INPUT =
    'w-full px-3 py-2 rounded-[30px] border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/35 focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] text-sm transition-colors'

  const filterPanel = (
    <div className="space-y-5">
      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#414141]/45 uppercase tracking-wider mb-2.5">Tags</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-[#9FB139]/12 border-[#9FB139] text-[#9FB139]'
                    : 'bg-white border-[#D9D9D9] text-[#414141]/55 hover:border-[#9FB139]/40 hover:text-[#414141]/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gemeente */}
      <div>
        <p className="text-xs font-bold text-[#414141]/45 uppercase tracking-wider mb-2.5">Gemeente / Locatie</p>
        <input
          type="text"
          value={gemeente}
          onChange={e => setGemeente(e.target.value)}
          placeholder="bv. Sint-Niklaas, Beveren…"
          className={INPUT}
        />
      </div>

      {/* Datum */}
      <div>
        <p className="text-xs font-bold text-[#414141]/45 uppercase tracking-wider mb-2.5">Datum</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(Object.keys(QUICK_LABELS) as Quick[]).map(q => (
            <button
              key={q}
              onClick={() => setQuickFilter(q)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                quick === q
                  ? 'bg-[#9FB139]/12 border-[#9FB139] text-[#9FB139]'
                  : 'bg-white border-[#D9D9D9] text-[#414141]/50 hover:border-[#9FB139]/30 hover:text-[#414141]/70'
              }`}
            >
              {QUICK_LABELS[q]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#414141]/45 mb-1 block">Van</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setQuick('all') }}
              className={INPUT}
            />
          </div>
          <div>
            <label className="text-xs text-[#414141]/45 mb-1 block">Tot</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setQuick('all') }}
              className={INPUT}
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#414141]/45 hover:text-[#1B9193] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Filters wissen
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* Mobile filter toggle */}
      <div className="flex items-center justify-between mb-5 lg:hidden">
        <p className="text-sm text-[#414141]/55">
          <span className="text-[#414141] font-bold">{filtered.length}</span> activiteit{filtered.length !== 1 ? 'en' : ''} gevonden
        </p>
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-[30px] border transition-colors shadow-sm ${
            hasFilters
              ? 'bg-[#9FB139]/10 border-[#9FB139] text-[#9FB139]'
              : 'bg-white border-[#D9D9D9] text-[#414141]/60 hover:text-[#414141] hover:border-[#9FB139]/30'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filteren
          {hasFilters && (
            <span className="w-5 h-5 rounded-full bg-[#9FB139] text-white text-[10px] font-bold flex items-center justify-center">
              {selectedTags.length + (gemeente ? 1 : 0) + (quick !== 'all' || dateFrom || dateTo ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter panel */}
      {open && (
        <div className="lg:hidden bg-white rounded-2xl border border-[#D9D9D9] p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#414141]">Filters</p>
            <button onClick={() => setOpen(false)} className="text-[#414141]/30 hover:text-[#414141] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {filterPanel}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-bold text-[#414141] flex items-center gap-2" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                <SlidersHorizontal className="w-4 h-4 text-[#9FB139]" />
                Filters
              </p>
              {hasFilters && (
                <button onClick={reset} className="text-xs text-[#414141]/40 hover:text-[#1B9193] transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </div>

        {/* Activities list */}
        <div className="space-y-5">
          <div className="hidden lg:flex items-center justify-between">
            <p className="text-sm text-[#414141]/55">
              <span className="text-[#414141] font-bold">{filtered.length}</span> activiteit{filtered.length !== 1 ? 'en' : ''} gevonden
              {hasFilters && <span className="text-[#414141]/35"> (gefilterd)</span>}
            </p>
            {hasFilters && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#414141]/45 hover:text-[#1B9193] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Alles tonen
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D9D9D9] py-20 text-center space-y-3 shadow-sm">
              <CalendarX className="w-10 h-10 text-[#414141]/15 mx-auto" />
              <p className="text-[#414141]/50 font-medium">Geen activiteiten gevonden</p>
              {hasFilters && (
                <button onClick={reset} className="text-[#9FB139] text-sm font-semibold hover:underline">
                  Filters wissen
                </button>
              )}
            </div>
          ) : (
            filtered.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                registration={registrationMap.get(activity.id)}
                isLoggedIn={isLoggedIn}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
