/**
 * CHK-004: Better Auth integration: email/password register, login,
 * logout, refresh, forgot/reset password, JWT session middleware
 */
import { describe, it, expect } from "vitest";

describe("CHK-004: Better Auth configuration", () => {
  it("auth module exports auth instance", async () => {
    // Dynamic import avoids DB connection at test time
    const mod = await import("@/server/auth");
    expect(mod.auth).toBeDefined();
  });

  it("auth has handler method for request handling", async () => {
    const { auth } = await import("@/server/auth");
    expect(typeof auth.handler).toBe("function");
  });

  it("auth handler is configured for email/password provider", async () => {
    const { auth } = await import("@/server/auth");
    // Better Auth instance should have options with emailAndPassword enabled
    const options = (auth as { options?: { emailAndPassword?: { enabled?: boolean } } }).options;
    expect(options?.emailAndPassword?.enabled).toBe(true);
  });
});

describe("CHK-004: Better Auth session middleware", () => {
  it("getSessionFromRequest is exported from auth module", async () => {
    const mod = await import("@/server/auth");
    expect(mod.getSessionFromRequest).toBeDefined();
    expect(typeof mod.getSessionFromRequest).toBe("function");
  });
});

describe("CHK-004: Hono API mounts auth middleware", () => {
  it("Hono app instance is exported", async () => {
    const mod = await import("@/server/api");
    expect(mod.app).toBeDefined();
  });

  it("health endpoint returns 200", async () => {
    const { app } = await import("@/server/api");
    const req = new Request("http://localhost/api/v1/health");
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});
