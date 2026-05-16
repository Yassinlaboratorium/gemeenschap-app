import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ArrowRight, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollieClient } from '@/lib/mollie'
import { Navbar } from '@/components/layout/Navbar'
import type { Registration, Activity } from '@/types/database'

type RegistrationWithActivity = Registration & { activities: Activity }

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ registration_id?: string }>
}) {
  const { registration_id } = await searchParams

  if (!registration_id) redirect('/activities')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: reg } = await supabase
    .from('registrations')
    .select('*, activities(*)')
    .eq('id', registration_id)
    .eq('user_id', user.id)
    .single<RegistrationWithActivity>()

  if (!reg) redirect('/activities')

  let paymentStatus = reg.payment_status
  const activity = reg.activities

  console.log('[success] registration_id:', registration_id)
  console.log('[success] db payment_status:', paymentStatus, '| mollie_payment_id:', reg.mollie_payment_id)

  if (paymentStatus === 'pending' && reg.mollie_payment_id) {
    console.log('[success] status is pending → calling Mollie API for', reg.mollie_payment_id)
    try {
      const molliePayment = await mollieClient.payments.get(reg.mollie_payment_id)
      console.log('[success] Mollie response: status =', molliePayment.status, '| paidAt =', molliePayment.paidAt)

      if (molliePayment.status === 'paid') {
        try {
          const adminClient = createAdminClient()
          const { error: dbErr } = await adminClient
            .from('registrations')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              paid_at: molliePayment.paidAt ?? new Date().toISOString(),
            })
            .eq('id', registration_id)
          if (dbErr) console.error('[success] DB update error (paid):', dbErr)
          else console.log('[success] DB updated → paid')
          paymentStatus = 'paid'
        } catch (dbErr) {
          console.error('[success] DB update threw:', dbErr)
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
            .from('registrations')
            .update({ payment_status: 'failed', status: 'cancelled' })
            .eq('id', registration_id)
          if (dbErr) console.error('[success] DB update error (failed):', dbErr)
          else console.log('[success] DB updated → failed')
          paymentStatus = 'failed'
        } catch (dbErr) {
          console.error('[success] DB update threw:', dbErr)
          paymentStatus = 'failed'
        }
      } else {
        console.log('[success] Mollie status not actionable:', molliePayment.status)
      }
    } catch (err) {
      console.error('[success] Mollie payments.get threw:', err)
    }
  } else {
    console.log('[success] skipping Mollie check — status:', paymentStatus, '| has mollie id:', !!reg.mollie_payment_id)
  }

  console.log('[success] final paymentStatus:', paymentStatus)

  const isPaid = paymentStatus === 'paid'
  const isFailed = paymentStatus === 'failed'
  const isPending = !paymentStatus || paymentStatus === 'pending'

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">

          {/* Status card */}
          <div className={`rounded-2xl p-8 text-center space-y-4 border shadow-sm ${
            isPaid
              ? 'bg-green-50 border-green-200'
              : isFailed
                ? 'bg-red-50 border-red-200'
                : 'bg-white border-[#D9D9D9]'
          }`}>
            <div className="flex justify-center">
              {isPaid && <CheckCircle2 className="w-16 h-16 text-green-600" />}
              {isFailed && <XCircle className="w-16 h-16 text-red-500" />}
              {isPending && <Clock className="w-16 h-16 text-[#414141]/20 animate-pulse" />}
            </div>

            <h1 className={`text-2xl font-extrabold`} style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: isPaid ? '#166534' : isFailed ? '#991b1b' : '#1B9193' }}>
              {isPaid && 'Betaling geslaagd!'}
              {isFailed && 'Betaling mislukt'}
              {isPending && 'Betaling wordt verwerkt…'}
            </h1>

            <p className={`text-sm leading-relaxed ${
              isPaid ? 'text-green-700/70' : isFailed ? 'text-red-600/70' : 'text-[#414141]/50'
            }`}>
              {isPaid && `Je inschrijving voor "${activity.title}" is bevestigd. Veel plezier!`}
              {isFailed && `De betaling voor "${activity.title}" is niet geslaagd. Je bent niet ingeschreven.`}
              {isPending && 'Dit kan een paar seconden duren. Ververs de pagina als het lang duurt.'}
            </p>

            {isPaid && (
              <div className="bg-white rounded-xl px-4 py-3 text-left space-y-1 border border-[#D9D9D9]">
                <div className="flex items-center gap-2 text-sm text-[#414141]/55">
                  <CalendarDays className="w-4 h-4 shrink-0 text-[#1B9193]/50" />
                  <span>
                    {new Date(activity.date).toLocaleDateString('nl-BE', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                {activity.start_time && (
                  <p className="text-sm text-[#414141]/45 pl-6">
                    {activity.start_time.slice(0, 5)}
                    {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
                  </p>
                )}
                {activity.location && (
                  <p className="text-sm text-[#414141]/45 pl-6">{activity.location}</p>
                )}
              </div>
            )}
          </div>

          {/* Actieknoppen */}
          <div className="flex flex-col gap-3">
            <Link
              href="/activities"
              className="inline-flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-3.5 rounded-[30px] hover:bg-[#8fa030] active:scale-95 transition-all shadow-sm"
            >
              Alle activiteiten
              <ArrowRight className="w-4 h-4" />
            </Link>

            {(isPaid || isPending) && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#414141] font-semibold px-6 py-3.5 rounded-[30px] hover:bg-[#F8F8F8] transition-colors border border-[#D9D9D9] shadow-sm"
              >
                Mijn dashboard
              </Link>
            )}

            {isFailed && (
              <Link
                href="/activities"
                className="inline-flex items-center justify-center gap-2 bg-white text-[#414141] font-semibold px-6 py-3.5 rounded-[30px] hover:bg-[#F8F8F8] transition-colors border border-[#D9D9D9] shadow-sm"
              >
                Opnieuw proberen
              </Link>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
