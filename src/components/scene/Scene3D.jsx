/**
 * Scene3D.jsx — Enhanced 3D Visualization
 *
 * Renders a full 3D battlefield with:
 *  - Multiple UAVs orbiting at different radii/speeds
 *  - Signal beam tube (green→yellow→red based on SNR)
 *  - Animated jamming wave rings travelling toward UAVs
 *  - GCS station with rotating dish
 *  - Jammer truck with spinning antenna
 *  - Low-poly buildings and trees
 *  - Terrain with colour variation
 *  - Skybox gradient
 *  - Range circles (GCS range, jammer radius)
 *  - Directional jammer cone visualization
 *  - Orbit + follow-UAV camera controls
 *  - Mini-map overlay (2D top-down heatmap)
 */

import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore, GCS_POS, JAM_POS } from '../../store/simStore'

// ── Colour Helpers ────────────────────────────────────────────────────────────
function statusColor(s) {
  return s === 'SECURE'   ? '#10b981'
       : s === 'DEGRADED' ? '#f59e0b'
       : s === 'CRITICAL' ? '#ef4444'
       :                    '#6b7280'
}

// ── Sky (daytime gradient dome) ───────────────────────────────────────────────
function Sky() {
  return (
    <mesh scale={[180, 180, 180]}>
      <sphereGeometry args={[1, 32, 16]} />
      <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
    </mesh>
  )
}

// ── Clouds ────────────────────────────────────────────────────────────────────
function Clouds() {
  const clouds = [
    { pos: [30, 40, -60], sx: 18, sz: 6 },
    { pos: [-50, 45, -50], sx: 22, sz: 7 },
    { pos: [0, 50, -80],  sx: 28, sz: 8 },
    { pos: [60, 38, 20],  sx: 14, sz: 5 },
    { pos: [-30, 42, 30], sx: 16, sz: 5 },
  ]
  return (
    <>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} scale={[c.sx, 1, c.sz]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={1} />
        </mesh>
      ))}
    </>
  )
}

// ── Terrain ───────────────────────────────────────────────────────────────────
function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(100, 100, 40, 40)
    const pos = g.attributes.position
    // Add subtle height variation for organic feel
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const h = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.4
             + Math.sin(x * 0.05 + 1) * 0.3
      pos.setZ(i, h)
    }
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <meshStandardMaterial color="#7ec850" roughness={0.85} metalness={0} />
      </mesh>
      {/* Grid overlay */}
      <Grid
        args={[100, 100]}
        cellSize={2} cellThickness={0.3} cellColor="#a8d878"
        sectionSize={10} sectionThickness={0.6} sectionColor="#6db840"
        fadeDistance={55} fadeStrength={1.5}
        followCamera={false} infiniteGrid={false}
        position={[0, -0.28, 0]}
      />
    </>
  )
}

// ── Building ──────────────────────────────────────────────────────────────────
function Building({ position, width, depth, height, color = '#cbd5e1' }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Rooftop details */}
      <mesh position={[0, height + 0.15, 0]}>
        <boxGeometry args={[width * 0.8, 0.3, depth * 0.8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Windows (emissive strips) */}
      {Array.from({ length: Math.floor(height / 1.5) }).map((_, row) => (
        <mesh key={row} position={[width / 2 + 0.01, 0.8 + row * 1.5, 0]}>
          <planeGeometry args={[0.02, 0.6, 1, Math.floor(depth / 0.8)]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

// ── Tree ──────────────────────────────────────────────────────────────────────
function Tree({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.0, 0]}>
        <coneGeometry args={[0.8, 2.2, 7]} />
        <meshStandardMaterial color="#1a4a1a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <coneGeometry args={[0.55, 1.8, 7]} />
        <meshStandardMaterial color="#1e5a1e" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ── Scene Environment (buildings, trees) ──────────────────────────────────────
const BUILDINGS = [
  { pos: [-20, 0, -12], w: 3.5, d: 3,   h: 6,  col: '#1c2c3c' },
  { pos: [-18, 0, -18], w: 4,   d: 5,   h: 9,  col: '#1a2840' },
  { pos: [-25, 0, -8],  w: 2.5, d: 2.5, h: 4,  col: '#2a3040' },
  { pos: [18,  0, -15], w: 3,   d: 3.5, h: 7,  col: '#1c2030' },
  { pos: [22,  0, -20], w: 5,   d: 4,   h: 12, col: '#18283a' },
  { pos: [-5,  0, -22], w: 4,   d: 3,   h: 5,  col: '#202a38' },
  { pos: [10,  0, -18], w: 3,   d: 4,   h: 8,  col: '#1e2c3c' },
  { pos: [-15, 0, 18],  w: 3,   d: 3,   h: 5,  col: '#1a2a30' },
  { pos: [20,  0, 15],  w: 4,   d: 3,   h: 6,  col: '#1c283a' },
]
const TREES = [
  [-6, 0, -8], [4, 0, -10], [-12, 0, 6], [14, 0, 3],
  [-8, 0, 14], [6, 0, 12], [-18, 0, 0], [16, 0, -6],
  [0, 0, -16], [-4, 0, 16], [8, 0, -4], [-14, 0, -4],
]

function Environment() {
  return (
    <>
      {BUILDINGS.map((b, i) => (
        <Building key={i} position={b.pos} width={b.w} depth={b.d} height={b.h} color={b.col} />
      ))}
      {TREES.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </>
  )
}

// ── GCS Station ───────────────────────────────────────────────────────────────
function GCS({ position, gcsPower, signalActive }) {
  const dishRef  = useRef()
  const beamRef  = useRef()
  const ledRef   = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (dishRef.current) dishRef.current.rotation.y = Math.sin(t * 0.6) * 0.5
    if (beamRef.current) beamRef.current.material.opacity = 0.08 + 0.06 * Math.sin(t * 3)
    if (ledRef.current) {
      ledRef.current.material.emissiveIntensity = signalActive ? (1.5 + Math.sin(t * 4)) : 0.2
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.25, 1.6]} />
        <meshStandardMaterial color="#1e40af" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.9, 0.8, 1.4]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.65} roughness={0.3} />
      </mesh>
      {[-0.5, 0, 0.5].map((z, i) => (
        <mesh key={i} position={[0.96, 0.65, z]}>
          <boxGeometry args={[0.02, 0.18, 0.22]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#bae6fd" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 1.6, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={dishRef} position={[0, 2.35, 0]}>
        <mesh rotation={[Math.PI / 5, 0, 0]}>
          <torusGeometry args={[0.6, 0.055, 10, 24]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.92} roughness={0.08} />
        </mesh>
        <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 5, 0, 0]}>
          <circleGeometry args={[0.55, 24]} />
          <meshStandardMaterial color="#0369a1" transparent opacity={0.65} side={THREE.DoubleSide} metalness={0.7} />
        </mesh>
      </group>
      <mesh ref={beamRef} position={[0, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[2, 6, 16, 1, true]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ledRef} position={[0, 1.07, 0.71]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color="#0ea5e9" intensity={0.8} distance={8} />
      <Text position={[0, 3.4, 0]} fontSize={0.3} color="#0ea5e9" anchorX="center"
        outlineWidth={0.03} outlineColor="#000000">GCS</Text>
      <Text position={[0, 2.95, 0]} fontSize={0.18} color="#8b949e" anchorX="center">
        {gcsPower}W TX
      </Text>
    </group>
  )
}

// ── Jammer ────────────────────────────────────────────────────────────────────
function Jammer({ position, power, jammingType, directional, bearing }) {
  const spinRef    = useRef()
  const pulseRef   = useRef()
  const coneRef    = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const speed = jammingType === 'spot' ? 2.8 : jammingType === 'barrage' ? 4.0 : 1.8
    if (spinRef.current) {
      if (directional) {
        // Directional: locked to bearing
        spinRef.current.rotation.y = bearing
      } else {
        spinRef.current.rotation.y = t * speed
      }
    }
    if (pulseRef.current) {
      const s = 1 + (power / 100) * 0.5 * Math.abs(Math.sin(t * 5))
      pulseRef.current.scale.setScalar(s)
      pulseRef.current.material.opacity = 0.04 + (power / 100) * 0.12 * Math.abs(Math.sin(t * 5))
    }
    if (coneRef.current) {
      coneRef.current.material.opacity = directional ? 0.08 + 0.04 * Math.sin(t * 2) : 0
    }
  })

  return (
    <group position={position}>
      <pointLight color="#a855f7" intensity={(power / 100) * 2} distance={15} />
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.4, 1.0, 1.5]} />
        <meshStandardMaterial color="#7f1d1d" metalness={0.55} roughness={0.45} />
      </mesh>
      <mesh position={[-0.85, 1.05, 0]}>
        <boxGeometry args={[0.75, 0.7, 1.4]} />
        <meshStandardMaterial color="#6b1414" metalness={0.5} roughness={0.5} />
      </mesh>
      {[[-0.9, -0.1, 0.9], [0.8, -0.1, 0.9], [-0.9, -0.1, -0.9], [0.8, -0.1, -0.9]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.25, 10]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
      <mesh position={[0.5, 1.6, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 1.8, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {[-0.45, 0, 0.45].map((z, i) => (
        <mesh key={i} position={[0.5, 2.7, z]}>
          <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
        </mesh>
      ))}
      {/* Rotating antenna array */}
      <group ref={spinRef} position={[0.5, 3.5, 0]}>
        <mesh>
          <torusGeometry args={[0.4, 0.045, 8, 20]} />
          <meshStandardMaterial color="#c084fc" metalness={0.85} roughness={0.1} emissive="#c084fc" emissiveIntensity={0.4} />
        </mesh>
        {[0, Math.PI / 3, 2 * Math.PI / 3].map((a, i) => (
          <mesh key={i} rotation={[0, a, 0]}>
            <boxGeometry args={[0.75, 0.03, 0.06]} />
            <meshStandardMaterial color="#a855f7" transparent opacity={0.8} />
          </mesh>
        ))}
        {/* Directional cone */}
        <mesh ref={coneRef} position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.5, 4, 16, 1, true]} />
          <meshStandardMaterial color="#a855f7" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      {/* Power glow */}
      <mesh ref={pulseRef} position={[0.5, 2.5, 0]}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshStandardMaterial color="#a855f7" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <Text position={[0, 4.8, 0]} fontSize={0.28} color="#a855f7" anchorX="center"
        outlineWidth={0.03} outlineColor="#000000">JAMMER</Text>
      <Text position={[0, 4.4, 0]} fontSize={0.17} color="#8b949e" anchorX="center">
        {power.toFixed(0)}W · {jammingType.toUpperCase()}
      </Text>
    </group>
  )
}

// ── Single UAV ────────────────────────────────────────────────────────────────
function UAV({ uav }) {
  const groupRef = useRef()
  const glowRef  = useRef()
  const propRefs = [useRef(), useRef(), useRef(), useRef()]
  const col      = statusColor(uav.linkStatus)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.08 + uav.linkQuality * 0.15 + Math.sin(t * 4) * 0.04
      glowRef.current.material.color.set(col)
    }
    propRefs.forEach(r => { if (r.current) r.current.rotation.y += 0.55 })
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 0.4 + uav.id) * 0.08
    }
  })

  const armPositions = [[-0.85, 0, -0.85], [0.85, 0, -0.85], [-0.85, 0, 0.85], [0.85, 0, 0.85]]

  return (
    <group ref={groupRef} position={uav.pos}>
      <pointLight color={col} intensity={1.0} distance={5} />
      <mesh castShadow>
        <boxGeometry args={[1.3, 0.22, 0.48]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>
      {armPositions.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh rotation={[0, i < 2 ? Math.PI / 4 : -Math.PI / 4, 0]}>
            <boxGeometry args={[1.1, 0.06, 0.07]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.1, 10]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.8} metalness={0.7} roughness={0.2} />
          </mesh>
          <group ref={propRefs[i]} position={[0, 0.13, 0]}>
            <mesh>
              <boxGeometry args={[0.75, 0.02, 0.11]} />
              <meshStandardMaterial color="#475569" transparent opacity={0.75} metalness={0.5} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.75, 0.02, 0.11]} />
              <meshStandardMaterial color="#475569" transparent opacity={0.75} metalness={0.5} />
            </mesh>
          </group>
        </group>
      ))}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshStandardMaterial color={col} transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <Text position={[0, 1.9, 0]} fontSize={0.28} color={col} anchorX="center"
        outlineWidth={0.03} outlineColor="#000">
        {`UAV-${uav.id}`}
      </Text>
      <Text position={[0, 1.52, 0]} fontSize={0.18} color={col} anchorX="center">
        {uav.linkStatus}
      </Text>
    </group>
  )
}

// ── UAV Trail ─────────────────────────────────────────────────────────────────
function UAVTrail({ trail, color }) {
  const geo = useMemo(() => {
    if (trail.length < 2) return null
    const pts = trail.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [trail])

  if (!geo) return null
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={0.30} linewidth={1} />
    </line>
  )
}

// ── Threat Aura ───────────────────────────────────────────────────────────────
function ThreatAura({ position, threatLevel }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t  = clock.elapsedTime
    const s  = 1 + threatLevel * 1.5 * Math.abs(Math.sin(t * 6 + 1))
    ref.current.scale.setScalar(s)
    ref.current.material.opacity = threatLevel * 0.15 * Math.abs(Math.sin(t * 6))
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[2.2, 16, 16]} />
      <meshStandardMaterial color="#ef4444" transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

// ── Signal Beam (animated pulse along tube) ───────────────────────────────────
function SignalBeam({ from, to, linkStatus, linkQuality }) {
  const matRef = useRef()

  const curve = useMemo(() => {
    const f  = new THREE.Vector3(...from)
    const t2 = new THREE.Vector3(...to)
    const mid = new THREE.Vector3().lerpVectors(f, t2, 0.5)
    mid.y += 2.5
    return new THREE.QuadraticBezierCurve3(f, mid, t2)
  }, [from[0], from[1], from[2], to[0], to[1], to[2]])

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.055, 6, false), [curve])
  const lineGeo = useMemo(() => {
    const pts = curve.getPoints(60)
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [curve])

  const col = statusColor(linkStatus)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!matRef.current) return
    if (linkStatus === 'LOST') {
      matRef.current.opacity = Math.max(0, Math.abs(Math.sin(t * 12)) * 0.3)
    } else {
      matRef.current.opacity = 0.3 + linkQuality * 0.5 + Math.sin(t * 5) * 0.07
    }
    matRef.current.color.set(col)
    matRef.current.emissive.set(col)
  })

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial ref={matRef} color={col} emissive={col}
          emissiveIntensity={1.0} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <line geometry={lineGeo}>
        <lineBasicMaterial color={col} transparent opacity={0.8} />
      </line>
    </group>
  )
}

// ── Jamming Waves (animated rings) ───────────────────────────────────────────
function JammingWaves({ from, to, power, jammingType }) {
  const COUNT  = jammingType === 'barrage' ? 8 : jammingType === 'spot' ? 6 : 5
  const rings  = useRef([])
  const fromV  = useMemo(() => new THREE.Vector3(...from), [from[0], from[1], from[2]])
  const toV    = useMemo(() => new THREE.Vector3(...to),   [to[0],   to[1],   to[2]])
  const speed  = jammingType === 'spot' ? 2.2 : jammingType === 'barrage' ? 3.5 : 1.5
  const col    = jammingType === 'deception' ? '#f59e0b' : '#a855f7'

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const phase = ((t * speed + i / COUNT) % 1)
      ring.position.lerpVectors(fromV, toV, phase)
      ring.scale.setScalar(0.2 + phase * (0.9 + power / 100))
      ring.material.opacity = Math.pow(1 - phase, 1.4) * 0.65 * (power / 100)
    })
  })

  return (
    <group>
      {Array.from({ length: COUNT }).map((_, i) => (
        <mesh key={i} ref={el => rings.current[i] = el}>
          <torusGeometry args={[1, 0.06, 8, 20]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.2}
            transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ── Signal Pulse (outward rings from GCS) ─────────────────────────────────────
function SignalPulses({ position, color, count = 4 }) {
  const rings = useRef([])
  const posV  = useMemo(() => new THREE.Vector3(...position), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const phase = ((t * 0.5 + i / count) % 1)
      const s = phase * 6
      ring.scale.setScalar(s)
      ring.material.opacity = (1 - phase) * 0.4
    })
  })

  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={el => rings.current[i] = el} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.04, 6, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ── Range Circle ──────────────────────────────────────────────────────────────
function RangeCircle({ cx, cz, radius, color }) {
  const geo = useMemo(() => {
    const pts = []
    const segs = 64
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2
      pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, 0.05, cz + Math.sin(a) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [cx, cz, radius])

  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.3 + 0.15 * Math.sin(clock.elapsedTime * 2)
  })

  return (
    <line geometry={geo}>
      <lineBasicMaterial ref={matRef} color={color} transparent opacity={0.3} />
    </line>
  )
}

// ── Directional Cone Visualizer ───────────────────────────────────────────────
function DirectionalCone({ position, bearing, power }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.06 + 0.04 * Math.sin(clock.elapsedTime * 2)
    }
  })
  return (
    <group position={position} rotation={[0, -bearing, 0]}>
      <mesh ref={ref} position={[0, 0.5, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[Math.tan(Math.PI / 6) * 12, 12, 16, 1, true]} />
        <meshStandardMaterial color="#a855f7" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Adaptive Lighting ─────────────────────────────────────────────────────────
function AdaptiveLight({ linkStatus }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.intensity = linkStatus === 'LOST'
      ? 0.6 + Math.abs(Math.sin(clock.elapsedTime * 8)) * 0.3
      : 1.8
  })
  return (
    <directionalLight ref={ref} position={[15, 25, 10]} intensity={1.8}
      castShadow shadow-mapSize={[2048, 2048]}
      shadow-camera-far={80} shadow-camera-left={-30} shadow-camera-right={30}
      shadow-camera-top={30} shadow-camera-bottom={-30} />
  )
}

// ── Mini-map (canvas 2D overlay) ──────────────────────────────────────────────
function MiniMap({ uavs, heatmapData }) {
  const canvasRef = useRef()
  const WORLD_RANGE = 25
  const SIZE = 150

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, SIZE, SIZE)

    // Dark background
    ctx.fillStyle = '#f0f9ff'
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Heatmap
    if (heatmapData && heatmapData.length > 0) {
      const cellW = SIZE / 20
      heatmapData.forEach(({ gx, gz, intensity }) => {
        const r = Math.round(intensity * 168)
        const g = Math.round((1 - intensity) * 85)
        ctx.fillStyle = `rgba(${r},${g},${Math.round(intensity * 70)},${0.4 + intensity * 0.5})`
        ctx.fillRect(gx * cellW, gz * cellW, cellW + 1, cellW + 1)
      })
    }

    // Helper: world→canvas
    const w2c = (wx, wz) => ({
      x: ((wx + WORLD_RANGE) / (WORLD_RANGE * 2)) * SIZE,
      y: ((wz + WORLD_RANGE) / (WORLD_RANGE * 2)) * SIZE,
    })

    // GCS
    const gcs = w2c(GCS_POS[0], GCS_POS[2])
    ctx.beginPath()
    ctx.arc(gcs.x, gcs.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#0ea5e9'
    ctx.fill()
    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 1
    ctx.stroke()

    // Jammer
    const jam = w2c(JAM_POS[0], JAM_POS[2])
    ctx.beginPath()
    ctx.arc(jam.x, jam.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#a855f7'
    ctx.fill()

    // UAVs
    uavs.forEach(uav => {
      const col = statusColor(uav.linkStatus)
      const p   = w2c(uav.pos[0], uav.pos[2])
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = col
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 1
      ctx.stroke()
      // Trail
      if (uav.trail.length > 1) {
        ctx.beginPath()
        ctx.moveTo(...Object.values(w2c(uav.trail[0][0], uav.trail[0][2])).map(v => v))
        ctx.moveTo(w2c(uav.trail[0][0], uav.trail[0][2]).x, w2c(uav.trail[0][0], uav.trail[0][2]).y)
        uav.trail.slice(-30).forEach(tp => {
          const tp2 = w2c(tp[0], tp[2])
          ctx.lineTo(tp2.x, tp2.y)
        })
        ctx.strokeStyle = col + '60'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // Border
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, 0, SIZE, SIZE)

    // Labels
    ctx.fillStyle = '#0ea5e9'
    ctx.font = '8px JetBrains Mono'
    ctx.fillText('GCS', gcs.x + 6, gcs.y + 4)
    ctx.fillStyle = '#a855f7'
    ctx.fillText('JAM', jam.x + 6, jam.y + 4)

  }, [uavs, heatmapData])

  return (
    <div style={{
      position: 'absolute', bottom: 10, right: 10,
      width: SIZE, height: SIZE,
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid #30363d',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      background: '#0d1117',
    }}>
      <canvas ref={canvasRef} width={SIZE} height={SIZE}
        style={{ display: 'block', width: SIZE, height: SIZE }} />
      <div style={{
        position: 'absolute', top: 4, left: 6,
        fontSize: 9, fontFamily: 'JetBrains Mono', color: '#8b949e', letterSpacing: '0.1em'
      }}>MINI-MAP</div>
    </div>
  )
}

// ── Scene HUD ─────────────────────────────────────────────────────────────────
function SceneHUD({ uav }) {
  const col = statusColor(uav.linkStatus)
  return (
    <group position={[-23, 13, -15]}>
      <Text fontSize={0.45} color={col} anchorX="left" fontWeight={700}
        outlineWidth={0.04} outlineColor="#000">
        {`LQ: ${(uav.linkQuality * 100).toFixed(1)}%`}
      </Text>
      <Text position={[0, -0.65, 0]} fontSize={0.45} color={col} anchorX="left"
        outlineWidth={0.04} outlineColor="#000">
        {`SNR: ${uav.snr.toFixed(1)} dB`}
      </Text>
    </group>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function Scene3D() {
  const {
    uavs, activeUavId, heatmapData,
    jammerPower, gcsPower, linkStatus, linkQuality, snr,
    jammingType, distGCS, distJammer,
    directional, jamBearing,
    signalStrength,
  } = useSimStore()

  const gcsP = GCS_POS
  const jamP = JAM_POS
  const activeUav = uavs.find(u => u.id === activeUavId) || uavs[0]

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ border: '1px solid #30363d' }}>
      <Canvas
        shadows
        camera={{ position: [4, 22, 32], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #e0f2fe 60%, #f0fdf4 100%)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.85} color="#ffffff" />
        <AdaptiveLight linkStatus={linkStatus} />
        <pointLight position={[-10, 8, -5]} intensity={0.4} color="#bae6fd" />
        <pointLight position={[8, 6, 6]}   intensity={0.3} color="#ddd6fe" />

        {/* Sky + Stars */}
        <Sky />
        <Clouds />

        {/* Terrain + Environment */}
        <Terrain />
        <Environment />

        {/* Range circles */}
        <RangeCircle cx={gcsP[0]} cz={gcsP[2]} radius={distGCS}    color="#0ea5e9" />
        <RangeCircle cx={jamP[0]} cz={jamP[2]} radius={distJammer} color="#a855f7" />

        {/* GCS signal pulses */}
        <SignalPulses position={[gcsP[0], 2.4, gcsP[2]]} color={statusColor(linkStatus)} />

        {/* Static entities */}
        <GCS position={gcsP} gcsPower={gcsPower} signalActive={linkStatus !== 'LOST'} />
        <Jammer position={jamP} power={jammerPower} jammingType={jammingType}
          directional={directional} bearing={jamBearing} />

        {/* Directional jammer cone */}
        {directional && (
          <DirectionalCone position={[jamP[0] + 0.5, 3.5, jamP[2]]} bearing={jamBearing} power={jammerPower} />
        )}

        {/* All UAVs */}
        {uavs.map(uav => (
          <group key={uav.id}>
            <UAV uav={uav} />
            <UAVTrail trail={uav.trail} color={uav.color} />
            <ThreatAura position={uav.pos} threatLevel={uav.threatLevel} />

            {/* Signal beam: GCS → UAV */}
            <SignalBeam
              from={[gcsP[0], 2.4, gcsP[2]]}
              to={uav.pos}
              linkStatus={uav.linkStatus}
              linkQuality={uav.linkQuality}
            />

            {/* Jamming waves: Jammer → UAV */}
            {jammerPower > 3 && (
              <JammingWaves
                from={[jamP[0] + 0.5, 3.5, jamP[2]]}
                to={uav.pos}
                power={jammerPower}
                jammingType={jammingType}
              />
            )}
          </group>
        ))}

        {/* Scene HUD */}
        <SceneHUD uav={activeUav} />

        <OrbitControls
          enablePan enableZoom enableRotate
          minDistance={8} maxDistance={75}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 2, 0]}
        />
      </Canvas>

      {/* Mini-map overlay */}
      <MiniMap uavs={uavs} heatmapData={heatmapData} />

      {/* UAV selector */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        display: 'flex', gap: 6,
      }}>
        {uavs.map(uav => {
          const col = statusColor(uav.linkStatus)
          const isActive = uav.id === activeUavId
          return (
            <button
              key={uav.id}
              onClick={() => useSimStore.getState().setActiveUav(uav.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
                fontWeight: 700,
                border: `1px solid ${isActive ? col : '#30363d'}`,
                background: isActive ? col + '22' : '#ffffff',
                color: isActive ? col : '#64748b',
                cursor: 'pointer',
                letterSpacing: '0.08em',
              }}>
              UAV-{uav.id}
            </button>
          )
        })}
      </div>
    </div>
  )
}
