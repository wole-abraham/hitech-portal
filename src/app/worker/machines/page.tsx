'use client'

import { useEffect, useState } from 'react'
import AmbientBackground from '@/components/AmbientBackground'

/* ── Design tokens ─────────────────────────────────────────── */
const C = {
  bg:          '#080604',
  card:        '#110f0c',
  cardInner:   '#0a0805',
  orange:      '#f59e0b',
  orangeDim:   'rgba(245,158,11,0.10)',
  orangeBorder:'rgba(245,158,11,0.25)',
  text:        '#ede8de',
  muted:       '#9e9387',
  sub:         '#655d53',
  border:      'rgba(237,232,222,0.09)',
  inputBg:     '#1d1a16',
  success:     '#34d399',
  error:       '#f87171',
  blue:        '#60a5fa',
}

interface Machine {
  id: number
  fleet_number: string
  machine_type: string
  machine_belonging: string
  deployment_status: string
  health_status: string
  project_name: string | null
  section_name: string | null
  assigned_to: string | null
  operator_comment: string | null
  litres: number | null
  hour_meter: number | null
}

const MACHINE_ICON: Record<string, string> = {
  Dozer: '🚧', Excavator: '🏗️', Grader: '🛤️', Loader: '🦾',
  Roller: '🔄', Dumper: '🚛', default: '⚙️',
}

const HEALTH_COLOR: Record<string, string> = {
  Good: '#34d399', Bad: '#f87171', Repaired: '#60a5fa', Breakdown: '#fb923c',
}

const DEPLOY_LABEL: Record<string, string> = {
  deployed_to_site:   'Sent to You',
  received_on_site:   'In Your Possession',
  in_transit_back:    'Returning to Base',
  in_store:           'At Base',
}

const DEPLOY_COLOR: Record<string, string> = {
  deployed_to_site:  '#f59e0b',
  received_on_site:  '#34d399',
  in_transit_back:   '#fb923c',
  in_store:          '#60a5fa',
}

/* ── Action panel (inline expand) ─────────────────────────── */
function ActionPanel({ machine, onDone }: { machine: Machine; onDone: () => void }) {
  const [health, setHealth] = useState(machine.health_status || 'Good')
  const [comment, setComment] = useState('')
  const [litres, setLitres] = useState(machine.litres != null ? String(machine.litres) : '')
  const [hourMeter, setHourMeter] = useState(machine.hour_meter != null ? String(machine.hour_meter) : '')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const canReceive = machine.deployment_status === 'deployed_to_site'
  const canReturn  = machine.deployment_status === 'received_on_site'

  async function doAction(action: 'receive' | 'return') {
    setLoading(true); setErr('')
    const res = await fetch('/api/worker/machines/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machine_id: machine.id,
        action,
        health_status: health,
        comment,
        litres: litres !== '' ? parseFloat(litres) : null,
        hour_meter: hourMeter !== '' ? parseFloat(hourMeter) : null,
      }),
    })
    const d = await res.json()
    setLoading(false)
    if (!res.ok) { setErr(d.error || 'Failed'); return }
    onDone()
  }

  return (
    <div style={{
      marginTop: 12, padding: 14,
      background: C.cardInner,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      display: 'flex', flexDirection: 'column', gap: 10,
      animation: 'expandDown 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
    }}>
      {err && (
        <div style={{ color: C.error, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>⚠ {err}</div>
      )}

      {/* Health status */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.muted, marginBottom: 7, fontFamily: 'var(--font-mono)' }}>
          Health Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {(['Good','Bad','Repaired','Breakdown'] as const).map(h => (
            <button key={h} type="button" onClick={() => setHealth(h)} style={{
              padding: '9px 4px',
              borderRadius: 8,
              fontSize: '0.7rem', fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.18s',
              border: health === h
                ? `1px solid ${HEALTH_COLOR[h]}60`
                : `1px solid ${C.border}`,
              background: health === h
                ? `${HEALTH_COLOR[h]}18`
                : C.inputBg,
              color: health === h ? HEALTH_COLOR[h] : C.muted,
            }}>{h}</button>
          ))}
        </div>
      </div>

      {/* Fuel & hour meter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.muted, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
            Fuel (Litres)
          </div>
          <input
            type="number"
            min="0"
            step="0.1"
            value={litres}
            onChange={e => setLitres(e.target.value)}
            placeholder="e.g. 120"
            style={{
              width: '100%', padding: '10px 12px',
              background: C.inputBg,
              border: `1px solid rgba(237,232,222,0.14)`,
              borderRadius: 10, color: C.text,
              fontSize: '0.85rem', fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.muted, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
            Hour Meter
          </div>
          <input
            type="number"
            min="0"
            step="0.1"
            value={hourMeter}
            onChange={e => setHourMeter(e.target.value)}
            placeholder="e.g. 4820"
            style={{
              width: '100%', padding: '10px 12px',
              background: C.inputBg,
              border: `1px solid rgba(237,232,222,0.14)`,
              borderRadius: 10, color: C.text,
              fontSize: '0.85rem', fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Comment */}
      <div>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.muted, marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
          Comment (optional)
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Any notes about this machine…"
          rows={2}
          style={{
            width: '100%', padding: '10px 12px',
            background: C.inputBg,
            border: `1px solid rgba(237,232,222,0.14)`,
            borderRadius: 10, color: C.text,
            fontSize: '0.85rem', fontFamily: 'inherit',
            resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {canReceive && (
          <button
            type="button"
            disabled={loading}
            onClick={() => doAction('receive')}
            style={{
              flex: 1, padding: '12px',
              background: loading ? C.orangeDim : C.orange,
              color: loading ? C.muted : '#1a1410',
              border: 'none', borderRadius: 10,
              fontWeight: 800, fontSize: '0.82rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Saving…' : '✓ Confirm Receipt'}
          </button>
        )}
        {canReturn && (
          <button
            type="button"
            disabled={loading}
            onClick={() => doAction('return')}
            style={{
              flex: 1, padding: '12px',
              background: loading ? 'rgba(251,146,60,0.1)' : 'rgba(251,146,60,0.12)',
              color: loading ? C.muted : '#fb923c',
              border: `1px solid ${loading ? C.border : 'rgba(251,146,60,0.35)'}`,
              borderRadius: 10,
              fontWeight: 800, fontSize: '0.82rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Saving…' : '↩ Return Machine'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Machine card ──────────────────────────────────────────── */
function MachineCard({ machine, onRefresh, delay = 0 }: { machine: Machine; onRefresh: () => void; delay?: number }) {
  const [expanded, setExpanded] = useState(false)
  const icon = MACHINE_ICON[machine.machine_type] || MACHINE_ICON.default
  const deployColor = DEPLOY_COLOR[machine.deployment_status] || C.muted
  const deployLabel = DEPLOY_LABEL[machine.deployment_status] || machine.deployment_status
  const healthColor = HEALTH_COLOR[machine.health_status] || C.muted
  const canAct = machine.deployment_status === 'deployed_to_site' || machine.deployment_status === 'received_on_site'

  return (
    <div className="htcard" style={{
      background: 'linear-gradient(160deg, #181410 0%, #110f0c 100%)',
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      opacity: 0,
      animation: `tileIn 0.35s ease ${delay}s forwards`,
    }}>
      {/* Status stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${deployColor} 0%, ${deployColor}30 60%, transparent 100%)` }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${deployColor}14`,
            border: `1px solid ${deployColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem',
          }}>{icon}</div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: C.text, fontFamily: 'var(--font-display)' }}>
                {machine.machine_type}
              </span>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.10em', fontFamily: 'var(--font-mono)',
                background: `${deployColor}18`, color: deployColor,
                padding: '3px 7px', borderRadius: 4,
              }}>{deployLabel}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: C.muted, marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
              Fleet #{machine.fleet_number}
              {machine.machine_belonging && machine.machine_belonging !== 'Hitech' && (
                <span style={{ color: C.sub, marginLeft: 8 }}>· {machine.machine_belonging}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.73rem', color: C.sub, flexWrap: 'wrap' }}>
              <span style={{ color: healthColor, fontWeight: 600 }}>● {machine.health_status}</span>
              {machine.project_name && <span>📍 {machine.project_name}{machine.section_name ? ` / ${machine.section_name}` : ''}</span>}
            </div>
            {(machine.litres != null || machine.hour_meter != null) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: '0.7rem', color: C.sub }}>
                {machine.litres != null && <span>⛽ {machine.litres}L</span>}
                {machine.hour_meter != null && <span>⏱ {machine.hour_meter}h</span>}
              </div>
            )}
          </div>

          {/* Expand toggle */}
          {canAct && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              style={{
                flexShrink: 0,
                width: 32, height: 32, borderRadius: 8,
                background: expanded ? C.orangeDim : 'rgba(237,232,222,0.04)',
                border: `1px solid ${expanded ? C.orangeBorder : C.border}`,
                color: expanded ? C.orange : C.muted,
                cursor: 'pointer', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {expanded ? '×' : '⋯'}
            </button>
          )}
        </div>

        {expanded && canAct && (
          <ActionPanel
            machine={machine}
            onDone={() => { setExpanded(false); onRefresh() }}
          />
        )}
      </div>
    </div>
  )
}

/* ── Section heading ───────────────────────────────────────── */
function SectionHead({ icon, title, count, color }: { icon: string; title: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#000000', fontFamily: 'var(--font-display)' }}>{title}</span>
      <span style={{
        marginLeft: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
        background: `${color}18`, color,
        padding: '3px 9px', borderRadius: 20,
      }}>{count}</span>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export default function WorkerMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [employee, setEmployee] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [vis, setVis] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/worker/machines')
    const d = await res.json()
    setEmployee(d.employee || null)
    setMachines(d.machines || [])
    setLoading(false)
    setVis(true)
  }

  useEffect(() => { load() }, [])

  const LIFECYCLE = ['deployed_to_site','received_on_site','in_transit_back','in_store']
  const pending   = machines.filter(m => m.deployment_status === 'deployed_to_site')
  const active    = machines.filter(m => m.deployment_status === 'received_on_site')
  const returning = machines.filter(m => m.deployment_status === 'in_transit_back')
  const assigned  = machines.filter(m => !LIFECYCLE.includes(m.deployment_status))

  return (
    <div style={{ background: C.bg, minHeight: '100vh', position: 'relative' }}>
      <AmbientBackground />

      {/* Header */}
      <header style={{
        background: 'rgba(8,6,4,0.92)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '10px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <img src="/logo.jpg" alt="Hitech" style={{
          width: 36, height: 36, borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)', flexShrink: 0,
        }} />
        <a href="/portal" style={{
          height: 34, padding: '0 14px', borderRadius: 8,
          background: C.orange, color: '#1a1410',
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
          <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'var(--font-display)' }}>My Machines</div>
          {employee && (
            <div style={{ fontSize: '0.68rem', color: C.muted, marginTop: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {employee.name} · {employee.role}
            </div>
          )}
        </div>
      </header>

      <div style={{
        position: 'relative', zIndex: 2,
        padding: '20px 16px 80px', maxWidth: 560,
        margin: '0 auto', width: '100%',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.inputBg, flexShrink: 0, backgroundImage: 'linear-gradient(90deg,#1d1a16 25%,rgba(237,232,222,0.06) 50%,#1d1a16 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 14, borderRadius: 6, width: '55%', backgroundImage: 'linear-gradient(90deg,#1d1a16 25%,rgba(237,232,222,0.06) 50%,#1d1a16 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 12, borderRadius: 6, width: '40%', backgroundImage: 'linear-gradient(90deg,#1d1a16 25%,rgba(237,232,222,0.06) 50%,#1d1a16 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
                <div style={{ height: 11, borderRadius: 6, width: '70%', backgroundImage: 'linear-gradient(90deg,#1d1a16 25%,rgba(237,232,222,0.06) 50%,#1d1a16 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : !employee ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'linear-gradient(160deg,#181410,#110f0c)',
            border: `1px solid ${C.border}`, borderRadius: 16,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>👷</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: 'var(--font-display)' }}>No Employee Profile</div>
            <div style={{ fontSize: '0.8rem', color: C.muted, lineHeight: 1.6 }}>
              Your account isn't linked to an employee record yet.<br />Ask your admin to link your account in the Employees section.
            </div>
          </div>
        ) : machines.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'linear-gradient(160deg,#181410,#110f0c)',
            border: `1px solid ${C.border}`, borderRadius: 16,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🚜</div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: 'var(--font-display)' }}>No Machines Assigned</div>
            <div style={{ fontSize: '0.8rem', color: C.muted }}>
              You have no machines assigned at the moment.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Assigned but not yet deployed — admin set assigned_to without changing status */}
            {assigned.length > 0 && (
              <div style={{ marginBottom: pending.length > 0 ? 20 : 0 }}>
                <SectionHead icon="🔧" title="Assigned to You" count={assigned.length} color={C.blue} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {assigned.map((m, i) => <MachineCard key={m.id} machine={m} onRefresh={load} delay={i * 0.06} />)}
                </div>
              </div>
            )}

            {/* Pending receipt */}
            {pending.length > 0 && (
              <div>
                <SectionHead icon="📦" title="Awaiting Your Receipt" count={pending.length} color={C.orange} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pending.map((m, i) => <MachineCard key={m.id} machine={m} onRefresh={load} delay={i * 0.06} />)}
                </div>
              </div>
            )}

            {/* Active / in possession */}
            {active.length > 0 && (
              <div style={{ marginTop: pending.length > 0 ? 20 : 0 }}>
                <SectionHead icon="✅" title="In Your Possession" count={active.length} color={C.success} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {active.map((m, i) => <MachineCard key={m.id} machine={m} onRefresh={load} delay={i * 0.06} />)}
                </div>
              </div>
            )}

            {/* Returning */}
            {returning.length > 0 && (
              <div style={{ marginTop: (pending.length + active.length) > 0 ? 20 : 0 }}>
                <SectionHead icon="↩" title="Returning to Base" count={returning.length} color="#fb923c" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {returning.map((m, i) => <MachineCard key={m.id} machine={m} onRefresh={load} delay={i * 0.06} />)}
                </div>
              </div>
            )}

            {/* Summary footer */}
            <div style={{
              marginTop: 24, padding: '14px 16px',
              background: 'linear-gradient(160deg,#181410,#110f0c)',
              border: `1px solid ${C.border}`, borderRadius: 14,
              display: 'flex', justifyContent: 'space-around',
            }}>
              {[
                { label: 'Pending', count: pending.length,   color: C.orange },
                { label: 'Active',  count: active.length,    color: C.success },
                { label: 'Total',   count: machines.length,  color: C.muted },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.color, fontFamily: 'var(--font-display)' }}>{s.count}</div>
                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.10em', color: C.sub, fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
