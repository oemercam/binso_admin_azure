import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const css=read("styles/mobile-pwa.css");
const providers=read("components/client-providers.tsx");
const splash=read("components/mobile/mobile-splash-gate.tsx");
const onboarding=read("components/onboarding-page.tsx");
const modulePage=read("components/module-page.tsx");
const toolbar=read("components/ui/list-toolbar.tsx");
const states=read("components/mobile/mobile-app-state.tsx");
const settings=read("components/settings-page.tsx");
const timer=read("components/time-tracking/time-tracker-panel.tsx");
const activeTimer=read("components/time-tracking/active-time-tracker-host.tsx");
const checks=[
 [providers.includes("<MobileSplashGate/>")&&splash.includes("display-mode: standalone")&&css.includes(".mobile-splash{"),"standalone PWA splash"],
 [onboarding.includes("introStep")&&onboarding.includes("mobile-intro-dots")&&onboarding.includes("Los geht's")&&css.includes(".mobile-intro-card"),"three-step mobile introduction"],
 [states.includes("MobileSkeleton")&&states.includes("MobileEmptyState")&&states.includes("MobileErrorState")&&states.includes("MobileFeedback"),"central loading/empty/error/feedback primitives"],
 [modulePage.includes("MobileSkeleton")&&modulePage.includes("MobileEmptyState")&&modulePage.includes("loadError"),"module list loading/empty/error states"],
 [toolbar.includes("selectionMode")&&modulePage.includes("mobile-selection-bar")&&css.includes(".mobile-select-row"),"mobile list selection mode"],
 [toolbar.includes("setFilterOpen(true)")&&toolbar.includes("setSortOpen(true)")&&toolbar.includes('onView(view==="table"?"cards":"table")'),"direct view toggle and filter/sort sheets"],
 [settings.includes("mobile-settings-menu")&&settings.includes("mobile-settings-profile")&&css.includes(".mobile-settings-menu"),"mobile settings profile/menu"],
 [timer.includes("time-tracker-card")&&activeTimer.includes("active-time-tracker")&&css.includes(".time-tracker-main>div"),"timer idle/running/global indicator"],
 [css.includes("html[data-theme=\"dark\"]")&&css.includes("--mobile-background:#000"),"strict mobile light/dark contract"],
 [css.includes(".auth-error,.form-error-summary")&&css.includes(".toast-host{top:"),"mobile validation and top feedback placement"],
 [css.includes(".connectivity-banner,.pwa-update-notice")&&css.includes(".mobile-offline-state"),"offline and update feedback surfaces"],
 [css.includes("@media (min-width:761px)")&&css.includes(".mobile-settings-profile,.mobile-settings-menu{display:none}"),"desktop freeze for new mobile primitives"]
];
const failed=checks.filter(([ok])=>!ok).map(([,name])=>name);
if(failed.length)throw new Error(`Mobile/PWA mockup completion self-check failed: ${failed.join(", ")}`);
console.log(`Mobile/PWA mockup completion self-check passed: ${checks.length} explicit mockup contracts.`);

const exactMockupChecks=[
 [css.includes('--mockup-blue:#0057ff')&&css.includes('--mockup-navy:#07194d'),"approved blue/navy palette"],
 [css.includes('.mobile-nav-item.active{background:transparent;color:var(--mockup-blue)')&&css.includes('.mobile-nav-create-icon{width:35px'),"blue active/create bottom navigation"],
 [css.includes('.mobile-dashboard-kpi:nth-child(1){background:#eaf3ff')&&css.includes('.mobile-dashboard-kpi:nth-child(4){background:#f0edff'),"pastel dashboard KPI palette"],
 [css.includes('.ui-overlay-header::before')&&css.includes('width:34px;height:3px'),"bottom-sheet grabber"],
 [css.includes('.auth-submit{background:var(--mockup-navy)')&&css.includes('.mobile-intro-dots span.active{width:5px;background:var(--mockup-blue)'),"login and intro visual parity"],
 [css.includes('.mobile-feedback-success{background:#dff8e8')&&css.includes('.mobile-feedback-info{background:#eaf3ff'),"semantic feedback surfaces"],
 [css.includes('@media (max-width:430px)')&&css.includes('@media (max-width:760px) and (max-height:620px)'),"small-screen and short-height parity"]
];
const exactFailed=exactMockupChecks.filter(([ok])=>!ok).map(([,name])=>name);
if(exactFailed.length)throw new Error(`Mobile/PWA exact mockup self-check failed: ${exactFailed.join(", ")}`);
console.log(`Mobile/PWA exact mockup self-check passed: ${exactMockupChecks.length} visual contracts.`);
