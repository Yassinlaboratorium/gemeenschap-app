'use client'

import { useState, useEffect, useCallback } from 'react'
import { HelpCircle, X, ChevronDown, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const QUICK_STEPS = [
  {
    id: 'activiteit',
    icon: '➕',
    title: 'Activiteit aanmaken',
    steps: [
      'Ga naar Admin → Activiteiten',
      'Klik op "+ Nieuwe activiteit" rechtsboven',
      'Vul naam, datum, locatie en prijs in',
      'Klik op "Activiteit aanmaken" — klaar!',
    ],
  },
  {
    id: 'inschrijvingen',
    icon: '👥',
    title: 'Inschrijvingen bekijken',
    steps: [
      'Ga naar Admin → Activiteiten',
      'Klik op "inschrijvingen" naast de activiteit',
      'Bekijk de lijst of klik "Exporteer Excel"',
    ],
  },
  {
    id: 'push',
    icon: '🔔',
    title: 'Push notificatie sturen',
    steps: [
      'Ga naar Admin → Activiteiten',
      'Klik op "Push sturen" rechtsboven',
      'Vul titel + bericht in en klik "Verzenden"',
    ],
  },
]

const FAQS = [
  {
    q: 'Ik zie de "Nieuwe activiteit" knop niet.',
    a: 'Je bent waarschijnlijk niet ingelogd als admin. Log uit en terug in met een admin-account.',
  },
  {
    q: 'Een ouder ziet de activiteit niet.',
    a: 'Controleer of de datum in de toekomst ligt — afgelopen activiteiten worden automatisch verborgen.',
  },
  {
    q: 'Push notificaties komen niet aan.',
    a: 'De gebruiker moet toestemming hebben gegeven via het belletje-icoontje in de app. Controleer ook de telefooninstellingen.',
  },
  {
    q: 'Hoe verwijder ik een activiteit?',
    a: 'Klik op het vuilbak-icoon naast de activiteit. Exporteer eerst de inschrijvingen als je ze wil bewaren.',
  },
  {
    q: 'Kan ik meerdere sessies toevoegen aan één activiteit?',
    a: 'Ja — kies het type "Sessie-gebaseerd" bij het aanmaken. Je kan dan meerdere data en tijdstippen toevoegen.',
  },
]

type Tab = 'quickstart' | 'faq' | 'contact'

export function HelpModal() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('quickstart')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeTask, setActiveTask] = useState(0)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#414141] px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Help</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="w-full max-w-2xl bg-white border border-[#D9D9D9] rounded-[28px] shadow-2xl flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#D9D9D9] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#9FB139]/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#9FB139]" />
                </div>
                <div>
                  <p className="font-bold text-[#414141] text-sm">Handleiding</p>
                  <p className="text-xs text-[#414141]/45">DE GEMEENSCHAP Admin</p>
                </div>
              </div>
              <button onClick={close} className="text-[#414141]/25 hover:text-[#414141] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#D9D9D9] px-6 shrink-0">
              {(['quickstart', 'faq', 'contact'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                    tab === t
                      ? 'text-[#9FB139] border-[#9FB139]'
                      : 'text-[#414141]/35 border-transparent hover:text-[#414141]/60'
                  }`}
                >
                  {t === 'quickstart' ? '⚡ Snelle start' : t === 'faq' ? '❓ FAQ' : '📧 Contact'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── QUICK START ── */}
              {tab === 'quickstart' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#414141]/45 mb-5">Klik op een taak om de stappen te zien.</p>
                  {QUICK_STEPS.map((task, i) => (
                    <div key={task.id} className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-2xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                        onClick={() => setActiveTask(activeTask === i ? -1 : i)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{task.icon}</span>
                          <span className="font-semibold text-[#414141] text-sm">{task.title}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-[#414141]/30 transition-transform ${activeTask === i ? 'rotate-180' : ''}`} />
                      </button>
                      {activeTask === i && (
                        <div className="px-5 pb-5 space-y-2">
                          {task.steps.map((step, j) => (
                            <div key={j} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#9FB139]/20 text-[#9FB139] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {j + 1}
                              </div>
                              <p className="text-sm text-[#414141]/65 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <Link
                    href="/admin/handleiding"
                    onClick={close}
                    className="flex items-center justify-center gap-2 w-full mt-4 bg-[#9FB139]/8 border border-[#9FB139]/20 text-[#9FB139] text-sm font-semibold py-3 rounded-xl hover:bg-[#9FB139]/15 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Volledige handleiding openen
                  </Link>
                </div>
              )}

              {/* ── FAQ ── */}
              {tab === 'faq' && (
                <div className="space-y-2">
                  {FAQS.map((item, i) => (
                    <div key={i} className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      >
                        <span className="font-semibold text-[#414141]/80 text-sm leading-snug">{item.q}</span>
                        <ChevronDown className={`w-4 h-4 text-[#414141]/25 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === i && (
                        <p className="px-5 pb-4 text-sm text-[#414141]/60 leading-relaxed">{item.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── CONTACT ── */}
              {tab === 'contact' && (
                <div className="space-y-4">
                  <div className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-2xl p-5">
                    <p className="text-sm font-bold text-[#414141] mb-1">📧 E-mail support</p>
                    <p className="text-sm text-[#414141]/50 mb-3">Voor technische vragen of problemen met de app.</p>
                    <a href="mailto:info@degemeenschap.be" className="text-[#9FB139] text-sm font-semibold hover:underline">
                      info@degemeenschap.be
                    </a>
                  </div>
                  <div className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-2xl p-5">
                    <p className="text-sm font-bold text-[#414141] mb-1">🌐 Website</p>
                    <p className="text-sm text-[#414141]/50 mb-3">Meer informatie over vzw De Gemeenschap.</p>
                    <a href="https://degemeenschap.be" target="_blank" rel="noopener noreferrer" className="text-[#9FB139] text-sm font-semibold hover:underline flex items-center gap-1">
                      degemeenschap.be <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="bg-[#F8F8F8] border border-[#D9D9D9] rounded-2xl p-5">
                    <p className="text-sm font-bold text-[#414141] mb-1">📖 Handleiding</p>
                    <p className="text-sm text-[#414141]/50 mb-3">Uitgebreide stap-voor-stap instructies.</p>
                    <Link href="/admin/handleiding" onClick={close} className="text-[#9FB139] text-sm font-semibold hover:underline flex items-center gap-1">
                      Admin handleiding <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
