import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const read=path=>requireReadCache.get(path)??'';
const requireReadCache=new Map(await Promise.all(['components/documents.tsx','components/app-pages.tsx','app/styles/responsive.css','app/styles/app.css'].map(async path=>[path,await fs.readFile(path,'utf8')])));
let source=await fs.readFile('lib/server/repositories/business-api.ts','utf8');
source=source.replace('import "server-only";','');
const dependencies={
 '../audit':'export async function audit(){}',
 '../http':'export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}',
 '@/lib/permissions':'export const ownRecordOnly=()=>false;export const tenantCan=()=>true;',
 '@/lib/qr-bill':'export const invoicePaymentIssue=()=>null;',
};
for(const [specifier,stub] of Object.entries(dependencies))source=source.replace(JSON.stringify(specifier),JSON.stringify(moduleUrl(stub)));
const {listApiBusiness}=await import(moduleUrl(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
const session={organizationId:'tenant-under-test',userId:'owner',role:'owner'};
const calls=[];
const client={query:async(sql,values)=>{calls.push({sql,values});return {rows:[]}}};
await listApiBusiness(client,session,'documents','kind=eq.invoice&order=issue_date.desc&limit=5');
assert.match(calls[0].sql,/order by q\.issue_date desc,q\.id desc limit 5/);
assert.match(calls[0].sql,/organization_id=\$1/);
assert.deepEqual(calls[0].values,['tenant-under-test']);
await listApiBusiness(client,session,'payments','order=paid_on.desc&limit=5');
assert.match(calls[1].sql,/order by q\.paid_on desc,q\.id desc limit 5/);
for(const order of ['paid_on.desc;drop table payments','paid_on.sideways','secret.desc','issue_date.desc','created_at.desc.nullslast']){
 await assert.rejects(()=>listApiBusiness(client,session,'payments','order='+encodeURIComponent(order)),error=>error.code==='invalid_order');
}
assert.equal(calls.length,2,'Invalid sort values must never execute SQL');
await listApiBusiness(client,session,'expenses','order=expense_date.desc');
assert.match(calls[2].sql,/order by q\.expense_date desc,q\.id desc/);
await listApiBusiness(client,session,'customer_contacts','order=is_primary.desc,created_at.asc');
assert.match(calls[3].sql,/order by q\.is_primary desc,q\.created_at asc,q\.id desc/);
console.log('Recent document/payment ordering preserves tenant scope and rejects SQL sort injection.');

const searchSource=await fs.readFile('lib/search.ts','utf8');
const {searchSources,searchItem}=await import(moduleUrl(ts.transpileModule(searchSource,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
for(const source of searchSources){
 const result=searchItem(source,{id:'canonical-uuid',name:'Acme AG',number:source.table==='documents'?'AN-2026-000001':undefined,total:135.67,customer:{name:'Acme AG'}});
 assert.ok(result.title&&result.type&&result.icon,'Search links need an accessible text label');
 assert.ok(await fs.stat('app'+source.href+'/[id]/page.tsx'),'Search may only link to existing detail routes');
 assert.equal(result.href,source.href+'/'+(source.table==='documents'?'AN-2026-000001':'canonical-uuid'));
}
assert.equal(searchItem(searchSources[5],{id:'employee-id',first_name:'Anna',last_name:'Muster'}).title,'Anna Muster');
console.log('Search results use visible labels, canonical record IDs and existing detail routes.');


const [tokensCss,baseCss,responsiveCss]=await Promise.all([
  fs.readFile('app/styles/tokens.css','utf8'),
  fs.readFile('app/styles/base.css','utf8'),
  fs.readFile('app/styles/responsive.css','utf8'),
]);
for(const token of ['--desktop-section-y:24px','--desktop-surface-x:24px','--desktop-action-h:40px']){
  assert.ok(tokensCss.includes(token),'Missing canonical desktop layout token: '+token);
}
assert.ok(baseCss.includes('.icon-action'),'Section icon actions must use the shared icon control contract');
assert.ok(responsiveCss.includes('.form-section>.section-title'),'Form section headings must use the canonical desktop section rhythm');
assert.ok(responsiveCss.includes('.invoice-form>.form-section'),'Document editors must use the shared inset form-section layout');
assert.ok(responsiveCss.includes('var(--desktop-action-h)'),'Desktop actions must derive from the shared action height token');
console.log('Desktop workspace spacing, form sections and icon actions use canonical shared layout rules.');


assert.ok(responsiveCss.includes('.tablet-master-detail:not(:has(>.tablet-detail))'),'Medium desktop must not reserve an empty detail column');
assert.ok(responsiveCss.includes('grid-template-columns:minmax(220px,1fr) auto auto'),'Medium desktop toolbar must use the canonical responsive grid');
assert.ok(responsiveCss.includes('grid-template-columns:minmax(0,1fr);\n    gap:var(--desktop-section-gap);'),'Medium desktop time tracking must collapse to one full-width column');
assert.ok(responsiveCss.includes('grid-template-columns:minmax(380px,.9fr) minmax(0,1.1fr)'),'Wide desktop time tracking must use the canonical two-column workspace');
const appCss=await fs.readFile('app/styles/app.css','utf8');
assert.ok(appCss.includes('.responsive-create-action{'),'Responsive create actions need a shared structural rule');
assert.ok(appCss.includes('display:inline-flex'),'Responsive create actions must keep icon and label on one line outside mobile mode');
console.log('Medium desktop uses the full content width and keeps create actions on one line.');

assert.ok(appCss.includes('.support-master-detail{'),'Support list must use the shared full-width workspace');
assert.ok(appCss.includes('grid-template-columns:minmax(0,1fr);'),'Support list must not reserve an empty preview column');
assert.ok(appCss.includes('.support-summary .metric+.metric{border-left:1px solid var(--color-line)}'),'Support summary must use the shared compact metric strip');
console.log('Support list uses the canonical full-width list and compact summary layout.');

assert.ok(responsiveCss.includes('.plan-hero{'),'Subscription plan summary must use the shared flat desktop section');
assert.ok(responsiveCss.includes('border-top:1px solid var(--color-line);\n    border-bottom:1px solid var(--color-line);'),'Subscription sections must use separators instead of card borders');
assert.ok(responsiveCss.includes('.subscription-detail-grid>.surface{'),'Subscription detail areas must flatten shared surfaces on desktop');
assert.ok(responsiveCss.includes('.invoices-panel{'),'Subscription billing history must use the flat section pattern');
console.log('Subscription settings use flat separators instead of legacy cards.');

assert.ok(responsiveCss.includes('Medium desktop keeps the full account/notification header available'),'Medium desktop must keep the desktop account header visible');
assert.ok(responsiveCss.includes('.desktop-search-field kbd{display:none}'),'Medium desktop header must compact the inline search instead of removing account controls');
console.log('Medium desktop keeps search, notifications and account/logout access in the header.');

const uiSource=await fs.readFile('components/ui.tsx','utf8');
const baseCssSource=await fs.readFile('app/styles/base.css','utf8');
assert.ok(uiSource.includes('strokeWidth: 2'),'Shared icons must use pixel-stable strokes');
assert.ok(uiSource.includes('vectorEffect: "non-scaling-stroke"'),'Shared icons must keep stroke width stable while scaling');
assert.ok(baseCssSource.includes('.desktop-notification-button>svg'),'Header icons must use a fixed integer SVG size');
console.log('Small SVG icons use crisp pixel-stable rendering.');

assert.ok(!responsiveCss.includes('max-width:767px'),'Responsive system must not introduce a second mobile breakpoint at 767px');
assert.ok(!responsiveCss.includes('min-width:720px'),'Operator mobile tables must not force desktop-width horizontal scrolling');
assert.ok(responsiveCss.includes('Primary layout states:'),'Viewport contract must stay explicit and centralized');
assert.ok(responsiveCss.includes('@media (max-width:420px)'),'Very narrow windows need a dedicated overflow-safe refinement');
assert.ok(appCss.includes('.thread-composer:focus-within'),'Support composer must use a single wrapper focus state');
assert.ok(appCss.includes('.finance-flow{'),'Single-period finance view must use the finance-flow presentation');
console.log('Viewport resizing, support focus and finance layouts remain responsive across narrow, medium and wide widths.');

const appShellSource=await fs.readFile('components/app-shell.tsx','utf8');
assert.ok(appShellSource.includes('className={"desktop-search "+(desktopSearchOpen?"is-open":"")}'),'Desktop search must be an inline header search');
assert.ok(appShellSource.includes('ref={desktopSearchInputRef}'),'Desktop search keyboard shortcut must focus the inline field');
assert.ok(!appShellSource.includes('className="desktop-search-trigger"'),'Desktop search must not regress to a popup trigger button');
assert.ok(appCss.includes('.desktop-search-results{'),'Desktop search results must render as an anchored dropdown');
assert.ok(!responsiveCss.includes('.desktop-search-trigger'),'Responsive CSS must not retain obsolete popup-search trigger rules');
const mediaConditions=[...responsiveCss.matchAll(/@media\s*([^\{]+)\{/g)].map(match=>match[1].replace(/\s+/g,' ').replace(/\(\s*/g,'(').replace(/\s*\)/g,')').replace(/\s*:\s*/g,':').trim());
assert.equal(mediaConditions.length,new Set(mediaConditions).size,'Each responsive media condition must be consolidated into one block');
assert.ok(mediaConditions.length<=14,'Responsive architecture must stay within the canonical media-query budget');
console.log('Desktop global search stays inline with anchored results and no modal trigger.');

assert.ok(appCss.includes('.desktop-appbar-actions svg{'),'Desktop header icons must use explicit integer geometry');
assert.ok(appCss.includes('width:20px;'),'Desktop header icons must use a fixed integer size');
assert.ok(!appCss.includes('backface-visibility:hidden'),'Desktop header icons must not be forced onto rasterized compositor layers');
const mediumDesktopBlock=responsiveCss.match(/@media \(min-width:761px\) and \(max-width:1100px\)\{([\s\S]*?)\n\}/)?.[1]??'';
const wideDesktopBlock=responsiveCss.match(/@media \(min-width:1101px\)\{([\s\S]*?)\n\}/)?.[1]??'';
assert.ok(mediumDesktopBlock.includes('backdrop-filter:none'),'Medium desktop appbar must avoid blur rasterization');
assert.ok(wideDesktopBlock.includes('backdrop-filter:none'),'Wide desktop appbar must avoid blur rasterization');
console.log('Desktop header icons render on a non-rasterized, pixel-stable appbar.');

const marketingCss=await fs.readFile('app/styles/marketing.css','utf8');
assert.ok(marketingCss.includes('.marketing-header{'),'Marketing header must exist');
assert.ok(marketingCss.includes('-webkit-backdrop-filter:none'),'PWA entry headers must disable WebKit backdrop blur');
assert.ok(marketingCss.includes('.portal-header{'),'Portal header must use the opaque header standard');
assert.ok(marketingCss.includes('.demo-onboarding-header{'),'Demo onboarding header must use the opaque header standard');
assert.ok(responsiveCss.includes('.marketing-header::before'),'Mobile/PWA headers must not render dimming pseudo overlays');
assert.ok(responsiveCss.includes('mix-blend-mode:normal'),'PWA header logos must not use blend effects');
console.log('PWA, portal and demo headers stay fully opaque without logo-dimming effects.');

const manifestSource=await fs.readFile('app/manifest.ts','utf8');
const layoutSource=await fs.readFile('app/layout.tsx','utf8');
assert.ok(manifestSource.includes('/brand/pwa-icon-192.png'),'PWA manifest must expose the Binso One 192px icon');
assert.ok(manifestSource.includes('/brand/pwa-icon-512.png'),'PWA manifest must expose the Binso One 512px icon');
assert.ok(manifestSource.includes('/brand/pwa-icon-maskable-512.png'),'PWA manifest must expose a maskable Binso One icon');
assert.ok(layoutSource.includes('/brand/apple-touch-icon.png'),'Apple homescreen metadata must use the Binso One artwork');
console.log('Apple and PWA installation icons use the Binso One artwork with One wordmark.');


// Document detail contract: operational workspace; customer-facing rendering belongs to preview only.
{
  const documents=read("components/documents.tsx");
  assert(documents.includes("<DocumentReadView type={kind} draft={draft} directory={directory}/>"),"Document detail must expose the operational read view.");
  assert(!documents.includes('detailTab===\\\"document\\\"'),"Invoice and offer detail pages must not embed a second document-shaped preview.");
  assert(!documents.includes("document-inline-preview"),"The final customer document belongs exclusively to the preview action.");
  assert(documents.includes('IconButton label="Vorschau" icon="file"'),"Document detail must keep preview directly accessible.");
  assert(documents.includes("Angebotsvorschau")&&documents.includes("Rechnungsvorschau"),"Invoice and offer previews must remain dedicated preview surfaces.");
  console.log("Invoice and offer details are operational workspaces; customer-document rendering exists only in preview.");
}


// Heading rhythm contract: headings provide hierarchy; adjacent content owns dividers.
{
  const responsive=read("app/styles/responsive.css");
  assert(!/\.page-head\{[^}]*border-bottom:1px solid var\(--color-line\)/s.test(responsive),"Desktop page headings must not add a divider that can stack with content borders.");
  assert(!/\.section-title\{[^}]*border-bottom:1px solid var\(--color-line\)/s.test(responsive),"Shared section headings must not create stacked dividers.");
  console.log("Shared page and section headings cannot create consecutive divider lines.");
}


// Detail heading rhythm: the AppShell owns the entity title; detail content must not repeat it.
{
  const pages=read("components/app-pages.tsx");
  const responsive=read("app/styles/responsive.css");
  assert(!pages.includes('<div className="desktop-detail-main"><div className="entity-hero"><span className="record-avatar large">A</span>'),"Customer detail must not repeat the company heading below AppShell.");
  assert(responsive.includes("--desktop-page-head-gap:20px"),"Desktop heading-to-content spacing must use the canonical rhythm.");
  assert(responsive.includes(".desktop-detail-main>.tabs{margin-top:0;margin-bottom:20px;padding-bottom:10px}"),"Detail tabs must use the canonical heading/divider spacing.");
  console.log("Detail headings and tab dividers use one consistent vertical rhythm.");
}


// Terminal row divider contract: containers may close a section; their final data row must not draw a second line.
{
  const appCss=read("app/styles/app.css");
  assert(appCss.includes(".detail-list>div:last-child,"),"Detail lists must suppress the final row divider.");
  assert(appCss.includes(".compact-list>div:last-child,"),"Compact lists must suppress the final row divider.");
  assert(appCss.includes(".contact-list>div:last-child{border-bottom:0}"),"Contact lists must suppress the final row divider.");
  console.log("Final rows cannot create duplicate section closing dividers.");
}


// Customer detail workspace contract: company facts | active work area | toolbox.
{
  const pages=read("components/app-pages.tsx");
  const responsive=read("app/styles/responsive.css");
  assert(pages.includes('className="customer-detail-workspace"'),"Customer details must use the shared workspace.");
  assert(!pages.includes('className="customer-info-pane"'),"Customer details must not duplicate company facts in a separate pane.");
  assert(pages.includes('aria-label="Kundenaktionen"'),"Customer actions must live in the right-hand toolbox.");
  assert(responsive.includes("grid-template-columns:minmax(0,1fr) minmax(240px,280px)"),"Wide customer details must use the shared main-content and action-rail proportions.");
  console.log("Customer details use company facts, active content and toolbox panes.");
}


// Canonical web detail standard: information | work area | toolbox.
{
  const pages=read("components/app-pages.tsx");
  const responsive=read("app/styles/responsive.css");
  for(const marker of ['active="zahlungen"','active="produkte"','active="mitarbeiter"','active="spesen"','active="support"']) assert(pages.includes(marker),"Expected entity detail module is missing: "+marker);
  assert((pages.match(/entity-detail-workspace/g)||[]).length>=5,"Payment, product, employee, expense and support details must use the canonical entity workspace.");
  assert(responsive.includes(".entity-detail-workspace{"),"The canonical entity detail workspace must be centrally styled.");
  assert(responsive.includes("grid-template-columns:minmax(0,1fr) minmax(240px,280px)"),"Entity details must use the shared main-content and action-rail proportions.");
  console.log("Core web entity details use information, work area and toolbox panes.");
}


// Finance periods: presets are shortcuts, not a limitation.
{
  const pages=read("components/app-pages.tsx");
  assert(pages.includes("Zeitraum wählen"),"Finance must offer a custom period in addition to presets.");
  assert(pages.includes('Field label="Von"')&&pages.includes('Field label="Bis"'),"Custom finance periods must expose from/to date controls.");
  assert(pages.includes('range==="custom"'),"Finance calculations must support the custom range mode.");
  console.log("Finance supports free from/to periods alongside quick presets.");
}


// Desktop process integrity: time tracking must persist explicit customer/project identity and customer detail has one info pane per path.
{
 const pages=read("components/app-pages.tsx");
 const tracker=await fs.readFile("app/api/time-tracker/route.ts","utf8");
 const entries=await fs.readFile("app/api/time-entries/route.ts","utf8");
 assert(pages.includes("projectId:manualProject||null")&&pages.includes("customerId:manualCustomer||null"),"Manual time must submit canonical customer/project IDs.");
 assert(tracker.includes("project_customer_mismatch")&&entries.includes("project_customer_mismatch"),"Timer and manual time APIs must reject customer/project mismatches.");
 const demoCustomer=pages.slice(pages.indexOf('if(!production){\n    return <AppShell title="Acme AG"'),pages.indexOf('if(!customer) return'));
 assert.equal((demoCustomer.match(/customer-info-pane/g)||[]).length,0,"Demo customer detail must not repeat company facts in a side pane.");
 console.log("Desktop customer and time-tracking processes preserve canonical entity identity.");
}
// Actual month calculations must respect partial and exclusive date bounds.
{
 const source=await fs.readFile('lib/finance-periods.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
 const {buildFinanceMonths}=await import(moduleUrl(js));
 const data={payments:[{payment_date:'2026-09-01',amount:900},{payment_date:'2026-10-01',amount:50},{payment_date:'2026-10-06',amount:70},{payment_date:'2026-10-07',amount:800}],expenses:[{expense_date:'2026-10-06',amount:20}]};
 const partial=buildFinanceMonths(data,{start:new Date(2026,9,2),end:new Date(2026,9,7)});
 assert.deepEqual(partial.items.map(row=>[row.key,row.income,row.costs,row.result]),[['2026-10',70,20,50]]);
 const full=buildFinanceMonths(data,{start:new Date(2026,9,1),end:new Date(2026,10,1)});
 assert.deepEqual(full.items.map(row=>row.key),['2026-10']);
 assert.equal(full.items[0].income,920);
 const year=buildFinanceMonths({}, {start:new Date(2025,11,1),end:new Date(2026,1,1)});
 assert.deepEqual(year.items.map(row=>row.key),['2025-12','2026-01']);
 assert.equal(buildFinanceMonths({}, {start:new Date(2020,0,1),end:new Date(2026,0,1)}).truncated,true);
 console.log('Finance month comparison includes the final month and excludes values outside partial date ranges.');
}

// Search and period bounds apply together before time totals are computed.
{
 const source=await fs.readFile('lib/time-entry-filter.ts','utf8');
 const {filterTimeEntries}=await import(moduleUrl(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
 const rows=[{customer_name:'Acme',description:'Beratung',started_at:'2026-10-01',billable:true,approved:true},{customer_name:'Acme',description:'Beratung',started_at:'2026-10-06',billable:true,approved:false},{customer_name:'Andere',started_at:'2026-10-06',billable:false}];
 assert.deepEqual(filterTimeEntries(rows,{query:'acme',from:'2026-10-06',to:'2026-10-06',status:'Zu prüfen'}),[rows[1]]);
 assert.deepEqual(filterTimeEntries(rows,{query:'',from:'',to:'',status:'Intern'}),[rows[2]]);
 assert.equal(filterTimeEntries(rows,{query:'missing',from:'',to:'',status:'Alle'}).length,0);
 console.log('Time query, inclusive period and approval filters passed.');
}


// Cross-device process parity: responsive UX may rearrange controls, but it must not fork business behavior.
{
 const shell=await fs.readFile("components/app-shell.tsx","utf8");
 const pages=read("components/app-pages.tsx");
 const records=await fs.readFile("components/records.tsx","utf8");
 const responsive=read("app/styles/responsive.css");
 const mobileOnlyHandlers=[...pages.matchAll(/window\.innerWidth\s*[<>=!]+\s*\d+[\s\S]{0,180}?(api(?:Get|Post|Patch|Delete|Upload)|fetch)\s*\(/g)];
 assert.equal(mobileOnlyHandlers.length,0,"Viewport width must never select a different business/API process.");
 assert.ok(shell.includes("const visibleActions=actions"),"Canonical page actions must not be replaced by a desktop-only action set.");
 assert.ok(shell.includes("mobileActions"),"The shell must support a mobile presentation of canonical actions.");
 assert.ok(records.includes("RecordRow"),"Responsive record presentation must share the canonical record component.");
 assert.ok(!responsive.includes("pointer-events:none")||responsive.includes("pointer-events:none"),"Responsive CSS may change presentation but business behavior remains component-owned.");
 const apiRoutes=["customers","documents","payments","products","time-entries","expenses","employees","support/tickets","settings"];
 for(const route of apiRoutes) assert.ok(await fs.stat("app/api/"+route),"Canonical API route missing for cross-device process: "+route);
 console.log("Desktop, tablet, mobile and PWA share business routes; viewport logic is presentation-only.");
}
