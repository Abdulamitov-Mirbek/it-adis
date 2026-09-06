import { routing } from "./routing";

/**
 * The locales the admin panel is translated into.
 *
 * The public site ships three (en, ru, kg) but the panel's strings exist only
 * in English and Russian, so this is deliberately narrower than
 * `routing.locales`. Two places depend on it: the header switcher, which must
 * not offer a language the panel cannot render, and the admin layout, which
 * redirects anything else here.
 */
export const ADMIN_LOCALES = ["en", "ru"] as const;

export type AdminLocale = (typeof ADMIN_LOCALES)[number];

/** Where an operator lands if they reach the panel on an untranslated locale. */
export const ADMIN_FALLBACK_LOCALE: AdminLocale = "ru";

export function isAdminLocale(locale: string): locale is AdminLocale {
  return (ADMIN_LOCALES as readonly string[]).includes(locale);
}

// A locale dropped from routing would leave this pointing at a language the
// router cannot resolve, which fails as a redirect loop at runtime rather than
// at build time. Cheap to assert here instead.
if (process.env.NODE_ENV !== "production") {
  for (const locale of ADMIN_LOCALES) {
    if (!(routing.locales as readonly string[]).includes(locale)) {
      throw new Error(
        `ADMIN_LOCALES contains "${locale}", which is not in routing.locales.`
      );
    }
  }
}
