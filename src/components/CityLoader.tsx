'use client'

import { useEffect, useRef, useState } from 'react'

function HUD({ vis }: { vis: boolean }) {
  const wordmark = 'HITECH'.split('')

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      padding: '0 24px',
    }}>

      {/* Corner brackets */}
      {[
        { top: 20, left: 20, borderTop: '2px solid', borderLeft: '2px solid' },
        { top: 20, right: 20, borderTop: '2px solid', borderRight: '2px solid' },
        { bottom: 20, left: 20, borderBottom: '2px solid', borderLeft: '2px solid' },
        { bottom: 20, right: 20, borderBottom: '2px solid', borderRight: '2px solid' },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: 24, height: 24,
          borderColor: 'rgba(210,172,88,0.50)', ...s,
          opacity: vis ? 1 : 0,
          transition: `opacity 0.4s ease ${0.2 + i * 0.08}s`,
        }} />
      ))}

      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-loader)', fontWeight: 400,
        fontSize: 'clamp(4.5rem, 15vw, 8rem)',
        letterSpacing: '0.12em', lineHeight: 1,
        marginBottom: 12, textTransform: 'uppercase',
      }}>
        {wordmark.map((ch, i) => (
          <span key={i} style={{
            display: 'inline-block',
            color: '#ede8de',
            textShadow: '0 2px 24px rgba(0,0,0,0.8)',
            opacity: 0,
            animation: vis
              ? `charIn 0.55s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.07}s forwards`
              : 'none',
          }}>{ch}</span>
        ))}
      </div>

      {/* Sub-label */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
        letterSpacing: '0.26em', textTransform: 'uppercase',
        color: 'rgba(210,190,150,0.75)',
        textShadow: '0 1px 8px rgba(0,0,0,0.9)',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.6s ease 0.65s',
        marginBottom: 40,
      }}>
        Construction Ltd · Site Command
      </div>

      {/* Shimmer progress bar */}
      <div style={{
        width: 140, height: 1,
        background: 'rgba(210,172,88,0.15)',
        borderRadius: 1, overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.4s ease 0.8s',
      }}>
        <div style={{
          height: '100%', width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.85), transparent)',
          animation: 'shimmerSlide 1.6s ease-in-out infinite',
        }} />
      </div>

      {/* Bottom rule */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: vis ? 120 : 0, height: '0.5px',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.5), transparent)',
          transition: 'width 1.1s ease 0.7s',
        }} />
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
          letterSpacing: '0.18em', color: 'rgba(160,140,110,0.6)',
          textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          textTransform: 'uppercase',
          opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease 1.6s',
        }}>
          v2026.05
        </div>
      </div>

      <style>{`
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(400%) }
        }
      `}</style>
    </div>
  )
}

interface CityLoaderProps {
  isLoading: boolean
  onDone?: () => void
}

export default function CityLoader({ isLoading, onDone }: CityLoaderProps) {
  const [visible, setVisible]   = useState(true)
  const [fading, setFading]     = useState(false)
  const [hudVis, setHudVis]     = useState(false)
  const onDoneRef = useRef(onDone)
  const videoRef  = useRef<HTMLVideoElement>(null)

  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    const t = setTimeout(() => setHudVis(true), 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isLoading) return
    const t = setTimeout(() => {
      setFading(true)
      const t2 = setTimeout(() => {
        setVisible(false)
        onDoneRef.current?.()
      }, 900)
      return () => clearTimeout(t2)
    }, 2400)
    return () => clearTimeout(t)
  }, [isLoading])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#080604',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.9s ease',
      pointerEvents: fading ? 'none' : 'auto',
      overflow: 'hidden',
    }}>
      {/* Video background */}
      <video
        ref={videoRef}
        src="/loader.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Dark overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'rgba(4,3,2,0.55)',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(4,3,2,0.65) 100%)',
      }} />

      {/* HUD */}
      <HUD vis={hudVis} />
    </div>
  )
}
