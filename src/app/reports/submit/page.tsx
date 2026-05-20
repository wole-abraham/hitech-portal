'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, ActivityType, ActivitySubType, Project, Section, Employee, Machine, ChainageResult, PersonRow, MachineRow } from '@/lib/types'
import Select from '@/components/Select'
import AmbientBackground from '@/components/AmbientBackground'
import { startMediaUpload } from '@/lib/mediaQueue'
import ChainageMap from '@/components/ChainageMap'

/* ── Design tokens (Hitech — light warm theme) ──────────────────── */
const C = {
  bg:           '#f8f7f5',
  white:        '#f0ede8',
  orange:       '#f59e0b',
  orangeLight:  'rgba(245,158,11,0.10)',
  orangeBorder: 'rgba(245,158,11,0.30)',
  text:         '#1a1610',
  muted:        '#6b6055',
  border:       'rgba(0,0,0,0.09)',
  inputBg:      '#edeae5',
  error:        '#dc2626',
  errorBg:      'rgba(220,38,38,0.08)',
  success:      '#16a34a',
  shadow:       '0 2px 12px rgba(0,0,0,0.07)',
  shadowMd:     '0 12px 40px rgba(0,0,0,0.13)',
}

const CARD_COLORS: [string, string] = ['#ffffff', '#fdf8ef']

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: C.inputBg, border: `1px solid rgba(0,0,0,0.14)`,
  borderRadius: 11, color: C.text, fontSize: '0.92rem',
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const emptyPerson = (): PersonRow => ({ name: '', role: '', party: 'Employee', subcontractor_name: '', missing_name: '' })
const emptyMachine = (): MachineRow => ({ equipment_id: null, fleet_number: '', machine_name: '', machine_belonging: '', driver_name: '' })

function handleAcquired(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (!e.target.value) return
  e.target.classList.add('field-acquired')
  setTimeout(() => e.target.classList.remove('field-acquired'), 750)
}

/* ── Animated card wrapper ─────────────────────────────────── */
function Card({ children, icon, title, delay = 0, className, cardBg }: { children: React.ReactNode; icon: string; title: string; delay?: number; className?: string; cardBg?: string }) {
  const [vis, setVis] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type
    const isBack = navType === 'back_forward'
    const effectiveDelay = isBack ? 0 : delay
    const t = setTimeout(() => {
      setVis(true)
      setTimeout(() => setDone(true), isBack ? 0 : 500)
    }, effectiveDelay)
    return () => clearTimeout(t)
  }, [delay])
  const bg = cardBg ?? '#ffffff'
  const isAlt = bg === CARD_COLORS[1]
  return (
    <div
      className={className}
      style={{
        background: bg,
        border: `1px solid ${isAlt ? 'rgba(245,158,11,0.18)' : 'rgba(0,0,0,0.09)'}`,
        borderRadius: 16,
        boxShadow: C.shadow,
        opacity: vis ? 1 : 0,
        ...(done ? {} : { transform: vis ? 'translateY(0)' : 'translateY(18px)' }),
        transition: 'opacity 0.45s ease, transform 0.45s ease',
      }}
    >
      <div style={{ padding: '13px 16px 11px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: C.white, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', border: `1px solid ${C.border}` }}>{icon}</div>
        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: C.text, fontFamily: 'var(--font-display)' }}>{title}</span>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label style={{ fontSize: '0.63rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: C.muted, marginBottom: 6, display: 'block', fontFamily: 'var(--font-mono)' }}>
    {children}{required && <span style={{ color: C.orange, marginLeft: 3 }}>*</span>}
  </label>
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {['Yes', 'No'].map(v => (
        <button key={v} type="button" onClick={() => onChange(v)} style={{
          padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
          border: value === v ? `1px solid rgba(0,0,0,0.30)` : `1px solid rgba(0,0,0,0.10)`,
          background: value === v ? 'rgba(0,0,0,0.07)' : C.inputBg,
          color: value === v ? C.text : C.muted,
          transition: 'all 0.18s',
        }}>{v}</button>
      ))}
    </div>
  )
}

function ChainageInput({ label, required, project, section, value, onChange, onCoords }: {
  label: string; required?: boolean; project: string; section: string;
  value: string; onChange: (val: string) => void
  onCoords?: (lat: number | null, lng: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChainageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        // check if click is inside the fixed dropdown (by id)
        const drop = document.getElementById('chainage-drop-' + label)
        if (drop && drop.contains(target)) return
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, label])

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 40)
  }, [open])

  async function fetchResults(q: string) {
    if (!project) return
    setLoading(true)
    const params = new URLSearchParams({ project, section, q })
    const res = await fetch(`/api/reports/chainage?${params}`)
    const data = await res.json()
    if (data._debug) console.warn('[ChainageInput]', data._debug, '| project sent:', project)
    console.log('[ChainageInput] results:', data.results?.length ?? 0, 'total:', data.total, 'for project:', project)
    setResults(data.results || [])
    setLoading(false)
  }

  function openDrop() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setDropPos({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    setQuery('')
    setOpen(o => {
      if (!o) fetchResults('')
      return !o
    })
  }

  function pick(c: ChainageResult) {
    onChange(c.chainage)
    onCoords?.(c.latitude ?? null, c.longitude ?? null)
    setOpen(false)
  }

  return (
    <div>
      <Label required={required}>{label}</Label>

      {/* Trigger — mirrors Select button style */}
      <div ref={triggerRef}>
        <button
          type="button"
          onClick={openDrop}
          style={{
            width: '100%', padding: '13px 14px',
            background: C.inputBg, border: `1px solid ${open ? 'rgba(0,0,0,0.28)' : C.border}`,
            borderRadius: 14, color: value ? C.text : C.muted,
            fontSize: '0.95rem', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', outline: 'none', textAlign: 'left',
            boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.25)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {value || 'e.g. 1+250'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={open ? '#3b82f6' : C.muted} strokeWidth="2.5"
            style={{ flexShrink: 0, marginLeft: 8, transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Dropdown — position:fixed escapes every stacking context */}
      {open && (
        <div id={`chainage-drop-${label}`} style={{
          position: 'fixed',
          top: dropPos.top, left: dropPos.left, width: dropPos.width,
          zIndex: 9999,
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
          overflow: 'hidden',
          animation: 'chainageDrop 0.2s ease',
        }}>
          <style>{`@keyframes chainageDrop { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }`}</style>

          {/* Search box */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              ref={searchRef}
              value={query}
              onChange={e => { setQuery(e.target.value); fetchResults(e.target.value) }}
              placeholder="Type chainage…"
              style={{
                width: '100%', padding: '9px 12px',
                background: '#f0ede8', border: '1px solid rgba(0,0,0,0.10)',
                borderRadius: 10, color: C.text, fontSize: '0.88rem',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Results */}
          <div style={{ overflowY: 'auto', maxHeight: 240 }}>
            {loading ? (
              <div style={{ padding: '14px 16px', color: C.muted, fontSize: '0.85rem', textAlign: 'center' }}>Loading…</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '14px 16px', color: C.muted, fontSize: '0.85rem', textAlign: 'center' }}>
                {project ? `No chainages found for "${project}"` : 'Select a project first'}
              </div>
            ) : results.map((c, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={e => { e.preventDefault(); pick(c) }}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: value === c.chainage ? 'rgba(245,158,11,0.10)' : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)',
                  color: C.text,
                  fontSize: '0.88rem', fontFamily: 'inherit',
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background 0.15s',
                  fontWeight: value === c.chainage ? 700 : 400,
                }}
                onMouseEnter={e => { if (value !== c.chainage) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (value !== c.chainage) e.currentTarget.style.background = 'transparent' }}
              >
                <strong style={{ color: 'inherit' }}>{c.chainage}</strong>
                <span style={{ color: C.muted, fontSize: '0.78rem', marginLeft: 8 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RepeatPersonGroup({ label, icon, rows, setRows, employees, delay, partyOptions, nameList, showRole, cardBg }: {
  label: string; icon: string; rows: PersonRow[]
  setRows: React.Dispatch<React.SetStateAction<PersonRow[]>>
  employees: Employee[]; delay?: number
  partyOptions?: string[]
  nameList?: { id: number; name: string; party: string }[]
  showRole?: boolean | ((party: string) => boolean)
  cardBg?: string
}) {
  const update = (i: number, k: keyof PersonRow, v: string) => {
    setRows(r => { const n = [...r]; n[i] = { ...n[i], [k]: v }; return n })
  }
  const parties = partyOptions ?? ['Employee', 'Sub-contractor']
  return (
    <Card className="card-full" icon={icon} title={`${label} — min 1`} delay={delay} cardBg={cardBg}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row, i) => {
          const takenNames = new Set(rows.filter((_, j) => j !== i).map(r => r.name).filter(n => n && n !== '__other__'))
          const nameOptions = (nameList
            ? (row.party ? nameList.filter(n => n.party === row.party) : nameList)
            : employees
          ).filter(e => !takenNames.has(e.name))
          return (
            <div key={i} style={{ background: '#f2efe9', border: `1px solid rgba(0,0,0,0.07)`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label.slice(0, -1)} {i + 1}</span>
                {rows.length > 1 && (
                  <button type="button" onClick={() => setRows(r => r.filter((_, j) => j !== i))}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: C.error, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row2>
                  <div>
                    <Label>Party</Label>
                    <Select
                      value={row.party}
                      onChange={v => update(i, 'party', v)}
                      options={parties.map(p => ({ value: p, label: p }))}
                    />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Select
                      value={row.name}
                      onChange={v => update(i, 'name', v)}
                      placeholder="Select"
                      searchable
                      options={[
                        ...nameOptions.map(e => ({ value: e.name, label: e.name })),
                        { value: '__other__', label: 'Not in list' },
                      ]}
                    />
                  </div>
                </Row2>
                {(typeof showRole === 'function' ? showRole(row.party) : showRole) && (
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={row.role || ''}
                      onChange={v => update(i, 'role', v)}
                      placeholder="Select role"
                      options={['Engineer','Supervisor','Operator','Technician','Labourer','Driver','Surveyor','Site Manager','Other'].map(r => ({ value: r, label: r }))}
                    />
                  </div>
                )}
                {row.name === '__other__' && (
                  <div><Label>Enter Name</Label>
                    <input style={inp} value={row.missing_name} onChange={e => update(i, 'missing_name', e.target.value)} onBlur={handleAcquired} />
                  </div>
                )}
                {row.party === 'Sub-contractor' && (
                  <div><Label>Subcontractor Name</Label>
                    <input style={inp} value={row.subcontractor_name} onChange={e => update(i, 'subcontractor_name', e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={() => setRows(r => [...r, emptyPerson()])}
        style={{ width: '100%', padding: '11px', background: 'rgba(59,130,246,0.06)', border: `1px dashed rgba(59,130,246,0.3)`, borderRadius: 12, color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
        + Add {label.slice(0, -1)}
      </button>
    </Card>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export default function SubmitPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    date_of_activity: new Date().toISOString().split('T')[0],
    reporter_name: '', weather: '', project_name: '', section_name: '',
    activity_category: '', activity_type: '', activity_subtype: '', side: '',
    start_chainage: '', start_chainage_lat: '', start_chainage_long: '',
    end_chainage: '', end_chainage_lat: '', end_chainage_long: '',
    activity_status: 'Ongoing',
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [allTypes, setAllTypes] = useState<ActivityType[]>([])
  const [allSubtypes, setAllSubtypes] = useState<ActivitySubType[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allSections, setAllSections] = useState<Section[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [equipmentList, setEquipmentList] = useState<{ id: number; fleet_number: string; machine_type: string; machine_belonging: string }[]>([])

  const [startCoords, setStartCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })
  const [endCoords, setEndCoords]     = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null })

  const [employeeRows, setEmployeeRows] = useState<PersonRow[]>([emptyPerson()])
  const [supervisorRows, setSupervisorRows] = useState<PersonRow[]>([emptyPerson()])
  const [machineRows, setMachineRows] = useState<MachineRow[]>([emptyMachine()])

  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null])
  const [video, setVideo] = useState<File | null>(null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStage, setSubmitStage] = useState('')

  const [reuseOpen, setReuseOpen] = useState(false)
  const [reuseReports, setReuseReports] = useState<any[]>([])
  const [reuseLoading, setReuseLoading] = useState(false)

  const filteredTypes = allTypes.filter(t => categories.find(c => c.name === form.activity_category)?.id === t.category_id)
  const filteredSubtypes = allSubtypes.filter(s => allTypes.find(t => t.name === form.activity_type)?.id === s.activity_type_id)
  const filteredSections = allSections.filter(s => s.project_name === form.project_name)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // XP bar — counts filled required checkpoints (0–10)
  const xpChecks = [
    !!form.reporter_name,
    !!form.project_name,
    !!form.activity_category,
    !!form.start_chainage,
    !!form.end_chainage,
    employeeRows.some(r => (r.name && r.name !== '__other__') || !!r.missing_name),
    supervisorRows.some(r => (r.name && r.name !== '__other__') || !!r.missing_name),
    machineRows.some(r => !!r.machine_name),
    photos.some(Boolean) || !!video,
  ]
  const xpPercent = Math.round(xpChecks.filter(Boolean).length / xpChecks.length * 100)


  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const h = { apikey: key, Authorization: `Bearer ${key}` }
    const safe = (p: Promise<unknown>) => p.catch(() => [])
    const q = (table: string, params = '') =>
      safe(fetch(`${url}/rest/v1/${table}?${params}`, { headers: h }).then(r => r.json()))

    // Each fetch is independent — a failure in one won't block the others

    // hitech_report_* and surveycollection_employee: anon key works (permissive RLS)
    q('hitech_report_activitycategory', 'select=id,name&order=order')
      .then(d => { if (Array.isArray(d)) setCategories(d) })
    q('hitech_report_activitytype', 'select=id,name,category_id&order=sort_order')
      .then(d => { if (Array.isArray(d)) setAllTypes(d) })
    q('hitech_report_activitysubtype', 'select=id,name,activity_type_id&order=sort_order')
      .then(d => { if (Array.isArray(d)) setAllSubtypes(d) })
    fetch('/api/employees?status=Active&excludeAdmins=true').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEmployees(d) })
    fetch('/api/equipment').then(r => r.json())
      .then(d => { if (Array.isArray(d)) setEquipmentList(d) })

    // surveycollection_project / section: RLS blocks anon — use service-role API routes instead
    // (these routes are accessible to all authenticated roles, not admin-only)
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).catch(() => {})
    fetch('/api/sections').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllSections(d) }).catch(() => {})

    fetch('/api/auth/me').then(r => r.json()).then(d => {
    if (!d.user) { router.replace('/login'); return }
    set('reporter_name', d.user.username || `${d.user.first_name} ${d.user.last_name}`.trim() || d.user.email || '')
  }).catch(() => {})
  }, [])

  async function openReuse() {
    setReuseOpen(true)
    setReuseLoading(true)
    try {
      const res = await fetch('/api/reports/reuse')
      const data = await res.json()
      setReuseReports(Array.isArray(data.reports) ? data.reports : [])
    } catch { setReuseReports([]) }
    setReuseLoading(false)
  }

  function applyReuse(report: any) {
    setReuseOpen(false)
    setForm(f => ({
      ...f,
      date_of_activity: new Date().toISOString().split('T')[0],
      weather: report.weather || '',
      project_name: report.project_name || '',
      section_name: report.section_name || '',
      activity_category: report.activity_category || '',
      activity_type: report.activity_type || '',
      activity_subtype: report.activity_subtype || '',
      side: report.side || '',
      start_chainage: report.start_chainage || '',
      end_chainage: report.end_chainage || '',
      activity_status: 'Ongoing',
    }))
    if (Array.isArray(report.employees) && report.employees.length > 0) {
      setEmployeeRows(report.employees.map((e: any) => ({
        name: e.employee_name || (e.employee_missing_name ? '__other__' : ''),
        role: e.employee_role || '',
        party: 'Employee',
        subcontractor_name: '',
        missing_name: e.employee_missing_name || '',
      })))
    }
    if (Array.isArray(report.supervisors) && report.supervisors.length > 0) {
      setSupervisorRows(report.supervisors.map((s: any) => ({
        name: s.supervisor_name || (s.supervisor_missing_name ? '__other__' : ''),
        role: '',
        party: s.party || 'Employee',
        subcontractor_name: s.subcontractor_name || '',
        missing_name: s.supervisor_missing_name || '',
      })))
    }
    if (Array.isArray(report.machines) && report.machines.length > 0) {
      setMachineRows(report.machines.map((m: any) => ({
        equipment_id: null,
        fleet_number: m.fleet_number || m.plate_number || '',
        machine_name: m.machine_name || '',
        machine_belonging: m.ownership || '',
        driver_name: m.driver_name || '',
      })))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.start_chainage) return setError('Please provide a starting chainage.')
    if (!form.end_chainage) return setError('Please provide an ending chainage.')
    if (employeeRows.every(r => !r.name && !r.missing_name)) return setError('Please add at least one employee.')
    if (supervisorRows.every(r => !r.name && !r.missing_name)) return setError('Please add at least one supervisor.')
    if (machineRows.every(r => !r.machine_name)) return setError('Please add at least one machine.')
    if (!form.project_name) return setError('Please select a project.')
    if (!form.activity_category) return setError('Please select an activity category.')
    setSubmitting(true)
    setSubmitStage('Saving report…')

    const res = await fetch('/api/reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        start_chainage_lat:  startCoords.lat,
        start_chainage_long: startCoords.lng,
        end_chainage_lat:    endCoords.lat,
        end_chainage_long:   endCoords.lng,
        employees: employeeRows,
        supervisors: supervisorRows,
        machines: machineRows,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setSubmitting(false); return setError(data.error || 'Submission failed.') }

    // Fire media uploads in background — don't block navigation
    const photoFiles = photos.filter(Boolean) as File[]
    if (photoFiles.length > 0 || video) {
      startMediaUpload(data.id, photoFiles, video)
    }

    router.push('/reports/success')
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', color: C.text }}>
      <AmbientBackground />
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          margin-left: 4px;
          padding: 3px 4px;
          border-radius: 4px;
          background-color: #ffffff;
          cursor: pointer;
          transition: filter 0.15s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          filter: invert(1);
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'rgba(248,247,245,0.93)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* XP progress bar */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, #f59e0b ${xpPercent}%, rgba(245,158,11,0.1) ${xpPercent}%)`,
          transition: 'background 0.6s ease',
        }} />
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
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
        <button type="button" onClick={openReuse} style={{
          height: 34, padding: '0 14px', borderRadius: 8,
          background: C.inputBg, color: C.muted,
          font: '700 11px/1 var(--font-display)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          border: `1px solid ${C.border}`,
          cursor: 'pointer', flexShrink: 0,
          letterSpacing: '0.09em', textTransform: 'uppercase',
        }}>
          ↺ Reuse
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'var(--font-display)' }}>Activity Report</div>
          <div style={{ fontSize: '0.68rem', color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>Hitech Construction</div>
        </div>
        </div>
      </header>

      <form id="activity-form" onSubmit={handleSubmit} style={{ flex: 1, padding: '20px 16px 120px', maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
        <div className="submit-cards">

        {/* Reuse Previous Report modal */}
        {reuseOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 80px',
          }} onClick={() => setReuseOpen(false)}>
            <div style={{
              background: '#ffffff', border: `1px solid ${C.orangeBorder}`,
              borderRadius: 20, padding: '18px 16px',
              width: '100%', maxWidth: 560, maxHeight: '68vh',
              display: 'flex', flexDirection: 'column', gap: 12,
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.text, fontFamily: 'var(--font-display)' }}>Reuse Previous Report</div>
                  <div style={{ fontSize: '0.68rem', color: C.muted, marginTop: 2, fontFamily: 'var(--font-mono)' }}>Select a report to pre-fill this form</div>
                </div>
                <button type="button" onClick={() => setReuseOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}>✕</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reuseLoading ? (
                  <div style={{ color: C.muted, fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>Loading reports…</div>
                ) : reuseReports.length === 0 ? (
                  <div style={{ color: C.muted, fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No previous reports found.</div>
                ) : reuseReports.map((r: any) => (
                  <button type="button" key={r.id} onClick={() => applyReuse(r)} style={{
                    width: '100%', padding: '12px 14px', textAlign: 'left',
                    background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12, cursor: 'pointer', color: C.text,
                    display: 'flex', flexDirection: 'column', gap: 3,
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.87rem', color: C.text }}>
                      {r.project_name || '—'}{r.section_name ? ` / ${r.section_name}` : ''}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: C.orange }}>
                      {r.activity_category}{r.activity_type ? ` › ${r.activity_type}` : ''}
                    </div>
                    <div style={{ fontSize: '0.71rem', color: C.muted, fontFamily: 'var(--font-mono)' }}>
                      {r.date_of_activity} · {r.reporter_name} · {r.start_chainage} → {r.end_chainage}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error modal */}
        {error && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }} onClick={() => setError('')}>
            <div style={{
              background: '#fff5f5',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 20, padding: '28px 24px',
              maxWidth: 400, width: '100%',
              boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
              textAlign: 'center',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>⚠️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: '#dc2626', marginBottom: 10 }}>
                Submission Failed
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#7a3a3a', lineHeight: 1.6, marginBottom: 22 }}>
                {error}
              </div>
              <button onClick={() => setError('')} style={{
                width: '100%', padding: '12px',
                background: 'rgba(220,38,38,0.10)',
                border: '1px solid rgba(220,38,38,0.30)',
                borderRadius: 10, color: '#dc2626',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem',
                cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
                transition: 'background 0.15s',
              }}>
                Fix &amp; Retry
              </button>
            </div>
          </div>
        )}

        {/* 1. Activity Info */}
        <Card className="card-full" icon="📋" title="Activity Information" delay={60} cardBg={CARD_COLORS[0]}>
          <Row2>
            <div>
              <Label required>Date</Label>
              <input type="date" style={inp} value={form.date_of_activity} onChange={e => set('date_of_activity', e.target.value)} required />
            </div>
            <div>
              <Label>Weather</Label>
              <Select
                value={form.weather}
                onChange={v => set('weather', v)}
                placeholder="Select"
                options={['Sunny','Cloudy','Rainy','Windy','Overcast','Foggy'].map(w => ({ value: w, label: w }))}
              />
            </div>
          </Row2>
          <div>
            <Label required>Reporter Name</Label>
            <input style={inp} value={form.reporter_name} onChange={e => set('reporter_name', e.target.value)} onBlur={handleAcquired} required />
          </div>
          <Row2>
            <div>
              <Label required>Project</Label>
              <Select
                value={form.project_name}
                onChange={v => { set('project_name', v); set('section_name', '') }}
                placeholder="Select project"
                searchable
                options={projects.map(p => ({ value: p.name, label: p.name }))}
              />
            </div>
            <div>
              <Label>Section</Label>
              <Select
                value={form.section_name}
                onChange={v => set('section_name', v)}
                placeholder="Select section"
                disabled={!form.project_name}
                options={filteredSections.map(s => ({ value: s.name, label: s.name }))}
              />
            </div>
          </Row2>
        </Card>

        {/* 2. Activity Type */}
        <Card icon="🏗️" title="Activity Type" delay={120} cardBg={CARD_COLORS[1]}>
          <div>
            <Label required>Category</Label>
            <Select
              value={form.activity_category}
              onChange={v => { set('activity_category', v); set('activity_type', ''); set('activity_subtype', '') }}
              placeholder="Select category"
              searchable
              options={categories.map(c => ({ value: c.name, label: c.name }))}
            />
          </div>
          <Row2>
            <div>
              <Label>Type</Label>
              <Select
                value={form.activity_type}
                onChange={v => { set('activity_type', v); set('activity_subtype', '') }}
                placeholder="Select type"
                disabled={!form.activity_category}
                searchable
                options={filteredTypes.map(t => ({ value: t.name, label: t.name }))}
              />
            </div>
            <div>
              <Label>Sub-type</Label>
              <Select
                value={form.activity_subtype}
                onChange={v => set('activity_subtype', v)}
                placeholder="Sub-type"
                disabled={!form.activity_type}
                options={filteredSubtypes.map(s => ({ value: s.name, label: s.name }))}
              />
            </div>
          </Row2>
          <Row2>
            <div>
              <Label>Side</Label>
              <Select
                value={form.side}
                onChange={v => set('side', v)}
                placeholder="Select"
                options={['Left','Right','Median'].map(s => ({ value: s, label: s }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.activity_status}
                onChange={v => set('activity_status', v)}
                placeholder="Status"
                options={['Ongoing','Completed','Suspended','Planned'].map(s => ({ value: s, label: s }))}
              />
            </div>
          </Row2>
        </Card>

        {/* 3. Chainage */}
        <Card icon="📍" title="Chainage" delay={180} cardBg={CARD_COLORS[0]}>
          <ChainageInput
            label="Start Chainage" required
            project={form.project_name} section={form.section_name}
            value={form.start_chainage}
            onChange={v => set('start_chainage', v)}
            onCoords={(lat, lng) => setStartCoords({ lat, lng })}
          />
          <div style={{ marginTop: 12 }} />
          <ChainageInput
            label="End Chainage" required
            project={form.project_name} section={form.section_name}
            value={form.end_chainage}
            onChange={v => set('end_chainage', v)}
            onCoords={(lat, lng) => setEndCoords({ lat, lng })}
          />
          <ChainageMap
            startLat={startCoords.lat} startLng={startCoords.lng}
            endLat={endCoords.lat}     endLng={endCoords.lng}
          />
        </Card>

        {/* 4–5. Personnel */}
        <RepeatPersonGroup label="Employees" icon="👷" rows={employeeRows} setRows={setEmployeeRows} employees={employees} delay={240}
          partyOptions={['Employee', 'Sub-contractor']}
          nameList={[
            ...employees.map(e => ({ id: e.id, name: e.name, party: 'Employee' })),
            { id: -1, name: 'Zenith', party: 'Sub-contractor' },
            { id: -2, name: 'SPG', party: 'Sub-contractor' },
            { id: -3, name: 'Multi road', party: 'Sub-contractor' },
          ]}
          showRole={party => party === 'Employee'}
          cardBg={CARD_COLORS[1]}
        />
        <RepeatPersonGroup label="Supervisors" icon="🦺" rows={supervisorRows} setRows={setSupervisorRows} employees={employees} delay={280}
          partyOptions={['Hitech employees', 'Sub-contractor']}
          nameList={[
            ...employees.filter(e => e.role === 'Supervisor').map(e => ({ id: e.id, name: e.name, party: 'Hitech employees' })),
            { id: -1, name: 'Zenith', party: 'Sub-contractor' },
            { id: -2, name: 'SPG', party: 'Sub-contractor' },
            { id: -3, name: 'Multi road', party: 'Sub-contractor' },
          ]}
          cardBg={CARD_COLORS[0]}
        />

        {/* 6. Machines */}
        <Card className="card-full" icon="🚜" title="Machinery — min 1" delay={320} cardBg={CARD_COLORS[1]}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {machineRows.map((row, i) => (
              <div key={i} style={{ background: '#f2efe9', border: `1px solid rgba(0,0,0,0.07)`, borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Machine {i + 1}</span>
                  {machineRows.length > 1 && (
                    <button type="button" onClick={() => setMachineRows(r => r.filter((_, j) => j !== i))}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: C.error, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Row2>
                    <div>
                      <Label required>Owner</Label>
                      <Select
                        value={row.machine_belonging}
                        onChange={v => setMachineRows(r => { const n = [...r]; n[i] = { ...n[i], machine_belonging: v, fleet_number: '', machine_name: '', equipment_id: null }; return n })}
                        placeholder="Select owner"
                        options={[...new Set(equipmentList.map(e => e.machine_belonging).filter(Boolean))].map(o => ({ value: o, label: o }))}
                      />
                    </div>
                    <div>
                      <Label required>Machine</Label>
                      <Select
                        value={row.fleet_number}
                        onChange={v => {
                          const eq = equipmentList.find(e => e.fleet_number === v)
                          setMachineRows(r => { const n = [...r]; n[i] = { ...n[i], equipment_id: eq?.id ?? null, fleet_number: v, machine_name: eq?.machine_type ?? '' }; return n })
                        }}
                        placeholder={row.machine_belonging ? 'Select machine' : 'Pick owner first'}
                        disabled={!row.machine_belonging}
                        searchable
                        options={equipmentList
                          .filter(e => e.machine_belonging === row.machine_belonging)
                          .map(e => ({ value: e.fleet_number, label: `${e.machine_type} — ${e.fleet_number}` }))}
                      />
                    </div>
                  </Row2>
                  <div>
                    <Label>Driver Name</Label>
                    <input style={inp} value={row.driver_name} onChange={e => setMachineRows(r => { const n = [...r]; n[i] = { ...n[i], driver_name: e.target.value }; return n })} onBlur={handleAcquired} placeholder="Driver name" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setMachineRows(r => [...r, emptyMachine()])}
            style={{ width: '100%', padding: '11px', background: 'rgba(59,130,246,0.06)', border: `1px dashed rgba(59,130,246,0.3)`, borderRadius: 12, color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            + Add Machine
          </button>
        </Card>

        {/* 9. Photos & Video */}
        <Card className="card-full" icon="📷" title="Photos & Video — min 1 required" delay={460} cardBg={CARD_COLORS[0]}>
          <div>
            <Label>Site Photos (up to 5)</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {photos.map((photo, i) => (
                <label key={i} style={{
                  aspectRatio: '1', background: photo ? 'rgba(59,130,246,0.06)' : C.inputBg,
                  border: `2px ${photo ? 'solid' : 'dashed'} ${photo ? '#3b82f6' : 'rgba(255,255,255,0.16)'}`,
                  borderRadius: 12, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden',
                }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0] || null
                    setPhotos(p => { const n = [...p]; n[i] = file; return n })
                  }} />
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <span style={{ fontSize: '1.3rem', opacity: 0.4 }}>📷</span>
                      <span style={{ fontSize: '0.68rem', color: C.muted, fontWeight: 600 }}>Photo {i + 1}</span>
                    </>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Video (optional)</Label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: video ? 'rgba(59,130,246,0.08)' : C.inputBg,
              border: `2px dashed ${video ? '#3b82f6' : 'rgba(255,255,255,0.16)'}`,
              borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setVideo(e.target.files?.[0] || null)} />
              <span style={{ fontSize: '1.4rem' }}>🎥</span>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: video ? '#60a5fa' : C.muted }}>{video ? video.name : 'Tap to upload video'}</div>
                {video && <div style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2 }}>{(video.size / 1024 / 1024).toFixed(1)} MB</div>}
              </div>
            </label>
          </div>
        </Card>

        </div>{/* end submit-cards */}
      </form>

      {/* Bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(248,247,245,0.93)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `1px solid rgba(0,0,0,0.08)`,
        padding: '14px 18px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        zIndex: 100,
      }}>
        {/* Submission overlay */}
        {submitting && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9997,
            background: 'rgba(248,247,245,0.92)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 20,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              border: '3px solid rgba(245,158,11,0.2)',
              borderTopColor: '#f59e0b',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {submitStage}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <button type="submit" form="activity-form" disabled={submitting} onClick={handleSubmit} style={{
          width: '100%', padding: '14px',
          background: submitting ? 'rgba(245,158,11,0.12)' : C.orange,
          color: submitting ? C.muted : '#1a1410',
          border: 'none', borderRadius: 11,
          fontFamily: 'var(--font-display)',
          fontWeight: 800, fontSize: '0.92rem',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          cursor: submitting ? 'not-allowed' : 'pointer',
          boxShadow: submitting ? 'none' : `0 4px 24px ${C.orangeBorder}`,
          transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {submitting ? (
            <>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: '2px solid rgba(245,158,11,0.3)',
                borderTopColor: C.orange,
                animation: 'spin 0.7s linear infinite',
                flexShrink: 0,
              }} />
              {submitStage || 'Submitting…'}
            </>
          ) : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
