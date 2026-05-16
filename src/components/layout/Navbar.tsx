import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, LayoutDashboard, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#D9D9D9] px-4 sm:px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
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
          className="flex items-center gap-1.5 text-sm text-[#414141]/70 hover:text-[#1B9193] px-3 py-2 rounded-lg hover:bg-[#1B9193]/5 transition-colors font-semibold"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Activiteiten</span>
        </Link>

        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm bg-[#9FB139] text-white font-semibold px-4 py-2 rounded-[30px] hover:bg-[#8fa030] transition-all ml-1 shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-[#414141]/70 hover:text-[#1B9193] px-3 py-2 rounded-lg hover:bg-[#1B9193]/5 transition-colors font-semibold"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Inloggen</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm bg-[#9FB139] text-white font-semibold px-4 py-2 rounded-[30px] hover:bg-[#8fa030] transition-all ml-1 shadow-sm"
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
