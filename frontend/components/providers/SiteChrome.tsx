"use client";

import { usePathname } from "next/navigation";
import { SmoothScrollProvider } from "./SmoothScrollProvider";

/**
 * Marketing-site chrome: Lenis smooth scrolling.
 *
 * Deliberately skipped on /admin — Lenis intercepts wheel events, which makes
 * long tables and the course dialog feel like they are fighting the mouse.
 *
 * usePathname comes from next/navigation rather than the locale-aware helper
 * because this needs the real URL, locale prefix included, to match /admin
 * under every locale.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = /^\/[^/]+\/admin(\/|$)/.test(pathname) || pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
