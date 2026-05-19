import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Users, Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExportButton } from './ExportButton'
import type { Activity, Registration, Profile, SessionRegistration, ActivitySession, Child } from '@/types/database'

type RegistrationRow = Registration & { profiles: Profile }
type SessionRegRow = SessionRegistration & { children: Child & { profiles?: Profile } }

const PAYMENT_CONFIG = {
  paid:      { label: 'Betaald',        icon: CheckCircle2, badge: 'bg-green-50 text-green-700 border border-green-200' },
  pending:   { label: 'In afwachting',  icon: Clock,        badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  failed:    { label: 'Mislukt',        icon: XCircle,      badge: 'bg-red-50 text-red-600 border border-red-200' },
  cancelled: { label: 'Geannuleerd',    icon: XCircle,      badge: 'bg-[#F8F8F8] text-[#414141]/45 border border-[#D9D9D9]' },
} as const

export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { id } = await params
  const { filter } = await searchParams

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
  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))

  const parentIds = [...new Set((sessionRegs ?? []).map(r => r.user_id))]
  const { data: parentProfiles } = parentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, municipality, neighborhood').in('id', parentIds)
    : { data: [] }
  const parentMap = new Map((parentProfiles ?? []).map(p => [p.id, p]))

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

  const exportData = hasSessions
    ? filteredSessionRegs.map(reg => {
        const parent = parentMap.get(reg.user_id)
        return {
          kind: reg.children?.first_name ?? 'Jij (jongere)',
          geboortedatum: reg.children?.birth_date ?? '—',
          school: reg.children?.school ?? '—',
          gemeente_kind: reg.children?.municipality ?? '—',
          wijk_kind: reg.children?.neighborhood ?? '—',
          ouder: parent?.full_name ?? '—',
          gemeente_ouder: parent?.municipality ?? '—',
          sessies: reg.session_ids
            .map(sid => sessionMap.get(sid))
            .filter(Boolean)
            .map(s => `${s!.title ?? s!.session_date}`)
            .join(' | '),
          prijs: `€${(reg.total_price_cents / 100).toFixed(2)}`,
          betaalstatus: reg.payment_status ?? '—',
          datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
        }
      })
    : filteredRegs.map(reg => ({
        naam: reg.profiles?.full_name ?? '—',
        gemeente: reg.profiles?.municipality ?? '—',
        wijk: reg.profiles?.neighborhood ?? '—',
        betaalstatus: reg.payment_status ?? '—',
        registratiestatus: reg.status,
        datum: new Date(reg.created_at).toLocaleDateString('nl-BE'),
      }))

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
            { icon: Users, iconBg: 'bg-[#F8F8F8]', iconColor: 'text-[#414141]/45', value: sessionRegs?.length ?? 0, label: 'Inschrijvingen' },
            { icon: CheckCircle2, iconBg: 'bg-green-50', iconColor: 'text-green-600', value: sessionPaidCount, label: 'Betaald' },
            { icon: Clock, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', value: sessionPendingCount, label: 'Onbetaald' },
            { icon: Euro, iconBg: 'bg-[#9FB139]/10', iconColor: 'text-[#9FB139]', value: `€${(sessionTotalRevenue / 100).toFixed(2)}`, label: 'Ontvangen' },
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
            { icon: Users, iconBg: 'bg-[#F8F8F8]', iconColor: 'text-[#414141]/45', value: activeCount, label: 'Actief ingeschreven', show: true },
            { icon: CheckCircle2, iconBg: 'bg-green-50', iconColor: 'text-green-600', value: paidCount, label: 'Betaald', show: isPaid },
            { icon: Clock, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', value: pendingCount, label: 'Onbetaald', show: isPaid },
            { icon: AlertCircle, iconBg: 'bg-red-50', iconColor: 'text-red-500', value: cancelledCount, label: 'Geannuleerd', show: !isPaid },
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

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'betaald', label: 'Betaald' },
          { key: 'onbetaald', label: 'Onbetaald' },
          ...(!hasSessions ? [{ key: 'actief', label: 'Actief' }] : []),
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/activities/${id}/registrations?filter=${key}`}
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

      {/* Sessie-inschrijvingen tabel */}
      {hasSessions && (
        filteredSessionRegs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#D9D9D9] text-xs text-[#414141]/45 font-semibold uppercase tracking-wide bg-[#F8F8F8]">
                  <th className="text-left px-5 py-3">Kind</th>
                  <th className="text-left px-5 py-3">Ouder</th>
                  <th className="text-left px-5 py-3">Gemeente</th>
                  <th className="text-left px-5 py-3">School</th>
                  <th className="text-left px-5 py-3">Sessies</th>
                  <th className="text-left px-5 py-3">Prijs</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {filteredSessionRegs.map(reg => {
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon
                  const parent = parentMap.get(reg.user_id)
                  const mun = reg.children?.municipality ?? parent?.municipality ?? '—'
                  return (
                    <tr key={reg.id} className="hover:bg-[#F8F8F8] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#414141]">
                        {reg.children?.first_name ?? <span className="text-[#414141]/45 font-normal italic">Jongere</span>}
                        {reg.children?.birth_date && (
                          <span className="block text-xs text-[#414141]/40 font-normal">
                            {new Date(reg.children.birth_date).toLocaleDateString('nl-BE')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">{parent?.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {mun}
                        {reg.children?.neighborhood && (
                          <span className="block text-xs text-[#414141]/40">{reg.children.neighborhood}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/60">{reg.children?.school ?? '—'}</td>
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

      {/* Klassieke inschrijvingen tabel */}
      {!hasSessions && (
        filteredRegs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="bg-white rounded-2xl border border-[#D9D9D9] overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D9D9D9] text-xs text-[#414141]/45 font-semibold uppercase tracking-wide bg-[#F8F8F8]">
                  <th className="text-left px-5 py-3">Naam</th>
                  <th className="text-left px-5 py-3">Gemeente</th>
                  <th className="text-left px-5 py-3">Datum</th>
                  {isPaid && <th className="text-left px-5 py-3">Betaalstatus</th>}
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D9D9]">
                {filteredRegs.map(reg => {
                  const paymentCfg = reg.payment_status ? PAYMENT_CONFIG[reg.payment_status] : null
                  const PayIcon = paymentCfg?.icon
                  return (
                    <tr key={reg.id} className={`hover:bg-[#F8F8F8] transition-colors ${reg.status === 'cancelled' ? 'opacity-40' : ''}`}>
                      <td className="px-5 py-3.5 font-semibold text-[#414141]">{reg.profiles?.full_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-[#414141]/60">
                        {reg.profiles?.municipality ?? '—'}
                        {reg.profiles?.neighborhood && (
                          <span className="block text-xs text-[#414141]/40">{reg.profiles.neighborhood}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[#414141]/45">{new Date(reg.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
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
                          : reg.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-[#F8F8F8] text-[#414141]/45 border border-[#D9D9D9]'
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

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-[#D9D9D9] py-14 text-center space-y-2 shadow-sm">
      <Users className="w-8 h-8 text-[#414141]/20 mx-auto" />
      <p className="text-[#414141]/45 font-medium text-sm">Geen inschrijvingen gevonden</p>
    </div>
  )
}
