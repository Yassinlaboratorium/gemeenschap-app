'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Save, AlertCircle } from 'lucide-react'
import type { FormState } from '@/app/admin/activities/actions'
import type { Activity } from '@/types/database'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

const INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-dark/10 bg-secondary text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-colors'
const LABEL = 'block text-sm font-semibold text-dark mb-1.5'

export function ActivityForm({ action, activity }: { action: Action; activity?: Activity }) {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* Titel */}
      <div>
        <label className={LABEL}>
          Titel <span className="text-primary">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={activity?.title}
          placeholder="bv. Schilderworkshop voor beginners"
          className={INPUT}
        />
      </div>

      {/* Beschrijving */}
      <div>
        <label className={LABEL}>Beschrijving</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={activity?.description ?? ''}
          placeholder="Korte omschrijving van de activiteit..."
          className={INPUT + ' resize-none'}
        />
      </div>

      {/* Type + Datum */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Type <span className="text-primary">*</span>
          </label>
          <select
            name="type"
            required
            defaultValue={activity?.type ?? ''}
            className={INPUT}
          >
            <option value="" disabled>Kies een type…</option>
            <option value="workshop">Workshop</option>
            <option value="uitstap">Uitstap</option>
            <option value="evenement">Evenement</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>
            Datum <span className="text-primary">*</span>
          </label>
          <input
            name="date"
            type="date"
            required
            defaultValue={activity?.date}
            className={INPUT}
          />
        </div>
      </div>

      {/* Tijden */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Starttijd</label>
          <input
            name="start_time"
            type="time"
            defaultValue={activity?.start_time?.slice(0, 5) ?? ''}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>
            Eindtijd{' '}
            <span className="text-dark/40 font-normal">(optioneel)</span>
          </label>
          <input
            name="end_time"
            type="time"
            defaultValue={activity?.end_time?.slice(0, 5) ?? ''}
            className={INPUT}
          />
        </div>
      </div>

      {/* Locatie */}
      <div>
        <label className={LABEL}>Locatie</label>
        <input
          name="location"
          type="text"
          defaultValue={activity?.location ?? ''}
          placeholder="bv. Mercatorstraat 24, Sint-Niklaas"
          className={INPUT}
        />
      </div>

      {/* Max deelnemers + Prijs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Max. deelnemers{' '}
            <span className="text-dark/40 font-normal">(optioneel)</span>
          </label>
          <input
            name="max_participants"
            type="number"
            min="1"
            defaultValue={activity?.max_participants ?? ''}
            placeholder="Onbeperkt"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Prijs (€)</label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={activity?.price ?? 0}
            className={INPUT}
          />
        </div>
      </div>

      {/* Gepubliceerd */}
      <div className="flex items-center gap-3 bg-secondary rounded-xl border border-dark/5 px-4 py-3">
        <input
          id="is_published"
          name="is_published"
          type="checkbox"
          defaultChecked={activity?.is_published ?? false}
          className="w-4 h-4 accent-primary"
        />
        <label htmlFor="is_published" className="cursor-pointer">
          <span className="text-sm font-semibold text-dark">Gepubliceerd</span>
          <span className="block text-xs text-dark/40">Zichtbaar voor alle bezoekers</span>
        </label>
      </div>

      {/* Acties */}
      <div className="flex items-center justify-between pt-2 border-t border-dark/5">
        <Link
          href="/admin/activities"
          className="text-sm font-semibold text-dark/40 hover:text-dark transition-colors"
        >
          Annuleren
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 text-sm"
        >
          <Save className="w-4 h-4" />
          {isPending ? 'Bezig…' : activity ? 'Opslaan' : 'Activiteit aanmaken'}
        </button>
      </div>
    </form>
  )
}
