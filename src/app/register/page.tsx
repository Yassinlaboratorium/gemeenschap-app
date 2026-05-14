'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Calendar, Phone, UserPlus, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function validate(): string | null {
    if (form.name.trim().length < 2) return 'Voer je volledige naam in (minimaal 2 tekens).'
    if (form.password.length < 6) return 'Wachtwoord moet minimaal 6 tekens bevatten.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 1. Maak auth-gebruiker aan (trigger maakt automatisch een profiel)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name.trim() },
      },
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Dit e-mailadres is al in gebruik.'
          : signUpError.message
      )
      setLoading(false)
      return
    }

    // Upsert profiel met alle velden (trigger heeft al basisprofiel aangemaakt)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name.trim(),
        birth_date: form.birthDate || null,
        phone: form.phone.trim() || null,
      })
    }

    router.push('/login?registered=1')
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
          <h1 className="text-2xl font-extrabold text-white">Account aanmaken</h1>
          <p className="text-[#a0a0a0] mt-1 text-sm">Word lid en schrijf je in voor activiteiten</p>
        </div>

        <div className="bg-dark rounded-2xl border border-[#2a2a2a] p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Volledige naam"
              icon={User}
              type="text"
              required
              value={form.name}
              onChange={set('name')}
              placeholder="Jana Vermeersch"
              autoComplete="name"
            />

            <FormInput
              label="E-mailadres"
              icon={Mail}
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="jij@voorbeeld.be"
              autoComplete="email"
            />

            <FormInput
              label="Wachtwoord"
              icon={Lock}
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set('password')}
              placeholder="Minimaal 6 tekens"
              autoComplete="new-password"
            />

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Geboortedatum"
                icon={Calendar}
                type="date"
                required
                value={form.birthDate}
                onChange={set('birthDate')}
              />
              <FormInput
                label="Telefoon"
                icon={Phone}
                type="tel"
                optional
                value={form.phone}
                onChange={set('phone')}
                placeholder="0470 00 00 00"
                autoComplete="tel"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>

          <p className="text-center text-sm text-[#a0a0a0] pt-1">
            Al een account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log hier in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
