import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const css=read("styles/mobile-pwa.css"), shell=read("components/shell.tsx"), record=read("components/mobile/mobile-list-record.tsx"), doc=read("components/business-document-editor.tsx");
const checks=[
 [css.includes("--background:#fff")&&css.includes("--background:#000"),"white/black mobile theme"],
 [css.includes(".mobile-nav{")&&css.includes("border-radius:999px"),"floating pill navigation"],
 [shell.includes("MobileQuickCreate")&&shell.includes("MobileAccountPanel")&&!shell.includes("MobileNavigationPanel"),"app-first quick-create/profile overlays without competing More panel"],
 [shell.includes('<span>{t("Profil")}</span>')&&!shell.includes('<span>{t("Mehr")}</span>'),"profile in floating pill"],
 [css.includes('.topbar{display:none'),"no authenticated mobile topbar"],
 [record.includes("normalized===normalizedTitle"),"duplicate subtitle guard"],
 [doc.includes("mobileStepCount=4"),"guided document form"],
 [css.includes(".toast-host{top:"),"top mobile toasts"],
 [css.includes(".active-time-tracker{top:"),"global running timer"]
];
const failed=checks.filter(([ok])=>!ok).map(([,name])=>name);if(failed.length)throw new Error(`Mobile/PWA master audit failed: ${failed.join(", ")}`);
console.log("Final Mobile/PWA master audit self-check passed for app-first central contracts.");
