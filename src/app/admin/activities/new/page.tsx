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
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar activiteiten
        </Link>
        <h1 className="text-2xl font-extrabold text-white">Nieuwe activiteit</h1>
      </div>
      <div className="bg-[#131C31] rounded-[28px] border border-white/5 p-6 sm:p-8">
        <ActivityForm action={createActivity} />
      </div>
    </div>
  )
}
