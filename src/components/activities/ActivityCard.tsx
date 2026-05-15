'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Users, Euro, Clock,
  CheckCircle2, AlertCircle, Loader2,
  CreditCard, ExternalLink, ArrowRight,
} from 'lucide-react'
import { registerForActivity, cancelRegistration } from '@/app/activities/actions'
import type { ActivityWithCount, Registration } from '@/types/database'

const MONTHS_SHORT = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']

const TAG_STYLES: Record<string, { badge: string; bar: string; dateBg: string; progress: string }> = {
  workshop:  { badge: 'bg-accent/10 text-accent border border-accent/20',           bar: 'bg-accent',   dateBg: 'bg-accent',   progress: 'bg-accent' },
  uitstap:   { badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',     bar: 'bg-blue-400', dateBg: 'bg-blue-500', progress: 'bg-blue-400' },
  evenement: { badge: 'bg-primary/10 text-primary border border-primary/20',        bar: 'bg-primary',  dateBg: 'bg-primary',  progress: 'bg-primary' },
  sport:     { badge: 'bg-green-500/10 text-green-400 border border-green-500/20',  bar: 'bg-green-500',dateBg: 'bg-green-600',progress: 'bg-green-500' },
  kunst:     { badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',bar:'bg-purple-500',dateBg:'bg-purple-600',progress:'bg-purple-500'},
  muziek:    { badge: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',     bar: 'bg-pink-500', dateBg: 'bg-pink-600', progress: 'bg-pink-500' },
}
const DEFAULT_STYLE = { badge: 'bg-white/8 text-white/60 border border-white/10', bar: 'bg-primary', dateBg: 'bg-primary', progress: 'bg-primary' }

function getTagStyle(tag: string) {
  return TAG_STYLES[tag.toLowerCase()] ?? DEFAULT_STYLE
}

interface Props {
  activity: ActivityWithCount
  registration?: Registration
  isLoggedIn: boolean
}

export function ActivityCard({ activity, registration, isLoggedIn }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(t)
  }, [message])

  const firstTag = activity.tags?.[0]
  const config = firstTag ? getTagStyle(firstTag) : DEFAULT_STYLE
  const count = Number(activity.participants_count)
  const max = activity.max_participants
  const price = Number(activity.price)
  const isPaid = price > 0
  const isFull = max !== null && count >= max
  const pct = max ? Math.min(100, Math.round((count / max) * 100)) : 0
  const isBinaVol = max !== null && !isFull && pct >= 80
  const hasSessions = activity.sessions_count > 0

  const isConfirmed = registration?.status === 'confirmed'
  const hasPendingPayment = !!registration && registration.status === 'pending' && registration.payment_status === 'pending'
  const isRegistered = isConfirmed || (!isPaid && !!registration)

  function handleRegisterFree() {
    startTransition(async () => {
      const result = await registerForActivity(activity.id)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success) router.refresh()
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
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Betaling aanmaken mislukt.' })
        setIsRedirecting(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Verbindingsfout. Probeer opnieuw.' })
      setIsRedirecting(false)
    }
  }

  function handleCancel() {
    if (!registration) return
    startTransition(async () => {
      const result = await cancelRegistration(registration.id)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success) router.refresh()
    })
  }

  const [, month, day] = activity.date.split('-')
  const monthShort = MONTHS_SHORT[parseInt(month, 10) - 1]
  const startTime = activity.start_time?.slice(0, 5)
  const endTime = activity.end_time?.slice(0, 5)
  const timeStr = startTime ? (endTime ? `${startTime}–${endTime}` : startTime) : null
  const isLoading = isPending || isRedirecting

  return (
    <div className="group bg-[#131C31] rounded-[28px] border border-white/5 overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300">
      <div className={`h-1.5 w-full ${config.bar}`} />

      <div className="p-5 sm:p-7 space-y-5">

        {/* Badge rij */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`${config.dateBg} text-white rounded-xl px-3 py-1.5 flex flex-col items-center leading-none min-w-[44px]`}>
            <span className="text-lg font-extrabold leading-none">{day}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">{monthShort}</span>
          </div>

          {activity.tags?.map(tag => (
            <span key={tag} className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ${getTagStyle(tag).badge}`}>
              {tag}
            </span>
          ))}

          {hasSessions && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 text-white/40 border border-white/10">
              {activity.sessions_count} sessies
            </span>
          )}

          {isFull && !hasSessions && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 text-white tracking-wide">VOL</span>
          )}
          {isBinaVol && !hasSessions && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Bijna vol
            </span>
          )}
          {isRegistered && !hasSessions && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ingeschreven
            </span>
          )}
          {hasPendingPayment && !hasSessions && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <Clock className="w-3.5 h-3.5" />
              Betaling in afwachting
            </span>
          )}
        </div>

        {/* Titel */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
          {activity.title}
        </h2>

        {/* Meta */}
        <div className="flex flex-col gap-2 text-sm text-[#a0a0a0]">
          {timeStr && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-white/20" />
              <span>{timeStr}</span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-white/20" />
              <span>{activity.location}</span>
            </div>
          )}
          {!hasSessions && (
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 shrink-0 text-white/20" />
              <span className="font-semibold text-white">
                {price === 0 ? 'Gratis' : `€${price.toFixed(2)}`}
              </span>
            </div>
          )}
        </div>

        {/* Beschrijving */}
        {activity.description && (
          <p className="text-[#a0a0a0] leading-relaxed">{activity.description}</p>
        )}

        {/* Capaciteitsbar — alleen voor non-sessie activiteiten */}
        {!hasSessions && max !== null ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-white/30">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span className={isFull ? 'text-red-400 font-semibold' : ''}>{count}</span>
                <span>/ {max} plaatsen</span>
              </span>
              <span className={isFull ? 'text-red-400 font-semibold' : isBinaVol ? 'text-orange-400 font-semibold' : ''}>
                {isFull ? 'Vol' : `${max - count} vrij`}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : isBinaVol ? 'bg-orange-500' : config.progress}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : !hasSessions ? (
          <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
            <Users className="w-4 h-4 shrink-0 text-white/20" />
            <span>{count} ingeschreven</span>
          </div>
        ) : null}

        {/* Actierij */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
          {message && !hasSessions ? (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 flex-1 ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          ) : isRedirecting && !hasSessions ? (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 flex-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Je wordt doorgestuurd naar de betaalpagina…
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <div className="shrink-0">
            {/* Activiteit met sessies → naar detailpagina */}
            {hasSessions ? (
              <Link
                href={`/activities/${activity.id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all text-sm"
              >
                Bekijk & inschrijven
                <ArrowRight className="w-4 h-4" />
              </Link>

            ) : !isLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white/8 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/12 transition-colors text-sm border border-white/10"
              >
                Inloggen om in te schrijven
              </Link>

            ) : isRegistered ? (
              registration?.payment_status === 'paid' ? (
                <span className="inline-flex items-center gap-2 bg-white/5 text-white/40 font-semibold px-5 py-2.5 rounded-xl text-sm border border-white/10 cursor-default">
                  <CheckCircle2 className="w-4 h-4 text-green-400/60" />
                  Betaald – contact ons voor annulering
                </span>
              ) : (
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Annuleren
                </button>
              )

            ) : hasPendingPayment ? (
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-yellow-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-yellow-600 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Betaling afronden
              </button>

            ) : isFull ? (
              <button disabled className="inline-flex items-center gap-2 bg-white/5 text-white/30 font-semibold px-5 py-2.5 rounded-xl cursor-not-allowed text-sm">
                Vol
              </button>

            ) : isPaid ? (
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Inschrijven + betaal €{price.toFixed(2)}
              </button>

            ) : (
              <button
                onClick={handleRegisterFree}
                disabled={isLoading}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Schrijf in
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
