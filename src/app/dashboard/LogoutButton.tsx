'use client'

import { LogOut } from 'lucide-react'
import { logout } from './actions'

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 text-sm font-semibold text-[#414141]/50 hover:text-[#1B9193] transition-colors px-4 py-2 rounded-xl hover:bg-[#1B9193]/5"
      >
        <LogOut className="w-4 h-4" />
        Uitloggen
      </button>
    </form>
  )
}
