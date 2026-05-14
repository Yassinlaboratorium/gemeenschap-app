'use client'

import { LogOut } from 'lucide-react'
import { logout } from './actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm font-semibold text-white/40 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
      >
        <LogOut className="w-4 h-4" />
        Uitloggen
      </button>
    </form>
  )
}
