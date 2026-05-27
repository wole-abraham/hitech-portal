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

/* ── Fixed form fields available as dependency sources ─────── */
const FIXED_FIELDS: { key: string; label: string; options: string[] }[] = [
  { key: 'weather',           label: 'Weather',          options: ['Sunny','Cloudy','Rainy','Windy','Overcast','Foggy'] },
  { key: 'activity_category', label: 'Activity Category', options: [] },
  { key: 'activity_type',     label: 'Activity Type',     options: [] },
  { key: 'activity_subtype',  label: 'Activity Sub-type', options: [] },
  { key: 'side',              label: 'Side',              options: ['Left','Right','Median'] },
  { key: 'activity_status',   label: 'Status',            options: ['Ongoing','Completed','Suspended','Planned'] },
  { key: 'project_name',      label: 'Project',           options: [] },
  { key: 'section_name',      label: 'Section',           options: [] },
]

/* ── Custom Fields section ──────────────────────────────────── */
function CustomFieldsSection() {
  type CF = {
    id: number; label: string; field_key: string; type: string
    options: string[]; required: boolean; is_active: boolean; order: number
    depends_on_key: string | null; depends_on_value: string | null
  }

  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState<CF[]>([])
  const [loading, setLoading]   = useState(false)
  const [editId, setEditId]     = useState<number | null>(null)
  const [editVals, setEditVals] = useState<Partial<CF> & { optionsRaw?: string }>({})
  const [newVals, setNewVals]   = useState({
    label: '', type: 'text', optionsRaw: '', required: false, order: 10,
    depends_on_key: '', depends_on_value: '',
  })
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
      body: JSON.stringify({
        label: newVals.label.trim(), field_key: slugify(newVals.label.trim()),
        type: newVals.type, options, required: newVals.required, order: newVals.order,
        is_active: true,
        depends_on_key:   newVals.depends_on_key   || null,
        depends_on_value: newVals.depends_on_value  || null,
      }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setNewVals({ label: '', type: 'text', optionsRaw: '', required: false, order: 10, depends_on_key: '', depends_on_value: '' })
    await load(); setSaving(false)
  }

  async function save() {
    setSaving(true); setErr('')
    const { optionsRaw, options: _opts, ...rest } = editVals
    const options = optionsRaw !== undefined
      ? optionsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : _opts ?? []
    const r = await fetch('/api/config/customfields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...rest, options,
        depends_on_key:   rest.depends_on_key   || null,
        depends_on_value: rest.depends_on_value  || null,
      }),
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

  // Options for the "value equals" picker — checks fixed fields first, then custom
  function optionsOf(key: string): string[] {
    const fixed = FIXED_FIELDS.find(f => f.key === key)
    if (fixed) return fixed.options
    return items.find(i => i.field_key === key)?.options ?? []
  }

  // Label for a dependency key — used in the table display
  function labelOf(key: string): string {
    return FIXED_FIELDS.find(f => f.key === key)?.label
      ?? items.find(i => i.field_key === key)?.label
      ?? key
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
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
                        {/* Edit mode: label + type + options + req in row, dependency below as a second row */}
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
                          {item.depends_on_key && (
                            <div style={{ fontSize: '0.65rem', color: T.amber, fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                              shows when: {labelOf(item.depends_on_key)} = {item.depends_on_value}
                            </div>
                          )}
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

          {/* Add form */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Row 1: core fields */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
            </div>

            {/* Row 2: dependency + submit */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 160px', minWidth: 130 }}>
                <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Shows when field… <span style={{ color: T.sub, fontWeight: 400 }}>(optional)</span>
                </div>
                <select
                  value={newVals.depends_on_key}
                  onChange={e => setNewVals(v => ({ ...v, depends_on_key: e.target.value, depends_on_value: '' }))}
                  style={inp}
                >
                  <option value="">— always show —</option>
                  <optgroup label="Form Fields">
                    {FIXED_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </optgroup>
                  {items.length > 0 && (
                    <optgroup label="Custom Fields">
                      {items.map(f => <option key={f.field_key} value={f.field_key}>{f.label}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              {newVals.depends_on_key && (
                <div style={{ flex: '2 1 140px', minWidth: 110 }}>
                  <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>…equals value</div>
                  {optionsOf(newVals.depends_on_key).length > 0 ? (
                    <select value={newVals.depends_on_value} onChange={e => setNewVals(v => ({ ...v, depends_on_value: e.target.value }))} style={inp}>
                      <option value="">— pick —</option>
                      {optionsOf(newVals.depends_on_key).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={newVals.depends_on_value} onChange={e => setNewVals(v => ({ ...v, depends_on_value: e.target.value }))} placeholder="value" style={inp} />
                  )}
                </div>
              )}
              <button onClick={add} disabled={saving} style={{
                padding: '8px 18px', background: T.text, color: T.bg,
                border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                flexShrink: 0, alignSelf: 'flex-end', fontFamily: 'var(--font-display)',
              }}>
                + Add
              </button>
            </div>

            {/* Edit-mode dependency row (shown below the inline edit row) */}
            {editId !== null && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', padding: '8px 10px', background: 'rgba(0,0,0,0.08)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.62rem', color: T.sub, fontFamily: 'var(--font-mono)', alignSelf: 'center', whiteSpace: 'nowrap' }}>Condition:</span>
                <div style={{ flex: '2 1 150px', minWidth: 120 }}>
                  <select
                    value={editVals.depends_on_key ?? ''}
                    onChange={e => setEditVals(v => ({ ...v, depends_on_key: e.target.value || null, depends_on_value: null }))}
                    style={inp}
                  >
                    <option value="">— always show —</option>
                    <optgroup label="Form Fields">
                      {FIXED_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </optgroup>
                    {items.filter(f => f.id !== editId).length > 0 && (
                      <optgroup label="Custom Fields">
                        {items.filter(f => f.id !== editId).map(f => <option key={f.field_key} value={f.field_key}>{f.label}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
                {editVals.depends_on_key && (
                  <div style={{ flex: '2 1 130px', minWidth: 100 }}>
                    {optionsOf(editVals.depends_on_key).length > 0 ? (
                      <select value={editVals.depends_on_value ?? ''} onChange={e => setEditVals(v => ({ ...v, depends_on_value: e.target.value }))} style={inp}>
                        <option value="">— pick —</option>
                        {optionsOf(editVals.depends_on_key).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={editVals.depends_on_value ?? ''} onChange={e => setEditVals(v => ({ ...v, depends_on_value: e.target.value }))} placeholder="value" style={inp} />
                    )}
                  </div>
                )}
              </div>
            )}
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

/* ── Chainages section ──────────────────────────────────────── */
function ChainagesSection({ projects }: { projects: Item[] }) {
  const [open, setOpen]           = useState(false)
  const [projectId, setProjectId] = useState<number | ''>('')
  const [items, setItems]         = useState<Item[]>([])
  const [loading, setLoading]     = useState(false)
  const [editId, setEditId]       = useState<number | null>(null)
  const [editVals, setEditVals]   = useState<Item>({})
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')
  const [importText, setImportText] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const [newVals, setNewVals] = useState({
    chainage: '', name: '', label: '', section_name: '', latitude: '', longitude: '',
  })

  async function load(pid: number | '') {
    if (!pid) { setItems([]); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/config/chainages?project_id=${pid}`)
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open) load(projectId) }, [open])

  function changeProject(pid: number | '') {
    setProjectId(pid)
    setItems([])
    setEditId(null)
    if (pid) load(pid)
  }

  async function add() {
    if (!projectId) { setErr('Select a project first'); return }
    if (!newVals.chainage.trim()) { setErr('Chainage is required'); return }
    setSaving(true); setErr('')
    const r = await fetch('/api/config/chainages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newVals, project_id: projectId }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setNewVals({ chainage: '', name: '', label: '', section_name: '', latitude: '', longitude: '' })
    await load(projectId)
    setSaving(false)
  }

  async function save() {
    setSaving(true); setErr('')
    const r = await fetch('/api/config/chainages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editVals),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setEditId(null); await load(projectId); setSaving(false)
  }

  async function del(id: number) {
    if (!window.confirm('Delete this chainage?')) return
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/chainages?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Delete failed'); setSaving(false); return }
    await load(projectId); setSaving(false)
  }

  async function bulkImport() {
    if (!projectId) { setErr('Select a project first'); return }
    // Parse CSV: chainage,name,label,section_name,latitude,longitude
    // First line may be a header — skip if non-numeric chainage looks like "chainage"
    const lines = importText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    const rows: any[] = []
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts[0].toLowerCase() === 'chainage') continue // skip header
      const [chainage, name, label, section_name, latitude, longitude] = parts
      if (!chainage) continue
      rows.push({ chainage, name: name || chainage, label: label || null, section_name: section_name || null, latitude: latitude || null, longitude: longitude || null, project_id: projectId })
    }
    if (!rows.length) { setErr('No valid rows found'); return }
    setSaving(true); setErr('')
    const r = await fetch('/api/config/chainages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: rows }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Import failed'); setSaving(false); return }
    setImportText(''); setImportOpen(false)
    await load(projectId); setSaving(false)
  }

  const cols = ['Chainage', 'Name', 'Label', 'Section', 'Lat', 'Lng']

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.95rem' }}>📏</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Chainages</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {loading ? '…' : projectId && items.length > 0 ? `${items.length} points` : '—'}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <>
          {/* Project filter */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>Project</span>
            <select
              value={projectId}
              onChange={e => changeProject(e.target.value ? Number(e.target.value) : '')}
              style={{ ...inp, maxWidth: 280 }}
            >
              <option value="">— select project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: T.sub }}>
              {projectId ? `${items.length} chainage points` : 'Select a project to view chainages'}
            </span>
            {projectId && (
              <button
                onClick={() => setImportOpen(o => !o)}
                style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${T.amber}50`, borderRadius: 7, color: T.amber, fontSize: '0.76rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                {importOpen ? 'Hide Import' : '↑ CSV Import'}
              </button>
            )}
          </div>

          {/* CSV import panel */}
          {importOpen && (
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ fontSize: '0.65rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                CSV format: <strong>chainage, name, label, section_name, latitude, longitude</strong> (header row optional)
              </div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={'Ch 1+000, Ch 1+000, , Section A, 9.0579, 7.4951\nCh 1+200, Ch 1+200, , Section A, 9.0601, 7.4970'}
                rows={5}
                style={{ ...inp, fontFamily: 'var(--font-mono)', fontSize: '0.76rem', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={bulkImport} disabled={saving || !importText.trim()} style={{
                  padding: '7px 16px', background: T.amber, color: '#fff', border: 'none',
                  borderRadius: 7, fontSize: '0.8rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1, fontFamily: 'var(--font-display)',
                }}>
                  Import Rows
                </button>
                <button onClick={() => { setImportOpen(false); setImportText('') }} style={{
                  padding: '7px 14px', background: 'transparent', border: `1px solid ${T.border}`,
                  borderRadius: 7, color: T.sub, fontSize: '0.8rem', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {cols.map(c => <th key={c} style={thStyle}>{c}</th>)}
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {!projectId ? (
                  <tr><td colSpan={7} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Select a project above</td></tr>
                ) : loading ? (
                  <tr><td colSpan={7} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '16px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>No chainages yet — add one below or import CSV</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    {editId === item.id ? (
                      <>
                        {(['chainage','name','label','section_name','latitude','longitude'] as const).map(k => (
                          <td key={k} style={{ padding: '5px 8px' }}>
                            <input
                              type={k === 'latitude' || k === 'longitude' ? 'number' : 'text'}
                              step="any"
                              value={editVals[k] ?? ''}
                              onChange={e => setEditVals(v => ({ ...v, [k]: e.target.value }))}
                              style={{ ...inp, fontSize: '0.78rem' }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '5px 8px' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <ActionBtn onClick={save} color={T.success} disabled={saving}>Save</ActionBtn>
                            <ActionBtn onClick={() => setEditId(null)} color={T.sub}>Cancel</ActionBtn>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px 12px', fontSize: '0.84rem', color: T.text, fontFamily: 'var(--font-mono)' }}>{item.chainage}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.82rem', color: T.muted }}>{item.name || '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.82rem', color: T.muted }}>{item.label || '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.82rem', color: T.muted }}>{item.section_name || '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>{item.latitude ?? '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>{item.longitude ?? '—'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
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
            <div style={{ padding: '8px 14px', background: 'rgba(248,113,113,0.08)', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>
          )}

          {/* Add row */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.10)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {([
                { key: 'chainage',     label: 'Chainage *', flex: '2 1 100px' },
                { key: 'name',         label: 'Name',       flex: '2 1 100px' },
                { key: 'label',        label: 'Label',      flex: '1 1 80px'  },
                { key: 'section_name', label: 'Section',    flex: '1 1 90px'  },
                { key: 'latitude',     label: 'Latitude',   flex: '1 1 80px'  },
                { key: 'longitude',    label: 'Longitude',  flex: '1 1 80px'  },
              ] as { key: keyof typeof newVals; label: string; flex: string }[]).map(f => (
                <div key={f.key} style={{ flex: f.flex, minWidth: 70 }}>
                  <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{f.label}</div>
                  <input
                    type={f.key === 'latitude' || f.key === 'longitude' ? 'number' : 'text'}
                    step="any"
                    value={newVals[f.key]}
                    onChange={e => setNewVals(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.label.replace(' *', '')}
                    style={{ ...inp }}
                  />
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
          </div>
        </>
      )}
    </div>
  )
}

/* ── Components Import section ─────────────────────────────── */
function ComponentsImportSection() {
  const [open, setOpen]       = useState(false)
  const [count, setCount]     = useState<number | null>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ inserted?: number; skipped?: number; errors?: string[] } | null>(null)
  const [err, setErr]         = useState('')

  useEffect(() => {
    if (!open || count !== null) return
    fetch('/api/components/import')
      .then(r => r.json())
      .then(d => setCount(d.count ?? 0))
      .catch(() => {})
  }, [open])

  async function doImport() {
    if (!file) { setErr('Select a CSV file first'); return }
    setLoading(true); setErr(''); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch('/api/components/import', { method: 'POST', body: fd })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Import failed'); setLoading(false); return }
    setResult(d)
    setCount(null) // refresh count
    fetch('/api/components/import').then(r => r.json()).then(d => setCount(d.count ?? 0))
    setLoading(false)
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 16px', borderBottom: open ? `1px solid ${T.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: '0.95rem' }}>🌊</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Drainage Components</span>
        <span style={{ fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>CSV reference data for auto-fill</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: T.sub, fontFamily: 'var(--font-mono)', marginRight: 8 }}>
          {count === null ? '…' : `${count} rows`}
        </span>
        <Chevron open={open} />
      </div>

      {open && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.76rem', color: T.muted, lineHeight: 1.6 }}>
            Upload the <strong>components.csv</strong> file once. When a report is filled in with a matching
            project + section + chainage + activity type + side, the measurements, cell count, length and
            status will auto-fill on the form.
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>CSV File</div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); setErr('') }}
                style={{ ...inp, fontSize: '0.78rem', cursor: 'pointer' }}
              />
            </div>
            <button
              onClick={doImport}
              disabled={loading || !file}
              style={{
                padding: '8px 18px', background: T.amber, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                cursor: loading || !file ? 'not-allowed' : 'pointer',
                opacity: loading || !file ? 0.6 : 1,
                fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              {loading ? 'Importing…' : '⬆ Import'}
            </button>
          </div>

          {err && (
            <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.08)', color: T.error, fontSize: '0.78rem', borderRadius: 8 }}>{err}</div>
          )}

          {result && (
            <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: `1px solid rgba(52,211,153,0.2)`, borderRadius: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: T.success, marginBottom: 4 }}>✓ Import complete</div>
              <div style={{ fontSize: '0.76rem', color: T.muted, fontFamily: 'var(--font-mono)' }}>
                {result.inserted} rows upserted · {result.skipped} skipped
              </div>
              {result.errors?.map((e, i) => (
                <div key={i} style={{ fontSize: '0.72rem', color: T.error, marginTop: 4 }}>{e}</div>
              ))}
            </div>
          )}
        </div>
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
        <ChainagesSection projects={projects} />

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

        <GroupLabel>Drainage Components</GroupLabel>
        <ComponentsImportSection />

        <GroupLabel>Report Fields</GroupLabel>
        <CustomFieldsSection />

        <GroupLabel>Administration</GroupLabel>
        <UsersSection />
        <SignInHistorySection />

      </div>
    </PageShell>
  )
}
