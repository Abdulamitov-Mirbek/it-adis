"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TECHNOLOGIES, techIconPath, type TechDef } from "@/lib/tech-data";
import { ICON_VIEWBOX } from "@/lib/tech-icons";

export function TechIcon({
  tech,
  size = 20,
  className = "",
}: {
  tech: TechDef;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={techIconPath(tech)} />
    </svg>
  );
}

/**
 * The technologies, as real links.
 *
 * `overlay` sits on top of the 3D canvas. Its links are visually hidden until
 * focused, at which point each appears as a chip with a focus ring. A WebGL
 * canvas cannot be tabbed to or announced, so without this layer the orbiting
 * technologies would be reachable by mouse only — which is how the previous
 * hero behaved.
 *
 * `grid` is the visible list rendered under the headline on small screens.
 */
export function TechLinks({
  variant = "grid",
}: {
  variant?: "overlay" | "grid";
}) {
  const t = useTranslations("tech");

  if (variant === "overlay") {
    return (
      <nav
        aria-label={t("navLabel")}
        className="absolute inset-0 pointer-events-none"
      >
        <ul className="absolute top-3 left-3 flex flex-col gap-2">
          {TECHNOLOGIES.map((tech) => (
            <li key={tech.slug}>
              <Link
                href={`/tech/${tech.slug}`}
                className="sr-only focus:not-sr-only focus:relative focus:pointer-events-auto focus:inline-flex focus:items-center focus:gap-2 focus:rounded-full focus:border focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark"
                style={{
                  borderColor: `${tech.color}66`,
                  color: tech.color,
                  backgroundColor: "rgba(4,13,7,0.92)",
                }}
              >
                <TechIcon tech={tech} size={16} />
                {t(`items.${tech.key}.name`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  // Two columns rather than three: three columns forced the longer names
  // ("JavaScript", "Vibe Coding") down to an unreadable size on a phone.
  // Each row is a full-width horizontal card, comfortably over the 44 px
  // minimum tap target.
  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {TECHNOLOGIES.map((tech) => (
        <li key={tech.slug}>
          <Link
            href={`/tech/${tech.slug}`}
            className="flex h-full min-h-[56px] items-center gap-3 rounded-2xl glass border border-white/10 px-3.5 py-3 transition-all duration-200 hover:border-green-500/40 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          >
            <span
              style={{ color: tech.color }}
              className="shrink-0 grid place-items-center w-9 h-9 rounded-xl bg-white/5"
            >
              <TechIcon tech={tech} size={20} />
            </span>
            <span className="text-[13px] font-semibold leading-tight text-green-50/90">
              {t(`items.${tech.key}.name`)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
