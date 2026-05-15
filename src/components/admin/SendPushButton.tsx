'use client'

import { useState } from 'react'
import { Bell, X, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export function SendPushButton() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('/activities')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const INPUT = 'w-full px-3 py-2 rounded-xl border border-white/10 bg-[#1a2942] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors'

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
      const data = await res.json() as { sent?: number; failed?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Onbekende fout')
      setResult({ sent: data.sent ?? 0, failed: data.failed ?? 0 })
      setTitle('')
      setBody('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); setError(null) }}
        className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/25 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
      >
        <Bell className="w-4 h-4" />
        Push sturen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#131C31] rounded-[28px] border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <p className="font-bold text-white">Push notificatie</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              {result && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Verzonden naar {result.sent} subscriber{result.sent !== 1 ? 's' : ''}
                  {result.failed > 0 && ` (${result.failed} mislukt)`}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">Titel</label>
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
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">Bericht</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="bv. Schrijf je nu in voor het zomerkamp van 5-12 augustus!"
                  className={`${INPUT} resize-none h-20`}
                  maxLength={160}
                />
                <p className="text-xs text-white/20 text-right">{body.length}/160</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider">Link (optioneel)</label>
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
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Verzenden…' : 'Verzenden naar alle subscribers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
