'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, User, Calendar, Phone, UserPlus, AlertCircle, MapPin, Users, Baby } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'
import type { AccountType } from '@/types/database'

const INPUT = 'w-full px-3 py-2 rounded-[30px] border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/35 focus:outline-none focus:ring-2 focus:ring-[#9FB139]/30 focus:border-[#9FB139] text-sm transition-colors'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    birthDate: '',
    phone: '',
    accountType: '' as AccountType | '',
    postalCode: '',
    municipality: '',
    neighborhood: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function validate(): string | null {
    if (form.name.trim().length < 2) return 'Voer je volledige naam in (minimaal 2 tekens).'
    if (form.password.length < 6) return 'Wachtwoord moet minimaal 6 tekens bevatten.'
    if (!form.accountType) return 'Kies een accounttype.'
    if (form.postalCode && !/^\d{4}$/.test(form.postalCode)) return 'Postcode moet 4 cijfers zijn.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()

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

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name.trim(),
        birth_date: form.birthDate || null,
        phone: form.phone.trim() || null,
        account_type: form.accountType || 'youth',
        postal_code: form.postalCode || null,
        municipality: form.municipality || null,
        neighborhood: form.neighborhood.trim() || null,
      })
    }

    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 block">
        <Image src="/logo.png" alt="DE GEMEENSCHAP" width={160} height={34} className="h-8 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)', color: '#1B9193' }}>Account aanmaken</h1>
          <p className="text-[#414141]/50 mt-1 text-sm">Word lid en schrijf je in voor activiteiten</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D9D9D9] p-8 space-y-5 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Volledige naam" icon={User} type="text" required value={form.name} onChange={set('name')} placeholder="Jana Vermeersch" autoComplete="name" />
            <FormInput label="E-mailadres" icon={Mail} type="email" required value={form.email} onChange={set('email')} placeholder="jij@voorbeeld.be" autoComplete="email" />
            <FormInput label="Wachtwoord" icon={Lock} type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="Minimaal 6 tekens" autoComplete="new-password" />

            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Geboortedatum" icon={Calendar} type="date" required value={form.birthDate} onChange={set('birthDate')} />
              <FormInput label="Telefoon" icon={Phone} type="tel" optional value={form.phone} onChange={set('phone')} placeholder="0470 00 00 00" autoComplete="tel" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#414141] mb-2" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Wat voor account? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'parent', icon: Users, label: 'Ik ben ouder', desc: 'Kinderen inschrijven' },
                  { value: 'youth', icon: Baby, label: 'Ik ben jongere', desc: 'Mezelf inschrijven' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, accountType: opt.value as AccountType }))}
                    className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border text-center transition-all ${
                      form.accountType === opt.value
                        ? 'bg-[#9FB139]/8 border-[#9FB139] text-[#414141]'
                        : 'bg-[#F8F8F8] border-[#D9D9D9] text-[#414141]/50 hover:border-[#9FB139]/40'
                    }`}
                  >
                    <opt.icon className={`w-5 h-5 ${form.accountType === opt.value ? 'text-[#9FB139]' : 'text-[#414141]/35'}`} />
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] opacity-60">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#414141] flex items-center gap-1.5" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                <MapPin className="w-4 h-4 text-[#9FB139]" />
                Locatie (optioneel)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#414141]/55 mb-1">Postcode</label>
                  <input type="text" inputMode="numeric" maxLength={4} value={form.postalCode} onChange={set('postalCode')} placeholder="9100" className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#414141]/55 mb-1">Gemeente</label>
                  <input type="text" value={form.municipality} onChange={set('municipality')} placeholder="bv. Sint-Niklaas, Beveren, Temse..." className={INPUT} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#414141]/55 mb-1">Wijk / buurt</label>
                <input type="text" value={form.neighborhood} onChange={set('neighborhood')} placeholder="bv. Belsele, Nieuwkerken, Centrum..." className={INPUT} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9FB139] text-white font-semibold py-2.5 rounded-[30px] hover:bg-[#8fa030] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>

          <p className="text-center text-sm text-[#414141]/50 pt-1">
            Al een account?{' '}
            <Link href="/login" className="text-[#1B9193] font-semibold hover:underline">
              Log hier in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
