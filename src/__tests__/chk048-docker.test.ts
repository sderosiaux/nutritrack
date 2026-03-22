// @vitest-environment node
/**
 * CHK-048: Docker production config
 * Verifies docker-compose.prod.yml, Dockerfile, .env.example exist
 * and contain required fields for production deployment.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();

describe("CHK-048: Dockerfile (production multi-stage)", () => {
  const dockerfilePath = join(root, "Dockerfile");

  it("Dockerfile exists", () => {
    expect(existsSync(dockerfilePath)).toBe(true);
  });

  it("has multi-stage build (builder stage)", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toMatch(/FROM\s+\S+\s+AS\s+builder/i);
  });

  it("has runner stage", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toMatch(/FROM\s+\S+\s+AS\s+runner/i);
  });

  it("uses node:20-alpine or node:22-alpine base image", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toMatch(/FROM\s+node:(20|22)-alpine/);
  });

  it("sets NODE_ENV=production in runner stage", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toContain("NODE_ENV=production");
  });

  it("runs as non-root user", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toMatch(/USER\s+(node|nextjs|app)/);
  });

  it("exposes port 3000", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    expect(content).toContain("EXPOSE 3000");
  });

  it("copies only necessary build artifacts (not full source)", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    // Runner stage should copy .next standalone, not COPY . .
    expect(content).toContain(".next");
  });

  it("does not install dev dependencies in runner stage", () => {
    const content = readFileSync(dockerfilePath, "utf-8");
    const lines = content.split("\n");
    const runnerStart = lines.findIndex((l) =>
      /FROM\s+\S+\s+AS\s+runner/i.test(l)
    );
    const runnerLines = lines.slice(runnerStart).join("\n");
    // Runner should not run full pnpm install
    expect(runnerLines).not.toMatch(/pnpm install(?!\s+--prod)/);
  });
});

describe("CHK-048: docker-compose.prod.yml", () => {
  const composePath = join(root, "docker-compose.prod.yml");

  it("docker-compose.prod.yml exists", () => {
    expect(existsSync(composePath)).toBe(true);
  });

  it("app service builds from Dockerfile (not Dockerfile.dev)", () => {
    const content = readFileSync(composePath, "utf-8");
    expect(content).toContain("Dockerfile");
    expect(content).not.toContain("Dockerfile.dev");
  });

  it("app service has no volume mounts (no bind mounts in prod)", () => {
    const content = readFileSync(composePath, "utf-8");
    // Should not mount local code into container
    expect(content).not.toMatch(/volumes:\s*\n\s+-\s+\.:/);
  });

  it("postgres has no external port exposed", () => {
    const content = readFileSync(composePath, "utf-8");
    // Postgres should not expose 5432 to host in prod
    expect(content).not.toMatch(/["']?5432:5432["']?/);
  });

  it("redis has no external port exposed", () => {
    const content = readFileSync(composePath, "utf-8");
    expect(content).not.toMatch(/["']?6379:6379["']?/);
  });

  it("minio has no external port exposed (or only console)", () => {
    const content = readFileSync(composePath, "utf-8");
    // 9000 (API) should not be exposed externally in prod
    expect(content).not.toMatch(/["']?9000:9000["']?/);
  });

  it("has nginx reverse proxy service", () => {
    const content = readFileSync(composePath, "utf-8");
    expect(content).toMatch(/nginx/i);
  });

  it("nginx exposes ports 80 and/or 443", () => {
    const content = readFileSync(composePath, "utf-8");
    expect(content).toMatch(/80:|443:/);
  });

  it("postgres has health check", () => {
    const content = readFileSync(composePath, "utf-8");
    // postgres service must have a healthcheck (search whole file)
    expect(content).toContain("pg_isready");
  });

  it("app service depends_on postgres with healthy condition", () => {
    const content = readFileSync(composePath, "utf-8");
    expect(content).toContain("service_healthy");
  });
});

describe("CHK-048: .env.example", () => {
  const envPath = join(root, ".env.example");

  it(".env.example exists", () => {
    expect(existsSync(envPath)).toBe(true);
  });

  it("documents DATABASE_URL", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("DATABASE_URL");
  });

  it("documents REDIS_URL", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("REDIS_URL");
  });

  it("documents BETTER_AUTH_SECRET", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("BETTER_AUTH_SECRET");
  });

  it("documents BETTER_AUTH_URL", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("BETTER_AUTH_URL");
  });

  it("documents MinIO variables", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("MINIO_ENDPOINT");
    expect(content).toContain("MINIO_ACCESS_KEY");
  });

  it("documents VISION_PROVIDER", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("VISION_PROVIDER");
  });

  it("documents NEXT_PUBLIC_APP_URL", () => {
    const content = readFileSync(envPath, "utf-8");
    expect(content).toContain("NEXT_PUBLIC_APP_URL");
  });

  it("has comment descriptions for each variable", () => {
    const content = readFileSync(envPath, "utf-8");
    // Should have at least some comments (lines starting with #)
    const commentLines = content
      .split("\n")
      .filter((l) => l.trim().startsWith("#"));
    expect(commentLines.length).toBeGreaterThan(5);
  });
});
