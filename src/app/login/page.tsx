'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'

const INPUT = 'w-full px-4 py-2.5 rounded-[30px] border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/35 focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] text-sm transition-colors'

function LoginForm() {
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
    <div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 space-y-5 shadow-sm">
      {successMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
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
              className="text-xs text-[#9FB139] font-semibold hover:text-[#8fa030] transition-colors"
            >
              Wachtwoord vergeten?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#9FB139] text-white font-semibold py-2.5 rounded-[30px] hover:bg-[#8fa030] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-sm"
        >
          <LogIn className="w-4 h-4" />
          {loading ? 'Bezig...' : 'Inloggen'}
        </button>
      </form>

      <p className="text-center text-sm text-[#414141]/50 pt-1">
        Nog geen account?{' '}
        <Link href="/register" className="text-[#1B9193] font-semibold hover:underline">
          Registreer je hier
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 block">
        <Image src="/logo.png" alt="DE GEMEENSCHAP" width={160} height={34} className="h-8 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Welkom terug</h1>
          <p className="text-[#414141]/50 mt-1 text-sm">Log in op je account</p>
        </div>

        <Suspense fallback={<div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
