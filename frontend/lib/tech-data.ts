import { TECH_ICON_PATHS, type TechIconKey } from "./tech-icons";

/**
 * The five technologies that orbit the Earth in the hero and each get a page
 * at /[locale]/tech/[slug].
 *
 * This is presentation data only — colours, orbital mechanics, icon and the
 * i18n key. All human-readable copy lives in messages/{en,ru,kg}.json under
 * `tech.items.<key>`, so nothing here needs translating and no English can
 * leak into the RU or KG builds.
 */

export interface TechOrbit {
  /** Distance from the Earth's centre, in scene units (Earth radius = 1). */
  radius: number;
  /** Tilt of the orbital plane in radians. Three distinct planes keep the
   *  composition reading as a system rather than a flat diagram. */
  inclination: number;
  /** Starting angle on that plane, in radians. */
  phase: number;
  /** Angular velocity multiplier. */
  speed: number;
}

export interface TechDef {
  /** URL segment: /en/tech/python */
  slug: string;
  /** Key into `tech.items` in the message files. */
  key: string;
  icon: TechIconKey;
  /** Brand colour, chosen to stay legible against the dark theme. */
  color: string;
  /** Slug of the course this technology sells, on the backend API. */
  courseSlug: string;
  orbit: TechOrbit;
}

export const TECHNOLOGIES: readonly TechDef[] = [
  {
    slug: "python",
    key: "python",
    icon: "python",
    color: "#4B8BBE",
    courseSlug: "python-development",
    orbit: { radius: 1.95, inclination: 0.14, phase: 0, speed: 0.30 },
  },
  {
    slug: "javascript",
    key: "javascript",
    icon: "javascript",
    color: "#F7DF1E",
    courseSlug: "javascript-typescript",
    orbit: { radius: 1.95, inclination: 0.14, phase: (2 * Math.PI) / 3, speed: 0.30 },
  },
  {
    slug: "flutter",
    key: "flutter",
    icon: "flutter",
    color: "#54C5F8",
    courseSlug: "flutter-development",
    orbit: { radius: 1.95, inclination: 0.14, phase: (4 * Math.PI) / 3, speed: 0.30 },
  },
  {
    slug: "frontend",
    key: "frontend",
    icon: "react",
    color: "#61DAFB",
    courseSlug: "frontend-development",
    orbit: { radius: 2.45, inclination: 0.58, phase: 1.1, speed: 0.22 },
  },
  {
    slug: "vibe-coding",
    key: "vibe",
    icon: "githubcopilot",
    color: "#A78BFA",
    courseSlug: "vibe-coding",
    orbit: { radius: 2.92, inclination: -0.46, phase: 2.3 + Math.PI, speed: 0.17 },
  },
] as const;

export const TECH_SLUGS = TECHNOLOGIES.map((t) => t.slug);

export function getTech(slug: string): TechDef | undefined {
  return TECHNOLOGIES.find((t) => t.slug === slug);
}

export function techIconPath(tech: TechDef): string {
  return TECH_ICON_PATHS[tech.icon];
}
