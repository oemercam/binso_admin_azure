import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const publicRoutes = [
  "/",
  "/login",
  "/registrieren",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/email-bestaetigen",
  "/onboarding",
  "/preise",
  "/demo",
  "/kontakt",
  "/status",
  "/offline",
  "/maintenance",
  "/portal",
  "/portal/login",
  "/portal/registrieren",
  "/admin/login",
  "/operator/login",
];

const workspaceRoutes = [
  "/dashboard",
  "/kunden",
  "/kunden/neu",
  "/projekte",
  "/projekte/neu",
  "/zeiterfassung",
  "/zeiterfassung/neu",
  "/offerten",
  "/offerten/neu",
  "/rechnungen",
  "/rechnungen/neu",
  "/dokumente",
  "/dokumente/neu",
  "/berichte",
  "/support",
  "/support/neu",
  "/einstellungen",
];

const outputDirectory = path.resolve(
  "artifacts",
  "visual-qa",
  "screenshots",
);

fs.mkdirSync(outputDirectory, {
  recursive: true,
});

function slug(route) {
  if (route === "/") {
    return "home";
  }

  return route
    .replace(/^\//, "")
    .replaceAll("/", "__");
}

async function capture(page, route, prefix = "") {
  const pageErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  await page.goto(route, {
    waitUntil: "networkidle",
  });

  await expect(page.locator("body")).toBeVisible();

  await page.screenshot({
    path: path.join(
      outputDirectory,
      `${prefix}${slug(route)}.png`,
    ),
    fullPage: true,
  });

  expect(
    pageErrors,
    `Browserfehler auf ${route}`,
  ).toEqual([]);
}

for (const route of publicRoutes) {
  test(`Visual QA public ${route}`, async ({ page }) => {
    await capture(page, route);
  });
}

test.describe("Workspace Visual QA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/demo?start=1", {
      waitUntil: "networkidle",
    });

    await page.waitForURL(
      /\/dashboard(?:\?.*)?$/,
      {
        timeout: 30000,
      },
    );

    await expect(page.locator("body")).toBeVisible();
  });

  for (const route of workspaceRoutes) {
    test(
      `Visual QA workspace ${route}`,
      async ({ page }) => {
        await capture(
          page,
          route,
          "workspace__",
        );
      },
    );
  }
});
