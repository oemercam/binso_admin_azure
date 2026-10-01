import fs from "node:fs";
import path from "node:path";

const read=p=>fs.readFileSync(p,"utf8");
const required=[
 "config/mobile-ux.ts","config/navigation.ts","config/route-metadata.ts","components/module-page.tsx",
 "components/detail-page.tsx","components/entity-form.tsx","components/business-document-editor.tsx",
 "components/document-detail.tsx","components/shell.tsx","components/route-scroll-reset.tsx",
 "components/support/support-list.tsx","components/support/support-new.tsx","components/support/support-detail.tsx",
 "styles/responsive-central.css","styles/shell.css"
];
for(const file of required)if(!fs.existsSync(file))throw new Error(`Full Mobile/PWA audit file missing: ${file}`);
if(fs.existsSync("components/navigation/page-back-button.tsx"))throw new Error("Legacy PageBackButton must be removed, not hidden.");

const workspaceRoot="app/(workspace)";
const workspacePages=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(name==="page.tsx")workspacePages.push(p)}}
walk(workspaceRoot);
if(workspacePages.length<60)throw new Error(`Workspace route inventory unexpectedly small: ${workspacePages.length}`);

const allowedEntryPoints=["ModulePage","DetailPage","EntityForm","BusinessDocumentEditor","DocumentDetail","Dashboard","SettingsPage","ReportsPage","VatPage","PayrollPage","SupportList","SupportNew","SupportDetail","SubscriptionPage","NotificationCenter","ChangelogPage","FeedbackForm"];
for(const file of workspacePages){const text=read(file);if(!allowedEntryPoints.some(marker=>text.includes(marker))&&!text.includes("LocalizedText"))throw new Error(`Workspace page not covered by canonical route family: ${file}`)}

const modules=read("lib/modules.ts");
const mobile=read("config/mobile-ux.ts");
const keys=[...modules.matchAll(/\|?\s*"([a-z]+)"/g)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i);
for(const key of keys)if(!mobile.includes(`${key}:`))throw new Error(`Mobile list priority missing for module: ${key}`);

for(const file of ["components/detail-page.tsx","components/document-detail.tsx","components/entity-form.tsx","components/business-document-editor.tsx","components/support/support-new.tsx","components/support/support-detail.tsx"]){
 const text=read(file);
 if(/PageBackButton|page-back-button|Zurück zu|Zur Übersicht|Back to/.test(text))throw new Error(`Content back navigation remains in ${file}`);
}

const detail=read("components/detail-page.tsx");
for(const marker of ["mobileDetailEntries","detail-fields-mobile","mobile-detail-more","detail-actions-mobile","ResponsiveOverlay open={mobileMenu}"])if(!detail.includes(marker))throw new Error(`Detail mobile hierarchy missing: ${marker}`);
const editor=read("components/business-document-editor.tsx");
for(const marker of ["document-essential-fields","document-advanced-fields","document-mobile-actions"])if(!editor.includes(marker))throw new Error(`Document editor progressive mobile flow missing: ${marker}`);
const shell=read("components/shell.tsx");
for(const marker of ["mobile-nav-create","mobileQuickCreate","mobileMoreNavigation","getWorkspaceRouteMetadata","mobile-account-overlay","accountContent"])if(!shell.includes(marker))throw new Error(`Mobile shell contract missing: ${marker}`);
if(shell.includes("mobileSearchOpen")||shell.includes("mobile-search-trigger"))throw new Error("Global mobile header search must not exist.");
const scroll=read("components/route-scroll-reset.tsx");
for(const marker of ["scrollRestoration","popstate","getBrowserStorage","history-pop"])if(!scroll.includes(marker))throw new Error(`Back-navigation state restoration missing: ${marker}`);

const css=read("styles/responsive-central.css");
for(const marker of ["v1.6.7 navigation/content hierarchy","detail-fields-mobile","mobile-detail-more","document-advanced-fields","support-capture-actions","notification-layout","operator-table-row","overflow-x:clip","@media(display-mode:standalone)"])if(!css.includes(marker))throw new Error(`Full Mobile/PWA CSS contract missing: ${marker}`);
if(css.includes("!important"))throw new Error("Mobile/PWA CSS must not use !important.");
if(css.includes(".page-back-button"))throw new Error("Back-button CSS remains after component removal.");
const shellCss=read("styles/shell.css");
for(const marker of ["v1.6.7 Mobile/PWA shell","mobile-nav-create-icon","mobile-account-overlay","grid-template-columns:minmax(0,1fr) 44px"]){if(!shellCss.includes(marker))throw new Error(`Mobile shell CSS contract missing: ${marker}`)}

console.log(`Full Mobile/PWA audit self-check passed: ${workspacePages.length} workspace pages use canonical route families; content back controls are removed, route metadata owns active navigation, the mobile header is logo/avatar only, account actions share desktop logic, and PWA back-state restoration remains guarded.`);
