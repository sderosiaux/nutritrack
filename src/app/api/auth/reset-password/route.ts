import { auth } from "@/server/auth";

/**
 * POST /api/auth/reset-password
 *
 * Spec-aligned path (spec/07-api.md:22) — same as Better Auth's internal
 * /api/auth/reset-password endpoint. Dedicated route for explicit contract.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/api/auth/reset-password";
  return auth.handler(new Request(url.toString(), req));
}
