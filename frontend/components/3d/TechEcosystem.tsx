"use client";

import {
  useRef, useMemo, useState, useCallback, useEffect,
} from "react";
import {
  Canvas, useFrame, useThree, ThreeEvent,
} from "@react-three/fiber";
import { Float, Stars, Html, Billboard } from "@react-three/drei";
import * as THREE from "three";

/* ── Technology node data ────────────────────────────── */
export const TECH_NODES = [
  {
    id:    "python",
    label: "Python",
    emoji: "🐍",
    color: "#22c55e",
    emissive: "#14532d",
    section: "#courses",
    angle:  0,
    radius: 3.2,
    y: 0.4,
  },
  {
    id:    "javascript",
    label: "JavaScript",
    emoji: "⚡",
    color: "#facc15",
    emissive: "#713f12",
    section: "#courses",
    angle: Math.PI / 3,
    radius: 3.2,
    y: -0.3,
  },
  {
    id:    "frontend",
    label: "Frontend",
    emoji: "🌐",
    color: "#60a5fa",
    emissive: "#1e3a8a",
    section: "#courses",
    angle: (2 * Math.PI) / 3,
    radius: 3.2,
    y: 0.6,
  },
  {
    id:    "vibe",
    label: "Vibe Coding",
    emoji: "🎯",
    color: "#f97316",
    emissive: "#7c2d12",
    section: "#courses",
    angle: Math.PI,
    radius: 3.2,
    y: -0.2,
  },
  {
    id:    "ai",
    label: "AI / ML",
    emoji: "🤖",
    color: "#a78bfa",
    emissive: "#3b0764",
    section: "#courses",
    angle: (4 * Math.PI) / 3,
    radius: 3.2,
    y: 0.5,
  },
  {
    id:    "data",
    label: "Data Science",
    emoji: "📊",
    color: "#22d3ee",
    emissive: "#164e63",
    section: "#courses",
    angle: (5 * Math.PI) / 3,
    radius: 3.2,
    y: -0.4,
  },
] as const;

/* ── Centre core orb ─────────────────────────────────── */
function CoreOrb({ hovered }: { hovered: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.3 + mouse.x * 0.15;
    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1 + mouse.y * 0.1;
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.06 + (hovered ? 0.1 : 0);
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial
          color="#22c55e"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
      {/* main orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#0d2818"
          emissive="#16a34a"
          emissiveIntensity={hovered ? 1.2 : 0.7}
          roughness={0.05}
          metalness={0.9}
          wireframe={false}
        />
      </mesh>
      {/* inner wireframe */}
      <mesh>
        <sphereGeometry args={[1.01, 18, 18]} />
        <meshBasicMaterial
          color="#4ade80"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </Float>
  );
}

/* ── Orbit ring ──────────────────────────────────────── */
function OrbitRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * 0.04;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[3.2, 0.008, 6, 120]} />
      <meshBasicMaterial color="#4ade80" transparent opacity={0.18} />
    </mesh>
  );
}

/* ── Connection line from centre to node ─────────────── */
function ConnectionLine({
  position,
  active,
}: {
  position: THREE.Vector3;
  active: boolean;
}) {
  const obj = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      position,
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: "#4ade80",
      transparent: true,
      opacity: 0.1,
    });
    return new THREE.Line(geom, mat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    const mat = obj.material as THREE.LineBasicMaterial;
    mat.opacity = active
      ? 0.55 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      : 0.1;
  });

  return <primitive object={obj} />;
}

/* ── Single technology node ──────────────────────────── */
function TechNode({
  node,
  groupRotation,
  onHover,
  onUnhover,
  onClick,
  isHovered,
  prefersReducedMotion,
}: {
  node: (typeof TECH_NODES)[number];
  groupRotation: THREE.Euler;
  onHover: (id: string) => void;
  onUnhover: () => void;
  onClick: (section: string) => void;
  isHovered: boolean;
  prefersReducedMotion: boolean;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const scale    = useRef(1);

  const worldPos = useMemo(() => {
    return new THREE.Vector3(
      Math.cos(node.angle) * node.radius,
      node.y,
      Math.sin(node.angle) * node.radius
    );
  }, [node]);

  useFrame((state) => {
    if (!meshRef.current || !outerRef.current) return;
    const t    = state.clock.elapsedTime;
    const tgt  = isHovered ? 1.35 : 1;
    scale.current += (tgt - scale.current) * 0.1;
    meshRef.current.scale.setScalar(scale.current);

    // Pulse outer ring
    const ps = 1 + Math.sin(t * 2 + node.angle) * 0.08;
    outerRef.current.scale.setScalar(ps * (isHovered ? 1.2 : 1));

    // Subtle self-rotation
    if (!prefersReducedMotion) {
      meshRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group position={worldPos}>
      <ConnectionLine position={worldPos.clone().negate()} active={isHovered} />

      {/* Outer glow ring */}
      <mesh ref={outerRef}>
        <torusGeometry args={[0.32, 0.025, 8, 32]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isHovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* Main sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(node.id);
        }}
        onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onUnhover();
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick(node.section);
        }}
      >
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.emissive}
          emissiveIntensity={isHovered ? 1.5 : 0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Label — always faces camera via Billboard */}
      {isHovered && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Html
            center
            distanceFactor={6}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              style={{
                background: "rgba(4,13,7,0.85)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${node.color}40`,
                borderRadius: "12px",
                padding: "8px 14px",
                color: node.color,
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: "nowrap",
                boxShadow: `0 0 20px ${node.color}30`,
                transform: "translateY(-44px)",
              }}
            >
              {node.emoji} {node.label}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}

/* ── Ambient particle cloud ──────────────────────────── */
function ParticleCloud() {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 220;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const g     = new THREE.Color("#4ade80");
    const b     = new THREE.Color("#60a5fa");
    for (let i = 0; i < count; i++) {
      const r     = 4.5 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const c        = Math.random() > 0.45 ? g : b;
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]}    attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

/* ── Root scene ──────────────────────────────────────── */
function EcosystemScene({
  onNodeClick,
  prefersReducedMotion,
}: {
  onNodeClick: (section: string, id: string) => void;
  prefersReducedMotion: boolean;
}) {
  const groupRef       = useRef<THREE.Group>(null);
  const { mouse, size } = useThree();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const targetRot      = useRef({ x: 0, y: 0 });
  const currentRot     = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!groupRef.current || prefersReducedMotion) return;
    const t = state.clock.elapsedTime;
    // Auto-rotate + mouse parallax
    targetRot.current.y = t * 0.08 + mouse.x * 0.3;
    targetRot.current.x = Math.sin(t * 0.15) * 0.08 + mouse.y * 0.15;

    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.04;
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.04;

    groupRef.current.rotation.x = currentRot.current.x;
    groupRef.current.rotation.y = currentRot.current.y;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]}   intensity={2.5} color="#4ade80" />
      <pointLight position={[-6, -4, 4]} intensity={1.2} color="#60a5fa" />
      <pointLight position={[0, -6, -4]} intensity={0.6} color="#22c55e" />
      <Stars radius={90} depth={60} count={600} factor={2.5} fade />
      <ParticleCloud />

      <group ref={groupRef}>
        <OrbitRing />
        <CoreOrb hovered={hoveredId !== null} />

        {TECH_NODES.map((node) => (
          <TechNode
            key={node.id}
            node={node}
            groupRotation={groupRef.current?.rotation ?? new THREE.Euler()}
            isHovered={hoveredId === node.id}
            prefersReducedMotion={prefersReducedMotion}
            onHover={setHoveredId}
            onUnhover={() => setHoveredId(null)}
            onClick={(section) => onNodeClick(section, node.id)}
          />
        ))}
      </group>
    </>
  );
}

/* ── Public export ───────────────────────────────────── */
export function TechEcosystem({
  onNodeClick,
}: {
  onNodeClick?: (section: string, id: string) => void;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleClick = useCallback(
    (section: string, id: string) => {
      onNodeClick?.(section, id);
      document.querySelector(section)?.scrollIntoView({ behavior: "smooth" });
    },
    [onNodeClick]
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 52 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, Math.min(window.devicePixelRatio, 2)]}
      style={{ background: "transparent" }}
      aria-label="Interactive 3D technology ecosystem"
    >
      <EcosystemScene
        onNodeClick={handleClick}
        prefersReducedMotion={prefersReducedMotion}
      />
    </Canvas>
  );
}
