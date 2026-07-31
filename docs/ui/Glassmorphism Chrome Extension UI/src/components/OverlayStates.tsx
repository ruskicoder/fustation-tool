import { useState } from 'react'

const FONT_MONO = "'JetBrains Mono', monospace"
const FONT_SANS = "'Inter', system-ui, sans-serif"

const C = {
  emerald: '#34d399',
  sky: '#38bdf8',
  violet: '#a78bfa',
  emeraldDim: 'rgba(52,211,153,0.12)',
  skyDim: 'rgba(56,189,248,0.12)',
  violetDim: 'rgba(167,139,250,0.12)',
  white8: 'rgba(255,255,255,0.08)',
  white6: 'rgba(255,255,255,0.06)',
  white4: 'rgba(255,255,255,0.04)',
  white3: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.10)',
  borderDim: 'rgba(255,255,255,0.07)',
  text: '#f1f5f9',
  textMid: 'rgba(255,255,255,0.55)',
  textDim: 'rgba(255,255,255,0.32)',
  textFaint: 'rgba(255,255,255,0.22)',
}

const glass = {
  background: 'rgba(6,8,18,0.86)',
  backdropFilter: 'blur(28px)',
  WebkitBackdropFilter: 'blur(28px)',
  border: `1px solid ${C.border}`,
}

function SubjectBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: '4px',
      fontSize: '10px', fontFamily: FONT_MONO, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      background: `${color}1a`, color, border: `1px solid ${color}33`,
      lineHeight: '1.6', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function StatusPill({ status }: { status: 'extracted' | 'ready' | 'scanning' }) {
  const map = {
    extracted: { label: 'Extracted', color: C.emerald, bg: C.emeraldDim },
    ready:     { label: 'Ready',     color: C.sky,     bg: C.skyDim     },
    scanning:  { label: 'Scanning…', color: C.violet,  bg: C.violetDim  },
  }
  const cfg = map[status]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '999px',
      fontSize: '11px', fontFamily: FONT_SANS, fontWeight: 500,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
    }}>
      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
      {cfg.label}
    </div>
  )
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
export function FabState({ hovered, onHover }: { hovered: boolean; onHover: (v: boolean) => void }) {
  return (
    <div
      style={{ position: 'relative', width: '48px', height: '48px', cursor: 'pointer' }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <style>{`
        @keyframes fab-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: '-8px', borderRadius: '50%',
        border: `1.5px solid ${C.emerald}44`,
        animation: 'fab-pulse 2.4s ease-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle,${C.emerald}55 0%,transparent 70%)`,
        filter: 'blur(10px)',
        transform: hovered ? 'scale(1.7)' : 'scale(1.2)',
        opacity: hovered ? 1 : 0.55,
        transition: 'transform 0.25s ease,opacity 0.25s ease',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative', width: '48px', height: '48px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered ? 'linear-gradient(135deg,#059669,#0284c7)' : 'linear-gradient(135deg,#047857,#075985)',
        border: `1.5px solid ${C.emerald}55`,
        boxShadow: hovered ? `0 8px 32px rgba(16,185,129,0.45)` : `0 4px 20px rgba(16,185,129,0.25)`,
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <div style={{
          position: 'absolute', top: '-4px', right: '-4px',
          width: '17px', height: '17px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#34d399,#38bdf8)',
          fontSize: '9px', fontFamily: FONT_SANS, fontWeight: 700, color: '#000',
          boxShadow: `0 0 8px ${C.emerald}88`, border: '1.5px solid #000',
        }}>3</div>
      </div>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', right: 0,
          padding: '6px 10px', borderRadius: '8px', whiteSpace: 'nowrap',
          ...glass,
          fontSize: '11px', fontFamily: FONT_SANS, color: 'rgba(255,255,255,0.8)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none',
        }}>
          fustation-tool · 3 saved
        </div>
      )}
    </div>
  )
}

// ─── PANEL (landscape 2:1) ─────────────────────────────────────────────────────
const SAVED_EXAMS = [
  { id: '1', subject: 'MLN122', code: 'MLN122_SP26_B5FE_915637', ts: '30/07/2026 14:32', count: 60, color: C.emerald },
  { id: '2', subject: 'KTE301', code: 'KTE301_SP26_A2BC_748291', ts: '28/07/2026 09:15', count: 45, color: C.sky    },
  { id: '3', subject: 'PLT205', code: 'PLT205_SP26_C7DE_334412', ts: '25/07/2026 21:08', count: 30, color: C.violet },
]

export function PanelState() {
  const [tab, setTab]           = useState<'extract' | 'saved'>('extract')
  const [exams, setExams]       = useState(SAVED_EXAMS)
  const [extracting, setExtr]   = useState(false)
  const [extracted, setDone]    = useState(false)

  const handleExtract = () => {
    setExtr(true)
    setTimeout(() => { setExtr(false); setDone(true) }, 2200)
  }

  // Panel: 580px × ~290px → ~2:1
  return (
    <div style={{
      ...glass,
      borderRadius: '18px',
      width: '580px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: `0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px ${C.emerald}0a inset, 0 1px 0 rgba(255,255,255,0.08) inset`,
    }}>
      <style>{`
        @keyframes panel-progress { from { width:0% } to { width:58% } }
        .fustation-scrollbar::-webkit-scrollbar { width: 3px; }
        .fustation-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .fustation-scrollbar::-webkit-scrollbar-thumb { background: rgba(52,211,153,0.25); border-radius: 2px; }
        .fus-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(16,185,129,0.4) !important; }
        .fus-btn-primary:active { transform: translateY(0); }
        .fus-btn-sec:hover  { background: rgba(255,255,255,0.10) !important; }
        .fus-row:hover      { background: rgba(255,255,255,0.055) !important; }
        .fus-icon-btn:hover { background: rgba(255,255,255,0.10) !important; color: #34d399 !important; }
        .fus-tab-btn:hover  { color: rgba(255,255,255,0.7) !important; }
        .fus-ctrl-btn:hover { background: rgba(255,255,255,0.10) !important; }
        .fus-close-btn:hover { background: rgba(239,68,68,0.18) !important; color: #f87171 !important; }
      `}</style>

      {/* Accent hairline */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,rgba(52,211,153,0.6),rgba(56,189,248,0.5),rgba(167,139,250,0.4),transparent)', flexShrink: 0 }} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${C.borderDim}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#059669,#0284c7)',
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '13px', fontWeight: 700, lineHeight: 1, fontFamily: FONT_SANS,
              background: 'linear-gradient(90deg,#34d399,#38bdf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>fustation-tool</div>
            <div style={{ fontSize: '10px', color: C.textFaint, fontFamily: FONT_MONO, marginTop: '2px', lineHeight: 1 }}>v1.0.0 · MV3</div>
          </div>
        </div>

        {/* Tabs in header centre */}
        <div style={{ display: 'flex', gap: '3px' }}>
          {(['extract', 'saved'] as const).map(t => (
            <button key={t} className="fus-tab-btn" onClick={() => setTab(t)} style={{
              padding: '4px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 500,
              fontFamily: FONT_SANS, cursor: 'pointer', transition: 'all 0.15s ease',
              background: tab === t ? C.emeraldDim : 'transparent',
              color:      tab === t ? C.emerald    : C.textDim,
              border:     tab === t ? `1px solid ${C.emerald}33` : '1px solid transparent',
            }}>
              {t === 'extract' ? 'Extract' : `Saved (${exams.length})`}
            </button>
          ))}
        </div>

        {/* Status + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusPill status={extracted ? 'extracted' : extracting ? 'scanning' : 'ready'} />
          <div style={{ display: 'flex', gap: '3px' }}>
            {['–', '×'].map((ch, i) => (
              <button key={ch} className={i === 1 ? 'fus-close-btn' : 'fus-ctrl-btn'} style={{
                width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${C.borderDim}`,
                background: C.white4, color: C.textDim, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: i === 1 ? '12px' : '14px', fontFamily: 'monospace', lineHeight: 1,
                transition: 'all 0.15s ease',
              }}>{ch}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {tab === 'extract' ? (
        /* Landscape split: left = exam info, right = actions */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', minHeight: 0 }}>

          {/* Left: exam info */}
          <div style={{ padding: '14px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Badge row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <SubjectBadge label="MLN122" color={C.emerald} />
              <span style={{
                fontSize: '10px', fontFamily: FONT_MONO, padding: '2px 7px', borderRadius: '4px',
                background: C.violetDim, color: C.violet, border: `1px solid ${C.violet}33`,
              }}>XAVALO</span>
            </div>

            {/* Subject name */}
            <p style={{ fontSize: '11px', color: C.textDim, fontFamily: FONT_SANS, margin: 0, lineHeight: 1.4 }}>
              Kinh tế chính trị Mác-Lênin
            </p>

            {/* Exam code */}
            <p style={{
              fontSize: '12px', fontWeight: 700, fontFamily: FONT_MONO,
              color: C.text, letterSpacing: '0.04em', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title="MLN122_SP26_B5FE_915637">
              MLN122_SP26_B5FE_915637
            </p>

            {/* Metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[{ value: '60', label: 'Questions' }, { value: 'SP26', label: 'Semester' }, { value: 'B5FE', label: 'Section' }].map(({ value, label }) => (
                <div key={label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '7px 4px', borderRadius: '9px', gap: '2px',
                  background: C.white3, border: `1px solid ${C.borderDim}`,
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: FONT_MONO, color: C.text, lineHeight: 1 }}>{value}</span>
                  <span style={{ fontSize: '9px', fontFamily: FONT_SANS, color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Progress bar (extracting only) */}
            {extracting && (
              <div style={{ background: C.white3, border: `1px solid ${C.borderDim}`, borderRadius: '8px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontFamily: FONT_SANS, color: C.textDim }}>Extracting…</span>
                  <span style={{ fontSize: '10px', fontFamily: FONT_MONO, color: C.emerald }}>34 / 60</span>
                </div>
                <div style={{ height: '3px', borderRadius: '999px', background: C.white8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    background: 'linear-gradient(90deg,#059669,#0284c7)',
                    boxShadow: `0 0 6px ${C.emerald}66`,
                    animation: 'panel-progress 2.2s ease-out forwards',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Vertical divider */}
          <div style={{ background: C.borderDim, alignSelf: 'stretch' }} />

          {/* Right: actions */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            <button
              className="fus-btn-primary"
              onClick={handleExtract}
              disabled={extracting}
              style={{
                width: '100%', padding: '11px', borderRadius: '11px', border: 'none',
                cursor: extracting ? 'not-allowed' : 'pointer',
                background: extracting ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#059669 0%,#0284c7 55%,#4f46e5 100%)',
                color: '#fff', fontSize: '13px', fontWeight: 600, fontFamily: FONT_SANS,
                boxShadow: extracting ? 'none' : '0 4px 20px rgba(16,185,129,0.3)',
                transition: 'all 0.18s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              }}
            >
              <span style={{ fontSize: '14px' }}>⚡</span>
              {extracting ? 'Extracting...' : extracted ? '✓ Extracted' : 'Extract & Save'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              {[{ icon: '📥', label: 'Export .md' }, { icon: '🖨️', label: 'Print PDF' }].map(({ icon, label }) => (
                <button key={label} className="fus-btn-sec" style={{
                  padding: '9px 6px', borderRadius: '9px',
                  background: C.white6, border: `1px solid ${C.border}`,
                  color: C.textMid, fontSize: '11.5px', fontWeight: 500,
                  fontFamily: FONT_SANS, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                  transition: 'background 0.15s ease',
                }}>
                  <span style={{ fontSize: '12px' }}>{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Saved tab: compact horizontal list ── */
        <div className="fustation-scrollbar" style={{ overflowY: 'auto', maxHeight: '230px' }}>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontFamily: FONT_SANS, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textDim }}>
                Saved Exams ({exams.length})
              </span>
              {exams.length > 0 && (
                <button onClick={() => setExams([])} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                  color: 'rgba(239,68,68,0.65)', fontSize: '10px', fontFamily: FONT_SANS,
                  transition: 'all 0.15s ease',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Clear all
                </button>
              )}
            </div>

            {exams.length === 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '28px 20px', borderRadius: '10px',
                background: C.white3, border: `1px dashed ${C.borderDim}`,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 8h14M5 8a2 2 0 1 0 0-4h14a2 2 0 1 0 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
                </svg>
                <span style={{ fontSize: '12px', fontFamily: FONT_SANS, color: C.textFaint }}>No saved exams</span>
              </div>
            ) : (
              exams.map(exam => (
                <div key={exam.id} className="fus-row" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '10px',
                  background: C.white3, border: `1px solid ${C.borderDim}`,
                  transition: 'background 0.15s ease',
                }}>
                  <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: exam.color, boxShadow: `0 0 6px ${exam.color}88`, flexShrink: 0 }} />
                  <SubjectBadge label={exam.subject} color={exam.color} />
                  <p style={{
                    flex: 1, fontSize: '11px', fontFamily: FONT_MONO, color: C.textMid,
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={exam.code}>{exam.code}</p>
                  <span style={{ fontSize: '10px', fontFamily: FONT_SANS, color: C.textFaint, flexShrink: 0 }}>{exam.count}Q</span>
                  <span style={{ fontSize: '10px', fontFamily: FONT_SANS, color: C.textFaint, flexShrink: 0 }}>{exam.ts}</span>
                  <button className="fus-icon-btn" style={{
                    flexShrink: 0, width: '26px', height: '26px', borderRadius: '7px',
                    background: C.white4, border: `1px solid ${C.borderDim}`,
                    color: C.textDim, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }} title="Export .md">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
