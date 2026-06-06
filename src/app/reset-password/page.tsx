'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [cfFocused, setCfFocused] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.')
  }, [token])

  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : password.length < 12 ? 2
    : 3

  const strengthColors = ['transparent', '#ef4444', '#f59e0b', '#16a34a']
  const strengthLabels = ['', 'Too short', 'Acceptable', 'Strong']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setDone(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  function inputStyle(focused: boolean): React.CSSProperties {
    return {
      width: '100%', padding: '12px 14px',
      background: '#eceae5',
      border: `1px solid ${focused ? 'rgba(245,158,11,0.60)' : 'rgba(0,0,0,0.14)'}`,
      boxShadow: focused ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none',
      borderRadius: 11, color: '#1a1610', fontSize: '0.92rem',
      fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
      transition: 'border-color 0.25s, box-shadow 0.3s',
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7f5', position: 'relative', color: '#1a1610' }}>
      <AmbientBackground />
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '2.2rem', letterSpacing: '-0.04em', lineHeight: 0.9,
              color: '#1a1610',
            }}>{process.env.NEXT_PUBLIC_APP_NAME || 'PORTAL'}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.18em', color: '#6b6055',
              textTransform: 'uppercase', marginTop: 6,
            }}>{process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'}</div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 18, padding: '28px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {done ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(22,163,74,0.10)',
                  border: '1px solid rgba(22,163,74,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px', fontSize: '1.5rem',
                }}>✓</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  letterSpacing: '0.13em', color: '#16a34a',
                  textTransform: 'uppercase', marginBottom: 12, fontWeight: 600,
                }}>Password Updated</div>
                <p style={{
                  fontFamily: 'var(--font-mono)', color: '#5a5248',
                  fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 8px',
                }}>
                  Your password has been changed. Redirecting to sign in…
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  letterSpacing: '0.13em', color: '#5a5248',
                  textTransform: 'uppercase', marginBottom: 18,
                }}>Set New Password</div>

                {error && (
                  <div style={{
                    background: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.20)',
                    borderRadius: 10, padding: '10px 14px',
                    color: '#dc2626', fontSize: '0.84rem', marginBottom: 16,
                    fontFamily: 'var(--font-mono)',
                  }}>{error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                      fontWeight: 500, textTransform: 'uppercase',
                      letterSpacing: '0.11em', color: '#5a5248',
                      marginBottom: 7, display: 'block',
                    }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required autoComplete="new-password"
                        style={{ ...inputStyle(pwFocused), paddingRight: 44 }}
                        onFocus={() => setPwFocused(true)}
                        onBlur={() => setPwFocused(false)}
                      />
                      <button
                        type="button" onClick={() => setShowPw(v => !v)}
                        style={{
                          position: 'absolute', right: 12, top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none', border: 'none', padding: 0,
                          cursor: 'pointer', color: '#8c8480', fontSize: '1rem',
                        }}
                        tabIndex={-1}
                      >
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          {[1, 2, 3].map(i => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: strength >= i ? strengthColors[strength] : 'rgba(0,0,0,0.10)',
                              transition: 'background 0.3s',
                            }} />
                          ))}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                          color: strengthColors[strength], letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}>{strengthLabels[strength]}</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                      fontWeight: 500, textTransform: 'uppercase',
                      letterSpacing: '0.11em', color: '#5a5248',
                      marginBottom: 7, display: 'block',
                    }}>Confirm Password</label>
                    <input
                      type={showPw ? 'text' : 'password'} value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      required autoComplete="new-password"
                      style={{
                        ...inputStyle(cfFocused),
                        borderColor: confirm && confirm !== password
                          ? 'rgba(220,38,38,0.50)'
                          : cfFocused ? 'rgba(245,158,11,0.60)' : 'rgba(0,0,0,0.14)',
                      }}
                      onFocus={() => setCfFocused(true)}
                      onBlur={() => setCfFocused(false)}
                    />
                    {confirm && confirm !== password && (
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                        color: '#dc2626', marginTop: 4, letterSpacing: '0.04em',
                      }}>Passwords don't match</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !token}
                    style={{
                      width: '100%', padding: '13px',
                      background: loading ? 'rgba(245,158,11,0.12)' : '#f59e0b',
                      color: loading ? '#8c8480' : '#1a1008',
                      border: 'none', borderRadius: 11,
                      fontFamily: 'var(--font-display)', fontWeight: 800,
                      fontSize: '0.88rem', letterSpacing: '0.07em',
                      textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 4px 24px rgba(245,158,11,0.20)',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {loading ? 'Updating…' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </div>

          {!done && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <a href="/login" style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
                color: '#5a5248', textDecoration: 'none',
                letterSpacing: '0.04em',
              }}>← Back to Sign In</a>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
