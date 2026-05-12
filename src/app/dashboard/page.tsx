import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Settings, Sparkles, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './LogoutButton'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'daar'

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Header */}
      <header className="bg-dark text-secondary px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">vzw De Gemeenschap</span>
        </Link>
        <LogoutButton />
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-8">
        {/* Welkomstkaart */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-dark/50 font-medium">Welkom terug</p>
              <h1 className="text-2xl font-extrabold text-dark">Hey, {firstName}! 👋</h1>
              <p className="text-sm text-dark/40 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Activiteiten */}
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-dark">Mijn activiteiten</h2>
              <p className="text-sm text-dark/40">Je inschrijvingen verschijnen hier</p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-dashed border-dark/10 py-8 text-center text-dark/40 text-sm">
            Nog geen inschrijvingen
          </div>
        </div>

        {/* Admin-link */}
        {profile?.is_admin && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-dark text-sm">Beheerdersmodus</p>
                <p className="text-xs text-dark/40">Activiteiten beheren en inschrijvingen bekijken</p>
              </div>
            </div>
            <Link
              href="/admin/activities"
              className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors"
            >
              Naar admin
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
