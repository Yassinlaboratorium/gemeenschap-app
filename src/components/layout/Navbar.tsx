import Link from 'next/link'
import { CalendarDays, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-dark border-b border-[#2a2a2a] px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white font-black text-xs">DG</span>
        </div>
        <span className="font-black text-white tracking-tight hidden sm:block">DE GEMEENSCHAP</span>
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          href="/activities"
          className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Activiteiten</span>
        </Link>

        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-accent transition-colors ml-1"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Inloggen</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-accent transition-colors ml-1"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Registreren</span>
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
