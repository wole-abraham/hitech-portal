'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

type PlannedActivity = {
  id: number
  title: string
  description: string | null
  project_name: string | null
  section_name: string | null
  activity_category: string | null
  activity_type: string | null
  activity_subtype: string | null
  side: string | null
  weather: string | null
  start_chainage: string | null
  end_chainage: string | null
  created_at: string
}

const C = {
  bg:           '#f8f7f5',
  white:        '#ffffff',
  orange:       '#f59e0b',
  orangeLight:  'rgba(245,158,11,0.10)',
  orangeBorder: 'rgba(245,158,11,0.30)',
  text:         '#1a1610',
  muted:        '#6b6055',
  sub:          '#8c8480',
  border:       'rgba(0,0,0,0.09)',
  inputBg:      '#edeae5',
  card:         '#ffffff',
}

export default function ReportStartPage() {
  const router = useRouter()
  const [planned, setPlanned]   = useState<PlannedActivity[]>([])
  const [loading, setLoading]   = useState(true)
  const [vis, setVis]           = useState(false)
  const [role, setRole]         = useState<'admin' | 'worker'>('worker')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.replace('/login'); return }
      setRole(d.user.role)
    }).catch(() => {})

    fetch('/api/planned').then(r => r.json()).then(d => {
      setPlanned(d.items ?? [])
    }).catch(() => {}).finally(() => {
      setLoading(false)
      setTimeout(() => setVis(true), 40)
    })
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', position: 'relative', color: C.text }}>
      <AmbientBackground />

      {/* Header */}
      <header style={{
        background: 'rgba(248,247,245,0.93)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/portal" style={{
            height: 34, padding: '0 14px', borderRadius: 8,
            background: C.orange, color: '#fff',
            font: '700 11px/1 var(--font-display)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            textDecoration: 'none', flexShrink: 0,
            letterSpacing: '0.09em', textTransform: 'uppercase',
            boxShadow: `0 2px 12px ${C.orangeBorder}`,
          }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Portal
          </a>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'var(--font-display)' }}>Activity Report</div>
            <div style={{ fontSize: '0.68rem', color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>Select a plan or start fresh</div>
          </div>
        </div>
      </header>

      <div style={{
        padding: '24px 16px 80px', maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 2,
        opacity: vis ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>

        {/* Section: Newly Planned */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: C.orange, fontFamily: 'var(--font-mono)',
            marginBottom: 10,
          }}>
            New Report
          </div>
          <a href="/reports/submit" style={{ textDecoration: 'none' }}>
            <div style={{
              background: C.orange, borderRadius: 16, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: `0 6px 24px ${C.orangeBorder}`,
              cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 32px rgba(245,158,11,0.40)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 24px ${C.orangeBorder}` }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                  stroke="#1a1610" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1a1610', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                  Newly Planned
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(26,22,16,0.65)', marginTop: 3, lineHeight: 1.4 }}>
                  Start a blank activity report from scratch
                </div>
              </div>
              <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke="rgba(26,22,16,0.55)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </a>
        </div>

        {/* Section: Planned Activities */}
        <div>
          <div style={{
            fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: C.orange, fontFamily: 'var(--font-mono)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span>Planned Activities</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.20)' }} />
            <a href="/planned" style={{
              fontSize: '0.58rem', color: C.sub, textDecoration: 'none',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
              padding: '2px 7px', borderRadius: 4,
              border: `1px solid ${C.border}`,
            }}>
              {role === 'admin' ? 'Manage ›' : 'View all ›'}
            </a>
          </div>

          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C.sub, fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
              Loading…
            </div>
          ) : planned.length === 0 ? (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: '28px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: C.text, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                No planned activities yet
              </div>
              <div style={{ fontSize: '0.74rem', color: C.sub, lineHeight: 1.5 }}>
                {role === 'admin'
                  ? 'Create planned activities in Config → Planned Activities.'
                  : 'An admin will set up planned activities for you to pick from.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {planned.map((p, i) => (
                <PlannedCard key={p.id} item={p} delay={i * 40} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function PlannedCard({ item, delay }: { item: PlannedActivity; delay: number }) {
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const meta = [
    item.activity_category,
    item.activity_type,
    item.project_name,
    item.section_name && item.project_name ? item.section_name : null,
  ].filter(Boolean)

  const chainages = item.start_chainage && item.end_chainage
    ? `${item.start_chainage} → ${item.end_chainage}`
    : item.start_chainage || null

  return (
    <a
      href={`/reports/submit?from=${item.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'block', textDecoration: 'none',
        background: hov ? '#fdf8ef' : '#ffffff',
        border: `1px solid ${hov ? 'rgba(245,158,11,0.35)' : 'rgba(0,0,0,0.09)'}`,
        borderRadius: 14, padding: '14px 16px',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.08), 0 2px 6px rgba(245,158,11,0.06)' : '0 2px 8px rgba(0,0,0,0.05)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.18s, border-color 0.18s, box-shadow 0.18s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Amber left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: '#f59e0b', borderRadius: '14px 0 0 14px',
        transform: hov ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: hov ? 'rgba(245,158,11,0.10)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${hov ? 'rgba(245,158,11,0.25)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s, border-color 0.18s',
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={hov ? '#f59e0b' : '#8c8480'} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.18s' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: '0.9rem', color: '#1a1610',
            fontFamily: 'var(--font-display)', marginBottom: 4,
            letterSpacing: '-0.01em',
          }}>
            {item.title}
          </div>

          {item.description && (
            <div style={{ fontSize: '0.74rem', color: '#6b6055', marginBottom: 5, lineHeight: 1.45 }}>
              {item.description}
            </div>
          )}

          {meta.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {meta.map((tag, i) => (
                <span key={i} style={{
                  fontSize: '0.62rem', color: '#6b6055',
                  background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 4, padding: '2px 7px',
                  fontFamily: 'var(--font-mono)',
                }}>{tag}</span>
              ))}
              {chainages && (
                <span style={{
                  fontSize: '0.62rem', color: '#f59e0b',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)',
                  borderRadius: 4, padding: '2px 7px',
                  fontFamily: 'var(--font-mono)',
                }}>{chainages}</span>
              )}
            </div>
          )}
        </div>

        <svg style={{ flexShrink: 0, marginTop: 2, opacity: hov ? 1 : 0, transform: hov ? 'translateX(0)' : 'translateX(-4px)', transition: 'opacity 0.2s, transform 0.25s' }}
          width={14} height={14} viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </a>
  )
}
