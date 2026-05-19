# Navigation & Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sticky header + back-button shell with a role-aware responsive NavShell: mobile bottom tab bar and desktop collapsible left sidebar.

**Architecture:** Create `NavShell.tsx` that fetches `/api/auth/me` once on mount for role, reads `usePathname()` for active item, and renders either a bottom tab bar (< 768px) or a collapsible left sidebar (≥ 768px) plus a slim sticky header. `PageShell` becomes a thin wrapper around `NavShell` so every existing page file continues to work without changes.

**Tech Stack:** Next.js App Router, React (`useEffect`, `useState`), `next/navigation` (`usePathname`, `Link`), CSS custom properties, `localStorage`, inline SVG icons

---

## File Map

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `.nav-shell-root`, sidebar, tab bar, nav-item, and header CSS classes |
| `src/components/NavShell.tsx` | Create — new navigation shell component |
| `src/components/PageShell.tsx` | Change `PageShell` to a thin wrapper around `NavShell` |

---

## Task 1: Add NavShell CSS to globals.css

**Files:**
- Modify: `src/app/globals.css`

Context: `globals.css` already has `.shell-content`, `@keyframes shellIn`, `.htcard`, `.htchip`, and a `prefers-reduced-motion` block at the bottom. Append the new CSS **before** the `prefers-reduced-motion` block (so new classes are included in its overrides).

- [ ] **Step 1: Open globals.css and locate the reduced-motion block**

Open `src/app/globals.css`. Find this block near the end of the file (around line 334):

```css
/* ── Reduced motion ──────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
```

All new CSS goes **above** this block.

- [ ] **Step 2: Add NavShell root and main area CSS**

Insert before the reduced-motion block:

```css
/* ── NavShell layout ─────────────────────────────────────────── */
.nav-shell-root {
  display: flex;
  min-height: 100vh;
  align-items: flex-start;
  position: relative;
}

.nav-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Nav header */
.nav-header {
  height: 52px;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(8,6,4,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(237,232,222,0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}
```

- [ ] **Step 3: Add mobile bottom tab bar CSS**

Immediately after the `.nav-header` block, add:

```css
/* ── Mobile bottom tab bar (< 768px) ────────────────────────── */
.nav-tabbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  height: calc(64px + env(safe-area-inset-bottom));
  background: rgba(8,6,4,0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(237,232,222,0.07);
  display: flex;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: #655d53;
  font-size: 10px;
  font-family: var(--font-display);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  min-height: 44px;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
}

.nav-tab.active {
  color: #e31c3d;
}

.nav-tab-pip {
  position: absolute;
  top: 0;
  width: 24px;
  height: 2px;
  background: #e31c3d;
  border-radius: 1px;
  opacity: 0;
}

.nav-tab.active .nav-tab-pip {
  opacity: 1;
}

.nav-tab-glow {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(227,28,61,0.12) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
}

.nav-tab.active .nav-tab-glow {
  opacity: 1;
}

/* Push content above tab bar on mobile */
.nav-shell-body {
  padding-bottom: 72px;
}

/* ── Desktop sidebar (≥ 768px) ───────────────────────────────── */
.nav-sidebar {
  display: none;
}

@media (min-width: 768px) {
  .nav-tabbar { display: none; }

  .nav-sidebar {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    background: rgba(8,6,4,0.97);
    border-right: 1px solid rgba(237,232,222,0.07);
    overflow: hidden;
    flex-shrink: 0;
    z-index: 50;
    transition: width 0.2s ease;
  }

  .nav-sidebar.expanded { width: 220px; }
  .nav-sidebar.collapsed { width: 64px; }

  .nav-shell-body {
    padding-bottom: 0;
  }

  .nav-header { padding: 0 24px; }

  /* Sidebar nav item */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    padding: 0 16px;
    border-radius: 10px;
    text-decoration: none;
    color: #655d53;
    font-size: 13px;
    font-family: var(--font-display);
    font-weight: 500;
    transition: all 0.15s ease;
    white-space: nowrap;
    overflow: hidden;
    margin: 0 8px;
    border-left: 3px solid transparent;
    flex-shrink: 0;
  }

  .nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: #9e9387;
  }

  .nav-item.active {
    background: rgba(227,28,61,0.08);
    color: #e31c3d;
    border-left-color: #e31c3d;
  }

  .nav-sidebar.collapsed .nav-item {
    padding: 0;
    justify-content: center;
    margin: 0 8px;
    border-left-color: transparent !important;
    border-radius: 10px;
  }

  .nav-sidebar.collapsed .nav-item.active {
    background: rgba(227,28,61,0.08);
  }

  .nav-sidebar.collapsed .nav-item-label { display: none; }
}
```

- [ ] **Step 4: Extend prefers-reduced-motion to cover new classes**

Find the existing reduced-motion block:

```css
@media (prefers-reduced-motion: reduce) {
  .shooting-star { display: none; }
  .shell-content { animation: none !important; opacity: 1 !important; transform: none !important; }
  .blob-1, .blob-2, .blob-3 { animation: none !important; }
  .htcard { transition: none !important; }
  .htchip { transition: none !important; }
}
```

Replace it with:

```css
@media (prefers-reduced-motion: reduce) {
  .shooting-star { display: none; }
  .shell-content { animation: none !important; opacity: 1 !important; transform: none !important; }
  .blob-1, .blob-2, .blob-3 { animation: none !important; }
  .htcard { transition: none !important; }
  .htchip { transition: none !important; }
  .nav-sidebar { transition: none !important; }
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (CSS changes don't affect TS)

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "Add NavShell layout, sidebar, and tab bar CSS"
```

---

## Task 2: Create NavShell.tsx

**Files:**
- Create: `src/components/NavShell.tsx`

Context: This is the new navigation shell. It replaces `PageShell` as the primary layout wrapper. It fetches `/api/auth/me` for role, uses `usePathname()` for active item detection, renders a mobile tab bar or desktop sidebar, and wraps all content with the sticky header and `AmbientBackground`. The `AmbientBackground` import path is `@/components/AmbientBackground`. The design tokens object `T` (and all other exports like `Skeleton`, `Modal`, `SearchBar`, etc.) remain in `PageShell.tsx` — `NavShell.tsx` only needs `T` for inline styles, so import it from `./PageShell`.

- [ ] **Step 1: Create the file with imports and nav constants**

Create `src/components/NavShell.tsx` with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import AmbientBackground from '@/components/AmbientBackground'
import { T } from '@/components/PageShell'

interface NavShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}

const WORKER_NAV = [
  { href: '/portal',          label: 'Home',     icon: 'grid'   },
  { href: '/reports/submit',  label: 'Submit',   icon: 'plus'   },
  { href: '/worker/machines', label: 'Machines', icon: 'wrench' },
  { href: '/history',         label: 'History',  icon: 'clock'  },
]

const ADMIN_NAV = [
  { href: '/portal',     label: 'Dashboard', icon: 'grid'   },
  { href: '/reports',    label: 'Reports',   icon: 'doc'    },
  { href: '/employees',  label: 'Employees', icon: 'person' },
  { href: '/equipment',  label: 'Equipment', icon: 'gear'   },
  { href: '/history',    label: 'History',   icon: 'clock'  },
]
```

- [ ] **Step 2: Add the NavIcon helper function**

Append to the same file, after the constants:

```tsx
function NavIcon({ name, size = 24 }: { name: string; size?: number }) {
  const props = {
    width: size, height: size,
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
  }
  switch (name) {
    case 'grid':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1.5" opacity={0.9}/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" opacity={0.9}/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" opacity={0.9}/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" opacity={0.9}/>
        </svg>
      )
    case 'plus':
      return (
        <svg {...props} strokeWidth={2.2}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      )
    case 'wrench':
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    case 'doc':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      )
    case 'person':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    case 'gear':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24"/>
  }
}
```

- [ ] **Step 3: Add the NavShell component**

Append to the same file, after `NavIcon`:

```tsx
export default function NavShell({ title, subtitle, children, action }: NavShellProps) {
  const pathname = usePathname()
  const [role, setRole] = useState<'worker' | 'admin' | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hitech_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user?.role) setRole(d.user.role) })
      .catch(() => {})
  }, [])

  useEffect(() => { setVis(true) }, [])

  const navItems = role === 'admin' ? ADMIN_NAV : role === 'worker' ? WORKER_NAV : []

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('hitech_sidebar_collapsed', String(next))
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>
      <AmbientBackground />

      <div className="nav-shell-root" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Desktop sidebar ── */}
        <aside className={`nav-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>

          {/* Logo row */}
          <Link href="/portal" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '18px 0' : '18px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            textDecoration: 'none', flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'var(--font-display)',
            }}>H</div>
            {!collapsed && (
              <span style={{
                fontWeight: 800, fontSize: 13, color: T.text,
                fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>HITECH</span>
            )}
          </Link>

          {/* Divider */}
          <div style={{ height: 1, background: T.border, margin: '0 16px 8px' }} />

          {/* Nav items */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0', overflowY: 'auto' }}>
            {navItems.map(item => {
              const active = pathname.startsWith(item.href) && (item.href !== '/portal' || pathname === '/portal')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`nav-item${active ? ' active' : ''}`}
                >
                  <NavIcon name={item.icon} size={20} />
                  <span className="nav-item-label">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: '12px 8px', flexShrink: 0 }}>
            <button
              onClick={toggleCollapse}
              style={{
                width: '100%', height: 36,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${T.border}`,
                borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.sub, transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="nav-main">

          {/* Header */}
          <header className="nav-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 700, fontSize: '1rem', color: T.text,
                fontFamily: 'var(--font-display)', lineHeight: 1.2,
              }}>{title}</div>
              {subtitle && (
                <div style={{
                  fontSize: '0.68rem', color: T.muted, marginTop: 1,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                }}>{subtitle}</div>
              )}
            </div>
            {action && <div style={{ flexShrink: 0 }}>{action}</div>}
          </header>

          {/* Content */}
          <div
            className={`shell-content nav-shell-body`}
            style={{
              animation: vis ? 'shellIn 0.3s ease forwards' : 'none',
              opacity: vis ? undefined : 0,
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile tab bar ── */}
      {navItems.length > 0 && (
        <nav className="nav-tabbar" aria-label="Main navigation">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href) && (item.href !== '/portal' || pathname === '/portal')
            return (
              <Link key={item.href} href={item.href} className={`nav-tab${active ? ' active' : ''}`}>
                <span className="nav-tab-pip" aria-hidden="true"/>
                <span className="nav-tab-glow" aria-hidden="true"/>
                <NavIcon name={item.icon} size={24} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/NavShell.tsx
git commit -m "Add NavShell component with mobile tab bar and desktop sidebar"
```

---

## Task 3: Update PageShell.tsx to re-export NavShell

**Files:**
- Modify: `src/components/PageShell.tsx`

Context: The current `PageShell` function renders its own header with a red "Portal" back button. This gets replaced by a thin wrapper that delegates to `NavShell`. The `back` prop is accepted but ignored — it existed for backwards compat and existing page files pass it, so removing it from the signature would cause TypeScript errors across the codebase. All other exports (`T`, `Skeleton`, `SkeletonCard`, `SkeletonList`, `SearchBar`, `Badge`, `EmptyState`, `Modal`, `inp`, `FieldLabel`, `SaveBtn`, `CosmicBackground`) remain exactly as they are. Only the `PageShell` function body changes.

- [ ] **Step 1: Add NavShell import to PageShell.tsx**

At the top of `src/components/PageShell.tsx`, the current imports are:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AmbientBackground from '@/components/AmbientBackground'
```

Replace with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AmbientBackground from '@/components/AmbientBackground'
import NavShell from '@/components/NavShell'
```

- [ ] **Step 2: Replace the PageShell function body**

Find this entire function (lines 87–146):

```tsx
// ── PageShell ──────────────────────────────────────────────────
export function PageShell({ title, subtitle, back = '/portal', children }: {
  title: string
  subtitle?: string
  back?: string
  children: React.ReactNode
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setVis(true) }, [])

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      <AmbientBackground />

      <header style={{
        background: 'rgba(8,6,4,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '10px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <a href={back} style={{
          height: 34, padding: '0 14px', borderRadius: 8,
          background: T.amber, color: '#fff',
          font: '700 11px/1 var(--font-display)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          textDecoration: 'none', flexShrink: 0,
          letterSpacing: '0.09em', textTransform: 'uppercase',
          boxShadow: `0 2px 12px rgba(227,28,61,0.30)`,
        }}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Portal
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: T.text, fontFamily: 'var(--font-display)' }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: '0.68rem', color: T.muted, marginTop: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {subtitle}
            </div>
          )}
        </div>
      </header>

      <div
        className="shell-content"
        style={{
          overflow: 'hidden',
          animation: vis ? 'shellIn 0.3s ease forwards' : 'none',
          opacity: vis ? undefined : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

Replace with:

```tsx
// ── PageShell ──────────────────────────────────────────────────
// Thin re-export of NavShell. `back` prop accepted but ignored —
// NavShell handles navigation via tabs/sidebar.
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/PageShell.tsx
git commit -m "PageShell delegates to NavShell, keeps back prop for compat"
```

---

## Manual Verification Checklist

After all tasks complete, test in browser:

**Mobile (viewport < 768px or DevTools mobile):**
- [ ] Bottom tab bar appears at bottom of every portal page (Reports, Employees, Equipment, History, Portal home, Worker Machines)
- [ ] Active tab shows red icon + red label + red pip indicator above icon
- [ ] Inactive tabs are `#655d53`
- [ ] Page content does not overlap with tab bar (72px padding-bottom visible)
- [ ] Tapping a tab navigates without full page reload (Next.js client nav)
- [ ] No "Portal" back button visible anywhere
- [ ] Header shows page title + subtitle, with optional action on right if provided

**Desktop (viewport ≥ 768px):**
- [ ] Left sidebar appears, 220px wide, with "H" logo + HITECH wordmark at top
- [ ] Active sidebar item has red left border + red icon/text + dim red background
- [ ] Collapse toggle (chevron) at sidebar bottom collapses to 64px icon-only view
- [ ] Collapsed: only icons visible, label hidden, tooltip appears on hover
- [ ] Collapse state persists on page refresh (localStorage `hitech_sidebar_collapsed`)
- [ ] Tab bar is hidden on desktop
- [ ] Content area shifts correctly with expanded/collapsed sidebar (flex layout)
- [ ] No "Portal" back button visible

**Role-based nav:**
- [ ] Log in as a worker → 4 tabs (Home, Submit, Machines, History)
- [ ] Log in as an admin → 5 tabs/items (Dashboard, Reports, Employees, Equipment, History)
- [ ] Logging out and back in as different role shows correct nav items

**Reduced motion:**
- [ ] Enable "Reduce motion" in OS → sidebar transition is instant (no 0.2s ease)
