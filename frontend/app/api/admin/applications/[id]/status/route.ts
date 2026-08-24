import { NextRequest } from "next/server";
import { apiError, proxyToBackend } from "@/lib/server/backend";

const VALID_STATUSES = ["PENDING", "REVIEWING", "ACCEPTED", "REJECTED"] as const;
type Status = (typeof VALID_STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

/**
 * Move an application through the pipeline.
 *
 * The status is validated here as well as on the backend. Prisma rejects an
 * invalid enum value with a 500 and an opaque message; catching it at the
 * edge turns that into a 400 the admin UI can actually explain.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("BAD_REQUEST", "Request body must be valid JSON", 400);
  }

  const status = (body as { status?: unknown } | null)?.status;
  if (!isStatus(status)) {
    return apiError(
      "BAD_REQUEST",
      `status must be one of: ${VALID_STATUSES.join(", ")}`,
      400
    );
  }

  return proxyToBackend(req, {
    path: `/applications/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    requireAuth: true,
    body: { status },
  });
}
