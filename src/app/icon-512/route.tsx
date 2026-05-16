import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const LOGO_URL =
  'https://degemeenschap.be/wp-content/uploads/2024/06/LogoTransp-e1719229309956.png'

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
          background: '#0B1020',
          padding: '72px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} style={{ width: '100%', objectFit: 'contain' }} alt="" />
      </div>
    ),
    { width: 512, height: 512 }
  )
}
