import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB 0%, #22C55E 100%)',
          borderRadius: '18%',
        }}
      >
        <span
          style={{
            fontSize: 210,
            fontWeight: 900,
            color: 'white',
            fontFamily: 'system-ui, Arial, sans-serif',
            letterSpacing: '-10px',
          }}
        >
          DG
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
