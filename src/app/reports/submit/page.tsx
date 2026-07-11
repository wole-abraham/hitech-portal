'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function LockedField({ label, value, required }: { label: string; value: string; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div style={{
        padding: '11px 14px',
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: '0.92rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: C.orange }}>{value}</span>
        <span style={{ fontSize: '0.55rem', color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>from template</span>
      </div>
    </div>
  )
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
          // also track taken free-text names so "Not in list" can't be duplicated
          const takenMissing = new Set(rows.filter((_, j) => j !== i).map(r => r.missing_name?.trim().toLowerCase()).filter(Boolean))
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
                  <div>
                    <Label>Enter Name</Label>
                    <input
                      style={{ ...inp, borderColor: takenMissing.has(row.missing_name?.trim().toLowerCase() ?? '') && row.missing_name?.trim() ? 'rgba(220,38,38,0.6)' : undefined }}
                      value={row.missing_name}
                      onChange={e => update(i, 'missing_name', e.target.value)}
                      onBlur={handleAcquired}
                    />
                    {takenMissing.has(row.missing_name?.trim().toLowerCase() ?? '') && row.missing_name?.trim() && (
                      <div style={{ fontSize: '0.7rem', color: C.error, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        This name is already added above.
                      </div>
                    )}
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
      {(() => {
        const lastRow = rows[rows.length - 1]
        const lastFilled = lastRow && ((lastRow.name && lastRow.name !== '__other__') || !!lastRow.missing_name?.trim())
        return (
          <button
            type="button"
            disabled={!lastFilled}
            onClick={() => setRows(r => [...r, emptyPerson()])}
            title={!lastFilled ? 'Fill in the current row before adding another' : undefined}
            style={{
              width: '100%', padding: '11px',
              background: lastFilled ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px dashed ${lastFilled ? 'rgba(59,130,246,0.3)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 12,
              color: lastFilled ? '#60a5fa' : C.muted,
              fontSize: '0.85rem', fontWeight: 700,
              cursor: lastFilled ? 'pointer' : 'not-allowed',
              opacity: lastFilled ? 1 : 0.5,
            }}>
            + Add {label.slice(0, -1)}
          </button>
        )
      })()}
    </Card>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export default function SubmitPage() {
  return (
    <Suspense>
      <SubmitPageInner />
    </Suspense>
  )
}

function SubmitPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromId = searchParams.get('from')

  const [planTitle, setPlanTitle] = useState<string | null>(null)
  const [plannedChainages, setPlannedChainages] = useState<{ start: string; end: string } | null>(null)
  const [plannedDate, setPlannedDate] = useState<string | null>(null)
  const [planData, setPlanData] = useState<Record<string, string | null> | null>(null)

  const [form, setForm] = useState({
    date_of_activity: new Date().toISOString().split('T')[0],
    reporter_name: '', weather: '', project_name: '', section_name: '',
    activity_category: '', activity_type: '', activity_subtype: '', side: '',
    start_chainage: '', start_chainage_lat: '', start_chainage_long: '',
    end_chainage: '', end_chainage_lat: '', end_chainage_long: '',
    activity_status: fromId ? 'Planned' : 'Ongoing',
    party_for_activity: '', subcontractor_name_activity: '',
    comment_activity: '',
    not_conforming: 'No', not_conforming_issue: '', not_conforming_correction: '',
    car_used: 'No', team_car: '',
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

  const [customFields, setCustomFields] = useState<{ id: number; label: string; field_key: string; type: string; options: string[]; required: boolean; depends_on_key: string | null; depends_on_value: string | null }[]>([])
  const [customData, setCustomData] = useState<Record<string, string>>({})

  // Component auto-fill from the drainage components reference table
  type ComponentData = {
    measurements: string | null
    nbr_cell: string | null
    length: number | null
    status: string | null
    total_length_to_order: number | null
    consideration_status: string | null
    comment: string | null
    low_point_elevation: string | null
  }
  const [component, setComponent]         = useState<ComponentData | null>(null)
  const [componentLoading, setComponentLoading] = useState(false)

  type DrainageRow = {
    chainage: string; type: string; measurement: string
    cells: string | null; length: string | null; status: string
    total_length: string | null; consideration_status: string | null
    comment: string | null; low_point_elevation: string | null
    lat: number | null; lng: number | null
  }
  const [drainageRows, setDrainageRows]       = useState<DrainageRow[]>([])
  const [drainageLoading, setDrainageLoading] = useState(false)
  const [selectedDrainageRow, setSelectedDrainageRow] = useState<DrainageRow | null>(null)

  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null])
  const [video, setVideo] = useState<File | null>(null)

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStage, setSubmitStage] = useState('')


  const filteredTypes = allTypes.filter(t => categories.find(c => c.name === form.activity_category)?.id === t.category_id)
  const filteredSubtypes = allSubtypes.filter(s => allTypes.find(t => t.name === form.activity_type)?.id === s.activity_type_id)
  const filteredSections = allSections.filter(s => s.project_name === form.project_name)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const isDrainage = form.activity_category === 'Drainage Channels - Utilities'
  const sideToDb: Record<string, string> = { Left: 'LHS', Right: 'RHS', Median: 'Median' }

  // Auto-fill component data when project + section + chainage + activity_type + side are all set
  useEffect(() => {
    const { project_name, section_name, start_chainage, activity_type, side } = form
    if (!project_name || !start_chainage || !activity_type) {
      setComponent(null)
      return
    }
    setComponentLoading(true)
    const params = new URLSearchParams({
      project:  project_name,
      section:  section_name,
      chainage: start_chainage,
      item:     activity_type,
      side:     side,
    })
    fetch(`/api/components/lookup?${params}`)
      .then(r => r.json())
      .then(d => setComponent(d.component ?? null))
      .catch(() => setComponent(null))
      .finally(() => setComponentLoading(false))
  }, [form.project_name, form.section_name, form.start_chainage, form.activity_type, form.side])

  // Fetch drainage chainages when category is Drainage Channels - Utilities
  useEffect(() => {
    if (!isDrainage || !form.project_name || !form.side) {
      setDrainageRows([])
      setSelectedDrainageRow(null)
      return
    }
    setDrainageLoading(true)
    setSelectedDrainageRow(null)
    const dbSide = sideToDb[form.side] ?? form.side
    const params = new URLSearchParams({ project: form.project_name, section: form.section_name, side: dbSide })
    fetch(`/api/drainage-components?${params}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const seen = new Set<string>()
        const rows: DrainageRow[] = []
        for (const d of data) {
          if (!seen.has(d.chainage)) {
            seen.add(d.chainage)
            rows.push({
              chainage: d.chainage, type: d.type, measurement: d.measurement,
              cells: d.cells, length: d.length, status: d.status,
              total_length: d.total_length, consideration_status: d.consideration_status,
              comment: d.comment, low_point_elevation: d.low_point_elevation,
              lat: d.lat ?? null, lng: d.lng ?? null,
            })
          }
        }
        setDrainageRows(rows)
      })
      .catch(() => setDrainageRows([]))
      .finally(() => setDrainageLoading(false))
  }, [isDrainage, form.project_name, form.section_name, form.side])

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
    q('surveycollection_employee', 'select=id,name,role&status=eq.Active&order=name')
      .then(d => { if (Array.isArray(d)) setEmployees(d) })
    q('surveycollection_planningtable', 'select=id,fleet_number,machine_type,machine_belonging&order=fleet_number')
      .then(d => { if (Array.isArray(d)) setEquipmentList(d) })

    // surveycollection_project / section: RLS blocks anon — use service-role API routes instead
    // (these routes are accessible to all authenticated roles, not admin-only)
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) }).catch(() => {})
    fetch('/api/sections').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllSections(d) }).catch(() => {})

    fetch('/api/auth/me').then(r => r.json()).then(d => {
    if (!d.user) { router.replace('/login'); return }
    set('reporter_name', d.user.username || `${d.user.first_name} ${d.user.last_name}`.trim() || d.user.email || '')
  }).catch(() => {})

    fetch('/api/config/customfields').then(r => r.json()).then(d => {
      const active = (d.items ?? []).filter((f: any) => f.is_active)
      setCustomFields(active)
    }).catch(() => {})

    if (fromId) {
      fetch(`/api/planned/${fromId}`).then(r => r.json()).then(d => {
        const p = d.item
        if (!p) return
        setPlanTitle(p.title)
        setPlanData(p)
        setForm(f => ({
          ...f,
          project_name:                p.project_name                || f.project_name,
          section_name:                p.section_name                || f.section_name,
          activity_category:           p.activity_category           || f.activity_category,
          activity_type:               p.activity_type               || f.activity_type,
          activity_subtype:            p.activity_subtype            || f.activity_subtype,
          side:                        p.side                        || f.side,
          weather:                     p.weather                     || f.weather,
          // Planned chainages are NOT pre-filled — worker enters actual values
          // They are captured separately below for display and storage
          party_for_activity:          p.party_for_activity          || f.party_for_activity,
          subcontractor_name_activity: p.subcontractor_name_activity || f.subcontractor_name_activity,
          activity_status:             p.activity_status             || f.activity_status,
          comment_activity:            p.comment_activity            || f.comment_activity,
          not_conforming:              p.not_conforming              || f.not_conforming,
          not_conforming_issue:        p.not_conforming_issue        || f.not_conforming_issue,
          not_conforming_correction:   p.not_conforming_correction   || f.not_conforming_correction,
          car_used:                    p.car_used                    || f.car_used,
          team_car:                    p.team_car                    || f.team_car,
        }))
        if (p.start_chainage || p.end_chainage) {
          setPlannedChainages({ start: p.start_chainage || '', end: p.end_chainage || '' })
        }
        if (p.custom_data?.scheduled_date) {
          setPlannedDate(p.custom_data.scheduled_date)
        }
        if (Array.isArray(d.employees) && d.employees.length > 0) {
          setEmployeeRows(d.employees.map((e: any) => ({
            name:               e.employee_name || (e.employee_missing_name ? '__other__' : ''),
            role:               e.employee_role || '',
            party:              e.party || 'Employee',
            subcontractor_name: e.subcontractor_name || '',
            missing_name:       e.employee_missing_name || '',
          })))
        }
        if (Array.isArray(d.supervisors) && d.supervisors.length > 0) {
          setSupervisorRows(d.supervisors.map((s: any) => ({
            name:               s.supervisor_name || (s.supervisor_missing_name ? '__other__' : ''),
            role:               '',
            party:              s.party || `${process.env.NEXT_PUBLIC_APP_NAME || 'Company'} employees`,
            subcontractor_name: s.subcontractor_name || '',
            missing_name:       s.supervisor_missing_name || '',
          })))
        }
        if (Array.isArray(d.machines) && d.machines.length > 0) {
          setMachineRows(d.machines.map((m: any) => ({
            equipment_id:      null,
            fleet_number:      m.fleet_number || '',
            machine_name:      m.machine_name || '',
            machine_belonging: m.machine_belonging || '',
            driver_name:       m.driver_name || '',
          })))
        }
      }).catch(() => {})
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const usingDrainagePicker = isDrainage && drainageRows.length > 0
    if (!form.start_chainage) return setError(usingDrainagePicker ? 'Please select a chainage.' : 'Please provide a starting chainage.')
    if (!usingDrainagePicker && !form.end_chainage) return setError('Please provide an ending chainage.')
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
        ...(fromId ? { planned_activity_id: fromId } : {}),
        custom_data: {
          ...customData,
          // Planned date and chainages from the plan template (read-only reference)
          ...(plannedDate ? { planned_date: plannedDate } : {}),
          ...(plannedChainages ? {
            planned_start_chainage: plannedChainages.start || undefined,
            planned_end_chainage:   plannedChainages.end   || undefined,
          } : {}),
          // Merge component reference data so it's saved with the report
          ...(component ? {
            _comp_measurements:          component.measurements ?? undefined,
            _comp_nbr_cell:              component.nbr_cell ?? undefined,
            _comp_length:                component.length != null ? String(component.length) : undefined,
            _comp_status:                component.status ?? undefined,
            _comp_total_length_to_order: component.total_length_to_order != null ? String(component.total_length_to_order) : undefined,
            _comp_comment:               component.comment ?? undefined,
          } : {}),
        },
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
        <a href="/reports/start" style={{
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
          Back
        </a>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: C.text, fontFamily: 'var(--font-display)' }}>Activity Report</div>
          <div style={{ fontSize: '0.68rem', color: C.muted, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            {planTitle ? (
              <span>Plan: <span style={{ color: C.orange }}>{planTitle}</span></span>
            ) : (process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd')}
          </div>
        </div>
        </div>
      </header>

      <form id="activity-form" onSubmit={handleSubmit} style={{ flex: 1, padding: '20px 16px 120px', maxWidth: 1100, margin: '0 auto', width: '100%', position: 'relative', zIndex: 2 }}>
        <div className="submit-cards">

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
          {plannedDate && (
            <div style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 4,
            }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Planned (from template — reference only)
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Date Planned</div>
                <div style={{
                  padding: '9px 12px', background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8,
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.88rem', color: C.orange,
                  letterSpacing: '0.04em',
                }}>
                  {new Date(plannedDate + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          )}
          <Row2>
            <div>
              <Label required>{plannedDate ? 'Actual Date' : 'Date'}</Label>
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
              {planData?.project_name ? (
                <LockedField label="Project" value={planData.project_name} required />
              ) : (
                <>
                  <Label required>Project</Label>
                  <Select
                    value={form.project_name}
                    onChange={v => { set('project_name', v); set('section_name', '') }}
                    placeholder="Select project"
                    searchable
                    options={projects.map(p => ({ value: p.name, label: p.name }))}
                  />
                </>
              )}
            </div>
            <div>
              {planData?.section_name ? (
                <LockedField label="Section" value={planData.section_name} />
              ) : (
                <>
                  <Label>Section</Label>
                  <Select
                    value={form.section_name}
                    onChange={v => set('section_name', v)}
                    placeholder="Select section"
                    disabled={!form.project_name}
                    options={filteredSections.map(s => ({ value: s.name, label: s.name }))}
                  />
                </>
              )}
            </div>
          </Row2>
        </Card>

        {/* 2. Activity Type */}
        <Card icon="🏗️" title="Activity Type" delay={120} cardBg={CARD_COLORS[1]}>
          <div>
            <Label>Planning Status</Label>
            <div style={{
              padding: '9px 13px', borderRadius: 9,
              background: fromId ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${fromId ? 'rgba(245,158,11,0.30)' : 'rgba(0,0,0,0.10)'}`,
              fontSize: '0.84rem', fontWeight: 600,
              color: fromId ? '#d97706' : '#6b7280',
              fontFamily: 'var(--font-mono)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {fromId
                  ? <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                  : <><path d="M12 5v14M5 12h14"/></>
                }
              </svg>
              {fromId ? 'Planned' : 'Newly Planned'}
            </div>
          </div>
          <div>
            {planData?.activity_category ? (
              <LockedField label="Category" value={planData.activity_category} required />
            ) : (
              <>
                <Label required>Category</Label>
                <Select
                  value={form.activity_category}
                  onChange={v => { set('activity_category', v); set('activity_type', ''); set('activity_subtype', '') }}
                  placeholder="Select category"
                  searchable
                  options={categories.map(c => ({ value: c.name, label: c.name }))}
                />
              </>
            )}
          </div>
          <Row2>
            <div>
              {planData?.activity_type ? (
                <LockedField label="Type" value={planData.activity_type} />
              ) : (
                <>
                  <Label>Type</Label>
                  <Select
                    value={form.activity_type}
                    onChange={v => { set('activity_type', v); set('activity_subtype', '') }}
                    placeholder="Select type"
                    disabled={!form.activity_category}
                    searchable
                    options={filteredTypes.map(t => ({ value: t.name, label: t.name }))}
                  />
                </>
              )}
            </div>
            <div>
              {planData?.activity_subtype ? (
                <LockedField label="Sub-type" value={planData.activity_subtype} />
              ) : (
                <>
                  <Label>Sub-type</Label>
                  <Select
                    value={form.activity_subtype}
                    onChange={v => set('activity_subtype', v)}
                    placeholder="Sub-type"
                    disabled={!form.activity_type}
                    options={filteredSubtypes.map(s => ({ value: s.name, label: s.name }))}
                  />
                </>
              )}
            </div>
          </Row2>
          <Row2>
            <div>
              {planData?.side ? (
                <LockedField label="Side" value={planData.side} />
              ) : (
                <>
                  <Label>Side</Label>
                  <Select
                    value={form.side}
                    onChange={v => set('side', v)}
                    placeholder="Select"
                    options={['Left','Right','Median'].map(s => ({ value: s, label: s }))}
                  />
                </>
              )}
            </div>
            <div>
              {fromId ? (
                <LockedField label="Status" value="Planned" />
              ) : (
                <>
                  <Label>Status</Label>
                  <Select
                    value={form.activity_status}
                    onChange={v => set('activity_status', v)}
                    placeholder="Status"
                    options={['Ongoing','Completed','Rectified','Canceled','Postponed'].map(s => ({ value: s, label: s }))}
                  />
                </>
              )}
            </div>
          </Row2>

          {/* Custom fields that depend on activity_type or activity_category — appear inline */}
          {customFields
            .filter(f => f.depends_on_key === 'activity_type' || f.depends_on_key === 'activity_category')
            .map(field => {
              const depVal = (form as Record<string, string>)[field.depends_on_key!] ?? ''
              if (depVal !== field.depends_on_value) return null
              return (
                <div key={field.field_key}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.type === 'dropdown' ? (
                    <Select
                      value={customData[field.field_key] ?? ''}
                      onChange={v => setCustomData(d => ({ ...d, [field.field_key]: v }))}
                      placeholder="Select"
                      options={field.options.map(o => ({ value: o, label: o }))}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      style={inp}
                      value={customData[field.field_key] ?? ''}
                      onChange={e => setCustomData(d => ({ ...d, [field.field_key]: e.target.value }))}
                      onBlur={handleAcquired}
                      placeholder={field.label}
                    />
                  )}
                </div>
              )
            })}

          {/* Construction-specific: mixer type + cubic meters */}
          {form.activity_category?.toLowerCase().includes('construction') && (
            <>
              <div>
                <Label>Mixer Type</Label>
                <Select
                  value={customData['mixer_type'] ?? ''}
                  onChange={v => setCustomData(d => ({ ...d, mixer_type: v }))}
                  placeholder="Select mixer type"
                  options={[
                    'Truck Mixer',
                    'Drum Mixer',
                    'Pan Mixer',
                    'Transit Mixer',
                    'Self-Loading Mixer',
                    'Volumetric Mixer',
                    'Other',
                  ].map(o => ({ value: o, label: o }))}
                />
              </div>
              <div>
                <Label>Concrete Volume (m³)</Label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  style={inp}
                  value={customData['concrete_cubic_meters'] ?? ''}
                  onChange={e => setCustomData(d => ({ ...d, concrete_cubic_meters: e.target.value }))}
                  onBlur={handleAcquired}
                  placeholder="e.g. 12.5"
                />
              </div>
            </>
          )}

          {/* Component auto-fill panel — shown when a matching structure is found */}
          {componentLoading && (
            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: 10, fontSize: '0.78rem', color: C.muted, fontFamily: 'var(--font-mono)' }}>
              Looking up component data…
            </div>
          )}
          {!componentLoading && component && (
            <div style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 12, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.orange, fontFamily: 'var(--font-mono)' }}>
                  📋 Component Reference
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.2)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {component.measurements && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Measurements</div>
                    <div style={{ fontSize: '0.88rem', color: C.text, fontWeight: 600 }}>{component.measurements}</div>
                  </div>
                )}
                {component.nbr_cell && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>No. of Cells / Type</div>
                    <div style={{ fontSize: '0.88rem', color: C.text, fontWeight: 600 }}>{component.nbr_cell}</div>
                  </div>
                )}
                {component.length != null && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Length (m)</div>
                    <div style={{ fontSize: '0.88rem', color: C.text, fontWeight: 600 }}>{component.length}</div>
                  </div>
                )}
                {component.total_length_to_order != null && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Total Length to Order</div>
                    <div style={{ fontSize: '0.88rem', color: C.text, fontWeight: 600 }}>{component.total_length_to_order}</div>
                  </div>
                )}
                {component.status && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Survey Status</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: component.status.toLowerCase().includes('complete') && !component.status.toLowerCase().includes('not') ? '#16a34a' : C.orange }}>
                      {component.status}
                    </div>
                  </div>
                )}
                {component.low_point_elevation && (
                  <div>
                    <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Elevation Note</div>
                    <div style={{ fontSize: '0.82rem', color: C.text }}>{component.low_point_elevation}</div>
                  </div>
                )}
              </div>
              {component.comment && (
                <div>
                  <div style={{ fontSize: '0.6rem', color: C.muted, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Site Note</div>
                  <div style={{ fontSize: '0.82rem', color: C.muted, fontStyle: 'italic' }}>{component.comment}</div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 3. Chainage */}
        <Card icon="📍" title="Chainage" delay={180} cardBg={CARD_COLORS[0]}>
          {plannedChainages && (
            <div style={{
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 4,
            }}>
              <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Planned (from template — reference only)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Planned Start</div>
                  <div style={{
                    padding: '9px 12px', background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8,
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    fontSize: '0.88rem', color: C.orange,
                    letterSpacing: '0.04em',
                  }}>
                    {plannedChainages.start || <span style={{ color: C.muted, fontWeight: 400 }}>—</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Planned End</div>
                  <div style={{
                    padding: '9px 12px', background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8,
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    fontSize: '0.88rem', color: C.orange,
                    letterSpacing: '0.04em',
                  }}>
                    {plannedChainages.end || <span style={{ color: C.muted, fontWeight: 400 }}>—</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isDrainage && drainageRows.length > 0 ? (
            /* Drainage Channels: single chainage picker from component reference DB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <Label required>Chainage</Label>
                {drainageLoading ? (
                  <div style={{ padding: '12px 14px', background: C.inputBg, borderRadius: 11, color: C.muted, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    Loading chainages…
                  </div>
                ) : (
                  <Select
                    value={form.start_chainage}
                    onChange={v => {
                      const row = drainageRows.find(r => r.chainage === v) ?? null
                      set('start_chainage', v)
                      set('end_chainage', v)
                      if (row && !planData?.activity_type) set('activity_type', row.type)
                      setSelectedDrainageRow(row)
                      setStartCoords({ lat: row?.lat ?? null, lng: row?.lng ?? null })
                      setEndCoords({ lat: row?.lat ?? null, lng: row?.lng ?? null })
                    }}
                    placeholder="Select chainage"
                    searchable
                    options={drainageRows.map(r => ({ value: r.chainage, label: `${r.chainage}  —  ${r.type}` }))}
                  />
                )}
              </div>
              {selectedDrainageRow && (() => {
                const dr = selectedDrainageRow
                const fields: [string, string | null][] = [
                  ['Type',                  dr.type],
                  ['Measurement',           dr.measurement],
                  ['No. of Cells',          dr.cells],
                  ['Length (m)',            dr.length],
                  ['Total Length to Order', dr.total_length],
                  ['Status',               dr.status],
                  ['Consideration Status', dr.consideration_status],
                  ['Comment',              dr.comment],
                  ['Low Point Elevation',  dr.low_point_elevation],
                ].filter(([, v]) => v) as [string, string][]
                return (
                  <div style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.22)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px',
                  }}>
                    {fields.map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, fontFamily: 'var(--font-mono)', marginBottom: 1 }}>{label}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text, fontFamily: 'var(--font-mono)' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          ) : (
            <>
              <ChainageInput
                label={plannedChainages ? 'Actual Start Chainage' : 'Start Chainage'} required
                project={form.project_name} section={form.section_name}
                value={form.start_chainage}
                onChange={v => set('start_chainage', v)}
                onCoords={(lat, lng) => setStartCoords({ lat, lng })}
              />
              <div style={{ marginTop: 12 }} />
              <ChainageInput
                label={plannedChainages ? 'Actual End Chainage' : 'End Chainage'} required
                project={form.project_name} section={form.section_name}
                value={form.end_chainage}
                onChange={v => set('end_chainage', v)}
                onCoords={(lat, lng) => setEndCoords({ lat, lng })}
              />
            </>
          )}

          <ChainageMap
            startLat={startCoords.lat} startLng={startCoords.lng}
            endLat={endCoords.lat}     endLng={endCoords.lng}
          />
        </Card>

        {/* Custom fields — only those NOT already shown inside the Activity Type card */}
        {customFields.some(f => f.depends_on_key !== 'activity_type' && f.depends_on_key !== 'activity_category') && (
          <Card className="card-full" icon="🧩" title="Additional Details" delay={220} cardBg={CARD_COLORS[1]}>
            {customFields
              .filter(f => f.depends_on_key !== 'activity_type' && f.depends_on_key !== 'activity_category')
              .map(field => {
                const depVal = field.depends_on_key
                  ? (customData[field.depends_on_key] ?? (form as Record<string, string>)[field.depends_on_key] ?? '')
                  : ''
                const visible = !field.depends_on_key || depVal === field.depends_on_value
                if (!visible) return null
                return (
                  <div key={field.field_key}>
                    <Label required={field.required}>{field.label}</Label>
                    {field.type === 'dropdown' ? (
                      <Select
                        value={customData[field.field_key] ?? ''}
                        onChange={v => setCustomData(d => ({ ...d, [field.field_key]: v }))}
                        placeholder="Select"
                        options={field.options.map(o => ({ value: o, label: o }))}
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        style={inp}
                        value={customData[field.field_key] ?? ''}
                        onChange={e => setCustomData(d => ({ ...d, [field.field_key]: e.target.value }))}
                        onBlur={handleAcquired}
                        placeholder={field.label}
                      />
                    )}
                  </div>
                )
              })}
          </Card>
        )}

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
          partyOptions={[`${process.env.NEXT_PUBLIC_APP_NAME || 'Company'} employees`, 'Sub-contractor']}
          nameList={[
            ...employees.filter(e => e.role === 'Supervisor').map(e => ({ id: e.id, name: e.name, party: `${process.env.NEXT_PUBLIC_APP_NAME || 'Company'} employees` })),
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
                          .filter(e => {
                            if (e.machine_belonging !== row.machine_belonging) return false
                            // exclude fleet numbers already picked in other rows
                            const takenFleets = new Set(machineRows.filter((_, j) => j !== i).map(r => r.fleet_number).filter(Boolean))
                            return !takenFleets.has(e.fleet_number)
                          })
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
          {(() => {
            const lastMachine = machineRows[machineRows.length - 1]
            const lastMachineFilled = lastMachine && !!lastMachine.fleet_number
            return (
              <button
                type="button"
                disabled={!lastMachineFilled}
                onClick={() => setMachineRows(r => [...r, emptyMachine()])}
                title={!lastMachineFilled ? 'Select a machine in the current row before adding another' : undefined}
                style={{
                  width: '100%', padding: '11px',
                  background: lastMachineFilled ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,0.04)',
                  border: `1px dashed ${lastMachineFilled ? 'rgba(59,130,246,0.3)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 12,
                  color: lastMachineFilled ? '#60a5fa' : C.muted,
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: lastMachineFilled ? 'pointer' : 'not-allowed',
                  opacity: lastMachineFilled ? 1 : 0.5,
                }}>
                + Add Machine
              </button>
            )
          })()}
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
