import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const i18n=read("lib/i18n.ts");
const provider=read("components/locale-provider.tsx");
const responsive=read("styles/responsive-central.css");
const overlays=read("styles/overlays.css");
const consent=read("components/privacy/cookie-consent.tsx");

if(!i18n.includes("navigator.languages")||!i18n.includes("getBrowserLocale"))throw new Error("Locale must fall back to the browser/device language when no user preference is stored.");
if(!i18n.includes("sourceText")||!provider.includes("sourceText"))throw new Error("Locale switching must canonicalize translated DOM text to prevent mixed-language content.");
if(!responsive.includes('font-size:16px!important'))throw new Error("Mobile form controls must render at 16px to prevent iOS focus zoom.");
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
}
for(const key of tKeys){
 const encoded=JSON.stringify(key);
 const count=i18n.split(encoded).length-1;
 if(count<4)throw new Error(`Translation coverage incomplete for t() key: ${key}`);
}

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
 const count=i18n.split(encoded).length-1;
 if(count<4)throw new Error(`Public page translation coverage incomplete: ${key}`);
}
console.log(`I18N/mobile self-check passed: browser locale detection, ${tKeys.size} t() keys, public legal copy, compact consent and iOS input sizing are covered.`);
