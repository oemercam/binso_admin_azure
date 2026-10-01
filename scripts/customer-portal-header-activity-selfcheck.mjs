import fs from "node:fs";
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const shell=read("components/shell.tsx");
const detail=read("components/detail-page.tsx");
const shellCss=read("styles/shell.css");
const appCss=read("styles/app.css");
const i18n=read("lib/i18n.ts");
if(!shell.includes('className="mobile-brand mobile-brand-image"')||!shell.includes('<BrandLogo/>'))throw new Error("Mobile customer portal header must render the Binso wordmark.");
if(shell.includes('className="mobile-brand mobile-brand-image" aria-label={t("Binso One Dashboard")}><BrandLogo compact/>'))throw new Error("Mobile header must not use the dominant compact square brand icon.");
if(!shellCss.includes('.mobile-brand-image .binso-brand-image{width:auto;height:19px;max-width:70px'))throw new Error("Mobile Binso header logo must stay compact and aligned with header icons.");
if(!detail.includes('className="activity-empty-state"'))throw new Error("Missing compact empty activity state.");
if(detail.includes('t("Datensatz geöffnet und geprüft.")')&&detail.includes('t("Stammdaten vorhanden.")')&&detail.includes('t("Vorgang bereit.")'))throw new Error("Fake three-row activity fallback must not be rendered.");
if(!appCss.includes('.activity-empty-state')||!appCss.includes('-webkit-line-clamp:1'))throw new Error("Activity empty state must remain compact to two visible text rows.");
for(const key of ["Keine Aktivität vorhanden","Neue Aktivitäten erscheinen hier automatisch."]){if(!i18n.includes(key))throw new Error(`Missing i18n key: ${key}`)}
console.log("Customer portal header/activity self-check passed: compact Binso wordmark and two-line empty activity state are guarded.");
