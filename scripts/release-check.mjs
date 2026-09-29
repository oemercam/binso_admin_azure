import fs from "node:fs";
import path from "node:path";

const required=[
  "app/layout.tsx","app/robots.ts","app/sitemap.ts","public/manifest.webmanifest","public/favicon.ico",
  "components/theme-provider.tsx","components/app-boot-loader.tsx","components/support/support-new.tsx",
  "components/security/account-security.tsx","components/notifications/notification-center.tsx",
  "app/api/health/route.ts","app/api/search/route.ts","app/api/files/route.ts","app/api/webhooks/stripe/route.ts",
  "database/migrations/006_organization_settings.sql","infra/main.bicep",".github/workflows/azure-webapp.yml","QA-REPORT-v1.2.0.md"
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length)throw new Error(`Release files missing: ${missing.join(", ")}`);

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="1.2.0")throw new Error(`Expected package version 1.2.0, got ${pkg.version}`);

const manifest=JSON.parse(fs.readFileSync("public/manifest.webmanifest","utf8"));
for(const size of ["192x192","512x512"]){if(!manifest.icons?.some(x=>x.sizes===size))throw new Error(`PWA icon ${size} missing`)}
if(!manifest.icons?.some(x=>String(x.purpose||"").includes("maskable")))throw new Error("Maskable PWA icon missing");

const migrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();
for(let i=0;i<migrations.length;i++){const expected=String(i+1).padStart(3,"0")+"_";if(!migrations[i].startsWith(expected))throw new Error(`Migration sequence gap at ${migrations[i]}`)}

const noSecrets=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","APP_ENCRYPTION_KEY","OPERATOR_BOOTSTRAP_PASSWORD"];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|mjs|json|yml|yaml|bicep)$/.test(name))files.push(p)}}
for(const root of ["app","components","lib","scripts","database","infra",".github"]){if(fs.existsSync(root))walk(root)}
for(const file of files){const text=fs.readFileSync(file,"utf8");for(const key of noSecrets){const m=text.match(new RegExp(`${key}\\s*[=:]\\s*["']([^"']+)["']`));if(m&&m[1]&&!m[1].includes("process.env")&&!m[1].includes("${"))throw new Error(`Potential hard-coded secret ${key} in ${file}`)}}

console.log(`Release self-check passed (${required.length} required files, ${migrations.length} migrations, ${manifest.icons.length} PWA icons).`);
