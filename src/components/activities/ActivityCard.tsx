'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, MapPin, Users, Euro, Clock,
  CheckCircle2, AlertCircle, XCircle, Loader2,
} from 'lucide-react'
import { registerForActivity, cancelRegistration } from '@/app/activities/actions'
import type { ActivityWithCount, Registration } from '@/types/database'

const TYPE_LABELS = { workshop: 'Workshop', uitstap: 'Uitstap', evenement: 'Evenement' } as const
const TYPE_COLORS = {
  workshop: 'bg-accent/10 text-accent',
  uitstap: 'bg-green-100 text-green-700',
  evenement: 'bg-primary/10 text-primary',
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

  const isFull =
    activity.max_participants !== null &&
    Number(activity.participants_count) >= activity.max_participants
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

  const formattedDate = new Date(activity.date).toLocaleDateString('nl-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const shortDescription = activity.description
    ? activity.description.length > 150
      ? activity.description.slice(0, 150).trimEnd() + '…'
      : activity.description
    : null

  return (
    <div className="bg-white rounded-2xl border border-dark/5 shadow-sm overflow-hidden">
      {/* Gekleurde bovenrand per type */}
      <div
        className={`h-1 w-full ${
          activity.type === 'workshop'
            ? 'bg-accent'
            : activity.type === 'uitstap'
            ? 'bg-green-500'
            : 'bg-primary'
        }`}
      />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Badges + titel */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_COLORS[activity.type]}`}>
              {TYPE_LABELS[activity.type]}
            </span>
            {isFull && !isRegistered && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                Vol
              </span>
            )}
            {isRegistered && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ingeschreven
              </span>
            )}
          </div>
          <h2 className="font-bold text-dark text-xl leading-snug">{activity.title}</h2>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-dark/50">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="capitalize">{formattedDate}</span>
          </span>
          {(activity.start_time || activity.end_time) && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0" />
              {activity.start_time?.slice(0, 5)}
              {activity.end_time && `–${activity.end_time.slice(0, 5)}`}
            </span>
          )}
          {activity.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              {activity.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Euro className="w-4 h-4 shrink-0" />
            {Number(activity.price) === 0 ? 'Gratis' : `€${Number(activity.price).toFixed(2)}`}
          </span>
        </div>

        {/* Beschrijving */}
        {shortDescription && (
          <p className="text-dark/60 text-sm leading-relaxed">{shortDescription}</p>
        )}

        {/* Footer: deelnemers + actie */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-dark/5">
          {/* Deelnemers */}
          <span className="flex items-center gap-1.5 text-sm text-dark/40 font-medium">
            <Users className="w-4 h-4" />
            {Number(activity.participants_count)}
            {activity.max_participants ? `/${activity.max_participants}` : ''} ingeschreven
            {isFull && activity.max_participants && (
              <span className="text-red-500 font-semibold ml-1">· vol</span>
            )}
          </span>

          {/* Actieknop */}
          <div className="flex items-center gap-2 shrink-0">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Inloggen om in te schrijven
              </Link>
            ) : isRegistered ? (
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1.5 text-sm font-semibold text-dark/40 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Annuleren
              </button>
            ) : (
              <button
                onClick={handleRegister}
                disabled={isPending || isFull}
                className="flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isFull ? 'Vol' : 'Schrijf in'}
              </button>
            )}
          </div>
        </div>

        {/* Bericht */}
        {message && (
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
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
        )}
      </div>
    </div>
  )
}
