import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useActiveCanvas } from "./useActiveCanvas";

/*
 * "Bangladesh to the World" — a dotted globe with Bangladesh glowing,
 * and arcs that grow from Dhaka to farming regions around the world.
 */

const R = 1.5;
const DHAKA = { lat: 23.81, lon: 90.41 };
const DESTINATIONS = [
  { lat: 28.61, lon: 77.21 }, // Delhi
  { lat: -6.2, lon: 106.85 }, // Jakarta
  { lat: -1.29, lon: 36.82 }, // Nairobi
  { lat: 6.52, lon: 3.38 }, // Lagos
  { lat: 30.04, lon: 31.24 }, // Cairo
  { lat: 51.51, lon: -0.13 }, // London
  { lat: -23.55, lon: -46.63 }, // São Paulo
  { lat: 19.43, lon: -99.13 }, // Mexico City
  { lat: -33.87, lon: 151.21 }, // Sydney
  { lat: 35.68, lon: 139.69 }, // Tokyo
];

function latLonToVec3(lat: number, lon: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function DotSphere() {
  const geometry = useMemo(() => {
    const n = 2400;
    const positions = new Float32Array(n * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      positions.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#8EDB8F" size={0.028} sizeAttenuation transparent opacity={0.75} />
    </points>
  );
}

function Arc({ to, delay }: { to: { lat: number; lon: number }; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const { geometry, total, end } = useMemo(() => {
    const a = latLonToVec3(DHAKA.lat, DHAKA.lon, R);
    const b = latLonToVec3(to.lat, to.lon, R);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lift = 1 + a.distanceTo(b) * 0.28;
    mid.normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const g = new THREE.TubeGeometry(curve, 64, 0.009, 6, false);
    return { geometry: g, total: g.index ? g.index.count : 0, end: b };
  }, [to]);

  const dot = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const cycle = 7;
    const local = (clock.elapsedTime - delay) % cycle;
    const progress = local < 0 ? 0 : Math.min(local / 1.8, 1);
    const count = Math.floor((progress * total) / 3) * 3;
    ref.current?.geometry.setDrawRange(0, count);
    if (dot.current) dot.current.scale.setScalar(progress >= 1 ? 1 : 0.001);
  });

  return (
    <group>
      <mesh ref={ref} geometry={geometry}>
        <meshBasicMaterial color="#E9C46A" transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={dot} position={end}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#E9C46A" toneMapped={false} />
      </mesh>
    </group>
  );
}

function BangladeshPin() {
  const ring = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => latLonToVec3(DHAKA.lat, DHAKA.lon, R), []);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  useFrame(({ clock }) => {
    const k = (clock.elapsedTime % 2) / 2;
    if (ring.current) {
      ring.current.scale.setScalar(1 + k * 2.5);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
    }
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color="#c9ffd9" toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.07, 0.095, 32]} />
        <meshBasicMaterial color="#8EDB8F" transparent side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
        <meshBasicMaterial color="#c9ffd9" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Globe() {
  const group = useRef<THREE.Group>(null);
  const base = useMemo(() => {
    const v = latLonToVec3(DHAKA.lat, DHAKA.lon, R);
    return { y: Math.atan2(-v.x, v.z), x: ((DHAKA.lat * Math.PI) / 180) * 0.7 };
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // Gentle sway around Bangladesh so it always stays facing the viewer.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, base.y + Math.sin(t * 0.25) * 0.35 + state.pointer.x * 0.25, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, base.x - state.pointer.y * 0.15, 3, dt);
  });

  return (
    <group ref={group} rotation={[base.x, base.y, 0]}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 48, 48]} />
        <meshStandardMaterial color="#0f4d27" roughness={0.8} emissive="#06240f" />
      </mesh>
      <DotSphere />
      <BangladeshPin />
      {DESTINATIONS.map((d, i) => (
        <Arc key={i} to={d} delay={0.6 + i * 0.45} />
      ))}
    </group>
  );
}

export default function GlobeScene() {
  const { ref, active } = useActiveCanvas<HTMLDivElement>();
  return (
    <div ref={ref} className="h-full w-full" aria-hidden>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4.4], fov: 45 }} gl={{ antialias: true, alpha: true }} frameloop={active ? "always" : "never"}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 2, 5]} intensity={1.2} />
        <mesh>
          <sphereGeometry args={[R * 1.12, 48, 48]} />
          <meshBasicMaterial color="#22A447" transparent opacity={0.07} side={THREE.BackSide} />
        </mesh>
        <Globe />
      </Canvas>
    </div>
  );
}
