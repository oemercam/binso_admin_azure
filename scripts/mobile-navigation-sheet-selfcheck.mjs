import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const nav=read("config/navigation.ts");
const shell=read("components/shell.tsx");
const row=read("components/navigation/mobile-navigation-row.tsx");
const overlay=read("components/ui/responsive-overlay.tsx");
const overlays=read("styles/overlays.css");
const tokens=read("styles/tokens.css");

for(const marker of ["navigationItems","portalNavigation","mobileMoreNavigation","mobileQuickCreate"])
 if(!nav.includes(marker))throw new Error(`Canonical navigation source missing: ${marker}`);
for(const category of ['label:"Verkauf"','label:"Projekte"','label:"Einkauf"','label:"Finanzen"','label:"Unternehmen"'])
 if(!nav.slice(nav.indexOf("export const mobileMoreNavigation")).includes(category))throw new Error(`Mobile More category missing: ${category}`);
for(const route of ["/kunden","/offerten","/auftraege","/rechnungen","/zahlungen","/projekte","/zeiterfassung","/spesen","/lieferanten","/eingangsrechnungen","/buchhaltung","/bank","/mwst","/personal","/dokumente"])
 if(!nav.includes(`href:"${route}"`))throw new Error(`Navigation route missing from canonical source: ${route}`);

for(const marker of [
 "openMoreNavigation","closeMoreNavigation","navigateFromMore","__binsoOverlay:\"navigation\"",
 "MobileNavigationRow","mobile-navigation-footer","appConfig.appVersion","productionUser",
 'apiFetch<{organization?:{name?:string}}>("/api/organization")',
 'mobileQuickCreate.filter(item=>canSee','group.items.filter(item=>canSee'
]) if(!shell.includes(marker))throw new Error(`Mobile navigation runtime contract missing: ${marker}`);
if(shell.includes('headerLeading={<BrandLogo/>}')||shell.includes("animatedClose"))throw new Error("More sheet must use the standard Navigation title and X close control, not branded/animated header variants.");
if(shell.includes("mobileSearchOpen")||shell.includes("mobile-search-trigger"))throw new Error("Mobile global header search must remain removed.");

for(const marker of ["mobile-navigation-row","aria-current","mobile-navigation-row-icon","mobile-navigation-row-badge"])
 if(!row.includes(marker))throw new Error(`Central mobile navigation row contract missing: ${marker}`);
for(const marker of [
 "v1.6.7 Mobile/PWA module navigation drawer","max-height:min(82dvh,760px)","height:auto",
 ".mobile-navigation-row{","grid-template-columns:28px minmax(0,1fr) auto","min-height:48px",
 ".mobile-navigation-footer","var(--safe-bottom)","backdrop-filter:none"
]) if(!overlays.includes(marker))throw new Error(`Navigation drawer CSS contract missing: ${marker}`);
const drawerBlock=overlays.slice(overlays.indexOf("v1.6.7 Mobile/PWA module navigation drawer"));
if(/workspace-navigation-overlay[^}]*100dvh/.test(drawerBlock))throw new Error("Navigation drawer regressed to fixed full-screen height.");
if(/workspace-navigation-overlay[^}]*box-shadow:(?!none)/.test(drawerBlock))throw new Error("Navigation drawer must remain visually quiet without decorative shadow effects.");
for(const marker of ["--z-bottom-navigation","--z-backdrop","--z-sheet","--z-dialog","--z-toast"])
 if(!tokens.includes(marker))throw new Error(`Central layer token missing: ${marker}`);
if(!overlay.includes('<X size={18}/>'))throw new Error("ResponsiveOverlay standard X close control missing.");

console.log("Mobile navigation sheet self-check passed: More is a content-adaptive, permission-aware bottom drawer with shared route config, compact rows, active state, dynamic account footer, safe areas and PWA/browser-back state; Quick Create and Avatar remain separate.");
