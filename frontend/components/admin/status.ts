"use client";

import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Application } from "@/lib/types/admin";
import type { BadgeTone } from "./ui/primitives";

export type ApplicationStatus = Application["status"];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
];

/**
 * One mapping used by every view, so a status never reads amber in the table
 * and grey in the activity feed.
 *
 * Only the tone lives here now. The label is looked up per locale by
 * useStatusMeta below — the codes themselves are the API contract and are
 * never translated, sent, or compared as display text.
 */
export const STATUS_TONES: Record<ApplicationStatus, BadgeTone> = {
  PENDING: "amber",
  REVIEWING: "blue",
  ACCEPTED: "green",
  REJECTED: "red",
};

/**
 * Resolves a status code to a translated label and its tone.
 *
 * An unrecognised code — a status added to the backend before the frontend
 * knows about it — falls back to showing the raw code rather than an error
 * placeholder, which is the same behaviour the previous STATUS_META lookup had.
 */
export function useStatusMeta() {
  const t = useTranslations("admin.status");

  return useCallback(
    (status: string) => ({
      label: t.has(status) ? t(status) : status,
      tone: STATUS_TONES[status as ApplicationStatus] ?? ("neutral" as BadgeTone),
    }),
    [t]
  );
}

export const COURSE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
] as const;

export const LEVEL_TONES: Record<string, BadgeTone> = {
  BEGINNER: "green",
  INTERMEDIATE: "blue",
  ADVANCED: "red",
  ALL_LEVELS: "neutral",
};

export function useLevelMeta() {
  const t = useTranslations("admin.level");

  return useCallback(
    (level: string) => ({
      label: t.has(level) ? t(level) : level,
      tone: LEVEL_TONES[level] ?? ("neutral" as BadgeTone),
    }),
    [t]
  );
}

/**
 * The admin locales mapped to the regional tags Intl actually formats with.
 *
 * Plain "en" would render US order (Sep 5, 2026); the panel has always shown
 * day-first, so English is pinned to en-GB rather than silently changing what
 * operators are used to reading.
 */
const DATE_LOCALES: Record<string, string> = {
  en: "en-GB",
  ru: "ru-RU",
  kg: "ky-KG",
};

/**
 * Absolute dates, formatted the same way everywhere, in the reader's locale.
 *
 * Deliberately not "3 days ago": someone reconciling applications needs a date
 * they can match against an email or a spreadsheet, and a relative label goes
 * stale the moment the page sits open.
 */
export function useDateFormat() {
  const locale = useLocale();
  const tag = DATE_LOCALES[locale] ?? DATE_LOCALES.en;

  const formatDate = useCallback(
    (iso: string): string => {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString(tag, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [tag]
  );

  const formatDateTime = useCallback(
    (iso: string): string => {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString(tag, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [tag]
  );

  return { formatDate, formatDateTime };
}
