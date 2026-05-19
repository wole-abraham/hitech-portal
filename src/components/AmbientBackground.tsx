'use client'

import { useEffect, useRef } from 'react'

const PEAKS = [
  { cx: 0.28, cy: 0.42, sx: 1.00, sy: 0.68 },
  { cx: 0.72, cy: 0.34, sx: 0.72, sy: 0.62 },
  { cx: 0.54, cy: 0.80, sx: 0.55, sy: 0.55 },
]
const LEVELS = 14
const PTS    = 64

function drawTopo(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)

  ctx.fillStyle = '#f8f7f5'
  ctx.fillRect(0, 0, w, h)

  ctx.lineWidth = 1.2

  for (const p of PEAKS) {
    const px = p.cx * w
    const py = p.cy * h
    const baseUnit = Math.min(w, h) * 0.065

    for (let lv = 0; lv < LEVELS; lv++) {
      const baseR = (lv + 1) * baseUnit * p.sx
      const pulse  = Math.sin(t * 0.36 + lv * 0.28 + p.cx * Math.PI) * 7
      const r = baseR + pulse

      // Inner lines darker, outer ones fade gently
      const alpha = Math.max(0, 0.14 - lv * 0.008)
      ctx.strokeStyle = `rgba(0,0,0,${alpha.toFixed(4)})`

      ctx.beginPath()
      for (let i = 0; i <= PTS; i++) {
        const a = (i / PTS) * Math.PI * 2
        const n =
          Math.sin(a * 2 + t * 0.13 + lv * 0.85)  * 0.18 +
          Math.sin(a * 5 + t * 0.07 + p.cy * 4.7)  * 0.09 +
          Math.sin(a * 11 + t * 0.04 + lv * 0.3)   * 0.03
        const pr = r * (1 + n)
        const x  = px + Math.cos(a) * pr
        const y  = py + Math.sin(a) * pr * p.sy
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }
  }
}

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const startTime = performance.now()

    function resize() {
      canvas!.width  = window.innerWidth
      canvas!.height = window.innerHeight
    }

    function tick() {
      const t = (performance.now() - startTime) / 1000
      drawTopo(ctx!, t, canvas!.width, canvas!.height)
      rafId = requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}
