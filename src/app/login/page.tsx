'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-dark group-hover:text-primary transition-colors">
          vzw De Gemeenschap
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-dark">Welkom terug</h1>
          <p className="text-dark/50 mt-1 text-sm">Log in op je account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-dark/5 p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <p className="text-center text-sm text-dark/50 pt-1">
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
