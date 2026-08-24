"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  BookOpen,
  Menu,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAdmin } from "./AdminProvider";
import { Button } from "./ui/primitives";

/**
 * The frame every admin page renders inside: a fixed sidebar, a top bar, and
 * the authentication gate.
 *
 * Navigation is by route rather than by local tab state. The previous version
 * kept the active view in a useState inside the dashboard component, so all
 * three views shared one URL — the back button left the panel entirely, and a
 * view could not be linked to or bookmarked.
 */

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, exact: false },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList, exact: false },
] as const;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin sections">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400",
              isActive
                ? "bg-green-500/10 text-green-300 shadow-[inset_2px_0_0_0_var(--color-green-400)]"
                : "text-green-100/60 hover:bg-white/5 hover:text-green-50"
            )}
          >
            <Icon
              size={18}
              className={isActive ? "text-green-400" : "text-green-100/40"}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 h-16 px-5 border-b border-dark-border">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-green-500 text-dark font-bold text-sm shrink-0">
        IA
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-green-50 leading-tight truncate">
          IT ADIS
        </span>
        <span className="block text-[11px] text-green-100/45 leading-tight">
          Administration
        </span>
      </span>
    </div>
  );
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAdmin();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Wait for the provider to finish reading storage. Redirecting before that
    // bounced an authenticated operator back to the login screen on every
    // full page load.
    if (!isLoading && !isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-dark">
        <div className="text-center">
          <div
            className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-white/10 border-t-green-400 animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm text-green-100/50">
            {isLoading ? "Checking your session…" : "Redirecting to sign in…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-dark-card border-r border-dark-border">
        <Brand />
        <SidebarNav />
        <div className="p-3 border-t border-dark-border">
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex w-64 flex-col bg-dark-card border-r border-dark-border">
            <Brand />
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            <div className="p-3 border-t border-dark-border">
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-3 h-16 px-4 sm:px-6 bg-dark/85 backdrop-blur-xl border-b border-dark-border">
          <button
            type="button"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="lg:hidden grid place-items-center w-9 h-9 -ml-1 rounded-lg text-green-100/60 hover:bg-white/5 hover:text-green-50"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
          >
            <Menu size={18} aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold text-green-50 truncate">{title}</h1>
            {description && (
              <p className="text-xs text-green-100/45 truncate">{description}</p>
            )}
          </div>

          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}

          <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-dark-border">
            <span
              className="grid place-items-center w-8 h-8 rounded-full bg-green-500/15 text-green-300 text-xs font-semibold ring-1 ring-green-500/25"
              aria-hidden="true"
            >
              {initialsOf(user.name)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-green-50 leading-tight truncate max-w-[10rem]">
                {user.name}
              </span>
              <span className="block text-[11px] text-green-100/45 leading-tight truncate max-w-[10rem]">
                {user.email}
              </span>
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
