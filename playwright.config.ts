import { defineConfig, devices } from "@playwright/test";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: join(root, "tests", "ds"),
  testMatch: "**/*.e2e.spec.ts",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx vite --config showcase/vite.config.ts --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173/",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
