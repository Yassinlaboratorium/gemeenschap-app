'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Calendar, Phone, UserPlus, AlertCircle, MapPin, Users, Baby } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FormInput } from '@/components/ui/FormInput'
import { MUNICIPALITIES } from '@/types/database'
import type { AccountType } from '@/types/database'

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
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-12">
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
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Naam + email + wachtwoord */}
            <FormInput label="Volledige naam" icon={User} type="text" required value={form.name} onChange={set('name')} placeholder="Jana Vermeersch" autoComplete="name" />
            <FormInput label="E-mailadres" icon={Mail} type="email" required value={form.email} onChange={set('email')} placeholder="jij@voorbeeld.be" autoComplete="email" />
            <FormInput label="Wachtwoord" icon={Lock} type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="Minimaal 6 tekens" autoComplete="new-password" />

            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Geboortedatum" icon={Calendar} type="date" required value={form.birthDate} onChange={set('birthDate')} />
              <FormInput label="Telefoon" icon={Phone} type="tel" optional value={form.phone} onChange={set('phone')} placeholder="0470 00 00 00" autoComplete="tel" />
            </div>

            {/* Account type */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Wat voor account? <span className="text-red-400">*</span>
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
                    className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border text-center transition-all ${
                      form.accountType === opt.value
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-secondary border-[#2a2a2a] text-white/50 hover:border-white/20'
                    }`}
                  >
                    <opt.icon className={`w-5 h-5 ${form.accountType === opt.value ? 'text-primary' : ''}`} />
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] opacity-60">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Locatie */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Locatie (optioneel)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">Postcode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.postalCode}
                    onChange={set('postalCode')}
                    placeholder="9100"
                    className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-secondary text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1">Gemeente</label>
                  <select
                    value={form.municipality}
                    onChange={set('municipality')}
                    className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
                  >
                    <option value="">Kies...</option>
                    {MUNICIPALITIES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1">Wijk / buurt</label>
                <input
                  type="text"
                  value={form.neighborhood}
                  onChange={set('neighborhood')}
                  placeholder="bv. Centrum, Nieuw-Sint-Jan, ..."
                  className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-secondary text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors"
                />
              </div>
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
