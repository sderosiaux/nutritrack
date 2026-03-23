import { auth } from "@/server/auth";

/**
 * POST /api/auth/forgot-password
 *
 * Spec-aligned path (spec/07-api.md:21) that maps to Better Auth's
 * internal /api/auth/forget-password endpoint.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const url = new URL(req.url);
  url.pathname = "/api/auth/forget-password";
  return auth.handler(new Request(url.toString(), { method: "POST", headers: req.headers, body }));
}
