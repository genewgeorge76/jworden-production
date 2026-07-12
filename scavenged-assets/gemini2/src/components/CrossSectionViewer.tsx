/**
 * CrossSectionViewer — Real Three.js/WebGL 3D cross-section of the Worden Standard
 * pavement structure with depth, rotation, and live polygon extrusion from the map.
 *
 * Features:
 *  - ExtrudeGeometry per pavement layer using the actual drawn polygon footprint
 *  - OrbitControls: drag to rotate, scroll to zoom, right-click to pan
 *  - Layers animate in from below on first render (staggered entrance)
 *  - Live update: when polygonCoords change, geometry is rebuilt in real time
 *  - Fallback to a default rectangular footprint when no polygon is drawn
 *  - Canvas-sprite labels with VDOT / ASTM spec references
 *  - Full GPU-resource cleanup on unmount and on every rebuild
 *
 * Standards: VDOT Section 315 · AASHTO T99/T180 · ASTM D2939 · Marshall Mix Design
 */

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LatLng } from '@/lib/estimator-engine';

/* ─── layer definitions ──────────────────────────────────────────────────── */

interface LayerDef {
  id: string;
  label: string;
  spec: string;
  depthLabel: string;
  /** thickness in world units (1 unit ≈ 1 inch visual scale) */
  thickness: number;
  hexColor: number;
  roughness: number;
  metalness: number;
}

function buildLayers(surfaceDepthIn: number, includeBase: boolean, includeSeal: boolean): LayerDef[] {
  const list: LayerDef[] = [];

  if (includeSeal) {
    list.push({
      id: 'seal',
      label: 'Sealcoat — Double Coat',
      spec: 'ASTM D2939 · Neyra Emulsion',
      depthLabel: '⅛"',
      thickness: 0.25,
      hexColor: 0x0d0d1f,
      roughness: 0.9,
      metalness: 0.1,
    });
  }

  list.push({
    id: 'surface',
    label: `SM-9.5A Surface Course (${surfaceDepthIn}")`,
    spec: 'VDOT Section 315 · 96% Marshall',
    depthLabel: `${surfaceDepthIn}"`,
    thickness: surfaceDepthIn,
    hexColor: 0x252525,
    roughness: 0.95,
    metalness: 0.05,
  });

  list.push({
    id: 'binder',
    label: 'BM-25.0 Binder / Intermediate Lift',
    spec: 'VDOT Section 315',
    depthLabel: '3"',
    thickness: 3,
    hexColor: 0x3a3535,
    roughness: 0.9,
    metalness: 0.05,
  });

  if (includeBase) {
    list.push({
      id: 'base',
      label: '21A Crusher Run Stone Base',
      spec: 'VDOT Section 303 · Sovereign Standard',
      depthLabel: '6"',
      thickness: 6,
      hexColor: 0x686868,
      roughness: 0.85,
      metalness: 0.0,
    });
  }

  list.push({
    id: 'subgrade',
    label: 'Compacted Subgrade',
    spec: 'AASHTO T99/T180 · 96% Proctor Min.',
    depthLabel: 'Native',
    thickness: 4,
    hexColor: 0x7a6240,
    roughness: 0.97,
    metalness: 0.0,
  });

  return list;
}

/* ─── lat/lng → normalized XZ footprint ─────────────────────────────────── */

function latlngToFootprint(coords: LatLng[]): { x: number; y: number }[] {
  if (coords.length < 3) return defaultFootprint();

  const avgLat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const latRad = (avgLat * Math.PI) / 180;
  const metersPerDegLat = 111_132.92;
  const metersPerDegLng = 111_132.92 * Math.cos(latRad);

  const pts = coords.map((c) => ({
    x: (c[1] - coords[0][1]) * metersPerDegLng,
    y: (c[0] - coords[0][0]) * metersPerDegLat,
  }));

  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const centered = pts.map((p) => ({ x: p.x - cx, y: p.y - cy }));

  const maxDim = Math.max(...centered.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  const scale = maxDim > 0 ? 5 / maxDim : 1;

  return centered.map((p) => ({ x: p.x * scale, y: p.y * scale }));
}

function defaultFootprint(): { x: number; y: number }[] {
  return [
    { x: -5, y: -3.5 },
    { x: 5, y: -3.5 },
    { x: 5, y: 3.5 },
    { x: -5, y: 3.5 },
  ];
}

/* ─── label sprite helper ────────────────────────────────────────────────── */

function makeTextSprite(text: string, subtext: string, depth: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 100;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 100);
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  // roundRect is available in Chrome 99+, Firefox 112+, Safari 16+.
  // Fall back to a plain rect for older environments.
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === 'function') {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void })
      .roundRect(0, 0, 512, 100, 8);
  } else {
    ctx.rect(0, 0, 512, 100);
  }
  ctx.fill();

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(depth, 16, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(text, 16, 66);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px monospace';
  ctx.fillText(subtext, 16, 90);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.5, 1.1, 1);
  return sprite;
}

/** Dispose all GPU resources on a sprite (texture + material). */
function disposeSprite(sprite: THREE.Sprite) {
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}

/* ─── scene state stored in a mutable ref ───────────────────────────────── */

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  rafId: number;
  meshGroup: THREE.Group;
  spriteGroup: THREE.Group;
  /** requestAnimationFrame IDs for layer entrance animations; cancelled on rebuild */
  animRafs: number[];
}

/* ─── React component ────────────────────────────────────────────────────── */

export interface CrossSectionViewerProps {
  surfaceDepthIn: number;
  includeBase: boolean;
  includeSeal: boolean;
  /** Optional: live polygon from MapEstimator — drives real footprint extrusion */
  polygonCoords?: LatLng[];
}

export default function CrossSectionViewer({
  surfaceDepthIn,
  includeBase,
  includeSeal,
  polygonCoords,
}: CrossSectionViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);
  /** Tracks whether the mount-once initial build has already fired. */
  const initialBuiltRef = useRef(false);

  /** Resolve footprint from current props — single source of truth. */
  const resolveFootprint = useCallback(
    () =>
      polygonCoords && polygonCoords.length >= 3
        ? latlngToFootprint(polygonCoords)
        : defaultFootprint(),
    [polygonCoords],
  );

  /* ── build/rebuild layer meshes ── */
  const rebuildLayers = useCallback((
    layers: LayerDef[],
    footprintPts: { x: number; y: number }[],
  ) => {
    const s = stateRef.current;
    if (!s) return;

    // Cancel any running entrance animations from a previous build
    for (const id of s.animRafs) cancelAnimationFrame(id);
    s.animRafs = [];

    // Dispose GPU resources for all old sprites
    s.spriteGroup.traverse((obj) => {
      if (obj instanceof THREE.Sprite) disposeSprite(obj);
    });
    // Dispose geometries & materials for old meshes / edge lines
    s.meshGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    s.meshGroup.clear();
    s.spriteGroup.clear();

    /* Build 2D shape from footprint */
    const shape = new THREE.Shape();
    if (footprintPts.length > 0) {
      shape.moveTo(footprintPts[0].x, footprintPts[0].y);
      for (let i = 1; i < footprintPts.length; i++) {
        shape.lineTo(footprintPts[i].x, footprintPts[i].y);
      }
      shape.closePath();
    }

    let currentY = 0; // stack layers bottom-up

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const layerIndex = layers.length - 1 - i; // 0 = bottommost layer

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: layer.thickness,
        bevelEnabled: false,
      });
      geo.rotateX(-Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: layer.hexColor,
        roughness: layer.roughness,
        metalness: layer.metalness,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const targetY = currentY;
      mesh.position.y = targetY - 30; // start underground

      // Staggered entrance animation
      const delay = layerIndex * 80;
      const startTime = performance.now() + delay;
      const duration = 600;

      const animateMesh = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed < 0) {
          const id = requestAnimationFrame(animateMesh);
          s.animRafs.push(id);
          return;
        }
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        mesh.position.y = targetY - 30 + 30 * eased;
        if (t < 1) {
          const id = requestAnimationFrame(animateMesh);
          s.animRafs.push(id);
        }
      };
      s.animRafs.push(requestAnimationFrame(animateMesh));

      s.meshGroup.add(mesh);

      // Gold wireframe edges
      const edges = new THREE.EdgesGeometry(geo, 15);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffcc00, opacity: 0.18, transparent: true });
      const edgeLines = new THREE.LineSegments(edges, edgeMat);

      const animateEdge = () => {
        if (mesh.position.y < targetY) {
          edgeLines.position.y = mesh.position.y;
          const id = requestAnimationFrame(animateEdge);
          s.animRafs.push(id);
        } else {
          edgeLines.position.y = targetY;
        }
      };
      s.animRafs.push(requestAnimationFrame(animateEdge));
      s.meshGroup.add(edgeLines);

      /* Label sprite at layer midpoint */
      const sprite = makeTextSprite(layer.label, layer.spec, layer.depthLabel);
      sprite.position.set(8, targetY + layer.thickness / 2, 0);
      s.spriteGroup.add(sprite);

      currentY += layer.thickness;
    }

    // Centre camera on stack
    const stackHeight = currentY;
    s.controls.target.set(0, stackHeight / 2, 0);
    s.camera.position.set(14, stackHeight / 2 + 16, 22);
  }, []);

  /* ── mount Three.js scene once ── */
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const W = container.clientWidth || 600;
    const H = 420;

    /* renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    /* scene */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d0d);
    scene.fog = new THREE.FogExp2(0x0d0d0d, 0.035);

    /* camera */
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(14, 18, 22);
    camera.lookAt(0, 0, 0);

    /* orbit controls */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 8;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2 + 0.25;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    /* lighting */
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.5);
    sun.position.set(20, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4466ff, 0.5);
    fill.position.set(-15, 10, -15);
    scene.add(fill);

    const accent = new THREE.PointLight(0xffcc00, 1.5, 40);
    accent.position.set(0, 14, 0);
    scene.add(accent);

    /* grid */
    const grid = new THREE.GridHelper(40, 40, 0x333333, 0x1a1a1a);
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = -0.05;
    scene.add(grid);

    /* groups */
    const meshGroup = new THREE.Group();
    const spriteGroup = new THREE.Group();
    scene.add(meshGroup);
    scene.add(spriteGroup);

    /* render loop */
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    /* resize */
    const onResize = () => {
      const w = container.clientWidth || 600;
      camera.aspect = w / H;
      camera.updateProjectionMatrix();
      renderer.setSize(w, H);
    };
    window.addEventListener('resize', onResize);

    stateRef.current = { scene, camera, renderer, controls, rafId, meshGroup, spriteGroup, animRafs: [] };

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      if (stateRef.current) {
        for (const id of stateRef.current.animRafs) cancelAnimationFrame(id);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []); // mount once

  /* ── rebuild geometry whenever props or polygon change ── */
  useEffect(() => {
    if (!stateRef.current) return;
    rebuildLayers(buildLayers(surfaceDepthIn, includeBase, includeSeal), resolveFootprint());
  }, [surfaceDepthIn, includeBase, includeSeal, resolveFootprint, rebuildLayers]);

  /* ── initial build: run one RAF after mount so stateRef is populated ── */
  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled || !stateRef.current || initialBuiltRef.current) return;
      initialBuiltRef.current = true;
      rebuildLayers(buildLayers(surfaceDepthIn, includeBase, includeSeal), resolveFootprint());
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
    // This effect is intentionally mount-only. Props are fully covered by the
    // props-change effect above; this RAF just handles the first render where
    // stateRef hasn't been set yet when the props effect fires.
  }, [rebuildLayers, resolveFootprint, surfaceDepthIn, includeBase, includeSeal]);

  const layers = buildLayers(surfaceDepthIn, includeBase, includeSeal);

  return (
    <div className="bg-zinc-900 border border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="bg-[#ffcc00] text-black px-4 py-2 flex items-center justify-between">
        <h4 className="font-black uppercase text-xs tracking-widest">
          3D Pavement Cross-Section — Worden Standard
        </h4>
        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">
          {polygonCoords && polygonCoords.length >= 3
            ? `Live Polygon · ${polygonCoords.length} pts`
            : 'Default Footprint'}
        </span>
      </div>

      {/* Three.js canvas */}
      <div
        ref={mountRef}
        className="w-full"
        style={{ height: 420, background: '#0d0d0d', cursor: 'grab' }}
        aria-label="Worden Standard 3D pavement cross-section — drag to rotate, scroll to zoom"
      />

      {/* Controls hint */}
      <div className="px-4 py-1.5 bg-zinc-800 border-t border-zinc-700 text-[10px] text-zinc-300 flex gap-4">
        <span>🖱 Drag: Rotate</span>
        <span>⚙ Scroll: Zoom</span>
        <span>⇧ Right-drag: Pan</span>
        {polygonCoords && polygonCoords.length >= 3 && (
          <span className="text-[#ffcc00] font-bold">✦ Live polygon extrusion active</span>
        )}
      </div>

      {/* Layer legend */}
      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] border-t border-zinc-800">
        {layers.map((layer) => (
          <div key={layer.id} className="flex items-start gap-2">
            <span
              className="w-3 h-3 mt-0.5 shrink-0 border border-zinc-600 inline-block"
              style={{ background: `#${layer.hexColor.toString(16).padStart(6, '0')}` }}
            />
            <div>
              <span className="text-zinc-300 font-bold">{layer.label}</span>
              <br />
              <span className="text-zinc-200 font-mono">{layer.spec}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
