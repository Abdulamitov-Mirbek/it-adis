"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars, Torus, Ring } from "@react-three/drei";
import * as THREE from "three";

/* ── Animated distort orb ───────────────────────────── */
function DigitalOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.15 + mouse.y * 0.1;
    meshRef.current.rotation.y = t * 0.25 + mouse.x * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={1.8}>
        <Sphere args={[1, 128, 128]}>
          <MeshDistortMaterial
            color="#22c55e"
            emissive="#14532d"
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.8}
            distort={0.35}
            speed={2.5}
            transparent
            opacity={0.92}
          />
        </Sphere>
      </mesh>
    </Float>
  );
}

/* ── Orbit rings ─────────────────────────────────────── */
function OrbitRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.4;
      ring1.current.rotation.z = t * 0.2;
    }
    if (ring2.current) {
      ring2.current.rotation.y = t * 0.35;
      ring2.current.rotation.z = -t * 0.15;
    }
    if (ring3.current) {
      ring3.current.rotation.x = -t * 0.25;
      ring3.current.rotation.y = t * 0.3;
    }
  });

  const ringMat = (color: string, opacity: number) => (
    <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
  );

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[2.6, 0.015, 8, 100]} />
        {ringMat("#4ade80", 0.5)}
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.1, 0.01, 8, 100]} />
        {ringMat("#60a5fa", 0.35)}
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 5, Math.PI / 4, 0]}>
        <torusGeometry args={[3.6, 0.008, 8, 100]} />
        {ringMat("#86efac", 0.25)}
      </mesh>
    </>
  );
}

/* ── Floating code particles ─────────────────────────── */
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 300;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const green = new THREE.Color("#4ade80");
    const blue  = new THREE.Color("#60a5fa");

    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c = Math.random() > 0.4 ? green : blue;
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Scene ───────────────────────────────────────────── */
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}   intensity={2}   color="#4ade80" />
      <pointLight position={[-5, -5, 5]} intensity={1}   color="#60a5fa" />
      <pointLight position={[0, 0, -5]}  intensity={0.5} color="#22c55e" />
      <Stars radius={80} depth={50} count={800} factor={3} fade />
      <FloatingParticles />
      <OrbitRings />
      <DigitalOrb />
    </>
  );
}

/* ── Export ──────────────────────────────────────────── */
export function HeroOrb() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
