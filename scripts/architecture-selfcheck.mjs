import fs from "node:fs";
import path from "node:path";

const required=[
 "styles/tokens.css","styles/app.css","styles/responsive-central.css","styles/overlays.css","styles/shell.css","styles/primitives.css","hooks/use-overlay-lock.ts","config/app.ts",
 "components/ui/button.tsx","components/ui/form-controls.tsx","components/ui/responsive-overlay.tsx",
 "hooks/use-connectivity.ts","hooks/use-standalone.ts","components/connectivity-banner.tsx","components/pwa-update-notice.tsx",
 "database/migrations/0017_v150_code_schema_alignment.sql","database/migrations/0018_v151_organization_profile_alignment.sql","app/api/notification-preferences/route.ts","lib/server/idempotency.ts"
];
const missing=required.filter(x=>!fs.existsSync(x));if(missing.length)throw new Error(`Foundation files missing: ${missing.join(", ")}`);
for(const obsolete of ["styles/foundation.css","styles/legacy.css","styles/design-system.css","styles/responsive.css","styles/v1.3.1.css","styles/v1.3.2.css","styles/v1.3.3.css"]){if(fs.existsSync(obsolete))throw new Error(`Obsolete CSS layer still exists: ${obsolete}`)}
const tokens=fs.readFileSync("styles/tokens.css","utf8");
for(const token of ["--background","--surface","--foreground","--border","--space-1","--radius-sm","--text-base","--safe-top","--z-overlay","--motion-base","--touch-target","--control-height"]){if(!tokens.includes(token))throw new Error(`Design token missing: ${token}`)}
const globals=fs.readFileSync("app/globals.css","utf8");
const imports=[...globals.matchAll(/@import\s+["']([^"']+)["']/g)].map(m=>m[1]);
if(imports.join("|")!==["../styles/tokens.css","../styles/app.css","../styles/responsive-central.css","../styles/shell.css","../styles/overlays.css","../styles/primitives.css"].join("|"))throw new Error(`CSS entrypoints not centralized: ${imports.join(", ")}`);
const manifests=["manifest-site.webmanifest","manifest-portal.webmanifest","manifest-operator.webmanifest"].map(x=>JSON.parse(fs.readFileSync(path.join("public",x),"utf8")));
for(const manifest of manifests){for(const key of ["name","short_name","start_url","scope","display","theme_color","background_color","icons"]){if(manifest[key]==null)throw new Error(`PWA manifest ${manifest.name} missing ${key}`)}}
const sw=fs.readFileSync("public/sw.js","utf8");if(!sw.includes("isSensitive")||!sw.includes("SKIP_WAITING"))throw new Error("Service worker cache/update policy incomplete");
const shell=fs.readFileSync("components/shell.tsx","utf8");for(const label of ["t(\"Start\")","t(\"Kunden\")","t(\"Neu\")","t(\"Zeit\")","t(\"Mehr\")"]){if(!shell.includes(label))throw new Error(`Mobile navigation item missing: ${label}`)}
const pricing=fs.readFileSync("components/marketing/pricing-carousel.tsx","utf8");if(pricing.includes("scrollIntoView"))throw new Error("Pricing carousel must not move the page vertically with scrollIntoView");
const frame=fs.readFileSync("components/marketing/marketing-frame.tsx","utf8");if(frame.includes("<main data-reveal>"))throw new Error("Marketing frame must not animate the whole page container");
const suspicious=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|css|mjs|json)$/.test(name)){const text=fs.readFileSync(p,"utf8");if(/[ÃÂ]|â€“|â€™|â€œ|â€/.test(text))suspicious.push(p)}}}
for(const root of ["app","components","lib","styles","config"]){if(fs.existsSync(root))walk(root)}
if(suspicious.length)throw new Error(`Possible encoding corruption: ${[...new Set(suspicious)].join(", ")}`);

const customerRepo=fs.readFileSync("lib/server/repositories/customers.ts","utf8");
if(customerRepo.includes("$1::text,$3"))throw new Error("Customer creation must not reuse a UUID SQL parameter as text; use a dedicated external_id parameter.");

console.log("Architecture self-check passed: CSS entrypoints, overlay system, PWA policy, mobile nav and encoding are centralized.");
