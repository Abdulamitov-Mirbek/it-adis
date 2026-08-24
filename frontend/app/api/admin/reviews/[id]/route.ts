import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(req, {
    path: `/reviews/${encodeURIComponent(id)}`,
    method: "PATCH",
    requireAuth: true,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(req, {
    path: `/reviews/${encodeURIComponent(id)}`,
    method: "DELETE",
    requireAuth: true,
  });
}
