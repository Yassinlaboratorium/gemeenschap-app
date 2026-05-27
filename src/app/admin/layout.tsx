import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, LayoutDashboard, BarChart2, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HelpModal } from '@/components/admin/HelpModal'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#D9D9D9] px-6 py-4 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="DE GEMEENSCHAP" width={130} height={28} className="h-7 w-auto" />
          <span className="text-xs bg-[#9FB139]/15 text-[#9FB139] px-2 py-0.5 rounded-full font-semibold ml-1">Admin</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/admin/activities"
            className="flex items-center gap-1.5 text-sm text-[#414141]/55 hover:text-[#414141] px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Activiteiten</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-1.5 text-sm text-[#414141]/55 hover:text-[#414141] px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <Link
            href="/admin/academy"
            className="flex items-center gap-1.5 text-sm text-[#414141]/55 hover:text-[#414141] px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Academy</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#414141]/55 hover:text-[#414141] px-3 py-2 rounded-lg hover:bg-[#F8F8F8] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <HelpModal />
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
