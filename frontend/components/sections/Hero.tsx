"use client";

import { useEffect, useRef, Suspense, lazy } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ArrowRight, Play } from "lucide-react";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { TechLinks } from "@/components/ui/TechLinks";
import { CanvasErrorBoundary } from "@/components/3d/CanvasErrorBoundary";

// Lazy-loaded so the 3D bundle and the ~2.6 MB of Earth textures never block
// first paint or server rendering.
const TechEarth = lazy(() =>
  import("@/components/3d/TechEarth").then((m) => ({ default: m.TechEarth }))
);

/* ── Placeholder shown while the globe loads ──────────── */
function EarthFallback() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="relative w-56 h-56 lg:w-72 lg:h-72">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-100 to-blue-100 blur-sm animate-pulse" />
        <div className="absolute -inset-4 rounded-full border border-green-200/70" />
        <div className="absolute -inset-10 rounded-full border border-slate-200" />
      </div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
export function Hero() {
  const t = useTranslations("hero");
  const ts = useTranslations("hero.stats");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const STATS = [
    { value: "2 500+", label: ts("students") },
    { value: "95%", label: ts("placement") },
    { value: "5+", label: ts("courses") },
    { value: "3+", label: ts("years") },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(headingRef.current, { y: 50, opacity: 0, duration: 0.9 })
        .from(subRef.current, { y: 30, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(ctaRef.current, { y: 30, opacity: 0, duration: 0.7 }, "-=0.4");
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
      className="relative min-h-screen flex items-center overflow-hidden bg-white"
    >
      {/* ── Background ─────────────────────────────
          On the dark theme this was three saturated glowing orbs over a neon
          line grid. Both ideas invert badly: a bright orb on white turns into
          a muddy smudge, and a 1px green grid reads as dirt on the screen.
          What replaces them is a very soft tinted wash in the corners plus a
          faint dot grid that fades out before it reaches the headline, so the
          type always sits on clean white. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full opacity-[0.55]"
          style={{
            background:
              "radial-gradient(circle, rgba(220,252,231,1) 0%, rgba(240,253,244,0.6) 45%, transparent 70%)",
            animation: "float 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/4 -right-52 w-[620px] h-[620px] rounded-full opacity-[0.5]"
          style={{
            background:
              "radial-gradient(circle, rgba(219,234,254,1) 0%, rgba(239,246,255,0.6) 45%, transparent 70%)",
            animation: "float 14s ease-in-out 2s infinite",
          }}
        />
        {/* Masked so the grid is visible at the edges and gone behind the
            headline — an unmasked grid competes with the type. */}
        <div
          className="absolute inset-0 dot-grid opacity-70"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, black 100%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 pb-14 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-9 lg:gap-8 xl:gap-16 items-center">
          {/* ── Left column ──────────────────────── */}
          <div className="flex flex-col gap-6 sm:gap-7">
            <h1
              ref={headingRef}
              className="font-display text-[2.4rem] sm:text-5xl md:text-6xl xl:text-7xl font-bold leading-[1.12] sm:leading-[1.06] tracking-tight"
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
                    stroke="#16a34a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </svg>
              </span>
              <br className="hidden sm:block" />
              {t("title3")}
            </h1>

            <p
              ref={subRef}
              className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl"
            >
              {t("subtitle")}
            </p>

            {/* Buttons go full width on phones so they are comfortable thumb
                targets rather than two narrow pills sharing a row. */}
            <div ref={ctaRef} className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <SparkleButton
                onClick={() => scrollTo("#courses")}
                className="w-full sm:w-auto justify-center"
              >
                {t("cta1")}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </SparkleButton>

              <SparkleButton
                variant="secondary"
                onClick={() => scrollTo("#courses")}
                className="w-full sm:w-auto justify-center"
              >
                <Play size={16} className="fill-current" />
                {t("cta2")}
              </SparkleButton>
            </div>

            <div
              ref={statsRef}
              className="grid grid-cols-2 gap-x-4 gap-y-5 sm:flex sm:flex-wrap sm:gap-6 pt-2"
            >
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="font-display text-2xl sm:text-3xl font-bold gradient-text">
                    {s.value}
                  </span>
                  <span className="text-sm text-slate-600 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: the globe ───────────── */}
          <div className="relative h-[360px] sm:h-[440px] lg:h-[640px] flex items-center justify-center">
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              <div
                className="w-[22rem] h-[22rem] rounded-full blur-3xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, rgba(187,247,208,0.9) 0%, rgba(191,219,254,0.6) 45%, transparent 72%)",
                }}
              />
            </div>

            <CanvasErrorBoundary fallback={<EarthFallback />}>
              <Suspense fallback={<EarthFallback />}>
                <TechEarth overlay={<TechLinks variant="overlay" />} />
              </Suspense>
            </CanvasErrorBoundary>

            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] sm:text-xs text-green-700 tracking-widest uppercase whitespace-nowrap pointer-events-none">
              {t("techHint")}
            </p>
          </div>

          {/* ── Technology list — visible on small screens ── */}
          <div className="lg:hidden">
            <p className="text-xs text-green-700 mb-3 tracking-wide uppercase font-medium">
              {t("techListLabel")}
            </p>
            <TechLinks variant="grid" />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-green-700 pointer-events-none">
        <span className="text-xs tracking-widest uppercase">{t("scroll")}</span>
        <div className="w-px h-8 bg-gradient-to-b from-green-500/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
