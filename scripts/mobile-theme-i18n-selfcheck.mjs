import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const frame=read("components/marketing/marketing-frame.tsx");
const shell=read("styles/shell.css");
const responsive=read("styles/responsive-central.css");
const primitives=read("styles/primitives.css");
const auth=read("components/auth-pages.tsx");
const contact=read("components/marketing/contact-marketing-page.tsx");
const i18n=read("lib/i18n.ts");
if(frame.includes('<Link href="/sicherheit">{t("Sicherheit")}</Link>'))throw new Error("Security must not be a primary marketing navigation item");
for(const marker of ["body.marketing-menu-open .marketing-header","marketing-menu-button.is-open"]){if(!shell.includes(marker))throw new Error(`Mobile menu header/animation guard missing: ${marker}`)}
if(!responsive.includes(".page{padding-top:10px}"))throw new Error("Compact mobile content start missing");
for(const marker of ["interactive surface contract","background:var(--surface);color:var(--foreground)","max-width:100%"]){if(!primitives.includes(marker))throw new Error(`Theme/control guard missing: ${marker}`)}
for(const marker of ["demo-loading-screen","Demo wird geladen …","Die vorbereitete Demo wird geöffnet."]){if(!auth.includes(marker)&&!read("styles/app.css").includes(marker))throw new Error(`Demo hand-off guard missing: ${marker}`)}
for(const marker of ["Allgemeine Anfragen","Support für Kunden","contact-company-strip"]){if(!contact.includes(marker))throw new Error(`Contact content missing: ${marker}`)}
for(const localeMarker of ["Object.assign(en,{","Object.assign(fr,{","Object.assign(it,{","Object.assign(trDict,{"]){if(!i18n.includes(localeMarker))throw new Error(`Locale dictionary missing: ${localeMarker}`)}
for(const copy of ["Kunden, Offerten und Aufträge ohne doppelte Erfassung.","Leistungen, Aufgaben, Budgets und Termine zentral steuern.","Wie können wir helfen?","Demo wird geladen …"]){if(i18n.split(copy).length-1<4)throw new Error(`Translation coverage incomplete: ${copy}`)}
console.log("Mobile/theme/i18n self-check passed: menu header, compact spacing, contact, demo hand-off, theme-safe controls and multilingual feature copy are guarded.");
