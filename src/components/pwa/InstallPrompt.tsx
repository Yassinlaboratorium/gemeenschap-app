'use client'

import { useState, useEffect } from 'react'
import { Download, Share, X, Smartphone } from 'lucide-react'
import Image from 'next/image'

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
        <div className="bg-white border border-[#D9D9D9] rounded-[20px] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8F8F8] border border-[#D9D9D9] flex items-center justify-center shrink-0 mt-0.5 p-1.5">
              <Image src="/logo.png" alt="" width={40} height={9} className="w-full h-auto object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#414141] text-sm">Installeer de app</p>
              <p className="text-xs text-[#414141]/50 mt-0.5">
                Voeg DE GEMEENSCHAP toe aan je startscherm voor snelle toegang.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={install}
                  className="flex items-center gap-1.5 bg-[#9FB139] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg hover:bg-[#8fa030] transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Installeren
                </button>
                <button
                  onClick={dismiss}
                  className="text-xs font-semibold text-[#414141]/40 hover:text-[#414141]/70 transition-colors px-2 py-1.5"
                >
                  Niet nu
                </button>
              </div>
            </div>
            <button onClick={dismiss} className="text-[#414141]/25 hover:text-[#414141]/55 transition-colors shrink-0">
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
        <div className="bg-white border border-[#D9D9D9] rounded-[20px] p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9FB139]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5 text-[#9FB139]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#414141] text-sm">Installeer de app</p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[#414141]/50">
                  <span className="w-5 h-5 rounded-full bg-[#9FB139]/15 text-[#9FB139] font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  Tik op <Share className="w-3.5 h-3.5 inline text-[#9FB139] mx-0.5" /> delen
                </div>
                <div className="flex items-center gap-2 text-xs text-[#414141]/50">
                  <span className="w-5 h-5 rounded-full bg-[#9FB139]/15 text-[#9FB139] font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  Kies <strong className="text-[#414141]/75">"Zet op beginscherm"</strong>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#414141]/50">
                  <span className="w-5 h-5 rounded-full bg-[#9FB139]/15 text-[#9FB139] font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  Tik <strong className="text-[#414141]/75">"Voeg toe"</strong>
                </div>
              </div>
            </div>
            <button onClick={dismiss} className="text-[#414141]/25 hover:text-[#414141]/55 transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
