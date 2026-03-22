// @vitest-environment node
/**
 * CHK-046: Motion/animation spec
 * Verifies prefers-reduced-motion guard in globals.css
 * and that all animation/transition properties exist.
 */
import { readFileSync } from "fs";
import { join } from "path";

const cssPath = join(process.cwd(), "src/app/globals.css");
const css = readFileSync(cssPath, "utf-8");

describe("CHK-046: Motion & Animations", () => {
  describe("prefers-reduced-motion media query", () => {
    it("has @media (prefers-reduced-motion: reduce) block", () => {
      expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
    });

    it("disables all transitions inside reduced-motion block", () => {
      const reducedBlock = css.slice(
        css.indexOf("prefers-reduced-motion"),
        css.indexOf("prefers-reduced-motion") + 500
      );
      expect(reducedBlock).toContain("transition");
      expect(reducedBlock).toContain("none");
    });

    it("disables all animations inside reduced-motion block", () => {
      const idx = css.indexOf("prefers-reduced-motion");
      const reducedBlock = css.slice(idx, idx + 600);
      expect(reducedBlock).toContain("animation");
      expect(reducedBlock).toContain("none");
    });
  });

  describe("Animation keyframes", () => {
    it("has fade-in keyframe for page transitions", () => {
      expect(css).toMatch(/@keyframes\s+fade-in/);
    });

    it("has slide-up keyframe for toasts", () => {
      expect(css).toMatch(/@keyframes\s+slide-up/);
    });

    it("has ring-fill keyframe for calorie ring animation", () => {
      expect(css).toMatch(/@keyframes\s+ring-fill/);
    });

    it("has count-up keyframe for number animations", () => {
      expect(css).toMatch(/@keyframes\s+count-up/);
    });
  });

  describe("Animation utility classes", () => {
    it("has .animate-fade-in class", () => {
      expect(css).toContain(".animate-fade-in");
    });

    it("has .animate-slide-up class", () => {
      expect(css).toContain(".animate-slide-up");
    });

    it("has .animate-ring-fill class", () => {
      expect(css).toContain(".animate-ring-fill");
    });

    it("has sidebar transition class", () => {
      expect(css).toContain(".sidebar-transition");
    });

    it("has bottom-sheet spring transition", () => {
      expect(css).toContain("cubic-bezier(0.32, 0.72, 0, 1)");
    });

    it("has page fade transition at 150ms", () => {
      expect(css).toContain("150ms");
    });

    it("has ring fill at 600ms ease-out", () => {
      expect(css).toContain("600ms");
      expect(css).toContain("ease-out");
    });
  });

  describe("Stagger animation", () => {
    it("has stagger-fade utility or CSS custom property", () => {
      const hasStagger =
        css.includes("stagger") || css.includes("--stagger-delay");
      expect(hasStagger).toBe(true);
    });
  });
});
