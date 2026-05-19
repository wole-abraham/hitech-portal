'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
]

const ADMIN_NAV = [
  { href: '/portal',     label: 'Home',      icon: 'grid'    },
  { href: '/reports',    label: 'Reports',   icon: 'doc'     },
  { href: '/employees',  label: 'Employees', icon: 'person'  },
  { href: '/equipment',  label: 'Equipment', icon: 'gear'    },
  { href: '/history',    label: 'History',   icon: 'clock'   },
  { href: '/dashboard',  label: 'Analytics', icon: 'chart'   },
  { href: '/config',     label: 'Config',    icon: 'sliders' },
]

function NavIcon({ name, size = 24 }: { name: string; size?: number }) {
  const props = {
    width: size, height: size,
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
  }
  // grid: filled (fill="currentColor"); all others: stroked (stroke="currentColor")
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
    case 'chart':
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6"  y1="20" x2="6"  y2="14"/>
          <line x1="2"  y1="20" x2="22" y2="20"/>
        </svg>
      )
    case 'sliders':
      return (
        <svg {...props}>
          <line x1="4"  y1="21" x2="4"  y2="14"/>
          <line x1="4"  y1="10" x2="4"  y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8"  x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1"  y1="14" x2="7"  y2="14"/>
          <line x1="9"  y1="8"  x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
      )
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24"/>
  }
}

export default function NavShell({ title, subtitle, children, action }: NavShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<'worker' | 'admin' | null>(null)
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('hitech_sidebar_collapsed') === 'true'
  )
  const [vis, setVis] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) { router.replace('/login'); return null }
        return r.json()
      })
      .then(d => { if (d?.user?.role) setRole(d.user.role) })
      .catch(() => {})
  }, [router])

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
            <img
              src="/logo.jpg"
              alt="Hitech"
              style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, objectFit: 'cover' }}
              onError={e => {
                const t = e.currentTarget
                t.style.display = 'none'
                const fb = t.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: '#b45309', display: 'none', alignItems: 'center', justifyContent: 'center',
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
                animation: vis ? 'titleIn 0.28s ease forwards' : 'none',
                opacity: vis ? undefined : 0,
              }}>{title}</div>
              {subtitle && (
                <div style={{
                  fontSize: '0.68rem', color: T.muted, marginTop: 1,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                  animation: vis ? 'titleIn 0.3s ease 0.05s forwards' : 'none',
                  opacity: vis ? undefined : 0,
                }}>{subtitle}</div>
              )}
            </div>
            {action && <div style={{ flexShrink: 0 }}>{action}</div>}
          </header>

          {/* Content */}
          <div
            className={`shell-content nav-shell-body`}
            style={{
              animation: vis ? 'shellIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'none',
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
