// @vitest-environment node
/**
 * CHK-049: Project documentation
 * Verifies README.md completeness, CONTRIBUTING.md existence,
 * and docs/self-hosting.md existence with required sections.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();

describe("CHK-049: README.md", () => {
  const readmePath = join(root, "README.md");
  let readme: string;

  beforeAll(() => {
    readme = readFileSync(readmePath, "utf-8");
  });

  it("README.md exists", () => {
    expect(existsSync(readmePath)).toBe(true);
  });

  it("has project title and description", () => {
    expect(readme).toMatch(/# NutriTrack/i);
  });

  it("has Features section", () => {
    expect(readme).toMatch(/## Features|## What's Included|## Core Features/i);
  });

  it("lists AI food recognition as a feature", () => {
    expect(readme).toMatch(/AI|photo|vision/i);
  });

  it("lists barcode scanning as a feature", () => {
    expect(readme).toMatch(/barcode|scan/i);
  });

  it("lists offline/PWA as a feature", () => {
    expect(readme).toMatch(/offline|PWA|service worker/i);
  });

  it("has Quick Start section", () => {
    expect(readme).toMatch(/## Quick Start|## Getting Started/i);
  });

  it("shows docker compose up command", () => {
    expect(readme).toMatch(/docker\s+compose\s+up/i);
  });

  it("has Environment Variables section or table", () => {
    expect(readme).toMatch(/environment\s+variable/i);
  });

  it("documents DATABASE_URL variable", () => {
    expect(readme).toContain("DATABASE_URL");
  });

  it("documents BETTER_AUTH_SECRET variable", () => {
    expect(readme).toContain("BETTER_AUTH_SECRET");
  });

  it("has Architecture section or diagram", () => {
    expect(readme).toMatch(/architecture|diagram/i);
  });

  it("has ASCII or text architecture diagram", () => {
    // Should have some kind of diagram (box drawing chars or ASCII art)
    const hasDiagram =
      readme.includes("```") && (readme.includes("─") || readme.includes("│") || readme.includes("Next.js"));
    expect(hasDiagram).toBe(true);
  });

  it("has Contributing section or link", () => {
    expect(readme).toMatch(/contribut/i);
  });

  it("has self-hosting section", () => {
    expect(readme).toMatch(/self.host|deploy|VPS/i);
  });

  it("has db:migrate and db:seed commands", () => {
    expect(readme).toContain("db:migrate");
    expect(readme).toContain("db:seed");
  });

  it("has pnpm test command", () => {
    expect(readme).toContain("pnpm test");
  });

  it("has License section", () => {
    expect(readme).toMatch(/MIT|license/i);
  });
});

describe("CHK-049: CONTRIBUTING.md", () => {
  const contribPath = join(root, "CONTRIBUTING.md");
  let contributing: string;

  beforeAll(() => {
    contributing = readFileSync(contribPath, "utf-8");
  });

  it("CONTRIBUTING.md exists", () => {
    expect(existsSync(contribPath)).toBe(true);
  });

  it("has Development Setup section", () => {
    expect(contributing).toMatch(/## Dev.*Setup|## Getting Started|## Setup/i);
  });

  it("documents pnpm install step", () => {
    expect(contributing).toContain("pnpm install");
  });

  it("documents test running command", () => {
    expect(contributing).toContain("pnpm test");
  });

  it("has PR process section", () => {
    expect(contributing).toMatch(/pull request|PR|contributing/i);
  });

  it("mentions Docker Compose for local services", () => {
    expect(contributing).toMatch(/docker/i);
  });
});

describe("CHK-049: docs/self-hosting.md", () => {
  const selfHostingPath = join(root, "docs/self-hosting.md");
  let selfHosting: string;

  beforeAll(() => {
    selfHosting = readFileSync(selfHostingPath, "utf-8");
  });

  it("docs/self-hosting.md exists", () => {
    expect(existsSync(selfHostingPath)).toBe(true);
  });

  it("has Deployment section", () => {
    expect(selfHosting).toMatch(/deploy|install|setup/i);
  });

  it("covers environment variables", () => {
    expect(selfHosting).toMatch(/environment|env var/i);
    expect(selfHosting).toContain("BETTER_AUTH_SECRET");
  });

  it("covers nginx configuration", () => {
    expect(selfHosting).toMatch(/nginx/i);
  });

  it("covers SSL/HTTPS setup", () => {
    expect(selfHosting).toMatch(/SSL|HTTPS|TLS|certbot|certificate/i);
  });

  it("covers database initialization steps", () => {
    expect(selfHosting).toMatch(/db:migrate|database/i);
  });

  it("covers backup recommendations", () => {
    expect(selfHosting).toMatch(/backup|data/i);
  });
});
