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
  activity_status: string | null
  custom_data: { scheduled_date?: string | null } | null
  created_at: string
  report_count: number
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
  const [planned, setPlanned]       = useState<PlannedActivity[]>([])
  const [loading, setLoading]       = useState(true)
  const [vis, setVis]               = useState(false)
  const [role, setRole]             = useState<'admin' | 'worker'>('worker')
  const [unassigned, setUnassigned] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.replace('/login'); return }
      setRole(d.user.role)
    }).catch(() => {})

    fetch('/api/planned').then(r => r.json()).then(d => {
      setPlanned(d.items ?? [])
      if (d.unassigned) setUnassigned(true)
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

        {/* Section: Planning Activities */}
        <div>
          <div style={{
            fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.14em', color: C.orange, fontFamily: 'var(--font-mono)',
            marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span>Planning Activities</span>
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
              <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{unassigned ? '⚠️' : '📋'}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: C.text, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                {unassigned ? 'No project assigned' : 'No planning activities yet'}
              </div>
              <div style={{ fontSize: '0.74rem', color: C.sub, lineHeight: 1.5 }}>
                {unassigned
                  ? 'You have not been assigned to a project or section. Contact your admin to update your profile.'
                  : role === 'admin'
                    ? 'Create planning activities in Config → Planning Activities.'
                    : 'An admin will set up planning activities for you to pick from.'}
              </div>
            </div>
          ) : (() => {
            const pending  = planned.filter(p => p.report_count === 0)
            const reported = planned.filter(p => p.report_count > 0)

            function DateGroup({ items, keyPrefix, emptyText }: { items: PlannedActivity[]; keyPrefix: string; emptyText: string }) {
              if (items.length === 0) return (
                <div style={{ padding: '18px 16px', color: C.sub, fontSize: '0.78rem', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{emptyText}</div>
              )
              const groups = new Map<string, PlannedActivity[]>()
              for (const p of items) {
                const d = p.custom_data?.scheduled_date || 'No date'
                if (!groups.has(d)) groups.set(d, [])
                groups.get(d)!.push(p)
              }
              const sortedDates = [...groups.keys()].sort((a, b) => {
                if (a === 'No date') return 1
                if (b === 'No date') return -1
                return a.localeCompare(b)
              })
              return (
                <>
                  {sortedDates.map(date => {
                    const groupItems = groups.get(date)!
                    const key = keyPrefix + date
                    const isOpen = expandedDates.has(key)
                    const toggle = () => setExpandedDates(prev => {
                      const next = new Set(prev)
                      isOpen ? next.delete(key) : next.add(key)
                      return next
                    })
                    const label = date === 'No date'
                      ? 'No date set'
                      : new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <div key={key}>
                        {/* Date row */}
                        <button type="button" onClick={toggle} style={{
                          width: '100%', padding: '9px 14px',
                          background: isOpen ? 'rgba(245,158,11,0.05)' : 'rgba(0,0,0,0.02)',
                          border: 'none', borderTop: `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer', textAlign: 'left',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isOpen ? C.orange : C.muted, fontFamily: 'var(--font-mono)' }}>{label}</span>
                            <span style={{ fontSize: '0.62rem', color: isOpen ? C.orange : C.sub, fontFamily: 'var(--font-mono)', background: isOpen ? C.orangeLight : 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 10 }}>
                              {groupItems.length}
                            </span>
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isOpen ? C.orange : C.sub} strokeWidth="2.5"
                            style={{ transition: 'transform 0.18s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </button>
                        {/* Task rows */}
                        {isOpen && groupItems.map((p, i) => {
                          const chainages = p.start_chainage && p.end_chainage
                            ? `${p.start_chainage} → ${p.end_chainage}`
                            : p.start_chainage || null
                          return (
                            <div key={p.id} style={{
                              display: 'grid', gridTemplateColumns: '1fr auto',
                              alignItems: 'center', gap: 10,
                              padding: '10px 14px',
                              background: i % 2 === 0 ? '#ffffff' : '#fafaf9',
                              borderTop: `1px solid rgba(0,0,0,0.04)`,
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <a href={`/reports/submit?from=${p.id}`} style={{ textDecoration: 'none' }}>
                                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: C.text, fontFamily: 'var(--font-display)', marginBottom: 3 }}>{p.title}</div>
                                </a>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {[p.activity_category, p.activity_type, p.project_name, p.section_name].filter(Boolean).map((tag, ti) => (
                                    <span key={ti} style={{ fontSize: '0.58rem', color: C.muted, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>{tag}</span>
                                  ))}
                                  {chainages && (
                                    <span style={{ fontSize: '0.58rem', color: C.orange, background: C.orangeLight, border: `1px solid ${C.orangeBorder}`, borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>{chainages}</span>
                                  )}
                                </div>
                              </div>
                              <a href={`/reports/submit?from=${p.id}`} style={{
                                padding: '6px 12px', borderRadius: 7,
                                background: C.orange, color: '#1a1410',
                                fontSize: '0.68rem', fontWeight: 700,
                                fontFamily: 'var(--font-display)', textDecoration: 'none',
                                letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
                              }}>
                                Report →
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </>
              )
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Pending table */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(156,163,175,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: C.text, fontFamily: 'var(--font-display)' }}>Pending</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'rgba(156,163,175,0.12)', color: '#6b7280', padding: '2px 8px', borderRadius: 20 }}>{pending.length}</span>
                  </div>
                  <DateGroup items={pending} keyPrefix="p:" emptyText="No pending activities" />
                </div>

                {/* Reported table */}
                <div style={{ background: C.card, border: `1px solid ${C.orangeBorder}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: C.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: C.text, fontFamily: 'var(--font-display)' }}>Reported</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 600, background: C.orangeLight, color: C.orange, padding: '2px 8px', borderRadius: 20 }}>{reported.length}</span>
                    <a href="/reports" style={{ marginLeft: 'auto', fontSize: '0.62rem', color: C.sub, fontFamily: 'var(--font-mono)', textDecoration: 'none', letterSpacing: '0.06em' }}>View all ›</a>
                  </div>
                  <DateGroup items={reported} keyPrefix="r:" emptyText="No reported activities yet" />
                </div>
              </div>
            )
          })()}
        </div>

      </div>
    </div>
  )
}

