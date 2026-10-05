import fs from "node:fs/promises";
import assert from "node:assert/strict";

const read=path=>fs.readFile(path,"utf8");

const [
  readme,
  auth,
  entra,
  journey,
  stripeDoc,
  launch,
  stripeSource,
  domainSource,
  envExample,
  securityRoute,
  appPages,
  productPage,
  marketing,
  verifyEmailRoute,
  portalLoginRoute,
  portalRegisterRoute,
  rootLayout,
  privacyConsent,
  webVitals,
  privacyPage,
]=await Promise.all([
  read("README.md"),
  read("docs/auth-security-flow.md"),
  read("docs/entra-operator-sso.md"),
  read("docs/production-customer-journey-test-plan.md"),
  read("docs/stripe-billing-setup.md"),
  read("docs/production-launch-checklist.md"),
  read("lib/server/stripe.ts"),
  read("config/domain.ts"),
  read(".env.example"),
  read("app/einstellungen/sicherheit/page.tsx"),
  read("components/app-pages.tsx"),
  read("app/produkt/page.tsx"),
  read("components/marketing.tsx"),
  read("app/api/auth/verify-email/route.ts"),
  read("app/portal/login/page.tsx"),
  read("app/portal/registrieren/page.tsx"),
  read("app/layout.tsx"),
  read("components/privacy-consent.tsx"),
  read("components/web-vitals-reporter.tsx"),
  read("app/datenschutz/page.tsx"),
]);

const stripeVersion=stripeSource.match(/stripeApiVersion=['"]([^'"]+)['"]/)?.[1];
assert.ok(stripeVersion,"Stripe API version must be defined in lib/server/stripe.ts");
assert.ok(stripeDoc.includes(stripeVersion),"Stripe documentation must match the runtime API version");
assert.ok(journey.includes(stripeVersion),"Customer journey must match the runtime Stripe API version");
assert.ok(envExample.includes(stripeVersion),".env.example must match the runtime Stripe API version");

const trialDays=domainSource.match(/trialDays:\s*(\d+)/)?.[1];
assert.ok(trialDays,"trialDays must be defined in config/domain.ts");
assert.ok(readme.includes("Microsoft Graph / Microsoft 365"),"README must describe the current mail architecture");
assert.ok(auth.includes("Microsoft Graph")&&auth.includes("sechsstelligen E-Mail-Bestätigungscode"),"Auth documentation must describe Graph and code verification");
assert.ok(journey.includes(trialDays+"-Tage-Testphase"),"Customer journey must match the configured trial duration");

for(const [name,source] of [
  ["auth documentation",auth],
  ["customer journey",journey],
  ["Stripe documentation",stripeDoc],
  ["launch checklist",launch],
]){
  assert.ok(!/verification link/i.test(source),name+" must not describe the retired verification-link flow");
  assert.ok(!/2026-09-30\.endive/i.test(source),name+" contains an obsolete Stripe API version");
}

assert.ok(entra.startsWith("# Binso One – Interner Zugriff mit Microsoft Entra ID"),"Entra documentation must use the current German operational guide");
assert.ok(securityRoute.includes("@/components/security-settings-page"),"Security route must use the dedicated production security component");
assert.ok(!appPages.includes("export function SecuritySettingsPage"),"Obsolete duplicate security settings implementation must not return");
assert.ok(!appPages.includes("MFA wird verfügbar, sobald"),"Stale MFA-not-implemented copy must not return");
assert.ok(!appPages.includes("Sitzungsübersicht wird erst angezeigt"),"Stale session-management copy must not return");

for(const required of [
  "docs/production-launch-checklist.md",
  "docs/auth-security-flow.md",
  "docs/entra-operator-sso.md",
  "docs/graph-mail-least-privilege.md",
  "docs/stripe-billing-setup.md",
  "docs/customer-data-lifecycle.md",
]){
  assert.ok(readme.includes(required),"README must reference "+required);
}

console.log("Documentation consistency passed: runtime, authentication, billing and operational docs are aligned.");

assert.ok(productPage.includes("domainConfig.trialDays"),"Product page must use the canonical trial duration");
assert.ok(!productPage.includes("30 Tage kostenlos"),"Product page must not contain the retired 30-day trial");
assert.ok(!marketing.includes('href="/portal/login"'),"Public login links must use the canonical customer login");
assert.ok(marketing.includes('href="/login"'),"Public marketing must link to the canonical customer login");
assert.ok(portalLoginRoute.includes('redirect("/login")'),"Legacy portal login route must redirect to canonical login");
assert.ok(portalRegisterRoute.includes('redirect("/registrieren")'),"Legacy portal registration route must redirect to canonical registration");
assert.ok(!verifyEmailRoute.includes("consumeAuthToken"),"Email verification must use the six-digit code flow only");
assert.ok(!verifyEmailRoute.includes("invalid_or_expired_token"),"Retired verification-link compatibility must not return");
assert.ok(rootLayout.includes("<PrivacyConsent"),"Privacy consent controls must be mounted globally");
assert.ok(privacyConsent.includes("Nur notwendige")&&privacyConsent.includes("Alle erlauben"),"Privacy controls must offer explicit choices");
assert.ok(webVitals.includes("readPerformanceConsent"),"Optional performance telemetry must respect the user's privacy preference");
assert.ok(privacyPage.includes("Optionale Performance-Messungen")&&privacyPage.includes("keine Werbe- oder Cross-Site-Tracking-Cookies"),"Privacy policy must describe the current consent and tracking behavior");
