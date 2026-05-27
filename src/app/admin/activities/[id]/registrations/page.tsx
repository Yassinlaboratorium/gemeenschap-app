import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle,
  Users, Euro, Phone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ExportButton } from './ExportButton'
import type { Activity, Registration, SessionRegistration, ActivitySession, Child } from '@/types/database'

const PAYMENT_CONFIG = {
  paid:      { label: 'Betaald',        icon: CheckCircle2, badge: 'bg-green-50 text-green-700 border border-green-200' },
  pending:   { label: 'In afwachting',  icon: Clock,        badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  failed:    { label: 'Mislukt',        icon: XCircle,      badge: 'bg-red-50 text-red-600 border border-red-200' },
  cancelled: { label: 'Geannuleerd',    icon: XCircle,      badge: 'bg-[#F8F8F8] text-[#414141]/45 border border-[#D9D9D9]' },
} as const

type ProfileEntry = { id: string; full_name: string; municipality: string | null; neighborhood: string | null; phone: string | null }

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { id } = await params
  const { filter, q: search } = await searchParams

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: activity }, { data: allRegs, error: regErr }, { data: sessionRegs, error: srErr }, { data: sessions }] = await Promise.all([
    admin.from('activities').select('*').eq('id', id).single<Activity>(),
    admin.from('registrations').select('*').eq('activity_id', id).order('created_at', { ascending: false }).returns<Registration[]>(),
    admin.from('session_registrations').select('*, children(*)').eq('activity_id', id).order('created_at', { ascending: false }).returns<(SessionRegistration & { children: Child | null })[]>(),
    admin.from('activity_sessions').select('*').eq('activity_id', id).order('session_date', { ascending: true }).returns<ActivitySession[]>(),
  ])

  if (regErr) console.error('[registrations] query failed:', regErr)
  if (srErr) console.error('[session_registrations] query failed:', srErr)

  if (!activity) redirect('/admin/activities')

  // Fetch profiles separately — avoids join ambiguity through auth.users
  const userIds = [...new Set([
    ...(allRegs ?? []).map(r => r.user_id),
    ...(sessionRegs ?? []).map(r => r.user_id),
  ])]
  const { data: profilesList } = userIds.length > 0
    ? await admin.from('profiles').select('id, full_name, municipality, neighborhood, phone').in('id', userIds)
    : { data: [] as ProfileEntry[] }
  const profileMap = new Map<string, ProfileEntry>((profilesList ?? []).map(p => [p.id, p as ProfileEntry]))

  const hasSessions = (sessions?.length ?? 0) > 0
  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))

  // Filters
  const filterReg = (r: Registration) => {
    if (filter === 'betaald') return r.payment_status === 'paid'
    if (filter === 'onbetaald') return r.payment_status === 'pending' || r.payment_status === null
    if (filter === 'mislukt') return r.payment_status === 'failed'
    if (filter === 'actief') return r.status !== 'cancelled'
    return true
  }
  const filterSr = (r: SessionRegistration) => {
    if (filter === 'betaald') return r.payment_status === 'paid'
    if (filter === 'onbetaald') return r.payment_status === 'pending' || r.payment_status === null
    if (filter === 'mislukt') return r.payment_status === 'failed'
    return true
  }

  const matchSearch = (name: string) =>
    !search || name.toLowerCase().includes(search.toLowerCase())

  const filteredRegs = (allRegs ?? [])
    .filter(filterReg)
    .filter(r => matchSearch(profileMap.get(r.user_id)?.full_name ?? ''))

  const filteredSessionRegs = (sessionRegs ?? [])
    .filter(filterSr)
    .filter(r => {
      const childName = (r as SessionRegistration & { children: Child | null }).children?.first_name ?? ''
      const parentName = profileMap.get(r.user_id)?.full_name ?? ''
      return matchSearch(childName) || matchSearch(parentName)
    })

  // Stats — classic
  const activeCount   = (allRegs ?? []).filter(r => r.status !== 'cancelled').length
  const paidCount     = (allRegs ?? []).filter(r => r.payment_status === 'paid').length
  const pendingCount  = (allRegs ?? []).filter(r => r.payment_status === 'pending').length
  const cancelledCount= (allRegs ?? []).filter(r => r.status === 'cancelled').length
  const failedCount   = (allRegs ?? []).filter(r => r.payment_status === 'failed').length

  // Stats — session
  const sessionPaidCount    = (sessionRegs ?? []).filter(r => r.payment_status === 'paid').length
  const sessionPendingCount = (sessionRegs ?? []).filter(r => r.payment_status === 'pending').length
  const sessionTotalRevenue = (sessionRegs ?? [])
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + r.total_price_cents, 0)

  const isPaid = Number(activity.price) > 0 || hasSessions

  // Export data
  const exportData = hasSessions
    ? filteredSessionRegs.map(reg => {
        const r = reg as SessionRegistration & { children: Child | null }
        const parent = profileMap.get(reg.user_id)
        return {
          kind: r.children?.first_name ?? 'Jij (jongere)',
          geboortedatum: r.children?.birth_date ?? '—',
          school: r.children?.school ?? '—',
          gemeente_kind: r.children?.municipality ?? '—',
          wijk_kind: r.children?.neighborhood ?? '—',
          ouder: parent?.full_name ?? '—',
          telefoon: parent?.phone ?? '—',
          gemeente_ouder: parent?.municipality ?? '—',
          sessies: reg.session_ids
            .map(sid => sessionMap.get(sid))
            .filter(Boolean)
            .map(s => s!.title ?? s!.session_date)
            .join(' | '),
          prijs: `€${(reg.total_price_cents / 100).toFixed(2)}`,
          betaalstatus: reg.payment_status ?? '—',
          datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
        }
      })
    : filteredRegs.map(reg => {
        const profile = profileMap.get(reg.user_id)
        return {
          naam: profile?.full_name ?? '—',
          telefoon: profile?.phone ?? '—',
          gemeente: profile?.municipality ?? '—',
          wijk: profile?.neighborhood ?? '—',
          betaalstatus: reg.payment_status ?? '—',
          registratiestatus: reg.status,
          mollie_id: reg.mollie_payment_id ?? '—',
          datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
        }
      })

  const filterTabs = hasSessions
    ? [
        { key: 'all',      label: 'Alle' },
        { key: 'betaald',  label: 'Betaald' },
        { key: 'onbetaald',label: 'Onbetaald' },
        { key: 'mislukt',  label: 'Mislukt' },
      ]
    : [
        { key: 'all',      label: 'Alle' },
        { key: 'betaald',  label: 'Betaald' },
        { key: 'onbetaald',label: 'Onbetaald' },
        { key: 'mislukt',  label: 'Mislukt' },
        { key: 'actief',   label: 'Actief' },
      ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/activities" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>{activity.title}</h1>
            <p className="text-[#414141]/45 text-sm mt-0.5">
              {activity.date ? new Date(activity.date).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              {activity.start_time && ` · ${activity.start_time.slice(0, 5)}`}
            </p>
          </div>
          <ExportButton data={exportData} filename={`inschrijvingen-${activity.title.slice(0, 20)}`} />
        </div>
      </div>

      {/* Stats */}
      {hasSessions ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,         iconBg: 'bg-[#F8F8F8]',      iconColor: 'text-[#414141]/45', value: sessionRegs?.length ?? 0, label: 'Inschrijvingen' },
            { icon: CheckCircle2,  iconBg: 'bg-green-50',        iconColor: 'text-green-600',    value: sessionPaidCount,        label: 'Betaald' },
            { icon: Clock,         iconBg: 'bg-yellow-50',       iconColor: 'text-yellow-600',   value: sessionPendingCount,     label: 'Onbetaald' },
            { icon: Euro,          iconBg: 'bg-[#9FB139]/10',    iconColor: 'text-[#9FB139]',    value: `€${(sessionTotalRevenue / 100).toFixed(2)}`, label: 'Ontvangen' },
          ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#D9D9D9] p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2 border border-[#D9D9D9]`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className="text-xl font-extrabold text-[#414141]">{value}</p>
              <p className="text-xs text-[#414141]/45 font-medium">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,        iconBg: 'bg-[#F8F8F8]',   iconColor: 'text-[#414141]/45', value: activeCount,    label: 'Actief ingeschreven', show: true },
            { icon: CheckCircle2, iconBg: 'bg-green-50',     iconColor: 'text-green-600',    value: paidCount,      label: 'Betaald',             show: isPaid },
            { icon: Clock,        iconBg: 'bg-yellow-50',    iconColor: 'text-yellow-600',   value: pendingCount,   label: 'Onbetaald',           show: isPaid },
            { icon: AlertCircle,  iconBg: 'bg-red-50',       iconColor: 'text-red-500',      value: failedCount > 0 ? failedCount : cancelledCount, label: failedCount > 0 ? 'Mislukt' : 'Geannuleerd', show: true },
          ].filter(s => s.show).map(({ icon: Icon, iconBg, iconColor, value, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#D9D9D9] p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2 border border-[#D9D9D9]`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className="text-xl font-extrabold text-[#414141]">{value}</p>
              <p className="text-xs text-[#414141]/45 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(({ key, label }) => (
            <Link
              key={key}
              href={`/admin/activities/${id}/registrations?filter=${key}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
              className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
                (filter ?? 'all') === key
                  ? 'bg-[#9FB139] text-white border-[#9FB139]'
                  : 'bg-white text-[#414141]/55 border-[#D9D9D9] hover:border-[#9FB139]/40 hover:text-[#414141]'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <form method="GET" action={`/admin/activities/${id}/registrations`} className="flex-1 max-w-xs">
          <input type="hidden" name="filter" value={filter ?? 'all'} />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Zoek op naam…"
            className="w-full px-3 py-2 text-sm rounded-xl border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] transition-colors"
          />
        </form>
      </div>

      {/* Sessie-inschrijvingen */}
      {hasSessions && (
        filteredSessionRegs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#D9D9D9] text-xs text-[#414141]/45 font-semibold uppercase tracking-wide bg-[#F8F8F8]">
                  <th className="text-left px-5 py-3">Kind</th>
                  <th className="text-left px-5 py-3">Ouder / Jongere</th>
                  <th className="text-left px-5 py-3">Gemeente</th>
                  <th className="text-left px-5 py-3">School</th>
                  <th className="text-left px-5 py-3">Sessies</th>
                  <th className="text-left px-5 py-3">Prijs</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {filteredSessionRegs.map(reg => {
                  const r = reg as SessionRegistration & { children: Child | null }
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon
                  const parent = profileMap.get(reg.user_id)
                  const mun = r.children?.municipality ?? parent?.municipality ?? '—'
                  return (
                    <tr key={reg.id} className="hover:bg-[#F8F8F8] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#414141]">
                        {r.children?.first_name ?? <span className="text-[#414141]/45 font-normal italic">Jongere</span>}
                        {r.children?.birth_date && (
                          <span className="block text-xs text-[#414141]/40 font-normal">
                            {new Date(r.children.birth_date).toLocaleDateString('nl-BE')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {parent?.full_name ?? '—'}
                        {parent?.phone && (
                          <span className="flex items-center gap-1 text-xs text-[#414141]/40 mt-0.5">
                            <Phone className="w-3 h-3" />{parent.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {mun}
                        {r.children?.neighborhood && (
                          <span className="block text-xs text-[#414141]/40">{r.children.neighborhood}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">{r.children?.school ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1">
                          {reg.session_ids.map(sid => {
                            const s = sessionMap.get(sid)
                            if (!s) return null
                            return (
                              <div key={sid} className="text-xs text-[#414141]/60">
                                {s.title ?? new Date(s.session_date + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                                {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#414141] font-semibold">€{(reg.total_price_cents / 100).toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        {paymentCfg && PayIcon ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentCfg.badge}`}>
                            <PayIcon className="w-3.5 h-3.5" />
                            {paymentCfg.label}
                          </span>
                        ) : <span className="text-[#414141]/30 text-xs">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Klassieke inschrijvingen — tonen wanneer er klassieke inschrijvingen zijn, ook als activiteit sessions heeft */}
      {(allRegs ?? []).length > 0 && (
        filteredRegs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[#D9D9D9] text-xs text-[#414141]/45 font-semibold uppercase tracking-wide bg-[#F8F8F8]">
                  <th className="text-left px-5 py-3">Naam</th>
                  <th className="text-left px-5 py-3">Contact</th>
                  <th className="text-left px-5 py-3">Gemeente</th>
                  <th className="text-left px-5 py-3">Datum</th>
                  {isPaid && <th className="text-left px-5 py-3">Betaalstatus</th>}
                  <th className="text-left px-5 py-3">Status</th>
                  {isPaid && <th className="text-left px-5 py-3">Mollie ID</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {filteredRegs.map(reg => {
                  const profile = profileMap.get(reg.user_id)
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon
                  return (
                    <tr key={reg.id} className={`hover:bg-[#F8F8F8] transition-colors ${reg.status === 'cancelled' ? 'opacity-40' : ''}`}>
                      <td className="px-5 py-3.5 font-semibold text-[#414141]">{profile?.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {profile?.phone ? (
                          <span className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3" />{profile.phone}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {profile?.municipality ?? '—'}
                        {profile?.neighborhood && (
                          <span className="block text-xs text-[#414141]/40">{profile.neighborhood}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/45">
                        {new Date(reg.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {isPaid && (
                        <td className="px-5 py-3.5">
                          {paymentCfg && PayIcon ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${paymentCfg.badge}`}>
                              <PayIcon className="w-3.5 h-3.5" />
                              {paymentCfg.label}
                            </span>
                          ) : <span className="text-[#414141]/30 text-xs">—</span>}
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          reg.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200'
                          : reg.status === 'pending'  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-[#F8F8F8] text-[#414141]/45 border border-[#D9D9D9]'
                        }`}>
                          {reg.status === 'confirmed' ? 'Bevestigd' : reg.status === 'pending' ? 'In afwachting' : 'Geannuleerd'}
                        </span>
                      </td>
                      {isPaid && (
                        <td className="px-5 py-3.5">
                          {reg.mollie_payment_id ? (
                            <code className="text-xs text-[#414141]/45 bg-[#F8F8F8] px-1.5 py-0.5 rounded border border-[#D9D9D9]">
                              {reg.mollie_payment_id}
                            </code>
                          ) : <span className="text-[#414141]/30 text-xs">—</span>}
                        </td>
                      )}
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

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] py-14 text-center space-y-2 shadow-sm">
      <Users className="w-8 h-8 text-[#414141]/20 mx-auto" />
      <p className="text-[#414141]/45 font-medium text-sm">Geen inschrijvingen gevonden</p>
    </div>
  )
}
