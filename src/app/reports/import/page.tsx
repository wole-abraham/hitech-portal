'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg: '#f8f7f5', card: '#ffffff',
  orange: '#f59e0b', orangeLight: 'rgba(245,158,11,0.10)',
  orangeBorder: 'rgba(245,158,11,0.30)',
  text: '#1a1610', muted: '#6b6055', sub: '#8c8480',
  border: '#e8e2da', green: '#16a34a', greenLight: 'rgba(22,163,74,0.10)',
  red: '#dc2626', redLight: 'rgba(220,38,38,0.10)',
}

type RowResult = { row: number; status: 'ok' | 'error'; id?: number; error?: string }
type ImportResult = { imported: number; failed: number; results: RowResult[] }

export default function ImportReportsPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  function onFileChange(f: File | null) {
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/reports/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Import failed.'); return }
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const errorRows = result?.results.filter(r => r.status === 'error') ?? []
  const okRows    = result?.results.filter(r => r.status === 'ok') ?? []

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 16px', fontFamily: 'var(--font-mono)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: C.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Import Reports
            </h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: C.sub, marginTop: 2 }}>
              Upload an Excel file (.xlsx) to bulk-import activity reports
            </p>
          </div>
          <a
            href="/api/reports/template"
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 9,
              background: C.orangeLight, border: `1px solid ${C.orangeBorder}`,
              color: C.orange, fontSize: '0.7rem', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Template
          </a>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); onFileChange(e.dataTransfer.files[0] ?? null) }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? C.orange : file ? C.orangeBorder : C.border}`,
            borderRadius: 14, padding: '36px 24px',
            background: dragging ? C.orangeLight : file ? 'rgba(245,158,11,0.04)' : C.card,
            textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.18s', marginBottom: 16,
          }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => onFileChange(e.target.files?.[0] ?? null)} />
          {file ? (
            <>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: '0.85rem' }}>{file.name}</div>
              <div style={{ color: C.sub, fontSize: '0.7rem', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.4 }}>📂</div>
              <div style={{ fontWeight: 700, color: C.muted, fontSize: '0.85rem' }}>Drop your .xlsx file here</div>
              <div style={{ color: C.sub, fontSize: '0.7rem', marginTop: 4 }}>or click to browse — max 500 rows</div>
            </>
          )}
        </div>

        {/* Instructions */}
        {!result && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: '0.72rem', color: C.muted, lineHeight: 1.7 }}>
            <strong style={{ color: C.text }}>How it works:</strong>
            <ol style={{ margin: '6px 0 0 16px', paddingLeft: 0 }}>
              <li>Download the template above and fill in your report data (one row per report).</li>
              <li>Required columns: <code style={{ color: C.orange }}>project_name</code>, <code style={{ color: C.orange }}>activity_category</code>, <code style={{ color: C.orange }}>start_chainage</code>.</li>
              <li>Upload the filled file and click <strong>Import</strong>.</li>
              <li>Rows with errors are skipped — successful rows are saved immediately.</li>
            </ol>
          </div>
        )}

        {error && (
          <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: C.red, fontSize: '0.78rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Result summary */}
        {result && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: C.greenLight, border: `1px solid ${C.green}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.green }}>{result.imported}</div>
                <div style={{ fontSize: '0.65rem', color: C.green, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Imported</div>
              </div>
              <div style={{ flex: 1, background: result.failed ? C.redLight : C.card, border: `1px solid ${result.failed ? C.red : C.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: result.failed ? C.red : C.muted }}>{result.failed}</div>
                <div style={{ fontSize: '0.65rem', color: result.failed ? C.red : C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Failed</div>
              </div>
            </div>

            {okRows.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: '0.7rem', fontWeight: 700, color: C.green }}>
                  ✓ Successfully imported ({okRows.length})
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {okRows.map(r => (
                    <div key={r.row} style={{ padding: '7px 14px', borderBottom: `1px solid ${C.border}`, fontSize: '0.7rem', color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Row {r.row}</span>
                      <span style={{ color: C.sub }}>Report #{r.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorRows.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.red}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, fontSize: '0.7rem', fontWeight: 700, color: C.red }}>
                  ✗ Rows with errors ({errorRows.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {errorRows.map(r => (
                    <div key={r.row} style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, fontSize: '0.7rem' }}>
                      <span style={{ color: C.text, fontWeight: 600 }}>Row {r.row}: </span>
                      <span style={{ color: C.red }}>{r.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={() => { setFile(null); setResult(null); setError('') }}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Import Another File
              </button>
              <button
                onClick={() => router.push('/reports')}
                style={{ flex: 1, padding: '11px', borderRadius: 9, border: 'none', background: C.orange, color: '#fff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                View Reports →
              </button>
            </div>
          </div>
        )}

        {/* Import button */}
        {!result && (
          <button
            onClick={handleImport}
            disabled={!file || loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: file && !loading ? C.orange : C.border,
              color: file && !loading ? '#fff' : C.muted,
              fontSize: '0.8rem', fontWeight: 800, cursor: file && !loading ? 'pointer' : 'not-allowed',
              letterSpacing: '0.09em', textTransform: 'uppercase',
              transition: 'all 0.18s',
            }}
          >
            {loading ? 'Importing…' : 'Import Reports'}
          </button>
        )}
      </div>
    </div>
  )
}
