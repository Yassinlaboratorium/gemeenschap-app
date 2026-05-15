'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function StrengthBar({ password }: { password: string }) {
  const score = getStrengthScore(password)
  const labels = ['', 'Zwak', 'Matig', 'Goed', 'Sterk']
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

  if (!password) return null

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= score ? colors[score] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-orange-400' : score === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
        {labels[score]}
      </p>
    </div>
  )
}

function getStrengthScore(pw: string): number {
  if (pw.length < 6) return 1
  let score = 1
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    // Na 6 seconden: toon foutmelding als de link niet herkend werd
    const timer = setTimeout(() => setTimedOut(true), 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten.')
      return
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Wachtwoord wijzigen mislukt. Vraag een nieuwe reset-link aan.')
      setLoading(false)
      return
    }

    router.push('/login?reset=success')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#131C31] border border-white/5 mb-2">
            <ShieldCheck className={`w-7 h-7 text-primary ${timedOut ? '' : 'animate-pulse'}`} />
          </div>
          {timedOut ? (
            <>
              <h1 className="text-xl font-extrabold text-white">Link ongeldig of verlopen</h1>
              <p className="text-[#a0a0a0] text-sm">
                Deze reset-link werkt niet meer.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-gradient-to-r from-primary to-accent text-white font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 transition-all text-sm"
              >
                Nieuwe reset-link aanvragen
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-white">Link controleren…</h1>
              <p className="text-[#a0a0a0] text-sm">
                Geen link of verlopen?{' '}
                <Link href="/forgot-password" className="text-primary font-semibold hover:underline">
                  Vraag een nieuwe aan
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-black text-xs">DG</span>
        </div>
        <span className="font-black text-white group-hover:text-primary transition-colors tracking-tight">
          DE GEMEENSCHAP
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white">Nieuw wachtwoord</h1>
          <p className="text-[#a0a0a0] mt-1 text-sm">Kies een sterk wachtwoord voor je account.</p>
        </div>

        <div className="bg-[#131C31] rounded-[32px] border border-white/5 p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nieuw wachtwoord */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-white mb-1.5">
                Nieuw wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimaal 6 tekens"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/5 bg-[#1a2942] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <StrengthBar password={password} />
            </div>

            {/* Bevestig wachtwoord */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-white mb-1.5">
                Bevestig wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Herhaal je wachtwoord"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-[#1a2942] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm transition-colors ${
                    confirm && confirm !== password
                      ? 'border-red-500/50 focus:border-red-500'
                      : confirm && confirm === password
                        ? 'border-green-500/50 focus:border-green-500'
                        : 'border-white/5 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1">Wachtwoorden komen niet overeen.</p>
              )}
              {confirm && confirm === password && (
                <p className="text-xs text-green-400 mt-1">Wachtwoorden komen overeen.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-semibold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
