'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageShell, T } from '@/components/PageShell'

type Item = Record<string, any>
type RelatedMap = Record<string, Item[]>

type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  getOptions?: (related: RelatedMap) => { value: number | string; label: string }[]
  required?: boolean
}

const inp: React.CSSProperties = {
  padding: '7px 10px',
  background: T.input,
  border: `1px solid ${T.border}`,
  borderRadius: 7,
  color: T.text,
  fontSize: '0.82rem',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'rotate(0)', flexShrink: 0 }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      paddingTop: 10, paddingLeft: 2,
    }}>
      <span style={{
        fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.14em', color: T.amber, fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: `${T.amber}28` }} />
    </div>
  )
}

function FieldInput({ field, value, onChange, related }: {
  field: FieldDef; value: any; onChange: (v: any) => void; related: RelatedMap
}) {
  if (field.type === 'select' && field.getOptions) {
    const opts = field.getOptions(related)
    return (
      <select value={value ?? ''} onChange={e => { const v = e.target.value; onChange(v === '' ? null : (Number(v) || v)) }} style={inp}>
        <option value="">— select —</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (field.type === 'number') {
    return <input type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={inp} />
  }
  return <input type="text" value={value ?? ''} placeholder={field.label} onChange={e => onChange(e.target.value)} style={inp} />
}

function ActionBtn({ onClick, color, children, disabled }: {
  onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: 'transparent', border: `1px solid ${color}30`,
      borderRadius: 6, color, fontSize: '0.78rem', padding: '3px 9px',
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'background 0.15s', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

const thStyle: React.CSSProperties = {
  padding: '7px 14px', textAlign: 'left', fontSize: '0.6rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', color: T.sub,
  fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
}

/* ── Generic config section ─────────────────────────────────── */
function Section({ icon, title, resource, fields, related }: {
  icon: string; title: string; resource: string
  fields: FieldDef[]; related: RelatedMap
}) {
  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState<Item[]>([])
  const [loading, setLoading]   = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editVals, setEditVals] = useState<Item>({})
  const [newVals, setNewVals]   = useState<Item>({})
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const hasOrder      = fields.some(f => f.key === 'order')
  const visibleFields = fields.filter(f => f.key !== 'order')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/config/${resource}`)
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }, [resource])

  useEffect(() => { if (open && items.length === 0) load() }, [open])

  async function add() {
    setSaving(true); setErr('')
    const payload: Item = { ...newVals }
    if (hasOrder && !payload.order) payload.order = items.reduce((m, i) => Math.max(m, i.order ?? 0), 0) + 10
    const r = await fetch(`/api/config/${resource}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setNewVals({})
    await load()
    setSaving(false)
  }

  async function save() {
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/${resource}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editVals) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setEditId(null); await load(); setSaving(false)
  }

  async function del(id: number) {
    if (!window.confirm('Delete this item?')) return
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/${resource}?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Delete failed'); setSaving(false); return }
    await load(); setSaving(false)
  }

  const colSpan = visibleFields.length + (hasOrder ? 1 : 0) + 1

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: '0.95rem' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {loading ? '…' : items.length > 0 ? `${items.length} items` : open ? '' : '—'}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {visibleFields.map(f => <th key={f.key} style={thStyle}>{f.label}</th>)}
                  {hasOrder && <th style={{ ...thStyle, width: 60 }}>Order</th>}
                  <th style={{ width: 110 }} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colSpan} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={colSpan} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>No items yet — add one below</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {editId === item.id ? (
                      <>
                        {visibleFields.map(f => (
                          <td key={f.key} style={{ padding: '5px 10px' }}>
                            <FieldInput field={f} value={editVals[f.key]} onChange={v => setEditVals(ev => ({ ...ev, [f.key]: v }))} related={related} />
                          </td>
                        ))}
                        {hasOrder && (
                          <td style={{ padding: '5px 10px' }}>
                            <input type="number" value={editVals.order ?? ''} style={{ ...inp, width: 56 }} onChange={e => setEditVals(ev => ({ ...ev, order: Number(e.target.value) }))} />
                          </td>
                        )}
                        <td style={{ padding: '5px 10px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={save} color={T.success} disabled={saving}>Save</ActionBtn>
                            <ActionBtn onClick={() => setEditId(null)} color={T.sub}>Cancel</ActionBtn>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        {visibleFields.map(f => (
                          <td key={f.key} style={{ padding: '9px 14px', fontSize: '0.84rem', color: f.key === 'name' ? T.text : T.muted }}>
                            {f.type === 'select' && f.getOptions
                              ? (f.getOptions(related).find(o => String(o.value) === String(item[f.key]))?.label ?? item[f.key] ?? '—')
                              : (item[f.key] ?? '—')}
                          </td>
                        ))}
                        {hasOrder && (
                          <td style={{ padding: '9px 14px', fontSize: '0.76rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>{item.order}</td>
                        )}
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={() => { setEditId(item.id); setEditVals({ ...item }) }} color={T.muted}>Edit</ActionBtn>
                            <ActionBtn onClick={() => del(item.id)} color={T.error} disabled={saving}>Del</ActionBtn>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {err && (
            <div style={{ padding: '8px 14px', background: 'rgba(248,113,113,0.08)', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>
              {err}
            </div>
          )}

          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.10)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {visibleFields.map(f => (
              <div key={f.key} style={{ flex: f.key === 'name' ? '2 1 140px' : '1 1 100px', minWidth: 80 }}>
                <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {f.label}{f.required ? ' *' : ''}
                </div>
                <FieldInput field={f} value={newVals[f.key] ?? ''} onChange={v => setNewVals(nv => ({ ...nv, [f.key]: v }))} related={related} />
              </div>
            ))}
            <button onClick={add} disabled={saving} style={{
              padding: '8px 18px', background: T.text, color: T.bg,
              border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              flexShrink: 0, alignSelf: 'flex-end', fontFamily: 'var(--font-display)',
            }}>
              + Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Custom Fields section ──────────────────────────────────── */
function CustomFieldsSection() {
  type CF = { id: number; label: string; field_key: string; type: string; options: string[]; required: boolean; is_active: boolean; order: number }

  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState<CF[]>([])
  const [loading, setLoading]   = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editVals, setEditVals] = useState<Partial<CF> & { optionsRaw?: string }>({})
  const [newVals, setNewVals]   = useState({ label: '', type: 'text', optionsRaw: '', required: false, order: 10 })
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  function slugify(label: string) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  }

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/config/customfields')
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open && items.length === 0) load() }, [open])

  async function add() {
    if (!newVals.label.trim()) { setErr('Label is required'); return }
    setSaving(true); setErr('')
    const options = newVals.optionsRaw ? newVals.optionsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const r = await fetch('/api/config/customfields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newVals.label.trim(), field_key: slugify(newVals.label.trim()), type: newVals.type, options, required: newVals.required, order: newVals.order, is_active: true }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setNewVals({ label: '', type: 'text', optionsRaw: '', required: false, order: 10 })
    await load(); setSaving(false)
  }

  async function save() {
    setSaving(true); setErr('')
    const options = editVals.optionsRaw !== undefined
      ? editVals.optionsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : editVals.options ?? []
    const r = await fetch('/api/config/customfields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editVals, options }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setEditId(null); await load(); setSaving(false)
  }

  async function del(id: number) {
    if (!window.confirm('Delete this field?')) return
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/customfields?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Delete failed'); setSaving(false); return }
    await load(); setSaving(false)
  }

  async function toggleActive(item: CF) {
    setSaving(true); setErr('')
    await fetch('/api/config/customfields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    })
    await load(); setSaving(false)
  }

  const activeCount = items.filter(i => i.is_active).length

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.95rem' }}>🧩</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Custom Fields</span>
        <span style={{ fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>extra fields on the report form</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {loading ? '…' : items.length > 0 ? `${activeCount} active / ${items.length} total` : '—'}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={thStyle}>Label / Key</th>
                  <th style={{ ...thStyle, width: 90 }}>Type</th>
                  <th style={thStyle}>Options</th>
                  <th style={{ ...thStyle, width: 60 }}>Req</th>
                  <th style={{ width: 190 }} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>No custom fields yet — add one below</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}`, opacity: item.is_active ? 1 : 0.45 }}>
                    {editId === item.id ? (
                      <>
                        <td style={{ padding: '5px 10px' }}>
                          <input type="text" value={editVals.label ?? ''} onChange={e => setEditVals(v => ({ ...v, label: e.target.value }))} style={inp} />
                        </td>
                        <td style={{ padding: '5px 10px' }}>
                          <select value={editVals.type ?? 'text'} onChange={e => setEditVals(v => ({ ...v, type: e.target.value }))} style={inp}>
                            <option value="text">text</option>
                            <option value="dropdown">dropdown</option>
                            <option value="number">number</option>
                          </select>
                        </td>
                        <td style={{ padding: '5px 10px' }}>
                          <input type="text"
                            value={editVals.optionsRaw ?? (item.options ?? []).join(', ')}
                            onChange={e => setEditVals(v => ({ ...v, optionsRaw: e.target.value }))}
                            placeholder="Option A, Option B"
                            style={inp}
                          />
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                          <input type="checkbox" checked={!!editVals.required} onChange={e => setEditVals(v => ({ ...v, required: e.target.checked }))} />
                        </td>
                        <td style={{ padding: '5px 10px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={save} color={T.success} disabled={saving}>Save</ActionBtn>
                            <ActionBtn onClick={() => setEditId(null)} color={T.sub}>Cancel</ActionBtn>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ fontSize: '0.84rem', color: T.text, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginTop: 1 }}>{item.field_key}</div>
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: T.muted }}>{item.type}</td>
                        <td style={{ padding: '9px 14px', fontSize: '0.76rem', color: T.sub, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={(item.options ?? []).join(', ')}>
                          {(item.options ?? []).join(', ') || '—'}
                        </td>
                        <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                          {item.required ? (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: T.amber, fontFamily: 'var(--font-mono)', background: `${T.amber}18`, padding: '2px 6px', borderRadius: 4 }}>yes</span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <ActionBtn onClick={() => toggleActive(item)} color={item.is_active ? T.muted : T.success} disabled={saving}>
                              {item.is_active ? 'Disable' : 'Enable'}
                            </ActionBtn>
                            <ActionBtn onClick={() => { setEditId(item.id); setEditVals({ ...item, optionsRaw: (item.options ?? []).join(', ') }) }} color={T.muted}>Edit</ActionBtn>
                            <ActionBtn onClick={() => del(item.id)} color={T.error} disabled={saving}>Del</ActionBtn>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {err && (
            <div style={{ padding: '8px 14px', background: 'rgba(248,113,113,0.08)', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>
          )}

          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.10)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 140px', minWidth: 110 }}>
              <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Label *</div>
              <input type="text" value={newVals.label} onChange={e => setNewVals(v => ({ ...v, label: e.target.value }))} placeholder="e.g. Soil Type" style={inp} />
            </div>
            <div style={{ flex: '1 1 90px', minWidth: 80 }}>
              <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Type</div>
              <select value={newVals.type} onChange={e => setNewVals(v => ({ ...v, type: e.target.value }))} style={inp}>
                <option value="text">text</option>
                <option value="dropdown">dropdown</option>
                <option value="number">number</option>
              </select>
            </div>
            <div style={{ flex: '3 1 180px', minWidth: 120 }}>
              <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Options (comma-separated)</div>
              <input type="text" value={newVals.optionsRaw} onChange={e => setNewVals(v => ({ ...v, optionsRaw: e.target.value }))} placeholder="Clay, Sandy, Rocky" style={inp} />
            </div>
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
              <input type="checkbox" id="cf-req" checked={newVals.required} onChange={e => setNewVals(v => ({ ...v, required: e.target.checked }))} />
              <label htmlFor="cf-req" style={{ fontSize: '0.72rem', color: T.muted, cursor: 'pointer' }}>Required</label>
            </div>
            <button onClick={add} disabled={saving} style={{
              padding: '8px 18px', background: T.text, color: T.bg,
              border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              flexShrink: 0, alignSelf: 'flex-end', fontFamily: 'var(--font-display)',
            }}>
              + Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Users section ──────────────────────────────────────────── */
function UsersSection() {
  const [open, setOpen]             = useState(false)
  const [items, setItems]           = useState<Item[]>([])
  const [loading, setLoading]       = useState(false)
  const [toggling, setToggling]     = useState<number | null>(null)
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null)
  const [err, setErr]               = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/config/users')
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open && items.length === 0) load() }, [open])

  async function toggle(u: Item) {
    setToggling(u.id); setErr('')
    const r = await fetch('/api/config/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, is_active: !u.is_active }) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Failed'); setToggling(null); return }
    await load(); setToggling(null)
  }

  async function toggleAdmin(u: Item) {
    setTogglingAdmin(u.id); setErr('')
    const r = await fetch('/api/config/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, is_staff: !u.is_staff }) })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Failed'); setTogglingAdmin(null); return }
    await load(); setTogglingAdmin(null)
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.95rem' }}>👤</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Users</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {loading ? '…' : items.length > 0 ? `${items.length} accounts` : '—'}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Name', 'Email', 'Role', 'Joined', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ ...thStyle, width: h === '' ? 200 : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
                ) : items.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, opacity: u.is_active ? 1 : 0.55 }}>
                    <td style={{ padding: '9px 14px', fontSize: '0.84rem', color: T.text }}>
                      {(u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                    </td>
                    <td style={{ padding: '9px 14px', fontSize: '0.79rem', color: T.muted, fontFamily: 'var(--font-mono)' }}>{u.email}</td>
                    <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: T.sub }}>{u.role}</td>
                    <td style={{ padding: '9px 14px', fontSize: '0.74rem', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 9px', borderRadius: 20,
                        fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                        background: u.is_active ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.10)',
                        color: u.is_active ? T.success : T.error,
                        border: `1px solid ${u.is_active ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.2)'}`,
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'nowrap' }}>
                        <ActionBtn onClick={() => toggleAdmin(u)} color={u.is_staff ? '#f59e0b' : T.sub} disabled={togglingAdmin === u.id}>
                          {u.is_staff ? 'Remove Admin' : 'Make Admin'}
                        </ActionBtn>
                        <ActionBtn onClick={() => toggle(u)} color={u.is_active ? T.error : T.success} disabled={toggling === u.id}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {err && <div style={{ padding: '8px 14px', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>}
        </>
      )}
    </div>
  )
}

/* ── Sign-in History section ────────────────────────────────── */
function SignInHistorySection() {
  const [open, setOpen]     = useState(false)
  const [items, setItems]   = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [err, setErr]       = useState('')

  useEffect(() => {
    if (!open || items.length > 0) return
    setLoading(true)
    fetch('/api/config/login-history')
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); if (d.error) setErr(d.error) })
      .finally(() => setLoading(false))
  }, [open])

  const visible = filter.trim()
    ? items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()) || i.email.toLowerCase().includes(filter.toLowerCase()))
    : items

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.95rem' }}>🔐</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Sign-in History</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {loading ? '…' : items.length > 0 ? `${items.length} events` : '—'}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.06)' }}>
            <input
              placeholder="Filter by name or email…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ ...inp, maxWidth: 280 }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Name', 'Email', 'Signed In At'].map((h, i) => <th key={i} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>No sign-in records yet</td></tr>
                ) : visible.map(row => (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '9px 14px', fontSize: '0.84rem', color: T.text }}>{row.name}</td>
                    <td style={{ padding: '9px 14px', fontSize: '0.79rem', color: T.muted, fontFamily: 'var(--font-mono)' }}>{row.email}</td>
                    <td style={{ padding: '9px 14px', fontSize: '0.74rem', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(row.signed_in_at).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {err && <div style={{ padding: '8px 14px', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>}
        </>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function ConfigPage() {
  const [categories, setCategories] = useState<Item[]>([])
  const [types,      setTypes]      = useState<Item[]>([])
  const [projects,   setProjects]   = useState<Item[]>([])

  useEffect(() => {
    fetch('/api/config/categories').then(r => r.json()).then(d => setCategories(d.items ?? []))
    fetch('/api/config/types').then(r => r.json()).then(d => setTypes(d.items ?? []))
    fetch('/api/config/projects').then(r => r.json()).then(d => setProjects(d.items ?? []))
  }, [])

  const related: RelatedMap = { categories, types, projects }

  return (
    <PageShell title="Config" subtitle="Manage dropdown data & user accounts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        <GroupLabel>Activity</GroupLabel>
        <Section icon="📂" title="Activity Categories" resource="categories" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />
        <Section icon="🏗" title="Activity Types" resource="types" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'category_id', label: 'Category', type: 'select', getOptions: r => r.categories.map((c: Item) => ({ value: c.id, label: c.name })) },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />
        <Section icon="🔧" title="Activity Subtypes" resource="subtypes" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'activity_type_id', label: 'Type', type: 'select', getOptions: r => r.types.map((t: Item) => ({ value: t.id, label: t.name })) },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />

        <GroupLabel>Project & Location</GroupLabel>
        <Section icon="🗺" title="Projects" resource="projects" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
        ]} />
        <Section icon="📍" title="Sections" resource="sections" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'project_id', label: 'Project', type: 'select', getOptions: r => r.projects.map((p: Item) => ({ value: p.id, label: p.name })) },
        ]} />

        <GroupLabel>Personnel</GroupLabel>
        <Section icon="👷" title="Site Supervisors" resource="supervisors" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'party', label: 'Party', type: 'select', getOptions: () => [
            { value: 'Hitech employees', label: 'Hitech employees' },
            { value: 'Sub-contractor', label: 'Sub-contractor' },
          ]},
          { key: 'order', label: 'Order', type: 'number' },
        ]} />
        <Section icon="🧑‍💼" title="Site Engineers" resource="engineers" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'party', label: 'Party', type: 'select', getOptions: () => [
            { value: 'Hitech employees', label: 'Hitech employees' },
            { value: 'Sub-contractor', label: 'Sub-contractor' },
          ]},
          { key: 'order', label: 'Order', type: 'number' },
        ]} />

        <GroupLabel>Equipment & Logistics</GroupLabel>
        <Section icon="🚧" title="Machinery Types" resource="machinerytypes" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />
        <Section icon="🚗" title="Team Cars" resource="teamcars" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'plate_number', label: 'Plate Number' },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />
        <Section icon="🏢" title="Subcontractors" resource="subcontractors" related={related} fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'order', label: 'Order', type: 'number' },
        ]} />

        <GroupLabel>Report Fields</GroupLabel>
        <CustomFieldsSection />

        <GroupLabel>Administration</GroupLabel>
        <UsersSection />
        <SignInHistorySection />

      </div>
    </PageShell>
  )
}
