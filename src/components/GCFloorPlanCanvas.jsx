/**
 * GCFloorPlanCanvas — interactive 3-D floor plan using React Three Fiber.
 *
 * Renders rooms as flat colored Box meshes on an XZ grid. Each room has
 * a floating Text label, hover highlight, and click selection.
 *
 * Props:
 *   rooms     — array of { id, name, type, widthFt, lengthFt, x, z }
 *   selected  — id of the selected room (or null)
 *   onSelect  — callback(roomId)
 */
/* eslint-disable react/no-unknown-property */
import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Room type → base color
const ROOM_COLORS = {
  living:    '#5b7fa6',
  kitchen:   '#e8a048',
  bedroom:   '#6ba68c',
  bathroom:  '#8f6db5',
  garage:    '#7a7470',
  office:    '#5a8a8a',
  dining:    '#a06060',
  hallway:   '#aaa090',
  other:     '#708090',
}

const FLOOR_COLOR = '#d6cfc4'
const WALL_HEIGHT = 0.12   // visual wall stub (world units = feet / 10)
const SCALE = 0.1          // 1 world unit = 10 ft

function toWorld(ft) { return ft * SCALE }

// ── Single room mesh ──────────────────────────────────────────────────────────
function RoomMesh({ room, isSelected, onSelect }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  const w = toWorld(room.widthFt)
  const l = toWorld(room.lengthFt)
  const x = toWorld(room.x || 0)
  const z = toWorld(room.z || 0)

  const baseColor = useMemo(
    () => new THREE.Color(ROOM_COLORS[room.type] || ROOM_COLORS.other),
    [room.type]
  )

  // Animate selection glow
  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    if (isSelected) {
      mat.emissive.setHex(0x334466)
      mat.emissiveIntensity = 0.5
    } else if (hovered) {
      mat.emissive.copy(baseColor).multiplyScalar(0.3)
      mat.emissiveIntensity = 0.4
    } else {
      mat.emissiveIntensity = 0.0
    }
  })

  const sqft = Math.round(room.widthFt * room.lengthFt)

  return (
    <group position={[x + w / 2, 0, z + l / 2]}>
      {/* Floor slab */}
      <mesh
        ref={meshRef}
        position={[0, WALL_HEIGHT / 2, 0]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(room.id) }}
      >
        <boxGeometry args={[w, WALL_HEIGHT, l]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} />
      </mesh>

      {/* Room label */}
      <Text
        position={[0, WALL_HEIGHT + 0.35, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={Math.min(w, l) * 0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        {room.name}
      </Text>

      {/* sqft callout on hover or select */}
      {(hovered || isSelected) && (
        <Html
          position={[0, WALL_HEIGHT + 0.8, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: 'nowrap',
          }}>
            {room.widthFt}′ × {room.lengthFt}′ = {sqft} sq ft
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Compass rose ──────────────────────────────────────────────────────────────
function Compass() {
  return (
    <Text
      position={[6, 0.05, -6]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.3}
      color="#888888"
      anchorX="center"
    >
      N ↑
    </Text>
  )
}

// ── Canvas export ─────────────────────────────────────────────────────────────
export default function GCFloorPlanCanvas({ rooms = [], selectedRoom, onSelectRoom }) {
  return (
    <Canvas
      camera={{ position: [0, 12, 12], fov: 45 }}
      shadows
      style={{ background: '#1a1e2e' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.9} castShadow />

      <Grid
        args={[40, 40]}
        cellSize={toWorld(10)}
        cellColor="#334"
        sectionColor="#445"
        fadeDistance={60}
        fadeStrength={1}
        infiniteGrid
      />

      {rooms.map((room) => (
        <RoomMesh
          key={room.id}
          room={room}
          isSelected={selectedRoom === room.id}
          onSelect={onSelectRoom}
        />
      ))}

      <Compass />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
