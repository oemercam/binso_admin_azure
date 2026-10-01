import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const provider=read("components/locale-provider.tsx");
const primitives=read("styles/primitives.css");
const tokens=read("styles/tokens.css");
const globals=read("app/globals.css");
const responsive=read("styles/responsive-central.css");
const shell=read("styles/shell.css");
const overlays=read("styles/overlays.css");
const overlayComponent=read("components/ui/responsive-overlay.tsx");
const mobile=read("styles/mobile-pwa.css");

if(/MutationObserver|createTreeWalker|translateNode|document\.body.*translate/.test(provider))throw new Error("DOM mutation translation is forbidden. Use useLocale()/t() in React components.");
if(!read("lib/locale-format.ts").includes("localeTags"))throw new Error("Locale-aware date/number formatter module is required.");
if(!overlayComponent.includes('useLocale')||!overlayComponent.includes('aria-label={t("Schliessen")}'))throw new Error("Overlay accessibility labels must be localized.");
if(!globals.trim().endsWith('@import "../styles/mobile-pwa.css";'))throw new Error("Canonical Mobile/PWA stylesheet must load last.");
if(!globals.includes('@import "../styles/primitives.css";'))throw new Error("Canonical primitives stylesheet is missing.");
if(!tokens.includes("--touch-target:44px")||!tokens.includes("--control-height:42px"))throw new Error("Canonical touch/control tokens are missing.");
if(!primitives.includes("font-size:16px"))throw new Error("Mobile inputs must keep the iOS-safe 16px font size.");
for(const [name,css] of Object.entries({responsive,shell,overlays,primitives,mobile})){
 if(css.includes("!important"))throw new Error(`${name} reintroduced !important; central layers must win by architecture, not specificity hacks.`);
}
const allCss=[read("styles/app.css"),responsive,shell,overlays,primitives,mobile].join("\n");
const allowed=new Set([430,760,900,1024,1100,1280]);
for(const media of allCss.matchAll(/@media\s*([^\{]+)\{/g)){
 for(const match of media[1].matchAll(/(?:max|min)-width\s*:\s*(\d+)px/g)){
  const px=Number(match[1]);
  if(!allowed.has(px)&&!allowed.has(px-1)&&!allowed.has(px+1))throw new Error(`Non-standard responsive breakpoint detected: ${px}px`);
 }
}
for(const [name,css] of Object.entries({responsive,shell,overlays,primitives,mobile})){
 if(/z-index\s*:\s*\d+/.test(css))throw new Error(`${name} contains a hard-coded z-index. Use z-index tokens.`);
}
const importantCount=(allCss.match(/!important/g)||[]).length;
if(importantCount!==0)throw new Error(`CSS must not use !important; found ${importantCount}. Fix ownership/cascade instead.`);
console.log(`UI standards self-check passed: React i18n, locale formatters, canonical breakpoints, tokenized layers, mobile controls and CSS specificity policy are enforced. !important count: ${importantCount}.`);
