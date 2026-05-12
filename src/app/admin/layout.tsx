import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, CalendarDays, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
    <div className="min-h-screen bg-secondary">
      <header className="bg-dark text-secondary px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">vzw De Gemeenschap</span>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold ml-1">Admin</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/admin/activities"
            className="flex items-center gap-1.5 text-sm text-secondary/60 hover:text-secondary px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Activiteiten</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-secondary/60 hover:text-secondary px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
