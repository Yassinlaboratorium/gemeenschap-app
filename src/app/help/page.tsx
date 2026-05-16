import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { HelpGuide } from '@/components/help/HelpGuide'

export const metadata: Metadata = {
  title: 'Handleiding — DE GEMEENSCHAP App',
  description: 'Stap-voor-stap handleiding voor jeugdwerkers van vzw De Gemeenschap Sint-Niklaas.',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ background: '#f7f9f4', fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}>
      <header style={{ background: 'linear-gradient(135deg, #1B9193, #157a7c)', color: 'white', padding: '0 5%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link href="/">
            <Image src="/logo.png" alt="DE GEMEENSCHAP" width={120} height={26} style={{ height: '26px', width: 'auto' }} />
          </Link>
          <Link
            href="/login"
            style={{ background: 'rgba(255,255,255,.15)', color: 'white', fontWeight: 700, fontSize: '13px', padding: '8px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            Inloggen
          </Link>
        </div>
      </header>

      <div style={{ background: 'linear-gradient(135deg, #1B9193, #157a7c)', color: 'white', padding: '40px 5% 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', fontSize: '12px', fontWeight: 600, padding: '5px 14px', borderRadius: '100px', marginBottom: '16px' }}>
          📱 Jeugdwerkers handleiding
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 900, marginBottom: '8px' }}>DE GEMEENSCHAP App</h1>
        <p style={{ fontSize: '15px', opacity: .85, maxWidth: '480px', margin: '0 auto' }}>
          Alles wat je nodig hebt om de app te beheren — stap voor stap uitgelegd.
        </p>
      </div>

      <HelpGuide />
    </div>
  )
}
