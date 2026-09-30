import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const sourceRoots=["app","components","lib","config","hooks"];
const files=[];
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(["node_modules",".next",".git"].includes(entry.name))continue;
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full);
  else if(/\.(ts|tsx)$/.test(entry.name))files.push(path.relative(root,full).replaceAll("\\","/"));
 }
}
for(const dir of sourceRoots)walk(path.join(root,dir));
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const fail=(message)=>{throw new Error(`Architecture/hardcoding self-check failed: ${message}`)};

// Native blocking browser dialogs are not acceptable application UI.
for(const file of files){
 const text=read(file);
 if(/\b(?:window\.)?prompt\s*\(/.test(text))fail(`native prompt() found in ${file}`);
 if(/\bwindow\.confirm\s*\(/.test(text))fail(`native window.confirm() found in ${file}`);
}

// Browser storage access has one adapter plus the intentionally pre-hydration theme bootstrap.
for(const file of files){
 if(["lib/client/browser-storage.ts","app/layout.tsx"].includes(file))continue;
 const text=read(file);
 if(/\b(?:localStorage|sessionStorage)\b/.test(text))fail(`direct browser storage access found in ${file}`);
}

// Client components must use the centralized API client instead of raw fetch().
for(const file of files.filter(x=>x.startsWith("components/")&&x.endsWith(".tsx"))){
 const text=read(file);
 if(/\bfetch\s*\(/.test(text))fail(`raw fetch() found in client component ${file}`);
}

// Application events must be owned by the typed event adapter.
for(const file of files){
 if(file==="lib/client/app-events.ts")continue;
 const text=read(file);
 if(/new\s+CustomEvent\s*\(\s*["'`]binso-/.test(text)||/dispatchEvent\s*\([^\n]*binso-/.test(text))fail(`raw Binso custom event found in ${file}`);
}

// Demo datasets must stay outside product module metadata.
const modules=read("lib/modules.ts");
if(/\b(?:rows|stats)\s*:/.test(modules))fail("lib/modules.ts contains demo rows/stats");
if(!fs.existsSync(path.join(root,"lib/demo/module-seeds.ts")))fail("demo module seeds are missing");
if(fs.existsSync(path.join(root,"lib/data.ts")))fail("obsolete lib/data.ts demo dataset still exists");

// Reusable domain values must have one owner.
const allowedDomainFiles=new Set(["config/domain.ts","config/accounting.ts","config/limits.ts","lib/demo/fixtures.ts","lib/demo/module-seeds.ts"]);
for(const file of files){
 if(allowedDomainFiles.has(file)||file.startsWith("lib/i18n"))continue;
 const text=read(file);
 if(/(?:6500 Büroaufwand|2000 Kreditoren|1020 Bank)/.test(text))fail(`accounting default hardcoded in ${file}`);
 if(/\b(?:8\.1|2\.6|3\.8)\b/.test(text))fail(`Swiss VAT rate hardcoded outside domain config/demo in ${file}`);
}


// Shared runtime limits must have one owner.
for(const file of files){
 if(file==="config/limits.ts"||file.startsWith("lib/i18n"))continue;
 const text=read(file);
 if(/10\s*\*\s*1024\s*\*\s*1024|1_500_000/.test(text))fail(`upload size limit hardcoded outside config/limits.ts in ${file}`);
 if(/Number\(b\.hours\)\|\|2/.test(text))fail(`support access duration fallback hardcoded in ${file}`);
}
if(!read("components/detail-page.tsx").includes("apiFormFetch"))fail("multipart document upload bypasses central API client");
if(!read("components/shell.tsx").includes("appConfig.searchDebounceMs"))fail("search debounce bypasses app configuration");
if(!read("lib/server/stripe.ts").includes("limitsConfig.stripeWebhookToleranceSeconds"))fail("Stripe webhook tolerance bypasses limits configuration");

// Old app control class families must not re-enter application code.
const legacyClass=/className=(?:"|`)[^"`]*(?:primary-inline|primary-button|secondary-button|operator-primary|operator-icon-button|(?:^|\s)icon-button(?:\s|$))[^"`]*(?:"|`)/;
for(const file of files.filter(x=>x.startsWith("app/")||x.startsWith("components/"))){
 const text=read(file);
 if(legacyClass.test(text))fail(`legacy control class found in ${file}`);
}

// Core architecture extraction guards.
if(!read("components/entity-form.tsx").includes("getEntityFormDefinitions"))fail("entity form schema is not centralized");
if(read("components/entity-form.tsx").includes("const map:Record"))fail("entity form still owns its schema map");
if(!read("components/business-document-editor.tsx").includes("initialDocumentPositions(!isProductionMode())"))fail("document editor does not separate demo and production initial positions");
if(!read("components/document-detail.tsx").includes("calculateDocumentTotals"))fail("document totals are not centralized");
if(!read("components/marketing/marketing-frame.tsx").includes("useOverlayLock(menuOpen)"))fail("marketing navigation bypasses central overlay lock");

// Guard component growth. Large screens should delegate domain/config logic.
for(const file of files.filter(x=>x.startsWith("components/")&&x.endsWith(".tsx"))){
 const size=Buffer.byteLength(read(file),"utf8");
 if(size>24_000)fail(`${file} exceeds 24 KB (${size} bytes); split responsibilities before adding more logic`);
}

console.log("Architecture/hardcoding self-check passed: domain constants, demo boundaries, storage/events, control classes and component-size guardrails are centralized.");
