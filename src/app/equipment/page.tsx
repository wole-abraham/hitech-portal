'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageShell, SearchBar, Badge, EmptyState, T, inp, FieldLabel, SaveBtn, SkeletonList } from '@/components/PageShell'
import Select from '@/components/Select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

interface Machine {
  id: number; fleet_number: string; machine_type: string; machine_belonging: string
  deployment_status: string; health_status: string
  project_name: string; section_name: string; assigned_to: string
}

const MACHINE_TYPES = ['Excavator','Bulldozer','Grader','Compactor','Dump Truck','Water Bowser','Concrete Mixer','Crane','Generator','Loader','Other']
const DEPLOY_STATUSES = ['Active','Idle','Under Repair','Decommissioned']
const HEALTH_STATUSES = ['Good','Fair','Poor','Critical']
const DEPLOY_COLOR: Record<string, string> = { Active: '#34d399', Idle: '#f5c800', 'Under Repair': '#60a5fa', Decommissioned: '#f87171' }
const HEALTH_COLOR: Record<string, string> = { Good: '#34d399', Fair: '#f5c800', Poor: '#fb923c', Critical: '#f87171' }

const emptyForm = { fleet_number: '', machine_type: '', machine_belonging: '', deployment_status: 'Active', health_status: 'Good', project_name: '', section_name: '', assigned_to: '' }

function ProjectSectionPicker({ form, set }: { form: Record<string, string>; set: (k: string, v: string) => void }) {
  const [projects, setProjects] = useState<{ name: string }[]>([])
  const [sections, setSections] = useState<{ name: string; project_name: string }[]>([])
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/sections').then(r => r.json()).then(d => setSections(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  const projectOpts = projects.map(p => ({ value: p.name, label: p.name }))
  const sectionOpts = sections.map(s => ({ value: s.name, label: `${s.project_name} — ${s.name}` }))
  const employeeOpts = [
    { value: '', label: 'Unassigned' },
    ...employees.map(e => ({ value: e.name, label: e.name })),
  ]

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Project</FieldLabel>
          <Select value={form.project_name} onChange={v => set('project_name', v)}
            placeholder="Select project" options={projectOpts} />
        </div>
        <div>
          <FieldLabel>Section</FieldLabel>
          <Select value={form.section_name} onChange={v => set('section_name', v)}
            placeholder="Select section" options={sectionOpts} />
        </div>
      </div>
      <div>
        <FieldLabel>Assigned To</FieldLabel>
        <Select value={form.assigned_to} onChange={v => set('assigned_to', v)}
          placeholder="Select employee" options={employeeOpts} />
      </div>
    </>
  )
}

interface HistoryEntry {
  id: number; date_time: string; fleet_number: string; machine_type: string
  machine_belonging: string; deployment_state: string; machine_status: string
  breakdown_issue: string; assigned_to: string; reporter_name: string
}

const ACTION_COLOR: Record<string, string> = {
  'Received on site': '#34d399',
  'Sent back to head office': '#fb923c',
  'Received at head office': '#60a5fa',
}
const ACTION_ICON: Record<string, string> = {
  'Received on site': '✅',
  'Sent back to head office': '↩',
  'Received at head office': '🏢',
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EquipmentPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Machine | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyMachine, setHistoryMachine] = useState<Machine | null>(null)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  async function openHistory(m: Machine, e: React.MouseEvent) {
    e.stopPropagation()
    setHistoryMachine(m)
    setHistoryOpen(true)
    setHistoryEntries([])
    setHistoryLoading(true)
    const res = await fetch(`/api/history?fleet=${encodeURIComponent(m.fleet_number)}`)
    const data = await res.json()
    setHistoryEntries(Array.isArray(data.entries) ? data.entries : [])
    setHistoryLoading(false)
  }

  async function load() {
    setLoading(true)
    const res = await fetch('/api/equipment')
    const data = await res.json()
    setMachines(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(m: Machine) {
    setEditing(m)
    setForm({
      fleet_number: m.fleet_number || '',
      machine_type: m.machine_type || '',
      machine_belonging: m.machine_belonging || '',
      deployment_status: m.deployment_status || 'Active',
      health_status: m.health_status || 'Good',
      project_name: m.project_name || '',
      section_name: m.section_name || '',
      assigned_to: m.assigned_to || '',
    })
    setSheetOpen(true)
  }

  async function handleReceive() {
    if (!editing) return
    setReceiving(true)
    const res = await fetch(`/api/equipment/${editing.id}/receive`, { method: 'POST' })
    setReceiving(false)
    if (res.ok) {
      setSheetOpen(false)
      load()
      toast.success(`${editing.fleet_number} received`, { description: 'Machine returned to base.' })
    } else {
      toast.error('Receive failed', { description: 'Please try again.' })
    }
  }

  async function handleDelete() {
    if (!editing) return
    setDeleting(true)
    const res = await fetch(`/api/equipment/${editing.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) {
      toast.error('Delete failed', { description: data.error || 'Please try again.' })
      return
    }
    setSheetOpen(false)
    load()
    toast.success(`${editing.fleet_number || editing.machine_type} removed`, { description: 'Equipment deleted.' })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = editing
      ? await fetch(`/api/equipment/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch('/api/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) {
      setSheetOpen(false)
      load()
      toast.success(editing ? `${form.fleet_number} updated` : `${form.fleet_number} added`, { description: editing ? 'Equipment record saved.' : 'New machine added to fleet.' })
    } else {
      toast.error('Save failed', { description: 'Please try again.' })
    }
  }

  const filtered = machines.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = m.fleet_number?.toLowerCase().includes(q) || m.machine_type?.toLowerCase().includes(q) || m.project_name?.toLowerCase().includes(q)
    const matchStatus = filterStatus ? m.deployment_status === filterStatus : true
    return matchSearch && matchStatus
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const machineIcon = (type: string) => {
    const t = type?.toLowerCase() || ''
    if (t.includes('excavat')) return '🦾'
    if (t.includes('truck') || t.includes('dump')) return '🚛'
    if (t.includes('crane')) return '🏗️'
    if (t.includes('generator')) return '⚡'
    if (t.includes('grader') || t.includes('bulldoz') || t.includes('compac')) return '🚜'
    return '⚙️'
  }

  return (
    <PageShell title="Equipment" subtitle={`${machines.length} total`}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by fleet no., type or project…" />
        </div>
        <button onClick={openAdd} style={{
          flexShrink: 0, padding: '12px 18px', background: T.amber, color: '#fff',
          border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.88rem',
          cursor: 'pointer', boxShadow: `0 4px 14px ${T.amber}35`, marginBottom: 16,
        }}>+ Add</button>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['', ...DEPLOY_STATUSES] as string[]).map(s => {
          const count = s ? machines.filter(m => m.deployment_status === s).length : machines.length
          const active = filterStatus === s
          return (
            <button key={s} className="htchip" onClick={() => setFilterStatus(s)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 12px', borderRadius: 20,
              background: active ? T.amber : T.card,
              color: active ? '#fff' : T.muted,
              border: `1px solid ${active ? T.amber : T.border}`,
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.18s',
            }}>
              <span>{s || 'All'}</span>
              <span style={{
                background: active ? 'rgba(255,255,255,0.22)' : 'rgba(242,237,227,0.08)',
                color: active ? '#fff' : T.sub,
                borderRadius: 10, padding: '1px 7px',
                fontSize: '0.72rem', fontWeight: 800, lineHeight: '1.5',
                minWidth: 20, textAlign: 'center',
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList n={5} lines={3} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🚜" message="No equipment found" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((m, i) => (
            <div key={m.id} className="htcard" onClick={() => openEdit(m)} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '16px',
              cursor: 'pointer',
              opacity: 0, animation: `tileIn 0.35s ease ${i * 0.04}s forwards`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>

              {/* ── Header row ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: T.input, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {machineIcon(m.machine_type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: T.text, letterSpacing: '0.01em' }}>
                    {m.fleet_number || '—'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 1 }}>
                    {m.machine_type || '—'}
                    {m.machine_belonging ? <span style={{ color: T.sub }}> · {m.machine_belonging}</span> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <Badge label={m.deployment_status || 'Active'} color={DEPLOY_COLOR[m.deployment_status] || T.muted} />
                  {m.health_status && <Badge label={m.health_status} color={HEALTH_COLOR[m.health_status] || T.muted} />}
                </div>
              </div>

              {/* ── Info grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px', marginBottom: 12 }}>
                {[
                  { label: 'Project',  value: m.project_name  || '—' },
                  { label: 'Section',  value: m.section_name  || '—' },
                  { label: 'Operator', value: m.assigned_to   || 'Unassigned' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.sub, marginBottom: 1 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: value === '—' || value === 'Unassigned' ? T.sub : T.text, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* ── Footer ── */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: T.sub }}>Tap to edit</span>
                <button
                  onClick={(e) => openHistory(m, e)}
                  style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: 'rgba(242,237,227,0.05)', border: `1px solid ${T.border}`,
                    color: T.muted, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                    letterSpacing: '0.04em', transition: 'all 0.18s',
                    fontFamily: 'var(--font-display)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${T.amber}15`; e.currentTarget.style.borderColor = `${T.amber}60`; e.currentTarget.style.color = T.amber }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(242,237,227,0.05)'; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted }}
                >
                  History →
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          style={{ background: '#110f0c', borderLeft: `1px solid ${T.border}`, padding: '24px 20px', maxWidth: 520, width: '100%', overflowY: 'auto' }}
        >
          <SheetHeader style={{ marginBottom: 20 }}>
            <SheetTitle style={{ color: T.text, fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              {editing ? 'Edit Equipment' : 'Add Equipment'}
            </SheetTitle>
          </SheetHeader>

          {editing?.deployment_status === 'in_transit_back' && (
            <div style={{
              marginBottom: 16, padding: '14px 16px',
              background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.35)',
              borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>↩</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fb923c', marginBottom: 3 }}>
                  Machine Returning to Base
                </div>
                <div style={{ fontSize: '0.78rem', color: T.muted }}>
                  Confirm you have received this machine back at head office.
                </div>
              </div>
              <button
                type="button"
                disabled={receiving}
                onClick={handleReceive}
                style={{
                  flexShrink: 0, padding: '10px 16px',
                  background: receiving ? 'rgba(251,146,60,0.1)' : '#fb923c',
                  color: receiving ? T.muted : '#1a0a0a',
                  border: 'none', borderRadius: 9,
                  fontWeight: 800, fontSize: '0.78rem',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  cursor: receiving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {receiving ? 'Saving…' : '✓ Received'}
              </button>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel required>Fleet No.</FieldLabel>
                <input style={inp} value={form.fleet_number} onChange={e => set('fleet_number', e.target.value)} required placeholder="e.g. HT-001"
                  onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <FieldLabel required>Machine Type</FieldLabel>
                <Select value={form.machine_type} onChange={v => set('machine_type', v)} placeholder="Select type"
                  options={MACHINE_TYPES.map(r => ({ value: r, label: r }))} />
              </div>
            </div>

            <div>
              <FieldLabel required>Belonging / Owner</FieldLabel>
              <Select value={form.machine_belonging} onChange={v => set('machine_belonging', v)} placeholder="Select owner"
                options={[
                  { value: 'Hitech', label: 'Hitech' },
                  { value: 'Renting', label: 'Renting' },
                  { value: 'Subcontractor', label: 'Subcontractor' },
                ]} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel>Deployment Status</FieldLabel>
                <Select value={form.deployment_status} onChange={v => set('deployment_status', v)}
                  options={DEPLOY_STATUSES.map(s => ({ value: s, label: s }))} />
              </div>
              <div>
                <FieldLabel>Health Status</FieldLabel>
                <Select value={form.health_status} onChange={v => set('health_status', v)}
                  options={HEALTH_STATUSES.map(s => ({ value: s, label: s }))} />
              </div>
            </div>

            <ProjectSectionPicker form={form} set={set} />

            <SaveBtn loading={saving} label={editing ? 'Save Changes' : 'Add Equipment'} />

            {editing && (
              <>
                <Separator style={{ background: 'rgba(242,237,227,0.08)', margin: '4px 0' }} />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<button type="button" />}
                    style={{
                      width: '100%', padding: '12px', background: 'transparent', color: T.error,
                      border: `1px solid rgba(248,113,113,0.20)`, borderRadius: 11,
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      letterSpacing: '0.04em', fontFamily: 'var(--font-display)', transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.40)' }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.20)' }}
                  >
                    🗑 Delete Machine
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ background: '#181410', border: `1px solid rgba(248,113,113,0.25)`, borderRadius: 16, color: T.text }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: T.text, fontFamily: 'var(--font-display)' }}>
                        Delete {editing?.fleet_number || editing?.machine_type}?
                      </AlertDialogTitle>
                      <AlertDialogDescription style={{ color: T.muted }}>
                        This will permanently remove the machine and all its status history. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ background: 'rgba(242,237,227,0.05)', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 9 }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleting}
                        onClick={handleDelete}
                        style={{ background: '#f87171', color: '#1a0a0a', fontWeight: 800, borderRadius: 9, border: 'none' }}
                      >
                        {deleting ? 'Deleting…' : 'Yes, Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </form>
        </SheetContent>
      </Sheet>
      {/* Machine History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="right"
          style={{ background: '#110f0c', borderLeft: `1px solid ${T.border}`, padding: '24px 20px', maxWidth: 520, width: '100%', overflowY: 'auto' }}
        >
          <SheetHeader style={{ marginBottom: 20 }}>
            <SheetTitle style={{ color: T.text, fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              History — {historyMachine?.fleet_number || historyMachine?.machine_type || ''}
            </SheetTitle>
            {historyMachine && (
              <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: 2 }}>
                {historyMachine.machine_type}{historyMachine.project_name ? ` · ${historyMachine.project_name}` : ''}
              </div>
            )}
          </SheetHeader>

          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(242,237,227,0.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ width: '60%', height: 10, background: 'rgba(242,237,227,0.07)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: '40%', height: 9, background: 'rgba(242,237,227,0.05)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : historyEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.muted, fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>📋</div>
              No history found for this machine
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 17, top: 0, bottom: 0, width: 2,
                background: `linear-gradient(180deg, ${T.amber}50 0%, ${T.border} 100%)`,
                borderRadius: 2,
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {historyEntries.map((e, i) => {
                  const color = ACTION_COLOR[e.deployment_state] || T.muted
                  const icon  = ACTION_ICON[e.deployment_state]  || '•'
                  return (
                    <div key={e.id} style={{
                      display: 'flex', gap: 14, paddingBottom: 14,
                      opacity: 0, animation: `tileIn 0.3s ease ${Math.min(i, 12) * 0.04}s forwards`,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: `${color}18`, border: `2px solid ${color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', position: 'relative', zIndex: 1,
                      }}>{icon}</div>
                      <div style={{
                        flex: 1, background: T.card, border: `1px solid ${T.border}`,
                        borderRadius: 12, padding: '10px 13px', marginTop: 2,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.07em', fontFamily: 'var(--font-mono)',
                            background: `${color}18`, color, padding: '3px 7px', borderRadius: 4,
                          }}>{e.deployment_state || '—'}</span>
                          <span style={{ fontSize: '0.7rem', color: T.sub, fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
                            {fmtDate(e.date_time)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: '0.74rem', color: T.muted, flexWrap: 'wrap' }}>
                          {e.assigned_to && <span>👷 <strong style={{ color: T.text }}>{e.assigned_to}</strong></span>}
                          {e.reporter_name && <span>By <strong style={{ color: T.text }}>{e.reporter_name}</strong></span>}
                        </div>
                        {(e.machine_status || e.breakdown_issue) && (
                          <div style={{ marginTop: 5, display: 'flex', gap: 10, fontSize: '0.71rem', flexWrap: 'wrap' }}>
                            {e.machine_status && <span style={{ color: T.sub }}>Health: <span style={{ color: T.text }}>{e.machine_status}</span></span>}
                            {e.breakdown_issue && <span style={{ color: '#fb923c' }}>⚠ {e.breakdown_issue}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </PageShell>
  )
}
