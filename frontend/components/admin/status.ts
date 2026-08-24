import type { Application } from "@/lib/types/admin";
import type { BadgeTone } from "./ui/primitives";

export type ApplicationStatus = Application["status"];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "PENDING",
  "REVIEWING",
  "ACCEPTED",
  "REJECTED",
];

/** One mapping used by every view, so a status never reads amber in the table
 *  and grey in the activity feed. */
export const STATUS_META: Record<ApplicationStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: "Pending", tone: "amber" },
  REVIEWING: { label: "Reviewing", tone: "blue" },
  ACCEPTED: { label: "Accepted", tone: "green" },
  REJECTED: { label: "Rejected", tone: "red" },
};

export function statusMeta(status: string) {
  return (
    STATUS_META[status as ApplicationStatus] ?? {
      label: status,
      tone: "neutral" as BadgeTone,
    }
  );
}

export const COURSE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "ALL_LEVELS",
] as const;

export const LEVEL_META: Record<string, { label: string; tone: BadgeTone }> = {
  BEGINNER: { label: "Beginner", tone: "green" },
  INTERMEDIATE: { label: "Intermediate", tone: "blue" },
  ADVANCED: { label: "Advanced", tone: "red" },
  ALL_LEVELS: { label: "All levels", tone: "neutral" },
};

export function levelMeta(level: string) {
  return LEVEL_META[level] ?? { label: level, tone: "neutral" as BadgeTone };
}

/**
 * Absolute date, formatted the same way everywhere.
 *
 * Deliberately not "3 days ago": someone reconciling applications needs a date
 * they can match against an email or a spreadsheet, and a relative label goes
 * stale the moment the page sits open.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
