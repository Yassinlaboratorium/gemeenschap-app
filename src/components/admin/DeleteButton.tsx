'use client'

import { Trash2 } from 'lucide-react'
import { deleteActivity } from '@/app/admin/activities/actions'

export function DeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteActivity.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`"${title}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 text-sm font-semibold text-[#414141]/35 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Verwijderen</span>
      </button>
    </form>
  )
}
