import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_FALLBACK_LOCALE, isAdminLocale } from "./i18n/admin-locales";

const intlMiddleware = createMiddleware(routing);

/** `/kg/admin/courses` → `/ru/admin/courses`: locale swapped, page kept. */
const ADMIN_PATH = /^\/([^/]+)(\/admin(?:\/.*)?)$/;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = ADMIN_PATH.exec(pathname);

  // The admin panel is translated into fewer languages than the public site.
  // Redirecting here rather than in the admin layout keeps the rest of the
  // path: a layout has no access to the pathname, so the same check there can
  // only ever land the operator back on the dashboard.
  if (
    match &&
    (routing.locales as readonly string[]).includes(match[1]) &&
    !isAdminLocale(match[1])
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${ADMIN_FALLBACK_LOCALE}${match[2]}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - metadata routes: these are generated at the app root and have no locale
  //   segment, so redirecting them to /en/... produces a 404 and silently
  //   breaks link previews and the favicon
  // - /favicon.ico, images, textures — anything with a file extension
  matcher: [
    "/((?!api|_next|_vercel|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest|.*\\..*).*)",
  ],
};
