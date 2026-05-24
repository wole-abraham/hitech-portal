'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import AmbientBackground from '@/components/AmbientBackground'
import CityLoader from '@/components/CityLoader'

type IconName = 'report' | 'employees' | 'equipment' | 'submissions' | 'history' | 'machines'
interface TileProps { href: string; num: string; icon: IconName; tag: string; title: string; desc: string }

const ADMIN_TILES: TileProps[] = [
  { href: '/reports/start',  num: '01', icon: 'report',      tag: 'Hitech',      title: 'Activity Report',     desc: 'Submit site activities, log chainages, upload field photos.' },
  { href: '/employees',      num: '02', icon: 'employees',   tag: 'Management',  title: 'Employees List',      desc: 'Browse workers, track roles, view personnel records.' },
  { href: '/equipment',      num: '03', icon: 'equipment',   tag: 'Assets',      title: 'Equipment Registry',  desc: 'Add machines and assign equipment to site personnel.' },
  { href: '/reports',        num: '04', icon: 'submissions', tag: 'Records',     title: 'Submissions',         desc: 'Browse all submitted Hitech activity reports.' },
  { href: '/history',        num: '05', icon: 'history',     tag: 'Audit',       title: 'Machine History',     desc: 'Full audit log — assignments, receipts, returns, arrivals.' },
]

const WORKER_TILES: TileProps[] = [
  { href: '/reports/start',   num: '01', icon: 'report',    tag: 'Hitech',   title: 'Activity Report', desc: 'Submit site activities, log chainages, upload field photos.' },
  { href: '/worker/machines', num: '02', icon: 'machines',  tag: 'My Fleet', title: 'My Machines',     desc: 'View assigned equipment. Confirm receipt or return to base.' },
]

function TileIcon({ name, hov }: { name: IconName; hov: boolean }) {
  const c = hov ? '#1a1610' : '#5a5248'
  const s = {
    width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: c, strokeWidth: 1.65,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style: { transition: 'stroke 0.28s ease' },
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 11, flexShrink: 0,
      background: hov ? 'rgba(245,158,11,0.10)' : 'rgba(0,0,0,0.04)',
      border: `1px solid ${hov ? 'rgba(245,158,11,0.30)' : 'rgba(0,0,0,0.08)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.28s ease, border-color 0.28s ease',
      marginBottom: 14,
    }}>
      {name === 'report' && (
        <svg {...s}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      )}
      {name === 'employees' && (
        <svg {...s}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      )}
      {name === 'equipment' && (
        <svg {...s}>
          <rect x="2" y="13" width="10" height="7" rx="1.5"/>
          <circle cx="5" cy="20" r="1.5"/>
          <circle cx="9" cy="20" r="1.5"/>
          <path d="M12 16l5-8 4 2.5-3 6.5"/>
          <line x1="19" y1="9.5" x2="21" y2="6.5"/>
        </svg>
      )}
      {name === 'submissions' && (
        <svg {...s}>
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
      )}
      {name === 'history' && (
        <svg {...s}>
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 .49-5.35L1 10"/>
          <polyline points="12 7 12 12 15.5 14"/>
        </svg>
      )}
      {name === 'machines' && (
        <svg {...s}>
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      )}
    </div>
  )
}

function PortalTile({ num, icon, tag, title, desc, href }: TileProps) {
  const [hov, setHov] = useState(false)
  const [counter, setCounter] = useState('00')
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null)
  const tileRef = useRef<HTMLAnchorElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const target = parseInt(num)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!hov) { setCounter('00'); return }
    let n = 0
    timerRef.current = setInterval(() => {
      n++
      setCounter(n.toString().padStart(2, '0'))
      if (n >= target) clearInterval(timerRef.current!)
    }, 85)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [hov, target])

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = tileRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2
    el.style.transform = `perspective(900px) rotateX(${y * -9}deg) rotateY(${x * 9}deg) translateZ(18px)`
    el.style.transition = 'background 0.15s, border-color 0.15s, box-shadow 0.15s'
    if (glareRef.current) {
      const gx = ((e.clientX - r.left) / r.width) * 100
      const gy = ((e.clientY - r.top) / r.height) * 100
      glareRef.current.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 32%, transparent 62%)`
    }
  }

  function onClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, id: Date.now() })
  }

  function onEnter() { setHov(true) }

  function onLeave() {
    setHov(false)
    const el = tileRef.current
    if (!el) return
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    el.style.transition = 'all 0.6s ease'
    if (glareRef.current) glareRef.current.style.background = 'none'
  }

  return (
    <a
      ref={tileRef}
      href={href}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        display: 'flex', flexDirection: 'column',
        textDecoration: 'none', position: 'relative', overflow: 'hidden',
        background: hov ? '#fdf8ef' : '#ffffff',
        border: `1px solid ${hov ? 'rgba(245,158,11,0.40)' : 'rgba(0,0,0,0.09)'}`,
        borderRadius: 14, padding: '18px 16px 16px',
        boxShadow: hov
          ? '0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(245,158,11,0.08)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        height: '100%', willChange: 'transform',
      }}
    >
      {/* Left accent line */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px',
        background: '#f59e0b',
        borderRadius: '14px 0 0 14px',
        transform: hov ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
      }} />

      {/* Specular glare */}
      <div ref={glareRef} style={{
        position: 'absolute', inset: 0, borderRadius: 14,
        pointerEvents: 'none',
        opacity: hov ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }} />

      {/* Number counter + tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          color: hov ? '#1a1610' : '#8c8480',
          letterSpacing: '0.06em', transition: 'color 0.2s',
          minWidth: '2ch',
        }}>{counter}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.58rem', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.13em',
          color: '#6b6055', padding: '3px 7px',
          border: '1px solid rgba(0,0,0,0.09)', borderRadius: 4,
        }}>{tag}</span>
      </div>

      <TileIcon name={icon} hov={hov} />

      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: '0.95rem', color: '#1a1610',
        marginBottom: 6, letterSpacing: '-0.01em',
      }}>{title}</div>

      <div style={{ fontSize: '0.76rem', color: '#5a5248', lineHeight: 1.55, flex: 1 }}>
        {desc}
      </div>

      <div style={{
        marginTop: 14, display: 'flex', justifyContent: 'flex-end',
        opacity: hov ? 1 : 0,
        transform: hov ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 0.25s, transform 0.3s',
      }}>
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>

      {ripple && (
        <div
          key={ripple.id}
          onAnimationEnd={() => setRipple(null)}
          style={{
            position: 'absolute',
            left: ripple.x, top: ripple.y,
            width: 24, height: 24,
            marginLeft: -12, marginTop: -12,
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.20)',
            animation: 'rippleOut 0.65s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}
    </a>
  )
}

export default function PortalPage() {
  const router = useRouter()
  const [vis, setVis] = useState(false)
  const [user, setUser] = useState('—')
  const [role, setRole] = useState<'admin' | 'worker'>('worker')
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.replace('/login'); return }
      setUser(`${d.user.first_name || ''} ${d.user.last_name || ''}`.trim() || d.user.email)
      setRole(d.user.role)
    }).catch(() => {}).finally(() => {
      setLoading(false)
    })
  }, [])

  const TILES = role === 'admin' ? ADMIN_TILES : WORKER_TILES

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const wordmark = 'HITECH'.split('')

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      {showLoader && (
        <CityLoader
          isLoading={loading}
          onDone={() => { setShowLoader(false); setTimeout(() => setVis(true), 60) }}
        />
      )}

      <AmbientBackground />

      {/* Subtle perspective grid */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: '-15%', right: '-15%',
        height: '52vh',
        backgroundImage: [
          'repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(0,0,0,0.04) 47px, rgba(0,0,0,0.04) 48px)',
          'repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(0,0,0,0.04) 47px, rgba(0,0,0,0.04) 48px)',
        ].join(', '),
        transform: 'perspective(600px) rotateX(68deg)',
        transformOrigin: 'bottom center',
        pointerEvents: 'none',
        zIndex: 0,
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)',
        animation: 'gridPulse 8s ease-in-out infinite',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 20px 80px',
        opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        <div style={{ width: '100%', maxWidth: 960, paddingTop: 48 }}>

          {/* Top controls */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 10, marginBottom: 52,
            opacity: vis ? 1 : 0,
            transform: vis ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          }}>
            <img src="/logo.jpg" alt="Hitech" style={{
              width: 42, height: 42, borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
              flexShrink: 0,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              letterSpacing: '0.09em', fontWeight: 700,
              color: '#1a1610',
              padding: '6px 13px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 6, textTransform: 'uppercase',
            }}>
              {role === 'admin' ? '⚡ Admin' : '👷 Field Worker'}
            </div>
            <button onClick={handleLogout} disabled={loggingOut} style={{
              height: 32, padding: '0 16px', borderRadius: 8,
              background: loggingOut ? 'rgba(220,38,38,0.04)' : 'rgba(220,38,38,0.08)',
              color: loggingOut ? '#8c8480' : '#dc2626',
              border: '1px solid rgba(220,38,38,0.25)',
              font: '700 11px/1 var(--font-mono)',
              cursor: loggingOut ? 'default' : 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'all 0.15s',
              opacity: loggingOut ? 0.5 : 1,
            }}
              onMouseEnter={e => {
                if (loggingOut) return
                e.currentTarget.style.background = 'rgba(220,38,38,0.14)'
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)'
              }}
            >
              {loggingOut ? '…' : 'Log Out'}
            </button>
            </div>
          </div>

          {/* Wordmark */}
          <div style={{ marginBottom: 44 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(2.8rem, 11vw, 4rem)',
              letterSpacing: '-0.04em', lineHeight: 0.88,
            }}>
              {wordmark.map((char, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  color: '#1a1610',
                  opacity: 0,
                  animation: vis
                    ? `charIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + i * 0.07}s forwards`
                    : 'none',
                }}>{char}</span>
              ))}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.67rem',
              letterSpacing: '0.17em', textTransform: 'uppercase',
              color: '#6b6055', marginTop: 9,
              opacity: vis ? 1 : 0,
              transition: 'opacity 0.6s ease 0.55s',
            }}>
              Portal · Site Command
            </div>

            <div style={{
              height: '1.5px',
              background: 'linear-gradient(90deg, #f59e0b 0%, rgba(245,158,11,0.20) 55%, transparent 100%)',
              marginTop: 16, marginBottom: 14,
              width: vis ? '100%' : '0%',
              transition: 'width 1.1s cubic-bezier(0.4, 0, 0.2, 1) 0.48s',
            }} />

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
              color: '#6b6055', letterSpacing: '0.04em',
              opacity: vis ? 1 : 0,
              transition: 'opacity 0.5s ease 1s',
            }}>
              Welcome back — <span style={{ color: '#1a1610', fontWeight: 600 }}>{user}</span>
            </div>
          </div>

          {/* Tile grid */}
          <div className="portal-grid">
            {TILES.map((t, i) => (
              <div key={t.href} style={{
                opacity: 0,
                animation: vis
                  ? `tileSpring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.55 + i * 0.1}s forwards`
                  : 'none',
              }}>
                <PortalTile {...t} />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: vis ? 1 : 0,
            transition: 'opacity 0.5s ease 1.1s',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#8c8480', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Hitech Construction Ltd
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: '#8c8480', letterSpacing: '0.06em' }}>
              v2026.05
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
