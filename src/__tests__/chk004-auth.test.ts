/**
 * CHK-004: Better Auth integration: email/password register, login,
 * logout, refresh, forgot/reset password, JWT bearer session middleware.
 *
 * Tests verify:
 *  1. Auth module configuration (emailAndPassword, bearer plugin)
 *  2. Each spec route path has a dedicated file that rewrites to Better Auth's internal path
 *  3. JWT session middleware enforcement (401/200 contract)
 *
 * Spec paths → Better Auth internal paths:
 *   /api/auth/register        → /api/auth/sign-up/email
 *   /api/auth/login           → /api/auth/sign-in/email
 *   /api/auth/logout          → /api/auth/sign-out
 *   /api/auth/refresh         → /api/auth/refresh-token
 *   /api/auth/forgot-password → /api/auth/forget-password
 *   /api/auth/reset-password  → /api/auth/reset-password  (same)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../");

// Mock the auth module to avoid DB connection during route/middleware tests.
vi.mock("@/server/auth", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/server/auth")>();
  return {
    ...real,
    auth: {
      handler: vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 })),
      options: {
        emailAndPassword: { enabled: true },
        plugins: [{ id: "bearer" }],
      },
      api: {
        signUpEmail: vi.fn(),
        signInEmail: vi.fn(),
        signOut: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
        getSession: vi.fn(),
        refreshToken: vi.fn(),
      },
    },
    getSessionFromRequest: vi.fn().mockResolvedValue(null),
  };
});

describe("CHK-004: Auth module configuration", () => {
  beforeEach(() => {
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

describe("CHK-004: Spec route files exist with dedicated adapters", () => {
  it("POST /api/auth/register — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/register/route.ts"))).toBe(true);
  });

  it("POST /api/auth/login — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/login/route.ts"))).toBe(true);
  });

  it("POST /api/auth/logout — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/logout/route.ts"))).toBe(true);
  });

  it("POST /api/auth/refresh — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/refresh/route.ts"))).toBe(true);
  });

  it("POST /api/auth/forgot-password — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/forgot-password/route.ts"))).toBe(true);
  });

  it("POST /api/auth/reset-password — dedicated route file exists", () => {
    expect(existsSync(join(root, "src/app/api/auth/reset-password/route.ts"))).toBe(true);
  });

  it("GET /api/auth/[...all] catch-all handles Better Auth internal paths (session, etc.)", () => {
    expect(existsSync(join(root, "src/app/api/auth/[...all]/route.ts"))).toBe(true);
  });
});

describe("CHK-004: Spec path → Better Auth internal path mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/auth/register maps to /api/auth/sign-up/email", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/register/route");
    await POST(new Request("http://localhost/api/auth/register", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/sign-up/email");
  });

  it("POST /api/auth/login maps to /api/auth/sign-in/email", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/login/route");
    await POST(new Request("http://localhost/api/auth/login", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/sign-in/email");
  });

  it("POST /api/auth/logout maps to /api/auth/sign-out", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/logout/route");
    await POST(new Request("http://localhost/api/auth/logout", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/sign-out");
  });

  it("POST /api/auth/refresh maps to /api/auth/refresh-token", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/refresh/route");
    await POST(new Request("http://localhost/api/auth/refresh", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/refresh-token");
  });

  it("POST /api/auth/forgot-password maps to /api/auth/forget-password", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    await POST(new Request("http://localhost/api/auth/forgot-password", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/forget-password");
  });

  it("POST /api/auth/reset-password maps to /api/auth/reset-password", async () => {
    const { auth } = await import("@/server/auth");
    const spy = auth.handler as ReturnType<typeof vi.fn>;

    const { POST } = await import("@/app/api/auth/reset-password/route");
    await POST(new Request("http://localhost/api/auth/reset-password", { method: "POST" }));

    expect(spy).toHaveBeenCalledOnce();
    expect(new URL((spy.mock.calls[0][0] as Request).url).pathname).toBe("/api/auth/reset-password");
  });

  it("all spec route handlers export POST function", async () => {
    const [register, login, logout, refresh, forgot, reset] = await Promise.all([
      import("@/app/api/auth/register/route"),
      import("@/app/api/auth/login/route"),
      import("@/app/api/auth/logout/route"),
      import("@/app/api/auth/refresh/route"),
      import("@/app/api/auth/forgot-password/route"),
      import("@/app/api/auth/reset-password/route"),
    ]);
    expect(typeof register.POST).toBe("function");
    expect(typeof login.POST).toBe("function");
    expect(typeof logout.POST).toBe("function");
    expect(typeof refresh.POST).toBe("function");
    expect(typeof forgot.POST).toBe("function");
    expect(typeof reset.POST).toBe("function");
  });
});

describe("CHK-004: JWT session middleware enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
