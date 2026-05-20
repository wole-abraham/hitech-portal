'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AmbientBackground from '@/components/AmbientBackground'
import { subscribeMediaQueue, getMediaQueueState } from '@/lib/mediaQueue'

export default function SuccessPage() {
  const router = useRouter()
  const [vis, setVis] = useState(false)
  const [aHov, setAHov] = useState(false)
  const [bHov, setBHov] = useState(false)
  const [media, setMedia] = useState(getMediaQueueState)

  useEffect(() => { setVis(true) }, [])
  useEffect(() => subscribeMediaQueue(() => setMedia(getMediaQueueState())), [])

  return (
    <main style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <AmbientBackground />

      <div style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}>
        <div style={{
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
          opacity: vis ? 1 : 0, transform: vis ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Success ring */}
          <div style={{
            width: 80, height: 80,
            background: 'rgba(52,211,153,0.08)',
            border: '1.5px solid rgba(52,211,153,0.42)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', color: '#34d399',
            boxShadow: '0 0 24px rgba(52,211,153,0.18)',
          }}>✓</div>

          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800,
              color: '#ede8de', margin: '0 0 10px', letterSpacing: '-0.02em',
            }}>Report Submitted</h1>
            <p style={{
              fontFamily: 'var(--font-mono)', color: '#9e9387', fontSize: '0.78rem',
              margin: 0, letterSpacing: '0.05em',
            }}>
              Activity report saved successfully.
            </p>

            {media.state === 'uploading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#f59e0b', letterSpacing: '0.05em' }}>
                  Uploading media {media.done}/{media.total}…
                </span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {media.state === 'done' && media.total > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#34d399', letterSpacing: '0.05em', marginTop: -10 }}>
                ✓ {media.total} media file{media.total > 1 ? 's' : ''} uploaded
              </span>
            )}
            {media.state === 'error' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#f87171', letterSpacing: '0.05em', marginTop: -10 }}>
                ⚠ Some media failed to upload
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={media.state === 'uploading'}
              onClick={() => router.push('/reports/submit')}
              onMouseEnter={() => setAHov(true)}
              onMouseLeave={() => setAHov(false)}
              style={{
                padding: '13px 22px',
                background: media.state === 'uploading' ? 'rgba(245,158,11,0.35)' : '#f59e0b',
                color: '#1a1410',
                borderRadius: 10, fontWeight: 800, border: 'none',
                fontSize: '0.85rem', cursor: media.state === 'uploading' ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                boxShadow: aHov && media.state !== 'uploading' ? '0 6px 32px rgba(245,158,11,0.52)' : '0 4px 20px rgba(245,158,11,0.30)',
                transform: aHov && media.state !== 'uploading' ? 'translateY(-1px)' : 'translateY(0)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
            >Submit Another</button>
            <button
              type="button"
              disabled={media.state === 'uploading'}
              onClick={() => router.push('/portal')}
              onMouseEnter={() => setBHov(true)}
              onMouseLeave={() => setBHov(false)}
              style={{
                padding: '13px 22px',
                background: bHov ? 'rgba(237,232,222,0.05)' : 'transparent',
                color: media.state === 'uploading' ? 'rgba(158,147,135,0.4)' : bHov ? '#ede8de' : '#9e9387',
                border: `1px solid ${bHov ? 'rgba(237,232,222,0.20)' : 'rgba(237,232,222,0.10)'}`,
                borderRadius: 10, fontWeight: 600,
                cursor: media.state === 'uploading' ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}
            >Back to Portal</button>
          </div>
        </div>
      </div>
    </main>
  )
}
