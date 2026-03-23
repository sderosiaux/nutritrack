import { auth } from "@/server/auth";

/**
 * POST /api/auth/register
 *
 * Maps to Better Auth's /api/auth/sign-up/email endpoint.
 * Body: { email, password, name? }
 */
export async function POST(req: Request) {
  const body = await req.text();
  const url = new URL(req.url);
  url.pathname = "/api/auth/sign-up/email";

  const proxied = new Request(url.toString(), {
    method: "POST",
    headers: req.headers,
    body,
  });
  return auth.handler(proxied);
}
