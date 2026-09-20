import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: { concurrent: false },
  },
});
