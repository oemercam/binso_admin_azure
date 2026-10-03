import fs from "node:fs";
const required=[
"app/page.tsx","app/produkt/page.tsx","app/preise/page.tsx","app/demo/page.tsx","app/login/page.tsx","app/registrieren/page.tsx",
"app/agb/page.tsx","app/datenschutz/page.tsx","app/impressum/page.tsx","app/email-bestaetigen/page.tsx",
"app/api/auth/register/route.ts","app/api/auth/login/route.ts","app/api/auth/logout/route.ts","app/api/auth/recover/route.ts","app/api/auth/password/route.ts","app/api/auth/verify-email/route.ts",
"app/api/demo/session/route.ts","app/api/health/route.ts","proxy.ts","app/robots.ts","app/sitemap.ts",
"public/screenshots/dashboard-desktop.png","public/screenshots/rechnungen-desktop.png","public/screenshots/zeit-mobile.png"
];
const failures=[];for(const p of required)if(!fs.existsSync(p))failures.push("missing "+p);
const register=fs.readFileSync("app/registrieren/page.tsx","utf8");
for(const marker of ["name,company,email,password","acceptedTerms:accepted","termsVersion:","privacyVersion:","minLength={12}"])if(!register.includes(marker))failures.push("registration contract missing "+marker);
const login=fs.readFileSync("app/login/page.tsx","utf8");if(login.includes("startDemoClientSession"))failures.push("production login must not silently fall back to demo");
const domain=fs.readFileSync("config/domain.ts","utf8");if(!domain.includes("trialDays: 30"))failures.push("trial duration does not match public 30-day promise");
const checkout=fs.readFileSync("app/api/billing/checkout/route.ts","utf8");if(checkout.includes("/onboarding?")||checkout.includes("/checkout?"))failures.push("billing redirects to non-existent route");
const authRegister=fs.readFileSync("app/api/auth/register/route.ts","utf8");for(const marker of ['stringField(body,"name"','stringField(body,"company"','body.acceptedTerms!==true','requiresEmailVerification:true'])if(!authRegister.includes(marker))failures.push("register API invariant missing "+marker);
const proxy=fs.readFileSync("proxy.ts","utf8");if(proxy.includes('"/demo"')||proxy.includes('"/registrieren"'))failures.push("public demo/registration accidentally protected");
if(failures.length){console.error("Production readiness self-check failed:");for(const f of failures)console.error("- "+f);process.exit(1)}
console.log("Production readiness self-check OK.");
