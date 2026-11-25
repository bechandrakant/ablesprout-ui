import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests run against a real AbleSprout API seeded with the demo school
 * (`npm run seed` in ablesprout-api). Use LLM_PROVIDER=mock on the API for fast, free,
 * deterministic AI responses, or a real provider (tests allow up to 2 minutes per AI call).
 *
 *   E2E_BASE_URL   – test an already running/deployed UI instead of starting one
 *   NEXT_PUBLIC_API_URL – API the UI talks to (default http://localhost:4000)
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
      },
});
