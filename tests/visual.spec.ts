import { expect, test } from "@playwright/test";

const routes = [
  "/", "/funktionen", "/so-funktioniert-es", "/preise", "/faq", "/sicherheit", "/kontakt", "/admin/login",
  "/dashboard", "/kunden", "/kunden/neu", "/kunden/1", "/projekte", "/projekte/neu", "/projekte/1", "/zeiterfassung",
  "/angebote", "/angebote/neu", "/angebote/1", "/rechnungen", "/rechnungen/neu", "/rechnungen/1", "/dokumente", "/dokumente/neu", "/dokumente/1",
  "/berichte", "/unternehmen", "/team", "/support", "/support/neu", "/mehr", "/einstellungen",
  "/einstellungen/profil", "/einstellungen/sprache", "/einstellungen/darstellung", "/einstellungen/sicherheit", "/einstellungen/daten", "/einstellungen/ueber",
  "/einstellungen/benachrichtigungen", "/einstellungen/pwa", "/login", "/registrieren",
  "/offline", "/maintenance",
];

for (const route of routes) {
  test(route, async ({ page }, testInfo) => {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    expect(await page.locator('a[href="#"]').count()).toBe(0);
    await page.screenshot({
      path: testInfo.outputPath((route.replaceAll("/", "_").replace(/^_/, "") || "home") + ".png"),
      fullPage: true,
    });
  });
}