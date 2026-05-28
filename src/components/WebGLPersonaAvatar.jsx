import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const DEFAULT_MODEL_URL = '/models/mr-worden.glb'
const MODEL_PATH_CANDIDATES = [
  '/models/mr-worden-hq.glb',
  '/models/mr-worden-hq.gltf',
  DEFAULT_MODEL_URL,
  '/mr-worden.glb',
  '/models/mr-worden.gltf',
]

function getEnvModelCandidates() {
  const hq = (import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_HQ_URL || '').trim()
  const single = (import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URL || '').trim()
  const list = (import.meta.env.VITE_CONCIERGE_AVATAR_MODEL_URLS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  return [hq, single, ...list].filter(Boolean)
}

function looksLikeGlb(buffer) {
  if (!buffer || buffer.byteLength < 4) return false
  const bytes = new Uint8Array(buffer, 0, 4)
  return bytes[0] === 0x67 && bytes[1] === 0x6c && bytes[2] === 0x54 && bytes[3] === 0x46 // glTF
}

function looksLikeGltfJson(text, contentType) {
  const safeText = (text || '').trim()
  if (!safeText) return false
  if (safeText.startsWith('<!doctype html') || safeText.startsWith('<html')) return false
  if (!safeText.startsWith('{')) return false

  const type = (contentType || '').toLowerCase()
  if (type.includes('model/gltf+json') || type.includes('application/json')) return true

  return safeText.includes('"asset"') && safeText.includes('"version"')
}

async function findValidModelUrl(candidates) {
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'GET', cache: 'no-store' })
      if (!response.ok) continue

      const contentType = response.headers.get('content-type') || ''
      const buffer = await response.arrayBuffer()

      if (looksLikeGlb(buffer)) return candidate

      const headText = new TextDecoder().decode(buffer.slice(0, 512))
      if (looksLikeGltfJson(headText, contentType)) return candidate
    } catch {
      // Try the next candidate URL.
    }
  }

  return null
}

function createFallbackAvatar() {
  const root = new THREE.Group()

  const suitMaterial = new THREE.MeshStandardMaterial({
    color: '#141b2b',
    roughness: 0.44,
    metalness: 0.2,
  })
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: '#efc3a3',
    roughness: 0.62,
    metalness: 0.05,
    emissive: '#2f1a10',
    emissiveIntensity: 0.06,
  })
  const hatMaterial = new THREE.MeshStandardMaterial({
    color: '#f5a623',
    roughness: 0.32,
    metalness: 0.28,
  })

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.26, 0.56, 10, 24),
    suitMaterial
  )
  body.position.y = -0.08
  body.castShadow = true
  body.receiveShadow = true

  const shoulderLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 20, 18),
    suitMaterial
  )
  shoulderLeft.position.set(-0.225, 0.15, 0)
  shoulderLeft.scale.set(1.1, 0.9, 1.05)
  shoulderLeft.castShadow = true

  const shoulderRight = shoulderLeft.clone()
  shoulderRight.position.x = 0.225

  const collarLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.11, 0.032),
    new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.42, metalness: 0.08 })
  )
  collarLeft.position.set(-0.045, 0.28, 0.18)
  collarLeft.rotation.z = 0.35

  const collarRight = collarLeft.clone()
  collarRight.position.x = 0.045
  collarRight.rotation.z = -0.35

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.09, 0.12, 16),
    skinMaterial
  )
  neck.position.y = 0.33
  neck.castShadow = true

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 36, 28),
    skinMaterial
  )
  head.position.y = 0.54
  head.castShadow = true

  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.205, 0.12, 32),
    hatMaterial
  )
  hat.position.y = 0.76
  hat.castShadow = true

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.02, 36),
    new THREE.MeshStandardMaterial({ color: '#d4880a', roughness: 0.62, metalness: 0.12 })
  )
  brim.position.y = 0.7
  brim.castShadow = true

  const lapelLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.2, 0.05),
    new THREE.MeshStandardMaterial({ color: '#1d2538', roughness: 0.55, metalness: 0.1 })
  )
  lapelLeft.position.set(-0.08, 0.1, 0.18)
  lapelLeft.rotation.z = 0.25

  const lapelRight = lapelLeft.clone()
  lapelRight.position.x = 0.08
  lapelRight.rotation.z = -0.25

  const tie = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.19, 4),
    new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.24, metalness: 0.36, emissive: '#663600', emissiveIntensity: 0.12 })
  )
  tie.position.set(0, 0.17, 0.2)
  tie.rotation.x = Math.PI / 5
  tie.castShadow = true

  const glasses = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.0075, 12, 36),
    new THREE.MeshStandardMaterial({ color: '#34373f', roughness: 0.38, metalness: 0.42 })
  )
  glasses.position.set(-0.08, 0.57, 0.19)
  glasses.rotation.y = 0.03

  const glasses2 = glasses.clone()
  glasses2.position.x = 0.08
  glasses2.rotation.y = -0.03

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.008, 0.008),
    new THREE.MeshStandardMaterial({ color: '#4a4a4a' })
  )
  bridge.position.set(0, 0.57, 0.19)

  const eyeLeft = new THREE.Mesh(
    new THREE.SphereGeometry(0.023, 18, 16),
    new THREE.MeshStandardMaterial({ color: '#2c1e10', roughness: 0.15, metalness: 0.05, emissive: '#1b1008', emissiveIntensity: 0.2 })
  )
  eyeLeft.position.set(-0.08, 0.57, 0.205)

  const eyeRight = eyeLeft.clone()
  eyeRight.position.x = 0.08

  const browLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.008, 0.015),
    new THREE.MeshStandardMaterial({ color: '#6e3f25', roughness: 0.8 })
  )
  browLeft.position.set(-0.08, 0.61, 0.2)
  browLeft.rotation.z = 0.22

  const browRight = browLeft.clone()
  browRight.position.x = 0.08
  browRight.rotation.z = -0.22

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.026, 0.02),
    new THREE.MeshStandardMaterial({ color: '#9a4f30', roughness: 0.8 })
  )
  mouth.position.set(0, 0.47, 0.205)
  mouth.name = 'lipSyncMouth'
  mouth.castShadow = true

  const moustache = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.041, 0.07, 4, 14),
    new THREE.MeshStandardMaterial({ color: '#4f2e1d', roughness: 0.75, metalness: 0.04 })
  )
  moustache.position.set(0, 0.505, 0.218)
  moustache.rotation.z = Math.PI / 2
  moustache.castShadow = true

  const pocketSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, 0.008),
    new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.38, metalness: 0.08 })
  )
  pocketSquare.position.set(0.115, 0.1, 0.205)
  pocketSquare.rotation.z = 0.08

  const tiePin = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.008, 0.008),
    new THREE.MeshStandardMaterial({ color: '#c8a24e', roughness: 0.28, metalness: 0.72 })
  )
  tiePin.position.set(0, 0.12, 0.216)
  tiePin.castShadow = true

  root.add(
    body,
    shoulderLeft,
    shoulderRight,
    neck,
    head,
    hat,
    brim,
    collarLeft,
    collarRight,
    lapelLeft,
    lapelRight,
    tie,
    tiePin,
    pocketSquare,
    glasses,
    glasses2,
    bridge,
    eyeLeft,
    eyeRight,
    browLeft,
    browRight,
    mouth,
    moustache
  )
  return root
}

function frameObjectToCamera(object, camera) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  object.position.sub(center)
  object.position.y -= size.y * 0.08

  const maxDim = Math.max(size.x, size.y, size.z)
  const fov = (camera.fov * Math.PI) / 180
  const distance = Math.max((maxDim * 0.9) / (2 * Math.tan(fov / 2)), 1.2)
  camera.position.set(0, size.y * 0.08, distance * 1.18)
  camera.lookAt(0, size.y * 0.08, 0)
  camera.updateProjectionMatrix()
}

function findBestMouthTarget(root) {
  const direct = root.getObjectByName('lipSyncMouth')
  if (direct) return direct

  const candidates = []
  root.traverse((node) => {
    if (!node.isMesh) return
    const name = (node.name || '').toLowerCase()
    if (name.includes('mouth') || name.includes('jaw') || name.includes('teeth')) {
      candidates.push(node)
    }
  })

  return candidates[0] || null
}

export default function WebGLPersonaAvatar({
  className = '',
  mode = 'idle',
  speechPulse = 0,
  speechIntensity = 0.6,
  modelUrl,
  onModelModeChange,
}) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rootRef = useRef(null)
  const lipRigRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const disposeFnsRef = useRef([])
  const speakingUntilRef = useRef(0)
  const modeRef = useRef(mode)
  const speechIntensityRef = useRef(speechIntensity)
  const mixerRef = useRef(null)
  const actionsRef = useRef({})
  const activeActionRef = useRef(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })

  const selectClipByMode = (actions, activeMode) => {
    const modeOrder = {
      talking: ['talk', 'speak', 'voice', 'idle'],
      listening: ['listen', 'idle', 'breath'],
      wave: ['wave', 'greet', 'idle'],
      idle: ['idle', 'breath', 'base'],
    }

    const names = modeOrder[activeMode] || modeOrder.idle
    for (const key of names) {
      if (actions[key]) return key
    }
    return null
  }

  const applyActionForMode = (activeMode) => {
    const actions = actionsRef.current
    if (!actions || Object.keys(actions).length === 0) return

    const nextName = selectClipByMode(actions, activeMode)
    if (!nextName) return
    if (activeActionRef.current === nextName) return

    const nextAction = actions[nextName]
    const currentAction = activeActionRef.current ? actions[activeActionRef.current] : null

    if (currentAction && currentAction !== nextAction) {
      currentAction.fadeOut(0.28)
    }

    nextAction.reset().setEffectiveWeight(1).fadeIn(0.28).play()
    activeActionRef.current = nextName
  }

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    speechIntensityRef.current = speechIntensity
  }, [speechIntensity])

  const resolvedModelCandidates = useMemo(() => {
    const envCandidates = getEnvModelCandidates()
    const propCandidate = (modelUrl || '').trim()

    const merged = [...envCandidates, propCandidate, ...MODEL_PATH_CANDIDATES]
    return [...new Set(merged.filter(Boolean))]
  }, [modelUrl])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const requestedQuality = String(import.meta.env.VITE_CONCIERGE_AVATAR_RENDER_QUALITY || 'cinematic').toLowerCase()
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
    const isUltra = requestedQuality === 'ultra' || requestedQuality === '4k' || requestedQuality === 'cinematic' || requestedQuality === 'max'
    const isHigh = isUltra || requestedQuality === 'high'

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, 0.42, 2)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    })
    const maxDpr = isMobile ? (isUltra ? 2.4 : 2) : isUltra ? 3.5 : isHigh ? 2.6 : 2.2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.physicallyCorrectLights = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = isUltra ? 1.2 : 1.1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), isUltra ? 0.46 : 0.3, 0.62, 0.85)
    composer.addPass(bloomPass)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.035)
    scene.environment = envRT.texture

    const ambient = new THREE.AmbientLight('#ffe7b3', 0.58)
    const hemi = new THREE.HemisphereLight('#ffe8cc', '#0f1725', 0.62)
    const key = new THREE.DirectionalLight('#fff2d1', 2.1)
    key.position.set(1.55, 2.35, 2.55)
    key.castShadow = true
    const shadowSize = isUltra ? 2048 : 1024
    key.shadow.mapSize.set(shadowSize, shadowSize)
    key.shadow.camera.near = 0.2
    key.shadow.camera.far = 8
    key.shadow.camera.left = -1.4
    key.shadow.camera.right = 1.4
    key.shadow.camera.top = 1.4
    key.shadow.camera.bottom = -1.4

    const fill = new THREE.DirectionalLight('#ffe1ba', 0.62)
    fill.position.set(-1.8, 1.25, 1.2)
    const rim = new THREE.DirectionalLight('#8ab7ff', 0.72)
    rim.position.set(-2.1, 1.35, -1.5)
    scene.add(ambient, hemi, key, fill, rim)

    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 48),
      new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.2 })
    )
    contactShadow.rotation.x = -Math.PI / 2
    contactShadow.position.set(0, -0.43, 0.02)
    scene.add(contactShadow)

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.73, 48),
      new THREE.MeshBasicMaterial({ color: '#f5a623', transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    )
    halo.position.set(0, 0.38, -0.6)
    scene.add(halo)

    const root = new THREE.Group()
    rootRef.current = root
    scene.add(root)

    let cancelled = false
    const loader = new GLTFLoader()
    const draco = new DRACOLoader()
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
    loader.setDRACOLoader(draco)

    const loadFallback = () => {
      if (cancelled) return
      root.clear()
      const fallback = createFallbackAvatar()
      root.add(fallback)
      frameObjectToCamera(fallback, camera)
      lipRigRef.current = {
        kind: 'scale',
        mesh: findBestMouthTarget(fallback),
      }

      mixerRef.current = null
      actionsRef.current = {}
      activeActionRef.current = null
      onModelModeChange?.('fallback')
    }

    const pickMorphIndices = (mesh) => {
      const dict = mesh.morphTargetDictionary || {}
      const names = Object.keys(dict)

      const preferred = names.filter((n) => {
        const low = n.toLowerCase()
        return (
          low.includes('viseme') ||
          low.includes('mouth') ||
          low.includes('jaw') ||
          low.includes('aa') ||
          low.includes('oh')
        )
      })

      const selected = preferred.length > 0 ? preferred : names.slice(0, 2)
      return selected.map((name) => dict[name]).filter((idx) => Number.isInteger(idx))
    }

    const findLipRig = (model) => {
      let scaleMesh = null
      let morphMesh = null
      let morphIndices = []

      model.traverse((node) => {
        if (!node.isMesh) return

        if (!scaleMesh) {
          const lowName = (node.name || '').toLowerCase()
          if (lowName.includes('mouth') || lowName.includes('jaw') || lowName.includes('teeth')) {
            scaleMesh = node
          }
        }

        if (!morphMesh && Array.isArray(node.morphTargetInfluences) && node.morphTargetInfluences.length > 0) {
          const indices = pickMorphIndices(node)
          if (indices.length > 0) {
            morphMesh = node
            morphIndices = indices
          }
        }
      })

      if (morphMesh && morphIndices.length > 0) {
        return { kind: 'morph', mesh: morphMesh, indices: morphIndices }
      }

      return { kind: 'scale', mesh: scaleMesh || findBestMouthTarget(model) }
    }

    const buildActions = (mixer, clips) => {
      const map = {}
      const classify = (clip) => {
        const n = clip.name.toLowerCase()
        if (n.includes('talk') || n.includes('speak') || n.includes('voice')) return 'talk'
        if (n.includes('listen') || n.includes('thinking')) return 'listen'
        if (n.includes('wave') || n.includes('greet') || n.includes('hello')) return 'wave'
        if (n.includes('breath')) return 'breath'
        if (n.includes('idle') || n.includes('base')) return 'idle'
        return null
      }

      clips.forEach((clip) => {
        const key = classify(clip)
        if (!key || map[key]) return
        map[key] = mixer.clipAction(clip)
      })

      return map
    }

    const loadModel = async () => {
      const validUrl = await findValidModelUrl(resolvedModelCandidates)
      if (!validUrl) {
        loadFallback()
        return
      }

      loader.load(
        validUrl,
        (gltf) => {
          if (cancelled) return
          root.clear()
          const model = gltf.scene
          model.position.set(0, -0.08, 0)
          model.scale.setScalar(1.05)

          model.traverse((node) => {
            if (!node.isMesh) return
            node.castShadow = true
            node.receiveShadow = true
            if (node.material && !Array.isArray(node.material)) {
              node.material.envMapIntensity = Math.max(node.material.envMapIntensity || 0, 1.18)
              if (typeof node.material.roughness === 'number') {
                node.material.roughness = Math.min(node.material.roughness, 0.92)
              }
              node.material.needsUpdate = true
            }
          })

          root.add(model)
          frameObjectToCamera(model, camera)
          lipRigRef.current = findLipRig(model)

          if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            const actions = buildActions(mixer, gltf.animations)
            mixerRef.current = mixer
            actionsRef.current = actions
            activeActionRef.current = null
            applyActionForMode(modeRef.current)
          } else {
            mixerRef.current = null
            actionsRef.current = {}
            activeActionRef.current = null
          }

          onModelModeChange?.('model')
        },
        undefined,
        () => {
          loadFallback()
        }
      )
    }
    loadModel()

    const resize = () => {
      const w = mount.clientWidth || 220
      const h = mount.clientHeight || 220
      renderer.setSize(w, h, false)
      composer.setSize(w, h)
      bloomPass.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)

    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
      pointerTargetRef.current.x = Math.max(-1, Math.min(1, nx))
      pointerTargetRef.current.y = Math.max(-1, Math.min(1, ny))
    }

    const onPointerLeave = () => {
      pointerTargetRef.current.x = 0
      pointerTargetRef.current.y = 0
    }

    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerleave', onPointerLeave)

    let raf = 0
    const renderLoop = () => {
      const elapsed = clockRef.current.getElapsedTime()
      const rootObj = rootRef.current
      const activeMode = modeRef.current
      const delta = clockRef.current.getDelta()

      pointerCurrentRef.current.x += (pointerTargetRef.current.x - pointerCurrentRef.current.x) * 0.06
      pointerCurrentRef.current.y += (pointerTargetRef.current.y - pointerCurrentRef.current.y) * 0.06

      const parallaxX = pointerCurrentRef.current.x * 0.1
      const parallaxY = pointerCurrentRef.current.y * 0.06
      camera.position.x += (parallaxX - camera.position.x) * 0.06
      camera.position.y += ((0.42 - parallaxY) - camera.position.y) * 0.06
      camera.lookAt(0, 0.08, 0)

      if (mixerRef.current) {
        applyActionForMode(activeMode)
        mixerRef.current.update(Math.min(delta, 1 / 30))
      }

      if (rootObj) {
        const idleAmp = activeMode === 'talking' ? 0.022 : 0.014
        rootObj.position.y = Math.sin(elapsed * 1.6) * idleAmp
        rootObj.rotation.y = Math.sin(elapsed * 0.85) * 0.07

        if (activeMode === 'listening') {
          rootObj.rotation.x = Math.sin(elapsed * 1.2) * 0.035
        } else if (activeMode === 'wave') {
          rootObj.rotation.z = Math.sin(elapsed * 3.6) * 0.06
        } else {
          rootObj.rotation.x = Math.sin(elapsed * 0.7) * 0.014
          rootObj.rotation.z = 0
        }
      }

      const haloPulse = 0.16 + Math.max(0, Math.sin(elapsed * 2.4)) * 0.14
      halo.material.opacity = activeMode === 'talking' ? haloPulse + 0.1 : haloPulse

      const lipRig = lipRigRef.current
      if (lipRig) {
        const active = activeMode === 'talking' || Date.now() < speakingUntilRef.current
        const openValue = active ? (0.25 + Math.abs(Math.sin(elapsed * 20)) * (0.5 + speechIntensityRef.current * 0.3)) : 0

        if (lipRig.kind === 'morph' && lipRig.mesh && lipRig.indices) {
          lipRig.indices.forEach((idx) => {
            if (lipRig.mesh.morphTargetInfluences && lipRig.mesh.morphTargetInfluences[idx] !== undefined) {
              lipRig.mesh.morphTargetInfluences[idx] = openValue
            }
          })
        } else if (lipRig.mesh) {
          lipRig.mesh.scale.y = 0.9 + openValue
        }
      }

      composer.render()
      raf = requestAnimationFrame(renderLoop)
    }
    raf = requestAnimationFrame(renderLoop)

    disposeFnsRef.current.push(() => {
      window.removeEventListener('resize', resize)
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerleave', onPointerLeave)
      cancelAnimationFrame(raf)
      draco.dispose()
      pmrem.dispose()
      envRT.dispose()
      composer.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    })

    return () => {
      cancelled = true
      disposeFnsRef.current.forEach((fn) => fn())
      disposeFnsRef.current = []
    }
  }, [resolvedModelCandidates, onModelModeChange])

  useEffect(() => {
    const duration = 1200 + Math.round(speechPulse * 18)
    speakingUntilRef.current = Date.now() + duration
  }, [speechPulse])

  return (
    <div className={className}>
      <div ref={mountRef} className="w-full h-full" />
    </div>
  )
}
