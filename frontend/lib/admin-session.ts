import type { AdminUser } from "./types/admin";

/**
 * The admin session, modelled as an external store.
 *
 * localStorage genuinely is external state: it is written by this tab, by
 * other tabs, and by the user clearing site data. Reading it in an effect and
 * copying it into useState meant every mount rendered once as "logged out"
 * before correcting itself, which is what made the panel redirect an
 * authenticated operator to the login screen on a hard refresh.
 *
 * useSyncExternalStore reads the value during render instead, so the first
 * client render already knows the truth.
 */

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

export interface SessionSnapshot {
  token: string | null;
  user: AdminUser | null;
  /** False only while rendering on the server, where storage does not exist. */
  hydrated: boolean;
}

/** Stable identity: useSyncExternalStore compares snapshots by reference and
 *  will loop forever if a fresh object is returned every call. */
const SERVER_SNAPSHOT: SessionSnapshot = {
  token: null,
  user: null,
  hydrated: false,
};

let cachedToken: string | null = null;
let cachedUserRaw: string | null = null;
let cachedSnapshot: SessionSnapshot = SERVER_SNAPSHOT;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function readSnapshot(): SessionSnapshot {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);

  // Only build a new object when the underlying strings actually changed.
  if (token === cachedToken && userRaw === cachedUserRaw && cachedSnapshot.hydrated) {
    return cachedSnapshot;
  }

  cachedToken = token;
  cachedUserRaw = userRaw;

  let user: AdminUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as AdminUser;
    } catch {
      // A corrupted entry would otherwise throw on every render.
      localStorage.removeItem(USER_KEY);
      cachedUserRaw = null;
    }
  }

  cachedSnapshot = { token, user, hydrated: true };
  return cachedSnapshot;
}

export const adminSession = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);

    // Signing out in one tab must not leave another tab holding a session
    // against a token that no longer exists.
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null) {
        emit();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },

  getSnapshot(): SessionSnapshot {
    if (typeof window === "undefined") return SERVER_SNAPSHOT;
    return readSnapshot();
  },

  getServerSnapshot(): SessionSnapshot {
    return SERVER_SNAPSHOT;
  },

  /** Current token, for attaching to requests outside of React. */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string, user: AdminUser): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    emit();
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    emit();
  },
};
