import {
  LoginResponse,
  DashboardStats,
  CoursesResponse,
  ApplicationsResponse,
  RecentActivity,
  AdminUser,
  Application,
  Course,
} from "./types/admin";
import { adminSession } from "./admin-session";

const API_BASE_URL = "/api";

/**
 * An error carrying the machine-readable code from the API's error envelope,
 * so the UI can distinguish "your session expired" from "the server is down"
 * instead of showing one generic message for both.
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type Listener = () => void;

class AdminAPI {
  /** Notified when the token is cleared by a 401, so the provider can react to
   *  a session expiring mid-session rather than only at page load. */
  private unauthorizedListeners = new Set<Listener>();

  onUnauthorized(listener: Listener): () => void {
    this.unauthorizedListeners.add(listener);
    return () => this.unauthorizedListeners.delete(listener);
  }

  /**
   * Read from the session store on every request rather than caching in a
   * field. The cached version went stale whenever the token changed in another
   * tab, or when this module was evaluated before login completed.
   */
  private get token(): string | null {
    return adminSession.getToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.token;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    } catch {
      // fetch only rejects on a network-level failure; treat it the same as an
      // unreachable backend so the UI has one story to tell.
      throw new ApiRequestError(
        "Network error. Check your connection and try again.",
        "NETWORK_ERROR",
        0
      );
    }

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const envelope = (data as { error?: { code?: string; message?: string } } | null)?.error;
      // Nest's own errors use { message } rather than our envelope.
      const nestMessage = (data as { message?: string | string[] } | null)?.message;

      const message =
        envelope?.message ??
        (Array.isArray(nestMessage) ? nestMessage.join(", ") : nestMessage) ??
        `Request failed (HTTP ${response.status})`;

      const code = envelope?.code ?? (response.status === 401 ? "UNAUTHORIZED" : "REQUEST_FAILED");

      if (code === "UNAUTHORIZED" || response.status === 401) {
        this.clearSession();
        this.unauthorizedListeners.forEach((listener) => listener());
      }

      throw new ApiRequestError(message, code, response.status);
    }

    return data as T;
  }

  // ── Session ───────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    adminSession.set(response.access_token, response.admin);
    return response;
  }

  private clearSession(): void {
    adminSession.clear();
  }

  async logout(): Promise<void> {
    this.clearSession();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getStoredUser(): AdminUser | null {
    return adminSession.getSnapshot().user;
  }

  getProfile(): Promise<AdminUser> {
    return this.request<AdminUser>("/auth/profile");
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/admin/dashboard");
  }

  getCourses(page = 1, limit = 10): Promise<CoursesResponse> {
    return this.request<CoursesResponse>(`/admin/courses?page=${page}&limit=${limit}`);
  }

  getApplications(page = 1, limit = 10, status?: string): Promise<ApplicationsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    return this.request<ApplicationsResponse>(`/admin/applications?${params}`);
  }

  getRecentActivity(): Promise<RecentActivity> {
    return this.request<RecentActivity>("/admin/recent-activity");
  }

  // ── Writes ────────────────────────────────────────────────────────────────

  updateApplicationStatus(
    id: string,
    status: Application["status"]
  ): Promise<Application> {
    return this.request<Application>(`/admin/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  createCourse(course: Partial<Course>): Promise<Course> {
    return this.request<Course>("/admin/courses", {
      method: "POST",
      body: JSON.stringify(course),
    });
  }

  updateCourse(slug: string, course: Partial<Course>): Promise<Course> {
    return this.request<Course>(`/admin/courses/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(course),
    });
  }

  deleteCourse(slug: string): Promise<Course> {
    return this.request<Course>(`/admin/courses/${slug}`, { method: "DELETE" });
  }
}

export const adminAPI = new AdminAPI();
