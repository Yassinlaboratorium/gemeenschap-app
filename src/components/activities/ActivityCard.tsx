'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, MapPin, Users, Euro, Clock,
  CheckCircle2, AlertCircle, Loader2,
  Palette, Bus, PartyPopper,
} from 'lucide-react'
import { registerForActivity, cancelRegistration } from '@/app/activities/actions'
import type { ActivityWithCount, Registration } from '@/types/database'

const TYPE_CONFIG = {
  workshop: {
    label: 'Workshop',
    icon: Palette,
    badge: 'bg-accent/10 text-accent border border-accent/20',
    bar: 'bg-accent',
  },
  uitstap: {
    label: 'Uitstap',
    icon: Bus,
    badge: 'bg-green-50 text-green-700 border border-green-200',
    bar: 'bg-green-500',
  },
  evenement: {
    label: 'Evenement',
    icon: PartyPopper,
    badge: 'bg-primary/10 text-primary border border-primary/20',
    bar: 'bg-primary',
  },
} as const

interface Props {
  activity: ActivityWithCount
  registration?: Registration
  isLoggedIn: boolean
}

export function ActivityCard({ activity, registration, isLoggedIn }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(t)
  }, [message])

  const config = TYPE_CONFIG[activity.type]
  const TypeIcon = config.icon
  const count = Number(activity.participants_count)
  const max = activity.max_participants
  const isFull = max !== null && count >= max
  const isRegistered = !!registration

  function handleRegister() {
    startTransition(async () => {
      const result = await registerForActivity(activity.id)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success) router.refresh()
    })
  }

  function handleCancel() {
    if (!registration) return
    startTransition(async () => {
      const result = await cancelRegistration(registration.id)
      setMessage({ type: result.success ? 'success' : 'error', text: result.message })
      if (result.success) router.refresh()
    })
  }

  // DD/MM/YYYY
  const [year, month, day] = activity.date.split('-')
  const formattedDate = `${day}/${month}/${year}`

  // HH:MM–HH:MM
  const startTime = activity.start_time?.slice(0, 5)
  const endTime = activity.end_time?.slice(0, 5)
  const timeStr = startTime
    ? endTime
      ? `${startTime}–${endTime}`
      : startTime
    : null

  return (
    <div className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden">
      {/* Gekleurde bovenrand per type */}
      <div className={`h-1.5 w-full ${config.bar}`} />

      <div className="p-5 sm:p-7 space-y-5">

        {/* Type-badge + VOL + Ingeschreven */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${config.badge}`}>
            <TypeIcon className="w-3.5 h-3.5" />
            {config.label}
          </span>

          {isFull && (
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-600 text-white tracking-wide">
              VOL
            </span>
          )}

          {isRegistered && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ingeschreven
            </span>
          )}
        </div>

        {/* Titel */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-dark leading-snug">
          {activity.title}
        </h2>

        {/* Meta-rij */}
        <div className="flex flex-col gap-2 text-sm text-dark/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0 text-dark/30" />
            <span>{formattedDate}</span>
            {timeStr && (
              <>
                <span className="text-dark/20">·</span>
                <Clock className="w-4 h-4 shrink-0 text-dark/30" />
                <span>{timeStr}</span>
              </>
            )}
          </div>

          {activity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-dark/30" />
              <span>{activity.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 shrink-0 text-dark/30" />
            <span className="font-semibold text-dark">
              {Number(activity.price) === 0
                ? 'Gratis'
                : `€${Number(activity.price).toFixed(2)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0 text-dark/30" />
            <span>
              {max ? (
                <>
                  <span className={isFull ? 'text-red-600 font-semibold' : ''}>{count}</span>
                  <span className="text-dark/40">/{max} plaatsen</span>
                </>
              ) : (
                <>{count} ingeschreven</>
              )}
            </span>
          </div>
        </div>

        {/* Beschrijving — volledige tekst */}
        {activity.description && (
          <p className="text-dark/70 leading-relaxed">{activity.description}</p>
        )}

        {/* Actieknop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-dark/5">
          {/* Bericht */}
          {message ? (
            <div
              className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 flex-1 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {message.text}
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Knop */}
          <div className="shrink-0">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-dark/5 text-dark font-semibold px-5 py-2.5 rounded-xl hover:bg-dark/10 transition-colors text-sm"
              >
                Inloggen om in te schrijven
              </Link>
            ) : isRegistered ? (
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : null}
                Annuleren
              </button>
            ) : isFull ? (
              <button
                disabled
                className="inline-flex items-center gap-2 bg-dark/10 text-dark/40 font-semibold px-5 py-2.5 rounded-xl cursor-not-allowed text-sm"
              >
                Vol
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isPending}
                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              >
                {isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-4 h-4" />}
                Schrijf in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
