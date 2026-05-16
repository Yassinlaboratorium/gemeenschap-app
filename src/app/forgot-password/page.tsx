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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const options = appUrl
      ? { redirectTo: `${appUrl}/reset-password` }
      : {}

    const { error } = await supabase.auth.resetPasswordForEmail(email, options)

    if (error) {
      console.error('[forgot-password] Supabase error:', error.message, error)
      // Vertaal bekende Supabase-fouten naar duidelijke meldingen
      const msg = error.message.toLowerCase()
      if (msg.includes('not allowed') || msg.includes('redirect')) {
        setError('Configuratiefout: redirect URL niet toegestaan. Neem contact op met de beheerder.')
      } else if (msg.includes('rate') || msg.includes('limit')) {
        setError('Te veel pogingen. Wacht even en probeer opnieuw.')
      } else if (msg.includes('smtp') || msg.includes('email') || msg.includes('send')) {
        setError('E-mail kon niet worden verstuurd. Probeer het later opnieuw.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#9FB139] mb-2 shadow-sm">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Check je inbox!</h1>
          <p className="text-[#414141]/55 text-sm leading-relaxed">
            We hebben een reset-link gestuurd naar{' '}
            <span className="text-[#414141] font-semibold">{email}</span>.
            <br />
            Klik op de link in de mail om je wachtwoord te wijzigen.
          </p>
          <Link
            href="/login"
            className="inline-block text-[#9FB139] font-semibold hover:underline text-sm mt-2"
          >
            Terug naar inloggen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 block">
        <Image src="/logo.png" alt="DE GEMEENSCHAP" width={160} height={34} className="h-8 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Wachtwoord vergeten?</h1>
          <p className="text-[#414141]/50 mt-1 text-sm">
            Vul je e-mailadres in en we sturen je een reset-link.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 space-y-5 shadow-sm">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9FB139] text-white font-semibold py-2.5 rounded-[30px] hover:bg-[#8fa030] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Stuur reset-link'}
            </button>
          </form>

          <p className="text-center text-sm text-[#414141]/50 pt-1">
            <Link href="/login" className="text-[#1B9193] font-semibold hover:underline">
              Terug naar inloggen
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
