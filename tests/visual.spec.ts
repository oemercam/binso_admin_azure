import { expect, test } from "@playwright/test";

const routes = [
  "/", "/funktionen", "/so-funktioniert-es", "/preise", "/faq", "/sicherheit", "/kontakt", "/admin/login",
  "/dashboard", "/kunden", "/kunden/neu", "/kunden/1", "/kunden/1/bearbeiten", "/projekte", "/projekte/neu", "/projekte/1", "/projekte/1/bearbeiten", "/zeiterfassung",
  "/angebote", "/angebote/neu", "/angebote/1", "/rechnungen", "/rechnungen/neu", "/rechnungen/1", "/dokumente", "/dokumente/neu", "/dokumente/1",
  "/berichte", "/unternehmen", "/team", "/team/neu", "/zahlungen", "/mahnungen", "/support", "/support/neu", "/mehr", "/einstellungen",
  "/einstellungen/profil", "/einstellungen/sprache", "/einstellungen/darstellung", "/einstellungen/sicherheit", "/einstellungen/daten", "/einstellungen/ueber",
  "/einstellungen/benachrichtigungen", "/einstellungen/pwa", "/einstellungen/abonnement", "/einstellungen/berechtigungen", "/zahlungen", "/sprache", "/login", "/passwort-vergessen", "/registrieren", "/onboarding", "/rechtliches", "/impressum", "/datenschutz", "/agb",
  "/offline", "/maintenance", "/control", "/control/firmen", "/control/abonnements", "/control/zahlungen", "/control/support", "/control/betrieb", "/control/sicherheit", "/control/kommunikation", "/control/konfiguration",
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