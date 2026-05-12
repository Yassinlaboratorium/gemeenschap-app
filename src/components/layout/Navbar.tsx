import Link from 'next/link'
import { Sparkles, CalendarDays, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="bg-dark text-secondary px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold hidden sm:block">vzw De Gemeenschap</span>
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          href="/activities"
          className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-secondary px-3 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Activiteiten</span>
        </Link>

        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors ml-1"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-secondary px-3 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Inloggen</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm bg-primary text-white font-semibold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors ml-1"
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
