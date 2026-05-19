'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageShell, SearchBar, Badge, EmptyState, T, inp, FieldLabel, SaveBtn, SkeletonList } from '@/components/PageShell'
import Select from '@/components/Select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

interface Employee {
  id: number; name: string; role: string; phone_number: string
  project_name: string; section_name: string; status: string; email: string; notes: string
  user_id: number | null; profile_picture: string | null
}

interface Project { id: number; name: string }
interface Section { id: number; name: string; project_name?: string }

const ROLES = ['Engineer','Supervisor','Operator','Technician','Labourer','Driver','Surveyor','Site Manager','Other']
const STATUSES = ['Active','Inactive','On Leave']
const STATUS_COLOR: Record<string, string> = { Active: '#34d399', Inactive: '#f87171', 'On Leave': '#f5c800' }

const BLANK = { name: '', role: '', phone_number: '', project_name: '', section_name: '', status: 'Active', email: '', notes: '' }

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
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

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
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.role === 'admin') setIsAdmin(true)
    })
    fetch('/api/projects').then(r => r.json()).then(d => { if (Array.isArray(d)) setProjects(d) })
    fetch('/api/sections').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllSections(d) })
  }, [])

  function openAdd() {
    setEditing(null)
    setForm(BLANK)
    setPhotoFile(null)
    setPhotoPreview(null)
    setSheetOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({
      name: emp.name, role: emp.role, phone_number: emp.phone_number || '',
      project_name: emp.project_name || '', section_name: emp.section_name || '',
      status: emp.status || 'Active', email: emp.email || '', notes: emp.notes || '',
    })
    setPhotoFile(null)
    setPhotoPreview(emp.profile_picture || null)
    setSheetOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let profile_picture: string | null = editing?.profile_picture ?? null

    if (photoFile) {
      const fd = new FormData()
      fd.append('file', photoFile)
      const uploadRes = await fetch('/api/employees/upload-photo', { method: 'POST', body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) {
        setSaving(false)
        toast.error('Photo upload failed', { description: uploadData.error || 'Could not upload image.' })
        return
      }
      profile_picture = uploadData.url
    }

    const payload: Record<string, unknown> = {
      name: form.name, role: form.role, phone_number: form.phone_number,
      project_name: form.project_name, section_name: form.section_name,
      status: form.status, email: form.email, notes: form.notes,
      profile_picture,
    }

    const res = editing
      ? await fetch(`/api/employees/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    setSaving(false)
    if (res.ok) {
      setSheetOpen(false)
      load()
      toast.success(editing ? `${form.name} updated` : `${form.name} added`, { description: editing ? 'Employee record saved.' : 'New employee added to roster.' })
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
    if (!res.ok) {
      toast.error('Delete failed', { description: data.error || 'Please try again.' })
      return
    }
    setSheetOpen(false)
    load()
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
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.18s',
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
                  {emp.user_id != null && (
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 4 }}>
                      linked
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: T.muted }}>
                  {emp.role}{emp.project_name ? ` · ${emp.project_name}` : ''}
                </div>
                {emp.phone_number && <div style={{ fontSize: '0.78rem', color: T.sub, marginTop: 2 }}>{emp.phone_number}</div>}
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
          style={{ background: '#110f0c', borderLeft: `1px solid ${T.border}`, padding: '24px 20px', maxWidth: 480, width: '100%' }}
        >
          <SheetHeader style={{ marginBottom: 20 }}>
            <SheetTitle style={{ color: T.text, fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              {editing ? 'Edit Employee' : 'Add Employee'}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Photo */}
            <div>
              <FieldLabel>Photo</FieldLabel>
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
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👷'}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: photoFile ? T.amber : T.muted }}>
                    {photoFile ? photoFile.name : 'Tap to upload photo'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: T.sub, marginTop: 2 }}>JPG, PNG — optional</div>
                </div>
              </label>
            </div>

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
                <Select
                  value={form.project_name}
                  onChange={v => { set('project_name', v); set('section_name', '') }}
                  placeholder="Select project"
                  searchable
                  options={projects.map(p => ({ value: p.name, label: p.name }))}
                />
              </div>
              <div>
                <FieldLabel>Section</FieldLabel>
                <Select
                  value={form.section_name}
                  onChange={v => set('section_name', v)}
                  placeholder="Select section"
                  disabled={!form.project_name}
                  options={filteredSections.map(s => ({ value: s.name, label: s.name }))}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Notes</FieldLabel>
              <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)}
                onFocus={e => { e.target.style.borderColor = T.amber; e.target.style.boxShadow = `0 0 0 3px ${T.amber}20` }}
                onBlur={e => { e.target.style.borderColor = 'rgba(242,237,227,0.18)'; e.target.style.boxShadow = 'none' }} />
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
