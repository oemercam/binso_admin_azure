import fs from "node:fs";
import path from "node:path";
const read=p=>fs.readFileSync(p,"utf8");
const shell=read("components/shell.tsx");
const nav=read("config/navigation.ts");
const routes=read("config/route-metadata.ts");
const shellCss=read("styles/shell.css");

for(const marker of ["navigationItems","mobileMoreNavigation","mobileQuickCreate","portalNavigation"])if(!nav.includes(marker))throw new Error(`Navigation definition missing: ${marker}`);
for(const marker of ["parentArea","navigationGroup","mobileBottomNav","requiresAuth","quickCreateContext","getWorkspaceRouteMetadata"])if(!routes.includes(marker))throw new Error(`Route metadata missing: ${marker}`);
for(const marker of ["getWorkspaceRouteMetadata(pathname)","routeMeta?.mobileBottomNav","mobile-account-overlay","accountContent","!compactViewport&&<form className=\"search global-search\"","MobileNavigationRow","openMoreNavigation","closeMoreNavigation"])if(!shell.includes(marker))throw new Error(`Shell navigation architecture missing: ${marker}`);
if(shell.includes("mobileSearchOpen")||shell.includes("mobile-search-trigger"))throw new Error("Mobile header still owns global search.");
if(!shellCss.includes(".topbar{grid-template-columns:minmax(0,1fr) 44px"))throw new Error("Mobile header is not the canonical logo/avatar two-column shell.");
if(/\.topbar[^\n]*(backdrop-filter|linear-gradient|radial-gradient|blur\()/.test(shellCss))throw new Error("Mobile/PWA topbar contains a forbidden visual effect.");

const roots=["app/(workspace)","components"];
const source=[];
function walk(dir){if(!fs.existsSync(dir))return;for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(tsx|ts)$/.test(name))source.push(p)}}
for(const root of roots)walk(root);
for(const file of source){const text=read(file);if(/PageBackButton|page-back-button|Zurück zu [A-ZÄÖÜ]|Zur Übersicht|Back to /.test(text))throw new Error(`Forbidden content back navigation in ${file}`);if(/className="eyebrow">\s*(Binso One|BINSO ONE)\s*</.test(text))throw new Error(`Redundant Binso One overline in ${file}`)}
if(fs.existsSync("components/navigation/page-back-button.tsx"))throw new Error("Obsolete page-back-button component still exists.");

const moreBlock=nav.slice(nav.indexOf("export const mobileMoreNavigation"),nav.indexOf("export const mobileQuickCreate"));
for(const category of ["Verkauf","Projekte","Einkauf","Finanzen","Unternehmen"])if(!moreBlock.includes(`label:"${category}"`))throw new Error(`Mobile More category missing: ${category}`);
if(shell.includes('headerLeading={<BrandLogo/>}')||shell.includes("animatedClose"))throw new Error("Legacy branded/full-screen More header remains.");

console.log("Navigation architecture self-check passed: route metadata, shared route definitions, bottom-sheet More/Quick Create separation, logo+avatar mobile header, shared account actions, active navigation and zero workspace content-back controls are guarded.");
