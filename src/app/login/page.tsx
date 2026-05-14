'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Wachtwoord succesvol gewijzigd! Je kunt nu inloggen.')
    } else if (searchParams.get('registered') === '1') {
      setSuccessMessage('Account aangemaakt! Log nu in.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mailadres of wachtwoord klopt niet.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      {/* Branding */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-black text-xs">DG</span>
        </div>
        <span className="font-black text-white group-hover:text-primary transition-colors tracking-tight">
          DE GEMEENSCHAP
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white">Welkom terug</h1>
          <p className="text-[#a0a0a0] mt-1 text-sm">Log in op je account</p>
        </div>

        <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-8 space-y-5">
          {successMessage && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="E-mailadres"
              icon={Mail}
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.be"
              autoComplete="email"
            />

            <div>
              <FormInput
                label="Wachtwoord"
                icon={Lock}
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
              />
              <div className="text-right mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
                >
                  Wachtwoord vergeten?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <p className="text-center text-sm text-[#a0a0a0] pt-1">
            Nog geen account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Registreer je hier
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
