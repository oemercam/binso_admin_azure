import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/marketing',
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3200',
    colorScheme: 'light',
  },
  webServer: {
    command: 'pnpm dev --hostname 127.0.0.1 --port 3200',
    url: 'http://127.0.0.1:3200/',
    reuseExistingServer: false,
    env: {
      ...process.env,
      AUTH_MODE: 'local',
      ALLOW_LOCAL_AUTH: 'true',
      DATABASE_URL: '',
      NEXT_PUBLIC_APP_ENV: 'marketing-screenshots',
    },
  },
  projects: [
    { name: 'marketing-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } } },
    { name: 'marketing-mobile', use: { ...devices['iPhone 15 Pro'] } },
  ],
})
