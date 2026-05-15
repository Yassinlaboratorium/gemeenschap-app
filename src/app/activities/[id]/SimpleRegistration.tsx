'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CreditCard, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { registerForActivity, cancelRegistration } from '@/app/activities/actions'
import type { Activity, Registration } from '@/types/database'

interface Props {
  activity: Activity
  registration?: Registration
  isLoggedIn: boolean
}

export function SimpleRegistration({ activity, registration, isLoggedIn }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const price = Number(activity.price)
  const isPaid = price > 0
  const isConfirmed = registration?.status === 'confirmed'
  const isRegistered = isConfirmed || (!isPaid && !!registration)
  const hasPendingPayment =
    !!registration &&
    registration.status === 'pending' &&
    registration.payment_status === 'pending'

  function handleFree() {
    startTransition(async () => {
      const r = await registerForActivity(activity.id)
      setMsg({ type: r.success ? 'success' : 'error', text: r.message })
      if (r.success) router.refresh()
    })
  }

  async function handlePayment() {
    setIsRedirecting(true)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activity.id }),
      })
      const data = await res.json()
      if (data.payment_url) {
        window.location.href = data.payment_url
        return
      }
      setMsg({ type: 'error', text: data.error ?? 'Betaling aanmaken mislukt.' })
    } catch {
      setMsg({ type: 'error', text: 'Verbindingsfout. Probeer opnieuw.' })
    }
    setIsRedirecting(false)
  }

  function handleCancel() {
    if (!registration) return
    startTransition(async () => {
      const r = await cancelRegistration(registration.id)
      setMsg({ type: r.success ? 'success' : 'error', text: r.message })
      if (r.success) router.refresh()
    })
  }

  return (
    <div className="bg-[#131C31] rounded-[28px] border border-white/5 p-6 space-y-4">
      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${
          msg.type === 'success'
            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {msg.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-1">Prijs</p>
          <p className="text-3xl font-extrabold text-white">
            {price === 0 ? 'Gratis' : `€${price.toFixed(2)}`}
          </p>
        </div>

        <div className="shrink-0">
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all text-sm"
            >
              Log in om in te schrijven
            </Link>

          ) : isRegistered ? (
            registration?.payment_status === 'paid' ? (
              <span className="inline-flex items-center gap-2 bg-white/5 text-white/40 font-semibold px-5 py-2.5 rounded-xl text-sm border border-white/10 cursor-default">
                <CheckCircle2 className="w-4 h-4 text-green-400/60" />
                Betaald – contact ons voor annulering
              </span>
            ) : (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> Ingeschreven
                </span>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="text-sm font-semibold text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Annuleren'}
                </button>
              </div>
            )

          ) : hasPendingPayment ? (
            <button
              onClick={handlePayment}
              disabled={isRedirecting}
              className="inline-flex items-center gap-2 bg-yellow-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-yellow-600 transition-all text-sm disabled:opacity-50"
            >
              {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Betaling afronden
            </button>

          ) : isPaid ? (
            <button
              onClick={handlePayment}
              disabled={isRedirecting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all text-sm disabled:opacity-50"
            >
              {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Inschrijven + betaal €{price.toFixed(2)}
            </button>

          ) : (
            <button
              onClick={handleFree}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all text-sm disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Schrijf in (gratis)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
