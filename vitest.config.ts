import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
    env: {
      // Stub DB URL for unit tests — no real connection made (lazy init, no queries).
      DATABASE_URL: "postgresql://test:test@localhost:5432/test_nutritrack",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret-32-chars-for-unit-tests",
    },
  },
});
