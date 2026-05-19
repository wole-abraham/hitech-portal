'use client'

import { useState, useRef, useEffect, useId } from 'react'

const S = {
  input:        '#eceae5',
  border:       'rgba(0,0,0,0.14)',
  borderOpen:   'rgba(0,0,0,0.28)',
  accent:       '#f59e0b',
  text:         '#1a1610',
  muted:        '#5a5248',
  card:         '#ffffff',
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
}

export default function Select({ options, value, onChange, placeholder = 'Select…', disabled = false, searchable = false }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0, flipped: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const uid = useId()

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current && triggerRef.current.contains(target)) return
      const drop = document.getElementById('select-drop-' + uid)
      if (drop && drop.contains(target)) return
      setOpen(false)
      setSearch('')
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, uid])

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 40)
  }, [open, searchable])

  useEffect(() => {
    if (!open) return
    function reposition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom
      const flipped = spaceBelow < 300
      setDropPos({
        top: flipped ? rect.top - 6 : rect.bottom + 6,
        left: rect.left, width: rect.width, flipped,
      })
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open])

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  function openDrop() {
    if (disabled) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom
      const flipped = spaceBelow < 300
      setDropPos({
        top: flipped ? rect.top - 6 : rect.bottom + 6,
        left: rect.left, width: rect.width, flipped,
      })
    }
    setOpen(o => !o)
    if (open) setSearch('')
  }

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={openDrop}
        style={{
          width: '100%', padding: '13px 14px',
          background: S.input,
          border: `1px solid ${open ? S.borderOpen : S.border}`,
          boxShadow: open ? '0 0 0 3px rgba(245,158,11,0.15)' : 'none',
          borderRadius: 14, color: selected ? S.text : S.muted,
          fontSize: '0.95rem', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open ? S.accent : S.muted} strokeWidth="2"
          style={{ flexShrink: 0, marginLeft: 8, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          id={'select-drop-' + uid}
          style={{
            position: 'fixed',
            top: dropPos.flipped ? 'auto' : dropPos.top,
            bottom: dropPos.flipped ? `calc(100vh - ${dropPos.top}px)` : 'auto',
            left: dropPos.left, width: dropPos.width,
            zIndex: 9999,
            background: S.card,
            border: `1px solid rgba(0,0,0,0.10)`,
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            maxHeight: 280,
            animation: 'selectDrop 0.18s ease',
          }}
        >
          {searchable && (
            <div style={{ padding: '10px 10px' }}>
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%', padding: '9px 12px',
                  background: '#f0ede8', border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: 10, color: S.text, fontSize: '0.88rem',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div style={{ overflowY: 'auto', maxHeight: searchable ? 220 : 270, padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '14px 16px', color: S.muted, fontSize: '0.88rem', textAlign: 'center' }}>No results</div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); select(opt.value) }}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: isSelected ? 'rgba(245,158,11,0.10)' : 'transparent',
                      border: 'none', borderRadius: 10,
                      color: S.text,
                      fontSize: '0.92rem', fontFamily: 'inherit',
                      textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.12s',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    {opt.label}
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={S.accent} strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
