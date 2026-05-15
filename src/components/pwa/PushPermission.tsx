'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

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

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })

      setState('granted')
    } catch {
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
      <div className="bg-[#131C31] border border-white/10 rounded-[20px] p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Blijf op de hoogte</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              Ontvang een melding bij nieuwe activiteiten en updates.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={requestPermission}
                disabled={state === 'loading'}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
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
                className="text-xs font-semibold text-white/30 hover:text-white/60 transition-colors px-2 py-1.5"
              >
                Niet nu
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-white/20 hover:text-white/50 transition-colors shrink-0"
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
      className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-colors"
      title={state === 'granted' ? 'Meldingen uitschakelen' : 'Meldingen inschakelen'}
    >
      {state === 'granted'
        ? <Bell className="w-4 h-4 text-primary" />
        : <BellOff className="w-4 h-4" />}
    </button>
  )
}
