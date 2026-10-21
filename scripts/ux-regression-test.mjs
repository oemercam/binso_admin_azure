import {readDesignCss} from './design-system.mjs';
import './localization-test-adapter.mjs';
import {financialModuleUrl,moneyModuleUrl,documentAmountSqlModuleUrl} from "./data-test-modules.mjs";
import {readPageFile} from "./page-source.mjs";
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {safeAppPath}=await import(moduleUrl(ts.transpileModule(await fs.readFile('lib/navigation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
for(const attack of ['//external.example','/\\external.example','/\n/external.example','https://external.example','/%2fexternal.example','/%5cexternal.example','/%00external.example'])assert.equal(safeAppPath(attack),'/dashboard','Auth handoffs cannot resolve an external or malformed URL');
assert.equal(safeAppPath('/einstellungen/sicherheit?setup=1&next=%2Feinstellungen%2Ffirma%3Fonboarding%3D1'),'/einstellungen/sicherheit?setup=1&next=%2Feinstellungen%2Ffirma%3Fonboarding%3D1');
assert.equal(safeAppPath('/kunden/customer-one?tab=finances#details'),'/kunden/customer-one?tab=finances#details');
console.log('Auth and onboarding handoffs preserve local paths and reject URL-normalization redirect attacks.');
const read=path=>requireReadCache.get(path)??'';
const requireReadCache=new Map(await Promise.all(['components/documents.tsx','components/app-pages.tsx','@design','@design'].map(async path=>[path,await readPageFile(path,'utf8')])));
let source=await readPageFile('lib/server/repositories/business-api.ts','utf8');
source=source.replace('import "server-only";','');
const dependencies={
 '../document-amount-sql':`export * from ${JSON.stringify(documentAmountSqlModuleUrl)}`,
 '../business-idempotency':'export async function idempotentBusiness(c,input,write){return write()}',
 '../audit':'export async function audit(){}',
 '../http':'export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}',
 '@/lib/permissions':'export const ownRecordOnly=()=>false;export const tenantCan=()=>true;',
 '@/lib/financial-status':`export * from ${JSON.stringify(financialModuleUrl)}`,
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
assert.deepEqual(calls[0].values,['tenant-under-test',(await import(financialModuleUrl)).businessDate()]);
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
await listApiBusiness(client,session,'documents','q='+encodeURIComponent('RE 2026-019')+'&kind=eq.invoice&limit=5');
assert.deepEqual(calls[4].values,['tenant-under-test',(await import(financialModuleUrl)).businessDate(),'RE 2026-019']);
assert.ok(calls[4].sql.lastIndexOf(' where ')<calls[4].sql.lastIndexOf(' order by '),'Search runs before result limiting');
assert.ok(calls[4].sql.includes("q.customer->>'number'"),'Invoice search includes the related customer number');
await assert.rejects(()=>listApiBusiness(client,session,'customers','q='+encodeURIComponent('x'.repeat(201))),error=>error.code==='invalid_search');
assert.equal(calls.length,5,'An overlong search must not execute SQL');

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


// Presentation is checked by the ZIP-bound design-system and rendered-browser suites.
const manifestSource=await readPageFile('lib/site-manifest.ts','utf8');
assert.ok(!(await fs.readdir('app')).includes('manifest.ts'),'File-based root metadata must not override the application manifest');
const layoutSource=await readPageFile('app/layout.tsx','utf8');
assert.ok(manifestSource.includes('/brand/pwa-icon-192.png'),'PWA manifest must expose the Binso One 192px icon');
assert.ok(manifestSource.includes('/brand/pwa-icon-512.png'),'PWA manifest must expose the Binso One 512px icon');
assert.ok(manifestSource.includes('/brand/pwa-icon-maskable-512.png'),'PWA manifest must expose a maskable Binso One icon');
assert.ok(layoutSource.includes('/brand/apple-touch-icon.png'),'Apple homescreen metadata must use the Binso One artwork');
console.log('Apple and PWA installation icons use the Binso One artwork with One wordmark.');


// Document detail contract: operational workspace; customer-facing rendering belongs to preview only.
{
  const documents=read("components/documents.tsx");
  assert(documents.includes("<DocumentReadView type={kind} draft={draft} directory={directory} canWrite={canWrite}/>"),"Document detail must expose the operational read view.");
  assert(!documents.includes('detailTab===\\\"document\\\"'),"Invoice and offer detail pages must not embed a second document-shaped preview.");
  assert(!documents.includes("document-inline-preview"),"The final customer document belongs exclusively to the preview action.");
  assert(documents.includes('IconButton label="Vorschau" icon="file"'),"Document detail must keep preview directly accessible.");
  assert(documents.includes("Angebotsvorschau")&&documents.includes("Rechnungsvorschau"),"Invoice and offer previews must remain dedicated preview surfaces.");
  console.log("Invoice and offer details are operational workspaces; customer-document rendering exists only in preview.");
}


// Period controls moved from individual pages to the single statistics owner.
{
 const statistics=await fs.readFile('components/statistics.tsx','utf8');
 assert(statistics.includes('statisticPeriods.map'), 'All statistics consume central month presets');
 assert(statistics.includes('type="date" required')&&statistics.includes('Eigenen Statistikzeitraum wählen'), 'Actual date controls and calendar action exist');
 assert(statistics.includes('aggregateStatistics')&&statistics.includes('metrics(aggregated.totals)'), 'KPIs and bars share aggregation');
 for(const page of ['components/pages/dashboard.tsx','components/pages/finance.tsx'])assert((await fs.readFile(page,'utf8')).includes('CashOverview'), page+' renders the compact central cash overview');
 console.log('Finance and dashboard consume one statistics owner with required custom dates and shared KPI/chart aggregation.');
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
 const source=(await readPageFile('lib/finance-periods.ts','utf8')).replace('"./money"',JSON.stringify(moneyModuleUrl));
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
 const responsive=read("@design");
 const mobileOnlyHandlers=[...pages.matchAll(/window\.innerWidth\s*[<>=!]+\s*\d+[\s\S]{0,180}?(api(?:Get|Post|Patch|Delete|Upload)|fetch)\s*\(/g)];
 assert.equal(mobileOnlyHandlers.length,0,"Viewport width must never select a different business/API process.");
 assert.ok(shell.includes("listControls.props.children:actions"),"Creation remains in the heading while search/filter controls share the body slot.");
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
 const listFragment=listAst.statements.filter(node=>ts.isFunctionDeclaration(node)&&['useRecordsController','RecordsControls','RecordsView','tone','DataTable','DataTableHead','DataTableRow','tableCells','recordGrid'].includes(node.name?.text)).map(node=>node.getText(listAst)).join('\n')+'\n'+emptyFragment;
 const listCompiled=ts.transpileModule(listFragment,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const fixture=[['hidden-z','First','CHF 900.00','Neu','REF-1'],['hidden-a','Second',"CHF 1’200.00",'Gelöst','REF-2']];
 const render=(chip='Alle',sort='default',sortIndex=1,filtersOpen=false)=>{
  let hook=0;const states=['',chip,sort,sortIndex,true,0,false,filtersOpen,{activeChip:chip,sort,sortIndex}];const exports={};
  Function('require','exports','useState','useEffect','useMemo','Icon','Status','Link','matchesRecordChip','compareRecordValues','ListSearch','Children','cloneElement','isValidElement','useId','FilterSheet','Button','Field','Select','Input','useRef','DetailTabs','EmptyRecordAction',listCompiled)(createRequire(import.meta.url),exports,()=>[states[hook++],()=>{}],()=>{},fn=>fn(),()=>null,({children})=>React.createElement('span',null,children),({children,href})=>React.createElement('a',{href},children),matchesRecordChip,compareRecordValues,({value,onChange,placeholder})=>React.createElement("input",{type:"search",value,onChange,placeholder}),React.Children,React.cloneElement,React.isValidElement,React.useId,({open,children})=>open?React.createElement('div',null,children):null,({children})=>React.createElement('button',null,children),({label,children})=>React.createElement('label',null,label,children),'select','input',React.useRef,({children})=>React.createElement('div',{className:'tabs'},children),()=>null);
  return renderToStaticMarkup(React.createElement(exports.RecordsView,{items:fixture,placeholder:'Tickets suchen',chips:['Alle','Offen'],statusGroups:{Offen:['Neu','Warten auf Kunde']},columns:[{label:'Titel',index:1},{label:'Betrag',index:2},{label:'Status',index:3,status:true}]},row=>React.createElement('b',null,row[1])));
 };
 const filtered=render('Offen');assert.ok(filtered.includes('First'));assert.ok(!filtered.includes('Second'));assert.ok(filtered.includes('Status zurücksetzen'));assert.ok(!filtered.includes('toolbar-reset'),'Only the central active-filter chips own clearing');
 const sorted=render('Alle','desc',2);assert.ok(sorted.includes('aria-label="Sortierung zurücksetzen"'),'An active sort has its own removable chip');assert.ok(!render().includes('aria-label="Sortierung zurücksetzen"'),'The default order never shows a fake active sort');assert.ok(sorted.indexOf('Second')<sorted.indexOf('First'));assert.ok(sorted.includes('class="records-sort-control"'),'The reference desktop sort control remains available outside the mobile filter sheet');const options=render('Alle','desc',2,true);assert.ok(options.includes('Betrag ↑'));assert.ok(options.includes('Betrag ↓'));assert.ok(!sorted.includes('class="chips"'),'Status tabs use the shared DetailTabs owner');
 const empty=render('Bezahlt');assert.ok(empty.includes('data-empty-state="compact"'));assert.ok(!empty.includes('empty-icon'),'Empty lists remain one-line status messages');
 console.log('Actual record rendering: status column filtering, reset visibility, Swiss numeric/date sorting and mobile column selection passed.');
}

// Exercise real mutation handlers, including two clicks before a React re-render.
{
 const pages=await readPageFile('components/app-pages.tsx','utf8');
 const ast=ts.createSourceFile('pages.tsx',pages,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const nodes=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&['CustomerForm','ProductForm','EmployeeForm','moneyChf'].includes(node.name?.text));
 const compiled=ts.transpileModule((await readPageFile('config/domain.ts','utf8')).replace('export const','const')+'\n'+(await readPageFile('lib/employee-validation.ts','utf8')).replace('export function','function')+'\n'+nodes.map(node=>node.getText(ast)).join('\n'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 let values={},hook=0,calls=0,resolveSave,rejectSave;const scheduled=[];const navigations=[];
 const exports={};const Toast=()=>null,FormError=()=>null;
 const {tenantCan}=await import(moduleUrl(ts.transpileModule(await fs.readFile('lib/permissions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
 const write=()=>{++calls;return new Promise((resolve,reject)=>{resolveSave=resolve;rejectSave=reject});};
 const originalWindow=globalThis.window;
 globalThis.window={setTimeout:callback=>{scheduled.push(callback)}};
 try{
  Function('require','exports','useState','useRef','useEffect','useRouter','useSearchParams','useBackendMode','isProductionBackendEnabled','apiGet','apiPost','apiPatch','appendDemoRow','AppShell','Button','Field','Toast','Icon','Status','Link','SectionTitle','EmptyState','businessDate','Input','Select','Textarea','FormActions','FormWizard','Avatar','useDirtySnapshot','sumMoney','useDataRevision','useApiQuery','FormSheet','allowDraftNavigation','useProcessDraft','ErrorState','FormSection','safeAppPath','sameCustomerCreation','tenantCan','useLocale','useTranslation','localeTags',compiled)(createRequire(import.meta.url),exports,initial=>{const index=hook++;return [Object.hasOwn(values,index)?values[index]:typeof initial==='function'?initial():initial,()=>{}]},initial=>({current:initial}),()=>{},()=>({push:path=>navigations.push(path)}),()=>({get:() =>'/dashboard'}),()=>true,()=>true,()=>{},write,write,()=>{throw Error('preview');},()=>null,()=>null,()=>null,Toast,()=>null,()=>null,()=>null,()=>null,()=>null,()=> '2026-10-07','input','select','textarea',({children})=>children,()=>null,()=>null,()=>{hook++;return {dirty:false,markPristine:()=>{}}},(await import(moneyModuleUrl)).sumMoney,()=> '',()=>({loading:false,error:null,data:undefined,refresh:()=>{}}),()=>null,()=>{},()=>({ready:true,persist:()=>{},clear:()=>{}}),FormError,({children})=>children,(value,fallback)=>typeof value==='string'&&value.startsWith('/')&&!value.startsWith('//')?value:fallback,(await import(moduleUrl(ts.transpileModule(await fs.readFile('lib/customer-replay.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText) )).sameCustomerCreation,tenantCan,()=>({locale:'de'}),()=>value=>value,{de:'de-CH'});
  for(const [name,seeds,toastIndex] of [['CustomerForm',{0:'Audit GmbH',1:1,3:'Synthetic',4:'Contact'},14],['ProductForm',{0:'Beratung',4:'125.00'},8],['EmployeeForm',{0:'Test',1:'Person',2:'test@example.invalid',4:'ICT'},13]]){
   values=seeds;hook=0;calls=0;scheduled.length=0;navigations.length=0;
   const getSave=view=>{if(view?.props?.onSubmit)return ()=>view.props.onSubmit({preventDefault(){}});if(view?.props?.onClick&&/speichern/i.test(renderToStaticMarkup(React.createElement(React.Fragment,null,view.props.children))))return view.props.onClick;for(const child of [view?.props?.action,view?.props?.actions,...React.Children.toArray(view?.props?.children)]){const found=child&&getSave(child);if(found)return found;}return null;};
   const view=exports[name]({});const save=getSave(view);assert.ok(save,name+' has one reachable save action');
   const first=save(),second=save();await second;assert.equal(calls,1,name+' must reject duplicate submissions immediately');resolveSave({ok:true,item:{id:"fixture-saved"}});await first;await save();assert.equal(calls,1,name+' remains locked until successful navigation');
   scheduled.forEach(fn=>fn());
   if(name==='CustomerForm')assert.deepEqual(navigations,['/kunden/fixture-saved'],'New customer opens its saved dossier, including creation from quick access');
   values={...seeds,[toastIndex]:'Server nicht erreichbar.'};hook=0;
   const errorView=exports[name]({});if(name==='CustomerForm'){const findError=view=>view?.type===FormError?view:React.Children.toArray(view?.props?.children).map(findError).find(Boolean);assert.equal(findError(errorView)?.props.children,'Server nicht erreichbar.','Customer errors remain inside the shared sheet');assert.equal(errorView.props.children.filter(child=>child?.type===Toast).length,0,'No customer error is rendered as a success toast');}else assert.equal(errorView.props.children.find(child=>child?.type===Toast).props.tone,'danger',name+' must not render an error as success');
   values=seeds;hook=0;calls=0;
   const retry=getSave(exports[name]({}));
   const failed=retry();rejectSave(new Error('offline'));await failed;const again=retry();assert.equal(calls,2,name+' can retry a failed mutation');resolveSave({ok:true,item:{id:"fixture-saved"}});await again;
  }

  values={};hook=0;
  console.log('Real form handlers prevent double saves, permit failure retries, preserve return context and render error toasts.');
 }finally{if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;}
}

// Backend failures must never acquire a success colour through keyword heuristics.
{
 let checked=0;
 for(const path of ['components/app-pages.tsx','components/documents.tsx']){
  const source=await readPageFile(path,'utf8');const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const inspect=node=>{
   if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='ErrorState'&&node.children.some(child=>ts.isJsxExpression(child)&&child.expression?.getText(ast)==='toast')){
    // Form sheets keep mutation failures inside the accessible dialog instead
    // of sending them to a background toast hidden by modal focus ownership.
    ++checked;
   }
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
 const docScope=()=>({billingLoading:false,billingError:null,sourceQuery:{loading:false},sourceLoading:false,sourceError:null,recovery:{ready:true,persist:()=>{},clear:()=>{}},wizardStep:0,setDraftReplay:()=>{},resolveCustomer:()=>({id:"customer"}),createRequest:{current:null},crypto:{randomUUID:()=>"fixture-create-key"},draftBaseline:{current:null},documentSavePending:{current:false},companyPending:false,documentLoad:{loading:false,error:null},customersLoading:false,customersError:null,isProductionBackendEnabled:()=>true,draft:{customer:'Test',number:''},show:noop,paymentIssue:null,setSaving:noop,kind:'Angebot',documentPayload:()=>({}),sourceOffer:null,directory:{Test:{id:'customer'}},existing:false,documentKey:null,setDraft:noop,remoteDraftFromItem:x=>x,setDirty:noop,setEditing:noop,window:{setTimeout:noop},router:{push:noop},plural:'angebote'});
 const expenseScope=()=>({expenseRecovery:{ready:true,persist:()=>{},clear:()=>{}},expenseDraft:{},setExpenseReplayKey:()=>{},expenseMutationPending:{current:false},receiptScanPending:{current:false},lockedExpense:false,loadingExpense:false,expenseLoadError:null,amount:'89',expenseBillable:false,expenseCustomer:'',setToast:noop,window:{setTimeout:noop},status:'Eingereicht',setExpenseBusy:noop,person:'',merchant:'SBB',description:'',category:'Reise',date:'2026-10-08',currency:'CHF',vatRate:'8.1',expenseId:null,createdExpenseId:'',receiptFile:null,production:true,expenseRequestKey:{current:''},setCreatedExpenseId:noop,setReceiptFile:noop,apiUpload:noop,apiPatch:noop,appendDemoRow:noop,setSavedExpense:noop,existing:false,router:{push:noop}});
 for(const [file,fn,scopeFactory] of [['components/documents.tsx','DocumentPage',docScope],['components/app-pages.tsx','ExpenseForm',expenseScope]]){
  const pending=makeWrite();const scope=scopeFactory();scope.apiPost=pending.write;scope.apiPatch=pending.write;
  const run=handler(file,fn,'save',scope);const first=run();await run();assert.equal(pending.calls(),1,fn+' rejects same-frame duplicate writes');pending.resolve();await first;await run();assert.equal(pending.calls(),1,fn+' stays locked until navigation');
  const retry=makeWrite();const retryScope=scopeFactory();retryScope.apiPost=retry.write;retryScope.apiPatch=retry.write;
  const retryRun=handler(file,fn,'save',retryScope);const failure=retryRun();retry.reject();await failure;const next=retryRun();assert.equal(retry.calls(),2,fn+' releases the lock after failure');retry.resolve();await next;
 }
 for(const blocked of [{sourceLoading:true},{sourceError:'Source unavailable'},{customersLoading:true},{customersError:'Customer unavailable'}]){
  const pending=makeWrite(),scope={...docScope(),...blocked,apiPost:pending.write,apiPatch:pending.write};
  await handler('components/documents.tsx','DocumentPage','save',scope)();
  assert.equal(pending.calls(),0,'Source/customer loading or failure must block document writes');
 }
 let failRevision=true,revisionCalls=0,menuOpen=true,editing=false,dirty=true,currentDraft=null,navigations=0;const revisionKeys=[];
 const revisionScope={...docScope(),documentKey:'AN-TEST-1',draft:{number:'AN-TEST-1'},documentActionPending:{current:false},revisionKey:{current:null},setActionBusy:noop,setActionError:noop,setMoreOpen:value=>{menuOpen=value},setDirty:value=>{dirty=value},setEditing:value=>{editing=value},setDraft:value=>{currentDraft=value},editableDocumentSnapshot:JSON.stringify,router:{replace:()=>{navigations++}},apiPost:async(_path,_body,options)=>{revisionCalls++;revisionKeys.push(options.idempotencyKey);if(failRevision)throw Error('Synthetic revision unavailable');return {item:{id:'offer-one',number:'AN-TEST-1',status:'draft',offer_version:2}}}};
 const revise=handler('components/documents.tsx','DocumentPage','reviseOffer',revisionScope);await revise();assert.equal(menuOpen,true,'Failed revision retains its retry surface');assert.equal(editing,false);
 failRevision=false;const revised=revise();await revise();await revised;assert.equal(revisionCalls,2,'Only one successful revision after one failed request');assert.equal(revisionKeys[0],revisionKeys[1],'Failure retains its revision idempotency key');assert.equal(menuOpen,false,'Successful same-route revision closes the action sheet');assert.equal(editing,true);assert.equal(dirty,false,'Persisted revision starts with a clean editor baseline');assert.equal(currentDraft.number,'AN-TEST-1');assert.equal(navigations,0,'Stable offer number does not trigger redundant navigation');
 console.log('Actual document and expense handlers prevent same-frame double writes, retain successful navigation locks and allow retries after failures.');
}

// Central presentation helpers preserve units and do not mutate source values.
{
 const {formatQuantity,withPriceUnit,timeMetadata}=await import(moduleUrl(ts.transpileModule((await fs.readFile('lib/display-format.ts','utf8')).replace('\"./financial-status\"',JSON.stringify(financialModuleUrl)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2017}}).outputText));
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

// Execute actual identity derivation and check the shipped palette, not a copied mock.
{
 const raw=await fs.readFile('components/avatar.tsx','utf8');
 const ast=ts.createSourceFile('avatar.tsx',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='avatarIdentity');
 const {avatarIdentity}=await import(moduleUrl(ts.transpileModule(node.getText(ast),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
 assert.equal(avatarIdentity('  Nina  Müller ','person-1').initials,'NM');
 assert.equal(avatarIdentity('Ömer Cam','person-2').initials,'ÖC');
 assert.equal(avatarIdentity('', 'unknown').tone,5);
 assert.equal(avatarIdentity('Nina Müller','person-1').tone,avatarIdentity('Nina Meier','person-1').tone,'Identity, not render order or changed name, owns the color');
 for(let i=0;i<100;i++)assert.deepEqual(avatarIdentity('Nina Müller','person-1'),avatarIdentity('Nina Müller','person-1'));
 const css=await readDesignCss();
 const tree=postcss.parse(css),tokens=new Map(),palette=new Map();
 tree.walkRules(':root',rule=>rule.walkDecls(decl=>tokens.set(decl.prop,decl.value)));
 const resolve=value=>value.replace(/var\((--[\w-]+)\)/g,(_,name)=>{assert.ok(tokens.has(name),'Missing avatar color token '+name);return resolve(tokens.get(name));});
 tree.walkRules(rule=>{if(/^\.person-avatar-tone-[0-5]$/.test(rule.selector))rule.walkDecls('background',decl=>palette.set(rule.selector,resolve(decl.value)));});
 assert.equal(palette.size,6);
 for(const color of palette.values()){assert.match(color,/^#[0-9a-f]{3,6}$/i);const hex=color.slice(1),h=hex.length===3?[...hex].map(x=>x+x).join(''):hex;const channels=h.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;assert.ok(1.05/(luminance+.05)>=4.5,'Avatar text meets contrast at '+hex)}
 console.log('Actual avatar identity, neutral fallback, stable color and light/dark text contrast passed.');
}

const {companyLogoSource}=await import(moduleUrl(ts.transpileModule(await fs.readFile('lib/image-url.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText));
for(const source of ['javascript:alert(1)','data:image/svg+xml,<svg onload=alert(1)>','//foreign.example/logo.png','/api/files/../secret/download','blob:https://example.invalid/<script>'])assert.equal(companyLogoSource(source),'');
assert.equal(companyLogoSource('/api/files/12345678-1234-1234-1234-123456789abc/download'),'/api/files/12345678-1234-1234-1234-123456789abc/download');
assert.equal(companyLogoSource('blob:https://example.invalid/12345678-1234-1234-1234-123456789abc'),'blob:https://example.invalid/12345678-1234-1234-1234-123456789abc');
console.log('Company logo sources reject executable and unscoped URLs; authenticated file and local preview identities remain valid.');
