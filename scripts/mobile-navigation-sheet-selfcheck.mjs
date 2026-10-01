import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");const nav=read("config/navigation.ts"),shell=read("components/shell.tsx"),mobile=read("styles/mobile-pwa.css"),tokens=read("styles/tokens.css"),overlays=read("components/mobile/mobile-overlays.tsx");
for(const marker of ["navigationItems","portalNavigation","mobileMoreNavigation","mobileQuickCreate"])if(!nav.includes(marker))throw new Error(`Canonical navigation source missing: ${marker}`);
for(const marker of ["MobileQuickCreate","MobileAccountPanel"])if(!overlays.includes(marker))throw new Error(`Purpose-specific overlay missing: ${marker}`);
for(const marker of ['<span>{t("Start")}</span>','<span>{t("Kunden")}</span>','<span>{t("Neu")}</span>','<span>{t("Zeit")}</span>','<span>{t("Profil")}</span>'])if(!shell.includes(marker))throw new Error(`Floating pill item missing: ${marker}`);
if(shell.includes('t("Mehr")')||shell.includes("openMoreNavigation"))throw new Error("Legacy More navigation remains in shell.");
for(const marker of [".mobile-nav{left:max(12px",":has(.mobile-account-overlay){align-items:end",".mobile-quick-create-overlay{width:100%;height:auto","var(--safe-bottom)"])if(!mobile.includes(marker))throw new Error(`App-first navigation CSS missing: ${marker}`);
for(const marker of ["--z-bottom-navigation","--z-backdrop","--z-sheet","--z-dialog","--z-toast"])if(!tokens.includes(marker))throw new Error(`Central layer token missing: ${marker}`);
console.log("Mobile navigation self-check passed: Start/Kunden/Neu/Zeit/Profil floating pill, Quick Create and Profile bottom sheets are guarded.");
