import type { Metadata } from "next";
import { AdminProvider } from "@/components/admin/AdminProvider";

export const metadata: Metadata = {
  title: "IT ADIS — Administration",
  // The admin panel must never appear in search results.
  robots: { index: false, follow: false },
};

/**
 * The admin panel shares the site's dark surface, so this wrapper only has to
 * pin the background and text colour explicitly rather than inherit whatever
 * the marketing body happens to set.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <div className="admin-scope min-h-screen bg-dark text-slate-900">
        {children}
      </div>
    </AdminProvider>
  );
}
