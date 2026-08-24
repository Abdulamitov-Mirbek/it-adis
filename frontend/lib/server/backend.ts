import { NextRequest, NextResponse } from "next/server";

/**
 * Single source of truth for talking to the NestJS backend.
 *
 * Every route under app/api used to carry its own copy of this logic — base
 * URL resolution, header forwarding, error handling — which meant twelve
 * places to fix when any one of them was wrong, and no timeout anywhere. A
 * fetch to an unreachable host hangs until the platform kills the function,
 * which is what left the admin dashboard spinning forever in production.
 */

/**
 * Set BACKEND_API_URL in the Vercel project settings to the deployed NestJS
 * URL. It is deliberately NOT prefixed NEXT_PUBLIC_: the browser talks to
 * these Next routes, and only the server talks to the backend, so the backend
 * origin never has to be exposed to the client.
 */
export const BACKEND_URL = (
  process.env.BACKEND_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

/** Long enough for a cold start on a free-tier host, short enough that the UI
 *  can show a real error instead of hanging. */
const TIMEOUT_MS = 10_000;

export type ErrorCode =
  | "UNAUTHORIZED"
  | "BACKEND_TIMEOUT"
  | "BACKEND_UNREACHABLE"
  | "BACKEND_ERROR"
  | "BAD_REQUEST";

export interface ApiError {
  error: { code: ErrorCode; message: string };
}

export function apiError(
  code: ErrorCode,
  message: string,
  status: number
): NextResponse<ApiError> {
  return NextResponse.json({ error: { code, message } }, { status });
}

interface ProxyOptions {
  /** Backend path, leading slash included: "/admin/dashboard". */
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Require and forward the caller's Authorization header. */
  requireAuth?: boolean;
  /** Copy the incoming request's query string onto the backend URL. */
  forwardQuery?: boolean;
  /** Body to send. Omit to forward the incoming request's JSON body. */
  body?: unknown;
  /**
   * Public endpoints only: content to serve when the backend cannot be
   * reached, so the marketing site degrades instead of breaking. Admin
   * endpoints must never use this — showing invented data to someone
   * managing real applications is worse than showing an error.
   */
  fallback?: () => unknown;
}

export async function proxyToBackend(
  req: NextRequest,
  options: ProxyOptions
): Promise<NextResponse> {
  const { path, method = "GET", requireAuth = false, forwardQuery = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (requireAuth) {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authorization header required", 401);
    }
    headers["Authorization"] = auth;
  }

  let payload: string | undefined;
  if (method === "POST" || method === "PATCH") {
    try {
      const body = "body" in options ? options.body : await req.json();
      payload = JSON.stringify(body);
    } catch {
      return apiError("BAD_REQUEST", "Request body must be valid JSON", 400);
    }
  }

  const query = forwardQuery ? req.nextUrl.search : "";
  const url = `${BACKEND_URL}${path}${query}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    // A backend error page or a proxy in front of it can answer with HTML, so
    // res.json() is not safe to call blindly — it would throw and be reported
    // as "unreachable", pointing at the wrong problem.
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return apiError(
        "BACKEND_ERROR",
        `Backend returned a non-JSON response (HTTP ${res.status})`,
        502
      );
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return apiError("UNAUTHORIZED", "Session expired. Please sign in again.", 401);
      }
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(`[IT ADIS] ${method} ${path} failed:`, error);

    if (options.fallback) {
      return NextResponse.json(options.fallback(), { status: 200 });
    }

    return timedOut
      ? apiError("BACKEND_TIMEOUT", "The server took too long to respond.", 504)
      : apiError("BACKEND_UNREACHABLE", "Could not reach the server.", 503);
  }
}
