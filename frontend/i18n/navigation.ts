import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware navigation primitives. Using these instead of next/link and
 * next/navigation keeps the active locale on every internal href, so a visitor
 * reading the site in Russian stays in Russian when they open a technology page.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
