import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { HelpGuide } from '@/components/help/HelpGuide'

export const metadata: Metadata = {
  title: 'Handleiding — Admin | DE GEMEENSCHAP',
  description: 'Uitgebreide handleiding voor admins van vzw De Gemeenschap.',
}

export default function AdminHandleidingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9f4', fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
      {/* Slim admin header */}
      <div style={{ background: '#0B1020', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 5%', display: 'flex', alignItems: 'center', height: '56px', gap: '16px' }}>
        <Link href="/admin/activities" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,.4)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          Terug naar admin
        </Link>
        <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,.08)' }} />
        <Image src="/logo.png" alt="DE GEMEENSCHAP" width={100} height={22} style={{ height: '22px', width: 'auto' }} />
        <span style={{ fontSize: '11px', background: 'rgba(27,145,147,.15)', color: '#4ecbcd', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>Admin</span>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f1829 0%, #1a2540 100%)', color: 'white', padding: '40px 5% 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(27,145,147,.15)', border: '1px solid rgba(27,145,147,.25)', color: '#4ecbcd', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px' }}>
          🔧 Admin handleiding
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 900, marginBottom: '8px' }}>Handleiding voor admins</h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.55)', maxWidth: '480px', margin: '0 auto' }}>
          Uitgebreide stap-voor-stap instructies voor het beheer van de DE GEMEENSCHAP app.
        </p>
      </div>

      <HelpGuide adminMode />
    </div>
  )
}
