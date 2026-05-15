'use client'

import { useState, useEffect } from 'react'
import { Download, Share, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem('install-dismissed')) return

    if (isIOS()) {
      // Toon iOS-gids na 3 seconden
      const t = setTimeout(() => setShowIOSGuide(true), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setVisible(false)
    setShowIOSGuide(false)
    setDeferredPrompt(null)
    sessionStorage.setItem('install-dismissed', '1')
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  // Android/Chrome install banner
  if (visible && deferredPrompt) {
    return (
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-[#131C31] border border-white/10 rounded-[20px] p-4 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white font-black text-xs">DG</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Installeer de app</p>
              <p className="text-xs text-white/40 mt-0.5">
                Voeg DE GEMEENSCHAP toe aan je startscherm voor snelle toegang.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={install}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Installeren
                </button>
                <button
                  onClick={dismiss}
                  className="text-xs font-semibold text-white/30 hover:text-white/60 transition-colors px-2 py-1.5"
                >
                  Niet nu
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // iOS gids
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-[#131C31] border border-white/10 rounded-[20px] p-4 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Installeer de app</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  Tik op <Share className="w-3.5 h-3.5 inline text-primary mx-0.5" /> delen
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  Kies <strong className="text-white/70">"Zet op beginscherm"</strong>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  Tik <strong className="text-white/70">"Voeg toe"</strong>
                </div>
              </div>
            </div>
            <button onClick={dismiss} className="text-white/20 hover:text-white/50 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
