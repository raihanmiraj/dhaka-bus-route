import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    channel: "chrome",
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3018",
    trace: "retain-on-failure",
  },
  workers: 1,
});
