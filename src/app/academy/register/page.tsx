'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Trophy, User, Baby, Phone, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Team = {
  id: string
  name: string
  age_group: string | null
  training_days: string[] | null
  training_time: string | null
  location: string | null
  price_per_season: number | null
  max_players: number
  player_count?: number
}

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { label: 'Ouder', icon: User },
  { label: 'Kind', icon: Baby },
  { label: 'Noodcontact', icon: Phone },
  { label: 'Team', icon: Trophy },
  { label: 'Bevestiging', icon: CheckCircle2 },
]

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-[#D9D9D9] bg-[#F8F8F8] text-[#414141] placeholder:text-[#414141]/35 focus:outline-none focus:ring-2 focus:ring-[#1B9193]/30 focus:border-[#1B9193] text-sm transition-colors'
const LABEL = 'block text-xs font-semibold text-[#414141]/60 mb-1'

export default function AcademyRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTeam = searchParams.get('team')

  const [step, setStep] = useState<Step>(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [parent, setParent] = useState({ name: '', email: '', phone: '' })
  const [child, setChild] = useState({ name: '', dob: '', position: '', jersey: '', medical: '' })
  const [emergency, setEmergency] = useState({ name: '', phone: '' })
  const [selectedTeam, setSelectedTeam] = useState<string>(preselectedTeam ?? '')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single().then(({ data }) => {
          if (data) {
            setParent(p => ({ ...p, name: data.full_name ?? '', phone: data.phone ?? '', email: user.email ?? '' }))
          } else {
            setParent(p => ({ ...p, email: user.email ?? '' }))
          }
        })
      }
    })

    async function loadTeams() {
      setLoading(true)
      const { data: teamsData } = await supabase
        .from('academy_teams')
        .select('id, name, age_group, training_days, training_time, location, price_per_season, max_players')
        .eq('is_active', true)
        .order('age_group', { ascending: true })

      if (teamsData) {
        const counts = await Promise.all(
          teamsData.map(t =>
            supabase.from('academy_players').select('*', { count: 'exact', head: true }).eq('team_id', t.id).eq('status', 'active')
          )
        )
        setTeams(teamsData.map((t, i) => ({ ...t, player_count: counts[i].count ?? 0 })))
      }
      setLoading(false)
    }
    loadTeams()
  }, [])

  function setP(field: keyof typeof parent) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setParent(p => ({ ...p, [field]: e.target.value }))
  }
  function setC(field: keyof typeof child) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setChild(c => ({ ...c, [field]: e.target.value }))
  }
  function setE(field: keyof typeof emergency) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setEmergency(em => ({ ...em, [field]: e.target.value }))
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!parent.name.trim()) return 'Voer je naam in.'
      if (!parent.email.trim()) return 'Voer je e-mailadres in.'
      if (!parent.phone.trim()) return 'Voer je telefoonnummer in.'
    }
    if (step === 2) {
      if (!child.name.trim()) return 'Voer de naam van het kind in.'
      if (!child.dob) return 'Voer de geboortedatum van het kind in.'
    }
    if (step === 3) {
      if (!emergency.name.trim()) return 'Voer een noodcontact in.'
      if (!emergency.phone.trim()) return 'Voer het telefoonnummer van het noodcontact in.'
    }
    if (step === 4) {
      if (!selectedTeam) return 'Selecteer een team.'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep(s => (s < 5 ? (s + 1) as Step : s))
  }

  function prev() {
    setError(null)
    setStep(s => (s > 1 ? (s - 1) as Step : s))
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Je bent niet ingelogd. Log in om te registreren.')
      setSubmitting(false)
      return
    }

    const team = teams.find(t => t.id === selectedTeam)
    const spotsLeft = (team?.max_players ?? 0) - (team?.player_count ?? 0)

    const { error: insertError } = await supabase.from('academy_players').insert({
      user_id: user.id,
      team_id: selectedTeam,
      player_name: child.name.trim(),
      date_of_birth: child.dob || null,
      position: child.position.trim() || null,
      jersey_number: child.jersey ? parseInt(child.jersey) : null,
      medical_notes: child.medical.trim() || null,
      emergency_contact: emergency.name.trim(),
      emergency_phone: emergency.phone.trim(),
      parent_name: parent.name.trim(),
      parent_email: parent.email.trim(),
      parent_phone: parent.phone.trim(),
      status: spotsLeft > 0 ? 'active' : 'inactive',
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Dit kind is al ingeschreven voor dit team.')
      } else {
        setError('Er is een fout opgetreden. Probeer opnieuw.')
      }
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    const team = teams.find(t => t.id === selectedTeam)
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-[#1B9193]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#1B9193]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#414141] mb-2" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
            Inschrijving ontvangen!
          </h1>
          <p className="text-[#414141]/60 mb-2">
            <strong>{child.name}</strong> is ingeschreven voor <strong>{team?.name}</strong>.
          </p>
          <p className="text-sm text-[#414141]/45 mb-8">
            We contacteren je binnenkort met meer info.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold px-6 py-3 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm"
            >
              Naar dashboard
            </Link>
            <Link
              href="/academy"
              className="inline-flex items-center justify-center gap-2 border border-[#D9D9D9] bg-white text-[#414141] font-semibold px-6 py-3 rounded-[30px] hover:border-[#1B9193]/40 transition-all"
            >
              Terug naar Academy
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const team = teams.find(t => t.id === selectedTeam)

  return (
    <div className="min-h-screen bg-[#F8F8F8] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/academy" className="inline-flex items-center gap-1.5 text-sm text-[#414141]/45 hover:text-[#1B9193] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Terug naar Academy
        </Link>

        <div className="flex items-center justify-center mb-2">
          <Link href="/">
            <Image src="/logo.png" alt="DE GEMEENSCHAP" width={120} height={26} className="h-6 w-auto" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
            Inschrijven Academy
          </h1>
          <p className="text-sm text-[#414141]/50 mt-1">Stap {step} van 5</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => {
            const n = i + 1
            const active = step === n
            const done_ = step > n
            return (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done_ ? 'bg-[#1B9193] text-white' : active ? 'bg-[#9FB139] text-white' : 'bg-[#D9D9D9] text-[#414141]/40'
                }`}>
                  {done_ ? '✓' : n}
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-[#9FB139]' : done_ ? 'text-[#1B9193]' : 'text-[#414141]/30'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#D9D9D9] p-6 shadow-sm">
          {/* Step 1: Ouder */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Jouw gegevens
              </h2>
              <div>
                <label className={LABEL}>Volledige naam <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} value={parent.name} onChange={setP('name')} placeholder="Jana Vermeersch" autoComplete="name" />
              </div>
              <div>
                <label className={LABEL}>E-mailadres <span className="text-red-500">*</span></label>
                <input type="email" className={INPUT} value={parent.email} onChange={setP('email')} placeholder="jij@voorbeeld.be" autoComplete="email" />
              </div>
              <div>
                <label className={LABEL}>Telefoonnummer <span className="text-red-500">*</span></label>
                <input type="tel" className={INPUT} value={parent.phone} onChange={setP('phone')} placeholder="0470 00 00 00" autoComplete="tel" />
              </div>
            </div>
          )}

          {/* Step 2: Kind */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Gegevens van het kind
              </h2>
              <div>
                <label className={LABEL}>Volledige naam kind <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} value={child.name} onChange={setC('name')} placeholder="Thomas Vermeersch" />
              </div>
              <div>
                <label className={LABEL}>Geboortedatum <span className="text-red-500">*</span></label>
                <input type="date" className={INPUT} value={child.dob} onChange={setC('dob')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Positie (optioneel)</label>
                  <select className={INPUT} value={child.position} onChange={setC('position')}>
                    <option value="">Kies positie</option>
                    <option value="doelman">Doelman</option>
                    <option value="verdediger">Verdediger</option>
                    <option value="middenvelder">Middenvelder</option>
                    <option value="aanvaller">Aanvaller</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Rugnummer (optioneel)</label>
                  <input type="number" min="1" max="99" className={INPUT} value={child.jersey} onChange={setC('jersey')} placeholder="bv. 7" />
                </div>
              </div>
              <div>
                <label className={LABEL}>Medische opmerkingen (optioneel)</label>
                <input type="text" className={INPUT} value={child.medical} onChange={setC('medical')} placeholder="bv. allergie, astma..." />
              </div>
            </div>
          )}

          {/* Step 3: Noodcontact */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Noodcontact
              </h2>
              <p className="text-xs text-[#414141]/50">Wie contacteren we in geval van nood tijdens trainingen of wedstrijden?</p>
              <div>
                <label className={LABEL}>Naam noodcontact <span className="text-red-500">*</span></label>
                <input type="text" className={INPUT} value={emergency.name} onChange={setE('name')} placeholder="bv. Mohamed Vermeersch (vader)" />
              </div>
              <div>
                <label className={LABEL}>Telefoonnummer noodcontact <span className="text-red-500">*</span></label>
                <input type="tel" className={INPUT} value={emergency.phone} onChange={setE('phone')} placeholder="0470 00 00 00" />
              </div>
            </div>
          )}

          {/* Step 4: Team */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Kies een team
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#1B9193] animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <p className="text-sm text-[#414141]/50 text-center py-6">Geen teams beschikbaar op dit moment.</p>
              ) : (
                <div className="space-y-3">
                  {teams.map(t => {
                    const spots = t.max_players - (t.player_count ?? 0)
                    const full = spots <= 0
                    const selected = selectedTeam === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => !full && setSelectedTeam(t.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selected
                            ? 'border-[#1B9193] bg-[#1B9193]/5'
                            : full
                            ? 'border-[#D9D9D9] bg-[#F8F8F8] opacity-50 cursor-not-allowed'
                            : 'border-[#D9D9D9] hover:border-[#1B9193]/40 hover:bg-[#F8F8F8]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-bold text-[#414141] text-sm">{t.name}</p>
                          <div className="flex items-center gap-2">
                            {t.age_group && (
                              <span className="text-[10px] font-semibold bg-[#9FB139]/10 text-[#9FB139] px-2 py-0.5 rounded-full">{t.age_group}</span>
                            )}
                            {full ? (
                              <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Vol</span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{spots} vrij</span>
                            )}
                          </div>
                        </div>
                        {t.training_days && t.training_days.length > 0 && (
                          <p className="text-xs text-[#414141]/50">{t.training_days.join(', ')}{t.training_time && ` · ${t.training_time}`}</p>
                        )}
                        {t.price_per_season != null && (
                          <p className="text-xs font-semibold text-[#414141]/70 mt-1">€{Number(t.price_per_season).toFixed(0)} / seizoen</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Bevestiging */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-bold text-[#414141]" style={{ fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
                Controleer je gegevens
              </h2>
              <div className="space-y-3 text-sm">
                <div className="bg-[#F8F8F8] rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide mb-2">Ouder</p>
                  <p className="text-[#414141] font-semibold">{parent.name}</p>
                  <p className="text-[#414141]/60">{parent.email}</p>
                  <p className="text-[#414141]/60">{parent.phone}</p>
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide mb-2">Kind</p>
                  <p className="text-[#414141] font-semibold">{child.name}</p>
                  {child.dob && <p className="text-[#414141]/60">Geboortedatum: {new Date(child.dob).toLocaleDateString('nl-BE')}</p>}
                  {child.position && <p className="text-[#414141]/60">Positie: {child.position}</p>}
                  {child.medical && <p className="text-[#414141]/60">Medisch: {child.medical}</p>}
                </div>
                <div className="bg-[#F8F8F8] rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide mb-2">Noodcontact</p>
                  <p className="text-[#414141] font-semibold">{emergency.name}</p>
                  <p className="text-[#414141]/60">{emergency.phone}</p>
                </div>
                <div className="bg-[#1B9193]/5 border border-[#1B9193]/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-[#414141]/50 uppercase tracking-wide mb-2">Team</p>
                  {team ? (
                    <>
                      <p className="text-[#414141] font-bold">{team.name}</p>
                      {team.age_group && <p className="text-[#414141]/60">{team.age_group}</p>}
                      {team.price_per_season != null && (
                        <p className="text-[#1B9193] font-semibold mt-1">€{Number(team.price_per_season).toFixed(2)} / seizoen</p>
                      )}
                    </>
                  ) : (
                    <p className="text-[#414141]/50">Geen team geselecteerd</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#414141]/40 text-center pt-2">
                Door in te schrijven ga je akkoord met de voorwaarden van vzw De Gemeenschap.
              </p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prev}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-[30px] border border-[#D9D9D9] text-[#414141] font-semibold text-sm hover:border-[#414141]/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug
              </button>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1B9193] text-white font-bold py-2.5 rounded-[30px] hover:bg-[#0f6163] transition-all shadow-sm"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#9FB139] text-white font-bold py-2.5 rounded-[30px] hover:bg-[#8fa030] transition-all shadow-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                {submitting ? 'Bezig...' : 'Bevestig inschrijving'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#414141]/35 mt-6">
          Vragen? Contacteer ons via{' '}
          <a href="mailto:info@degemeenschap.be" className="underline hover:text-[#1B9193]">info@degemeenschap.be</a>
        </p>
      </div>
    </div>
  )
}
