'use client'

import { useState } from 'react'
import AmbientBackground from '@/components/AmbientBackground'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setSent(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#eceae5',
    border: `1px solid ${focused ? 'rgba(245,158,11,0.60)' : 'rgba(0,0,0,0.14)'}`,
    boxShadow: focused ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none',
    borderRadius: 11, color: '#1a1610', fontSize: '0.92rem',
    fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.3s',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <AmbientBackground />
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '2.2rem', letterSpacing: '-0.04em', lineHeight: 0.9,
              color: '#1a1610',
            }}>HITECH</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
              letterSpacing: '0.18em', color: '#6b6055',
              textTransform: 'uppercase', marginTop: 6,
            }}>Construction Ltd</div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 18, padding: '28px 24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(22,163,74,0.10)',
                  border: '1px solid rgba(22,163,74,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                  fontSize: '1.5rem',
                }}>✓</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  letterSpacing: '0.13em', color: '#16a34a',
                  textTransform: 'uppercase', marginBottom: 12, fontWeight: 600,
                }}>Check your inbox</div>
                <p style={{
                  fontFamily: 'var(--font-mono)', color: '#5a5248',
                  fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 24px',
                }}>
                  If an account exists for <strong style={{ color: '#1a1610' }}>{email}</strong>,
                  you'll receive a reset link shortly. It expires in 1 hour.
                </p>
                <a href="/login" style={{
                  display: 'block', width: '100%', padding: '13px',
                  background: '#f59e0b', color: '#1a1008',
                  border: 'none', borderRadius: 11,
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '0.88rem', letterSpacing: '0.07em',
                  textTransform: 'uppercase', textAlign: 'center',
                  textDecoration: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(245,158,11,0.20)',
                }}>Back to Sign In</a>
              </div>
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
                  letterSpacing: '0.13em', color: '#5a5248',
                  textTransform: 'uppercase', marginBottom: 6,
                }}>Reset Password</div>
                <p style={{
                  fontFamily: 'var(--font-mono)', color: '#5a5248',
                  fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 20px',
                }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>

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
                    }}>Email</label>
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required autoComplete="email"
                      style={inputBase}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
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
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <a href="/login" style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.82rem',
              color: '#5a5248', textDecoration: 'none',
              letterSpacing: '0.04em',
            }}>
              ← Back to Sign In
            </a>
          </div>

        </div>
      </div>
    </main>
  )
}
