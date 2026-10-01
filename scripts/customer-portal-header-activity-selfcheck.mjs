import fs from "node:fs";
const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const shell=read("components/shell.tsx"),detail=read("components/detail-page.tsx"),mobile=read("styles/mobile-pwa.css"),appCss=read("styles/app.css"),i18n=read("lib/i18n.ts"),brand=read("components/ui/brand-logo.tsx");
if(!brand.includes('/brand/binso-logo-black.svg')||!brand.includes('/brand/binso-logo-white.svg'))throw new Error("Original Binso wordmark assets missing.");
if(shell.includes('className="mobile-brand mobile-brand-image"'))throw new Error("Authenticated mobile shell must not render a permanent brand header.");
if(!mobile.includes('.topbar{display:none'))throw new Error("Authenticated mobile topbar is not suppressed.");
if(!detail.includes('className="activity-empty-state"'))throw new Error("Missing compact empty activity state.");
if(detail.includes('t("Datensatz geöffnet und geprüft.")')&&detail.includes('t("Stammdaten vorhanden.")')&&detail.includes('t("Vorgang bereit.")'))throw new Error("Fake three-row activity fallback must not be rendered.");
if(!appCss.includes('.activity-empty-state')||!appCss.includes('-webkit-line-clamp:1'))throw new Error("Activity empty state must remain compact to two visible text rows.");
for(const key of ["Keine Aktivität vorhanden","Neue Aktivitäten erscheinen hier automatisch."]){if(!i18n.includes(key))throw new Error(`Missing i18n key: ${key}`)}
console.log("Customer portal activity/branding self-check passed: original Binso assets remain for entry/desktop and authenticated mobile has no permanent brand header.");
