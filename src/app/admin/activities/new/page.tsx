import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ActivityForm } from '@/components/admin/ActivityForm'
import { createActivity } from '../actions'

export default function NewActivityPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/activities"
          className="inline-flex items-center gap-1.5 text-sm text-dark/40 hover:text-dark transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <h1 className="text-2xl font-extrabold text-dark">Nieuwe activiteit</h1>
      </div>
      <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-6 sm:p-8">
        <ActivityForm action={createActivity} />
      </div>
    </div>
  )
}
