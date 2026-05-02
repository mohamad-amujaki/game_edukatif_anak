import { defineConfig, devices } from '@playwright/test';

/** Port terpisah agar `pnpm test:e2e` tidak bentrok dengan `pnpm dev` lokal. */
const E2E_API_PORT = process.env.E2E_API_PORT ?? '43120';
const E2E_VITE_PORT = process.env.E2E_VITE_PORT ?? '43121';
/** Pakai 127.0.0.1 agar probe Playwright konsisten dengan binding Vite di CI. */
const e2eOrigin = `http://127.0.0.1:${E2E_VITE_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? e2eOrigin,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: e2eOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      API_PORT: E2E_API_PORT,
      VITE_DEV_API_ORIGIN: `http://127.0.0.1:${E2E_API_PORT}`,
      VITE_DEV_PORT: E2E_VITE_PORT,
      VITE_DEV_STRICT_PORT: '1',
      VITE_DEV_HOST: '127.0.0.1',
    },
  },
});
