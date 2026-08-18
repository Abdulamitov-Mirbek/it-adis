"use client";

import { useEffect, useRef, Suspense, lazy, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { TECH_NODES } from "@/components/3d/TechEcosystem";

// Lazy-load 3D so it never blocks SSR / initial paint
const TechEcosystem = lazy(() =>
  import("@/components/3d/TechEcosystem").then((m) => ({ default: m.TechEcosystem }))
);

/* ── Ecosystem fallback for SSR / no-JS ─────────────── */
function EcosystemFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-64 h-64">
        {/* Static rings */}
        <div className="absolute inset-0 rounded-full border border-green-500/20 animate-pulse" />
        <div className="absolute inset-8 rounded-full border border-green-500/15" />
        <div className="absolute inset-16 rounded-full bg-green-500/10 border border-green-500/30" />
        {/* Central glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 opacity-80 blur-sm" />
        </div>
      </div>
    </div>
  );
}

/* ── Mobile tech grid (replaces 3D on small screens) ── */
function MobileTechGrid() {
  const t = useTranslations("courses");
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {TECH_NODES.map((node) => (
        <button
          key={node.id}
          onClick={() =>
            document.querySelector(node.section)?.scrollIntoView({ behavior: "smooth" })
          }
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass border border-white/8 hover:border-green-500/30 transition-all duration-200 active:scale-95"
        >
          <span className="text-2xl">{node.emoji}</span>
          <span className="text-[11px] font-medium text-green-200/70 text-center leading-tight">
            {node.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Active-node tooltip above canvas ───────────────── */
function NodeTooltip({ activeId }: { activeId: string | null }) {
  const node = TECH_NODES.find((n) => n.id === activeId);
  if (!node) return null;
  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 glass border rounded-2xl px-5 py-2.5 text-sm font-semibold pointer-events-none transition-all duration-200 z-20"
      style={{ borderColor: `${node.color}40`, color: node.color }}
    >
      {node.emoji} Click to explore <strong>{node.label}</strong>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────── */
export function Hero() {
  const t = useTranslations("hero");
  const ts = useTranslations("hero.stats");

  const badgeRef   = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef     = useRef<HTMLParagraphElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const STATS = [
    { value: "2 500+", label: ts("students") },
    { value: "95%",    label: ts("placement") },
    { value: "5+",     label: ts("courses") },
    { value: "3+",     label: ts("years") },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(badgeRef.current,   { y: 30, opacity: 0, duration: 0.7 })
        .from(headingRef.current, { y: 50, opacity: 0, duration: 0.9 }, "-=0.4")
        .from(subRef.current,     { y: 30, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(ctaRef.current,     { y: 30, opacity: 0, duration: 0.7 }, "-=0.4");
      if (statsRef.current) {
        tl.from(
          Array.from(statsRef.current.children),
          { y: 20, opacity: 0, duration: 0.5, stagger: 0.1 },
          "-=0.3"
        );
      }
    });
    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) =>
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-dark"
    >
      {/* ── Animated background ───────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #16a34a 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            animation: "float 10s ease-in-out 2s infinite",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, #22c55e 0%, transparent 70%)",
            animation: "float 7s ease-in-out 4s infinite",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            animation: "grid-move 8s linear infinite",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-16 items-center">

          {/* ── Left column ──────────────────────── */}
          <div className="flex flex-col gap-7">
            {/* Badge */}
            <div ref={badgeRef} className="inline-flex items-center gap-2 self-start">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-300 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-green" />
                <Sparkles size={14} />
                {t("badge")}
              </div>
            </div>

            {/* Headline */}
            <h1
              ref={headingRef}
              className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold leading-[1.06] tracking-tight"
            >
              {t("title1")}{" "}
              <span className="relative inline-block">
                <span className="gradient-text text-glow">{t("title2")}</span>
                <svg
                  className="absolute -bottom-2 left-0 w-full overflow-visible"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 8 Q75 2 150 8 Q225 14 298 6"
                    stroke="#4ade80"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
              </span>
              <br className="hidden sm:block" />
              {t("title3")}
            </h1>

            {/* Subtitle */}
            <p
              ref={subRef}
              className="text-lg sm:text-xl text-green-100/60 leading-relaxed max-w-xl"
            >
              {t("subtitle")}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap gap-4">
              <SparkleButton onClick={() => scrollTo("#courses")}>
                {t("cta1")}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </SparkleButton>

              <SparkleButton variant="secondary" onClick={() => scrollTo("#courses")}>
                <Play size={16} className="fill-current" />
                {t("cta2")}
              </SparkleButton>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="flex flex-wrap gap-6 pt-2">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-display text-2xl font-bold gradient-text">
                    {s.value}
                  </span>
                  <span className="text-sm text-green-100/50 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Mobile tech grid — shown only on small screens */}
            <div className="lg:hidden">
              <p className="text-xs text-green-400/60 mb-3 tracking-wide uppercase">
                Technologies you&apos;ll master
              </p>
              <MobileTechGrid />
            </div>
          </div>

          {/* ── Right column: 3D ecosystem ────────── */}
          <div className="relative h-[480px] lg:h-[640px] hidden lg:flex items-center justify-center">
            {/* Glow backdrop */}
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              <div
                className="w-72 h-72 rounded-full blur-3xl opacity-20"
                style={{
                  background: "radial-gradient(circle, #22c55e 0%, #16a34a 40%, transparent 70%)",
                }}
              />
            </div>

            {/* 3D Canvas */}
            <Suspense fallback={<EcosystemFallback />}>
              <TechEcosystem
                onNodeClick={(_, id) => setActiveNodeId(id)}
              />
            </Suspense>

            {/* Node tooltip */}
            <NodeTooltip activeId={activeNodeId} />

            {/* Hint text */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-green-500/40 tracking-widest uppercase whitespace-nowrap pointer-events-none">
              Click a node to explore
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-green-500/40 pointer-events-none">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-green-500/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
