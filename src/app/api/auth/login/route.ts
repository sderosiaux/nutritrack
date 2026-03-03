import { auth } from "@/server/auth";

/**
 * POST /api/auth/login
 *
 * Spec-aligned path (spec/07-api.md:18) that maps to Better Auth's
 * internal /api/auth/sign-in/email endpoint.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/api/auth/sign-in/email";
  return auth.handler(new Request(url.toString(), req));
}
