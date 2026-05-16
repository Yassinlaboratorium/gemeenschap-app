'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      setError('Er ging iets mis. Probeer het opnieuw.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-2">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Check je inbox!</h1>
          <p className="text-[#a0a0a0] text-sm leading-relaxed">
            We hebben een reset-link gestuurd naar{' '}
            <span className="text-white font-semibold">{email}</span>.
            <br />
            Klik op de link in de mail om je wachtwoord te wijzigen.
          </p>
          <Link
            href="/login"
            className="inline-block text-primary font-semibold hover:underline text-sm mt-2"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 block">
        <Image src="/logo.png" alt="DE GEMEENSCHAP" width={160} height={34} className="h-8 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-white">Wachtwoord vergeten?</h1>
          <p className="text-[#a0a0a0] mt-1 text-sm">
            Vul je e-mailadres in en we sturen je een reset-link.
          </p>
        </div>

        <div className="bg-[#131C31] rounded-[32px] border border-white/5 p-8 space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-semibold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Stuur reset-link'}
            </button>
          </form>

          <p className="text-center text-sm text-[#a0a0a0] pt-1">
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Terug naar inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
