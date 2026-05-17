'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="nl">
      <body style={{ margin: 0, minHeight: '100vh', background: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#414141', marginBottom: '8px' }}>Er ging iets mis</h1>
          <p style={{ fontSize: '14px', color: 'rgba(65,65,65,0.55)', marginBottom: '24px' }}>
            De pagina kon niet worden geladen.
          </p>
          <button
            onClick={reset}
            style={{ padding: '10px 24px', borderRadius: '12px', background: '#1B9193', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
          >
            Opnieuw proberen
          </button>
        </div>
      </body>
    </html>
  )
}
