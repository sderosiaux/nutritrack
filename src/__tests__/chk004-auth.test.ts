/**
 * CHK-004: Better Auth integration: email/password register, login,
 * logout, refresh, forgot/reset password, JWT bearer session middleware
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../");

// Mock getSessionFromRequest to avoid DB connection in middleware tests.
// The auth instance itself (config/api object inspection) uses the real lazy proxy
// which does NOT make DB calls until a handler is actually invoked with a query.
vi.mock("@/server/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/server/auth")>();
  return {
    ...real,
    getSessionFromRequest: vi.fn().mockResolvedValue(null),
  };
});

describe("CHK-004: Better Auth configuration", () => {
  beforeEach(() => {
    // Reset module cache so proxy re-creates on each describe block if needed
    vi.clearAllMocks();
  });

  it("auth module exports auth instance", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth).toBeDefined();
  });

  it("auth has handler method for request handling", async () => {
    const { auth } = await import("@/server/auth");
    expect(typeof auth.handler).toBe("function");
  });

  it("emailAndPassword provider is enabled", async () => {
    const { auth } = await import("@/server/auth");
    const options = (auth as { options?: { emailAndPassword?: { enabled?: boolean } } }).options;
    expect(options?.emailAndPassword?.enabled).toBe(true);
  });

  it("bearer plugin is configured for JWT Authorization: Bearer <token> header", async () => {
    const { auth } = await import("@/server/auth");
    const options = (auth as { options?: { plugins?: Array<{ id: string }> } }).options;
    const plugins = options?.plugins ?? [];
    const hasBearerPlugin = plugins.some((p) => p.id === "bearer");
    expect(
      hasBearerPlugin,
      "bearer plugin not found — add bearer() to plugins array in src/server/auth/index.ts"
    ).toBe(true);
  });
});

describe("CHK-004: Auth API endpoint contract", () => {
  it("auth.api exposes signUpEmail endpoint (register)", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth.api).toHaveProperty("signUpEmail");
    expect(typeof (auth.api as Record<string, unknown>).signUpEmail).toBe("function");
  });

  it("auth.api exposes signInEmail endpoint (login)", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth.api).toHaveProperty("signInEmail");
    expect(typeof (auth.api as Record<string, unknown>).signInEmail).toBe("function");
  });

  it("auth.api exposes signOut endpoint (logout)", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth.api).toHaveProperty("signOut");
    expect(typeof (auth.api as Record<string, unknown>).signOut).toBe("function");
  });

  it("auth.api exposes requestPasswordReset endpoint (forgot-password)", async () => {
    const { auth } = await import("@/server/auth");
    // requestPasswordReset = the forgot-password flow
    expect(auth.api).toHaveProperty("requestPasswordReset");
    expect(typeof (auth.api as Record<string, unknown>).requestPasswordReset).toBe("function");
  });

  it("auth.api exposes resetPassword endpoint (reset-password with token)", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth.api).toHaveProperty("resetPassword");
    expect(typeof (auth.api as Record<string, unknown>).resetPassword).toBe("function");
  });

  it("auth.api exposes getSession endpoint", async () => {
    const { auth } = await import("@/server/auth");
    expect(auth.api).toHaveProperty("getSession");
    expect(typeof (auth.api as Record<string, unknown>).getSession).toBe("function");
  });

  it("auth.api exposes refreshToken endpoint (session refresh / token renewal)", async () => {
    const { auth } = await import("@/server/auth");
    // Better Auth exposes refreshToken at POST /api/auth/refresh-token
    // Satisfies spec CHK-004 "refresh" requirement
    expect(auth.api).toHaveProperty("refreshToken");
    expect(typeof (auth.api as Record<string, unknown>).refreshToken).toBe("function");
  });
});

describe("CHK-004: Next.js route wiring", () => {
  it("src/app/api/auth/[...all]/route.ts exports GET and POST for Better Auth", async () => {
    const routePath = join(root, "src/app/api/auth/[...all]/route.ts");
    expect(existsSync(routePath)).toBe(true);
    const route = await import("@/app/api/auth/[...all]/route");
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");
  });
});

describe("CHK-004: JWT session middleware enforcement", () => {
  it("getSessionFromRequest is exported as a function", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    expect(typeof getSessionFromRequest).toBe("function");
  });

  it("requireAuth middleware returns 401 with code=unauthorized for unauthenticated requests", async () => {
    // getSessionFromRequest is mocked to return null (no session)
    const { Hono } = await import("hono");
    const { sessionMiddleware, requireAuth } = await import("@/server/api/middleware/auth");

    const testApp = new Hono();
    testApp.use("*", sessionMiddleware);
    testApp.use("*", requireAuth);
    testApp.get("/secret", (c) => c.json({ data: "sensitive" }));

    const res = await testApp.fetch(new Request("http://localhost/secret"));
    expect(res.status).toBe(401);
    const body = await res.json() as { code: string };
    expect(body.code).toBe("unauthorized");
  });

  it("requireAuth middleware allows requests with valid session", async () => {
    const { getSessionFromRequest } = await import("@/server/auth");
    // Override mock for this test to return a valid session
    (getSessionFromRequest as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "user-1", email: "test@example.com", name: "Test" },
      session: { id: "sess-1", userId: "user-1" },
    });

    const { Hono } = await import("hono");
    const { sessionMiddleware, requireAuth } = await import("@/server/api/middleware/auth");

    const testApp = new Hono();
    testApp.use("*", sessionMiddleware);
    testApp.use("*", requireAuth);
    testApp.get("/protected", (c) => c.json({ ok: true }));

    const res = await testApp.fetch(
      new Request("http://localhost/protected", {
        headers: { Authorization: "Bearer mock-valid-token" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("sessionMiddleware sets session=null on context when unauthenticated", async () => {
    const { Hono } = await import("hono");
    const { sessionMiddleware } = await import("@/server/api/middleware/auth");

    const testApp = new Hono();
    testApp.use("*", sessionMiddleware);
    testApp.get("/check", (c) => {
      const session = c.get("session" as never);
      return c.json({ sessionIsNull: session === null });
    });

    const res = await testApp.fetch(new Request("http://localhost/check"));
    expect(res.status).toBe(200);
    const body = await res.json() as { sessionIsNull: boolean };
    expect(body.sessionIsNull).toBe(true);
  });
});
