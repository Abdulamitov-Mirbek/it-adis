"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Code2, Brain, Layers, Zap, Globe, Database,
  ArrowRight, Clock, Users, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SparkleButton } from "@/components/ui/SparkleButton";

gsap.registerPlugin(ScrollTrigger);

const COURSE_META = [
  {
    key:      "python" as const,
    icon:     Code2,
    badgeKey: "popular",
    duration: "4 months",
    students: "840+",
    rating:   4.9,
    tags:     ["Beginner", "Backend", "Data"],
    gradient: "from-green-600/20 to-green-900/10",
    border:   "border-green-500/30 hover:border-green-400/60",
    iconBg:   "bg-green-500/10 text-green-400",
  },
  {
    key:      "js" as const,
    icon:     Globe,
    badgeKey: "demand",
    duration: "3 months",
    students: "620+",
    rating:   4.8,
    tags:     ["Beginner", "Frontend", "Backend"],
    gradient: "from-blue-600/20 to-blue-900/10",
    border:   "border-blue-500/30 hover:border-blue-400/60",
    iconBg:   "bg-blue-500/10 text-blue-400",
  },
  {
    key:      "frontend" as const,
    icon:     Layers,
    badgeKey: "career",
    duration: "5 months",
    students: "510+",
    rating:   4.9,
    tags:     ["Intermediate", "React", "Next.js"],
    gradient: "from-green-600/20 to-emerald-900/10",
    border:   "border-green-500/30 hover:border-green-400/60",
    iconBg:   "bg-emerald-500/10 text-emerald-400",
  },
  {
    key:      "vibe" as const,
    icon:     Zap,
    badgeKey: "new",
    duration: "2 months",
    students: "380+",
    rating:   5.0,
    tags:     ["All Levels", "AI Tools", "Productivity"],
    gradient: "from-yellow-600/15 to-orange-900/10",
    border:   "border-yellow-500/30 hover:border-yellow-400/60",
    iconBg:   "bg-yellow-500/10 text-yellow-400",
  },
  {
    key:      "ai" as const,
    icon:     Brain,
    badgeKey: "advanced",
    duration: "6 months",
    students: "290+",
    rating:   4.8,
    tags:     ["Advanced", "ML", "Deep Learning"],
    gradient: "from-purple-600/20 to-purple-900/10",
    border:   "border-purple-500/30 hover:border-purple-400/60",
    iconBg:   "bg-purple-500/10 text-purple-400",
  },
  {
    key:      "data" as const,
    icon:     Database,
    badgeKey: "practical",
    duration: "4 months",
    students: "310+",
    rating:   4.7,
    tags:     ["Intermediate", "Analytics", "Python"],
    gradient: "from-cyan-600/15 to-teal-900/10",
    border:   "border-cyan-500/30 hover:border-cyan-400/60",
    iconBg:   "bg-cyan-500/10 text-cyan-400",
  },
] as const;

function CourseCard({
  meta,
  index,
}: {
  meta: (typeof COURSE_META)[number];
  index: number;
}) {
  const t    = useTranslations("courses");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: cardRef.current, start: "top 90%" },
        delay: index * 0.1,
      }
    );
  }, [index]);

  const Icon = meta.icon;

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative group rounded-3xl p-6 border transition-all duration-500 cursor-pointer overflow-hidden bg-gradient-to-br",
        meta.gradient, meta.border,
        "hover:scale-[1.02] hover:-translate-y-1 focus-within:ring-2 focus-within:ring-green-500/40"
      )}
      tabIndex={0}
      role="article"
      aria-label={t(`items.${meta.key}.title`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
        }
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(74,222,128,0.08) 0%, transparent 60%)" }}
        aria-hidden="true"
      />

      {/* Icon + badge */}
      <div className="flex items-start justify-between mb-5">
        <div className={cn("p-3 rounded-2xl", meta.iconBg)}>
          <Icon size={22} aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full glass border border-white/10 text-green-300">
          {t(meta.badgeKey)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
        {t(`items.${meta.key}.title`)}
      </h3>

      {/* Description */}
      <p className="text-sm text-green-100/60 leading-relaxed mb-5">
        {t(`items.${meta.key}.desc`)}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        {meta.tags.map((tag) => (
          <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-green-200/70 border border-white/5">
            {tag}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-green-100/50 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          <span>{meta.duration}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={12} aria-hidden="true" />
          <span>{meta.students}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
          <span className="text-yellow-400">{meta.rating}</span>
        </div>
      </div>

      {/* Hover arrow */}
      <div
        className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300"
        aria-hidden="true"
      >
        <ArrowRight size={14} className="text-green-400" />
      </div>
    </div>
  );
}

export function Courses() {
  const t          = useTranslations("courses");
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    gsap.fromTo(
      headingRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
      }
    );
  }, []);

  return (
    <section id="courses" className="relative section-padding bg-dark overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headingRef} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-300 text-sm font-medium mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            {t("badge")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t("title1")}{" "}
            <span className="gradient-text">{t("titleGreen")}</span>
            <br className="hidden sm:block" />
            {" "}{t("title2")}
          </h2>
          <p className="text-lg text-green-100/50 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSE_META.map((meta, i) => (
            <CourseCard key={meta.key} meta={meta} index={i} />
          ))}
        </div>

        <div className="flex justify-center mt-14">
          <SparkleButton
            onClick={() =>
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 text-base"
          >
            {t("apply")}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </SparkleButton>
        </div>
      </div>
    </section>
  );
}
