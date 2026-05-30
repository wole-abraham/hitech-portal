'use client'

import { useEffect, useState, useCallback } from 'react'
import { PageShell, SearchBar, EmptyState, T, Skeleton } from '@/components/PageShell'
import Select from '@/components/Select'

interface HistoryEntry {
  id: number
  date_time: string
  fleet_number: string
  machine_type: string
  machine_belonging: string
  deployment_state: string
  machine_status: string
  breakdown_issue: string
  assigned_to: string
  reporter_name: string
  litres: number | null
  hour_meter: number | null
}

const PAGE_SIZE = 30

const ACTION_COLOR: Record<string, string> = {
  'Received on site':        '#34d399',
  'Sent back to head office':'#fb923c',
  'Received at head office': '#60a5fa',
}

const ACTION_ICON: Record<string, string> = {
  'Received on site':        '✅',
  'Sent back to head office':'↩',
  'Received at head office': '🏢',
}

function fmt(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const [entries, setEntries]   = useState<HistoryEntry[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [page, setPage]         = useState(0)
  const [actions, setActions]   = useState<string[]>([])

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search)       params.set('search', search)
    if (filterAction) params.set('action', filterAction)

    const res  = await fetch(`/api/history?${params}`)
    const data = await res.json()
    setEntries(Array.isArray(data.entries) ? data.entries : [])
    if (typeof data.total === 'number') setTotal(data.total)
    if (Array.isArray(data.actions)) setActions(data.actions)
    setLoading(false)
  }, [search, filterAction])

  useEffect(() => { setPage(0); load(0) }, [search, filterAction])

  function goPage(p: number) { setPage(p); load(p) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageShell title="Machine History" subtitle={`${total} events`}>

      <SearchBar value={search} onChange={setSearch} placeholder="Search fleet no., reporter, operator…" />

      {/* Action filter */}
      {actions.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <Select
            value={filterAction}
            onChange={v => setFilterAction(v)}
            options={[
              { value: '', label: 'All Actions' },
              ...actions.map(a => ({ value: a, label: `${ACTION_ICON[a] || '•'} ${a}` })),
            ]}
            placeholder="Filter by action"
          />
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${T.amber}30 0%, ${T.border} 100%)`, borderRadius: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 16 }}>
                <Skeleton width={40} height={40} radius="50%" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '12px 14px', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Skeleton width={90} height={12} radius={4} />
                    <Skeleton width={70} height={12} radius={4} style={{ marginLeft: 'auto' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Skeleton width={160} height={14} />
                    <Skeleton width={60} height={14} radius={4} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Skeleton width={100} height={11} />
                    <Skeleton width={130} height={11} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon="📋" message="No history found" />
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Vertical spine */}
          <div style={{
            position: 'absolute', left: 19, top: 0, bottom: 0, width: 2,
            background: `linear-gradient(180deg, ${T.amber}60 0%, ${T.border} 100%)`,
            borderRadius: 2,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {entries.map((e, i) => {
              const color = ACTION_COLOR[e.deployment_state] || T.muted
              const icon  = ACTION_ICON[e.deployment_state]  || '•'
              return (
                <div key={e.id} style={{
                  display: 'flex', gap: 16, paddingBottom: 16,
                  opacity: 0, animation: `fadeIn 0.3s ease ${Math.min(i, 10) * 0.04}s forwards`,
                }}>
                  {/* Dot */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`,
                    border: `2px solid ${color}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', position: 'relative', zIndex: 1,
                  }}>{icon}</div>

                  {/* Card */}
                  <div className="htcard" style={{
                    flex: 1, background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 14, padding: '12px 14px',
                    marginTop: 4,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
                        background: `${color}18`, color,
                        padding: '3px 8px', borderRadius: 4,
                      }}>{e.deployment_state}</span>
                      <span style={{ fontSize: '0.72rem', color: T.sub, fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                        {fmt(e.date_time)}
                      </span>
                    </div>

                    {/* Machine info */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>
                        {e.machine_type || '—'}
                      </span>
                      {e.fleet_number && (
                        <span style={{
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          color: T.amber, background: `${T.amber}12`,
                          padding: '2px 7px', borderRadius: 4,
                        }}>Fleet #{e.fleet_number}</span>
                      )}
                      {e.machine_belonging && e.machine_belonging !== 'Hitech' && (
                        <span style={{ fontSize: '0.72rem', color: T.sub }}>· {e.machine_belonging}</span>
                      )}
                    </div>

                    {/* People */}
                    <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem', color: T.muted, flexWrap: 'wrap' }}>
                      {e.assigned_to && (
                        <span>👷 <strong style={{ color: T.text }}>{e.assigned_to}</strong></span>
                      )}
                      {e.reporter_name && (
                        <span>Reported by <strong style={{ color: T.text }}>{e.reporter_name}</strong></span>
                      )}
                    </div>

                    {/* Health & breakdown */}
                    {(e.machine_status || e.breakdown_issue) && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 10, fontSize: '0.73rem', flexWrap: 'wrap' }}>
                        {e.machine_status && (
                          <span style={{ color: T.sub }}>
                            Health: <span style={{ color: T.text }}>{e.machine_status}</span>
                          </span>
                        )}
                        {e.breakdown_issue && (
                          <span style={{ color: '#fb923c' }}>⚠ {e.breakdown_issue}</span>
                        )}
                      </div>
                    )}

                    {/* Fuel & hour meter logged by worker */}
                    {(e.litres != null || e.hour_meter != null) && (
                      <div style={{ marginTop: 5, display: 'flex', gap: 12, fontSize: '0.73rem' }}>
                        {e.litres != null && (
                          <span style={{ color: T.sub }}>⛽ <span style={{ color: T.text, fontWeight: 700 }}>{e.litres}L</span> diesel</span>
                        )}
                        {e.hour_meter != null && (
                          <span style={{ color: T.sub }}>⏱ <span style={{ color: T.text, fontWeight: 700 }}>{e.hour_meter}h</span> meter</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={() => goPage(page - 1)} disabled={page === 0} style={{
            padding: '8px 16px', borderRadius: 10, background: T.card,
            border: `1px solid ${T.border}`,
            color: page === 0 ? T.sub : T.text,
            cursor: page === 0 ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 700,
          }}>← Prev</button>
          <span style={{ padding: '8px 14px', color: T.muted, fontSize: '0.82rem', alignSelf: 'center' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1} style={{
            padding: '8px 16px', borderRadius: 10, background: T.card,
            border: `1px solid ${T.border}`,
            color: page >= totalPages - 1 ? T.sub : T.text,
            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', fontWeight: 700,
          }}>Next →</button>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </PageShell>
  )
}
