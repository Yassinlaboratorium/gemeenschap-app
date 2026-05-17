'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

type PermissionState = 'idle' | 'granted' | 'denied' | 'unsupported' | 'loading'

export function PushPermission() {
  const [state, setState] = useState<PermissionState>('idle')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'granted') setState('granted')
    if (Notification.permission === 'denied') setState('denied')

    const key = 'push-prompt-dismissed'
    if (sessionStorage.getItem(key)) setDismissed(true)

    // Geen banner tonen voor niet-ingelogde gebruikers
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) setDismissed(true)
    })
  }, [])

  async function requestPermission() {
    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const json = sub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })

      if (!res.ok) {
        console.error('[push] subscribe failed:', res.status, await res.text())
        setState('idle')
        return
      }

      setState('granted')
    } catch (err) {
      console.error('[push] requestPermission error:', err)
      setState('idle')
    }
  }

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('push-prompt-dismissed', '1')
  }

  // Al toegestaan of niet ondersteund of weggedrukt → niets tonen
  if (state === 'granted' || state === 'unsupported' || dismissed) return null
  // Geweigerd → toon meldingsloos bericht
  if (state === 'denied') return null

  return (
    <div className="fixed bottom-20 inset-x-4 sm:bottom-6 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-[#D9D9D9] rounded-[20px] p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9FB139]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-[#9FB139]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#414141] text-sm">Blijf op de hoogte</p>
            <p className="text-xs text-[#414141]/50 mt-0.5 leading-relaxed">
              Ontvang een melding bij nieuwe activiteiten en updates.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={requestPermission}
                disabled={state === 'loading'}
                className="flex items-center gap-1.5 bg-[#9FB139] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-[#8fa030] transition-all disabled:opacity-60 shadow-sm"
              >
                {state === 'loading' ? (
                  <span className="animate-pulse">Bezig…</span>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Inschakelen
                  </>
                )}
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-semibold text-[#414141]/40 hover:text-[#414141]/70 transition-colors px-2 py-1.5"
              >
                Niet nu
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-[#414141]/25 hover:text-[#414141]/55 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function PushToggle() {
  const [state, setState] = useState<'idle' | 'granted' | 'denied' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('Notification' in window)) { setState('unsupported'); return }
    setState(Notification.permission as 'granted' | 'denied' | 'idle')
  }, [])

  async function toggle() {
    if (state === 'granted') {
      // Uitschrijven
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
        setState('idle')
      }
    } else {
      // Inschrijven via PushPermission flow — reload
      window.location.reload()
    }
  }

  if (state === 'unsupported') return null

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-sm font-semibold text-[#414141]/45 hover:text-[#414141] transition-colors"
      title={state === 'granted' ? 'Meldingen uitschakelen' : 'Meldingen inschakelen'}
    >
      {state === 'granted'
        ? <Bell className="w-4 h-4 text-[#9FB139]" />
        : <BellOff className="w-4 h-4" />}
    </button>
  )
}
