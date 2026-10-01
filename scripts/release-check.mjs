import fs from "node:fs";
import path from "node:path";

const required=[
  "RELEASE-NOTES-v1.6.9.md","MOBILE-PWA-MASTER-AUDIT-v1.6.9.md",
  "NAVIGATION-INVENTORY-v1.6.9.md","MOBILE-PWA-VISUAL-QA-v1.6.9.md",
  "app/layout.tsx","app/robots.ts","app/sitemap.ts","public/manifest.webmanifest","public/manifest-site.webmanifest","public/manifest-portal.webmanifest","public/manifest-operator.webmanifest","public/favicon.ico",
  "app/portal/page.tsx","app/portal/layout.tsx","app/operator/layout.tsx","app/api/auth/demo/route.ts",
  "components/theme-provider.tsx","components/account-preference-sync.tsx","lib/client/use-session-json-state.ts","components/support/support-new.tsx","components/mobile/mobile-list-record.tsx","components/mobile/mobile-overlays.tsx",
  "lib/document-number.ts","lib/server/provisioning.ts","lib/server/session.ts",
  "components/security/account-security.tsx","components/notifications/notification-center.tsx",
  "app/api/health/route.ts","app/api/search/route.ts","app/api/files/route.ts","app/api/webhooks/stripe/route.ts",
  "database/migrations/0017_v150_code_schema_alignment.sql","database/migrations/0018_v151_organization_profile_alignment.sql","database/migrations/0019_v163_productivity_ux.sql",
  "database/archive/simplified-v1.4/001_initial.sql","database/archive/simplified-v1.4/009_platform_foundation.sql",
  "lib/i18n-dynamic.ts","styles/tokens.css","styles/app.css","styles/responsive-central.css","styles/overlays.css","styles/shell.css","styles/primitives.css","styles/mobile-pwa.css","hooks/use-overlay-lock.ts",
  "config/domain.ts","config/accounting.ts","config/storage-keys.ts","config/ui.ts","config/limits.ts","config/entity-forms.ts","config/mobile-ux.ts","config/navigation.ts","config/route-metadata.ts",
  "lib/documents/calculations.ts","lib/documents/defaults.ts","scripts/architecture-hardcoding-selfcheck.mjs",
  "lib/demo/pilot-fixtures.ts","config/app.ts","components/ui/responsive-overlay.tsx","components/navigation/mobile-navigation-row.tsx","components/workspace-runtime.tsx","lib/i18n-app.ts",
  "scripts/rendering-selfcheck.mjs","scripts/ui-standards-selfcheck.mjs","scripts/runtime-boundary-selfcheck.mjs","scripts/trial-demo-selfcheck.mjs","scripts/mobile-portal-visual-selfcheck.mjs",
  "scripts/productivity-ux-selfcheck.mjs","scripts/mobile-pwa-standard-selfcheck.mjs","scripts/mobile-pwa-full-audit-selfcheck.mjs","scripts/navigation-architecture-selfcheck.mjs","scripts/mobile-navigation-sheet-selfcheck.mjs","scripts/mobile-pwa-master-audit-selfcheck.mjs","scripts/mobile-pwa-final-contract-selfcheck.mjs","scripts/mobile-pwa-route-matrix-selfcheck.mjs","scripts/mobile-pwa-i18n-hardcode-selfcheck.mjs","scripts/document-preview-selfcheck.mjs","scripts/customer-portal-header-activity-selfcheck.mjs","scripts/portal-ux-workflow-selfcheck.mjs","scripts/search-effect-selfcheck.mjs","scripts/mobile-theme-i18n-selfcheck.mjs","scripts/i18n-completeness-selfcheck.mjs","scripts/ui-interaction-contract-selfcheck.mjs","scripts/check-db.mjs","scripts/migrate.mjs","infra/main.bicep",".github/workflows/azure-webapp.yml"
];
const missing=required.filter(p=>!fs.existsSync(p));
if(missing.length)throw new Error(`Release files missing: ${missing.join(", ")}`);

const obsoleteCss=["styles/foundation.css","styles/legacy.css","styles/design-system.css","styles/responsive.css","styles/v1.3.1.css","styles/v1.3.2.css","styles/v1.3.3.css"];
const cssLeftovers=obsoleteCss.filter(p=>fs.existsSync(p));
if(cssLeftovers.length)throw new Error(`Obsolete CSS layers still present: ${cssLeftovers.join(", ")}`);

const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
if(pkg.version!=="1.6.9")throw new Error(`Expected package version 1.6.9, got ${pkg.version}`);

for(const name of ["manifest-site.webmanifest","manifest-portal.webmanifest","manifest-operator.webmanifest"]){
 const manifest=JSON.parse(fs.readFileSync(path.join("public",name),"utf8"));
 for(const size of ["192x192","512x512"]){if(!manifest.icons?.some(x=>x.sizes===size))throw new Error(`${name}: PWA icon ${size} missing`)}
 if(!manifest.icons?.some(x=>String(x.purpose||"").includes("maskable")))throw new Error(`${name}: maskable PWA icon missing`);
}

// Production uses the canonical binso_platform lineage 0001..0016. Only forward
// alignment migrations may live in the active folder. The retired simplified
// 001..009 series is archived and must never be auto-applied to production.
const activeMigrations=fs.readdirSync("database/migrations").filter(x=>x.endsWith(".sql")).sort();
if(activeMigrations.join("|")!=="0017_v150_code_schema_alignment.sql|0018_v151_organization_profile_alignment.sql|0019_v163_productivity_ux.sql"){
 throw new Error(`Active migration set must contain only the forward alignment migrations 0017, 0018 and 0019, got: ${activeMigrations.join(", ")}`);
}
const retired=new Set(["001_initial.sql","002_permissions_operator.sql","003_pilot_support_legal.sql","004_support_diagnostics.sql","005_production_readiness.sql","006_organization_settings.sql","007_support_attachments.sql","008_locale_turkish.sql","009_platform_foundation.sql"]);
for(const file of activeMigrations){if(retired.has(file))throw new Error(`Retired divergent migration is active: ${file}`)}
const migrate=fs.readFileSync("scripts/migrate.mjs","utf8");
for(const marker of ["0016_self_service_signup.sql","Canonical database baseline","schema_migrations","checksum"]){if(!migrate.includes(marker))throw new Error(`Migration lineage guard missing: ${marker}`)}
const dbCheck=fs.readFileSync("scripts/check-db.mjs","utf8");
for(const marker of ["0016_self_service_signup.sql","0017_v150_code_schema_alignment.sql","0018_v151_organization_profile_alignment.sql","0019_v163_productivity_ux.sql","active_time_trackers","company_profile","app_users","auth_sessions","organization_memberships"]){if(!dbCheck.includes(marker))throw new Error(`DB alignment check missing: ${marker}`)}

const i18n=fs.readFileSync("lib/i18n.ts","utf8");
for(const locale of ['"de"','"en"','"fr"','"it"','"tr"'])if(!i18n.includes(locale))throw new Error(`Locale ${locale} missing`);

const tokens=fs.readFileSync("styles/tokens.css","utf8");
const responsive=fs.readFileSync("styles/responsive-central.css","utf8");
const overlays=fs.readFileSync("styles/overlays.css","utf8");
const shellCss=fs.readFileSync("styles/shell.css","utf8");
const primitives=fs.readFileSync("styles/primitives.css","utf8");
const mobileCss=fs.readFileSync("styles/mobile-pwa.css","utf8");
for(const marker of ["--safe-top","--surface-0","--z-overlay","--page-gutter-mobile"]){if(!tokens.includes(marker))throw new Error(`Token baseline missing ${marker}`)}
for(const marker of [".ui-button",".ui-page-header",".pwa-update-notice"]){if(!primitives.includes(marker))throw new Error(`Primitive CSS baseline missing ${marker}`)}
for(const marker of ["pricing-carousel","onboarding-actions"]){if(!responsive.includes(marker))throw new Error(`Responsive baseline missing ${marker}`)}
for(const marker of ["marketing-menu-button","marketing-mobile-menu","marketing-footer",".topbar",".mobile-nav"]){if(!shellCss.includes(marker))throw new Error(`Shell baseline missing ${marker}`)}
for(const marker of [".ui-overlay-backdrop",".ui-overlay-body",".ui-overlay-actions","@media print"]){if(!overlays.includes(marker))throw new Error(`Overlay baseline missing ${marker}`)}
for(const marker of ["--background:#fff","--background:#000",".mobile-nav{",".workspace-navigation-overlay{",".mobile-account-overlay{",".document-mobile-step"]){if(!mobileCss.includes(marker))throw new Error(`Mobile/PWA v1.6.9 baseline missing ${marker}`)}

// Runtime SQL must not regress to the retired parallel schema.
const retiredRuntimeTables=["users","sessions","records","support_tickets","stored_files","feedback_entries","feature_flags","announcements","platform_users","platform_sessions","platform_audit_logs","audit_logs","webhook_events","idempotency_keys"];
const runtimeFiles=[];
function collectRuntime(dir){if(!fs.existsSync(dir))return;for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())collectRuntime(p);else if(/\.(ts|tsx)$/.test(name))runtimeFiles.push(p)}}
collectRuntime("app/api");collectRuntime("lib/server");
for(const file of runtimeFiles){
 const text=fs.readFileSync(file,"utf8");
 for(const table of retiredRuntimeTables){
  const re=new RegExp(`\\b(?:from|join|insert\\s+into|update|delete\\s+from)\\s+${table}\\b`,"i");
  if(re.test(text))throw new Error(`Retired runtime table ${table} referenced in ${file}`);
 }
}

const noSecrets=["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","APP_ENCRYPTION_KEY","OPERATOR_BOOTSTRAP_PASSWORD"];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|mjs|json|yml|yaml|bicep)$/.test(name))files.push(p)}}
for(const root of ["app","components","lib","scripts","database","infra",".github"]){if(fs.existsSync(root))walk(root)}
for(const file of files){const text=fs.readFileSync(file,"utf8");for(const key of noSecrets){const m=text.match(new RegExp(`${key}\\s*[=:]\\s*["']([^"']+)["']`));if(m&&m[1]&&!m[1].includes("process.env")&&!m[1].includes("${"))throw new Error(`Potential hard-coded secret ${key} in ${file}`)}}

console.log(`Release self-check passed for Binso One v${pkg.version} (${required.length} required files, ${activeMigrations.length} active forward migration).`);
