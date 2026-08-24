"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "@/i18n/navigation";
import { AdminUser } from "@/lib/types/admin";
import { adminAPI } from "@/lib/admin-api";
import { adminSession } from "@/lib/admin-session";

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  // Subscribing to the session store rather than copying it into state means
  // the first client render already knows whether someone is signed in, and a
  // sign-out in another tab propagates here without a poll.
  const session = useSyncExternalStore(
    adminSession.subscribe,
    adminSession.getSnapshot,
    adminSession.getServerSnapshot
  );

  // Locale-aware: the previous version pushed the literal "/en/admin", which
  // dropped a Russian or Kyrgyz operator into the English site on every login,
  // logout and redirect.
  const router = useRouter();

  const isAuthenticated = Boolean(session.token && session.user);

  useEffect(() => {
    // The token is a JWT with a fixed lifetime, so a session can expire while
    // the panel is open. Without this the next request 401s and the view just
    // shows an error, leaving the operator stuck on a page they cannot use.
    return adminAPI.onUnauthorized(() => {
      router.replace("/admin/login");
    });
  }, [router]);

  const login = useCallback(
    async (email: string, password: string) => {
      await adminAPI.login(email, password);
      router.replace("/admin");
    },
    [router]
  );

  const logout = useCallback(() => {
    adminAPI.logout();
    router.replace("/admin/login");
  }, [router]);

  return (
    <AdminContext.Provider
      value={{
        user: session.user,
        // Before hydration there is no way to know, and treating "unknown" as
        // "signed out" is what bounced authenticated operators to the login
        // page on every refresh.
        isLoading: !session.hydrated,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
