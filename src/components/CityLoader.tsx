'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Scene constants ───────────────────────────────────────────── */
const ROAD_LEN  = 260
const ROAD_W    = 10
const TERRAIN_W = 90

/* ─── Road paving shader ────────────────────────────────────────── */
// UV.y=0 → near camera (Z≈0), UV.y=1 → far end (Z≈-ROAD_LEN)
const ROAD_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const ROAD_FRAG = `
  uniform float paving;
  varying vec2 vUv;
  void main() {
    float dist  = vUv.y;
    vec3 gravel  = vec3(0.72, 0.64, 0.46);
    vec3 asphalt = vec3(0.13, 0.13, 0.13);
    float paved  = 1.0 - smoothstep(paving - 0.028, paving + 0.028, dist);
    vec3 col = mix(gravel, asphalt, paved);
    // Centre dashes
    if (abs(vUv.x - 0.5) < 0.013 && paved > 0.6 && fract(dist * 22.0) < 0.55)
      col = mix(col, vec3(0.96, 0.94, 0.90), 0.88);
    // Edge lines
    if ((vUv.x < 0.033 || vUv.x > 0.967) && paved > 0.6)
      col = mix(col, vec3(0.88, 0.86, 0.80), 0.72);
    gl_FragColor = vec4(col, 1.0);
  }
`

function Road({ pav }: { pav: React.MutableRefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uni = useMemo(() => ({ paving: { value: 0.0 } }), [])
  useFrame(() => { if (mat.current) mat.current.uniforms.paving.value = pav.current })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -ROAD_LEN / 2]}>
      <planeGeometry args={[ROAD_W, ROAD_LEN, 1, 80]} />
      <shaderMaterial ref={mat} vertexShader={ROAD_VERT} fragmentShader={ROAD_FRAG} uniforms={uni} />
    </mesh>
  )
}

/* ─── Sandy terrain (both sides) ───────────────────────────────── */
function Terrain() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-(ROAD_W / 2 + TERRAIN_W / 2), 0, -ROAD_LEN / 2]}>
        <planeGeometry args={[TERRAIN_W, ROAD_LEN + 30]} />
        <meshLambertMaterial color="#b39060" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(ROAD_W / 2 + TERRAIN_W / 2), 0, -ROAD_LEN / 2]}>
        <planeGeometry args={[TERRAIN_W, ROAD_LEN + 30]} />
        <meshLambertMaterial color="#b39060" />
      </mesh>
    </>
  )
}

/* ─── Worker figure ─────────────────────────────────────────────── */
function Worker({ x, z, vest, phase }: { x: number; z: number; vest: string; phase: number }) {
  const ref  = useRef<THREE.Group>(null)
  const time = useRef(phase)
  useFrame((_, dt) => {
    if (!ref.current) return
    time.current += dt
    ref.current.position.y = Math.abs(Math.sin(time.current * 1.5 + phase)) * 0.07
  })
  return (
    <group ref={ref} position={[x, 0, z]}>
      {/* Left leg */}
      <mesh position={[-0.12, 0.38, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.75, 6]} />
        <meshLambertMaterial color="#2a2a38" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.12, 0.38, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.75, 6]} />
        <meshLambertMaterial color="#2a2a38" />
      </mesh>
      {/* Body / high-vis vest */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.25, 0.27, 0.88, 8]} />
        <meshLambertMaterial color={vest} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.36, 1.02, 0]} rotation={[0, 0, 0.45]}>
        <cylinderGeometry args={[0.07, 0.07, 0.55, 6]} />
        <meshLambertMaterial color={vest} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.36, 1.02, 0]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.07, 0.07, 0.55, 6]} />
        <meshLambertMaterial color={vest} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.64, 0]}>
        <sphereGeometry args={[0.19, 8, 8]} />
        <meshLambertMaterial color="#c97c4a" />
      </mesh>
      {/* Hard hat */}
      <mesh position={[0, 1.80, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.16, 12]} />
        <meshLambertMaterial color="#f5c800" />
      </mesh>
    </group>
  )
}

/* ─── Road roller ───────────────────────────────────────────────── */
function Roller({ pav }: { pav: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = -(ROAD_LEN * pav.current) + 14
  })
  return (
    <group ref={ref} position={[-1.5, 0, 14]}>
      {/* Chassis */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[3.0, 2.2, 5.5]} />
        <meshLambertMaterial color="#d06010" />
      </mesh>
      {/* Cab */}
      <mesh position={[0, 2.8, 0.7]}>
        <boxGeometry args={[2.2, 1.2, 2.4]} />
        <meshLambertMaterial color="#e07020" />
      </mesh>
      {/* Front drum */}
      <mesh position={[0, 0.72, 3.0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.72, 2.8, 16]} />
        <meshLambertMaterial color="#484848" />
      </mesh>
      {/* Rear drum */}
      <mesh position={[0, 0.72, -3.0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.72, 0.72, 2.8, 16]} />
        <meshLambertMaterial color="#484848" />
      </mesh>
    </group>
  )
}

/* ─── Asphalt paver machine ─────────────────────────────────────── */
function Paver({ pav }: { pav: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = -(ROAD_LEN * pav.current) + 3
  })
  return (
    <group ref={ref} position={[0, 0, 3]}>
      {/* Wide screed body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[9.2, 1.1, 5.0]} />
        <meshLambertMaterial color="#bb4400" />
      </mesh>
      {/* Hopper (receives asphalt) */}
      <mesh position={[0, 1.8, 1.6]}>
        <boxGeometry args={[4.8, 1.5, 3.0]} />
        <meshLambertMaterial color="#993300" />
      </mesh>
      {/* Left crawler track */}
      <mesh position={[-4.0, 0.32, 0]}>
        <boxGeometry args={[1.1, 0.64, 5.0]} />
        <meshLambertMaterial color="#303030" />
      </mesh>
      {/* Right crawler track */}
      <mesh position={[4.0, 0.32, 0]}>
        <boxGeometry args={[1.1, 0.64, 5.0]} />
        <meshLambertMaterial color="#303030" />
      </mesh>
    </group>
  )
}

/* ─── Dump truck (parked, supplying the paver) ──────────────────── */
function DumpTruck() {
  return (
    <group position={[0, 0, -12]}>
      {/* Cab */}
      <mesh position={[0, 1.5, 2.8]}>
        <boxGeometry args={[3.2, 2.8, 3.0]} />
        <meshLambertMaterial color="#e8a020" />
      </mesh>
      {/* Bed */}
      <mesh position={[0, 1.8, -1.8]}>
        <boxGeometry args={[3.2, 2.2, 6.5]} />
        <meshLambertMaterial color="#d09010" />
      </mesh>
      {/* Wheels */}
      {([-2.5, 2.5] as number[]).flatMap(x =>
        ([-3.2, 0, 2.8] as number[]).map(wz => (
          <mesh key={`${x}_${wz}`} position={[x, 0.55, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.55, 0.55, 0.5, 12]} />
            <meshLambertMaterial color="#222" />
          </mesh>
        ))
      )}
    </group>
  )
}

/* ─── Worker positions ──────────────────────────────────────────── */
const WORKERS: [number, number, string, number][] = [
  [-4,   -5,  '#f59e0b', 0.0],
  [ 4.5, -10, '#f97316', 0.8],
  [-3,   -20, '#f59e0b', 1.4],
  [ 3.5, -28, '#eab308', 0.4],
  [-4.5, -38, '#f59e0b', 1.1],
  [ 2,   -15, '#f97316', 0.2],
  [-2,   -48, '#f59e0b', 0.7],
  [ 4,   -55, '#eab308', 1.8],
  [-3.5, -62, '#f59e0b', 0.9],
]

/* ─── Main scene (camera + all objects) ─────────────────────────── */
function Scene() {
  const { camera, scene } = useThree()
  const tick   = useRef(0)
  const paving = useRef(0)
  const TOTAL  = 7.5

  useEffect(() => {
    scene.background = new THREE.Color('#88c8e8')
    scene.fog = new THREE.FogExp2('#88c8e8', 0.0045)
    return () => { scene.fog = null; scene.background = null }
  }, [scene])

  useFrame((_, delta) => {
    tick.current += delta
    const t = Math.min(tick.current / TOTAL, 1)

    // Paving front: 0 → 1 over first 58% of animation
    paving.current = Math.min(t / 0.58, 1)

    if (t < 0.62) {
      // Ground-level tracking shot — camera advances alongside paving
      const p   = t / 0.62
      const camZ = 28 - p * 55
      camera.position.set(7, 5.5, camZ)
      camera.lookAt(0, 1.5, camZ - 32)
    } else {
      // Drone rise to aerial
      const r = (t - 0.62) / 0.38
      const e = r < 0.5 ? 2 * r * r : 1 - Math.pow(-2 * r + 2, 2) / 2
      camera.position.set(7 - e * 3, 5.5 + e * 160, -27 - e * 95)
      camera.lookAt(0, 0, -90 - e * 70)
    }
  })

  return (
    <>
      {/* Daylight lighting */}
      <ambientLight intensity={0.78} color="#ffe8cc" />
      <directionalLight position={[35, 65, 25]} intensity={2.9} color="#fff5e0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[-25, 30, -20]} intensity={0.55} color="#cce8ff" />

      <Road pav={paving} />
      <Terrain />
      <Paver pav={paving} />
      <Roller pav={paving} />
      <DumpTruck />

      {WORKERS.map(([x, z, vest, phase], i) => (
        <Worker key={i} x={x} z={z} vest={vest} phase={phase} />
      ))}
    </>
  )
}

/* ─── HUD overlay ───────────────────────────────────────────────── */
function HUD({ vis }: { vis: boolean }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', padding: '0 24px',
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
          borderColor: 'rgba(210,172,88,0.55)', ...s,
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
        {'HITECH'.split('').map((ch, i) => (
          <span key={i} style={{
            display: 'inline-block', color: '#ede8de',
            textShadow: '0 2px 24px rgba(0,0,0,0.55)',
            opacity: 0,
            animation: vis ? `charIn 0.55s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.07}s forwards` : 'none',
          }}>{ch}</span>
        ))}
      </div>

      {/* Sub-label */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
        letterSpacing: '0.26em', textTransform: 'uppercase',
        color: 'rgba(230,210,170,0.9)',
        textShadow: '0 1px 10px rgba(0,0,0,0.55)',
        opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease 0.65s',
        marginBottom: 40,
      }}>
        Construction Ltd · Site Command
      </div>

      {/* Shimmer bar */}
      <div style={{
        width: 140, height: 1,
        background: 'rgba(210,172,88,0.15)',
        borderRadius: 1, overflow: 'hidden',
        opacity: vis ? 1 : 0, transition: 'opacity 0.4s ease 0.8s',
      }}>
        <div style={{
          height: '100%', width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.9), transparent)',
          animation: 'shimmerSlide 1.6s ease-in-out infinite',
        }} />
      </div>

      {/* Bottom rule */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: vis ? 120 : 0, height: '0.5px',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.5), transparent)',
          transition: 'width 1.1s ease 0.7s',
        }} />
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(210,190,150,0.55)',
          textShadow: '0 1px 6px rgba(0,0,0,0.5)',
          opacity: vis ? 1 : 0, transition: 'opacity 0.5s ease 1.6s',
        }}>v2026.05</div>
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

/* ─── Public component ──────────────────────────────────────────── */
interface CityLoaderProps {
  isLoading: boolean
  onDone?: () => void
}

export default function CityLoader({ isLoading, onDone }: CityLoaderProps) {
  const [visible, setVisible] = useState(true)
  const [fading,  setFading]  = useState(false)
  const [hudVis,  setHudVis]  = useState(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    const t = setTimeout(() => setHudVis(true), 120)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isLoading) return
    const t = setTimeout(() => {
      setFading(true)
      const t2 = setTimeout(() => { setVisible(false); onDoneRef.current?.() }, 900)
      return () => clearTimeout(t2)
    }, 2400)
    return () => clearTimeout(t)
  }, [isLoading])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#88c8e8',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.9s ease',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <Canvas
        camera={{ position: [7, 5.5, 30], fov: 50 }}
        gl={{ antialias: true }}
        shadows
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 38%, rgba(0,0,0,0.28) 100%)',
      }} />

      <HUD vis={hudVis} />
    </div>
  )
}
