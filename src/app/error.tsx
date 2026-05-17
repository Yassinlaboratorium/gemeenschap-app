'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-poppins, Poppins, sans-serif)', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div style={{ display: 'inline-flex', width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#414141', marginBottom: '8px' }}>Er ging iets mis</h1>
        <p style={{ fontSize: '14px', color: 'rgba(65,65,65,0.55)', marginBottom: '28px', lineHeight: 1.6 }}>
          Er is een onverwachte fout opgetreden. Probeer het opnieuw of ga terug naar de startpagina.
        </p>
        {error.digest && (
          <p style={{ fontSize: '11px', color: 'rgba(65,65,65,0.35)', marginBottom: '20px', fontFamily: 'monospace' }}>
            foutcode: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#1B9193', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
          >
            Opnieuw proberen
          </button>
          <Link
            href="/"
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#F8F8F8', border: '1px solid #D9D9D9', color: '#414141', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
          >
            Startpagina
          </Link>
        </div>
      </div>
    </div>
  )
}
