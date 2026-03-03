import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test-setup.ts"],
    // Per-file env via // @vitest-environment jsdom directive in each test file
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test_nutritrack",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret-32-chars-for-unit-tests",
    },
  },
});
