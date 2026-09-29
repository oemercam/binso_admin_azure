import fs from "node:fs";
import path from "node:path";

const required=[
 "styles/foundation.css","config/app.ts","components/ui/button.tsx","components/ui/form-controls.tsx","components/ui/responsive-overlay.tsx",
 "hooks/use-connectivity.ts","hooks/use-standalone.ts","components/connectivity-banner.tsx","components/pwa-update-notice.tsx",
 "database/migrations/009_platform_foundation.sql","app/api/notification-preferences/route.ts","lib/server/idempotency.ts"
];
const missing=required.filter(x=>!fs.existsSync(x));if(missing.length)throw new Error(`Foundation files missing: ${missing.join(", ")}`);
const css=fs.readFileSync("styles/foundation.css","utf8");
for(const token of ["--background","--surface","--foreground","--border","--space-1","--radius-sm","--text-base","--control-lg","--motion-base"]){if(!css.includes(token))throw new Error(`Design token missing: ${token}`)}
const manifests=["manifest-site.webmanifest","manifest-portal.webmanifest","manifest-operator.webmanifest"].map(x=>JSON.parse(fs.readFileSync(path.join("public",x),"utf8")));
for(const manifest of manifests){for(const key of ["name","short_name","start_url","scope","display","theme_color","background_color","icons"]){if(manifest[key]==null)throw new Error(`PWA manifest ${manifest.name} missing ${key}`)}}
const sw=fs.readFileSync("public/sw.js","utf8");if(!sw.includes("isSensitive")||!sw.includes("SKIP_WAITING"))throw new Error("Service worker cache/update policy incomplete");
const shell=fs.readFileSync("components/shell.tsx","utf8");for(const label of [">Start<",">Projekte<",">Zeit<",">Rechnungen<",">Mehr<"]){if(!shell.includes(label))throw new Error(`Mobile navigation item missing: ${label}`)}
const suspicious=[];
function walk(dir){for(const name of fs.readdirSync(dir)){if(["node_modules",".next",".git"].includes(name))continue;const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx|css|mjs|json)$/.test(name)){const text=fs.readFileSync(p,"utf8");if(/[ÃÂ]|â€“|â€™|â€œ|â€/.test(text))suspicious.push(p)}}}
for(const root of ["app","components","lib","styles","config"]){if(fs.existsSync(root))walk(root)}
if(suspicious.length)throw new Error(`Possible encoding corruption: ${[...new Set(suspicious)].join(", ")}`);
console.log("Architecture self-check passed: centralized UI foundation, PWA policy, mobile nav, connectivity and platform persistence are present.");
