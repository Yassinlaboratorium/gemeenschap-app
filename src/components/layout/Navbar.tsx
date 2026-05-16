import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-[#0B1020]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <Link href="/" className="shrink-0">
        <Image
          src="/logo.png"
          alt="DE GEMEENSCHAP"
          width={130}
          height={28}
          className="h-7 w-auto"
          priority
        />
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
            className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-primary to-accent text-white font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all ml-1"
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
              className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-primary to-accent text-white font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all ml-1"
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
