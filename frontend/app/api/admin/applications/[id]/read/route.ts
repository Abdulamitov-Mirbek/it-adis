import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/server/backend";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(req, {
    path: `/applications/${encodeURIComponent(id)}/read`,
    method: "PATCH",
    requireAuth: true,
  });
}
