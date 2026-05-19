'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── Seeded RNG ────────────────────────────────────────────────
function mkRng(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

// ── Building palette ──────────────────────────────────────────
const COLS = [
  new THREE.Color('#c87848'),
  new THREE.Color('#6baed6'),
  new THREE.Color('#b4b8c4'),
  new THREE.Color('#d4a868'),
  new THREE.Color('#72b088'),
  new THREE.Color('#e08040'),
  new THREE.Color('#5090c0'),
  new THREE.Color('#c8a870'),
]

type Bld = { x: number; z: number; w: number; d: number; h: number; ci: number; delay: number }

function genCity(): Bld[] {
  const rng = mkRng(42)
  const out: Bld[] = []
  const G = 7, STEP = 7.2

  for (let gx = -G; gx <= G; gx++) {
    for (let gz = -G; gz <= G; gz++) {
      const cx = gx * STEP, cz = gz * STEP
      const dist = Math.sqrt(cx * cx + cz * cz)
      if (rng() < 0.09) continue
      const n = dist < 14 ? 2 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2)
      for (let k = 0; k < n; k++) {
        const w = 1.3 + rng() * 2.8
        const d = 1.3 + rng() * 2.8
        const h = dist < 10
          ? 3.5 + rng() * 18
          : 1.2 + rng() * 5.5
        out.push({
          x: cx + (rng() - 0.5) * STEP * 0.68,
          z: cz + (rng() - 0.5) * STEP * 0.68,
          w, d, h,
          ci: Math.floor(rng() * COLS.length),
          delay: dist * 2.6 + rng() * 10,
        })
      }
    }
  }
  return out
}

const BUILDINGS = genCity()

function easeOutBack(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c3 = 2.70158
  return 1 + c3 * Math.pow(t - 1, 3) + (c3 - 1) * Math.pow(t - 1, 2)
}

// ── Horizontal scan sweep ─────────────────────────────────────
function ScanPlane() {
  const ref = useRef<THREE.Mesh>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    t.current += delta
    if (!ref.current) return
    const cycle = (t.current % 5) / 5
    ref.current.position.z = -55 + cycle * 110
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.12 + Math.sin(cycle * Math.PI) * 0.28
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, -55]}>
      <planeGeometry args={[130, 3]} />
      <meshBasicMaterial color="#e31c3d" transparent opacity={0.2} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── City scene ────────────────────────────────────────────────
const BOX = new THREE.BoxGeometry(1, 1, 1)
const ROOF_MAT = new THREE.MeshLambertMaterial({ color: '#181820' })

function CityScene() {
  const { camera } = useThree()
  const bldRef  = useRef<THREE.InstancedMesh>(null)
  const roofRef = useRef<THREE.InstancedMesh>(null)
  const tick    = useRef(0)
  const dummy   = useMemo(() => new THREE.Object3D(), [])
  const col     = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    tick.current += delta * 60
    const mesh = bldRef.current
    const roof = roofRef.current
    if (!mesh || !roof) return

    for (let i = 0; i < BUILDINGS.length; i++) {
      const b = BUILDINGS[i]
      const raw = Math.max(0, (tick.current - b.delay) / 26)
      const p   = easeOutBack(Math.min(raw, 1))
      const sy  = b.h * Math.max(0.0001, p)

      dummy.position.set(b.x, sy * 0.5, b.z)
      dummy.scale.set(b.w, sy, b.d)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      col.copy(COLS[b.ci])
      mesh.setColorAt!(i, col)

      dummy.position.set(b.x, sy + 0.1, b.z)
      dummy.scale.set(b.w + 0.14, 0.2, b.d + 0.14)
      dummy.updateMatrix()
      roof.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    roof.instanceMatrix.needsUpdate = true

    // Slow orbiting camera — starts high, settles into 3/4 view
    const a = tick.current * 0.0018 + Math.PI * 0.28
    const r = 52, elevation = 24
    camera.position.set(Math.cos(a) * r, elevation, Math.sin(a) * r)
    camera.lookAt(0, 4, 0)
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[24, 40, 18]} intensity={2.8} color="#ffe8a8" castShadow />
      <directionalLight position={[-18, 14, -14]} intensity={0.85} color="#88b8e0" />
      <pointLight position={[0, 1, 0]} color="#e31c3d" intensity={1.2} distance={28} decay={2} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        <meshLambertMaterial color="#10100e" />
      </mesh>

      {/* Road grid lines */}
      <gridHelper args={[240, 34, '#1e1e16', '#1a1a14']} position={[0, 0.02, 0]} />

      {/* Buildings */}
      <instancedMesh ref={bldRef} args={[BOX, new THREE.MeshLambertMaterial(), BUILDINGS.length]} castShadow />

      {/* Roof caps */}
      <instancedMesh ref={roofRef} args={[BOX, ROOF_MAT, BUILDINGS.length]} />

      <ScanPlane />
    </>
  )
}

// ── HUD overlay ───────────────────────────────────────────────
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
          borderColor: 'rgba(210,172,88,0.40)', ...s,
          opacity: vis ? 1 : 0,
          transition: `opacity 0.4s ease ${0.2 + i * 0.08}s`,
        }} />
      ))}

      {/* Wordmark — Bebas Neue */}
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
        color: '#7a6d5e',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.6s ease 0.65s',
        marginBottom: 40,
      }}>
        Construction Ltd · Site Command
      </div>

      {/* Shimmer progress bar */}
      <div style={{
        width: 140, height: 1,
        background: 'rgba(210,172,88,0.12)',
        borderRadius: 1, overflow: 'hidden',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.4s ease 0.8s',
      }}>
        <div style={{
          height: '100%', width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.75), transparent)',
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
          letterSpacing: '0.18em', color: '#4a4038',
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

// ── Public component ──────────────────────────────────────────
interface CityLoaderProps {
  isLoading: boolean
  onDone?: () => void
}

export default function CityLoader({ isLoading, onDone }: CityLoaderProps) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [hudVis, setHudVis] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    const t = setTimeout(() => setHudVis(true), 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isLoading) return
    // Hold the scene for at least 2.4 s so the city has time to look great
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
    }}>
      {/* 3-D scene — full screen */}
      <Canvas
        camera={{ position: [52, 24, 52], fov: 46 }}
        gl={{ antialias: true }}
        shadows
        style={{ position: 'absolute', inset: 0 }}
      >
        <CityScene />
      </Canvas>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 45%, rgba(8,6,4,0.7) 100%)',
      }} />

      {/* HUD */}
      <HUD vis={hudVis} />
    </div>
  )
}
