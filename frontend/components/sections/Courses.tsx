"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight, Clock, Users, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SparkleButton } from "@/components/ui/SparkleButton";
import { api } from "@/lib/api";
import { mapCoursesToMeta, type CourseMeta } from "@/lib/course-meta";

gsap.registerPlugin(ScrollTrigger);

function CourseCard({
  meta,
  index,
}: {
  meta: CourseMeta;
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
      aria-label={meta.course.title}
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
        {meta.course.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-green-100/75 leading-relaxed mb-5">
        {meta.course.description}
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
      <div className="flex items-center justify-between text-xs text-green-100/70 pt-4 border-t border-white/5">
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
  const [courseMeta, setCourseMeta] = useState<CourseMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchCourses = async () => {
      try {
        const courses = await api.getCourses();
        if (!cancelled) {
          setCourseMeta(mapCoursesToMeta(courses));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch courses:', err);
          setError(err instanceof Error ? err.message : 'Failed to load courses');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCourses();
    return () => { cancelled = true; controller.abort(); };
  }, []);

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
          <p className="text-lg text-green-100/70 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-3xl p-6 border border-green-500/30 bg-gradient-to-br from-green-600/20 to-green-900/10 animate-pulse">
                <div className="h-32 bg-green-500/10 rounded mb-4"></div>
                <div className="h-6 bg-green-500/10 rounded mb-2"></div>
                <div className="h-4 bg-green-500/10 rounded mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-16 bg-green-500/10 rounded"></div>
                  <div className="h-6 w-20 bg-green-500/10 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error loading courses: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && courseMeta.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courseMeta.map((meta, i) => (
              <CourseCard key={meta.course.id} meta={meta} index={i} />
            ))}
          </div>
        )}

        {!isLoading && !error && courseMeta.length === 0 && (
          <div className="text-center py-12">
            <p className="text-green-100/70">No courses available at the moment.</p>
          </div>
        )}

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
