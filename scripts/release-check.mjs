import fs from "node:fs";
import path from "node:path";

const required=[
  "app/layout.tsx","app/robots.ts","app/sitemap.ts","public/manifest.webmanifest","public/manifest-site.webmanifest","public/manifest-portal.webmanifest","public/manifest-operator.webmanifest","public/favicon.ico",
  "app/portal/page.tsx","app/portal/layout.tsx","app/operator/layout.tsx","app/api/auth/demo/route.ts",
  "components/theme-provider.tsx","components/app-boot-loader.tsx","components/support/support-new.tsx",
  "components/security/account-security.tsx","components/notifications/notification-center.tsx",
  "app/api/health/route.ts","app/api/search/route.ts","app/api/files/route.ts","app/api/webhooks/stripe/route.ts",
  "database/migrations/008_locale_turkish.sql","database/migrations/009_platform_foundation.sql","styles/foundation.css","config/app.ts","components/ui/responsive-overlay.tsx","infra/main.bicep",".github/workflows/azure-webapp.yml"
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length)throw new Error(`Release files missing: ${missing.join(", ")}`);

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="1.3.1")throw new Error(`Expected package version 1.3.1, got ${pkg.version}`);

for(const name of ["manifest-site.webmanifest","manifest-portal.webmanifest","manifest-operator.webmanifest"]){
 const manifest=JSON.parse(fs.readFileSync(path.join("public",name),"utf8"));
 for(const size of ["192x192","512x512"]){if(!manifest.icons?.some(x=>x.sizes===size))throw new Error(`${name}: PWA icon ${size} missing`)}
 if(!manifest.icons?.some(x=>String(x.purpose||"").includes("maskable")))throw new Error(`${name}: maskable PWA icon missing`);
}

const migrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();
for(let i=0;i<migrations.length;i++){const expected=String(i+1).padStart(3,"0")+"_";if(!migrations[i].startsWith(expected))throw new Error(`Migration sequence gap at ${migrations[i]}`)}

const i18n=fs.readFileSync("lib/i18n.ts","utf8");
for(const locale of ['"de"','"en"','"fr"','"it"','"tr"'])if(!i18n.includes(locale))throw new Error(`Locale ${locale} missing`);
const css=fs.readFileSync("styles/design-system.css","utf8")+"\n"+fs.readFileSync("styles/v1.3.1.css","utf8");
for(const marker of ["Binso One v1.3.1","marketing-menu-button","ui-toggle-thumb","white-space:nowrap"]){if(!css.includes(marker))throw new Error(`UI baseline missing ${marker}`)}

const noSecrets=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","APP_ENCRYPTION_KEY","OPERATOR_BOOTSTRAP_PASSWORD"];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|mjs|json|yml|yaml|bicep)$/.test(name))files.push(p)}}
for(const root of ["app","components","lib","scripts","database","infra",".github"]){if(fs.existsSync(root))walk(root)}
for(const file of files){const text=fs.readFileSync(file,"utf8");for(const key of noSecrets){const m=text.match(new RegExp(`${key}\\s*[=:]\\s*["']([^"']+)["']`));if(m&&m[1]&&!m[1].includes("process.env")&&!m[1].includes("${"))throw new Error(`Potential hard-coded secret ${key} in ${file}`)}}

console.log(`Release self-check passed for Binso One v${pkg.version} (${required.length} required files, ${migrations.length} migrations).`);
