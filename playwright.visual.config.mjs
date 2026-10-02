import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",

  timeout: 45_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,
  workers: 1,

  retries: process.env.CI ? 1 : 0,

  reporter: [
    ["line"],
    [
      "html",
      {
        outputFolder: "artifacts/visual-qa/playwright-report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL: "http://127.0.0.1:4173",

    viewport: {
      width: 390,
      height: 844,
    },

    deviceScaleFactor: 1,

    colorScheme: "light",

    locale: "de-CH",

    timezoneId: "Europe/Zurich",

    trace: "retain-on-failure",

    screenshot: "only-on-failure",

    video: "off",
  },

  webServer: {
    command:
      "pnpm start --hostname 127.0.0.1 --port 4173",

    url:
      "http://127.0.0.1:4173",

    reuseExistingServer:
      !process.env.CI,

    timeout:
      120_000,
  },
});
