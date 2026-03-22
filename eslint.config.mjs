import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Next.js base rules (includes React, React Hooks, @next/next, import, jsx-a11y)
  ...nextConfig,

  // TypeScript strict rules
  ...tseslint.configs.strict,

  // Project-wide settings
  {
    rules: {
      // Allow explicit any in test files and service boundaries
      "@typescript-eslint/no-explicit-any": "warn",
      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      // No unused vars (report as errors)
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Prevent accidental non-null assertions except in tests
      "@typescript-eslint/no-non-null-assertion": "warn",
      // No floating promises
      "@typescript-eslint/no-floating-promises": "off", // requires parserServices; enable with type-checked config
      // Empty functions are sometimes needed (noop)
      "@typescript-eslint/no-empty-function": "warn",
    },
  },

  // Non-null assertions are intentional in these files (Hono routes, canvas/media APIs, DB service)
  {
    files: [
      "src/server/api/routes/**/*.ts",
      "src/components/vision/**/*.tsx",
      "src/server/services/recipe-service.ts",
    ],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // Relaxed rules for test files
  {
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      // importOriginal<typeof import(...)>() is idiomatic Vitest — can't use import type here
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [".next/**", "out/**", "build/**", "node_modules/**", "drizzle/**"],
  }
);
