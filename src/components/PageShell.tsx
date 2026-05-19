'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import NavShell from '@/components/NavShell'

// ── Design tokens — light warm theme ────────────────────────────
export const T = {
  bg:           '#f8f7f5',
  card:         '#ffffff',
  cardGrad:     'linear-gradient(160deg, #ffffff 0%, #f8f6f2 100%)',
  input:        '#eceae5',
  border:       'rgba(0,0,0,0.08)',
  borderInput:  'rgba(0,0,0,0.15)',
  borderStrong: 'rgba(0,0,0,0.28)',
  amber:        '#f59e0b',
  amberDim:     'rgba(245,158,11,0.10)',
  yellow:       '#d97706',
  yellowDim:    'rgba(217,119,6,0.10)',
  text:         '#1a1610',
  muted:        '#5a5248',
  sub:          '#8c8480',
  error:        '#dc2626',
  success:      '#16a34a',
}

export function CosmicBackground() { return null }

// ── Skeleton primitives ────────────────────────────────────────
const SHIMMER = `linear-gradient(90deg, #ede9e2 25%, rgba(255,255,255,0.7) 50%, #ede9e2 75%)`

export function Skeleton({ width, height, radius, style }: {
  width?: number | string
  height?: number | string
  radius?: number | string
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      width: width ?? '100%',
      height: height ?? 14,
      borderRadius: radius ?? 6,
      background: SHIMMER,
      backgroundSize: '300% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

export function SkeletonCard({ lines = 2, icon = true }: { lines?: number; icon?: boolean }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: '15px 16px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {icon && <Skeleton width={44} height={44} radius={12} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={150} height={14} />
          <Skeleton width={50} height={14} radius={20} />
        </div>
        {lines >= 2 && <Skeleton width="65%" height={12} />}
        {lines >= 3 && <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width={80} height={11} />
          <Skeleton width={100} height={11} />
          <Skeleton width={70} height={11} />
        </div>}
      </div>
    </div>
  )
}

export function SkeletonList({ n = 5, lines, icon }: { n?: number; lines?: number; icon?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} lines={lines} icon={icon} />)}
    </div>
  )
}

// ── PageShell ──────────────────────────────────────────────────
export function PageShell({ title, subtitle, back: _back, children, action }: {
  title: string
  subtitle?: string
  back?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <NavShell title={title} subtitle={subtitle} action={action}>
      {children}
    </NavShell>
  )
}

// ── SearchBar ──────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={1.75}
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
      </svg>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Search…'}
        style={{
          width: '100%', padding: '11px 14px 11px 38px',
          background: T.input, border: `1px solid ${T.borderInput}`,
          borderRadius: 11, color: T.text, fontSize: '0.9rem',
          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => {
          e.target.style.borderColor = T.amber
          e.target.style.boxShadow = `0 0 0 3px rgba(245,158,11,0.15)`
        }}
        onBlur={e => {
          e.target.style.borderColor = T.borderInput
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

// ── Badge ──────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.11em', background: color + '20', color,
      padding: '3px 8px', borderRadius: 4,
      fontFamily: 'var(--font-mono)',
    }}>{label}</span>
  )
}

// ── EmptyState ─────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
      <div style={{ fontSize: '2.2rem', marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
        {message}
      </p>
    </div>
  )
}

// ── Modal (bottom sheet) ───────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.18s ease forwards',
      }} onClick={onClose} />
      <div style={{
        position: 'relative', zIndex: 1,
        background: '#ffffff',
        border: `1px solid ${T.borderInput}`,
        borderRadius: 20,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'tileIn 0.22s cubic-bezier(0.22,0.61,0.36,1)',
        padding: '20px 20px 28px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: T.text, fontFamily: 'var(--font-display)' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.muted, width: 30, height: 30,
            cursor: 'pointer', fontSize: '0.88rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

// ── Shared input style ─────────────────────────────────────────
export const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: '#eceae5', border: `1px solid rgba(0,0,0,0.15)`,
  borderRadius: 11, color: '#1a1610', fontSize: '0.92rem',
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

// ── FieldLabel ─────────────────────────────────────────────────
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{
      fontSize: '0.64rem', fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '0.10em', color: T.muted, marginBottom: 7, display: 'block',
      fontFamily: 'var(--font-mono)',
    }}>
      {children}{required && <span style={{ color: T.amber, marginLeft: 3 }}>*</span>}
    </label>
  )
}

// ── SaveBtn ────────────────────────────────────────────────────
export function SaveBtn({ loading, label = 'Save' }: { loading?: boolean; label?: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '14px',
        background: loading ? 'rgba(0,0,0,0.08)' : '#f59e0b',
        color: loading ? T.muted : '#1a1008',
        border: 'none', borderRadius: 11, fontWeight: 800, fontSize: '0.88rem',
        cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
        boxShadow: loading
          ? 'none'
          : hov
            ? `0 6px 32px rgba(245,158,11,0.35)`
            : `0 4px 20px rgba(245,158,11,0.20)`,
        transform: hov && !loading ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.2s',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        fontFamily: 'var(--font-display)',
      }}
    >{loading ? 'Saving…' : label}</button>
  )
}
