import { expect, test } from "@playwright/test";

const routes = [
  "/", "/funktionen", "/so-funktioniert-es", "/preise", "/faq", "/sicherheit", "/kontakt", "/admin/login",
  "/dashboard", "/kunden", "/kunden/1", "/projekte", "/projekte/1", "/zeiterfassung",
  "/angebote", "/angebote/1", "/rechnungen", "/rechnungen/1", "/dokumente", "/dokumente/1",
  "/berichte", "/unternehmen", "/team", "/support", "/support/neu", "/mehr", "/einstellungen",
  "/einstellungen/profil", "/einstellungen/sprache", "/einstellungen/darstellung",
  "/einstellungen/benachrichtigungen", "/einstellungen/pwa", "/login", "/registrieren",
  "/offline", "/maintenance",
];

for (const route of routes) {
  test(route, async ({ page }, testInfo) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await page.screenshot({
      path: testInfo.outputPath(route.replaceAll("/", "_").replace(/^_/, "") || "home" + ".png"),
      fullPage: true,
    });
  });
}