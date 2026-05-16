import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, ArrowRight, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollieClient } from '@/lib/mollie'
import { Navbar } from '@/components/layout/Navbar'
import type { ActivitySession, Child, SessionRegistration, Activity } from '@/types/database'

type SessionRegWithChild = SessionRegistration & { children: Child | null }

export default async function SessionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; free?: string; activity_id?: string }>
}) {
  const { ids, free, activity_id } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Gratis inschrijving ──────────────────────────────────────
  if (free === '1' && activity_id) {
    const { data: activity } = await supabase
      .from('activities')
      .select('title, date')
      .eq('id', activity_id)
      .single<Pick<Activity, 'title' | 'date'>>()

    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#166534' }}>Ingeschreven!</h1>
            <p className="text-[#414141]/55">
              Je bent succesvol ingeschreven voor{' '}
              <span className="text-[#414141] font-semibold">{activity?.title ?? 'de activiteit'}</span>.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/activities"
                className="inline-flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-3.5 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm"
              >
                Alle activiteiten <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#414141] font-semibold px-6 py-3.5 rounded-[30px] hover:bg-[#F8F8F8] transition-colors border border-[#D9D9D9] shadow-sm"
              >
                Mijn dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Betaalde inschrijving ─────────────────────────────────────
  if (!ids) redirect('/activities')

  const idList = ids.split(',').filter(Boolean)
  if (idList.length === 0) redirect('/activities')

  // Haal sessie-registraties op (met kind-info)
  const { data: regs } = await supabase
    .from('session_registrations')
    .select('*, children(*)')
    .in('id', idList)
    .eq('user_id', user.id)
    .returns<SessionRegWithChild[]>()

  if (!regs || regs.length === 0) redirect('/activities')

  let paymentStatus = regs[0].payment_status

  console.log('[session-success] ids:', idList)
  console.log('[session-success] db payment_status:', paymentStatus, '| mollie_payment_id:', regs[0].mollie_payment_id)

  // Controleer Mollie status als nog pending
  if (paymentStatus === 'pending' && regs[0].mollie_payment_id) {
    console.log('[session-success] status is pending → calling Mollie API for', regs[0].mollie_payment_id)
    try {
      const molliePayment = await mollieClient.payments.get(regs[0].mollie_payment_id)
      console.log('[session-success] Mollie response: status =', molliePayment.status, '| paidAt =', molliePayment.paidAt)

      if (molliePayment.status === 'paid') {
        try {
          const adminClient = createAdminClient()
          const { error: dbErr } = await adminClient
            .from('session_registrations')
            .update({
              payment_status: 'paid',
              paid_at: molliePayment.paidAt ?? new Date().toISOString(),
            })
            .in('id', idList)
          if (dbErr) console.error('[session-success] DB update error (paid):', dbErr)
          else console.log('[session-success] DB updated → paid')
          paymentStatus = 'paid'
        } catch (dbErr) {
          console.error('[session-success] DB update threw:', dbErr)
          paymentStatus = 'paid'
        }
      } else if (
        molliePayment.status === 'failed' ||
        molliePayment.status === 'expired' ||
        molliePayment.status === 'canceled'
      ) {
        try {
          const adminClient = createAdminClient()
          const { error: dbErr } = await adminClient
            .from('session_registrations')
            .update({ payment_status: 'failed' })
            .in('id', idList)
          if (dbErr) console.error('[session-success] DB update error (failed):', dbErr)
          else console.log('[session-success] DB updated → failed')
          paymentStatus = 'failed'
        } catch (dbErr) {
          console.error('[session-success] DB update threw:', dbErr)
          paymentStatus = 'failed'
        }
      } else {
        console.log('[session-success] Mollie status not actionable:', molliePayment.status)
      }
    } catch (err) {
      console.error('[session-success] Mollie payments.get threw:', err)
    }
  } else {
    console.log('[session-success] skipping Mollie check — status:', paymentStatus, '| has mollie id:', !!regs[0].mollie_payment_id)
  }

  console.log('[session-success] final paymentStatus:', paymentStatus)

  // Haal sessie-details op
  const allSessionIds = [...new Set(regs.flatMap(r => r.session_ids))]
  const { data: sessions } = await supabase
    .from('activity_sessions')
    .select('id, title, session_date, start_time, price_cents')
    .in('id', allSessionIds)
    .returns<Pick<ActivitySession, 'id' | 'title' | 'session_date' | 'start_time' | 'price_cents'>[]>()

  const sessionMap = new Map((sessions ?? []).map(s => [s.id, s]))

  const grandTotal = regs.reduce((sum, r) => sum + r.total_price_cents, 0)
  const isPaid = paymentStatus === 'paid'
  const isFailed = paymentStatus === 'failed'

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">

          {/* Status card */}
          <div className={`rounded-2xl p-8 text-center space-y-3 border shadow-sm ${
            isPaid ? 'bg-green-50 border-green-200' : isFailed ? 'bg-red-50 border-red-200' : 'bg-white border-[#D9D9D9]'
          }`}>
            {isPaid && <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />}
            {isFailed && <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-500 text-3xl font-bold">✕</div>}
            {!isPaid && !isFailed && <Clock className="w-16 h-16 text-[#414141]/15 mx-auto animate-pulse" />}

            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: isPaid ? '#166534' : isFailed ? '#991b1b' : '#1B9193' }}>
              {isPaid ? 'Betaling geslaagd!' : isFailed ? 'Betaling mislukt' : 'Betaling wordt verwerkt…'}
            </h1>

            {isPaid && (
              <p className="text-green-700/70 text-sm">
                Totaal betaald: €{(grandTotal / 100).toFixed(2)}
              </p>
            )}
          </div>

          {/* Per kind overzicht */}
          {isPaid && (
            <div className="space-y-3">
              {regs.map(reg => (
                <div key={reg.id} className="bg-white rounded-2xl border border-[#D9D9D9] p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#9FB139]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#9FB139] font-bold text-sm">
                        {reg.children ? reg.children.first_name[0].toUpperCase() : 'J'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[#414141]">{reg.children ? reg.children.first_name : 'Jij'}</p>
                      <p className="text-xs text-[#414141]/45">€{(reg.total_price_cents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {reg.session_ids.map(sid => {
                      const s = sessionMap.get(sid)
                      if (!s) return null
                      return (
                        <div key={sid} className="flex items-center gap-2 text-sm text-[#414141]/55">
                          <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[#1B9193]/40" />
                          <span>
                            {s.title ?? new Date(s.session_date + 'T00:00:00').toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                            {s.start_time && ` · ${s.start_time.slice(0, 5)}`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actieknoppen */}
          <div className="flex flex-col gap-3">
            <Link
              href="/activities"
              className="inline-flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-3.5 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm"
            >
              Alle activiteiten <ArrowRight className="w-4 h-4" />
            </Link>
            {(isPaid || !isFailed) && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#414141] font-semibold px-6 py-3.5 rounded-[30px] hover:bg-[#F8F8F8] transition-colors border border-[#D9D9D9] shadow-sm"
              >
                Mijn dashboard
              </Link>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
