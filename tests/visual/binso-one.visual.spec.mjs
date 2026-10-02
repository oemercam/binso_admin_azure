import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const routes = [
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

const outputDirectory =
  path.resolve(
    "artifacts",
    "visual-qa",
    "screenshots",
  );

fs.mkdirSync(
  outputDirectory,
  {
    recursive: true,
  },
);

function slug(route) {
  if (route === "/") {
    return "home";
  }

  return route
    .replace(/^\//, "")
    .replaceAll("/", "__");
}

for (const route of routes) {
  test(`Visual QA ${route}`, async ({ page }) => {
    const pageErrors = [];

    page.on(
      "pageerror",
      (error) => {
        pageErrors.push(
          String(error),
        );
      },
    );

    await page.goto(
      route,
      {
        waitUntil: "networkidle",
      },
    );

    await expect(
      page.locator("body"),
    ).toBeVisible();

    await page.screenshot({
      path:
        path.join(
          outputDirectory,
          `${slug(route)}.png`,
        ),

      fullPage: true,
    });

    expect(
      pageErrors,
      `Browserfehler auf ${route}`,
    ).toEqual([]);
  });
}
