import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';

const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
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
assert.ok(responsiveCss.includes('.desktop-search-trigger kbd{display:none}'),'Medium desktop header must compact the search trigger instead of removing the account controls');
console.log('Medium desktop keeps search, notifications and account/logout access in the header.');

const uiSource=await fs.readFile('components/ui.tsx','utf8');
const baseCssSource=await fs.readFile('app/styles/base.css','utf8');
assert.ok(uiSource.includes('strokeWidth: 2'),'Shared icons must use pixel-stable strokes');
assert.ok(uiSource.includes('vectorEffect: "non-scaling-stroke"'),'Shared icons must keep stroke width stable while scaling');
assert.ok(baseCssSource.includes('.desktop-notification-button>svg'),'Header icons must use a fixed integer SVG size');
console.log('Small SVG icons use crisp pixel-stable rendering.');

assert.ok(!responsiveCss.includes('max-width:767px'),'Responsive system must not introduce a second mobile breakpoint at 767px');
assert.ok(!responsiveCss.includes('min-width:720px'),'Operator mobile tables must not force desktop-width horizontal scrolling');
assert.ok(responsiveCss.includes('Final viewport contract: small <=760, medium 761-1100, wide >=1101'),'Viewport contract must stay explicit and centralized');
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
console.log('Desktop global search stays inline with anchored results and no modal trigger.');
