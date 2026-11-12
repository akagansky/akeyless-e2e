import { defineConfig } from "@playwright/test";

process.loadEnvFile();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"], ["html", { open: "never" }]],
  expect: { timeout: 10_000 },
  timeout: 60_000,
  use: {
    baseURL: "https://console.akeyless.io",
    headless: true,
    trace: "off",
    screenshot: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
