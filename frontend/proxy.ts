import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

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
