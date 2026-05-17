'use client'

import { useState } from 'react'
import { Bell, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function SendPushButton() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/activities')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const INPUT = 'w-full px-3 py-2 rounded-xl border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/30 focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] text-sm transition-colors'

  async function send() {
    if (!title.trim() || !body.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url }),
      })
      const data = await res.json() as { sent?: number; failed?: number; error?: string; errors?: string[] }
      if (!res.ok) throw new Error(data.error ?? 'Onbekende fout')
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0, errors: data.errors })
      setTitle('')
      setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout')
    } finally {
      setLoading(false)
    }
  }

  async function clearSubscriptions() {
    if (!confirm('Alle push subscriptions verwijderen? Gebruikers moeten opnieuw toestemming geven.')) return
    setClearing(true)
    try {
      const res = await fetch('/api/push/clear', { method: 'DELETE' })
      const data = await res.json() as { deleted?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Fout')
      alert(`${data.deleted ?? 0} subscription(s) verwijderd. Gebruikers kunnen nu opnieuw subscriben.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Fout bij verwijderen')
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); setError(null) }}
        className="flex items-center gap-2 bg-[#F8F8F8] border border-[#D9D9D9] text-[#414141]/55 hover:text-[#414141] hover:border-[#9FB139]/40 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
      >
        <Bell className="w-4 h-4" />
        Push sturen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#D9D9D9] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#D9D9D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#9FB139]/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#9FB139]" />
                </div>
                <p className="font-bold text-[#414141]">Push notificatie</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#414141]/35 hover:text-[#414141] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              {result && (
                <div className={`rounded-xl px-4 py-3 text-sm border ${result.failed > 0 && result.sent === 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Verzonden naar {result.sent} subscriber{result.sent !== 1 ? 's' : ''}
                    {result.failed > 0 && ` (${result.failed} mislukt)`}
                  </div>
                  {result.errors?.map((e, i) => (
                    <p key={i} className="mt-1 text-xs opacity-70 font-mono break-all">{e}</p>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#414141]/50 uppercase tracking-wider">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="bv. Nieuwe activiteit: Zomerkamp 2026"
                  className={INPUT}
                  maxLength={80}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#414141]/50 uppercase tracking-wider">Bericht</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="bv. Schrijf je nu in voor het zomerkamp van 5-12 augustus!"
                  className={`${INPUT} resize-none h-20`}
                  maxLength={160}
                />
                <p className="text-xs text-[#414141]/30 text-right">{body.length}/160</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#414141]/50 uppercase tracking-wider">Link (optioneel)</label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="/activities"
                  className={INPUT}
                />
              </div>

              <button
                onClick={send}
                disabled={loading || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#9FB139] text-white font-semibold py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all disabled:opacity-50 text-sm shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Verzenden…' : 'Verzenden naar alle subscribers'}
              </button>

              <button
                onClick={clearSubscriptions}
                disabled={clearing}
                className="w-full text-xs text-[#414141]/30 hover:text-red-500 transition-colors py-1"
              >
                {clearing ? 'Verwijderen…' : 'Reset alle subscriptions (na VAPID key wissel)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
