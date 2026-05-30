'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PageShell, SearchBar, Badge, EmptyState, T, inp, FieldLabel, SaveBtn, SkeletonList } from '@/components/PageShell'
import Select from '@/components/Select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

interface Employee {
  id: number; name: string; role: string; phone_number: string
  project_name: string; section_name: string; status: string; email: string; notes: string
  user_id: number | null; profile_picture: string | null; is_admin: boolean
  passport_photo: string | null; passport_document: string | null; fingerprint_id: string | null
}

interface Project { id: number; name: string }
interface Section { id: number; name: string; project_name?: string }

const ROLES = ['Engineer','Supervisor','Operator','Technician','Labourer','Driver','Surveyor','Site Manager','Other']
const STATUSES = ['Active','Inactive','On Leave']
const STATUS_COLOR: Record<string, string> = { Active: '#34d399', Inactive: '#f87171', 'On Leave': '#f5c800' }

const BLANK = { name: '', role: '', phone_number: '', project_name: '', section_name: '', status: 'Active', email: '', notes: '' }

/* ── Fingerprint scanner component ──────────────────────────── */
type FpState = 'idle' | 'scanning' | 'done'

function FingerprintScanner({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [state, setState] = useState<FpState>(value ? 'done' : 'idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setState(value ? 'done' : 'idle')
  }, [value])

  function startScan() {
    setState('scanning')
    timerRef.current = setTimeout(() => {
      const bytes = new Uint8Array(4)
      crypto.getRandomValues(bytes)
      const id = 'FP-' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('')
      onChange(id)
      setState('done')
    }, 2200)
  }

  function rescan() {
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange('')
    setState('idle')
  }

  const scanning = state === 'scanning'
  const done     = state === 'done'

  return (
    <div style={{
      background: 'rgba(242,237,227,0.04)', border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      {/* Fingerprint display area */}
      <div style={{
        position: 'relative', width: 90, height: 90,
        borderRadius: '50%',
        background: done
          ? 'rgba(52,211,153,0.08)'
          : scanning
          ? 'rgba(245,158,11,0.08)'
          : 'rgba(242,237,227,0.05)',
        border: `2px solid ${done ? '#34d399' : scanning ? T.amber : 'rgba(242,237,227,0.14)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s',
        animation: scanning ? 'fpPulse 1s ease-in-out infinite' : 'none',
      }}>
        <span style={{ fontSize: '2.6rem', lineHeight: 1, zIndex: 2 }}>
          {done ? '✅' : '🫆'}
        </span>

        {/* Scanning line */}
        {scanning && (
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${T.amber}, transparent)`,
            animation: 'fpScan 1.1s linear infinite',
            zIndex: 3,
          }} />
        )}
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center' }}>
        {done && value && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700,
            color: '#34d399', letterSpacing: '0.10em', marginBottom: 4,
          }}>
            {value}
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: done ? '#34d399' : scanning ? T.amber : T.sub }}>
          {done ? 'Fingerprint registered' : scanning ? 'Scanning…' : 'No fingerprint registered'}
        </div>
      </div>

      {/* Button */}
      {!scanning && (
        <button
          type="button"
          onClick={done ? rescan : startScan}
          style={{
            padding: '9px 22px', borderRadius: 10,
            background: done ? 'transparent' : T.amber,
            color: done ? T.muted : '#1a1410',
            border: done ? `1px solid ${T.border}` : 'none',
            fontWeight: 700, fontSize: '0.78rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.18s',
          }}
        >
          {done ? '↺ Re-scan' : '⬡ Scan Fingerprint'}
        </button>
      )}
    </div>
  )
}

/* ── File attach row ─────────────────────────────────────────── */
function FileAttach({
  label, accept, hint, icon,
  file, existingUrl,
  onChange,
}: {
  label: string; accept: string; hint: string; icon: string
  file: File | null; existingUrl: string | null
  onChange: (f: File | null) => void
}) {
  const hasFile = !!file
  const hasExisting = !!existingUrl && !hasFile

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: T.input, border: `1px solid ${hasFile ? T.amber : T.border}`,
        borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
        transition: 'border-color 0.2s',
      }}>
        <input type="file" accept={accept} style={{ display: 'none' }}
          onChange={e => onChange(e.target.files?.[0] || null)} />

        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: hasFile ? `${T.amber}18` : 'rgba(242,237,227,0.05)',
          border: `1px solid ${hasFile ? `${T.amber}40` : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem',
        }}>
          {hasExisting ? '✅' : icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: hasFile ? T.amber : hasExisting ? '#34d399' : T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasFile ? file.name : hasExisting ? 'Uploaded ✓' : `Tap to attach ${label.toLowerCase()}`}
          </div>
          <div style={{ fontSize: '0.68rem', color: T.sub, marginTop: 1 }}>{hint}</div>
        </div>

        {hasExisting && (
          <a
            href={existingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.7rem', color: T.amber, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
          >
            View →
          </a>
        )}
      </label>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────── */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allSections, setAllSections] = useState<Section[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(BLANK)

  // file states
  const [photoFile, setPhotoFile]               = useState<File | null>(null)
  const [photoPreview, setPhotoPreview]         = useState<string | null>(null)
  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null)
  const [passportDocFile, setPassportDocFile]   = useState<File | null>(null)
  const [fingerprintId, setFingerprintId]       = useState<string>('')

  const filteredSections = allSections.filter(s => s.project_name === form.project_name)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user?.role === 'admin') setIsAdmin(true) })
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) })
    fetch('/api/sections').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllSections(d) })
  }, [])

  function openAdd() {
    setEditing(null); setForm(BLANK)
    setPhotoFile(null); setPhotoPreview(null)
    setPassportPhotoFile(null); setPassportDocFile(null)
    setFingerprintId('')
    setSheetOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({ name: emp.name, role: emp.role, phone_number: emp.phone_number || '',
      project_name: emp.project_name || '', section_name: emp.section_name || '',
      status: emp.status || 'Active', email: emp.email || '', notes: emp.notes || '' })
    setPhotoFile(null); setPhotoPreview(emp.profile_picture || null)
    setPassportPhotoFile(null); setPassportDocFile(null)
    setFingerprintId(emp.fingerprint_id || '')
    setSheetOpen(true)
  }

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', folder)
    const res = await fetch('/api/employees/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { toast.error('Upload failed', { description: data.error }); return null }
    return data.url as string
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let profile_picture: string | null = editing?.profile_picture ?? null
    let passport_photo: string | null  = editing?.passport_photo  ?? null
    let passport_document: string | null = editing?.passport_document ?? null

    if (photoFile) {
      const fd = new FormData(); fd.append('file', photoFile)
      const r = await fetch('/api/employees/upload-photo', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) { setSaving(false); toast.error('Photo upload failed', { description: d.error }); return }
      profile_picture = d.url
    }
    if (passportPhotoFile) {
      const url = await uploadFile(passportPhotoFile, 'employee-passport-photos')
      if (!url) { setSaving(false); return }
      passport_photo = url
    }
    if (passportDocFile) {
      const url = await uploadFile(passportDocFile, 'employee-passport-docs')
      if (!url) { setSaving(false); return }
      passport_document = url
    }

    const payload: Record<string, unknown> = {
      ...form, profile_picture, passport_photo, passport_document,
      fingerprint_id: fingerprintId || null,
    }

    const res = editing
      ? await fetch(`/api/employees/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    setSaving(false)
    if (res.ok) {
      setSheetOpen(false); load()
      toast.success(editing ? `${form.name} updated` : `${form.name} added`,
        { description: editing ? 'Employee record saved.' : 'New employee added to roster.' })
    } else {
      const errData = await res.json().catch(() => ({}))
      toast.error('Save failed', { description: errData.error || `Status ${res.status}` })
    }
  }

  async function handleDelete() {
    if (!editing) return
    setDeleting(true)
    const res = await fetch(`/api/employees/${editing.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) { toast.error('Delete failed', { description: data.error || 'Please try again.' }); return }
    setSheetOpen(false); load()
    toast.success(`${editing.name} removed`, { description: 'Employee deleted from roster.' })
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.name?.toLowerCase().includes(search.toLowerCase()) || e.role?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus ? e.status === filterStatus : true
    return matchSearch && matchStatus
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    if (file) setPhotoPreview(URL.createObjectURL(file))
    else setPhotoPreview(editing?.profile_picture || null)
  }

  return (
    <PageShell title="Employees" subtitle={`${employees.length} total`}>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or role…" />
        </div>
        <button onClick={openAdd} style={{
          flexShrink: 0, padding: '12px 18px', background: T.amber, color: '#fff',
          border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.88rem',
          cursor: 'pointer', boxShadow: `0 4px 14px ${T.amber}35`, marginBottom: 16,
        }}>+ Add</button>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['', 'Active', 'Inactive', 'On Leave'].map(s => (
          <button key={s} className="htchip" onClick={() => setFilterStatus(s)} style={{
            padding: '6px 14px', borderRadius: 20,
            background: filterStatus === s ? T.amber : T.card,
            color: filterStatus === s ? '#fff' : T.muted,
            border: `1px solid ${filterStatus === s ? T.amber : T.border}`,
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
          }}>{s || 'All'}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList n={6} lines={2} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="👷" message="No employees found" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((emp, i) => (
            <div key={emp.id} className="htcard" onClick={() => openEdit(emp)} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '15px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer',
              opacity: 0, animation: `tileIn 0.35s ease ${i * 0.04}s forwards`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: T.input, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, overflow: 'hidden' }}>
                {emp.profile_picture
                  ? <img src={emp.profile_picture} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '👷'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>{emp.name}</span>
                  <Badge label={emp.status || 'Active'} color={STATUS_COLOR[emp.status] || T.muted} />
                  {emp.is_admin && (
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: T.amber, background: `${T.amber}18`, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>admin</span>
                  )}
                  {emp.user_id != null && !emp.is_admin && (
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 4 }}>linked</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: T.muted }}>
                  {emp.role}{emp.project_name ? ` · ${emp.project_name}` : ''}
                </div>
                {emp.phone_number && <div style={{ fontSize: '0.78rem', color: T.sub, marginTop: 2 }}>{emp.phone_number}</div>}
                {/* Document / fingerprint indicators */}
                {(emp.passport_document || emp.passport_photo || emp.fingerprint_id) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                    {emp.passport_photo    && <span style={{ fontSize: '0.65rem', color: '#60a5fa', background: 'rgba(96,165,250,0.10)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>📷 Passport photo</span>}
                    {emp.passport_document && <span style={{ fontSize: '0.65rem', color: '#a78bfa', background: 'rgba(167,139,250,0.10)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>📄 Document</span>}
                    {emp.fingerprint_id    && <span style={{ fontSize: '0.65rem', color: '#34d399', background: 'rgba(52,211,153,0.10)', padding: '2px 7px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>🫆 {emp.fingerprint_id}</span>}
                  </div>
                )}
              </div>
              <span style={{ color: T.sub, fontSize: '1.1rem' }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          style={{ background: '#110f0c', borderLeft: `1px solid ${T.border}`, padding: '24px 20px', maxWidth: 500, width: '100%', overflowY: 'auto' }}
        >
          <SheetHeader style={{ marginBottom: 20 }}>
            <SheetTitle style={{ color: '#ede8de', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              {editing ? 'Edit Employee' : 'Add Employee'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Profile photo ── */}
            <div>
              <FieldLabel>Profile Photo</FieldLabel>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: T.input, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
                <div style={{
                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👷'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: photoFile ? T.amber : T.muted }}>
                    {photoFile ? photoFile.name : 'Tap to upload profile photo'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.sub, marginTop: 2 }}>JPG, PNG — optional</div>
                </div>
              </label>
            </div>

            {/* ── Core fields ── */}
            <div>
              <FieldLabel required>Full Name</FieldLabel>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} required
                onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div>
              <FieldLabel required>Role</FieldLabel>
              <Select value={form.role} onChange={v => set('role', v)} placeholder="Select role"
                options={ROLES.map(r => ({ value: r, label: r }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input style={inp} value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="+234…"
                  onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <Select value={form.status} onChange={v => set('status', v)}
                  options={STATUSES.map(s => ({ value: s, label: s }))} />
              </div>
            </div>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com"
                onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <FieldLabel>Project</FieldLabel>
                <Select value={form.project_name} onChange={v => { set('project_name', v); set('section_name', '') }}
                  placeholder="Select project" searchable options={projects.map(p => ({ value: p.name, label: p.name }))} />
              </div>
              <div>
                <FieldLabel>Section</FieldLabel>
                <Select value={form.section_name} onChange={v => set('section_name', v)}
                  placeholder="Select section" disabled={!form.project_name}
                  options={filteredSections.map(s => ({ value: s.name, label: s.name }))} />
              </div>
            </div>
            <div>
              <FieldLabel>Notes</FieldLabel>
              <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
            </div>

            {/* ── Documents section ── */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.sub, fontFamily: 'var(--font-mono)' }}>
                Documents
              </div>

              <FileAttach
                label="Passport Photo"
                accept="image/*"
                hint="JPG, PNG — passport / ID photo"
                icon="📷"
                file={passportPhotoFile}
                existingUrl={editing?.passport_photo || null}
                onChange={setPassportPhotoFile}
              />

              <FileAttach
                label="Passport / ID Document"
                accept="image/*,application/pdf"
                hint="PDF, JPG, PNG — scanned document"
                icon="📄"
                file={passportDocFile}
                existingUrl={editing?.passport_document || null}
                onChange={setPassportDocFile}
              />
            </div>

            {/* ── Biometrics section ── */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.sub, fontFamily: 'var(--font-mono)' }}>
                Biometrics
              </div>
              <FingerprintScanner value={fingerprintId} onChange={setFingerprintId} />
            </div>

            <SaveBtn loading={saving} label={editing ? 'Save Changes' : 'Add Employee'} />

            {isAdmin && editing && (
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
                    🗑 Delete Employee
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ background: '#181410', border: `1px solid rgba(248,113,113,0.25)`, borderRadius: 16, color: T.text }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{ color: T.text, fontFamily: 'var(--font-display)' }}>
                        Delete {editing?.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription style={{ color: T.muted }}>
                        This will permanently remove them from the roster. This action cannot be undone.
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
    </PageShell>
  )
}
