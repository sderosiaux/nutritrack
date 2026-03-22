// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("CHK-043: PWA manifest.json", () => {
  const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
  let manifest: Record<string, unknown>;

  it("manifest.json exists in public/", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(manifest).toBeDefined();
  });

  it("has required name fields", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(manifest.name).toBe("NutriTrack");
    expect(manifest.short_name).toBe("NutriTrack");
  });

  it("has correct theme_color", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(manifest.theme_color).toBe("#16A34A");
  });

  it("has start_url and display", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe("standalone");
  });

  it("has icons array with at least one entry", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(Array.isArray(manifest.icons)).toBe(true);
    const icons = manifest.icons as Array<{ src: string; sizes: string; type: string }>;
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0].src).toBeDefined();
    expect(icons[0].sizes).toBeDefined();
  });

  it("has background_color", () => {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    expect(manifest.background_color).toBeDefined();
  });
});

describe("CHK-043: service worker file", () => {
  it("sw.js exists in public/", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
  });

  it("sw.js has install and fetch event listeners", () => {
    const swPath = path.resolve(process.cwd(), "public/sw.js");
    const content = fs.readFileSync(swPath, "utf-8");
    expect(content).toContain("install");
    expect(content).toContain("fetch");
  });
});
