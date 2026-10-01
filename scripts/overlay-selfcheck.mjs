import fs from "node:fs";

const globals=fs.readFileSync("app/globals.css","utf8");
const overlayCss=fs.readFileSync("styles/overlays.css","utf8");
const overlay=fs.readFileSync("components/ui/responsive-overlay.tsx","utf8");
const hook=fs.readFileSync("hooks/use-overlay-lock.ts","utf8");

const imports=[...globals.matchAll(/@import\s+["']([^"']+)["']/g)].map(m=>m[1]);
if(imports.length!==7)throw new Error(`Expected seven centralized CSS entrypoints, got ${imports.length}: ${imports.join(", ")}`);
if(imports.at(-3)!=="../styles/overlays.css"||imports.at(-2)!=="../styles/primitives.css"||imports.at(-1)!=="../styles/mobile-pwa.css")throw new Error("Overlay, primitives and canonical Mobile/PWA layers are not ordered correctly.");

for(const marker of [".ui-overlay-backdrop",".ui-overlay-body",".ui-overlay-actions","100dvh","--safe-bottom","grid-auto-columns:minmax(0,1fr)","@media print"]){
 if(!overlayCss.includes(marker))throw new Error(`Canonical overlay rule missing: ${marker}`);
}
for(const marker of ["createPortal","useOverlayLock(open)","focusableSelector","aria-modal=\"true\"","Escape"]){
 if(!overlay.includes(marker))throw new Error(`ResponsiveOverlay foundation incomplete: ${marker}`);
}
if(!hook.includes("lockCount")||!hook.includes("binso-overlay-open"))throw new Error("Overlay scroll-lock foundation incomplete.");

const consumers=[
 "components/shell.tsx","components/confirm-host.tsx","components/privacy/cookie-consent.tsx",
 "components/business-document-editor.tsx","components/payroll-page.tsx","components/detail-page.tsx","components/document-detail.tsx"
];
for(const file of consumers){
 const text=fs.readFileSync(file,"utf8");
 if(file==="components/shell.tsx"?!text.includes("MobileNavigationPanel"):!text.includes("ResponsiveOverlay"))throw new Error(`Central overlay infrastructure not used in ${file}`);
 if(/modal-backdrop|mobile-sheet-backdrop|send-modal|edit-modal|payslip-modal|consent-backdrop/.test(text))throw new Error(`Legacy overlay markup remains in ${file}`);
}

console.log("Overlay self-check passed: one portal-based overlay system owns positioning, safe areas, focus, scroll lock and actions.");
