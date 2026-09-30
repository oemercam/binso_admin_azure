import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const i18n=read("lib/i18n.ts");
const appI18n=read("lib/i18n-app.ts");
const dynamicI18n=read("lib/i18n-dynamic.ts");
const translationSource=`${i18n}\n${appI18n}\n${dynamicI18n}`;
const provider=read("components/locale-provider.tsx");
const overlays=read("styles/overlays.css");
const consent=read("components/privacy/cookie-consent.tsx");

if(!i18n.includes("navigator.languages")||!i18n.includes("getBrowserLocale"))throw new Error("Locale must fall back to the browser/device language when no user preference is stored.");
if(/MutationObserver|createTreeWalker|translateNode/.test(provider))throw new Error("LocaleProvider must not mutate rendered DOM text. Components must translate through React/i18n.");
if(!provider.includes("useSyncExternalStore")||!provider.includes("getServerLocale"))throw new Error("LocaleProvider must use a hydration-safe external-store pattern for persisted/browser locale.");
const primitives=read("styles/primitives.css");
if(!primitives.includes("font-size:16px"))throw new Error("Mobile form controls must render at 16px to prevent iOS focus zoom.");
if(/\.auth-form input,\.auth-form select\{[^}]*font-size:(?:1[0-5]|\d)px/.test(read("styles/app.css")))throw new Error("Auth inputs reintroduced a sub-16px mobile font size.");
if(!consent.includes('className="consent-overlay"')||!consent.includes('useLocale'))throw new Error("Cookie consent must use the compact localized consent surface.");
if(!overlays.includes(".consent-overlay")||!overlays.includes("max-height:min(72svh,520px)"))throw new Error("Mobile cookie consent size is not centrally constrained.");

const tsx=[];
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(["node_modules",".next"].includes(entry.name))continue;
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full);
  else if(entry.name.endsWith(".tsx"))tsx.push(full);
 }
}
walk(root);
const tKeys=new Set();
for(const file of tsx){
 const source=fs.readFileSync(file,"utf8");
 for(const match of source.matchAll(/\bt\(\s*"((?:\\.|[^"\\])*)"\s*\)/g))tKeys.add(JSON.parse(`"${match[1]}"`));
 for(const match of source.matchAll(/<LocalizedText>([^<>{}]+)<\/LocalizedText>/g)){const value=match[1].replace(/\s+/g," ").trim();if(value)tKeys.add(value)}
 if(source.includes("<TranslatedMarkup")){
  for(const match of source.matchAll(/>([^<>{}][^<>{}]*)</g)){const value=match[1].replace(/\s+/g," ").trim();if(value.length>2&&!value.startsWith("www.")&&!value.startsWith("Version ")&&!value.startsWith("Stand:"))tKeys.add(value)}
 }
}
for(const key of tKeys){
 const encoded=JSON.stringify(key);
 const count=translationSource.split(encoded).length-1;
 if(count<4)throw new Error(`Translation coverage incomplete for t() key: ${key}`);
}


// Dynamic UI configuration is translated through t(variable). These source values
// must be audited explicitly because a static t("...") scan cannot see them.
const dynamicKeys=new Set();
const addMatches=(source,pattern)=>{for(const match of source.matchAll(pattern)){const value=match[1]?.replace(/\s+/g," ").trim();if(value)dynamicKeys.add(value)}};
const addQuotedList=(source,pattern)=>{for(const match of source.matchAll(pattern)){for(const item of match[1].matchAll(/"([^"\n]+)"/g))dynamicKeys.add(item[1])}};
const modulesSource=read("lib/modules.ts");
for(const pattern of [/\blabel:"([^"]+)"/g,/\bdescription:"([^"]+)"/g,/\bprimaryAction:"([^"]+)"/g,/\bmeta:"([^"]+)"/g])addMatches(modulesSource,pattern);
addQuotedList(modulesSource,/\bcolumns:\[([^\]]*)\]/g);
const demoModulesSource=read("lib/demo/module-seeds.ts");
for(const pattern of [/\blabel:\s*"([^"]+)"/g,/\bmeta:\s*"([^"]+)"/g])addMatches(demoModulesSource,pattern);
const entitySource=read("config/entity-forms.ts");
addMatches(entitySource,/\blabel:"([^"]+)"/g);
addQuotedList(entitySource,/\boptions:\[([^\]]*)\]/g);
const planSource=read("lib/saas-store.ts");
addMatches(planSource,/\bdescription:"([^"]+)"/g);
addQuotedList(planSource,/\bfeatures:\[([^\]]*)\]/g);
for(const file of [
 "components/status/status-client.tsx",
 "components/feedback/feedback-form.tsx",
 "components/operator/operator-support.tsx",
 "components/notifications/notification-center.tsx"
]){
 const source=read(file);
 addQuotedList(source,/\[(\s*"[^"]+"(?:\s*,\s*"[^"]+")*\s*)\]/g);
 for(const pattern of [/\blabel:"([^"]+)"/g,/\bvalue:"([^"]+)"/g])addMatches(source,pattern);
}
const dynamicExempt=new Set(["Deutsch","English","Français","Italiano","Türkçe","PWA","CVC","OK"]);
for(const key of dynamicKeys){
 if(dynamicExempt.has(key)||/^(?:CHF|[+\-]?\d|[a-z0-9_./:@-]+$)/i.test(key)||key.startsWith("/"))continue;
 const encoded=JSON.stringify(key);
 const count=translationSource.split(encoded).length-1;
 if(count<4)throw new Error(`Dynamic UI translation coverage incomplete: ${key}`);
}

// API error responses are user-visible through apiFetch and must also be localized.
const apiErrorKeys=new Set();
const walkApi=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walkApi(full);else if(entry.name.endsWith(".ts")){const source=fs.readFileSync(full,"utf8");for(const match of source.matchAll(/(?:error|message):"([^"]+)"/g))apiErrorKeys.add(match[1])}}};
walkApi(path.join(root,"app/api"));
for(const key of apiErrorKeys){const encoded=JSON.stringify(key);const count=translationSource.split(encoded).length-1;if(count<4)throw new Error(`API error translation coverage incomplete: ${key}`)}
const runtime=read("lib/client/runtime.ts");
if(!runtime.includes("translate(message,getLocale())"))throw new Error("apiFetch must localize server error messages before exposing them to the UI.");

// High-risk primitives must never bypass locale handling.
for(const file of ["components/ui/toggle-switch.tsx","components/connectivity-banner.tsx","components/marketing/marketing-menu-button.tsx","components/confirm-host.tsx"]){
 const source=read(file);
 if(!source.includes("useLocale"))throw new Error(`${file} must localize its user-visible text.`);
}
if(!read("app/(workspace)/einstellungen/page.tsx").includes("LocalizedText"))throw new Error("Workspace settings loading fallback must be localized.");

const publicPages=["agb","datenschutz","cookies","impressum","kontakt","sicherheit","status","auftragsbearbeitung","unterauftragsbearbeiter"];
const publicText=new Set();
for(const name of publicPages){
 const source=read(`app/${name}/page.tsx`);
 for(const match of source.matchAll(/>([^<>{}][^<>{}]*)</g)){
  const value=match[1].replace(/\s+/g," ").trim();
  if(value.length>2&&value!=="www.binso.ch"&&!value.startsWith("Version ")&&!value.startsWith("Stand:"))publicText.add(value);
 }
 for(const match of source.matchAll(/(?:title|lead|kicker)="([^"]+)"/g))publicText.add(match[1]);
}
for(const key of publicText){
 const encoded=JSON.stringify(key);
 const count=translationSource.split(encoded).length-1;
 if(count<4)throw new Error(`Public page translation coverage incomplete: ${key}`);
}
console.log(`I18N/mobile self-check passed: React-driven locale switching, browser locale detection, ${tKeys.size} static keys, ${dynamicKeys.size} dynamic UI keys, ${apiErrorKeys.size} API error keys, public/legal copy, compact consent and iOS input sizing are covered.`);
