import { useState } from 'react'
import { FabState, PanelState } from './OverlayStates'

const FONT_MONO = "'JetBrains Mono', monospace"
const FONT_SANS = "'Inter', system-ui, sans-serif"

function SectionLabel({ state, title }: { state: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{
        fontSize: '10px', fontFamily: FONT_MONO, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        padding: '2px 8px', borderRadius: '4px',
      }}>{state}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: FONT_SANS, color: 'rgba(255,255,255,0.5)' }}>{title}</span>
    </div>
  )
}

export default function FustationShowcase() {
  const [fabHovered, setFabHovered] = useState(false)

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'radial-gradient(ellipse at 15% 55%,rgba(16,185,129,0.15) 0%,transparent 50%),radial-gradient(ellipse at 85% 20%,rgba(99,102,241,0.18) 0%,transparent 48%),radial-gradient(ellipse at 60% 90%,rgba(14,165,233,0.12) 0%,transparent 48%),#000',
      fontFamily: FONT_SANS,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: '48px', paddingBottom: '64px', gap: '0',
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Page header */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '44px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', padding: '4px 14px 4px 8px', marginBottom: '16px',
        }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#059669,#0284c7)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span style={{ fontSize: '11px', fontFamily: FONT_MONO, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            fustation-tool · MV3 overlay
          </span>
        </div>
        <h1 style={{
          fontSize: '24px', fontWeight: 700, margin: 0, lineHeight: 1.2,
          background: 'linear-gradient(90deg,#34d399,#38bdf8,#a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Extension UI Mockup</h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', margin: '8px 0 0', fontWeight: 400 }}>
          Glassmorphism · AMOLED Dark · Content Script Overlay
        </p>
      </div>

      {/* States — stacked vertically, centred */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', width: '100%', maxWidth: '680px', padding: '0 24px' }}>

        {/* ── State A: FAB ── */}
        <div style={{ width: '100%' }}>
          <SectionLabel state="State A" title="Collapsed FAB" />
          <div style={{
            width: '100%', height: '180px',
            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Fake page lines */}
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                position: 'absolute', left: '20px', top: `${28 + i * 28}px`, height: '9px',
                borderRadius: '4px', background: `rgba(255,255,255,${0.035 - i * 0.005})`,
                width: i % 2 === 0 ? '55%' : '38%',
              }} />
            ))}
            <FabState hovered={fabHovered} onHover={setFabHovered} />
          </div>
          {/* Annotation */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', paddingLeft: '2px' }}>
            {[
              { dot: '#34d399', label: '48×48px · fixed bottom-right' },
              { dot: '#38bdf8', label: 'Pulse ring on idle' },
              { dot: '#a78bfa', label: 'Badge: 3 saved exams' },
            ].map(({ dot, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot, boxShadow: `0 0 4px ${dot}`, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: FONT_SANS }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── State B: Expanded Panel ── */}
        <div style={{ width: '100%' }}>
          <SectionLabel state="State B" title="Expanded Control Panel" />
          <PanelState />
        </div>

      </div>
    </div>
  )
}
