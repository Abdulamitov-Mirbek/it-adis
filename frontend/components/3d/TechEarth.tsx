"use client";

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  Suspense,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html, useTexture } from "@react-three/drei";
import { useTranslations } from "next-intl";
import * as THREE from "three";
import { TECHNOLOGIES, techIconPath, type TechDef } from "@/lib/tech-data";
import { useRouter } from "@/i18n/navigation";

/* ────────────────────────────────────────────────────────────
   Sun direction, in world space. The Earth spins beneath it, so
   the terminator sweeps across the surface and city lights come
   up on the trailing edge — which is the whole point of the
   day/night shader below.
   ──────────────────────────────────────────────────────────── */
// Angled well to the side rather than behind the camera: a head-on sun lights
// the whole visible disc and hides the terminator, which is where the night
// lights and the atmospheric scattering actually read.
const SUN_DIRECTION = new THREE.Vector3(0.94, 0.26, 0.30).normalize();
const AXIAL_TILT = (23.4 * Math.PI) / 180;

const TEXTURES = {
  day: "/textures/earth/day.jpg",
  night: "/textures/earth/night.png",
  clouds: "/textures/earth/clouds.png",
  normal: "/textures/earth/normal.jpg",
  specular: "/textures/earth/specular.jpg",
};

// Insertion order is the order drei hands the loaded textures back as an array.
const TEXTURE_KEYS = Object.keys(TEXTURES) as (keyof typeof TEXTURES)[];

/* ── Earth surface shader ─────────────────────────────────────
   A MeshStandardMaterial cannot express this: it has no way to
   swap the albedo for an emissive night map based on the angle
   to the sun. Hence a custom pair of shaders.
   ──────────────────────────────────────────────────────────── */
const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;

    // Analytic tangent for a UV sphere: the direction of increasing u runs
    // around the axis of rotation. Guarded so the poles, where the cross
    // product collapses, fall back to a valid basis instead of NaN.
    vec3 axis = vec3(0.0, 1.0, 0.0);
    vec3 t = cross(axis, normal);
    if (length(t) < 0.001) t = vec3(1.0, 0.0, 0.0);

    mat3 nm = mat3(modelMatrix);
    vWorldNormal  = normalize(nm * normal);
    vWorldTangent = normalize(nm * normalize(t));
    vec4 wp       = modelMatrix * vec4(position, 1.0);
    vWorldPos     = wp.xyz;

    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D normalMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;
  uniform vec3 cameraPosition_;
  uniform vec3 atmosphereColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldTangent;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 T = normalize(vWorldTangent - N * dot(N, vWorldTangent));
    vec3 B = cross(N, T);

    // Surface relief. Kept subtle — full-strength normal mapping on a globe
    // this small reads as noise rather than terrain.
    vec3 nTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    nTex.xy *= 0.45;
    vec3 n = normalize(mat3(T, B, N) * nTex);

    vec3 L = normalize(sunDirection);
    float lambert = dot(n, L);

    // Soft terminator. The band either side of zero is where the night
    // lights fade in, so it wants to be wide enough to read as dusk.
    float dayAmount = smoothstep(-0.18, 0.32, lambert);

    vec3 dayColor   = texture2D(dayMap, vUv).rgb;
    vec3 nightColor = texture2D(nightMap, vUv).rgb;

    // Warm the city lights slightly and let them bloom a little.
    nightColor *= vec3(1.25, 1.05, 0.72) * 1.45;

    vec3 color = mix(nightColor, dayColor * (0.35 + 0.85 * max(lambert, 0.0)), dayAmount);

    // Specular glint on water only — the specular map is white over oceans.
    vec3 V = normalize(cameraPosition_ - vWorldPos);
    vec3 H = normalize(L + V);
    float water = texture2D(specularMap, vUv).r;
    float spec = pow(max(dot(n, H), 0.0), 42.0) * water * dayAmount * 0.55;
    color += vec3(0.85, 0.92, 1.0) * spec;

    // Atmospheric limb: the air glows where we look through the most of it.
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);
    color += atmosphereColor * fresnel * (0.28 + 0.55 * dayAmount);

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ── Atmosphere shell ────────────────────────────────────── */
const ATMO_VERT = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 glowColor;
  uniform vec3 sunDirection;
  uniform vec3 cameraPosition_;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition_ - vWorldPos);
    // Rendered on the back faces, so the normal points away from us.
    float rim = pow(max(dot(-N, V), 0.0), 3.2);
    float sun = smoothstep(-0.55, 0.55, dot(-N, normalize(sunDirection)));
    gl_FragColor = vec4(glowColor, rim * (0.18 + 0.72 * sun));
  }
`;

/* ── Cloud layer ─────────────────────────────────────────── */
const CLOUD_VERT = EARTH_VERT;

const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    float a = texture2D(cloudMap, vUv).r;
    if (a < 0.03) discard;
    vec3 N = normalize(vWorldNormal);
    float lambert = dot(N, normalize(sunDirection));
    // Clouds go dark on the night side rather than glowing white over it.
    float lit = smoothstep(-0.28, 0.42, lambert);
    vec3 col = mix(vec3(0.05, 0.07, 0.10), vec3(1.0), lit);
    gl_FragColor = vec4(col, a * (0.16 + 0.72 * lit));
  }
`;

/* ── Earth ───────────────────────────────────────────────── */
function Earth({ quality }: { quality: Quality }) {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Configured in useTexture's onLoad rather than afterwards: the textures it
  // returns belong to a cache shared across the app, and mutating them during
  // render is both a lint error and a real hazard.
  //
  // The callback is handed an ARRAY even when the input is a keyed record —
  // drei's types say otherwise, and trusting them threw
  // "Cannot set properties of undefined" at runtime. Normalise both shapes.
  const { day, night, clouds, normal, specular } = useTexture(
    TEXTURES,
    (loaded) => {
      const maps: Record<string, THREE.Texture> = Array.isArray(loaded)
        ? Object.fromEntries(TEXTURE_KEYS.map((k, i) => [k, loaded[i]]))
        : (loaded as unknown as Record<string, THREE.Texture>);

      // Colour maps are authored in sRGB; the data maps must stay linear or
      // the lighting maths is applied to gamma-encoded values.
      for (const key of TEXTURE_KEYS) {
        const t = maps[key];
        if (!t) continue;
        if (key === "day" || key === "night") t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.wrapS = THREE.RepeatWrapping;
      }
    }
  );

  const earthUniforms = useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      normalMap: { value: normal },
      specularMap: { value: specular },
      sunDirection: { value: SUN_DIRECTION },
      cameraPosition_: { value: new THREE.Vector3() },
      atmosphereColor: { value: new THREE.Color("#3fa9ff") },
    }),
    [day, night, normal, specular]
  );

  const cloudUniforms = useMemo(
    () => ({
      cloudMap: { value: clouds },
      sunDirection: { value: SUN_DIRECTION },
    }),
    [clouds]
  );

  const atmoUniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color("#4ade80") },
      sunDirection: { value: SUN_DIRECTION },
      cameraPosition_: { value: new THREE.Vector3() },
    }),
    []
  );

  useFrame((state, delta) => {
    const cam = state.camera.position;
    earthUniforms.cameraPosition_.value.copy(cam);
    atmoUniforms.cameraPosition_.value.copy(cam);

    if (quality === "static") return;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.035;
    // Clouds run slightly faster than the ground, as weather does.
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.048;
  });

  const seg = quality === "high" ? 96 : 48;

  return (
    <group ref={groupRef} rotation={[0, 0, AXIAL_TILT]}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, seg, seg]} />
        <shaderMaterial
          vertexShader={EARTH_VERT}
          fragmentShader={EARTH_FRAG}
          uniforms={earthUniforms}
        />
      </mesh>

      {quality !== "low" && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[1.012, seg, seg]} />
          <shaderMaterial
            vertexShader={CLOUD_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={cloudUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}

      <mesh scale={1.22}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial
          vertexShader={ATMO_VERT}
          fragmentShader={ATMO_FRAG}
          uniforms={atmoUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ── Chip texture ────────────────────────────────────────────
   Drawn with Path2D from the same icon geometry the technology
   pages use, so there is one source of truth for every mark and
   no extra image requests.
   ──────────────────────────────────────────────────────────── */
function useChipTexture(tech: TechDef, active: boolean) {
  return useMemo(() => {
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const cx = S / 2;
    const r = S * 0.36;

    // Glow halo
    const halo = ctx.createRadialGradient(cx, cx, r * 0.7, cx, cx, S * 0.5);
    halo.addColorStop(0, `${tech.color}${active ? "66" : "33"}`);
    halo.addColorStop(1, `${tech.color}00`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, S, S);

    // Body
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fillStyle = active ? "rgba(12,28,18,0.96)" : "rgba(6,16,10,0.92)";
    ctx.fill();

    // Ring
    ctx.lineWidth = active ? 7 : 4.5;
    ctx.strokeStyle = tech.color;
    ctx.globalAlpha = active ? 1 : 0.75;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Mark, scaled from its 24 x 24 authoring box
    const icon = new Path2D(techIconPath(tech));
    const target = r * 1.05;
    const scale = target / 24;
    ctx.save();
    ctx.translate(cx - target / 2, cx - target / 2);
    ctx.scale(scale, scale);
    ctx.fillStyle = tech.color;
    ctx.fill(icon);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [tech, active]);
}

/* ── One orbiting technology ─────────────────────────────── */
function TechChip({
  tech,
  label,
  hovered,
  onHover,
  onLeave,
  onSelect,
  paused,
  orbitScale,
  chipScale,
}: {
  tech: TechDef;
  label: string;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
  paused: boolean;
  orbitScale: number;
  chipScale: number;
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const angle = useRef(tech.orbit.phase);
  const scale = useRef(chipScale);
  const texture = useChipTexture(tech, hovered);

  useFrame((_, delta) => {
    if (!spriteRef.current) return;

    if (!paused) angle.current += delta * tech.orbit.speed;

    const radius = tech.orbit.radius * orbitScale;
    spriteRef.current.position.set(
      Math.cos(angle.current) * radius,
      0,
      Math.sin(angle.current) * radius
    );

    const target = hovered ? chipScale * 1.38 : chipScale;
    scale.current += (target - scale.current) * 0.12;
    spriteRef.current.scale.setScalar(scale.current);
  });

  if (!texture) return null;

  return (
    <sprite
      ref={spriteRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onLeave();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <spriteMaterial map={texture} transparent depthWrite={false} />
      {hovered && (
        <Html center distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div
            style={{
              transform: "translateY(-52px)",
              whiteSpace: "nowrap",
              padding: "7px 14px",
              borderRadius: 999,
              background: "rgba(4,13,7,0.9)",
              border: `1px solid ${tech.color}55`,
              color: tech.color,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-space), system-ui, sans-serif",
              boxShadow: `0 0 24px ${tech.color}40`,
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </sprite>
  );
}

/* ── Camera fitting ──────────────────────────────────────────
   A fixed camera distance only frames correctly at one aspect
   ratio. On a phone the hero canvas is far narrower than it is
   on a desktop, and the outer chips fell outside the frame.
   Solve for the distance that fits the widest orbit both
   vertically and horizontally, and re-solve whenever the canvas
   is resized or rotated.
   ──────────────────────────────────────────────────────────── */
function FitCamera({ maxRadius }: { maxRadius: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    const halfFov = (cam.fov * Math.PI) / 360;
    // Chips are billboards ~0.45 units across at their hover scale.
    const needed = maxRadius + 0.5;
    const distV = needed / Math.tan(halfFov);
    const distH = needed / (Math.tan(halfFov) * Math.max(aspect, 0.1));
    cam.position.setZ(Math.max(distV, distH));
    cam.updateProjectionMatrix();
  }, [camera, size, maxRadius]);

  return null;
}

/* ── Orbit ring ──────────────────────────────────────────── */
function OrbitRing({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.004, 6, 128]} />
      <meshBasicMaterial color={color} transparent opacity={0.16} />
    </mesh>
  );
}

/* ── Scene ───────────────────────────────────────────────── */
type Quality = "high" | "low" | "static";

function Scene({
  quality,
  hoveredSlug,
  setHoveredSlug,
  onSelect,
  labels,
}: {
  quality: Quality;
  hoveredSlug: string | null;
  setHoveredSlug: (s: string | null) => void;
  onSelect: (t: TechDef) => void;
  labels: Record<string, string>;
}) {
  const systemRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!systemRef.current || quality === "static") return;
    // Gentle parallax so the system feels responsive without the viewer
    // having to grab and drag it.
    const { x, y } = state.pointer;
    systemRef.current.rotation.y +=
      (x * 0.22 - systemRef.current.rotation.y) * 0.03;
    systemRef.current.rotation.x +=
      (-y * 0.16 - systemRef.current.rotation.x) * 0.03;
  });

  // One <group> per orbital plane, so a plane's tilt is expressed once.
  const planes = useMemo(() => {
    const byPlane = new Map<string, TechDef[]>();
    for (const t of TECHNOLOGIES) {
      const k = `${t.orbit.radius}:${t.orbit.inclination}`;
      byPlane.set(k, [...(byPlane.get(k) ?? []), t]);
    }
    return [...byPlane.values()];
  }, []);

  // On a phone the canvas is small, so the chips are pulled closer in and drawn
  // proportionally larger — otherwise the globe shrinks to fit orbits that are
  // mostly empty space, and the tap targets end up too small to hit.
  const orbitScale = quality === "high" ? 1 : 0.78;
  const chipScale = quality === "high" ? 0.62 : 0.78;
  const maxRadius = Math.max(...TECHNOLOGIES.map((t) => t.orbit.radius)) * orbitScale;

  return (
    <>
      <FitCamera maxRadius={maxRadius} />

      {quality !== "low" && (
        <Stars radius={80} depth={50} count={900} factor={2.4} fade speed={0.4} />
      )}

      <Suspense fallback={null}>
        <Earth quality={quality} />
      </Suspense>

      <group ref={systemRef}>
        {planes.map((group, i) => (
          <group
            key={i}
            rotation={[group[0].orbit.inclination, 0, group[0].orbit.inclination * 0.4]}
          >
            <OrbitRing
              radius={group[0].orbit.radius * orbitScale}
              color="#4ade80"
            />
            {group.map((tech) => (
              <TechChip
                key={tech.slug}
                tech={tech}
                label={labels[tech.slug] ?? tech.slug}
                hovered={hoveredSlug === tech.slug}
                paused={quality === "static" || hoveredSlug === tech.slug}
                orbitScale={orbitScale}
                chipScale={chipScale}
                onHover={() => setHoveredSlug(tech.slug)}
                onLeave={() => setHoveredSlug(null)}
                onSelect={() => onSelect(tech)}
              />
            ))}
          </group>
        ))}
      </group>
    </>
  );
}

/* ── Quality tier ────────────────────────────────────────── */
function useQuality(): Quality {
  const [quality, setQuality] = useState<Quality>("high");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 1023px)");

    const resolve = () => {
      if (reduce.matches) return setQuality("static");
      setQuality(small.matches ? "low" : "high");
    };

    resolve();
    reduce.addEventListener("change", resolve);
    small.addEventListener("change", resolve);
    return () => {
      reduce.removeEventListener("change", resolve);
      small.removeEventListener("change", resolve);
    };
  }, []);

  return quality;
}

/* ── Public component ────────────────────────────────────── */
export function TechEarth({ overlay }: { overlay?: ReactNode }) {
  const t = useTranslations("tech.items");
  const router = useRouter();
  const quality = useQuality();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const labels = useMemo(
    () =>
      Object.fromEntries(
        TECHNOLOGIES.map((tech) => [tech.slug, t(`${tech.key}.name`)])
      ),
    [t]
  );

  return (
    <div className="relative w-full h-full">
      <Canvas
        // Far enough back that the outermost orbit (2.92) plus a chip's radius
        // stays inside the frame at the hero's roughly-square aspect.
        camera={{ position: [0, 0.55, 8.2], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={quality === "high" ? [1, 2] : [1, 1.5]}
        style={{
          background: "transparent",
          cursor: hoveredSlug ? "pointer" : "default",
        }}
        // The canvas is a decorative rendering of the link list in `overlay`,
        // which is what assistive technology actually reads.
        aria-hidden="true"
      >
        <Scene
          quality={quality}
          hoveredSlug={hoveredSlug}
          setHoveredSlug={setHoveredSlug}
          onSelect={(tech) => router.push(`/tech/${tech.slug}`)}
          labels={labels}
        />
      </Canvas>

      {overlay}
    </div>
  );
}

export default TechEarth;
