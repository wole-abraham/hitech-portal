'use client'

import { useEffect, useRef, useState } from 'react'
import { PageShell, SearchBar, Badge, EmptyState, T, SkeletonList, Skeleton } from '@/components/PageShell'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface Report {
  id: number
  date_of_activity: string
  reporter_name: string
  project_name: string
  section_name: string
  activity_category: string
  activity_type: string
  activity_subtype: string
  start_chainage: string
  end_chainage: string
  weather: string
  activity_status: string
  party_for_activity: string
  subcontractor_name_activity: string
  comment_activity: string
  not_conforming: string
  not_conforming_issue: string
  not_conforming_correction: string
  car_used: string
  team_car: string
  side: string
  drive_folder_link: string | null
  powerbi_photo_links: string | null
  images_note: string | null
}

interface ReportEmployee { employee_name: string; employee_role: string; employee_missing_name: string }
interface ReportSupervisor { supervisor_name: string; party: string; subcontractor_name: string; supervisor_missing_name: string }
interface ReportEngineer  { engineer_name: string;  party: string; subcontractor_name: string; engineer_missing_name: string }
interface ReportMachine   { ownership: string; machine_name: string; plate_number: string; driver_name: string }

const STATUS_COLOR: Record<string, string> = {
  Ongoing: '#f5c800',
  Completed: '#34d399',
  Suspended: '#fb923c',
  Planned: '#60a5fa',
}

const PAGE_SIZE = 20

function fmt(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Report | null>(null)
  const [selectedPhotos, setSelectedPhotos]       = useState<{ file: string; media_type: string }[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<ReportEmployee[]>([])
  const [selectedSupervisors, setSelectedSupervisors] = useState<ReportSupervisor[]>([])
  const [selectedEngineers, setSelectedEngineers] = useState<ReportEngineer[]>([])
  const [selectedMachines, setSelectedMachines]   = useState<ReportMachine[]>([])
  const [detailLoading, setDetailLoading]         = useState(false)
  const [projects, setProjects] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  async function load(p = 0) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search)        params.set('search', search)
    if (filterProject) params.set('project', filterProject)
    if (filterCategory) params.set('category', filterCategory)

    const res = await fetch(`/api/reports?${params}`)
    const data = await res.json()
    setReports(Array.isArray(data.reports) ? data.reports : [])
    if (typeof data.total === 'number') setTotal(data.total)
    setLoading(false)
  }

  async function loadFilters() {
    const res = await fetch('/api/reports/filters')
    const data = await res.json()
    if (Array.isArray(data.projects))   setProjects(data.projects)
    if (Array.isArray(data.categories)) setCategories(data.categories)
  }

  useEffect(() => { loadFilters() }, [])
  useEffect(() => { setPage(0); load(0) }, [search, filterProject, filterCategory])

  useEffect(() => {
    if (!selected) {
      setSelectedPhotos([]); setSelectedEmployees([]); setSelectedSupervisors([])
      setSelectedEngineers([]); setSelectedMachines([])
      return
    }
    setDetailLoading(true)
    fetch(`/api/reports/${selected.id}/detail`)
      .then(r => r.json())
      .then(data => {
        setSelectedPhotos(Array.isArray(data.photos)      ? data.photos      : [])
        setSelectedEmployees(Array.isArray(data.employees)   ? data.employees   : [])
        setSelectedSupervisors(Array.isArray(data.supervisors) ? data.supervisors : [])
        setSelectedEngineers(Array.isArray(data.engineers)   ? data.engineers   : [])
        setSelectedMachines(Array.isArray(data.machines)    ? data.machines    : [])
      })
      .finally(() => setDetailLoading(false))
  }, [selected])

  function goPage(p: number) { setPage(p); load(p) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageShell title="Submissions" subtitle={`${total} reports`}>

      {/* Search */}
      <SearchBar value={search} onChange={v => setSearch(v)} placeholder="Search by reporter, project, activity…" />

      {/* Project filter chips */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {['', ...projects].map(p => (
            <button key={p} className="htchip" onClick={() => setFilterProject(p)} style={{
              padding: '5px 12px', borderRadius: 20,
              background: filterProject === p ? T.amber : T.card,
              color: filterProject === p ? '#fff' : T.muted,
              border: `1px solid ${filterProject === p ? T.amber : T.border}`,
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
            }}>{p || 'All Projects'}</button>
          ))}
        </div>
      )}

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['', ...categories].map(c => (
            <button key={c} className="htchip" onClick={() => setFilterCategory(c)} style={{
              padding: '5px 12px', borderRadius: 20,
              background: filterCategory === c ? '#60a5fa' : T.card,
              color: filterCategory === c ? '#fff' : T.muted,
              border: `1px solid ${filterCategory === c ? '#60a5fa' : T.border}`,
              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
            }}>{c || 'All Categories'}</button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <SkeletonList n={6} lines={3} />
      ) : reports.length === 0 ? (
        <EmptyState icon="📋" message="No submissions found" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r, i) => (
            <div key={r.id} className="htcard" onClick={() => setSelected(r)} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '14px 16px', cursor: 'pointer',
              opacity: 0, animation: `fadeIn 0.3s ease ${i * 0.03}s forwards`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#60a5fa18', border: '1px solid #60a5fa30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>{r.project_name || '—'}</span>
                    {r.section_name && <span style={{ fontSize: '0.75rem', color: T.sub }}>/ {r.section_name}</span>}
                    {r.activity_status && <Badge label={r.activity_status} color={STATUS_COLOR[r.activity_status] || T.muted} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: T.muted, marginBottom: 3 }}>
                    {r.activity_category}{r.activity_type ? ` › ${r.activity_type}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.73rem', color: T.sub, flexWrap: 'wrap' }}>
                    <span>📅 {fmt(r.date_of_activity)}</span>
                    {r.reporter_name && <span>👤 {r.reporter_name}</span>}
                    {r.start_chainage && <span>📍 {r.start_chainage} → {r.end_chainage}</span>}
                  </div>
                </div>
                <span style={{ color: T.sub, fontSize: '1rem', flexShrink: 0 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={() => goPage(page - 1)} disabled={page === 0} style={{
            padding: '8px 16px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`,
            color: page === 0 ? T.sub : T.text, cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700,
          }}>← Prev</button>
          <span style={{ padding: '8px 14px', color: T.muted, fontSize: '0.82rem', alignSelf: 'center' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages - 1} style={{
            padding: '8px 16px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`,
            color: page >= totalPages - 1 ? T.sub : T.text, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700,
          }}>Next →</button>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <SheetContent
          side="right"
          style={{ background: T.card, borderLeft: `1px solid ${T.border}`, padding: '24px 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', maxWidth: 560, width: '100%', overflowY: 'auto', zIndex: 200 }}
        >
          <SheetHeader style={{ marginBottom: 20 }}>
            <SheetTitle style={{ color: T.text, fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              Report Detail
            </SheetTitle>
          </SheetHeader>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {detailLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                <Skeleton height={12} width="60%" />
                <Skeleton height={12} width="80%" />
                <Skeleton height={12} width="45%" />
              </div>
            )}

            {/* ── Main info ── */}
            <Row label="Date" value={fmt(selected.date_of_activity)} />
            <Row label="Reporter" value={selected.reporter_name} />
            <Row label="Weather" value={selected.weather} />
            <Sep />
            <Row label="Project" value={selected.project_name} />
            <Row label="Section" value={selected.section_name} />
            <Row label="Side" value={selected.side} />
            <Sep />
            <Row label="Category" value={selected.activity_category} />
            <Row label="Activity Type" value={selected.activity_type} />
            {selected.activity_subtype && <Row label="Subtype" value={selected.activity_subtype} />}
            <Sep />
            <Row label="Start Chainage" value={selected.start_chainage} />
            <Row label="End Chainage" value={selected.end_chainage} />
            <Sep />
            <Row label="Party" value={selected.party_for_activity} />
            {selected.subcontractor_name_activity && <Row label="Subcontractor" value={selected.subcontractor_name_activity} />}
            <Row label="Status" value={selected.activity_status} valueColor={STATUS_COLOR[selected.activity_status]} />


            {/* Comment */}
            {selected.comment_activity && (
              <>
                <Sep />
                <div>
                  <SectionLabel>Comment</SectionLabel>
                  <div style={{ fontSize: '0.88rem', color: T.text, background: T.input, borderRadius: 10, padding: '10px 12px', lineHeight: 1.6, marginTop: 6 }}>
                    {selected.comment_activity}
                  </div>
                </div>
              </>
            )}

            {/* Non-conformance */}
            {selected.not_conforming === 'Yes' && (
              <>
                <Sep />
                <div style={{ background: '#f8717118', border: '1px solid #f8717130', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#f87171', marginBottom: 10, letterSpacing: '0.06em' }}>⚠ Non-Conformance</div>
                  {selected.not_conforming_issue && <Row label="Issue" value={selected.not_conforming_issue} />}
                  {selected.not_conforming_correction && <Row label="Correction" value={selected.not_conforming_correction} />}
                </div>
              </>
            )}

            {/* Car */}
            {selected.car_used === 'Yes' && (
              <>
                <Sep />
                <Row label="Car Used" value={selected.car_used} />
                {selected.team_car && <Row label="Team Car" value={selected.team_car} />}
              </>
            )}

            {/* Employees */}
            {selectedEmployees.length > 0 && (
              <>
                <Sep />
                <SectionLabel>Employees ({selectedEmployees.length})</SectionLabel>
                {selectedEmployees.map((e, i) => (
                  <PersonRow key={i} name={e.employee_name || e.employee_missing_name} role={e.employee_role} />
                ))}
              </>
            )}

            {/* Supervisors */}
            {selectedSupervisors.length > 0 && (
              <>
                <Sep />
                <SectionLabel>Supervisors ({selectedSupervisors.length})</SectionLabel>
                {selectedSupervisors.map((s, i) => (
                  <PersonRow key={i} name={s.supervisor_name || s.supervisor_missing_name} role={s.party} sub={s.subcontractor_name} />
                ))}
              </>
            )}

            {/* Engineers */}
            {selectedEngineers.length > 0 && (
              <>
                <Sep />
                <SectionLabel>Engineers ({selectedEngineers.length})</SectionLabel>
                {selectedEngineers.map((e, i) => (
                  <PersonRow key={i} name={e.engineer_name || e.engineer_missing_name} role={e.party} sub={e.subcontractor_name} />
                ))}
              </>
            )}

            {/* Machines */}
            {selectedMachines.length > 0 && (
              <>
                <Sep />
                <SectionLabel>Machinery ({selectedMachines.length})</SectionLabel>
                {selectedMachines.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: T.input, borderRadius: 9 }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: T.text, fontWeight: 600 }}>{m.machine_name || m.plate_number || '—'}</div>
                      {m.driver_name && <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 2 }}>Driver: {m.driver_name}</div>}
                    </div>
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      background: 'rgba(245,158,11,0.12)', color: T.amber,
                      padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                    }}>{m.ownership}</span>
                  </div>
                ))}
              </>
            )}

            {/* ── Media section ── */}
            {(() => {
              const pbiLinks = selected.powerbi_photo_links
                ? selected.powerbi_photo_links.split(';').map(l => l.trim()).filter(Boolean)
                : []
              const totalMedia = selectedPhotos.length + pbiLinks.length
              const hasDrive = !!selected.drive_folder_link
              const hasNote  = !!selected.images_note
              if (totalMedia === 0 && !hasDrive && !hasNote) return null
              return (
                <>
                  <Sep />
                  <SectionLabel>
                    Media {totalMedia > 0 ? `(${totalMedia})` : ''}
                  </SectionLabel>

                  {/* Local uploaded photos / videos */}
                  {selectedPhotos.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {selectedPhotos.map((p, i) => (
                        p.media_type === 'image' ? (
                          <a key={i} href={p.file} target="_blank" rel="noreferrer"
                            style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', display: 'block', background: T.card }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </a>
                        ) : (
                          <VideoThumb key={i} src={p.file} />
                        )
                      ))}
                    </div>
                  )}

                  {/* PowerBI / legacy photo links */}
                  {pbiLinks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pbiLinks.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px',
                          background: 'rgba(245,158,11,0.06)',
                          border: '1px solid rgba(245,158,11,0.18)',
                          borderRadius: 10,
                          textDecoration: 'none',
                          color: T.amber,
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-mono)',
                          wordBreak: 'break-all',
                        }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🖼</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Photo {i + 1} — legacy link
                          </span>
                          <span style={{ flexShrink: 0, fontSize: '0.7rem', opacity: 0.7 }}>↗</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Google Drive folder */}
                  {hasDrive && (
                    <a href={selected.drive_folder_link!} target="_blank" rel="noreferrer" style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px',
                      background: 'rgba(52,211,153,0.07)',
                      border: '1px solid rgba(52,211,153,0.22)',
                      borderRadius: 11,
                      textDecoration: 'none',
                      color: '#34d399',
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>📁</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Drive Folder</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selected.drive_folder_link}
                        </div>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>↗</span>
                    </a>
                  )}

                  {/* Images note */}
                  {hasNote && (
                    <div style={{ fontSize: '0.82rem', color: T.muted, background: T.input, borderRadius: 10, padding: '10px 12px', lineHeight: 1.6 }}>
                      {selected.images_note}
                    </div>
                  )}
                </>
              )
            })()}

          </div>
        )}
        </SheetContent>
      </Sheet>
    </PageShell>
  )
}

function VideoThumb({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <div
      style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', position: 'relative', background: T.input, cursor: 'pointer' }}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0 } }}
    >
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Play icon — fades out while playing */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: playing ? 0 : 1, transition: 'opacity 0.22s', pointerEvents: 'none',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(0,0,0,0.52)', border: '2px solid rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '0.85rem',
        }}>▶</div>
      </div>
      {/* Open-full badge — fades in while playing */}
      <a href={src} target="_blank" rel="noreferrer" style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.62)', borderRadius: 5, padding: '3px 7px',
        color: 'rgba(255,255,255,0.8)', fontSize: '0.58rem', fontWeight: 700,
        letterSpacing: '0.06em', textDecoration: 'none',
        opacity: playing ? 1 : 0, transition: 'opacity 0.22s',
        fontFamily: 'var(--font-mono)',
      }}>
        ↗ OPEN
      </a>
    </div>
  )
}

function Row({ label, value, valueColor }: { label: string; value?: string | null; valueColor?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: valueColor || T.text, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function Sep() {
  return <div style={{ height: 1, background: T.border }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.amber, fontFamily: 'var(--font-mono)' }}>
      {children}
    </div>
  )
}

function PersonRow({ name, role, sub }: { name?: string; role?: string; sub?: string }) {
  if (!name) return null
  return (
    <div style={{ padding: '8px 12px', background: T.input, borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '0.85rem', color: T.text, fontWeight: 600 }}>{name}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: T.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {role && (
        <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(0,0,0,0.06)', color: T.muted, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
          {role}
        </span>
      )}
    </div>
  )
}
