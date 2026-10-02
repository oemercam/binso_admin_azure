import { expect, test } from "@playwright/test";

const routes = [
  "/", "/funktionen", "/so-funktioniert-es", "/preise", "/faq", "/sicherheit", "/kontakt", "/admin/login",
  "/dashboard", "/kunden", "/kunden/neu", "/kunden/1", "/kunden/1/bearbeiten", "/projekte", "/projekte/neu", "/projekte/1", "/projekte/1/bearbeiten", "/zeiterfassung",
  "/angebote", "/angebote/neu", "/angebote/1", "/rechnungen", "/rechnungen/neu", "/rechnungen/1", "/dokumente", "/dokumente/neu", "/dokumente/1",
  "/berichte", "/berichte/umsatz", "/berichte/zeit", "/berichte/forderungen", "/unternehmen", "/unternehmen/firmendaten", "/unternehmen/branding", "/unternehmen/zahlungseinstellungen", "/unternehmen/rechnungsvorlagen", "/unternehmen/standardtexte", "/unternehmen/email-vorlagen", "/unternehmen/nummernkreise", "/unternehmen/steuersaetze", "/unternehmen/waehrungen", "/team", "/team/neu", "/team/1", "/zahlungen", "/mahnungen", "/support", "/support/neu", "/support/tickets", "/support/wissen", "/support/status", "/mehr", "/einstellungen",
  "/einstellungen/profil", "/einstellungen/sprache", "/einstellungen/darstellung", "/einstellungen/sicherheit", "/einstellungen/daten", "/einstellungen/ueber",
  "/einstellungen/benachrichtigungen", "/einstellungen/pwa", "/einstellungen/abonnement", "/einstellungen/berechtigungen", "/sprache", "/login", "/passwort-vergessen", "/registrieren", "/onboarding", "/rechtliches", "/impressum", "/datenschutz", "/agb",
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
test("mobile More sheet state",async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto("/dashboard");await page.getByRole("button",{name:"Mehr"}).click();await expect(page.locator(".more-sheet")).toBeVisible();await page.screenshot({path:testInfo.outputPath("dashboard-more-sheet.png"),fullPage:true});});
test("logout confirmation state",async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto("/einstellungen");await page.getByRole("button",{name:"Abmelden"}).click();await expect(page.getByRole("dialog")).toBeVisible();await page.screenshot({path:testInfo.outputPath("einstellungen-abmelden-dialog.png"),fullPage:true});});
test("appearance light state",async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto("/einstellungen/darstellung");await expect(page.getByText("Systemeinstellung verwenden")).toBeVisible();await page.screenshot({path:testInfo.outputPath("appearance-light.png"),fullPage:true});});
test("language selection state",async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto("/einstellungen/sprache");await expect(page.getByText("Deutsch")).toBeVisible();await page.screenshot({path:testInfo.outputPath("language-selection.png"),fullPage:true});});
test("public mobile navigation state",async({page},testInfo)=>{await page.setViewportSize({width:390,height:844});await page.goto("/");await page.getByRole("button",{name:/navigation öffnen/i}).click();await expect(page.locator(".public-mobile-menu")).toBeVisible();await page.screenshot({path:testInfo.outputPath("public-mobile-menu.png"),fullPage:true});});
