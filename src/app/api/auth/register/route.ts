import { auth } from "@/server/auth";

/**
 * POST /api/auth/register
 *
 * Spec-aligned path (spec/07-api.md:17) that maps to Better Auth's
 * internal /api/auth/sign-up/email endpoint.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/api/auth/sign-up/email";
  return auth.handler(new Request(url.toString(), req));
}
