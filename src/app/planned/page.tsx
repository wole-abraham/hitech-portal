'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

type PA = {
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
  is_active: boolean
  created_at: string
  created_by: string | null
}

const empty = {
  title: '', description: '', project_name: '', section_name: '',
  activity_category: '', activity_type: '', activity_subtype: '',
  side: '', weather: '', start_chainage: '', end_chainage: '',
}

const C = {
  bg: '#f8f7f5', card: '#ffffff', cardAlt: '#fdf8ef',
  orange: '#f59e0b', orangeLight: 'rgba(245,158,11,0.10)',
  orangeBorder: 'rgba(245,158,11,0.30)',
  text: '#1a1610', muted: '#6b6055', sub: '#8c8480',
  border: 'rgba(0,0,0,0.09)', inputBg: '#edeae5',
  success: '#16a34a', error: '#dc2626',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: C.inputBg, border: `1px solid rgba(0,0,0,0.12)`,
  borderRadius: 10, color: C.text, fontSize: '0.88rem',
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, flex = '1 1 140px' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; flex?: string
}) {
  return (
    <div style={{ flex, minWidth: 100 }}>
      <Label>{label}</Label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp} />
    </div>
  )
}

function SelectField({ label, value, onChange, options, flex = '1 1 140px' }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; flex?: string
}) {
  return (
    <div style={{ flex, minWidth: 100 }}>
      <Label>{label}</Label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
        <option value="">— select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Pill({ children, color = C.sub }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: '0.62rem', color,
      background: `${color}14`, border: `1px solid ${color}28`,
      borderRadius: 5, padding: '2px 8px',
      fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function Btn({ onClick, color = C.text, bg = 'transparent', children, disabled, full }: {
  onClick: () => void; color?: string; bg?: string; children: React.ReactNode; disabled?: boolean; full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 18px', background: bg, color,
        border: bg === 'transparent' ? `1px solid ${color}35` : 'none',
        borderRadius: 9, fontSize: '0.82rem', fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontFamily: 'var(--font-display)',
        width: full ? '100%' : undefined,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

export default function PlannedPage() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'worker'>('worker')
  const [items, setItems] = useState<PA[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editVals, setEditVals] = useState<Partial<PA>>({})
  const [err, setErr] = useState('')
  const [vis, setVis] = useState(false)

  // Dropdown data
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [allTypes, setAllTypes] = useState<{ id: number; name: string; category_id: number }[]>([])
  const [allSubtypes, setAllSubtypes] = useState<{ id: number; name: string; activity_type_id: number }[]>([])
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([])
  const [allSections, setAllSections] = useState<{ id: number; name: string; project_name: string }[]>([])

  const filteredTypes = allTypes.filter(t => {
    const cat = categories.find(c => c.name === form.activity_category)
    return cat ? t.category_id === cat.id : true
  })
  const filteredSubtypes = allSubtypes.filter(s => {
    const typ = allTypes.find(t => t.name === form.activity_type)
    return typ ? s.activity_type_id === typ.id : true
  })
  const filteredSections = allSections.filter(s => !form.project_name || s.project_name === form.project_name)

  const editFilteredTypes = allTypes.filter(t => {
    const cat = categories.find(c => c.name === editVals.activity_category)
    return cat ? t.category_id === cat.id : true
  })
  const editFilteredSubtypes = allSubtypes.filter(s => {
    const typ = allTypes.find(t => t.name === editVals.activity_type)
    return typ ? s.activity_type_id === typ.id : true
  })
  const editFilteredSections = allSections.filter(s => !editVals.project_name || s.project_name === editVals.project_name)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.replace('/login'); return }
      setRole(d.user.role)
    })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const h = { apikey: key, Authorization: `Bearer ${key}` }
    const q = (table: string, params = '') =>
      fetch(`${url}/rest/v1/${table}?${params}`, { headers: h }).then(r => r.json()).catch(() => [])

    q('hitech_report_activitycategory', 'select=id,name&order=order').then(d => { if (Array.isArray(d)) setCategories(d) })
    q('hitech_report_activitytype', 'select=id,name,category_id&order=sort_order').then(d => { if (Array.isArray(d)) setAllTypes(d) })
    q('hitech_report_activitysubtype', 'select=id,name,activity_type_id&order=sort_order').then(d => { if (Array.isArray(d)) setAllSubtypes(d) })
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).catch(() => {})
    fetch('/api/sections').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllSections(d) }).catch(() => {})

    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/planned?all=true')
      const d = await r.json()
      setItems(d.items ?? [])
    } finally {
      setLoading(false)
      setTimeout(() => setVis(true), 40)
    }
  }

  async function create() {
    if (!form.title.trim()) { setErr('Title is required'); return }
    setSaving(true); setErr('')
    const r = await fetch('/api/planned', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setForm({ ...empty })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function saveEdit() {
    setSaving(true); setErr('')
    const r = await fetch('/api/planned', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editVals),
    })
    const d = await r.json()
    if (!r.ok) { setErr(d.error || 'Save failed'); setSaving(false); return }
    setEditId(null); await load(); setSaving(false)
  }

  async function toggleActive(item: PA) {
    setSaving(true)
    await fetch('/api/planned', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    })
    await load(); setSaving(false)
  }

  async function del(id: number) {
    if (!window.confirm('Delete this planned activity?')) return
    setSaving(true)
    await fetch(`/api/planned?id=${id}`, { method: 'DELETE' })
    await load(); setSaving(false)
  }

  const setF = (k: keyof typeof empty) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const setE = (k: keyof PA) => (v: string) => setEditVals(f => ({ ...f, [k]: v }))

  const visible = role === 'admin'
    ? (showInactive ? items : items.filter(i => i.is_active))
    : items.filter(i => i.is_active)

  const activeCount = items.filter(i => i.is_active).length

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
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Portal
          </a>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'var(--font-display)' }}>Planned Activities</div>
            <div style={{ fontSize: '0.68rem', color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {role === 'admin' ? 'Create & manage pre-filled report templates' : 'Select a plan to start your report'}
            </div>
          </div>

          {role === 'admin' && !showForm && (
            <button
              onClick={() => { setShowForm(true); setErr('') }}
              style={{
                marginLeft: 'auto', height: 34, padding: '0 16px',
                background: C.orange, color: '#1a1610',
                border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-display)',
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: `0 2px 12px ${C.orangeBorder}`,
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Plan
            </button>
          )}
        </div>
      </header>

      <div style={{
        padding: '20px 16px 80px', maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 2,
        opacity: vis ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>

        {/* Create form */}
        {showForm && role === 'admin' && (
          <div style={{
            background: C.cardAlt, border: `1px solid ${C.orangeBorder}`,
            borderRadius: 16, padding: '20px', marginBottom: 24,
            boxShadow: `0 4px 24px ${C.orangeBorder}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: C.text, fontFamily: 'var(--font-display)' }}>
                New Planned Activity
              </div>
              <button onClick={() => { setShowForm(false); setErr('') }} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: C.sub, fontSize: '1.1rem', lineHeight: 1,
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Row 1: title + description */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Field label="Title *" value={form.title} onChange={setF('title')} placeholder="e.g. Morning Paving — Km 12" flex="2 1 200px" />
                <Field label="Description" value={form.description} onChange={setF('description')} placeholder="Brief note for workers (optional)" flex="3 1 240px" />
              </div>

              {/* Row 2: project + section */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 170px', minWidth: 130 }}>
                  <Label>Project</Label>
                  <select value={form.project_name} onChange={e => { setF('project_name')(e.target.value); setF('section_name')('') }} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">— select —</option>
                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: '2 1 170px', minWidth: 130 }}>
                  <Label>Section</Label>
                  <select value={form.section_name} onChange={e => setF('section_name')(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">— select —</option>
                    {filteredSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: category + type + subtype */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '2 1 150px', minWidth: 120 }}>
                  <Label>Category</Label>
                  <select value={form.activity_category} onChange={e => { setF('activity_category')(e.target.value); setF('activity_type')(''); setF('activity_subtype')('') }} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">— select —</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: '2 1 150px', minWidth: 120 }}>
                  <Label>Type</Label>
                  <select value={form.activity_type} onChange={e => { setF('activity_type')(e.target.value); setF('activity_subtype')('') }} style={{ ...inp, cursor: 'pointer' }} disabled={!form.activity_category}>
                    <option value="">— select —</option>
                    {filteredTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: '2 1 150px', minWidth: 120 }}>
                  <Label>Sub-type</Label>
                  <select value={form.activity_subtype} onChange={e => setF('activity_subtype')(e.target.value)} style={{ ...inp, cursor: 'pointer' }} disabled={!form.activity_type}>
                    <option value="">— select —</option>
                    {filteredSubtypes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: side + weather + chainages */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <SelectField label="Side" value={form.side} onChange={setF('side')} options={['Left', 'Right', 'Median']} flex="0 1 110px" />
                <SelectField label="Weather" value={form.weather} onChange={setF('weather')} options={['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Overcast', 'Foggy']} flex="0 1 120px" />
                <Field label="Start Chainage" value={form.start_chainage} onChange={setF('start_chainage')} placeholder="e.g. 1+250" flex="0 1 130px" />
                <Field label="End Chainage" value={form.end_chainage} onChange={setF('end_chainage')} placeholder="e.g. 2+000" flex="0 1 130px" />
              </div>
            </div>

            {err && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(220,38,38,0.08)', color: C.error, fontSize: '0.8rem', borderRadius: 8 }}>
                {err}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setErr(''); setForm({ ...empty }) }} style={{
                padding: '9px 18px', background: 'transparent', color: C.sub,
                border: `1px solid ${C.border}`, borderRadius: 9, fontSize: '0.82rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>
                Cancel
              </button>
              <button onClick={create} disabled={saving} style={{
                padding: '9px 22px', background: C.orange, color: '#1a1610',
                border: 'none', borderRadius: 9, fontSize: '0.82rem', fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                fontFamily: 'var(--font-display)',
              }}>
                {saving ? 'Saving…' : 'Create Plan'}
              </button>
            </div>
          </div>
        )}

        {/* Admin controls */}
        {role === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ fontSize: '0.68rem', color: C.sub, fontFamily: 'var(--font-mono)' }}>
              {activeCount} active / {items.length} total
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
              <span style={{ fontSize: '0.72rem', color: C.sub, fontFamily: 'var(--font-mono)' }}>Show inactive</span>
            </label>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: C.sub, fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
            Loading…
          </div>
        ) : visible.length === 0 ? (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: '40px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.text, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              {role === 'admin' ? 'No planned activities yet' : 'Nothing planned yet'}
            </div>
            <div style={{ fontSize: '0.76rem', color: C.sub, lineHeight: 1.55 }}>
              {role === 'admin'
                ? 'Click "New Plan" above to create a pre-filled report template for your team.'
                : 'An admin will set up planned activities for you to select.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map((item, i) => (
              <PlanCard
                key={item.id}
                item={item}
                delay={i * 35}
                role={role}
                isEditing={editId === item.id}
                editVals={editVals}
                editFilteredTypes={editFilteredTypes}
                editFilteredSubtypes={editFilteredSubtypes}
                editFilteredSections={editFilteredSections}
                categories={categories}
                projects={projects}
                saving={saving}
                onEdit={() => { setEditId(item.id); setEditVals({ ...item }) }}
                onCancelEdit={() => setEditId(null)}
                onSaveEdit={saveEdit}
                onToggle={() => toggleActive(item)}
                onDelete={() => del(item.id)}
                setE={setE}
                setEditVals={setEditVals}
                allTypes={allTypes}
                allSubtypes={allSubtypes}
                allSections={allSections}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PlanCard({ item, delay, role, isEditing, editVals, editFilteredTypes, editFilteredSubtypes, editFilteredSections, categories, projects, saving, onEdit, onCancelEdit, onSaveEdit, onToggle, onDelete, setE, setEditVals, allTypes, allSubtypes, allSections }: {
  item: PA; delay: number; role: string
  isEditing: boolean; editVals: Partial<PA>
  editFilteredTypes: any[]; editFilteredSubtypes: any[]; editFilteredSections: any[]
  categories: any[]; projects: any[]; saving: boolean
  onEdit: () => void; onCancelEdit: () => void; onSaveEdit: () => void
  onToggle: () => void; onDelete: () => void
  setE: (k: keyof PA) => (v: string) => void
  setEditVals: React.Dispatch<React.SetStateAction<Partial<PA>>>
  allTypes: any[]; allSubtypes: any[]; allSections: any[]
}) {
  const [vis, setVis] = useState(false)
  const [hov, setHov] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const meta = [item.activity_category, item.activity_type, item.project_name].filter(Boolean)
  const chainages = item.start_chainage ? `${item.start_chainage}${item.end_chainage ? ` → ${item.end_chainage}` : ''}` : null

  const editTypesForCat = allTypes.filter(t => {
    const cat = categories.find((c: any) => c.name === editVals.activity_category)
    return cat ? t.category_id === cat.id : true
  })
  const editSubsForType = allSubtypes.filter(s => {
    const typ = allTypes.find(t => t.name === editVals.activity_type)
    return typ ? s.activity_type_id === typ.id : true
  })
  const editSecsForProj = allSections.filter((s: any) => !editVals.project_name || s.project_name === editVals.project_name)

  const eInp: React.CSSProperties = {
    width: '100%', padding: '7px 10px',
    background: 'rgba(0,0,0,0.05)', border: `1px solid rgba(0,0,0,0.12)`,
    borderRadius: 8, color: C.text, fontSize: '0.82rem',
    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  }

  if (isEditing) {
    return (
      <div style={{
        background: C.cardAlt, border: `1px solid ${C.orangeBorder}`,
        borderRadius: 16, padding: '16px', opacity: vis ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: C.orange, fontFamily: 'var(--font-mono)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Editing Plan
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 180px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Title *</div>
              <input type="text" value={editVals.title ?? ''} onChange={e => setE('title')(e.target.value)} style={eInp} />
            </div>
            <div style={{ flex: '3 1 220px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Description</div>
              <input type="text" value={editVals.description ?? ''} onChange={e => setE('description')(e.target.value)} style={eInp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 150px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Project</div>
              <select value={editVals.project_name ?? ''} onChange={e => setEditVals(v => ({ ...v, project_name: e.target.value, section_name: '' }))} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">— select —</option>
                {projects.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 150px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Section</div>
              <select value={editVals.section_name ?? ''} onChange={e => setE('section_name')(e.target.value)} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">— select —</option>
                {editSecsForProj.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 130px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Category</div>
              <select value={editVals.activity_category ?? ''} onChange={e => setEditVals(v => ({ ...v, activity_category: e.target.value, activity_type: '', activity_subtype: '' }))} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">— select —</option>
                {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 130px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Type</div>
              <select value={editVals.activity_type ?? ''} onChange={e => setEditVals(v => ({ ...v, activity_type: e.target.value, activity_subtype: '' }))} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">— select —</option>
                {editTypesForCat.map((t: any) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 130px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Sub-type</div>
              <select value={editVals.activity_subtype ?? ''} onChange={e => setE('activity_subtype')(e.target.value)} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">— select —</option>
                {editSubsForType.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 1 110px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Side</div>
              <select value={editVals.side ?? ''} onChange={e => setE('side')(e.target.value)} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">—</option>
                {['Left', 'Right', 'Median'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 1 120px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Weather</div>
              <select value={editVals.weather ?? ''} onChange={e => setE('weather')(e.target.value)} style={{ ...eInp, cursor: 'pointer' }}>
                <option value="">—</option>
                {['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Overcast', 'Foggy'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 1 130px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>Start Chainage</div>
              <input type="text" value={editVals.start_chainage ?? ''} onChange={e => setE('start_chainage')(e.target.value)} placeholder="e.g. 1+250" style={eInp} />
            </div>
            <div style={{ flex: '0 1 130px' }}>
              <div style={{ fontSize: '0.58rem', color: C.sub, fontFamily: 'var(--font-mono)', marginBottom: 4, textTransform: 'uppercase' }}>End Chainage</div>
              <input type="text" value={editVals.end_chainage ?? ''} onChange={e => setE('end_chainage')(e.target.value)} placeholder="e.g. 2+000" style={eInp} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancelEdit} style={{ padding: '7px 16px', background: 'transparent', color: C.sub, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>Cancel</button>
          <button onClick={onSaveEdit} disabled={saving} style={{ padding: '7px 18px', background: C.orange, color: '#1a1610', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'var(--font-display)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.cardAlt : C.card,
        border: `1px solid ${hov ? C.orangeBorder : C.border}`,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: hov ? `0 6px 20px rgba(0,0,0,0.08), 0 2px 6px ${C.orangeLight}` : '0 2px 8px rgba(0,0,0,0.05)',
        opacity: vis ? (item.is_active ? 1 : 0.48) : 0,
        transform: vis ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, background 0.18s, border-color 0.18s, box-shadow 0.18s',
        position: 'relative',
      }}
    >
      {/* Amber left accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: C.orange,
        transform: hov ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />

      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: hov ? C.orangeLight : 'rgba(0,0,0,0.04)',
          border: `1px solid ${hov ? C.orangeBorder : C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.18s, border-color 0.18s',
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none"
            stroke={hov ? C.orange : C.sub} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'stroke 0.18s' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: C.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              {item.title}
            </div>
            {!item.is_active && (
              <span style={{ fontSize: '0.6rem', color: C.sub, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 4 }}>inactive</span>
            )}
          </div>

          {item.description && (
            <div style={{ fontSize: '0.74rem', color: C.muted, marginBottom: 6, lineHeight: 1.45 }}>
              {item.description}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {meta.map((tag, i) => <Pill key={i}>{tag}</Pill>)}
            {item.activity_subtype && <Pill>{item.activity_subtype}</Pill>}
            {item.section_name && item.project_name && <Pill>{item.section_name}</Pill>}
            {item.side && <Pill>{item.side}</Pill>}
            {item.weather && <Pill>{item.weather}</Pill>}
            {chainages && <Pill color={C.orange}>{chainages}</Pill>}
          </div>

          {item.created_by && (
            <div style={{ fontSize: '0.62rem', color: C.sub, fontFamily: 'var(--font-mono)', marginTop: 6 }}>
              by {item.created_by} · {new Date(item.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          {item.is_active && (
            <a
              href={`/reports/submit?from=${item.id}`}
              style={{
                padding: '8px 16px', background: C.orange, color: '#1a1610',
                border: 'none', borderRadius: 9, fontSize: '0.8rem', fontWeight: 800,
                cursor: 'pointer', fontFamily: 'var(--font-display)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: hov ? `0 2px 12px ${C.orangeBorder}` : 'none',
                transition: 'box-shadow 0.18s',
              }}
            >
              Fill Report
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          )}

          {role === 'admin' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onToggle} disabled={saving} style={{
                padding: '5px 11px', background: 'transparent',
                color: item.is_active ? C.sub : C.success,
                border: `1px solid ${item.is_active ? C.border : `${C.success}35`}`,
                borderRadius: 7, fontSize: '0.72rem', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)',
              }}>
                {item.is_active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={onEdit} style={{
                padding: '5px 11px', background: 'transparent', color: C.muted,
                border: `1px solid ${C.border}`, borderRadius: 7, fontSize: '0.72rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}>Edit</button>
              <button onClick={onDelete} disabled={saving} style={{
                padding: '5px 11px', background: 'transparent', color: C.error,
                border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 7, fontSize: '0.72rem',
                fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-mono)',
              }}>Del</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
