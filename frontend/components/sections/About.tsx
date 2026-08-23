"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Cpu, Globe2, Lightbulb, Trophy } from "lucide-react";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { api, type Stats } from "@/lib/api";

gsap.registerPlugin(ScrollTrigger);

function AnimatedCounter({
  value, suffix, trigger,
}: { value: number; suffix: string; trigger: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = value / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

export function About() {
  const t = useTranslations("about");
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const [counted, setCounted] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        // Fallback to default stats
        setStats({
          students: 2500,
          employed: 95,
          courses: 5,
          years: 3,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const STATS = stats ? [
    { value: stats.students, suffix: "+", labelKey: "students" },
    { value: stats.employed, suffix: "%", labelKey: "employed" },
    { value: stats.courses,  suffix: "+", labelKey: "courses"  },
    { value: stats.years,    suffix: "+", labelKey: "years"    },
  ] : [] as const;

  const PILLARS = [
    { icon: Cpu,       key: "curriculum" },
    { icon: Lightbulb, key: "projects"   },
    { icon: Globe2,    key: "global"     },
    { icon: Trophy,    key: "results"    },
  ] as const;

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.fromTo(leftRef.current, { x: -60, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
    });
    gsap.fromTo(rightRef.current, { x: 60, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.15,
      scrollTrigger: { trigger: sectionRef.current, start: "top 75%" },
    });
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 70%",
      onEnter: () => setCounted(true),
    });
  }, []);

  // Build points array from translation
  const points = [0, 1, 2, 3].map((i) => t(`points.${i}` as "points.0"));

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative section-padding overflow-hidden"
      style={{ background: "linear-gradient(180deg, #040d07 0%, #071a0e 50%, #040d07 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)" }} />
        <div className="absolute right-0 top-1/4 w-[300px] h-[300px] rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div ref={leftRef} className="flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-300 text-sm font-medium mb-5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                {t("badge")}
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                {t("title1")}
                <br />
                {t("title2")}{" "}
                <span className="gradient-text">{t("titleGreen")}</span>
              </h2>
              <p className="text-green-100/75 text-lg leading-relaxed mb-6">{t("p1")}</p>
              <p className="text-green-100/70 leading-relaxed">{t("p2")}</p>
            </div>

            <div className="flex flex-col gap-3">
              {points.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-green-100/70 text-sm">{point}</span>
                </div>
              ))}
            </div>

            <SparkleButton
              onClick={() =>
                document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
              }
              className="self-start px-7 py-3.5"
            >
              {t("cta")}
            </SparkleButton>
          </div>

          {/* Right */}
          <div ref={rightRef} className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 mb-2">
              {statsLoading ? (
                // Loading skeleton
                [...Array(4)].map((_, i) => (
                  <div key={i} className="glass border border-green-900/40 rounded-3xl p-6 animate-pulse">
                    <div className="h-8 bg-green-500/10 rounded mb-2"></div>
                    <div className="h-4 bg-green-500/10 rounded w-2/3"></div>
                  </div>
                ))
              ) : (
                STATS.map((s) => (
                  <div key={s.labelKey}
                    className="glass border border-green-900/40 rounded-3xl p-6 hover:border-green-500/30 transition-all duration-300 group"
                  >
                    <div className="font-display text-4xl font-bold gradient-text mb-1">
                      <AnimatedCounter value={s.value} suffix={s.suffix} trigger={counted} />
                    </div>
                    <div className="text-sm text-green-100/70">{t(`stats.${s.labelKey}` as "stats.students")}</div>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PILLARS.map(({ icon: Icon, key }) => (
                <div key={key}
                  className="flex items-start gap-4 glass border border-green-900/30 rounded-2xl p-4 hover:border-green-500/30 transition-all duration-300"
                >
                  <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 shrink-0">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm mb-1">
                      {t(`pillars.${key}.title` as "pillars.curriculum.title")}
                    </h4>
                    <p className="text-xs text-green-100/70 leading-relaxed">
                      {t(`pillars.${key}.desc` as "pillars.curriculum.desc")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
