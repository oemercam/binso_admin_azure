import {readPageFile} from "./page-source.mjs";
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const read=path=>requireReadCache.get(path)??'';
const requireReadCache=new Map(await Promise.all(['components/documents.tsx','components/app-pages.tsx','app/styles/responsive.css','app/styles/app.css'].map(async path=>[path,await readPageFile(path,'utf8')])));
let source=await readPageFile('lib/server/repositories/business-api.ts','utf8');
source=source.replace('import "server-only";','');
const dependencies={
 '../audit':'export async function audit(){}',
 '../http':'export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}',
 '@/lib/permissions':'export const ownRecordOnly=()=>false;export const tenantCan=()=>true;',
 '@/lib/financial-status':ts.transpileModule(await readPageFile('lib/financial-status.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText,
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

const searchSource=await readPageFile('lib/search.ts','utf8');
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
  readPageFile('app/styles/tokens.css','utf8'),
  readPageFile('app/styles/base.css','utf8'),
  readPageFile('app/styles/responsive.css','utf8'),
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
const appCss=await readPageFile('app/styles/app.css','utf8');
assert.ok(appCss.includes('.responsive-create-action{'),'Responsive create actions need a shared structural rule');
assert.ok(appCss.includes('display:inline-flex'),'Responsive create actions must keep icon and label on one line outside mobile mode');
console.log('Medium desktop uses the full content width and keeps create actions on one line.');

assert.ok(appCss.includes('.support-master-detail{'),'Support list must use the shared full-width workspace');
assert.ok(appCss.includes('grid-template-columns:minmax(0,1fr);'),'Support list must not reserve an empty preview column');
assert.ok(!/\.metric(?:\+\.metric|:nth-child\([^)]*\))\{border-(?:left|top):1px/.test(appCss+responsiveCss),'Metrics must not have dividers between values');
console.log('Support list uses the canonical full-width list and compact summary layout.');

assert.ok(responsiveCss.includes('.plan-hero{'),'Subscription plan summary must use the shared flat desktop section');
assert.ok(responsiveCss.includes('border-top:1px solid var(--color-line);\n    border-bottom:1px solid var(--color-line);'),'Subscription sections must use separators instead of card borders');
assert.ok(responsiveCss.includes('.subscription-detail-grid>.surface{'),'Subscription detail areas must flatten shared surfaces on desktop');
assert.ok(responsiveCss.includes('.invoices-panel{'),'Subscription billing history must use the flat section pattern');
console.log('Subscription settings use flat separators instead of legacy cards.');

assert.ok(responsiveCss.includes('Medium desktop keeps the full account/notification header available'),'Medium desktop must keep the desktop account header visible');
assert.ok(responsiveCss.includes('.desktop-search-field kbd{display:none}'),'Medium desktop header must compact the inline search instead of removing account controls');
console.log('Medium desktop keeps search, notifications and account/logout access in the header.');

const uiSource=await readPageFile('components/ui.tsx','utf8');
const baseCssSource=await readPageFile('app/styles/base.css','utf8');
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

const appShellSource=await readPageFile('components/app-shell.tsx','utf8');
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

const marketingCss=await readPageFile('app/styles/marketing.css','utf8');
assert.ok(marketingCss.includes('.marketing-header{'),'Marketing header must exist');
assert.ok(marketingCss.includes('-webkit-backdrop-filter:none'),'PWA entry headers must disable WebKit backdrop blur');
assert.ok(marketingCss.includes('.portal-header{'),'Portal header must use the opaque header standard');
assert.ok(marketingCss.includes('.demo-onboarding-header{'),'Demo onboarding header must use the opaque header standard');
assert.ok(responsiveCss.includes('.marketing-header::before'),'Mobile/PWA headers must not render dimming pseudo overlays');
assert.ok(responsiveCss.includes('mix-blend-mode:normal'),'PWA header logos must not use blend effects');
console.log('PWA, portal and demo headers stay fully opaque without logo-dimming effects.');

const manifestSource=await readPageFile('app/manifest.ts','utf8');
const layoutSource=await readPageFile('app/layout.tsx','utf8');
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
  assert(pages.includes('<ActionSheet label="Kundenaktionen"'),"Customer actions must live in the right-hand toolbox.");
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
 const tracker=await readPageFile("app/api/time-tracker/route.ts","utf8");
 const entries=await readPageFile("app/api/time-entries/route.ts","utf8");
 assert(pages.includes("projectId:manualProject||null")&&pages.includes("customerId:manualCustomer||null"),"Manual time must submit canonical customer/project IDs.");
 assert(tracker.includes("project_customer_mismatch")&&entries.includes("project_customer_mismatch"),"Timer and manual time APIs must reject customer/project mismatches.");
 const demoCustomer=pages.slice(pages.indexOf('if(!production){\n    return <AppShell title="Acme AG"'),pages.indexOf('if(!customer) return'));
 assert.equal((demoCustomer.match(/customer-info-pane/g)||[]).length,0,"Demo customer detail must not repeat company facts in a side pane.");
 console.log("Desktop customer and time-tracking processes preserve canonical entity identity.");
}
// Actual month calculations must respect partial and exclusive date bounds.
{
 const source=await readPageFile('lib/finance-periods.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
 const {buildFinanceMonths,financeWindow}=await import(moduleUrl(js));
 const lastThree=financeWindow("three","","","2026-10-08");assert.equal(lastThree.start.toLocaleDateString("sv-SE"),"2026-07-01");assert.equal(lastThree.end.toLocaleDateString("sv-SE"),"2026-10-01");
 const calendarYear=financeWindow("year","","","2026-10-08");assert.equal(calendarYear.start.getMonth(),0);assert.equal(calendarYear.end.getFullYear(),2027);
 const custom=financeWindow("custom","2026-02-28","2026-02-28","2026-10-08");assert.equal((custom.end-custom.start)/86400000,1);
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
 const source=await readPageFile('lib/time-entry-filter.ts','utf8');
 const {filterTimeEntries}=await import(moduleUrl(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
 const rows=[{customer_name:'Acme',description:'Beratung',started_at:'2026-10-01',billable:true,approved:true},{customer_name:'Acme',description:'Beratung',started_at:'2026-10-06',billable:true,approved:false},{customer_name:'Andere',started_at:'2026-10-06',billable:false}];
 assert.deepEqual(filterTimeEntries(rows,{query:'acme',from:'2026-10-06',to:'2026-10-06',status:'Zu prüfen'}),[rows[1]]);
 assert.deepEqual(filterTimeEntries(rows,{query:'',from:'',to:'',status:'Intern'}),[rows[2]]);
 assert.equal(filterTimeEntries(rows,{query:'missing',from:'',to:'',status:'Alle'}).length,0);
 const scoped=[{...rows[0],project_id:'p1',customer_id:'c1'},{...rows[1],project_id:'p1',customer_id:'c1'},{...rows[2],project_id:'p2',customer_id:'c2'}];
 assert.deepEqual(filterTimeEntries(scoped,{query:'',from:'2026-10-06',to:'2026-10-06',status:'Alle',projectId:'p1'}),[scoped[1]]);
 assert.deepEqual(filterTimeEntries(scoped,{query:'',from:'',to:'',status:'Alle',customerId:'c2'}),[scoped[2]]);
 console.log('Time query, today-only period, project/customer context and approval filters passed.');
}


// Cross-device process parity: responsive UX may rearrange controls, but it must not fork business behavior.
{
 const shell=await readPageFile("components/app-shell.tsx","utf8");
 const pages=read("components/app-pages.tsx");
 const records=await readPageFile("components/records.tsx","utf8");
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

const {matchesRecordChip}=await import(moduleUrl(ts.transpileModule(await readPageFile('lib/list-filter.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
assert.equal(matchesRecordChip('Angebote','Angenommen','Angebot'),true);
assert.equal(matchesRecordChip('Angebote','Bezahlt','Rechnung'),false);
assert.equal(matchesRecordChip('Rechnungen','Bezahlt','Rechnung'),true);
assert.equal(matchesRecordChip('Produkte','Aktiv','Produkt'),true);
assert.equal(matchesRecordChip('Offen','Teilweise bezahlt','Rechnung',{Offen:['Teilweise bezahlt','Überfällig']}),true);
assert.equal(matchesRecordChip('Bezahlt','Offen','Rechnung'),false);
console.log('Shared customer-finance type filters match singular rows and plural tabs; payment filters retain partial support.');

const timerSource=await readPageFile('lib/client/time-tracker.ts','utf8');
const timerAst=ts.createSourceFile('time-tracker.ts',timerSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const contextFunction=timerAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='withIdleTimerContext').getText(timerAst);
const {withIdleTimerContext}=await import(moduleUrl(ts.transpileModule(contextFunction,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
const projectContext={project:'Cloud Migration',projectId:'project-one',customerId:'customer-one'};
const idleTimer={running:false,seconds:0,project:'Arbeitszeit',projectId:null,customerId:null};
assert.deepEqual(withIdleTimerContext(idleTimer,projectContext),{...idleTimer,...projectContext});
for(const active of [{...idleTimer,running:true,seconds:0},{...idleTimer,seconds:90}])assert.equal(withIdleTimerContext(active,projectContext),active,'An active or paused timer with recorded time must keep its actual context');
assert.equal(withIdleTimerContext(idleTimer,null),idleTimer);
console.log('Project-linked idle timer context survives synchronization without changing active or already recorded time.');

// Exercise actual list rendering with status columns followed by metadata and hidden IDs.
{
 const {compareRecordValues}=await import(moduleUrl(ts.transpileModule(await readPageFile('lib/record-sort.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
 assert.ok(compareRecordValues('CHF 900.00',"CHF 1’200.00")<0);
 assert.ok(compareRecordValues('CHF 90.50 / Std.','CHF 100.00 / Std.')<0,'Unit suffixes must preserve numeric price sorting');
 assert.ok(compareRecordValues('31.12.2025','01.01.2026')<0);
 assert.ok(compareRecordValues('2026-10-02','2026-10-12')<0);
 assert.ok(compareRecordValues('RE-9','RE-10')<0);
 const list=await readPageFile('components/records.tsx','utf8');
 const listAst=ts.createSourceFile('records.tsx',list,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const emptyAst=ts.createSourceFile('ui.tsx',await fs.readFile('components/ui.tsx','utf8'),99,true,4);
 const emptyFragment=emptyAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='EmptyState').getText(emptyAst);
 const listFragment=listAst.statements.filter(node=>ts.isFunctionDeclaration(node)&&['RecordsView','tone'].includes(node.name?.text)).map(node=>node.getText(listAst)).join('\n')+'\n'+emptyFragment;
 const listCompiled=ts.transpileModule(listFragment,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const fixture=[['hidden-z','First','CHF 900.00','Neu','REF-1'],['hidden-a','Second',"CHF 1’200.00",'Gelöst','REF-2']];
 const render=(chip='Alle',sort='default',sortIndex=1)=>{
  let hook=0;const states=['',chip,sort,sortIndex,true];const exports={};
  Function('require','exports','useState','useEffect','useMemo','Icon','Status','Link','matchesRecordChip','compareRecordValues','ListSearch',listCompiled)(createRequire(import.meta.url),exports,()=>[states[hook++],()=>{}],()=>{},fn=>fn(),()=>null,({children})=>React.createElement('span',null,children),({children,href})=>React.createElement('a',{href},children),matchesRecordChip,compareRecordValues,({value,onChange,placeholder})=>React.createElement("input",{type:"search",value,onChange,placeholder}));
  return renderToStaticMarkup(React.createElement(exports.RecordsView,{items:fixture,placeholder:'Tickets suchen',chips:['Alle','Offen'],statusGroups:{Offen:['Neu','Warten auf Kunde']},columns:[{label:'Titel',index:1},{label:'Betrag',index:2},{label:'Status',index:3,status:true}]},row=>React.createElement('b',null,row[1])));
 };
 const filtered=render('Offen');assert.ok(filtered.includes('First'));assert.ok(!filtered.includes('Second'));assert.ok(filtered.includes('Filter zurücksetzen'));
 const sorted=render('Alle','desc',2);assert.ok(sorted.indexOf('Second')<sorted.indexOf('First'));assert.ok(sorted.includes('Betrag ↑'));assert.ok(sorted.includes('Betrag ↓'));
 const empty=render('Bezahlt');assert.ok(empty.includes('data-empty-state="compact"'));assert.ok(!empty.includes('empty-icon'),'Empty lists remain one-line status messages');
 console.log('Actual record rendering: status column filtering, reset visibility, Swiss numeric/date sorting and mobile column selection passed.');
}

// Exercise real mutation handlers, including two clicks before a React re-render.
{
 const pages=await readPageFile('components/app-pages.tsx','utf8');
 const ast=ts.createSourceFile('pages.tsx',pages,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const nodes=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&['CustomerForm','ProductForm','EmployeeForm','RevenueInsight','moneyChf'].includes(node.name?.text));
 const compiled=ts.transpileModule((await readPageFile('lib/employee-validation.ts','utf8')).replace('export function','function')+'\n'+nodes.map(node=>node.getText(ast)).join('\n')+'\nexport {RevenueInsight};',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 let values={},hook=0,calls=0,resolveSave,rejectSave;const scheduled=[];const navigations=[];
 const exports={};const Toast=()=>null;
 const write=()=>{++calls;return new Promise((resolve,reject)=>{resolveSave=resolve;rejectSave=reject});};
 const originalWindow=globalThis.window;
 globalThis.window={setTimeout:callback=>{scheduled.push(callback)}};
 try{
  Function('require','exports','useState','useRef','useEffect','useRouter','useSearchParams','useBackendMode','isProductionBackendEnabled','apiGet','apiPost','apiPatch','appendDemoRow','AppShell','Button','Field','Toast','Icon','Status','Link','SectionTitle','EmptyState','businessDate','Input','Select','Textarea','FormActions',compiled)(createRequire(import.meta.url),exports,initial=>{const index=hook++;return [Object.hasOwn(values,index)?values[index]:typeof initial==='function'?initial():initial,()=>{}]},initial=>({current:initial}),()=>{},()=>({push:path=>navigations.push(path)}),()=>({get:() =>'/dashboard'}),()=>true,()=>true,()=>{},write,write,()=>{throw Error('preview');},()=>null,()=>null,()=>null,Toast,()=>null,()=>null,()=>null,()=>null,()=>null,()=> '2026-10-07','input','select','textarea',({children})=>children);
  for(const [name,seeds,toastIndex] of [['CustomerForm',{0:'Audit GmbH',3:'Bern'},10],['ProductForm',{0:'Beratung',4:'125.00'},8],['EmployeeForm',{0:'Test',1:'Person',2:'test@example.invalid',4:'ICT'},12]]){
   values=seeds;hook=0;calls=0;scheduled.length=0;
   const getSave=view=>{if(view?.props?.onClick&&typeof view.props.children==='string'&&/speichern/i.test(view.props.children))return view.props.onClick;for(const child of [view?.props?.actions,...React.Children.toArray(view?.props?.children)]){const found=child&&getSave(child);if(found)return found;}return null;};
   const view=exports[name]({});const save=getSave(view);assert.ok(save,name+' has one reachable save action');
   const first=save(),second=save();await second;assert.equal(calls,1,name+' must reject duplicate submissions immediately');resolveSave({ok:true});await first;await save();assert.equal(calls,1,name+' remains locked until successful navigation');
   scheduled.forEach(fn=>fn());
   values={...seeds,[toastIndex]:'Server nicht erreichbar.'};hook=0;
   const errorView=exports[name]({});assert.equal(errorView.props.children.find(child=>child?.type===Toast).props.tone,'danger',name+' must not render an error as success');
   values=seeds;hook=0;calls=0;
   const retry=getSave(exports[name]({}));
   const failed=retry();rejectSave(new Error('offline'));await failed;const again=retry();assert.equal(calls,2,name+' can retry a failed mutation');resolveSave({ok:true});await again;
  }
  assert.ok(navigations.includes('/dashboard'),'Customer created from quick access returns to the dashboard');
  values={};hook=0;
  const chart=renderToStaticMarkup(React.createElement(exports.RevenueInsight,{invoices:[{issue_date:'2026-01-01',total:50},{issue_date:'2025-01-01',total:100}]}));
  assert.ok(chart.includes('trend-negative'));assert.ok(chart.includes('Jan–Sep'));assert.ok(chart.includes('Laufender Monat'));assert.ok(!chart.includes('↗'));
  console.log('Real form handlers prevent double saves, permit failure retries, preserve return context and render error toasts; revenue uses completed-month comparisons.');
 }finally{if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
}

// Backend failures must never acquire a success colour through keyword heuristics.
{
 let checked=0;
 for(const path of ['components/app-pages.tsx','components/documents.tsx']){
  const source=await readPageFile(path,'utf8');const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const inspect=node=>{
   if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='Toast'){
    const title=node.attributes.properties.find(attribute=>attribute.name?.getText(ast)==='title');
    const tone=node.attributes.properties.find(attribute=>attribute.name?.getText(ast)==='tone');
    if(title?.initializer?.expression?.getText(ast)==='toast'&&tone?.initializer?.expression){
     const expression=tone.initializer.expression.getText(ast);const evaluate=Function('toast','kind','return ('+expression+');');
     for(const error of ['Server nicht erreichbar.','Zugriff verweigert.','Daten konnten nicht gespeichert.'])assert.equal(evaluate(error,'Rechnung'),'danger',path+' must distinguish failure from confirmed success');
     ++checked;
    }
   }
   ts.forEachChild(node,inspect);
  };inspect(ast);
 }
 assert.ok(checked>=12);console.log('Unknown server failures stay errors across '+checked+' form, document, time and billing feedback paths.');
}

// Execute the actual expense/document handlers, including same-frame clicks and failure retries.
{
 const handler=(file,functionName,variable,scope)=>{
  const ast=ts.createSourceFile(file,read(file)||'',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===functionName);
  let initializer;
  const inspect=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)===variable)initializer=node.initializer;else ts.forEachChild(node,inspect)};
  inspect(fn);assert.ok(initializer,'Actual mutation handler must exist');
  const compiled=ts.transpileModule('const run='+initializer.getText(ast)+';', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  return Function(...Object.keys(scope),compiled+'\nreturn run;')(...Object.values(scope));
 };
 const makeWrite=()=>{let calls=0,resolve,reject;return {write:()=>{calls++;return new Promise((ok,fail)=>{resolve=ok;reject=fail})},calls:()=>calls,resolve:()=>resolve({item:{id:'saved',number:'TEST-1'}}),reject:()=>reject(new Error('offline'))}};
 const noop=()=>{};
 const docScope=()=>({documentSavePending:{current:false},companyPending:false,documentLoad:{loading:false,error:null},customersLoading:false,customersError:null,isProductionBackendEnabled:()=>true,draft:{customer:'Test',number:''},show:noop,paymentIssue:null,setSaving:noop,kind:'Angebot',documentPayload:()=>({}),sourceOffer:null,directory:{Test:{id:'customer'}},existing:false,documentKey:null,setDraft:noop,remoteDraftFromItem:x=>x,setDirty:noop,setEditing:noop,window:{setTimeout:noop},router:{push:noop},plural:'angebote'});
 const expenseScope=()=>({expenseMutationPending:{current:false},receiptScanPending:{current:false},lockedExpense:false,loadingExpense:false,expenseLoadError:null,amount:'89',expenseBillable:false,expenseCustomer:'',setToast:noop,window:{setTimeout:noop},status:'Eingereicht',setExpenseBusy:noop,person:'',merchant:'SBB',description:'',category:'Reise',date:'2026-10-08',currency:'CHF',vatRate:'8.1',expenseId:null,createdExpenseId:'',receiptFile:null,production:true,expenseRequestKey:{current:''},setCreatedExpenseId:noop,setReceiptFile:noop,apiUpload:noop,apiPatch:noop,appendDemoRow:noop,setSavedExpense:noop,existing:false,router:{push:noop}});
 for(const [file,fn,scopeFactory] of [['components/documents.tsx','DocumentPage',docScope],['components/app-pages.tsx','ExpenseForm',expenseScope]]){
  const pending=makeWrite();const scope=scopeFactory();scope.apiPost=pending.write;scope.apiPatch=pending.write;
  const run=handler(file,fn,'save',scope);const first=run();await run();assert.equal(pending.calls(),1,fn+' rejects same-frame duplicate writes');pending.resolve();await first;await run();assert.equal(pending.calls(),1,fn+' stays locked until navigation');
  const retry=makeWrite();const retryScope=scopeFactory();retryScope.apiPost=retry.write;retryScope.apiPatch=retry.write;
  const retryRun=handler(file,fn,'save',retryScope);const failure=retryRun();retry.reject();await failure;const next=retryRun();assert.equal(retry.calls(),2,fn+' releases the lock after failure');retry.resolve();await next;
 }
 console.log('Actual document and expense handlers prevent same-frame double writes, retain successful navigation locks and allow retries after failures.');
}

// Central presentation helpers preserve units and do not mutate source values.
{
 const {formatQuantity,withPriceUnit,timeMetadata}=await import(moduleUrl(ts.transpileModule(await fs.readFile('lib/display-format.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2017}}).outputText));
 assert.equal(formatQuantity('100.00','%'),'100 %');assert.equal(formatQuantity('42.00','h/Woche'),'42 h/Woche');assert.equal(formatQuantity('25.5','Tage/Jahr'),'25.5 Tage/Jahr');assert.equal(formatQuantity('8.1','%'),'8.1 %');
 assert.equal(withPriceUnit('CHF 185.00','hour'),'CHF 185.00 / Std.');assert.equal(withPriceUnit('CHF 50.00','custom-unit'),'CHF 50.00 / custom-unit');assert.equal(withPriceUnit('CHF 50.00',null),'CHF 50.00');
 assert.equal(timeMetadata('Arbeitszeit','Arbeitszeit',null,'09.10.2026'),'09.10.2026');assert.equal(timeMetadata('Konzeption','Workplace','Alex','09.10.2026'),'Workplace · Alex · 09.10.2026');
 console.log('Quantity/price units, fractional values, numeric sorting and distinct time metadata passed.');
}

// Render the actual central action component under permission contexts.
{
 const source=await fs.readFile('components/binso-ux.tsx','utf8'),ast=ts.createSourceFile('ux.tsx',source,99,true,4);
 const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ActionRow');
 const code=ts.transpileModule(node.getText(ast),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const require=createRequire(import.meta.url),exports={};let access={write:true,canOpen:()=>true};
 new Function('require','exports','usePageAccess','Icon','Link',code)(require,exports,()=>access,({name})=>React.createElement('svg',{'data-icon':name}),({children,...props})=>React.createElement('a',props,children));
 const row=props=>renderToStaticMarkup(React.createElement(exports.ActionRow,{title:'Kontakt entfernen',icon:'trash',...props}));
 assert.ok(row({danger:true}).includes('action-row-danger'));assert.equal((row({danger:true}).match(/<svg/g)||[]).length,1,'Destructive action has no chevron');
 assert.equal((row({href:'/kunden'}).match(/<svg/g)||[]).length,2,'Navigation action has a chevron');
 access={write:false,canOpen:()=>true};assert.ok(row({requiresWrite:true}).includes('disabled'));assert.ok(!row({href:'mailto:test@example.invalid'}).includes('disabled'));
 access={write:true,canOpen:()=>false};assert.equal(row({href:'/mitarbeiter'}),'','Forbidden route stays hidden');
 console.log('Central action row preserves write/route permissions and explicit navigation/destructive intent.');
}
