'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

const ROLES = ['Engineer','Supervisor','Operator','Technician','Labourer','Driver','Surveyor','Site Manager','Other']
const GENDERS = ['Male','Female','Other']
const MARITAL = ['Single','Married','Divorced','Widowed']

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [nationality, setNationality] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => { setTimeout(() => setVis(true), 60) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!jobRole) { setError('Please select your job role.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone, password, jobRole, dob, gender, nationality, marital_status: maritalStatus }),
    })
    const data = await res.json()
    if (!res.ok) { setLoading(false); setError(data.error || 'Sign up failed.'); return }
    router.push('/portal')
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#404040',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 11, color: '#f0f0f0',
    fontSize: '0.92rem', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.25s, box-shadow 0.3s',
  }

  const focus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#f0f0f0'
    e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.08)'
  }
  const blur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.14)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px 16px' }}>
      <AmbientBackground />

      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 420,
        opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src="/logo.jpg" alt="Hitech" style={{
              position: 'relative',
              width: 100, height: 100, borderRadius: 20,
              boxShadow: '0 0 0 2px rgba(255,255,255,0.10), 0 12px 40px rgba(0,0,0,0.5)',
              display: 'block',
              marginBottom: 14,
            }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.2em', color: '#d0d0d0', textTransform: 'uppercase', marginTop: 2 }}>
            Hitech Construction Ltd
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(160deg, #4e4e4e 0%, #444444 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20, padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  First Name
                </label>
                <input style={inputBase} value={firstName} onChange={e => setFirstName(e.target.value)}
                  required autoComplete="given-name" placeholder="Kwame"
                  onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  Last Name
                </label>
                <input style={inputBase} value={lastName} onChange={e => setLastName(e.target.value)}
                  required autoComplete="family-name" placeholder="Asante"
                  onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                Email
              </label>
              <input type="email" style={inputBase} value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                onFocus={focus} onBlur={blur} />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                Phone Number
              </label>
              <input type="tel" style={inputBase} value={phone} onChange={e => setPhone(e.target.value)}
                autoComplete="tel" placeholder="+234…"
                onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  Date of Birth
                </label>
                <input type="date" style={inputBase} value={dob} onChange={e => setDob(e.target.value)}
                  onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  Gender
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {GENDERS.map(g => (
                    <button key={g} type="button" onClick={() => setGender(g)} style={{
                      flex: 1, padding: '10px 4px', borderRadius: 9, fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                      border: gender === g ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.10)',
                      background: gender === g ? 'rgba(255,255,255,0.10)' : '#4e4e4e',
                      color: gender === g ? '#f0f0f0' : '#d0d0d0',
                    }}>{g}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  Nationality
                </label>
                <input style={inputBase} value={nationality} onChange={e => setNationality(e.target.value)}
                  placeholder="e.g. Nigerian" onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                  Marital Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {MARITAL.map(m => (
                    <button key={m} type="button" onClick={() => setMaritalStatus(m)} style={{
                      padding: '8px 4px', borderRadius: 9, fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                      border: maritalStatus === m ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.10)',
                      background: maritalStatus === m ? 'rgba(255,255,255,0.10)' : '#4e4e4e',
                      color: maritalStatus === m ? '#f0f0f0' : '#d0d0d0',
                    }}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                Job Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => setJobRole(r)} style={{
                    padding: '9px 6px',
                    borderRadius: 9,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    border: jobRole === r ? '1px solid rgba(255,255,255,0.30)' : '1px solid rgba(255,255,255,0.10)',
                    background: jobRole === r ? 'rgba(255,255,255,0.10)' : '#4e4e4e',
                    color: jobRole === r ? '#f0f0f0' : '#d0d0d0',
                  }}>{r}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...inputBase, paddingRight: 44 }}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="Min. 8 characters"
                  onFocus={focus} onBlur={blur} />
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showPassword ? '#f0f0f0' : '#555555', fontSize: '1rem', lineHeight: 1 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
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
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#d0d0d0', marginBottom: 7 }}>
                Confirm Password
              </label>
              <input type={showPassword ? 'text' : 'password'} style={inputBase}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password" placeholder="Re-enter password"
                onFocus={focus} onBlur={blur} />
            </div>

            {error && (
              <div style={{
                background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.20)',
                borderRadius: 10, padding: '10px 14px',
                fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#dc2626',
              }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              position: 'relative', overflow: 'hidden',
              width: '100%', padding: '14px',
              background: loading ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
              color: loading ? '#555555' : '#0c0c0c',
              border: 'none', borderRadius: 11,
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(0,0,0,0.16)',
              transition: 'background 0.2s, box-shadow 0.2s',
              marginTop: 4,
            }}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#d0d0d0', fontSize: '0.82rem' }}>
            Already have an account?{' '}
          </span>
          <a href="/login" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#f0f0f0', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 700 }}>
            Sign in →
          </a>
        </div>
      </div>
    </main>
  )
}
