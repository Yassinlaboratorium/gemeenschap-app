import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Users, Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExportButton } from './ExportButton'
import type { Activity, Registration, Profile, SessionRegistration, ActivitySession, Child } from '@/types/database'

type RegistrationRow = Registration & { profiles: Profile }
type SessionRegRow = SessionRegistration & { children: Child }

const PAYMENT_CONFIG = {
  paid:      { label: 'Betaald',         icon: CheckCircle2, badge: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  pending:   { label: 'In afwachting',   icon: Clock,        badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  failed:    { label: 'Mislukt',         icon: XCircle,      badge: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  cancelled: { label: 'Geannuleerd',     icon: XCircle,      badge: 'bg-white/5 text-white/30 border border-white/10' },
} as const

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string; view?: string }>
}) {
  const { id } = await params
  const { filter, view } = await searchParams

  const supabase = await createClient()

  const [{ data: activity }, { data: allRegs }, { data: sessionRegs }, { data: sessions }] = await Promise.all([
    supabase.from('activities').select('*').eq('id', id).single<Activity>(),
    supabase
      .from('registrations')
      .select('*, profiles(*)')
      .eq('activity_id', id)
      .order('created_at', { ascending: true })
      .returns<RegistrationRow[]>(),
    supabase
      .from('session_registrations')
      .select('*, children(*)')
      .eq('activity_id', id)
      .order('created_at', { ascending: true })
      .returns<SessionRegRow[]>(),
    supabase
      .from('activity_sessions')
      .select('*')
      .eq('activity_id', id)
      .order('session_date', { ascending: true })
      .returns<ActivitySession[]>(),
  ])

  if (!activity) redirect('/admin/activities')

  const hasSessions = (sessions?.length ?? 0) > 0
  const showSessions = hasSessions && view !== 'classic'
  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))

  // Haal ouder-profielen op voor sessie-inschrijvingen
  const parentIds = [...new Set((sessionRegs ?? []).map(r => r.user_id))]
  const { data: parentProfiles } = parentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', parentIds)
    : { data: [] }
  const parentMap = new Map((parentProfiles ?? []).map(p => [p.id, p.full_name]))

  // ── Filter logica ─────────────────────────────────────────────

  const filteredRegs = (allRegs ?? []).filter(r => {
    if (!filter || filter === 'all') return true
    if (filter === 'betaald') return r.payment_status === 'paid'
    if (filter === 'onbetaald') return r.payment_status === 'pending' || r.payment_status === null
    if (filter === 'actief') return r.status !== 'cancelled'
    return true
  })

  const filteredSessionRegs = (sessionRegs ?? []).filter(r => {
    if (!filter || filter === 'all') return true
    if (filter === 'betaald') return r.payment_status === 'paid'
    if (filter === 'onbetaald') return r.payment_status === 'pending' || r.payment_status === null
    return true
  })

  // ── Stats ─────────────────────────────────────────────────────

  const isPaid = Number(activity.price) > 0 || hasSessions

  const activeCount = (allRegs ?? []).filter(r => r.status !== 'cancelled').length
  const paidCount = (allRegs ?? []).filter(r => r.payment_status === 'paid').length
  const pendingCount = (allRegs ?? []).filter(r => r.payment_status === 'pending').length
  const cancelledCount = (allRegs ?? []).filter(r => r.status === 'cancelled').length

  const sessionPaidCount = (sessionRegs ?? []).filter(r => r.payment_status === 'paid').length
  const sessionPendingCount = (sessionRegs ?? []).filter(r => r.payment_status === 'pending').length
  const sessionTotalRevenue = (sessionRegs ?? [])
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + r.total_price_cents, 0)

  // ── Export data voor CSV ──────────────────────────────────────

  const exportData = showSessions
    ? filteredSessionRegs.map(reg => ({
        kind: reg.children.first_name,
        ouder: parentMap.get(reg.user_id) ?? '—',
        sessies: reg.session_ids
          .map(sid => sessionMap.get(sid))
          .filter(Boolean)
          .map(s => `${s!.title ?? s!.session_date}`)
          .join(' | '),
        prijs: `€${(reg.total_price_cents / 100).toFixed(2)}`,
        betaalstatus: reg.payment_status ?? '—',
        datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
      }))
    : filteredRegs.map(reg => ({
        naam: reg.profiles?.full_name ?? '—',
        betaalstatus: reg.payment_status ?? '—',
        registratiestatus: reg.status,
        datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
      }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/activities" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{activity.title}</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {new Date(activity.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
              {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
            </p>
          </div>
          <ExportButton data={exportData} filename={`inschrijvingen-${activity.title.slice(0, 20)}`} />
        </div>
      </div>

      {/* Stats */}
      {showSessions ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-xl font-extrabold text-white">{sessionRegs?.length ?? 0}</p>
            <p className="text-xs text-white/40 font-medium">Inschrijvingen</p>
          </div>
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xl font-extrabold text-white">{sessionPaidCount}</p>
            <p className="text-xs text-white/40 font-medium">Betaald</p>
          </div>
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-xl font-extrabold text-white">{sessionPendingCount}</p>
            <p className="text-xs text-white/40 font-medium">Onbetaald</p>
          </div>
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Euro className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-extrabold text-white">€{(sessionTotalRevenue / 100).toFixed(2)}</p>
            <p className="text-xs text-white/40 font-medium">Ontvangen</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-white/40" />
            </div>
            <p className="text-xl font-extrabold text-white">{activeCount}</p>
            <p className="text-xs text-white/40 font-medium">Actief ingeschreven</p>
          </div>
          {isPaid && (
            <>
              <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-xl font-extrabold text-white">{paidCount}</p>
                <p className="text-xs text-white/40 font-medium">Betaald</p>
              </div>
              <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-xl font-extrabold text-white">{pendingCount}</p>
                <p className="text-xs text-white/40 font-medium">Onbetaald</p>
              </div>
              <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Euro className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-extrabold text-white">
                  €{(paidCount * Number(activity.price)).toFixed(2)}
                </p>
                <p className="text-xs text-white/40 font-medium">Totaal ontvangen</p>
              </div>
            </>
          )}
          {!isPaid && (
            <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-xl font-extrabold text-white">{cancelledCount}</p>
              <p className="text-xs text-white/40 font-medium">Geannuleerd</p>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'betaald', label: 'Betaald' },
          { key: 'onbetaald', label: 'Onbetaald' },
          ...(!showSessions ? [{ key: 'actief', label: 'Actief' }] : []),
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/activities/${id}/registrations?filter=${key}${showSessions ? '' : ''}`}
            className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
              (filter ?? 'all') === key
                ? 'bg-primary text-white border-primary'
                : 'bg-dark text-white/50 border-[#2a2a2a] hover:border-white/20 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* ── Sessie-inschrijvingen tabel ── */}
      {showSessions && (
        filteredSessionRegs.length === 0 ? (
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] py-14 text-center space-y-2">
            <Users className="w-8 h-8 text-white/20 mx-auto" />
            <p className="text-white/40 font-medium text-sm">Geen inschrijvingen gevonden</p>
          </div>
        ) : (
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs text-white/30 font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Kind</th>
                  <th className="text-left px-5 py-3">Ouder</th>
                  <th className="text-left px-5 py-3">Sessies</th>
                  <th className="text-left px-5 py-3">Prijs</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredSessionRegs.map(reg => {
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon

                  return (
                    <tr key={reg.id}>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {reg.children.first_name}
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
                        {parentMap.get(reg.user_id) ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {reg.session_ids.map(sid => {
                            const s = sessionMap.get(sid)
                            if (!s) return null
                            return (
                              <div key={sid} className="text-xs text-white/60">
                                {s.title ?? new Date(s.session_date + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                                {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white font-semibold">
                        €{(reg.total_price_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        {paymentCfg && PayIcon ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentCfg.badge}`}>
                            <PayIcon className="w-3.5 h-3.5" />
                            {paymentCfg.label}
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Klassieke inschrijvingen tabel ── */}
      {!showSessions && (
        filteredRegs.length === 0 ? (
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] py-14 text-center space-y-2">
            <Users className="w-8 h-8 text-white/20 mx-auto" />
            <p className="text-white/40 font-medium text-sm">Geen inschrijvingen gevonden</p>
          </div>
        ) : (
          <div className="bg-dark rounded-2xl border border-[#2a2a2a] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-xs text-white/30 font-semibold uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Naam</th>
                  <th className="text-left px-5 py-3">Datum</th>
                  {isPaid && <th className="text-left px-5 py-3">Betaalstatus</th>}
                  <th className="text-left px-5 py-3">Registratiestatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredRegs.map(reg => {
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon

                  return (
                    <tr key={reg.id} className={reg.status === 'cancelled' ? 'opacity-40' : ''}>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {reg.profiles?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-white/40">
                        {new Date(reg.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {isPaid && (
                        <td className="px-5 py-3.5">
                          {paymentCfg && PayIcon ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentCfg.badge}`}>
                              <PayIcon className="w-3.5 h-3.5" />
                              {paymentCfg.label}
                            </span>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          reg.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : reg.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-white/5 text-white/30 border border-white/10'
                        }`}>
                          {reg.status === 'confirmed' ? 'Bevestigd' : reg.status === 'pending' ? 'In afwachting' : 'Geannuleerd'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
