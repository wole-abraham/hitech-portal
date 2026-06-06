'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    setStatus('verifying')
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setStatus('success')
        else { setError(d.error || 'Verification failed.'); setStatus('error') }
      })
      .catch(() => { setError('Something went wrong.'); setStatus('error') })
  }, [token])

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7f5', position: 'relative', color: '#1a1610' }}>
      <AmbientBackground />
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', zIndex: 2,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.2rem', letterSpacing: '-0.04em', lineHeight: 0.9, color: '#1a1610' }}>HITECH</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em', color: '#6b6055', textTransform: 'uppercase', marginTop: 6 }}>Construction Ltd</div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 18, padding: '32px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>

            {!token && (
              <>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📧</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.13em', color: '#5a5248', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Check your inbox</div>
                <p style={{ fontFamily: 'var(--font-mono)', color: '#5a5248', fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                  We've sent a verification link to your email address. Click it to activate your account.
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', color: '#8c8480', fontSize: '0.72rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                  The link expires in 24 hours. Check your spam folder if you don't see it.
                </p>
                <a href="/login" style={{ display: 'block', width: '100%', padding: '13px', background: '#f59e0b', color: '#1a1008', border: 'none', borderRadius: 11, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 24px rgba(245,158,11,0.20)' }}>
                  Back to Sign In
                </a>
              </>
            )}

            {token && status === 'verifying' && (
              <>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#5a5248', letterSpacing: '0.08em' }}>Verifying your email…</div>
              </>
            )}

            {token && status === 'success' && (
              <>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '1.5rem' }}>✓</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.13em', color: '#16a34a', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Email Verified</div>
                <p style={{ fontFamily: 'var(--font-mono)', color: '#5a5248', fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Your account is now active. You can sign in.
                </p>
                <a href="/login" style={{ display: 'block', width: '100%', padding: '13px', background: '#f59e0b', color: '#1a1008', border: 'none', borderRadius: 11, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 24px rgba(245,158,11,0.20)' }}>
                  Sign In →
                </a>
              </>
            )}

            {token && status === 'error' && (
              <>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '1.4rem' }}>✕</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.13em', color: '#dc2626', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>Verification Failed</div>
                <p style={{ fontFamily: 'var(--font-mono)', color: '#5a5248', fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 24px' }}>{error}</p>
                <a href="/signup" style={{ display: 'block', width: '100%', padding: '13px', background: '#f59e0b', color: '#1a1008', border: 'none', borderRadius: 11, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 24px rgba(245,158,11,0.20)' }}>
                  Sign Up Again
                </a>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  )
}
