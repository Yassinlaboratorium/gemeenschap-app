'use client'

import { useState, useTransition } from 'react'
import { Users, Plus, Pencil, Trash2, X, Check, AlertCircle, Baby, ChevronDown, ChevronUp } from 'lucide-react'
import { addChild, updateChild, deleteChild } from '@/app/dashboard/children-actions'
import type { Child } from '@/types/database'

const GENDER_LABELS: Record<string, string> = {
  male: 'Jongen',
  female: 'Meisje',
  other: 'Anders',
  prefer_not_to_say: 'Zeg ik liever niet',
}

function getAge(birthDate: string | null): string {
  if (!birthDate) return ''
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return `${age} jaar`
}

interface ChildFormProps {
  initial?: Child
  onSave: (formData: FormData) => Promise<void>
  onCancel: () => void
  saving: boolean
  error: string | null
}

function ChildForm({ initial, onSave, onCancel, saving, error }: ChildFormProps) {
  const [showExtra, setShowExtra] = useState(false)

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        await onSave(new FormData(e.currentTarget))
      }}
      className="space-y-3"
    >
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-3 py-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Basisvelden */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Voornaam <span className="text-red-400">*</span></label>
          <input
            name="first_name"
            type="text"
            required
            defaultValue={initial?.first_name ?? ''}
            placeholder="bv. Yassin"
            className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Geboortedatum <span className="text-red-400">*</span></label>
          <input
            name="birth_date"
            type="date"
            required
            defaultValue={initial?.birth_date ?? ''}
            className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1">Gender</label>
        <select
          name="gender"
          defaultValue={initial?.gender ?? ''}
          className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
        >
          <option value="">Kies (optioneel)</option>
          <option value="male">Jongen</option>
          <option value="female">Meisje</option>
          <option value="other">Anders</option>
          <option value="prefer_not_to_say">Zeg ik liever niet</option>
        </select>
      </div>

      {/* Extra info toggle */}
      <button
        type="button"
        onClick={() => setShowExtra(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
      >
        {showExtra ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showExtra ? 'Minder info' : 'Extra info (school, locatie)'}
      </button>

      {showExtra && (
        <div className="space-y-3 border-t border-[#2a2a2a] pt-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">School</label>
            <input
              name="school"
              type="text"
              defaultValue={initial?.school ?? ''}
              placeholder="bv. Basisschool De Wijs"
              className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Postcode</label>
              <input
                name="postal_code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                defaultValue={initial?.postal_code ?? ''}
                placeholder="9100"
                className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Gemeente</label>
              <input
                name="municipality"
                type="text"
                defaultValue={initial?.municipality ?? ''}
                placeholder="bv. Sint-Niklaas, Beveren, Temse..."
                className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Wijk / buurt</label>
            <input
              name="neighborhood"
              type="text"
              defaultValue={initial?.neighborhood ?? ''}
              placeholder="bv. Belsele, Nieuwkerken, Centrum..."
              className="w-full px-3 py-2 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-semibold text-white/40 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Annuleren
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Check className="w-4 h-4" />
          {saving ? 'Bezig…' : initial ? 'Opslaan' : 'Toevoegen'}
        </button>
      </div>
    </form>
  )
}

interface Props {
  initialChildren: Child[]
}

export function ChildrenSection({ initialChildren }: Props) {
  const [children, setChildren] = useState<Child[]>(initialChildren)
  const [mode, setMode] = useState<'list' | 'add' | { edit: Child }>('list')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleAdd(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await addChild(formData)
      if (result.error) { setError(result.error); return }
      if (result.child) setChildren(prev => [...prev, result.child!])
      setMode('list')
    })
  }

  async function handleEdit(child: Child, formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateChild(child.id, formData)
      if (result.error) { setError(result.error); return }
      const name = formData.get('first_name') as string
      const bdate = formData.get('birth_date') as string || null
      setChildren(prev => prev.map(c => c.id === child.id
        ? {
            ...c,
            first_name: name,
            birth_date: bdate,
            gender: ((formData.get('gender') as string) || null) as Child['gender'],
            school: (formData.get('school') as string) || null,
            postal_code: (formData.get('postal_code') as string) || null,
            municipality: ((formData.get('municipality') as string) || null) as Child['municipality'],
            neighborhood: (formData.get('neighborhood') as string) || null,
          }
        : c
      ))
      setMode('list')
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteChild(id)
      if (result.error) { setError(result.error); return }
      setChildren(prev => prev.filter(c => c.id !== id))
      setConfirmDelete(null)
    })
  }

  return (
    <div className="bg-dark rounded-2xl border border-[#2a2a2a] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#2a2a2a] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-white">Mijn kinderen</h2>
            <p className="text-sm text-white/40">
              {children.length === 0 ? 'Nog geen kinderen toegevoegd' : `${children.length} kind${children.length !== 1 ? 'eren' : ''}`}
            </p>
          </div>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => { setMode('add'); setError(null) }}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Kind toevoegen
          </button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {children.length === 0 && mode === 'list' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              <Baby className="w-6 h-6 text-white/20" />
            </div>
            <div>
              <p className="text-white/40 font-medium text-sm">Nog geen kinderen</p>
              <p className="text-white/25 text-xs mt-0.5">Voeg een kind toe om in te schrijven voor activiteiten.</p>
            </div>
          </div>
        )}

        {children.map(child => (
          <div key={child.id}>
            {mode === 'list' || (typeof mode === 'object' && mode.edit.id !== child.id) ? (
              <div className="flex items-center gap-3 bg-secondary rounded-xl border border-[#2a2a2a] px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{child.first_name[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{child.first_name}</p>
                  <p className="text-xs text-white/40">
                    {child.birth_date ? getAge(child.birth_date) : ''}
                    {child.gender ? ` · ${GENDER_LABELS[child.gender] ?? child.gender}` : ''}
                    {child.school ? ` · ${child.school}` : ''}
                    {child.municipality ? ` · ${child.municipality}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setMode({ edit: child }); setError(null) }}
                    disabled={isPending}
                    className="p-1.5 text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
                    title="Bewerken"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {confirmDelete === child.id ? (
                    <div className="flex items-center gap-1.5 ml-1">
                      <span className="text-xs text-white/40">Verwijderen?</span>
                      <button onClick={() => handleDelete(child.id)} disabled={isPending} className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">
                        Ja
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs font-semibold text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                        Nee
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(child.id)}
                      disabled={isPending}
                      className="p-1.5 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : typeof mode === 'object' && mode.edit.id === child.id ? (
              <div className="bg-secondary rounded-xl border border-primary/20 px-4 py-4">
                <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wide">{child.first_name} bewerken</p>
                <ChildForm
                  initial={child}
                  onSave={fd => handleEdit(child, fd)}
                  onCancel={() => { setMode('list'); setError(null) }}
                  saving={isPending}
                  error={error}
                />
              </div>
            ) : null}
          </div>
        ))}

        {mode === 'add' && (
          <div className="bg-secondary rounded-xl border border-primary/20 px-4 py-4">
            <p className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wide">Nieuw kind toevoegen</p>
            <ChildForm
              onSave={handleAdd}
              onCancel={() => { setMode('list'); setError(null) }}
              saving={isPending}
              error={error}
            />
          </div>
        )}
      </div>
    </div>
  )
}
