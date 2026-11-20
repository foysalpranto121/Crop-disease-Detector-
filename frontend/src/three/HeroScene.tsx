import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useActiveCanvas } from "./useActiveCanvas";

/*
 * "Living Field" — low-poly farm with swaying crops, trees, drifting clouds,
 * pollen sparkles and a floating leaf that gets scanned and healed.
 * All geometry is generated in code (no downloaded assets).
 */

const GROUND_Z = -8;
const GROUND_Y = -0.8;
const heightAt = (x: number, z: number) => Math.sin(x * 0.35) * 0.35 + Math.cos(z * 0.45 + x * 0.1) * 0.3;
const groundY = (x: number, worldZ: number) => heightAt(x, worldZ - GROUND_Z) + GROUND_Y;

function Ground() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(70, 44, 90, 60);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} position={[0, GROUND_Y, GROUND_Z]}>
      <meshStandardMaterial color="#4f9e45" flatShading roughness={1} />
    </mesh>
  );
}

function Crops() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => {
    const g = new THREE.ConeGeometry(0.09, 0.8, 4, 1);
    g.translate(0, 0.4, 0);
    return g;
  }, []);

  const plants = useMemo(() => {
    const list: { x: number; y: number; z: number; s: number; phase: number; row: number }[] = [];
    let row = 0;
    for (let z = -20; z <= 0.9; z += 0.85, row++) {
      for (let x = -16; x <= 16; x += 0.7) {
        const jx = x + Math.sin(row * 12.9 + x * 7.1) * 0.15;
        list.push({ x: jx, y: groundY(jx, z), z, s: 0.75 + ((Math.sin(x * 3.3 + z * 1.7) + 1) / 2) * 0.55, phase: (x + z) * 0.6, row });
      }
    }
    return list;
  }, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const palette = ["#2f9e47", "#3fae4f", "#55c46b", "#1f8a3c"].map((c) => new THREE.Color(c));
    const golden = new THREE.Color("#d8c26a");
    plants.forEach((p, i) => mesh.setColorAt(i, p.row % 7 === 3 ? golden : palette[i % palette.length]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [plants]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < plants.length; i++) {
      const p = plants[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(Math.sin(t * 1.3 + p.phase) * 0.1, 0, Math.sin(t * 1.7 + p.x * 0.35 + p.phase) * 0.17);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, plants.length]}>
      <meshStandardMaterial flatShading roughness={0.9} />
    </instancedMesh>
  );
}

function Trees() {
  const trees = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const x = -20 + i * 4 + Math.sin(i * 5.3) * 1.5;
        const z = -21 - Math.abs(Math.sin(i * 2.1)) * 4;
        return { x, z, y: groundY(x, z), s: 1 + Math.abs(Math.sin(i * 3.7)) * 0.8 };
      }),
    [],
  );
  return (
    <group>
      {trees.map((tr, i) => (
        <group key={i} position={[tr.x, tr.y, tr.z]} scale={tr.s}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 1.2, 5]} />
            <meshStandardMaterial color="#7A4E2D" flatShading />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <icosahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial color={i % 2 ? "#1f7a37" : "#2f9e47"} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      c.position.x += dt * (0.15 + i * 0.05);
      if (c.position.x > 22) c.position.x = -22;
    });
  });
  return (
    <group ref={group}>
      {[
        [-12, 6.5, -24],
        [3, 7.5, -26],
        [15, 6, -22],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {[
            [0, 0, 0, 1.4],
            [1.3, -0.2, 0.2, 1],
            [-1.2, -0.3, 0, 0.9],
          ].map(([cx, cy, cz, r], j) => (
            <mesh key={j} position={[cx, cy, cz]} scale={[r * 1.3, r * 0.75, r]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#ffffff" flatShading roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const SPOTS = [
  { x: -0.38, y: 0.35, r: 0.13 },
  { x: 0.32, y: -0.15, r: 0.16 },
  { x: 0.12, y: 0.85, r: 0.09 },
  { x: -0.22, y: -0.62, r: 0.11 },
  { x: 0.42, y: 0.42, r: 0.08 },
  { x: -0.05, y: 0.05, r: 0.07 },
];

function ScanLeaf({ position, scale }: { position: [number, number, number]; scale: number }) {
  const group = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Group>(null);
  const spotMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const sick = useMemo(() => new THREE.Color("#7A4E2D"), []);
  const healthy = useMemo(() => new THREE.Color("#3fae4f"), []);

  const leafGeometry = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -1.45);
    s.bezierCurveTo(1.25, -0.8, 1.15, 0.95, 0, 1.6);
    s.bezierCurveTo(-1.15, 0.95, -1.25, -0.8, 0, -1.45);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 24 });
    g.translate(0, 0, -0.025);
    return g;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = group.current;
    if (g) {
      g.rotation.y = Math.sin(t * 0.5) * 0.45;
      g.rotation.z = 0.18 + Math.sin(t * 0.7) * 0.06;
      g.position.y = position[1] + Math.sin(t * 1.1) * 0.12;
    }
    const cycle = 6;
    const p = (t % cycle) / cycle;
    const sweep = Math.min(p / 0.6, 1);
    const beamY = -1.6 + sweep * 3.4;
    if (beam.current) {
      beam.current.position.y = beamY;
      beam.current.visible = p < 0.62;
    }
    spotMats.current.forEach((m, i) => {
      if (!m) return;
      let k = p < 0.6 ? (SPOTS[i].y < beamY ? 1 : 0) : 1;
      if (p > 0.85) k = 1 - (p - 0.85) / 0.15; // disease returns for the next demo loop
      m.color.copy(sick).lerp(healthy, k);
    });
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={leafGeometry}>
        <meshStandardMaterial color="#3fae4f" roughness={0.45} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.05, 0.06]}>
        <boxGeometry args={[0.035, 3, 0.02]} />
        <meshStandardMaterial color="#1f7a37" />
      </mesh>
      {[-0.7, -0.15, 0.4, 0.9].map((y) =>
        [-1, 1].map((side) => (
          <mesh key={`${y}-${side}`} position={[side * 0.3, y, 0.06]} rotation={[0, 0, side * -0.75]}>
            <boxGeometry args={[0.02, 0.75, 0.015]} />
            <meshStandardMaterial color="#1f7a37" />
          </mesh>
        )),
      )}
      <mesh position={[0, -1.75, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.6, 6]} />
        <meshStandardMaterial color="#1f7a37" />
      </mesh>
      {SPOTS.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.07]}>
          <circleGeometry args={[s.r, 20]} />
          <meshStandardMaterial
            ref={(m: THREE.MeshStandardMaterial | null) => {
              if (m) spotMats.current[i] = m;
            }}
            color="#7A4E2D"
          />
        </mesh>
      ))}
      <group ref={beam}>
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[2.3, 0.05]} />
          <meshBasicMaterial color="#c9ffd9" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[2.3, 0.3]} />
          <meshBasicMaterial color="#8EDB8F" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Rig() {
  useFrame((state, dt) => {
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, state.pointer.x * 0.7, 2, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 1.6 + state.pointer.y * 0.3, 2, dt);
    cam.lookAt(0, 0.7, -3);
  });
  return null;
}

function Scene() {
  const { size } = useThree();
  const mobile = size.width < 768;
  return (
    <>
      <fog attach="fog" args={["#d7efe0", 12, 34]} />
      <hemisphereLight args={["#cfeeff", "#3f7d2a", 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-8, 9, 5]} intensity={1.8} color="#fff1d0" />

      <mesh position={[-10, 7.5, -27]}>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color="#fff1b0" toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[-10, 7.5, -27.5]}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshBasicMaterial color="#ffe08a" transparent opacity={0.25} fog={false} toneMapped={false} />
      </mesh>

      <Clouds />
      <Ground />
      <Crops />
      <Trees />
      <Sparkles count={mobile ? 30 : 70} scale={[16, 4, 10]} position={[0, 1.8, -2]} size={3.5} speed={0.35} color="#fff3a8" opacity={0.8} />
      <ScanLeaf position={mobile ? [0, 2.5, 0.3] : [3.1, 1.55, 0.6]} scale={mobile ? 0.45 : 0.62} />
      <Rig />
    </>
  );
}

export default function HeroScene() {
  const { ref, active } = useActiveCanvas<HTMLDivElement>();
  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.6, 6.5], fov: 50, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        frameloop={active ? "always" : "never"}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
