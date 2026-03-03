/**
 * CHK-001: Scaffold pnpm monorepo with Next.js 15 (App Router),
 * TypeScript, Tailwind v4, Hono API routes, Vitest, Playwright
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../");

function readJson(rel: string) {
  return JSON.parse(readFileSync(join(root, rel), "utf-8"));
}

describe("CHK-001: Project scaffold", () => {
  it("package.json has next@15", () => {
    const pkg = readJson("package.json");
    expect(pkg.dependencies.next).toMatch(/^[\^~]?15/);
  });

  it("package.json has tailwindcss@4", () => {
    const pkg = readJson("package.json");
    expect(pkg.devDependencies.tailwindcss).toMatch(/^[\^~]?4/);
  });

  it("package.json has hono", () => {
    const pkg = readJson("package.json");
    expect(pkg.dependencies.hono).toBeTruthy();
  });

  it("package.json has vitest", () => {
    const pkg = readJson("package.json");
    expect(pkg.devDependencies.vitest).toBeTruthy();
  });

  it("package.json has @playwright/test", () => {
    const pkg = readJson("package.json");
    expect(pkg.devDependencies["@playwright/test"]).toBeTruthy();
  });

  it("package.json has required scripts: dev, build, test, db:migrate, db:seed", () => {
    const pkg = readJson("package.json");
    const required = ["dev", "build", "test", "db:migrate", "db:seed"];
    for (const s of required) {
      expect(pkg.scripts[s], `script '${s}' missing`).toBeTruthy();
    }
  });

  it("tsconfig.json uses strict mode with @/* paths alias", () => {
    const tsconfig = readJson("tsconfig.json");
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.paths?.["@/*"]).toBeTruthy();
  });

  it("pnpm-workspace.yaml exists", () => {
    const content = readFileSync(join(root, "pnpm-workspace.yaml"), "utf-8");
    expect(content).toContain("packages");
  });

  it("drizzle.config.ts references correct schema path", () => {
    const content = readFileSync(join(root, "drizzle.config.ts"), "utf-8");
    expect(content).toContain("schema/index");
  });

  it(".env.example has all required environment variables", () => {
    const content = readFileSync(join(root, ".env.example"), "utf-8");
    const required = [
      "DATABASE_URL",
      "REDIS_URL",
      "MINIO_ENDPOINT",
      "BETTER_AUTH_SECRET",
      "VISION_PROVIDER",
    ];
    for (const v of required) {
      expect(content, `${v} missing from .env.example`).toContain(v);
    }
  });
});

describe("CHK-001: App Router structure", () => {
  it("src/app/layout.tsx exists — App Router root layout", () => {
    const layoutPath = join(root, "src/app/layout.tsx");
    expect(existsSync(layoutPath), "src/app/layout.tsx not found").toBe(true);
  });

  it("src/app/page.tsx exists — App Router root page", () => {
    const pagePath = join(root, "src/app/page.tsx");
    expect(existsSync(pagePath), "src/app/page.tsx not found").toBe(true);
  });
});

describe("CHK-001: Hono API route wiring", () => {
  it("src/app/api/v1/[[...all]]/route.ts exists — Hono wired into App Router", () => {
    const routePath = join(root, "src/app/api/v1/[[...all]]/route.ts");
    expect(existsSync(routePath), "Hono catch-all route not found").toBe(true);
  });

  it("Hono route imports and delegates to Hono app.fetch", () => {
    const routePath = join(root, "src/app/api/v1/[[...all]]/route.ts");
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain("app");
    expect(content).toContain("fetch");
  });

  it("Hono route exports GET, POST, PUT, PATCH, DELETE handlers", () => {
    const routePath = join(root, "src/app/api/v1/[[...all]]/route.ts");
    const content = readFileSync(routePath, "utf-8");
    for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
      expect(content, `${method} not exported from Hono route`).toContain(method);
    }
  });

  it("Hono app responds to health check at /api/v1/health", async () => {
    const { app } = await import("@/server/api");
    const req = new Request("http://localhost/api/v1/health");
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("CHK-001: Better Auth wiring", () => {
  it("src/app/api/auth/[...all]/route.ts exists — Better Auth wired into App Router", () => {
    const routePath = join(root, "src/app/api/auth/[...all]/route.ts");
    expect(existsSync(routePath), "Better Auth catch-all route not found").toBe(true);
  });

  it("Better Auth route exports GET and POST", () => {
    const routePath = join(root, "src/app/api/auth/[...all]/route.ts");
    const content = readFileSync(routePath, "utf-8");
    expect(content).toContain("GET");
    expect(content).toContain("POST");
  });
});
