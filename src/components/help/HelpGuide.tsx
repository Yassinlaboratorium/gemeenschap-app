'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Printer } from 'lucide-react'

const T = '#1B9193'
const G = '#9FB139'

/* ─── shared styles ─── */
const s = {
  pill: { display: 'inline-block', background: 'rgba(27,145,147,.1)', color: T, fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', marginBottom: '10px' } as React.CSSProperties,
  card: { background: 'white', border: '1px solid #e2e8d8', borderRadius: '14px', overflow: 'hidden' } as React.CSSProperties,
  screenBar: { background: '#0d1117', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' } as React.CSSProperties,
  screenBody: { background: '#1a1f2e', padding: '20px 24px', minHeight: '180px' } as React.CSSProperties,
  callout: { display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'white', border: `2px solid ${T}`, borderRadius: '14px', padding: '16px 20px', marginBottom: '14px' } as React.CSSProperties,
}

function Dot({ c }: { c: string }) {
  return <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
}
function ScreenBar({ url }: { url: string }) {
  return (
    <div style={s.screenBar}>
      <Dot c="#ff5f57" /><Dot c="#febc2e" /><Dot c="#28c840" />
      <div style={{ flex: 1, background: '#1e2330', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'rgba(255,255,255,.4)', margin: '0 10px' }}>{url}</div>
    </div>
  )
}
function MockBtn({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${T}, ${G})`, color: 'white', fontSize: '12px', fontWeight: 700,
      padding: '8px 16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px',
      position: 'relative', outline: highlight ? `2px solid white` : 'none', outlineOffset: highlight ? '3px' : '0',
    }}>
      {children}
    </div>
  )
}
function StepNum({ n, done }: { n: number | string; done?: boolean }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? G : T, color: 'white', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {n}
    </div>
  )
}

/* ─── TASK 1 steps ─── */
const TASK1_STEPS = [
  {
    title: 'Open het admin-paneel',
    callout: 'Ga naar Admin → Activiteiten via de navigatiebalk bovenaan.',
    sub: 'URL: gemeenschap-app.vercel.app/admin/activities',
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Activiteiten</div>
        <div style={{ color: 'rgba(255,255,255,.3)', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
          Je bent ingelogd als admin 👋
        </div>
      </div>
    ),
  },
  {
    title: 'Klik "+ Nieuwe activiteit"',
    callout: 'Klik op de knop "+ Nieuwe activiteit" rechtsboven op de pagina.',
    sub: 'De knop heeft een groen-blauwe kleur — je kan hem niet missen.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>Activiteiten</div>
          <MockBtn highlight>➕ Nieuwe activiteit</MockBtn>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Naam','Datum','Status'].map(h => <th key={h} style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', textAlign: 'left', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={{ fontSize: '12px', color: 'rgba(255,255,255,.7)', padding: '10px 0' }}>Kookworkshop mei</td><td style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>22/05/2026</td><td><span style={{ background: `rgba(159,177,57,.15)`, color: G, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>Actief</span></td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: 'Vul het formulier in',
    callout: 'Vul naam, datum, locatie, beschrijving en prijs in.',
    sub: 'Alle velden met * zijn verplicht. Kies "Gratis" als er geen kostprijs is.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Nieuwe activiteit</div>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[['Naam *', 'Zomerkamp 2026'], ['Datum *', '14/07/2026'], ['Locatie *', 'Sportpark Sint-Niklaas'], ['Prijs (€)', '25']].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,.35)', marginBottom: '4px' }}>{label}</div>
              <div style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${T}`, borderRadius: '8px', padding: '9px 12px', color: 'rgba(255,255,255,.8)', fontSize: '12px' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Klik "Activiteit aanmaken"',
    callout: 'Scroll naar beneden en klik op de grote "Activiteit aanmaken" knop.',
    sub: 'De activiteit is meteen zichtbaar voor alle gebruikers.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Nieuwe activiteit</div>
        <div style={{ color: 'rgba(255,255,255,.25)', fontSize: '12px', marginBottom: '16px' }}>[... formulier ...]</div>
        <MockBtn highlight>✓ Activiteit aanmaken</MockBtn>
      </div>
    ),
  },
  {
    title: 'Klaar! 🎉',
    callout: 'De activiteit staat nu online! Ouders en jongeren kunnen zich inschrijven.',
    sub: 'Je kan de activiteit altijd bewerken via het potlood-icoon in de lijst.',
    calloutColor: G,
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Komende activiteiten</div>
        <div style={{ background: `rgba(159,177,57,.1)`, border: `1px solid rgba(159,177,57,.25)`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>⛺</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Zomerkamp 2026</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>📅 14 jul · 📍 Sportpark Sint-Niklaas · €25</div>
          </div>
          <span style={{ marginLeft: 'auto', background: `rgba(159,177,57,.15)`, color: G, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>Nieuw ✨</span>
        </div>
      </div>
    ),
  },
]

/* ─── TASK 2 steps ─── */
const TASK2_STEPS = [
  {
    title: 'Open de activiteit',
    callout: 'Ga naar Admin → Activiteiten en klik op "inschrijvingen" naast de activiteit.',
    sub: 'Of klik op het personen-icoon naast de activiteitsnaam.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: 'white', marginBottom: '14px' }}>Activiteiten</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ fontSize: '13px', fontWeight: 600, color: 'white', padding: '10px 0' }}>Zomerkamp 2026</td>
              <td style={{ fontSize: '11px', color: 'rgba(27,145,147,.9)', fontWeight: 700, cursor: 'pointer' }}>👥 inschrijvingen</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: 'Bekijk de deelnemerslijst',
    callout: 'Je ziet naam, leeftijd, contactinfo en betalingsstatus van elke deelnemer.',
    sub: 'De lijst toont alle inschrijvingen inclusief betalingsstatus.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>Inschrijvingen — Zomerkamp 2026 <span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400, fontSize: '11px' }}>12 deelnemers</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Naam','Leeftijd','Betaling'].map(h => <th key={h} style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', textAlign: 'left', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {[['Ahmed B.','14 jr','Betaald'],['Sara V.','12 jr','Gratis'],['Yannick D.','15 jr','In afwachting']].map(([n,a,s2]) => (
              <tr key={n}><td style={{ fontSize: '12px', color: 'white', padding: '8px 0' }}>{n}</td><td style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>{a}</td><td><span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '100px', background: s2==='Betaald'?`rgba(159,177,57,.15)`:s2==='Gratis'?`rgba(27,145,147,.15)`:'rgba(255,255,255,.06)', color: s2==='Betaald'?G:s2==='Gratis'?'#4ecbcd':'rgba(255,255,255,.4)' }}>{s2}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    title: 'Exporteer naar Excel',
    callout: 'Klik op "Exporteer Excel" om de lijst te downloaden als .xlsx bestand.',
    sub: 'Je kan ook exporteren als PDF of direct afdrukken.',
    screen: (
      <div style={s.screenBody}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '16px' }}>
          <MockBtn highlight>📊 Exporteer Excel</MockBtn>
          <div style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.45)', fontSize: '12px', fontWeight: 700, padding: '8px 14px', borderRadius: '10px' }}>📄 PDF</div>
          <div style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.45)', fontSize: '12px', fontWeight: 700, padding: '8px 14px', borderRadius: '10px' }}>🖨️ Afdrukken</div>
        </div>
        <div style={{ background: `rgba(159,177,57,.08)`, border: `1px solid rgba(159,177,57,.2)`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>
          ✓ <span style={{ color: G, fontWeight: 700 }}>zomerkamp_2026_inschrijvingen.xlsx</span> wordt gedownload…
        </div>
      </div>
    ),
  },
]

/* ─── TASK 3 steps ─── */
const TASK3_STEPS = [
  {
    title: 'Open "Push sturen"',
    callout: 'Ga naar Admin → Activiteiten en klik op "Push sturen" rechtsboven.',
    sub: 'Je vindt de knop naast "+ Nieuwe activiteit".',
    screen: (
      <div style={s.screenBody}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', fontSize: '12px', fontWeight: 700, padding: '8px 14px', borderRadius: '10px', outline: '2px solid rgba(255,107,107,.7)', outlineOffset: '3px' }}>🔔 Push sturen</div>
          <MockBtn>➕ Nieuwe activiteit</MockBtn>
        </div>
      </div>
    ),
  },
  {
    title: 'Schrijf je bericht',
    callout: 'Typ een titel (max 80 tekens) en een bericht (max 160 tekens).',
    sub: 'Tip: wees concreet — bijv. "Zomerkamp: nog 5 plaatsen vrij!"',
    screen: (
      <div style={s.screenBody}>
        <div style={{ background: '#1a2540', border: '1px solid rgba(255,255,255,.1)', borderRadius: '18px', padding: '18px', maxWidth: '340px', margin: '0 auto' }}>
          <div style={{ fontWeight: 800, color: 'white', marginBottom: '12px', fontSize: '14px' }}>🔔 Push notificatie</div>
          {[['Titel', 'Zomerkamp: nog 5 plaatsen!'], ['Bericht', 'Schrijf je nu in voor het zomerkamp van 14 juli!']].map(([l, v]) => (
            <div key={l} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,.35)', marginBottom: '4px' }}>{l}</div>
              <div style={{ background: 'rgba(255,255,255,.06)', border: `1px solid ${T}`, borderRadius: '8px', padding: '8px 12px', color: 'rgba(255,255,255,.8)', fontSize: '12px' }}>{v}</div>
            </div>
          ))}
          <MockBtn highlight>📨 Verzenden naar alle subscribers</MockBtn>
        </div>
      </div>
    ),
  },
  {
    title: 'Bericht verstuurd! 📱',
    callout: 'Alle gebruikers die toestemming gaven, zien het bericht op hun telefoon.',
    sub: 'Ook als de app gesloten is, ontvangen ze de notificatie.',
    calloutColor: G,
    screen: (
      <div style={{ ...s.screenBody, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: '#1a2540', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', padding: '16px', maxWidth: '280px', width: '100%' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)', textAlign: 'center', marginBottom: '12px' }}>Vergrendelscherm</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: `rgba(27,145,147,.12)`, border: `1px solid rgba(27,145,147,.2)`, borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${T}, ${G})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🏘️</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Zomerkamp: nog 5 plaatsen!</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>DE GEMEENSCHAP · zojuist</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

const FAQS = [
  { q: 'Ik zie de "Nieuwe activiteit" knop niet.', a: 'Je bent waarschijnlijk niet ingelogd als admin. Log uit en terug in met een admin-account. Als je geen admin-rechten hebt, vraag ze aan de verantwoordelijke.' },
  { q: 'Een ouder zegt dat ze de activiteit niet ziet.', a: 'Controleer of de datum in de toekomst ligt — afgelopen activiteiten worden automatisch verborgen. Controleer ook of de activiteit correct is aangemaakt (staat ze in de Admin lijst?).' },
  { q: 'Push notificaties worden niet ontvangen.', a: 'De gebruiker moet eerst toestemming hebben gegeven via het belletje-icoontje in de app. Controleer ook de telefooninstellingen van de gebruiker.' },
  { q: 'Hoe verwijder ik een activiteit?', a: 'Klik op het vuilbak-icoon naast de activiteit en bevestig. Let op: exporteer eerst de inschrijvingen als je ze wil bewaren.' },
  { q: 'Kan ik meerdere sessies toevoegen?', a: 'Ja — kies het type "Sessie-gebaseerd" bij het aanmaken. Je kan dan meerdere data en tijdstippen toevoegen.' },
]

/* ─── CHEATSHEET ─── */
function Cheatsheet() {
  return (
    <div id="cheatsheet" style={{ background: 'white', border: '2px solid #e2e8d8', borderRadius: '20px', padding: 'clamp(24px, 4vw, 40px)', maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: T }}>🏘️ DE GEMEENSCHAP App</h2>
        <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Snel overzicht voor jeugdwerkers · vzw Sint-Niklaas</p>
      </div>
      <div style={{ background: '#f0f7f7', border: `2px solid ${T}`, borderRadius: '12px', padding: '14px 20px', textAlign: 'center', marginBottom: '24px', fontSize: '17px', fontWeight: 800, color: T }}>
        🌐 gemeenschap-app.vercel.app
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: '➕', title: 'Activiteit aanmaken', path: 'Admin → Activiteiten → "+ Nieuwe activiteit"' },
          { icon: '👥', title: 'Inschrijvingen bekijken', path: 'Admin → Activiteiten → "inschrijvingen"' },
          { icon: '🔔', title: 'Push notificatie sturen', path: 'Admin → Activiteiten → "Push sturen"' },
          { icon: '📊', title: 'Excel exporteren', path: 'Inschrijvingen pagina → "Exporteer Excel"' },
          { icon: '✏️', title: 'Activiteit bewerken', path: 'Admin → Activiteiten → potlood-icoon' },
          { icon: '📈', title: 'Analytics & statistieken', path: 'Admin → Analytics (bovenste nav)' },
        ].map(item => (
          <div key={item.title} style={{ background: '#f7f9f4', border: '1px solid #e2e8d8', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '3px', lineHeight: 1.5 }}>
                {item.path.split('"').map((part, i) =>
                  i % 2 === 1
                    ? <strong key={i} style={{ color: T }}>&ldquo;{part}&rdquo;</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: T, borderRadius: '14px', padding: '18px 22px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' as const }}>
        <div style={{ width: '72px', height: '72px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="56" height="56" viewBox="0 0 60 60">
            <rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke={T} strokeWidth="2.5"/>
            <rect x="9" y="9" width="10" height="10" rx="1" fill={T}/>
            <rect x="36" y="4" width="20" height="20" rx="2" fill="none" stroke={T} strokeWidth="2.5"/>
            <rect x="41" y="9" width="10" height="10" rx="1" fill={T}/>
            <rect x="4" y="36" width="20" height="20" rx="2" fill="none" stroke={T} strokeWidth="2.5"/>
            <rect x="9" y="41" width="10" height="10" rx="1" fill={T}/>
            <rect x="28" y="28" width="5" height="5" fill={G}/>
            <rect x="35" y="28" width="5" height="5" fill={G}/>
            <rect x="42" y="28" width="5" height="5" fill={G}/>
            <rect x="49" y="35" width="5" height="5" fill={G}/>
            <rect x="28" y="42" width="5" height="5" fill={G}/>
            <rect x="42" y="49" width="5" height="5" fill={G}/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800 }}>Scan om de app te openen</div>
          <div style={{ fontSize: '13px', opacity: .8, marginTop: '3px' }}>gemeenschap-app.vercel.app</div>
          <div style={{ fontSize: '13px', opacity: .65, marginTop: '2px' }}>Werkt op Android en iPhone (Safari)</div>
        </div>
      </div>
      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f7f9f4', borderRadius: '10px', fontSize: '13px', color: '#888', display: 'flex', gap: '20px', flexWrap: 'wrap' as const }}>
        <span>📧 <strong>Support:</strong> info@degemeenschap.be</span>
        <span>🌐 <strong>Website:</strong> degemeenschap.be</span>
      </div>
    </div>
  )
}

/* ─── WALKTHROUGH TASK ─── */
function TaskWalkthrough({ steps }: { steps: typeof TASK1_STEPS }) {
  const [current, setCurrent] = useState(0)
  const total = steps.length

  return (
    <div>
      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => setCurrent(i)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: i < current ? G : i === current ? T : '#e2e8d8', color: i <= current ? 'white' : '#999', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                {i < current ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: i === current ? T : '#aaa', whiteSpace: 'nowrap' }}>{step.title}</div>
            </button>
            {i < total - 1 && <div style={{ width: '24px', height: '2px', background: i < current ? G : '#e2e8d8', marginBottom: '18px', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Current step */}
      {(() => {
        const step = steps[current]
        return (
          <div>
            <div style={{ ...s.callout, borderColor: step.calloutColor ?? T }}>
              <span style={{ fontSize: '22px' }}>{'calloutColor' in step ? '🎉' : '👆'}</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{step.callout}</div>
                {step.sub && <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>{step.sub}</div>}
              </div>
            </div>
            <div style={{ background: '#1a1f2e', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 6px 30px rgba(0,0,0,.15)' }}>
              <ScreenBar url="gemeenschap-app.vercel.app/admin/…" />
              {step.screen}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                style={{ background: 'white', color: current === 0 ? '#ccc' : '#555', border: '2px solid #e2e8d8', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: current === 0 ? 'default' : 'pointer' }}
              >
                ← Vorige
              </button>
              <button
                onClick={() => setCurrent(c => Math.min(total - 1, c + 1))}
                disabled={current === total - 1}
                style={{ background: current === total - 1 ? '#ccc' : `linear-gradient(135deg, ${T}, ${G})`, color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 700, cursor: current === total - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {current === total - 1 ? 'Voltooid ✓' : 'Volgende →'}
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa', fontWeight: 600 }}>Stap {current + 1} / {total}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ─── MAIN COMPONENT ─── */
type Tab = 'activiteit' | 'inschrijvingen' | 'push' | 'spiekbriefje' | 'faq'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'activiteit', icon: '➕', label: 'Activiteit aanmaken' },
  { id: 'inschrijvingen', icon: '📋', label: 'Inschrijvingen' },
  { id: 'push', icon: '🔔', label: 'Push sturen' },
  { id: 'spiekbriefje', icon: '🗒️', label: 'Spiekbriefje' },
  { id: 'faq', icon: '❓', label: 'FAQ' },
]

export function HelpGuide({ adminMode = false }: { adminMode?: boolean }) {
  const [tab, setTab] = useState<Tab>('activiteit')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div>
      {/* Tab nav */}
      <div style={{ background: 'white', borderBottom: '2px solid #e2e8d8', display: 'flex', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
        <div style={{ display: 'flex', padding: '0 5%' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, padding: '16px 20px', fontSize: '13px', fontWeight: 700, color: tab === t.id ? T : '#888', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.id ? T : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'color .2s' }}>
              <span style={{ fontSize: '15px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 5%' }}>
          <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1.5px solid #e2e8d8', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, color: '#666', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Printer size={13} /> Afdrukken
          </button>
        </div>
      </div>

      {/* Section title */}
      <div style={{ padding: '36px 5% 0' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {tab !== 'spiekbriefje' && tab !== 'faq' && (
            <div style={{ marginBottom: '24px' }}>
              <span style={s.pill}>Taak {TABS.findIndex(t => t.id === tab) + 1}</span>
              <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, marginBottom: '6px' }}>
                {TABS.find(t => t.id === tab)?.label}
              </h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {tab === 'activiteit' && 'Volg de stappen om een nieuwe activiteit online te zetten.'}
                {tab === 'inschrijvingen' && 'Bekijk wie zich heeft ingeschreven en exporteer de lijst.'}
                {tab === 'push' && 'Stuur een bericht naar alle gebruikers die de app op hun telefoon hebben.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 5% 60px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {tab === 'activiteit' && <TaskWalkthrough steps={TASK1_STEPS} />}
          {tab === 'inschrijvingen' && <TaskWalkthrough steps={TASK2_STEPS} />}
          {tab === 'push' && <TaskWalkthrough steps={TASK3_STEPS} />}

          {tab === 'spiekbriefje' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={s.pill}>Spiekbriefje</span>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, marginBottom: '6px' }}>Snel overzicht — printbaar</h2>
                <p style={{ fontSize: '14px', color: '#888' }}>Print dit blad en hang het op bij de computer in het jeugdhuis.</p>
              </div>
              <Cheatsheet />
            </div>
          )}

          {tab === 'faq' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span style={s.pill}>FAQ</span>
                <h2 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, marginBottom: '6px' }}>Veelgestelde vragen</h2>
                <p style={{ fontSize: '14px', color: '#888' }}>Klik op een vraag om het antwoord te lezen.</p>
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                {FAQS.map((item, i) => (
                  <div key={i} style={{ background: 'white', border: `1px solid ${openFaq === i ? T : '#e2e8d8'}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color .2s' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '26px', height: '26px', background: '#f0f7f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: T, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', textAlign: 'left' }}>{item.q}</span>
                      </div>
                      {openFaq === i ? <ChevronDown size={16} color="#aaa" /> : <ChevronRight size={16} color="#aaa" />}
                    </button>
                    {openFaq === i && (
                      <p style={{ padding: '0 22px 18px 60px', fontSize: '14px', color: '#666', lineHeight: 1.7 }}>{item.a}</p>
                    )}
                  </div>
                ))}
              </div>

              {adminMode && (
                <div style={{ marginTop: '32px', background: '#fff9e6', border: '1px solid #fde68a', borderRadius: '14px', padding: '20px 24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>🔧 Technische problemen?</div>
                  <p style={{ fontSize: '14px', color: '#92400e', lineHeight: 1.7 }}>
                    Bij ernstige problemen (app onbereikbaar, betalingen falen): controleer de <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309' }}>Vercel status</a> en <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#b45309' }}>Supabase status</a>. Contacteer de ontwikkelaar via info@degemeenschap.be.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
