'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

const BOOT_LINES = [
  '> SYS INIT...              [████████] OK',
  '> AUTH MODULE...           ONLINE',
  '> CONNECTING TO PORTAL...  READY',
]

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errorKey, setErrorKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<'worker' | 'admin'>('worker')
  const [vis, setVis] = useState(false)
  const [cardFocused, setCardFocused] = useState(false)
  const [btnHov, setBtnHov] = useState(false)

  const [bootLines, setBootLines] = useState(0)
  const [bootDone, setBootDone] = useState(false)
  const [bootMounted, setBootMounted] = useState(true)

  const [idFocused, setIdFocused] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const unlocked = identifier.includes('@') && identifier.length >= 5

  useEffect(() => {
    const t1 = setTimeout(() => setBootLines(1), 100)
    const t2 = setTimeout(() => setBootLines(2), 480)
    const t3 = setTimeout(() => setBootLines(3), 860)
    const t4 = setTimeout(() => setBootDone(true), 1200)
    const t5 = setTimeout(() => setVis(true), 1350)
    const t6 = setTimeout(() => setBootMounted(false), 1700)
    return () => [t1, t2, t3, t4, t5, t6].forEach(clearTimeout)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Something went wrong.')
      setErrorKey(k => k + 1)
      return
    }
    router.push(data.role === 'worker' ? '/reports/start' : '/portal')
  }

  const wordmark = 'HITECH'.split('')

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#eceae5',
    border: '1px solid rgba(0,0,0,0.14)',
    borderRadius: 11,
    color: '#1a1610', fontSize: '0.92rem', fontFamily: 'inherit',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.3s',
  }

  function PowerLine({ active }: { active: boolean }) {
    return (
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: '#f59e0b',
        borderRadius: '11px 0 0 11px',
        transform: active ? 'scaleY(1)' : 'scaleY(0)',
        transformOrigin: 'bottom',
        transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <AmbientBackground />

      {/* ── Boot sequence overlay ── */}
      {bootMounted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#1a1610',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: bootDone ? 0 : 1,
          transition: 'opacity 0.45s ease',
          pointerEvents: bootDone ? 'none' : 'all',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            letterSpacing: '0.06em', color: '#f0f0f0',
            display: 'flex', flexDirection: 'column', gap: 10,
            minWidth: 290, position: 'relative', zIndex: 1,
          }}>
            <div style={{ color: '#d0d0d0', marginBottom: 4, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              HITECH CONSTRUCTION LTD — PORTAL v2026.05
            </div>
            {BOOT_LINES.map((line, i) => (
              bootLines > i && (
                <div key={i} style={{
                  animation: 'bootLineIn 0.28s ease forwards',
                  color: i === BOOT_LINES.length - 1 ? '#34d399' : '#f0f0f0',
                }}>
                  {line}
                </div>
              )
            ))}
            {bootLines > 0 && !bootDone && (
              <div style={{
                width: 8, height: 14, background: '#f59e0b',
                animation: 'amberPulse 0.8s ease-in-out infinite',
                marginTop: 2,
              }} />
            )}
          </div>
        </div>
      )}

      {/* ── Login content ── */}
      <div className="login-outer">
        <div className="login-layout">

          {/* ── Brand panel (left on desktop) ── */}
          <div className="login-brand">
          <div style={{ marginBottom: 36 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <img src="/logo.jpg" alt="Hitech" style={{
                position: 'relative',
                width: 'clamp(80px, 14vw, 120px)',
                height: 'clamp(80px, 14vw, 120px)',
                borderRadius: 20,
                display: 'block',
                boxShadow: '0 0 0 2px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.12)',
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(2.4rem, 11vw, 4.8rem)',
              letterSpacing: '-0.04em', lineHeight: 0.86,
              whiteSpace: 'nowrap',
            }}>
              {wordmark.map((char, i) => (
                <span key={i} style={{
                  display: 'inline-block',
                  color: '#1a1610',
                  opacity: 0,
                  animation: vis
                    ? `charIn 0.52s cubic-bezier(0.16, 1, 0.3, 1) ${0.06 + i * 0.072}s forwards`
                    : 'none',
                }}>{char}</span>
              ))}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
              letterSpacing: '0.19em', textTransform: 'uppercase',
              color: '#6b6055', marginTop: 9,
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.5s ease 0.56s, transform 0.5s ease 0.56s',
            }}>
              Construction Ltd
            </div>

            <div style={{
              height: '1.5px',
              background: 'linear-gradient(90deg, #f59e0b 0%, rgba(245,158,11,0.20) 55%, transparent 100%)',
              marginTop: 20, marginBottom: 18,
              width: vis ? '100%' : '0%',
              transition: 'width 1.1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
            }} />

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
              letterSpacing: '0.13em', color: '#5a5248',
              textTransform: 'uppercase',
              opacity: vis ? 1 : 0,
              transition: 'opacity 0.5s ease 1.15s',
            }}>
              Daily Activity &amp; Asset Management
            </div>
          </div>
          </div>

          {/* ── Form panel ── */}
          <div className="login-panel">
          <div
            key={errorKey}
            style={{
              background: '#ffffff',
              border: `1px solid ${cardFocused ? 'rgba(245,158,11,0.35)' : 'rgba(0,0,0,0.09)'}`,
              borderRadius: 18, padding: '24px 20px 22px',
              boxShadow: cardFocused
                ? '0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(245,158,11,0.08)'
                : '0 4px 20px rgba(0,0,0,0.08)',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(16px)',
              animation: errorKey > 0 ? 'shake 0.42s ease' : 'none',
              transition: [
                'border-color 0.35s',
                'box-shadow 0.45s',
                `opacity 0.55s ease 0.38s`,
                `transform 0.55s ease 0.38s`,
              ].join(', '),
            }}
          >
            {/* Logo — mobile only */}
            <div className="login-mobile-logo" style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src="/logo.jpg" alt="Hitech" style={{
                  position: 'relative',
                  width: 80, height: 80, borderRadius: 16,
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.08)',
                  display: 'block',
                }} />
              </div>
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
              letterSpacing: '0.13em', color: '#5a5248',
              textTransform: 'uppercase', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: '#16a34a',
                boxShadow: '0 0 6px rgba(22,163,74,0.5)',
                animation: 'amberPulse 2.5s ease-in-out infinite',
                flexShrink: 0,
              }} />
              Sign In to Portal
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.20)',
                borderRadius: 10, padding: '10px 14px',
                color: '#dc2626', fontSize: '0.84rem', marginBottom: 18,
                fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                animation: 'charIn 0.3s ease',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.11em', color: '#5a5248',
                  marginBottom: 7, display: 'block',
                }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <PowerLine active={idFocused} />
                  <input
                    type="email" value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="you@email.com"
                    required autoComplete="email"
                    style={inputBase}
                    onFocus={e => {
                      setIdFocused(true)
                      setCardFocused(true)
                      e.target.style.borderColor = 'rgba(245,158,11,0.60)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'
                    }}
                    onBlur={e => {
                      setIdFocused(false)
                      setCardFocused(false)
                      e.target.style.borderColor = 'rgba(0,0,0,0.14)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.11em', color: '#5a5248',
                  marginBottom: 7, display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  Password
                  <span style={{
                    display: 'inline-block',
                    fontSize: '0.78rem', lineHeight: 1,
                    transform: unlocked ? 'rotate(-15deg)' : 'rotate(0deg)',
                    transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: unlocked ? 'drop-shadow(0 0 4px rgba(22,163,74,0.5))' : 'none',
                  }}>
                    {unlocked ? '🔓' : '🔒'}
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <PowerLine active={pwFocused && unlocked} />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={unlocked ? '••••••••' : 'Enter email first…'}
                    required autoComplete="current-password"
                    disabled={!unlocked}
                    style={{
                      ...inputBase,
                      paddingRight: 44,
                      opacity: unlocked ? 1 : 0.45,
                      cursor: unlocked ? 'text' : 'not-allowed',
                      transition: 'opacity 0.4s ease, border-color 0.25s, box-shadow 0.3s',
                    }}
                    onFocus={e => {
                      if (!unlocked) return
                      setPwFocused(true)
                      setCardFocused(true)
                      e.target.style.borderColor = 'rgba(245,158,11,0.60)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'
                    }}
                    onBlur={e => {
                      setPwFocused(false)
                      setCardFocused(false)
                      e.target.style.borderColor = 'rgba(0,0,0,0.14)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {unlocked && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', color: showPassword ? '#1a1610' : '#8c8480',
                        fontSize: '1rem', lineHeight: 1,
                        transition: 'color 0.2s',
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  fontWeight: 500, textTransform: 'uppercase',
                  letterSpacing: '0.11em', color: '#5a5248',
                  marginBottom: 8, display: 'block',
                }}>Access Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([
                    { value: 'worker', label: '🦺 Field Worker' },
                    { value: 'admin',  label: '⚙️  Administrator' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      style={{
                        padding: '11px 10px',
                        borderRadius: 10,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: role === value
                          ? '1px solid rgba(245,158,11,0.45)'
                          : '1px solid rgba(0,0,0,0.10)',
                        background: role === value
                          ? 'rgba(245,158,11,0.10)'
                          : '#f2efe9',
                        color: role === value ? '#1a1610' : '#5a5248',
                        boxShadow: role === value
                          ? '0 0 12px rgba(245,158,11,0.10)'
                          : 'none',
                      }}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                style={{
                  width: '100%', padding: '14px',
                  position: 'relative', overflow: 'hidden',
                  background: loading ? 'rgba(245,158,11,0.12)' : '#f59e0b',
                  color: loading ? '#8c8480' : '#1a1008',
                  border: 'none', borderRadius: 11,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800, fontSize: '0.88rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : btnHov
                    ? '0 6px 32px rgba(245,158,11,0.35)'
                    : '0 4px 24px rgba(245,158,11,0.20)',
                  transform: btnHov && !loading ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s',
                  marginTop: 4,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}
              >
                {loading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.08)',
                    transformOrigin: 'left center',
                    animation: 'chargeUp 2.2s cubic-bezier(0.4, 0, 0.6, 1) forwards',
                  }} />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </span>
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 20,
            opacity: vis ? 1 : 0,
            transition: 'opacity 0.5s ease 1.4s',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#6b6055', fontSize: '0.82rem' }}>
                No account?{' '}
              </span>
              <a href="/signup" style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                color: '#1a1610', textDecoration: 'underline', fontWeight: 700,
                letterSpacing: '0.04em',
                textUnderlineOffset: '3px',
              }}>
                Sign up →
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', color: '#8c8480', fontSize: '0.6rem',
                letterSpacing: '0.09em', textTransform: 'uppercase', margin: 0,
              }}>
                Hitech Construction Ltd
              </p>
              <p style={{
                fontFamily: 'var(--font-mono)', color: '#8c8480', fontSize: '0.6rem',
                letterSpacing: '0.06em', margin: 0,
              }}>
                v2026.05
              </p>
            </div>
          </div>
          </div>

        </div>
      </div>
    </main>
  )
}
