import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, apiError } from "@/lib/server/backend";

/**
 * Teacher photo upload.
 *
 * Does not use proxyToBackend: that helper reads the body with req.json() and
 * forces an application/json content type, which destroys a multipart upload.
 * Here the raw body is forwarded untouched along with the original
 * Content-Type, so multer on the backend still sees an intact boundary.
 */

/** Uploads are slower than JSON calls, so this gets more room than the 10s default. */
const TIMEOUT_MS = 30_000;

/** Matches the backend's own cap; rejected here so the file is never buffered. */
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = req.headers.get("authorization");
  if (!auth) {
    return apiError("UNAUTHORIZED", "Authorization header required", 401);
  }

  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    return apiError("BAD_REQUEST", "Expected a multipart/form-data upload", 400);
  }

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES) {
    return apiError("BAD_REQUEST", "Image must be 5 MB or smaller", 400);
  }

  const body = await req.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return apiError("BAD_REQUEST", "Image must be 5 MB or smaller", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `${BACKEND_URL}/teachers/${encodeURIComponent(id)}/photo`,
      {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": contentType },
        body,
        signal: controller.signal,
      }
    );
  } catch (error) {
    return apiError(
      error instanceof Error && error.name === "AbortError"
        ? "BACKEND_TIMEOUT"
        : "BACKEND_UNREACHABLE",
      "The upload could not reach the server. Try again.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const nestMessage = (data as { message?: string | string[] } | null)?.message;
    return apiError(
      response.status === 401 ? "UNAUTHORIZED" : "BACKEND_ERROR",
      (Array.isArray(nestMessage) ? nestMessage.join(", ") : nestMessage) ??
        `Upload failed (HTTP ${response.status})`,
      response.status
    );
  }

  return NextResponse.json(data);
}
