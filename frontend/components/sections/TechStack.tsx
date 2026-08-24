"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TECHNOLOGIES, type TechDef } from "@/lib/tech-data";
import { TechIcon } from "@/components/ui/TechLinks";
import { api, type Course } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The technologies, as a grid of marks.
 *
 * Each tile carries only a vendor logo and a name. The course behind it —
 * description, duration, level, what it covers — is revealed on click, in a
 * panel below the grid, so the section can be scanned in a second but still
 * answers the question a visitor actually has.
 *
 * This replaces the six-card course grid, which put every course's full
 * description, tag list, rating and student count on screen at once and asked
 * the visitor to read all of it before choosing.
 */

/** How a technology tile pairs with its course record from the API. */
interface TechEntry {
  tech: TechDef;
  course?: Course;
}

function TechTile({
  entry,
  isOpen,
  onToggle,
  panelId,
}: {
  entry: TechEntry;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
}) {
  const t = useTranslations("tech");
  const { tech } = entry;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={panelId}
      className={cn(
        "group relative flex h-full w-full flex-col items-center justify-center gap-3",
        "rounded-2xl border px-3 py-6 sm:py-7",
        "transition-all duration-300 outline-none",
        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark",
        isOpen
          ? "bg-white/[0.07] border-white/25 -translate-y-0.5"
          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-0.5"
      )}
      style={
        {
          // The brand colour drives the focus ring and the active glow, so each
          // tile reads as its own technology rather than as a generic card.
          "--tech": tech.color,
          borderColor: isOpen ? `${tech.color}66` : undefined,
          boxShadow: isOpen ? `0 0 30px -12px ${tech.color}` : undefined,
        } as React.CSSProperties
      }
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
          isOpen && "opacity-100"
        )}
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${tech.color}1f 0%, transparent 70%)`,
        }}
      />

      <span
        className="relative grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-transform duration-300 group-hover:scale-110"
        style={{ color: tech.color, backgroundColor: `${tech.color}14` }}
      >
        <TechIcon tech={tech} size={28} />
      </span>

      <span className="relative text-[13px] sm:text-sm font-semibold text-green-50/90 text-center leading-tight">
        {t(`items.${tech.key}.name`)}
      </span>
    </button>
  );
}

function DetailPanel({
  entry,
  panelId,
  onClose,
}: {
  entry: TechEntry;
  panelId: string;
  onClose: () => void;
}) {
  const t = useTranslations("tech");
  const { tech, course } = entry;

  // All four CourseLevel values are translated in every message file, but the
  // API could still hand back something new, so the raw value is the fallback
  // rather than letting next-intl throw and blank the whole panel.
  const KNOWN_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];
  const levelLabel = course
    ? KNOWN_LEVELS.includes(course.level)
      ? t(`stack.levels.${course.level}`)
      : course.level
    : null;

  return (
    <div
      id={panelId}
      className="relative overflow-hidden rounded-3xl border bg-white/[0.03] p-6 sm:p-8"
      style={{ borderColor: `${tech.color}40` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${tech.color}, transparent)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] h-[240px] blur-3xl opacity-20"
        style={{ background: `radial-gradient(ellipse, ${tech.color}, transparent 70%)` }}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={t("stack.close")}
        className="absolute top-4 right-4 grid place-items-center w-8 h-8 rounded-lg text-green-100/50 hover:text-green-100 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
      >
        <X size={16} aria-hidden="true" />
      </button>

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        <span
          className="grid place-items-center w-14 h-14 rounded-2xl shrink-0"
          style={{ color: tech.color, backgroundColor: `${tech.color}1a` }}
          aria-hidden="true"
        >
          <TechIcon tech={tech} size={30} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {course?.title ?? t(`items.${tech.key}.name`)}
          </h3>
          <p className="text-sm text-green-100/60 mt-1">
            {t(`items.${tech.key}.tagline`)}
          </p>

          <p className="text-[15px] leading-relaxed text-green-100/85 mt-4">
            {course?.longDesc || course?.description}
          </p>

          {/* Facts, not decoration: the two things someone weighing a course
              asks before anything else. */}
          {course && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[13px]">
              <span className="inline-flex items-center gap-1.5 text-green-100/70">
                <Clock size={14} style={{ color: tech.color }} aria-hidden="true" />
                <span className="text-green-100/50">{t("stack.duration")}:</span>
                <span className="font-semibold text-green-50">{course.duration}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-green-100/70">
                <BookOpen size={14} style={{ color: tech.color }} aria-hidden="true" />
                <span className="text-green-100/50">{t("stack.level")}:</span>
                <span className="font-semibold text-green-50">{levelLabel}</span>
              </span>
            </div>
          )}

          {course && course.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-5">
              {course.tags.map((tag) => (
                <li
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-lg border"
                  style={{
                    color: tech.color,
                    borderColor: `${tech.color}33`,
                    backgroundColor: `${tech.color}0f`,
                  }}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-dark transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark"
              style={{ backgroundColor: tech.color }}
            >
              {t("stack.apply")}
              <ArrowRight size={16} aria-hidden="true" />
            </a>

            <Link
              href={`/tech/${tech.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-green-100/80 hover:text-white hover:border-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              {t("stack.fullGuide")}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TechStack() {
  const t = useTranslations("tech");
  const prefersReducedMotion = useReducedMotion();

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  /** Bumped by the retry link to re-run the fetch. */
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Plain fetch-in-effect with a cancellation flag, so a response that arrives
  // after the section unmounts cannot set state on a dead component.
  useEffect(() => {
    let cancelled = false;

    api
      .getCourses()
      .then((result) => {
        if (cancelled) return;
        setCourses(result);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /**
   * Technologies are the source of truth for what is shown, not the API: the
   * grid must render its six marks immediately, with or without a backend.
   * Each one then picks up its course by slug when the data arrives.
   */
  const entries = useMemo<TechEntry[]>(
    () =>
      TECHNOLOGIES.map((tech) => ({
        tech,
        course: courses?.find((candidate) => candidate.slug === tech.courseSlug),
      })),
    [courses]
  );

  const openEntry = entries.find((entry) => entry.tech.slug === openSlug) ?? null;

  const handleToggle = (slug: string) => {
    setOpenSlug((current) => (current === slug ? null : slug));
  };

  useEffect(() => {
    // Bring the panel into view when it opens below the fold, but never yank
    // the page for someone who has asked for reduced motion.
    if (!openSlug || !panelRef.current) return;
    panelRef.current.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [openSlug, prefersReducedMotion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section id="courses" className="relative section-padding bg-dark overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-green-500/30 text-green-300 text-sm font-medium mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            {t("stack.badge")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            {t("stack.title1")}{" "}
            <span className="gradient-text">{t("stack.titleAccent")}</span>
          </h2>
          <p className="text-lg text-green-100/70 max-w-2xl mx-auto">
            {t("stack.subtitle")}
          </p>
        </div>

        {/* Flex rather than a fixed grid: the count is not a multiple of any
            column count, and a grid leaves the last technology stranded alone
            on its own row. Wrapping and centring keeps a short final row
            looking deliberate, whatever the count grows to. */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {entries.map((entry) => (
            <div
              key={entry.tech.slug}
              className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
            >
              <TechTile
                entry={entry}
                isOpen={openSlug === entry.tech.slug}
                onToggle={() => handleToggle(entry.tech.slug)}
                panelId={`tech-panel-${entry.tech.slug}`}
              />
            </div>
          ))}
        </div>

        <div ref={panelRef} className="mt-5 sm:mt-6 scroll-mt-24">
          <AnimatePresence mode="wait" initial={false}>
            {openEntry ? (
              <motion.div
                key={openEntry.tech.slug}
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <DetailPanel
                  entry={openEntry}
                  panelId={`tech-panel-${openEntry.tech.slug}`}
                  onClose={() => setOpenSlug(null)}
                />
              </motion.div>
            ) : (
              <motion.p
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-green-100/40 py-6"
              >
                {failed ? (
                  <>
                    {t("stack.error")}{" "}
                    <button
                      type="button"
                      onClick={() => setAttempt((value) => value + 1)}
                      className="underline underline-offset-4 hover:text-green-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded"
                    >
                      {t("stack.retry")}
                    </button>
                  </>
                ) : (
                  t("stack.prompt")
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
