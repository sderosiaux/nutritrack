/**
 * CHK-001: Scaffold pnpm monorepo with Next.js 15 (App Router),
 * TypeScript, Tailwind v4, Hono API routes, Vitest, Playwright
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
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
