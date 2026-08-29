"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Clock, GraduationCap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TECHNOLOGIES, type TechDef } from "@/lib/tech-data";
import { TechIcon } from "@/components/ui/TechLinks";
import { api, type Course } from "@/lib/api";

/**
 * The technologies, as cards that link to their own page.
 *
 * This previously expanded an accordion panel underneath the grid: clicking
 * Python revealed a summary in place, with a Close button, and only a small
 * "read the full guide" link inside that panel led to /tech/python — the page
 * that actually answers the visitor's question. Two clicks and a dead end for
 * anyone who wanted the detail, and nothing shareable or indexable at the end
 * of it.
 *
 * Now the card IS the link. One click goes straight to the full page, which
 * already exists, is statically generated, and carries its own metadata. The
 * card shows just enough to choose between technologies: mark, name, one line,
 * and the course's duration and level once the API answers.
 */

interface TechEntry {
  tech: TechDef;
  course?: Course;
}

function TechCard({ entry }: { entry: TechEntry }) {
  const t = useTranslations("tech");
  const { tech, course } = entry;

  const KNOWN_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];
  const levelLabel = course
    ? KNOWN_LEVELS.includes(course.level)
      ? t(`stack.levels.${course.level}`)
      : course.level
    : null;

  return (
    <Link
      href={`/tech/${tech.slug}`}
      className="group glass card-hover flex h-full flex-col gap-4 rounded-2xl p-6 outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        {/* The mark sits on a tint of its own brand colour, which is what makes
            a row of otherwise identical white cards scannable. */}
        <span
          className="grid place-items-center w-12 h-12 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ color: tech.color, backgroundColor: `${tech.color}14` }}
          aria-hidden="true"
        >
          <TechIcon tech={tech} size={24} />
        </span>
        <ArrowRight
          size={18}
          className="mt-1 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-green-700"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-bold text-slate-900">
          {t(`items.${tech.key}.name`)}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">
          {t(`items.${tech.key}.tagline`)}
        </p>
      </div>

      {/* Pushed to the bottom so cards of differing text length still line up
          their metadata row. */}
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-500">
        {course ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} aria-hidden="true" />
              {course.duration}
            </span>
            {levelLabel && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap size={13} aria-hidden="true" />
                {levelLabel}
              </span>
            )}
          </>
        ) : (
          // Reserve the row's height while the API is in flight so the grid
          // does not jolt when the course data lands.
          <span className="h-4" aria-hidden="true" />
        )}
      </div>
    </Link>
  );
}

export function TechStack() {
  const t = useTranslations("tech");

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Bumped by the retry link to re-run the fetch. */
  const [attempt, setAttempt] = useState(0);

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
   * grid renders its cards immediately, with or without a backend. Each one
   * then picks up its course by slug when the data arrives, so a backend
   * outage costs the duration and level line, not the section.
   */
  const entries = useMemo<TechEntry[]>(
    () =>
      TECHNOLOGIES.map((tech) => ({
        tech,
        course: courses?.find((candidate) => candidate.slug === tech.courseSlug),
      })),
    [courses]
  );

  return (
    <section id="courses" className="relative section-padding bg-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-green-200 text-green-700 text-sm font-medium mb-5 shadow-soft">
            <span className="w-2 h-2 rounded-full bg-green-600" aria-hidden="true" />
            {t("stack.badge")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-slate-900">
            {t("stack.title1")}{" "}
            <span className="gradient-text">{t("stack.titleAccent")}</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t("stack.subtitle")}
          </p>
        </div>

        {/* Flex rather than a fixed grid: the count is not a multiple of any
            column count, and a grid leaves the last technology stranded alone
            on its own row. Wrapping and centring keeps a short final row
            looking deliberate, whatever the count grows to. */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {entries.map((entry) => (
            <div
              key={entry.tech.slug}
              className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)]"
            >
              <TechCard entry={entry} />
            </div>
          ))}
        </div>

        {failed && (
          <p className="text-center text-sm text-slate-500 pt-8">
            {t("stack.error")}{" "}
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="underline underline-offset-4 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 rounded"
            >
              {t("stack.retry")}
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
