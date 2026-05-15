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
    <div className="min-h-screen bg-secondary flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full space-y-6">

          {/* Status card */}
          <div className={`rounded-2xl p-8 text-center space-y-4 border ${
            isPaid
              ? 'bg-green-500/10 border-green-500/20'
              : isFailed
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-[#131C31] border-white/5'
          }`}>
            <div className="flex justify-center">
              {isPaid && <CheckCircle2 className="w-16 h-16 text-green-400" />}
              {isFailed && <XCircle className="w-16 h-16 text-red-400" />}
              {isPending && <Clock className="w-16 h-16 text-white/20 animate-pulse" />}
            </div>

            <h1 className={`text-2xl font-extrabold ${
              isPaid ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-white'
            }`}>
              {isPaid && 'Betaling geslaagd!'}
              {isFailed && 'Betaling mislukt'}
              {isPending && 'Betaling wordt verwerkt…'}
            </h1>

            <p className={`text-sm leading-relaxed ${
              isPaid ? 'text-green-400/70' : isFailed ? 'text-red-400/70' : 'text-white/40'
            }`}>
              {isPaid && `Je inschrijving voor "${activity.title}" is bevestigd. Veel plezier!`}
              {isFailed && `De betaling voor "${activity.title}" is niet geslaagd. Je bent niet ingeschreven.`}
              {isPending && 'Dit kan een paar seconden duren. Ververs de pagina als het lang duurt.'}
            </p>

            {isPaid && (
              <div className="bg-white/5 rounded-xl px-4 py-3 text-left space-y-1 border border-white/10">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <CalendarDays className="w-4 h-4 shrink-0 text-white/25" />
                  <span>
                    {new Date(activity.date).toLocaleDateString('nl-BE', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
                {activity.start_time && (
                  <p className="text-sm text-white/40 pl-6">
                    {activity.start_time.slice(0, 5)}
                    {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
                  </p>
                )}
                {activity.location && (
                  <p className="text-sm text-white/40 pl-6">{activity.location}</p>
                )}
              </div>
            )}
          </div>

          {/* Actieknoppen */}
          <div className="flex flex-col gap-3">
            <Link
              href="/activities"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-accent active:scale-95 transition-all"
            >
              Alle activiteiten
              <ArrowRight className="w-4 h-4" />
            </Link>

            {(isPaid || isPending) && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white/8 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/12 transition-colors border border-white/10"
              >
                Mijn dashboard
              </Link>
            )}

            {isFailed && (
              <Link
                href="/activities"
                className="inline-flex items-center justify-center gap-2 bg-white/8 text-white font-semibold px-6 py-3.5 rounded-2xl hover:bg-white/12 transition-colors border border-white/10"
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
