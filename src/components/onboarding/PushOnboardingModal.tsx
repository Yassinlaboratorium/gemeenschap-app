'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'push_onboarding_completed'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export default function PushOnboardingModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (localStorage.getItem(STORAGE_KEY)) return
    if (Notification.permission === 'granted') {
      localStorage.setItem(STORAGE_KEY, 'true')
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const t = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(t)
    })
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
  }

  async function handleEnable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
          ),
        })

        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        })

        if (!res.ok) {
          console.error('[push onboarding] subscribe failed:', res.status)
        }
      }
    } catch (err) {
      console.error('[push onboarding] error:', err)
    } finally {
      setLoading(false)
      dismiss()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-modal-backdrop"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="push-modal-title"
          className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 pointer-events-auto animate-modal-panel"
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            aria-label="Sluiten"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#414141]/30 hover:text-[#414141]/60 hover:bg-[#F8F8F8] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#9FB139]/10 flex items-center justify-center">
            <Bell className="w-8 h-8 text-[#9FB139]" />
          </div>

          {/* Heading */}
          <h2
            id="push-modal-title"
            className="text-xl font-black text-center mb-2"
            style={{ color: '#414141' }}
          >
            Mis geen enkele activiteit
          </h2>
          <p className="text-sm text-center text-[#414141]/55 mb-6 leading-relaxed">
            Ontvang direct een melding bij nieuwe activiteiten, wijzigingen en belangrijke updates.
          </p>

          {/* Benefits */}
          <ul className="space-y-2.5 mb-7">
            {[
              'Direct op de hoogte van nieuwe activiteiten',
              'Meldingen bij wijzigingen in jouw inschrijvingen',
              'Nooit een deadline of datum missen',
            ].map(text => (
              <li key={text} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[#9FB139]/12 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#9FB139]" strokeWidth={3} />
                </span>
                <span className="text-sm text-[#414141]">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-2.5">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#9FB139] hover:bg-[#8fa030] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig…
                </span>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Notificaties aanzetten
                </>
              )}
            </button>

            <button
              onClick={dismiss}
              disabled={loading}
              className="w-full text-sm font-semibold text-[#414141]/45 hover:text-[#414141]/70 py-2.5 transition-colors disabled:opacity-50"
            >
              Misschien later
            </button>
          </div>

          <p className="text-xs text-[#414141]/30 text-center mt-5 leading-relaxed">
            Je kunt notificaties op elk moment aanpassen via je apparaatinstellingen.
          </p>
        </div>
      </div>
    </>
  )
}
