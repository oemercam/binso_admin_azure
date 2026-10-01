import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const css=read("styles/mobile-pwa.css"), shell=read("components/shell.tsx"), modulePage=read("components/module-page.tsx"), sessionState=read("lib/client/use-session-json-state.ts"), overlays=read("components/mobile/mobile-overlays.tsx"), records=read("components/mobile/mobile-list-record.tsx"), forms=read("components/ui/form-controls.tsx"), doc=read("components/business-document-editor.tsx"), detail=read("components/detail-page.tsx"), toast=read("components/toast-host.tsx"), timer=read("components/time-tracking/active-time-tracker-host.tsx"), globals=read("app/globals.css");
const checks=[
 [globals.trim().endsWith('@import "../styles/mobile-pwa.css";'),"canonical Mobile/PWA stylesheet loaded last"],
 [css.includes('--mockup-bg:#fff')&&css.includes('--mockup-bg:#090a0c'),"approved light/dark mobile canvases"],
 [css.includes('width:min(calc(100vw - 22px),414px)')&&css.includes('border-radius:17px')&&css.includes('color:var(--mockup-blue)'),"approved floating bottom navigation"],
 [shell.includes('<span>{t("Profil")}</span>')&&!shell.includes('<span>{t("Mehr")}</span>'),"profile replaces More in primary pill"],
 [overlays.includes('MobileQuickCreate')&&overlays.includes('MobileAccountPanel'),"semantic task/profile overlay primitives"],
 [css.includes(':has(.mobile-account-overlay){align-items:end'),"profile bottom sheet"],
 [css.includes('.mobile-quick-create-overlay{width:100%;height:auto'),"content-driven Quick Create"],
 [css.includes('.topbar{display:none')&&!shell.includes('className="mobile-brand'),"no permanent authenticated mobile header/logo"],
 [shell.includes('!compactViewport&&<form className="search global-search"'),"desktop-only global search"],
 [modulePage.includes("useSessionJsonState<ModuleListState>")&&!modulePage.includes("listStateReady")&&sessionState.includes("useSyncExternalStore")&&!sessionState.includes("fallbackRef")&&!sessionState.includes("useRef("),"hydration-safe persisted list state"],
 [records.includes('normalized===normalizedTitle')&&records.includes('seen.has(normalized)'),"central duplicate subtitle guard"],
 [forms.includes('DateInput')&&forms.includes('TimeInput')&&forms.includes('CurrencyInput')&&forms.includes('FormSection')&&forms.includes('FormActions'),"canonical form primitives"],
 [doc.includes('mobileStepCount=4')&&doc.includes('document-mobile-flow-actions')&&doc.includes('document-review-step'),"guided quote/invoice mobile flow"],
 [detail.includes('record-edit-overlay')&&!detail.includes('lokal bearbeitet')&&!detail.includes('lokal gespeichert'),"progressive record edit and no technical local labels"],
 [css.includes('body:has(.active-time-tracker) .toast-host'),"toast/timer collision guard"],
 [toast.includes('tone==="danger"?8000'),"tone-aware toast lifetime"],
 [timer.includes('if(!tracker)return null'),"timer only exists when active"],
 [css.includes('env(safe-area-inset')||read('styles/tokens.css').includes('env(safe-area-inset'),"safe-area tokens"],
 [css.includes('--mockup-blue:#0057ff')&&css.includes('--mockup-navy:#07194d')&&css.includes('--mockup-line:#e9edf2'),"approved mockup palette tokens"],
 [!css.includes('calc(-1')&&!css.match(/margin(?:-[a-z]+)?:\s*-\d/),"no negative-margin repair in canonical mobile layer"]
];
const failed=checks.filter(([ok])=>!ok).map(([,name])=>name);if(failed.length)throw new Error(`Final Mobile/PWA contract failed: ${failed.join(", ")}`);
console.log(`Final Mobile/PWA contract self-check passed: ${checks.length} centralized architecture rules.`);
