'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Scene constants ───────────────────────────────────────────── */
const ROAD_LEN = 320
const ROAD_W   = 12

/* ─── Road shader ───────────────────────────────────────────────── */
// UV.y: 0 = near (Z≈0), 1 = far (Z≈−ROAD_LEN)
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
    float dist = vUv.y;

    vec3 gravel  = vec3(0.38, 0.34, 0.26);
    vec3 asphalt = vec3(0.09, 0.09, 0.09);

    // Paving front
    float paved = 1.0 - smoothstep(paving - 0.022, paving + 0.022, dist);
    vec3 col = mix(gravel, asphalt, paved);

    // Heat glow — warm orange band on freshly laid asphalt behind the front
    float heatAmt = paved * smoothstep(max(paving - 0.18, 0.0), paving - 0.005, dist);
    col += vec3(0.45, 0.18, 0.02) * heatAmt * 0.75;

    // Sodium-light sheen on paved surface
    float sheen = paved * (1.0 - heatAmt) * (1.0 - abs(vUv.x - 0.5) * 2.0) * 0.18;
    col += vec3(0.30, 0.22, 0.08) * sheen;

    // Centre dashes (white)
    if (abs(vUv.x - 0.5) < 0.011 && paved > 0.6 && fract(dist * 20.0) < 0.50)
      col = mix(col, vec3(0.92, 0.90, 0.84), 0.82);

    // Edge lines
    if ((vUv.x < 0.032 || vUv.x > 0.968) && paved > 0.6)
      col = mix(col, vec3(0.80, 0.76, 0.58), 0.65);

    gl_FragColor = vec4(col, 1.0);
  }
`

function Road({ pav }: { pav: React.MutableRefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uni = useMemo(() => ({ paving: { value: 0.0 } }), [])
  useFrame(() => { if (mat.current) mat.current.uniforms.paving.value = pav.current })
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -ROAD_LEN / 2]}>
      <planeGeometry args={[ROAD_W, ROAD_LEN, 1, 100]} />
      <shaderMaterial ref={mat} vertexShader={ROAD_VERT} fragmentShader={ROAD_FRAG} uniforms={uni} />
    </mesh>
  )
}

/* ─── Dark ground ───────────────────────────────────────────────── */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -ROAD_LEN / 2]}>
      <planeGeometry args={[600, ROAD_LEN + 80]} />
      <meshStandardMaterial color="#0c0c0a" roughness={1} />
    </mesh>
  )
}

/* ─── Sodium work lights that follow the paving front ───────────── */
function WorkLights({ pav }: { pav: React.MutableRefObject<number> }) {
  const l1 = useRef<THREE.PointLight>(null)
  const l2 = useRef<THREE.PointLight>(null)
  useFrame(() => {
    const z = -(ROAD_LEN * pav.current)
    if (l1.current) l1.current.position.set(-9, 14, z + 10)
    if (l2.current) l2.current.position.set( 9, 14, z + 10)
  })
  return (
    <>
      <pointLight ref={l1} color="#ffb347" intensity={120} distance={60} decay={2} />
      <pointLight ref={l2} color="#ffb347" intensity={120} distance={60} decay={2} />
    </>
  )
}

/* ─── Light poles alongside road ────────────────────────────────── */
function LightPoles() {
  const positions: [number, number][] = []
  for (let z = -20; z > -ROAD_LEN; z -= 40) {
    positions.push([-8, z], [8, z])
  }
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Pole */}
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 10, 6]} />
            <meshStandardMaterial color="#444" roughness={0.8} />
          </mesh>
          {/* Arm */}
          <mesh position={[x < 0 ? 1.2 : -1.2, 10, 0]} rotation={[0, 0, x < 0 ? -0.3 : 0.3]}>
            <cylinderGeometry args={[0.07, 0.07, 2.8, 6]} />
            <meshStandardMaterial color="#444" roughness={0.8} />
          </mesh>
          {/* Lamp head */}
          <mesh position={[x < 0 ? 2.2 : -2.2, 10.4, 0]}>
            <boxGeometry args={[1.0, 0.35, 0.6]} />
            <meshStandardMaterial color="#333" roughness={0.5} />
          </mesh>
          {/* Light source */}
          <pointLight
            position={[x < 0 ? 2.2 : -2.2, 9.8, 0]}
            color="#ffcc66"
            intensity={18}
            distance={30}
            decay={2}
          />
        </group>
      ))}
    </group>
  )
}

/* ─── Road roller ───────────────────────────────────────────────── */
function Roller({ pav }: { pav: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = -(ROAD_LEN * pav.current) + 18
  })
  return (
    <group ref={ref} position={[-2, 0, 18]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.2, 2.4, 6]} />
        <meshStandardMaterial color="#c85010" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 2.9, 0.8]}>
        <boxGeometry args={[2.4, 1.2, 2.6]} />
        <meshStandardMaterial color="#d06020" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Headlights */}
      <pointLight position={[0, 2.2, 3.5]} color="#fff4cc" intensity={8} distance={18} decay={2} />
      {/* Front drum */}
      <mesh position={[0, 0.75, 3.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.75, 0.75, 3.0, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Rear drum */}
      <mesh position={[0, 0.75, -3.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.75, 0.75, 3.0, 16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} metalness={0.5} />
      </mesh>
    </group>
  )
}

/* ─── Asphalt paver ─────────────────────────────────────────────── */
function Paver({ pav }: { pav: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.z = -(ROAD_LEN * pav.current) + 4
  })
  return (
    <group ref={ref} position={[0, 0, 4]}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[10.5, 1.2, 5.5]} />
        <meshStandardMaterial color="#a83800" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.9, 1.6]}>
        <boxGeometry args={[5.0, 1.6, 3.2]} />
        <meshStandardMaterial color="#962e00" roughness={0.5} />
      </mesh>
      {/* Work light on paver */}
      <pointLight position={[0, 3.5, 0]} color="#ffaa44" intensity={15} distance={20} decay={2} />
      {/* Tracks */}
      <mesh position={[-4.4, 0.32, 0]}>
        <boxGeometry args={[1.2, 0.64, 5.5]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      <mesh position={[4.4, 0.32, 0]}>
        <boxGeometry args={[1.2, 0.64, 5.5]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ─── Dump truck ────────────────────────────────────────────────── */
function DumpTruck() {
  return (
    <group position={[0, 0, -16]}>
      <mesh position={[0, 1.6, 2.8]}>
        <boxGeometry args={[3.2, 3.0, 3.2]} />
        <meshStandardMaterial color="#cc7700" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.9, -1.8]}>
        <boxGeometry args={[3.2, 2.4, 7.0]} />
        <meshStandardMaterial color="#bb6600" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 3.8, 4.8]} color="#fff4cc" intensity={6} distance={14} decay={2} />
      {([-1.8, 1.8] as number[]).flatMap(x =>
        ([-3.6, 0, 3.0] as number[]).map(wz => (
          <mesh key={`${x}_${wz}`} position={[x, 0.58, wz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.58, 0.58, 0.52, 12]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  )
}

/* ─── Stars ─────────────────────────────────────────────────────── */
function Stars() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = 1200
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 800
      pos[i * 3 + 1] = 60 + Math.random() * 200
      pos[i * 3 + 2] = (Math.random() - 0.5) * 800
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  return (
    <points geometry={geo}>
      <pointsMaterial color="#ffffff" size={0.35} sizeAttenuation transparent opacity={0.7} />
    </points>
  )
}

/* ─── Main scene ────────────────────────────────────────────────── */
function Scene() {
  const { camera, scene } = useThree()
  const tick   = useRef(0)
  const paving = useRef(0)
  const TOTAL  = 8.0

  useEffect(() => {
    scene.background = new THREE.Color('#08101e')
    scene.fog = new THREE.FogExp2('#08101e', 0.004)
    return () => { scene.fog = null; scene.background = null }
  }, [scene])

  useFrame((_, delta) => {
    tick.current += delta
    const t = Math.min(tick.current / TOTAL, 1)

    paving.current = Math.min(t / 0.58, 1)

    if (t < 0.62) {
      // Ground-level tracking shot — low, dramatic angle
      const p    = t / 0.62
      const camZ = 30 - p * 65
      camera.position.set(5, 4, camZ)
      camera.lookAt(0.5, 1.0, camZ - 28)
    } else {
      // Drone rise
      const r = (t - 0.62) / 0.38
      const e = r < 0.5 ? 2 * r * r : 1 - Math.pow(-2 * r + 2, 2) / 2
      camera.position.set(5 - e * 1, 4 + e * 170, -35 - e * 110)
      camera.lookAt(0, 0, -100 - e * 80)
    }
  })

  return (
    <>
      {/* Moonlight (cool blue-white from above) */}
      <ambientLight intensity={0.15} color="#1a2a4a" />
      <directionalLight position={[-30, 80, 40]} intensity={0.6} color="#b8d0f0" />

      <Stars />
      <Ground />
      <Road pav={paving} />
      <WorkLights pav={paving} />
      <LightPoles />
      <Paver pav={paving} />
      <Roller pav={paving} />
      <DumpTruck />
    </>
  )
}

/* ─── HUD ───────────────────────────────────────────────────────── */
function HUD({ vis }: { vis: boolean }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none', padding: '0 24px',
    }}>
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

      <div style={{
        fontFamily: 'var(--font-loader)', fontWeight: 400,
        fontSize: 'clamp(4.5rem, 15vw, 8rem)',
        letterSpacing: '0.12em', lineHeight: 1,
        marginBottom: 12, textTransform: 'uppercase',
      }}>
        {'HITECH'.split('').map((ch, i) => (
          <span key={i} style={{
            display: 'inline-block', color: '#ede8de',
            textShadow: '0 2px 32px rgba(0,0,0,0.9), 0 0 60px rgba(255,180,80,0.15)',
            opacity: 0,
            animation: vis ? `charIn 0.55s cubic-bezier(0.16,1,0.3,1) ${0.08 + i * 0.07}s forwards` : 'none',
          }}>{ch}</span>
        ))}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
        letterSpacing: '0.26em', textTransform: 'uppercase',
        color: 'rgba(210,190,150,0.75)',
        textShadow: '0 1px 12px rgba(0,0,0,0.9)',
        opacity: vis ? 1 : 0, transition: 'opacity 0.6s ease 0.65s',
        marginBottom: 40,
      }}>
        Construction Ltd · Site Command
      </div>

      <div style={{
        width: 140, height: 1,
        background: 'rgba(210,172,88,0.12)',
        borderRadius: 1, overflow: 'hidden',
        opacity: vis ? 1 : 0, transition: 'opacity 0.4s ease 0.8s',
      }}>
        <div style={{
          height: '100%', width: '45%',
          background: 'linear-gradient(90deg, transparent, rgba(210,172,88,0.9), transparent)',
          animation: 'shimmerSlide 1.6s ease-in-out infinite',
        }} />
      </div>

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
          color: 'rgba(200,180,140,0.45)',
          textShadow: '0 1px 8px rgba(0,0,0,0.9)',
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
      background: '#08101e',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.9s ease',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      <Canvas
        camera={{ position: [5, 4, 30], fov: 52 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        shadows
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 35%, rgba(4,8,16,0.55) 100%)',
      }} />

      <HUD vis={hudVis} />
    </div>
  )
}
