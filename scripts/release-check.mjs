import fs from "node:fs";
import path from "node:path";

const required=[
  "app/layout.tsx","app/robots.ts","app/sitemap.ts","public/manifest.webmanifest","public/manifest-site.webmanifest","public/manifest-portal.webmanifest","public/manifest-operator.webmanifest","public/favicon.ico",
  "app/portal/page.tsx","app/portal/layout.tsx","app/operator/layout.tsx","app/api/auth/demo/route.ts",
  "components/theme-provider.tsx","components/support/support-new.tsx",
  "components/security/account-security.tsx","components/notifications/notification-center.tsx",
  "app/api/health/route.ts","app/api/search/route.ts","app/api/files/route.ts","app/api/webhooks/stripe/route.ts",
  "database/migrations/008_locale_turkish.sql","database/migrations/009_platform_foundation.sql",
  "styles/tokens.css","styles/app.css","styles/responsive-central.css","styles/overlays.css","styles/shell.css","hooks/use-overlay-lock.ts",
  "config/app.ts","components/ui/responsive-overlay.tsx","scripts/rendering-selfcheck.mjs","scripts/trial-demo-selfcheck.mjs","infra/main.bicep",".github/workflows/azure-webapp.yml"
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length)throw new Error(`Release files missing: ${missing.join(", ")}`);

const obsolete=["styles/foundation.css","styles/legacy.css","styles/design-system.css","styles/responsive.css","styles/v1.3.1.css","styles/v1.3.2.css","styles/v1.3.3.css"];
const leftovers=obsolete.filter(p=>fs.existsSync(p));
if(leftovers.length)throw new Error(`Obsolete CSS layers still present: ${leftovers.join(", ")}`);

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="1.4.0")throw new Error(`Expected package version 1.4.0, got ${pkg.version}`);

for(const name of ["manifest-site.webmanifest","manifest-portal.webmanifest","manifest-operator.webmanifest"]){
 const manifest=JSON.parse(fs.readFileSync(path.join("public",name),"utf8"));
 for(const size of ["192x192","512x512"]){if(!manifest.icons?.some(x=>x.sizes===size))throw new Error(`${name}: PWA icon ${size} missing`)}
 if(!manifest.icons?.some(x=>String(x.purpose||"").includes("maskable")))throw new Error(`${name}: maskable PWA icon missing`);
}

const migrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();
for(let i=0;i<migrations.length;i++){const expected=String(i+1).padStart(3,"0")+"_";if(!migrations[i].startsWith(expected))throw new Error(`Migration sequence gap at ${migrations[i]}`)}

const i18n=fs.readFileSync("lib/i18n.ts","utf8");
for(const locale of ['"de"','"en"','"fr"','"it"','"tr"'])if(!i18n.includes(locale))throw new Error(`Locale ${locale} missing`);

const tokens=fs.readFileSync("styles/tokens.css","utf8");
const appCss=fs.readFileSync("styles/app.css","utf8");
const responsive=fs.readFileSync("styles/responsive-central.css","utf8");
const overlays=fs.readFileSync("styles/overlays.css","utf8");
const shellCss=fs.readFileSync("styles/shell.css","utf8");
for(const marker of ["--safe-top","--surface-0","--z-overlay","--page-gutter-mobile"]){if(!tokens.includes(marker))throw new Error(`Token baseline missing ${marker}`)}
for(const marker of [".ui-button",".ui-page-header",".pwa-update-notice"]){if(!appCss.includes(marker))throw new Error(`Application CSS baseline missing ${marker}`)}
for(const marker of ["pricing-carousel","onboarding-actions"]){if(!responsive.includes(marker))throw new Error(`Responsive baseline missing ${marker}`)}
for(const marker of ["marketing-menu-button","marketing-mobile-menu","marketing-footer",".topbar",".mobile-nav"]){if(!shellCss.includes(marker))throw new Error(`Shell baseline missing ${marker}`)}
for(const marker of [".ui-overlay-backdrop",".ui-overlay-body",".ui-overlay-actions","@media print"]){if(!overlays.includes(marker))throw new Error(`Overlay baseline missing ${marker}`)}

const noSecrets=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","APP_ENCRYPTION_KEY","OPERATOR_BOOTSTRAP_PASSWORD"];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|mjs|json|yml|yaml|bicep)$/.test(name))files.push(p)}}
for(const root of ["app","components","lib","scripts","database","infra",".github"]){if(fs.existsSync(root))walk(root)}
for(const file of files){const text=fs.readFileSync(file,"utf8");for(const key of noSecrets){const m=text.match(new RegExp(`${key}\\s*[=:]\\s*["']([^"']+)["']`));if(m&&m[1]&&!m[1].includes("process.env")&&!m[1].includes("${"))throw new Error(`Potential hard-coded secret ${key} in ${file}`)}}

console.log(`Release self-check passed for Binso One v${pkg.version} (${required.length} required files, ${migrations.length} migrations).`);
