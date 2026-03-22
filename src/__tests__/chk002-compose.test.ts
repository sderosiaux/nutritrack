/**
 * CHK-002: Docker Compose dev config:
 * PostgreSQL 16, Redis, MinIO, Ollama (optional), app service with hot-reload
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../");
const compose = readFileSync(join(root, "docker-compose.yml"), "utf-8");

describe("CHK-002: Docker Compose services", () => {
  it("docker-compose.yml exists and is non-empty", () => {
    expect(compose.length).toBeGreaterThan(100);
  });

  it("PostgreSQL 16 service defined", () => {
    expect(compose).toContain("postgres:16");
  });

  it("PostgreSQL service has health check", () => {
    expect(compose).toContain("pg_isready");
  });

  it("Redis service defined", () => {
    // redis:7-alpine or any redis image
    expect(compose).toMatch(/redis:/);
  });

  it("Redis service has health check", () => {
    expect(compose).toContain("redis-cli");
    expect(compose).toContain("ping");
  });

  it("MinIO service defined", () => {
    expect(compose).toContain("minio/minio");
  });

  it("MinIO service has health check", () => {
    expect(compose).toMatch(/healthcheck[\s\S]*?minio|minio[\s\S]*?healthcheck/);
  });

  it("Ollama service defined (optional — under profiles)", () => {
    expect(compose).toContain("ollama/ollama");
  });

  it("Ollama service is optional via Docker Compose profiles", () => {
    // Ollama must be under a profile so it's opt-in
    expect(compose).toContain("profiles:");
    expect(compose).toContain("ollama");
  });

  it("app service depends on postgres, redis, and minio", () => {
    expect(compose).toContain("depends_on:");
    expect(compose).toContain("postgres");
    expect(compose).toContain("redis");
    expect(compose).toContain("minio");
  });
});

describe("CHK-002: Hot-reload support", () => {
  it("app service has volume mount for hot-reload (source code mounted)", () => {
    // The .:/app volume mount enables hot-reload by sharing source with container
    expect(compose).toContain(".:/app");
  });

  it("Dockerfile.dev exists for dev container", () => {
    const dockerfilePath = join(root, "Dockerfile.dev");
    expect(existsSync(dockerfilePath), "Dockerfile.dev not found").toBe(true);
  });

  it("app service references Dockerfile.dev", () => {
    expect(compose).toContain("Dockerfile.dev");
  });
});
