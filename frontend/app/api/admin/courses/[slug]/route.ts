import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return proxyToBackend(req, {
    path: `/courses/${encodeURIComponent(slug)}`,
    method: "PATCH",
    requireAuth: true,
  });
}

/** Soft-delete — the backend flips isActive rather than dropping the row, so
 *  applications that reference the course keep their relation. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return proxyToBackend(req, {
    path: `/courses/${encodeURIComponent(slug)}`,
    method: "DELETE",
    requireAuth: true,
  });
}
