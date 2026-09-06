import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { ADMIN_FALLBACK_LOCALE, isAdminLocale } from "@/i18n/admin-locales";

export const metadata: Metadata = {
  title: "IT ADIS — Administration",
  // The admin panel must never appear in search results.
  robots: { index: false, follow: false },
};

/**
 * The admin panel shares the site's dark surface, so this wrapper only has to
 * pin the background and text colour explicitly rather than inherit whatever
 * the marketing body happens to set.
 *
 * The locale guard below is a backstop, not the main path. proxy.ts already
 * redirects untranslated locales and does it better, because it can keep the
 * rest of the URL. This catches the case where a request reaches a page without
 * passing through that matcher, where the alternative is rendering a screen of
 * missing-key placeholders instead of an interface.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isAdminLocale(locale)) {
    redirect(`/${ADMIN_FALLBACK_LOCALE}/admin`);
  }

  return (
    <AdminProvider>
      <div className="admin-scope min-h-screen bg-dark text-slate-900">
        {children}
      </div>
    </AdminProvider>
  );
}
