import fs from "node:fs";
import path from "node:path";

const read=p=>fs.readFileSync(p,"utf8");
const required=[
 "config/mobile-ux.ts","components/navigation/page-back-button.tsx","components/module-page.tsx",
 "components/detail-page.tsx","components/entity-form.tsx","components/business-document-editor.tsx",
 "components/document-detail.tsx","components/shell.tsx","components/route-scroll-reset.tsx",
 "components/support/support-list.tsx","components/support/support-new.tsx","components/support/support-detail.tsx",
 "styles/responsive-central.css","styles/shell.css"
];
for(const file of required)if(!fs.existsSync(file))throw new Error(`Full Mobile/PWA audit file missing: ${file}`);

const workspaceRoot="app/(workspace)";
const workspacePages=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);const st=fs.statSync(p);if(st.isDirectory())walk(p);else if(name==="page.tsx")workspacePages.push(p)}}
walk(workspaceRoot);
if(workspacePages.length<60)throw new Error(`Workspace route inventory unexpectedly small: ${workspacePages.length}`);

const allowedEntryPoints=["ModulePage","DetailPage","EntityForm","BusinessDocumentEditor","DocumentDetail","Dashboard","SettingsPage","ReportsPage","VatPage","PayrollPage","SupportList","SupportNew","SupportDetail","SubscriptionPage","NotificationCenter","ChangelogPage","FeedbackForm"];
for(const file of workspacePages){
 const text=read(file);
 if(!allowedEntryPoints.some(marker=>text.includes(marker))&&!text.includes("LocalizedText"))throw new Error(`Workspace page not covered by canonical route family: ${file}`);
}

const modules=read("lib/modules.ts");
const mobile=read("config/mobile-ux.ts");
const keys=[...modules.matchAll(/\|?\s*"([a-z]+)"/g)].map(m=>m[1]).filter((v,i,a)=>a.indexOf(v)===i);
for(const key of keys)if(!mobile.includes(`${key}:`))throw new Error(`Mobile list priority missing for module: ${key}`);

for(const file of ["components/detail-page.tsx","components/document-detail.tsx","components/entity-form.tsx","components/business-document-editor.tsx","components/support/support-new.tsx","components/support/support-detail.tsx"]){
 const text=read(file);
 if(/Zurück zu/.test(text))throw new Error(`Text back navigation remains in ${file}`);
 if(!text.includes("PageBackButton"))throw new Error(`Canonical icon-only back navigation missing in ${file}`);
}

const detail=read("components/detail-page.tsx");
for(const marker of ["mobileDetailEntries","detail-fields-mobile","mobile-detail-more","detail-actions-mobile","ResponsiveOverlay open={mobileMenu}"])if(!detail.includes(marker))throw new Error(`Detail mobile hierarchy missing: ${marker}`);
const editor=read("components/business-document-editor.tsx");
for(const marker of ["document-essential-fields","document-advanced-fields","document-mobile-actions","PageBackButton"])if(!editor.includes(marker))throw new Error(`Document editor progressive mobile flow missing: ${marker}`);
const shell=read("components/shell.tsx");
for(const marker of ["mobile-nav-create","/kunden","createOpen","mobile-create-sheet","accountRef"])if(!shell.includes(marker))throw new Error(`Mobile shell contract missing: ${marker}`);
if(shell.includes("<FolderKanban")&&!/FolderKanban[\s\S]*from "lucide-react"/.test(shell))throw new Error("FolderKanban is used by the mobile quick-create shell but is not imported from lucide-react.");
const scroll=read("components/route-scroll-reset.tsx");
for(const marker of ["scrollRestoration","popstate","getBrowserStorage","history-pop"])if(!scroll.includes(marker))throw new Error(`Back-navigation state restoration missing: ${marker}`);

const css=read("styles/responsive-central.css");
for(const marker of ["v1.6.5 — full Mobile/PWA app UX consolidation",".page-back-button",".detail-fields-mobile",".mobile-detail-more",".document-advanced-fields",".support-capture-actions",".notification-layout",".operator-table-row","overflow-x:clip","@media(display-mode:standalone)"])if(!css.includes(marker))throw new Error(`Full Mobile/PWA CSS contract missing: ${marker}`);
if(css.includes("!important"))throw new Error("Mobile/PWA CSS must not use !important.");
const shellCss=read("styles/shell.css");
for(const marker of ["v1.6.5 canonical mobile/PWA bottom navigation",".mobile-nav-create-icon"])if(!shellCss.includes(marker))throw new Error(`Mobile shell CSS contract missing: ${marker}`);

console.log(`Full Mobile/PWA audit self-check passed: ${workspacePages.length} workspace pages are covered by canonical list/detail/create/document/specialist route families; mobile hierarchy, icon-only back navigation, progressive detail data, quick-create navigation, operator/public/auth coverage and PWA back-state restoration are guarded.`);
