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

/* ── shared input style ─────────────────────────────────────── */
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

function FieldInput({ field, value, onChange, related }: {
  field: FieldDef; value: any; onChange: (v: any) => void; related: RelatedMap
}) {
  if (field.type === 'select' && field.getOptions) {
    const opts = field.getOptions(related)
    return (
      <select
        value={value ?? ''}
        onChange={e => {
          const v = e.target.value
          onChange(v === '' ? null : (Number(v) || v))
        }}
        style={inp}
      >
        <option value="">— select —</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        style={inp}
      />
    )
  }
  return (
    <input
      type="text"
      value={value ?? ''}
      placeholder={field.label}
      onChange={e => onChange(e.target.value)}
      style={inp}
    />
  )
}

function ActionBtn({ onClick, color, children, disabled }: {
  onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', border: `1px solid ${color}30`,
        borderRadius: 6, color, fontSize: '0.8rem', padding: '3px 9px',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'background 0.15s', fontFamily: 'var(--font-mono)',
      }}
    >
      {children}
    </button>
  )
}

/* ── Generic config section ─────────────────────────────────── */
function Section({ icon, title, resource, fields, related }: {
  icon: string; title: string; resource: string
  fields: FieldDef[]; related: RelatedMap
}) {
  const [items, setItems]     = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId]   = useState<number | null>(null)
  const [editVals, setEditVals] = useState<Item>({})
  const [newVals, setNewVals]   = useState<Item>({})
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const hasOrder    = fields.some(f => f.key === 'order')
  const visibleFields = fields.filter(f => f.key !== 'order')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/config/${resource}`)
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }, [resource])

  useEffect(() => { load() }, [load])

  async function add() {
    setSaving(true); setErr('')
    const payload: Item = { ...newVals }
    if (hasOrder && !payload.order) {
      payload.order = items.reduce((m, i) => Math.max(m, i.order ?? 0), 0) + 10
    }
    const r = await fetch(`/api/config/${resource}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setNewVals({})
    await load()
    setSaving(false)
  }

  async function save() {
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/${resource}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editVals),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setEditId(null)
    await load()
    setSaving(false)
  }

  async function del(id: number) {
    if (!window.confirm('Delete this item? Cannot be undone.')) return
    setSaving(true); setErr('')
    const r = await fetch(`/api/config/${resource}?id=${id}`, { method: 'DELETE' })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Delete failed'); setSaving(false); return }
    await load()
    setSaving(false)
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>{title}</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>
          {loading ? '…' : `${items.length} items`}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {visibleFields.map(f => (
                <th key={f.key} style={{ padding: '7px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {f.label}
                </th>
              ))}
              {hasOrder && (
                <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.sub, fontFamily: 'var(--font-mono)', width: 64 }}>
                  Order
                </th>
              )}
              <th style={{ width: 110 }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleFields.length + (hasOrder ? 1 : 0) + 1}
                  style={{ padding: '18px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + (hasOrder ? 1 : 0) + 1}
                  style={{ padding: '18px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>
                  No items yet — add one below
                </td>
              </tr>
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
                        <input type="number" value={editVals.order ?? ''} style={{ ...inp, width: 56 }}
                          onChange={e => setEditVals(ev => ({ ...ev, order: Number(e.target.value) }))} />
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
                      <td style={{ padding: '9px 14px', fontSize: '0.76rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>
                        {item.order}
                      </td>
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

      {/* Error */}
      {err && (
        <div style={{ padding: '8px 14px', background: 'rgba(248,113,113,0.08)', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>
          {err}
        </div>
      )}

      {/* Add row */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.12)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {visibleFields.map(f => (
          <div key={f.key} style={{ flex: f.key === 'name' ? '2 1 140px' : '1 1 100px', minWidth: 80 }}>
            <div style={{ fontSize: '0.6rem', color: T.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {f.label}{f.required ? ' *' : ''}
            </div>
            <FieldInput field={f} value={newVals[f.key] ?? ''} onChange={v => setNewVals(nv => ({ ...nv, [f.key]: v }))} related={related} />
          </div>
        ))}
        <button
          onClick={add}
          disabled={saving}
          style={{
            padding: '8px 18px', background: T.text, color: T.bg,
            border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            flexShrink: 0, alignSelf: 'flex-end', fontFamily: 'var(--font-display)',
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}

/* ── Users section ──────────────────────────────────────────── */
function UsersSection() {
  const [items, setItems]       = useState<Item[]>([])
  const [loading, setLoading]   = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null)
  const [err, setErr]           = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/config/users')
      const d = await r.json()
      setItems(d.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggle(u: Item) {
    setToggling(u.id); setErr('')
    const r = await fetch('/api/config/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, is_active: !u.is_active }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Failed'); setToggling(null); return }
    await load()
    setToggling(null)
  }

  async function toggleAdmin(u: Item) {
    setTogglingAdmin(u.id); setErr('')
    const r = await fetch('/api/config/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, is_staff: !u.is_staff }),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Failed'); setTogglingAdmin(null); return }
    await load()
    setTogglingAdmin(null)
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>👤</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Users</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>
          {loading ? '…' : `${items.length} accounts`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Name', 'Email', 'Role', 'Joined', 'Status', ''].map((h, i) => (
                <th key={i} style={{ padding: '7px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', width: h === '' ? 180 : undefined }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '18px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
            ) : items.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, opacity: u.is_active ? 1 : 0.55 }}>
                <td style={{ padding: '9px 14px', fontSize: '0.84rem', color: T.text }}>
                  {(u.first_name || u.last_name) ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                </td>
                <td style={{ padding: '9px 14px', fontSize: '0.79rem', color: T.muted, fontFamily: 'var(--font-mono)' }}>
                  {u.email}
                </td>
                <td style={{ padding: '9px 14px', fontSize: '0.78rem', color: T.sub }}>
                  {u.role}
                </td>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <ActionBtn
                      onClick={() => toggleAdmin(u)}
                      color={u.is_staff ? '#f59e0b' : T.sub}
                      disabled={togglingAdmin === u.id}
                    >
                      {u.is_staff ? 'Remove Admin' : 'Make Admin'}
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => toggle(u)}
                      color={u.is_active ? T.error : T.success}
                      disabled={toggling === u.id}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {err && (
        <div style={{ padding: '8px 14px', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>
      )}
    </div>
  )
}

/* ── Sign-in History section ────────────────────────────────── */
function SignInHistorySection() {
  const [items,   setItems]   = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('')
  const [err,     setErr]     = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/config/login-history')
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); if (d.error) setErr(d.error) })
      .finally(() => setLoading(false))
  }, [])

  const visible = filter.trim()
    ? items.filter(i =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.email.toLowerCase().includes(filter.toLowerCase())
      )
    : items

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>

      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span>🔐</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, fontFamily: 'var(--font-display)' }}>Sign-in History</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: T.sub, fontFamily: 'var(--font-mono)' }}>
          {loading ? '…' : `${items.length} events`}
        </span>
        <input
          placeholder="Filter by name or email…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ ...inp, width: 200, marginLeft: 8 }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Name', 'Email', 'Signed In At'].map((h, i) => (
                <th key={i} style={{ padding: '7px 14px', textAlign: 'left', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} style={{ padding: '18px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '18px 14px', color: T.sub, fontSize: '0.82rem', textAlign: 'center' }}>No sign-in records yet</td></tr>
            ) : visible.map(row => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '9px 14px', fontSize: '0.84rem', color: T.text }}>{row.name}</td>
                <td style={{ padding: '9px 14px', fontSize: '0.79rem', color: T.muted, fontFamily: 'var(--font-mono)' }}>{row.email}</td>
                <td style={{ padding: '9px 14px', fontSize: '0.74rem', color: T.sub, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {new Date(row.signed_in_at).toLocaleString('en-NG', {
                    day: 'numeric', month: 'short', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {err && (
        <div style={{ padding: '8px 14px', color: T.error, fontSize: '0.78rem', borderTop: `1px solid ${T.border}` }}>{err}</div>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────── */
export default function ConfigPage() {
  const [categories, setCategories] = useState<Item[]>([])
  const [types,      setTypes]      = useState<Item[]>([])
  const [projects,   setProjects]   = useState<Item[]>([])

  // Load reference data for select fields
  useEffect(() => {
    fetch('/api/config/categories').then(r => r.json()).then(d => setCategories(d.items ?? []))
    fetch('/api/config/types').then(r => r.json()).then(d => setTypes(d.items ?? []))
    fetch('/api/config/projects').then(r => r.json()).then(d => setProjects(d.items ?? []))
  }, [])

  const related: RelatedMap = { categories, types, projects }

  const SECTIONS: { icon: string; title: string; resource: string; fields: FieldDef[] }[] = [
    {
      icon: '🚗', title: 'Team Cars', resource: 'teamcars',
      fields: [
        { key: 'name',         label: 'Name',         required: true },
        { key: 'plate_number', label: 'Plate Number' },
        { key: 'order',        label: 'Order',        type: 'number' },
      ],
    },
    {
      icon: '🏢', title: 'Subcontractors', resource: 'subcontractors',
      fields: [
        { key: 'name',  label: 'Name',  required: true },
        { key: 'order', label: 'Order', type: 'number' },
      ],
    },
    {
      icon: '📂', title: 'Activity Categories', resource: 'categories',
      fields: [
        { key: 'name',  label: 'Name',  required: true },
        { key: 'order', label: 'Order', type: 'number' },
      ],
    },
    {
      icon: '🏗', title: 'Activity Types', resource: 'types',
      fields: [
        { key: 'name',        label: 'Name',     required: true },
        { key: 'category_id', label: 'Category', type: 'select', getOptions: r => r.categories.map((c: Item) => ({ value: c.id, label: c.name })) },
        { key: 'order',       label: 'Order',    type: 'number' },
      ],
    },
    {
      icon: '🔧', title: 'Activity Subtypes', resource: 'subtypes',
      fields: [
        { key: 'name',             label: 'Name', required: true },
        { key: 'activity_type_id', label: 'Type', type: 'select', getOptions: r => r.types.map((t: Item) => ({ value: t.id, label: t.name })) },
        { key: 'order',            label: 'Order', type: 'number' },
      ],
    },
    {
      icon: '🗺', title: 'Projects', resource: 'projects',
      fields: [
        { key: 'name', label: 'Name', required: true },
      ],
    },
    {
      icon: '📍', title: 'Sections', resource: 'sections',
      fields: [
        { key: 'name',       label: 'Name',    required: true },
        { key: 'project_id', label: 'Project', type: 'select', getOptions: r => r.projects.map((p: Item) => ({ value: p.id, label: p.name })) },
      ],
    },
    {
      icon: '👷', title: 'Site Supervisors', resource: 'supervisors',
      fields: [
        { key: 'name',  label: 'Name',  required: true },
        { key: 'party', label: 'Party', type: 'select', getOptions: () => [
          { value: 'Hitech employees', label: 'Hitech employees' },
          { value: 'Sub-contactor',    label: 'Sub-contactor' },
        ]},
        { key: 'order', label: 'Order', type: 'number' },
      ],
    },
    {
      icon: '🧑‍💼', title: 'Site Engineers', resource: 'engineers',
      fields: [
        { key: 'name',  label: 'Name',  required: true },
        { key: 'party', label: 'Party', type: 'select', getOptions: () => [
          { value: 'Hitech employees', label: 'Hitech employees' },
          { value: 'Sub-contactor',    label: 'Sub-contactor' },
        ]},
        { key: 'order', label: 'Order', type: 'number' },
      ],
    },
    {
      icon: '🚧', title: 'Machinery Types', resource: 'machinerytypes',
      fields: [
        { key: 'name',  label: 'Name',  required: true },
        { key: 'order', label: 'Order', type: 'number' },
      ],
    },
  ]

  return (
    <PageShell title="Config" subtitle="Manage dropdown data & user accounts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {SECTIONS.map(s => (
          <Section key={s.resource} {...s} related={related} />
        ))}
        <UsersSection />
        <SignInHistorySection />
      </div>
    </PageShell>
  )
}
