import { auth } from "@/server/auth";

/**
 * POST /api/auth/refresh
 *
 * Spec-aligned path (spec/07-api.md:20) that maps to Better Auth's
 * internal /api/auth/refresh-token endpoint.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const url = new URL(req.url);
  url.pathname = "/api/auth/refresh-token";
  return auth.handler(new Request(url.toString(), { method: "POST", headers: req.headers, body }));
}
