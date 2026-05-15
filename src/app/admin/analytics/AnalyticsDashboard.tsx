'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, CalendarDays, Euro, TrendingUp,
  Baby, MapPin, RotateCcw, ArrowLeft, BarChart2,
  SlidersHorizontal,
} from 'lucide-react'
import { MetricCard, MetricCardSkeleton } from '@/components/analytics/MetricCard'
import { Charts } from '@/components/analytics/Charts'
import { ExportButtons } from '@/components/analytics/ExportButtons'
import type { AnalyticsData } from '@/types/database'

const MUNICIPALITIES = ['Sint-Niklaas', 'Beveren', 'Temse', 'Stekene', 'Kruibeke']

const today = new Date()
const defaultFrom = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10)
const defaultTo = today.toISOString().slice(0, 10)

const INPUT = 'px-3 py-2 rounded-xl border border-white/10 bg-[#1a2942] text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors'

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(defaultTo)
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ dateFrom, dateTo })
      for (const m of selectedMunicipalities) params.append('municipality', m)
      const res = await fetch(`/api/admin/analytics?${params}`)
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, selectedMunicipalities])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleMunicipality(m: string) {
    setSelectedMunicipalities(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  function resetFilters() {
    setDateFrom(defaultFrom)
    setDateTo(defaultTo)
    setSelectedMunicipalities([])
  }

  const hasFilters = dateFrom !== defaultFrom || dateTo !== defaultTo || selectedMunicipalities.length > 0

  return (
    <div className="min-h-screen bg-secondary">

      {/* Header */}
      <header className="bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/activities"
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-sm leading-none">Impact Analytics</h1>
              <p className="text-xs text-white/30 mt-0.5">DE GEMEENSCHAP vzw</p>
            </div>
          </div>
        </div>
        <ExportButtons data={data} dateFrom={dateFrom} dateTo={dateTo} />
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Filters */}
        <div className="bg-[#131C31] rounded-[28px] border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <p className="font-bold text-white text-sm">Filters</p>
              {hasFilters && (
                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                  Actief
                </span>
              )}
            </div>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="px-6 py-5 flex flex-wrap gap-6 items-start">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">Periode</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={INPUT} />
                <span className="text-white/20 text-sm">—</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={INPUT} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">Gemeente</label>
              <div className="flex flex-wrap gap-2">
                {MUNICIPALITIES.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMunicipality(m)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      selectedMunicipalities.includes(m)
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
            Fout bij laden: {error}
          </div>
        )}

        {/* Section: KPI's */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Key metrics</p>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
            ) : data ? (
              <>
                <MetricCard label="Unieke deelnemers" value={data.metrics.totalParticipants} icon={Users} color="text-primary" />
                <MetricCard label="Inschrijvingen" value={data.metrics.totalRegistrations} icon={CalendarDays} color="text-blue-400" />
                <MetricCard label="Activiteiten" value={data.metrics.totalActivities} icon={TrendingUp} color="text-accent" />
                <MetricCard label="Inkomsten" value={`€${(data.metrics.totalRevenueCents / 100).toFixed(0)}`} icon={Euro} color="text-yellow-400" />
                <MetricCard label="Gem. leeftijd" value={data.metrics.avgAge ? `${data.metrics.avgAge} jr` : 'N/A'} icon={Baby} color="text-purple-400" />
                <MetricCard label="Top gemeente" value={data.metrics.topMunicipality ?? 'N/A'} icon={MapPin} color="text-cyan-400" />
              </>
            ) : null}
          </div>
        </div>

        {/* Section: Charts */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Grafieken</p>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <Charts data={data} loading={loading} />
        </div>

      </main>
    </div>
  )
}
