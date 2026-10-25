import {assertRowPresentation} from './row-presentation-contract.mjs';
import {verifyFinalResponsiveSample} from './final-responsive-browser.mjs';
import {verifyDocumentDiscountBrowser} from './document-discount-browser.mjs';
import {verifyBusinessReadinessBrowser} from './business-readiness-browser.mjs';
import {verifyAvatarBrowser} from './avatar-browser.mjs';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import {matchesLocalizedRoute,waitForLocalizedRoute} from './localized-route-contract.mjs';
import {waitForLabReady} from './shared-control-browser.mjs';
import {measureListFrameBorders,verifyListFrameMeasurement,measureMetricDividers,measureOpenSectionShapes} from './shared-control-browser.mjs';
import {selectAppOption,appControlValue} from './app-select-browser.mjs';
const periodNames={1:'Aktueller Monat',3:'Letzte 3 Monate',6:'Letzte 6 Monate',12:'Letzte 12 Monate'};
async function chooseStatisticPeriod(page,scope,months){const control=scope.locator('.bo-period-control');await control.waitFor({state:'visible'});if(await control.locator('.bo-period-mobile').isVisible()){await control.locator('.bo-period-mobile').click();const sheet=page.getByRole('dialog',{name:'Zeitraum',exact:true});await sheet.getByRole('radio',{name:periodNames[months],exact:true}).click();await sheet.waitFor({state:'detached'});await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-modal-overlay'));}else await control.getByRole('button',{name:periodNames[months],exact:true}).click();assert.equal(await control.locator('.bo-period-segments button[aria-pressed=true]').getAttribute('aria-label'),periodNames[months],'One active period follows the actual shared control');}
async function openStatisticCalendar(page,scope){const control=scope.locator('.bo-period-control');await control.waitFor({state:'visible'});if(await control.locator('.bo-period-mobile').isVisible()){await control.locator('.bo-period-mobile').click();await page.getByRole('dialog',{name:'Zeitraum',exact:true}).getByRole('radio',{name:'Individueller Zeitraum',exact:true}).click();}else await control.getByRole('button',{name:'Individueller Zeitraum',exact:true}).click();return page.getByRole('dialog',{name:'Zeitraum',exact:true});}
async function openDocumentHistory(page){const details=page.locator('.document-detail-view details').filter({has:page.locator('summary',{hasText:'Weitere Angaben'})});await details.waitFor({state:'attached'});if(await details.getAttribute('open')===null)await details.locator('summary').click();}
async function assertReturnPosition(page,target){try{await page.waitForFunction(y=>Math.abs(scrollY-y)<=1,target);}catch(error){console.log('Return position mismatch',await page.evaluate(expected=>({expected,actual:scrollY,height:document.documentElement.scrollHeight,viewport:innerHeight,path:location.pathname}),target));throw error;}}
async function chooseRecordFilter(page,value){await selectAppOption(page.getByRole('combobox',{name:'Filter',exact:true}),value);}
import {verifyStableAppNavigation} from './app-workspace-browser.mjs';
import {verifyRecordTools} from './task-controls-browser.mjs';
import {identity as complianceIdentity} from './compliance/identity.mjs';
import {measureCompliance} from './compliance/measure.mjs';
import {fixtureCase} from './compliance/fixtures.mjs';
import {writeTestOutput} from './test-output.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import PDFDocument from 'pdfkit';
import {pathToFileURL} from 'node:url';
import {monitoringFixture} from './observability-fixture.mjs';
import {fullRoutes} from './qa-plan.mjs';
import {saveDomEvidence} from './ux-dom-evidence.mjs';
import {verifyMobileLoginGeometry} from './auth-ux-browser.mjs';
import {assertCustomerHub,verifyCustomerStates} from './customer-ux-browser.mjs';
import {assertNavigationToggle,verifyNavigationPersistence,assertFlatMobileNavigation,verifyFlatNavigationAdversaries} from './navigation-ux-browser.mjs';
import {verifyPreviewControls} from './document-controls-browser.mjs';
import {verifyTimeWorkspace} from './time-workspace-browser.mjs';
import {openSettingsEditor,assertMobileHeaderTargets,assertChatTargets,assertOpaqueChrome,verifyHeaderTargetRegression,waitForFiniteAnimations,assertPresentationControls,verifyPresentationControlRegression,assertCanonicalClosedFields} from './shared-control-browser.mjs';

// Synthetic UI fixtures: real business/RLS integration is covered by migration-test.mjs.
// No request reaches a production system; unhandled fixture APIs fail closed.
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser';
const finalSample=process.env.BINSO_UX_FINAL_SAMPLE==='1';
const finalLocale=process.env.BINSO_UX_FINAL_LOCALE??'de';
if(!['de','en','fr','it'].includes(finalLocale)||!finalSample&&finalLocale!=='de')throw Error('Final sample locale requires the bounded final sample mode');
const previewState=process.env.BINSO_UX_PREVIEW_STATE;
if(previewState&&(previewState!=='error'||process.env.BINSO_UX_MATRIX_ONLY!=='1'))throw Error('Preview state requires the isolated matrix-only error case');
// Keep period assertions valid as the real Swiss calendar advances; never freeze
// Date.now, which would corrupt timer/recovery interactions in the same suite.
const statisticToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const [statisticYear,statisticMonth]=statisticToday.split('-').map(Number);
const previousStatisticFrom=new Date(Date.UTC(statisticYear,statisticMonth-2,1)).toISOString().slice(0,10);
const previousStatisticTo=new Date(Date.UTC(statisticYear,statisticMonth-1,0)).toISOString().slice(0,10);
const cashFixture=(income=200)=>{
 const fixture=process.env.BINSO_UX_FIXTURE_CASE?fixtureCase(process.env.BINSO_UX_FIXTURE_CASE):null;
 const cash=fixture?{...fixture.cash,payments:fixture.cash.payments.map(p=>({...p,payment_date:statisticToday})),outflows:fixture.cash.outflows.map(p=>({...p,payment_date:statisticToday}))}:{payments:[{payment_date:previousStatisticFrom,amount:120},{payment_date:statisticToday,amount:income}],outflows:[{payment_date:statisticToday,amount:50}],incomplete:false};
 const issued=fixture?.invoices.filter(item=>!['draft','cancelled'].includes(item.status))??[];
 const gross=issued.reduce((sum,item)=>sum+item.total,0),paid=issued.reduce((sum,item)=>sum+item.paid_amount,0);
 const financial=fixture?{revenueEvents:gross?[{date:statisticToday,amount:gross}]:[],snapshot:{as_of:statisticToday,paid,open:gross-paid,overdue:0,credit_balance:0}}:dataPaymentMode?{revenueEvents:[{date:previousStatisticFrom,amount:120},{date:statisticToday,amount:invoice.total}],snapshot:{as_of:statisticToday,paid:Math.min(invoice.total,income)+120,open:Math.max(0,invoice.total-income),overdue:0,credit_balance:Math.max(0,Math.round((income-invoice.total)*100)/100)}}:{revenueEvents:[{date:previousStatisticFrom,amount:240},{date:statisticToday,amount:400}],snapshot:{as_of:statisticToday,paid:440,open:180,overdue:20,credit_balance:0}};
 return {refunds:[],...cash,financial};
};

await fs.mkdir(output,{recursive:true});
const port=process.env.BINSO_UX_PORT??'3200';
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:'+port;
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Synthetic UI fixtures must never target production');
if(process.env.BINSO_UX_COMPLIANCE==='1'&&!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Compliance fixtures require an isolated loopback test server');
const uiAuth=await createUiAuthFixture();
let server;
if(!process.env.BINSO_BASE_URL){
  let occupied=false;try{occupied=(await fetch(base+'/api/health')).ok;}catch{}
  if(occupied)throw new Error('QA port is occupied; supply BINSO_BASE_URL deliberately or choose BINSO_UX_PORT. Refusing an unidentified/stale server.');
  server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next',process.env.BINSO_UX_SERVER_MODE??'start',...(process.env.BINSO_UX_SERVER_MODE==='dev'?['--webpack']:[]),'--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe'],env:{...process.env,...uiAuth.env,PORT:port,HOSTNAME:'127.0.0.1'}});
  let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
  for(let attempt=0;;attempt++){
    try{if((await fetch(base+'/api/health')).ok)break;}catch{}
    if(attempt>=240||server.exitCode!==null){server.kill();throw new Error('Test server unavailable: '+logs);}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
}
// Compile scoped development routes before opening clients: the initial webpack
// compilation must not issue Fast Refresh into an in-progress browser scenario.
if(server&&process.env.BINSO_UX_SERVER_MODE==='dev')for(const route of (process.env.BINSO_UX_ROUTES?.split(',')??fullRoutes)){const warm=await fetch(base+route);await warm.text();if(!warm.ok)throw new Error('Development reference failed to compile: '+route+' ('+warm.status+')');}
const browserType=engines[process.env.BINSO_UX_BROWSER??"chromium"];
const launchOptions={headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE&&(process.env.BINSO_UX_BROWSER??'chromium')==='chromium'?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}: {})};
let browser;
const customer={paymentDays:30,id:'customer-one',customer_no:'K-000001',name:'Prüffirma AG',city:'Bern',status:'active',contact_name:'Test Person',email:'test@example.invalid',street:'Teststrasse 1',postal_code:'3000'};
const commercialContract={id:'contract-one',contract_no:'V-TEST-1',name:'Servicevereinbarung',customer_id:'00000000-0000-4000-8000-000000000002',supplier_id:null,project_id:null,party_name:customer.name,start_date:'2026-01-01',end_date:'2026-12-31',status:'draft',notice_days:30,billing_interval:'monthly',notes:'',version:1,is_v26_contract:true,created_by_user_id:'fixture-owner',side:'sale'};
const product={id:'product-one',name:'Beratung',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'};
const employee={id:'employee-one',first_name:'Test',last_name:'Person',email:'mitarbeiterin.mit.langem.namen@internationales-unternehmen.example.invalid',start_date:'2025-01-01',job_title:'ICT',workload_percent:80,weekly_hours:42,status:'active'};
const supplier={id:'supplier-one',supplier_no:'L-000001',name:'Synthetic Partner AG',contact_name:'Synthetic Contact',email:'partner@example.invalid',phone:'',address:'Bern',uid:'',payment_days:30,status:'active',revision:'2026-10-22 12:00:00+00'};
const expense={id:'expense-one',merchant:'SBB',amount:89,currency:'CHF',expense_date:'2026-10-08',status:'submitted',employee_id:employee.id,employee};
const invoice={id:'invoice-one',number:'RE-TEST-1',kind:'invoice',customer_id:customer.id,customer,total:135.13,subtotal:125,vat:10.13,paid_amount:100,currency:'CHF',issue_date:'2026-10-08',due_date:'2026-11-08',status:'partial',items:[{description:'Beratung',quantity:1,unit:'hour',unit_price:125,vat_rate:8.1}]};
const offer={...invoice,id:'offer-one',kind:'offer',number:'AN-TEST-1',status:'sent',valid_until:'2099-12-31',paid_amount:0};
const payment={id:'payment-one',amount:100,currency:'CHF',paid_on:'2026-10-08',method:'bank',status:'booked',customer_id:customer.id,customer,invoice};
const ticket={id:'ticket-one',case_number:'T-TEST-1',subject:'Testanfrage',status:'open',priority:'normal',created_at:'2026-10-08T10:00:00Z',updated_at:'2026-10-08T10:00:00Z'};
const projectSeed={id:'project-one',name:'Cloud Migration',customer_id:customer.id,customer_name:customer.name,status:'active',hours:12.5,hours_budget:120,progress:10,notes:'Synthetic project notes',version:1,source_offer:offer.number};
let projectFixture={...projectSeed};
const collections={customers:[customer],products:[product],employees:[employee],suppliers:[supplier],expenses:[expense],payments:[payment],documents:[invoice,offer],projects:[],time_entries:[]};
// Comparable reference content belongs to the isolated browser fixture only.
// Never seed a tenant/database or change the application response for a screenshot.
if(process.env.BINSO_UX_REFERENCE_DATA==='1'){
 if(process.env.BINSO_UX_MATRIX_ONLY!=='1'||process.env.BINSO_UX_FIXTURE_CASE)throw Error('Reference data requires the isolated matrix-only capture');
 Object.assign(customer,{name:'Alpenblick Architektur AG',contact_name:'Sarah Müller',city:'Bern',email:'sarah@example.invalid'});
 collections.customers=[customer,...[
  ['Aare Elektro GmbH','Marco Keller','Thun','active'],
  ['Studio Nord','Lena Berger','Biel','active'],
  ['Werkraum Kollektiv','David Frei','Zürich','inactive'],
 ].map(([name,contact_name,city,status],index)=>({...customer,id:'reference-customer-'+index,name,contact_name,city,status}))];
}
if(process.env.BINSO_UX_FIXTURE_CASE){
 if(process.env.BINSO_UX_MATRIX_ONLY!=='1')throw Error('Alternative fixtures require matrix-only mode; interaction suites own their mutation fixtures');
 const fixture=fixtureCase(process.env.BINSO_UX_FIXTURE_CASE);
 collections.customers=fixture.customers.map((item,index)=>({...customer,...item,customer_no:'K-'+String(index+1).padStart(6,'0')}));
 collections.documents=fixture.invoices.map((item,index)=>({...invoice,...item,customer:{...customer,...fixture.customers[0]},customer_id:fixture.customers[0]?.id??null,number:'RE-UX-'+String(index+1).padStart(4,'0')}));
}
function customerListFixture(params){
 const normalize=value=>String(value??'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const query=normalize(params.get('q'));
 const status=params.get('status')?.replace(/^eq\./,'');
 const [field='name',direction='asc']=(params.get('order')??'name.asc').split('.');
 const withFinancials=collections.customers.map(customer=>{
  if(params.get('include')!=='financials')return customer;
  const amounts=new Map();
  for(const doc of collections.documents.filter(doc=>doc.kind==='invoice'&&doc.customer_id===customer.id&&!['draft','cancelled'].includes(doc.status)&&doc.issue_date<=statisticToday)){
   const totals=amounts.get(doc.currency)??{currency:doc.currency,revenue:0,open_amount:0};
   totals.revenue+=(doc.issue_date.startsWith(statisticYear+'-')?Number(doc.total):0)-Number(doc.credit_amount??0);
   totals.open_amount+=Math.max(0,Math.max(0,Number(doc.total)-Number(doc.credit_amount??0))-Math.max(0,Number(doc.paid_amount)-Number(doc.refund_amount??0)));
   amounts.set(doc.currency,totals);
  }
  return {...customer,financials:[...amounts.values()],has_open:[...amounts.values()].some(value=>value.open_amount>0)};
 });
 const rows=withFinancials.filter(item=>(!status||item.status===status)&&(!query||normalize([item.name,item.customer_no,item.contact_name,item.email,item.phone,item.city].join(' ')).includes(query))&&(!params.has('outstanding')||item.has_open)).sort((a,b)=>String(a[field]??'').localeCompare(String(b[field]??''),'de-CH')*(direction==='desc'?-1:1));
 const offset=Number(params.get('offset')??0),limit=Number(params.get('limit')??1000);
 return {items:rows.slice(offset,offset+limit),total:rows.length};
}
function recordListFixture(table,params){
 const normalized=value=>String(value??'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 const query=normalized(params.get('q')),status=params.get('status')?.replace(/^eq\./,''),kind=params.get('kind')?.replace(/^eq\./,'');
 const value=(item,field)=>field==='name'&&table==='employees'?[item.first_name,item.last_name].join(' '):field==='employee_name'?[item.employee?.first_name,item.employee?.last_name].join(' '):field==='customer_name'?item.customer?.name:field==='invoice_number'?item.invoice?.number:item[field];
 const [field='created_at',direction='desc']=(params.get('order')??'created_at.desc').split('.');
 const rows=(collections[table]??[]).filter(item=>(!status||item.status===status)&&(!kind||item.kind===kind)&&(!query||normalized(JSON.stringify(item)).includes(query))).sort((a,b)=>{const left=value(a,field),right=value(b,field);return (typeof left==='number'&&typeof right==='number'?left-right:String(left??'').localeCompare(String(right??''),'de-CH'))*(direction==='desc'?-1:1)});
 const offset=Number(params.get('offset')??0),limit=Number(params.get('limit')??1000);
 return {items:rows.slice(offset,offset+limit),total:rows.length};
}
const summary={invoices:[{currency:'CHF',open_amount:35.13,revenue:135.13,open_count:1,overdue_count:0,draft_count:0}],offers:{draft_count:0,actionable_count:1},time:{hours:2.25,invoiced_hours:0,ready_hours:0,unapproved_hours:0},expenses:{ready_amount:0}};
if(process.env.BINSO_UX_FIXTURE_CASE==='empty'){summary.invoices=[];summary.offers.actionable_count=0;}
const fixturePdf=process.env.BINSO_UX_PDF_FILE?await fs.readFile(process.env.BINSO_UX_PDF_FILE):await new Promise(resolve=>{const doc=new PDFDocument({size:'A4'}),chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.text('Invoice fixture page one');doc.addPage().text('Payment fixture page two');doc.end()});
const requestedInteractions=process.env.BINSO_UX_INTERACTIONS?.split(',')??['data','customers','products','employees','documents','finance','time','expenses','chat','billing','header','operator','settings','chrome'];
const hasInteraction=name=>requestedInteractions.includes(name);
let captureQueue=Promise.resolve();
// Matrix tabs intentionally share a browser context. Preference mutations must
// serialize, otherwise their genuine cross-tab storage synchronization races.
let navigationPreferenceQueue=Promise.resolve();
async function withNavigationPreferenceLock(run){
 const previous=navigationPreferenceQueue;let unlock;
 navigationPreferenceQueue=new Promise(resolve=>{unlock=resolve});
 await previous;
 try{return await run()}finally{unlock()}
}
// Parallel route tabs can background the capture tab. Hidden documents suspend
// animation frames; their layout is already measurable and screenshot() flushes it.
async function settleFrames(page){
 await page.evaluate(()=>new Promise(resolve=>{
  let frame=0,deadline=0,done=false;
  const finish=()=>{if(done)return;done=true;document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame);clearTimeout(deadline);document.documentElement.getBoundingClientRect();resolve()};
  const visibility=()=>{if(document.hidden)finish()};
  document.addEventListener('visibilitychange',visibility);deadline=setTimeout(finish,250);
  if(document.hidden){finish();return}frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(finish)});
 }));
}
async function capture(page,options,target=page){
 if(process.env.BINSO_UX_COMPLIANCE==='1')await measureCompliance(page,{output:path.join(output,'compliance'),route:new URL(page.url()).pathname,theme:await page.locator('html').getAttribute('data-theme'),width:page.viewportSize().width,state:'interaction:'+path.basename(options.path),engine:process.env.BINSO_UX_BROWSER??'chromium'});
 const pending=captureQueue.then(async()=>{await page.bringToFront();await page.evaluate(()=>document.fonts.ready);await settleFrames(page);if(process.env.BINSO_UX_SCREENSHOTS!=='0'||/error|overflow/.test(options.path))await target.screenshot(process.env.BINSO_UX_BROWSER==='webkit'?{...options,animations:'allow'}:options);if(target===page&&process.env.BINSO_UX_DOM_EVIDENCE==='1')await saveDomEvidence(page,options.path.replace(/\.png$/,'.json'));});
 captureQueue=pending.catch(()=>{});return pending;
}
async function assertAccountAvatarSpacing(panel){
 const geometry=await panel.locator('.account-sheet-profile').evaluate(el=>{const avatar=el.firstElementChild.getBoundingClientRect(),name=el.lastElementChild.getBoundingClientRect(),style=getComputedStyle(el);return {direction:style.flexDirection,avatarRight:avatar.right,avatarBottom:avatar.bottom,nameLeft:name.left,nameTop:name.top,centerDelta:Math.abs(avatar.x+avatar.width/2-name.x-name.width/2),gap:parseFloat(style.columnGap)}});
 if(geometry.direction==='column'){assert.ok(geometry.nameTop>=geometry.avatarBottom+geometry.gap-1,'Mobile profile preserves the vertical avatar gap');assert.ok(geometry.centerDelta<1,'Mobile profile identity is geometrically centred as in the approved reference');}
 else assert.ok(geometry.nameLeft>=geometry.avatarRight+geometry.gap-1,'Account identity preserves its declared gap after the actual avatar: '+JSON.stringify(geometry));
}
async function actionEvidence(page,name,theme){
 const dialog=page.getByRole('dialog',{name,exact:true});
 await dialog.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});
 if(!process.env.BINSO_UX_BASELINE){
  const rows=await dialog.locator('.action-row').evaluateAll(nodes=>nodes.map(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect(),t=el.querySelector('span').getBoundingClientRect();return {height:r.height,font:c.fontSize,weight:c.fontWeight,gap:c.columnGap,text:t.x,icon:el.firstElementChild.tagName,destructive:el.classList.contains('action-row-danger'),chevron:el.querySelectorAll('svg').length}}));
  assert.ok(rows.length>0,'Entity actions use the central row');
  assert.equal(await dialog.locator('.sheet-menu,.button-danger').count(),0,'No legacy action rows or detached destructive button');
  const labelFont=await dialog.evaluate(el=>getComputedStyle(el).getPropertyValue('--type-label').trim());
  const labelWeight=await dialog.evaluate(el=>getComputedStyle(el).getPropertyValue('--control-label-weight').trim());assert.equal(labelWeight,'500','Shared form label weight remains 500');
  for(const row of rows){assert.ok(row.height>=44);assert.equal(row.font,labelFont);assert.equal(row.weight,labelWeight);assert.equal(row.text,rows[0].text);if(row.destructive)assert.equal(row.chevron,1,'Destructive row has no navigation arrow');}
 }
 await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${name}-actions.png`)});
}
const navigationCaptures=[];
const visualAudit=[];
async function captureNavigation(page,theme,width,withCreate){navigationCaptures.push({theme,width,withCreate,navigation:await page.locator(".bottom-nav").evaluate(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {x:r.x,width:r.width,height:r.height,bottomOffset:innerHeight-r.bottom,position:c.position,borderRadius:c.borderRadius,links:[...el.querySelectorAll("a")].map(a=>a.getAttribute("href"))}})});}
const results=[];const errors=[];const accessibilityFailures=[];let failMutation=false,posts=0,failLedger=false,failSend=false,messagePosts=0,uploads=0,employeeLedgerFixture=false,groupingFixture=false,releaseReceiptScan;
let creditPosts=0,failCredit=false,adjustmentPosts=0,failAdjustment=false;const creditKeys=[],adjustmentKeys=[];
let policyPosts=0,policyRequired=true,policyRole=process.env.BINSO_UX_FIXTURE_CASE==='employee'?'member':['owner','admin','finance'].includes(process.env.BINSO_UX_FIXTURE_CASE)?process.env.BINSO_UX_FIXTURE_CASE:"owner",policyReadOnly=false,failPolicy=false,teamPosts=0,failTeam=false,teamHasInvitation=false,teamHasExpiredInvitation=true;
let failPreferences=false,preferencePosts=0,holdPreference=false,releasePreference,preferenceHeld;
let notificationWrites=0,failNotificationWrite=false,securityUnavailable=false,securityRetryGate=null,sessionDeletes=0;
let dataPaymentMode=false,dataPaymentFailed=false,dataPaymentPosts=0,holdDataRefresh=false,customerIdentityMode=false,losePaymentResponse=false,incompletePaymentResponse=false,stalePaymentBalance=false;const paymentReplays=new Map(),dataRefreshWaiters=[];
let projectSourceMode=false,failProjectSource=false,projectSourceTitle='Synthetic accepted offer',processRecoveryMode=false;
let incompleteProductResponse=false;let failReportDownload=false,reportExports=0;
let projectPosts=0,failProjectCreate=false,loseProjectResponse=false;const projectReplays=new Map();
let revisionPosts=0,failRevision=false,revisedOfferFixture;const revisionKeys=[];
let offerFollowups=[],followupPosts=0,failFollowup=false;
let customerPosts=0,failCustomerCreate=false,loseCustomerResponse=false;const customerReplays=new Map();
let teamMemberRole='member';let supportMessages=[];
const operatorAccount={tenant_id:'tenant-one',tenant:{name:'Prüffirma AG'},plan:'pro',subscription_status:'active',account_status:'active',user_limit:10,updated_at:'2026-10-09'};
const settleLayout=async page=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})))});await settleFrames(page)};
let releaseOldSearch,oldSearchArrived;
let context;
try{
 for(const theme of (process.env.BINSO_UX_THEMES?.split(",")??["light","dark"])){
  projectFixture={...projectSeed};teamMemberRole='member';supportMessages=[];offerFollowups=[];let preferenceTheme=theme;
  operatorAccount.plan='pro';
  browser=await browserType.launch(launchOptions);
  context=await browser.newContext({...(process.env.BINSO_UX_DEVICE?engines.devices[process.env.BINSO_UX_DEVICE]:{}),viewport:{width:1440,height:1000},colorScheme:"dark",serviceWorkers:"block"});
  await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-08'}))},theme);
  await context.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(/^\/api\/documents\/[^/]+\/followups$/.test(p)&&req.method()==='POST'){
    followupPosts++;const body=req.postDataJSON();if(failFollowup)return route.fulfill({status:503,json:{message:'Synthetic reminder unavailable'}});
    if(body.action==='cancel')offerFollowups=offerFollowups.map(item=>({...item,state:'cancelled'}));
    else{assert.equal(body.optIn,true);offerFollowups=[{id:'personal-followup',due_date:body.dueDate,version:1,state:'scheduled'}];}
    return route.fulfill({json:{ok:true}});
   }
   if(p==='/api/health'&&req.method()==='GET')return route.fulfill({json:{status:'ok',sha:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}});
   if(previewState==='error'&&req.method()==='GET'&&p==='/api/customers')return route.fulfill({status:503,json:{message:'Kundendaten vorübergehend nicht verfügbar.'}});
   if(req.method()!=='GET'){
    if(p==='/api/projects'){projectPosts++;const body=JSON.parse(req.postData()),key=req.headers()['idempotency-key'];assert.ok(key,'Project creation carries a stable replay key');assert.equal(body.customerId,'','The minimal internal project needs no artificial customer');assert.ok(body.name.length>=2);await new Promise(resolve=>setTimeout(resolve,150));if(failProjectCreate)return route.fulfill({status:503,json:{message:'Synthetic project creation unavailable'}});if(!projectReplays.has(key))projectReplays.set(key,{id:projectReplays.size?'project-created-'+(projectReplays.size+1):'project-created',name:body.name,customer_id:null});if(loseProjectResponse){loseProjectResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:projectReplays.get(key)}});}
    if(p==='/api/customers'&&req.method()==='POST'){customerPosts++;const body=JSON.parse(req.postData()),key=req.headers()['idempotency-key'];assert.ok(key,'Customer creation carries its recoverable request key');assert.equal(body.contactFirstName,'Synthetic');assert.equal(body.contactLastName,'Contact');assert.ok(body.name.length>=2);assert.equal(body.city,'','Minimal creation does not invent a mandatory city');await new Promise(resolve=>setTimeout(resolve,150));if(failCustomerCreate)return route.fulfill({status:503,json:{message:'Synthetic customer creation unavailable'}});if(!customerReplays.has(key))customerReplays.set(key,{...customer,id:'customer-created-'+(customerReplays.size+1),customer_no:'K-'+String(customerReplays.size+2).padStart(6,'0'),name:body.name,city:body.city});if(loseCustomerResponse){loseCustomerResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:customerReplays.get(key)}});}
    if(p==='/api/products'&&incompleteProductResponse)return route.fulfill({status:201,json:{ok:true}});
    if(req.method()==='PATCH'&&p==='/api/operator/accounts/tenant-one'){const body=JSON.parse(req.postData());if(body.plan)operatorAccount.plan=body.plan;if(body.userLimit)operatorAccount.user_limit=body.userLimit;if(body.subscriptionStatus)operatorAccount.subscription_status=body.subscriptionStatus;return route.fulfill({json:{item:operatorAccount}});}
    if(customerIdentityMode&&req.method()==='PATCH'&&p.startsWith('/api/customers/')){const item=collections.customers.find(item=>item.id===p.split('/')[3]);Object.assign(item,JSON.parse(req.postData()));return route.fulfill({json:{item}});}
    if(req.method()==='PATCH'&&p==='/api/projects/project-one'){const body=JSON.parse(req.postData());if(body.version!==projectFixture.version)return route.fulfill({status:409,json:{message:'Project changed'}});Object.assign(projectFixture,{name:body.name,status:body.status,notes:body.notes,hours_budget:body.hoursBudget,version:projectFixture.version+1});return route.fulfill({json:{item:projectFixture}});}
    if(p==='/api/payments'&&dataPaymentMode){
     dataPaymentPosts++;if(incompletePaymentResponse)return route.fulfill({status:201,json:{}});if(dataPaymentFailed)return route.fulfill({status:503,json:{error:'unavailable',message:'Synthetic payment failed'}});
     const key=req.headers()['idempotency-key'];assert.ok(key,'Financial requests carry a replay key');if(paymentReplays.has(key))return route.fulfill({status:200,json:{item:paymentReplays.get(key)}});
     const body=JSON.parse(req.postData());if(stalePaymentBalance){stalePaymentBalance=false;invoice.paid_amount=Math.round((invoice.paid_amount+1)*100)/100;}
     const balance={openAmount:Math.max(0,Math.round((invoice.total-(invoice.credit_amount??0)-invoice.paid_amount+(invoice.refund_amount??0))*100)/100),paidAmount:invoice.paid_amount,creditAmount:invoice.credit_amount??0,refundAmount:invoice.refund_amount??0};
     if(body.confirmOverpayment){if(JSON.stringify(body.expectedBalance)!==JSON.stringify(balance))return route.fulfill({status:409,json:{error:'payment_balance_changed',message:'Der Zahlungsstand hat sich geändert. Bitte Betrag und Überzahlung erneut prüfen.'}});}
     else if(body.amount>balance.openAmount)return route.fulfill({status:409,json:{error:'payment_exceeds_balance',message:'Unconfirmed overpayment'}});
     invoice.paid_amount=Math.round((invoice.paid_amount+body.amount)*100)/100;const row={...payment,id:'foundation-payment-'+paymentReplays.size,amount:body.amount,paid_on:statisticToday};collections.payments.unshift(row);paymentReplays.set(key,row);summary.invoices[0].open_amount=Math.max(0,invoice.total-invoice.paid_amount);if(losePaymentResponse){losePaymentResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:row}});
    }

    if(p==='/api/documents/AN-TEST-1/revision'){
     revisionPosts++;const key=req.headers()['idempotency-key'];assert.ok(key);revisionKeys.push(key);
     if(failRevision)return route.fulfill({status:503,json:{message:'Synthetic revision unavailable'}});
     revisedOfferFixture={...offer,id:offer.id,number:offer.number,status:'draft',offer_version:2};return route.fulfill({status:201,json:{item:revisedOfferFixture}});
    }
    if(p==='/api/documents/RE-TEST-1/refunds'){
     adjustmentPosts++;adjustmentKeys.push(req.headers()['idempotency-key']);assert.ok(adjustmentKeys.at(-1));
     if(failAdjustment)return route.fulfill({status:503,json:{message:'Synthetic refund unavailable'}});
     const body=JSON.parse(req.postData());invoice.refund_amount=Number(invoice.refund_amount??0)+body.amount;invoice.refunds=[{id:'refund-one',date:body.date,amount:body.amount,reason:body.reason}];return route.fulfill({status:201,json:{item:invoice.refunds[0]}});
    }
    if(p==='/api/documents/RE-TEST-1/send'&&JSON.parse(req.postData()).purpose==='reminder'){
     adjustmentPosts++;const body=JSON.parse(req.postData());adjustmentKeys.push(body.requestKey);assert.ok(body.requestKey);
     if(failAdjustment)return route.fulfill({status:503,json:{message:'Synthetic reminder unavailable'}});
     invoice.reminders=[{id:'reminder-one',stage:1,status:'sent',recipient:body.recipient,amount:invoice.total-invoice.paid_amount,deadline:'2026-10-25',completed_at:'2026-10-15T12:00:00Z'}];return route.fulfill({json:{ok:true}});
    }
    if(p==='/api/documents/RE-TEST-1/credits'){
     creditPosts++;const key=req.headers()['idempotency-key'];assert.ok(key,'Credit booking carries an immutable replay key');creditKeys.push(key);
     if(failCredit)return route.fulfill({status:503,json:{message:'Synthetic credit unavailable'}});
     const body=JSON.parse(req.postData());invoice.credit_amount=Number(invoice.credit_amount??0)+body.amount;
     const credit={number:'GS-2026-000001',date:'2026-10-15',amount:body.amount,reason:body.reason};invoice.credits=[credit];
     return route.fulfill({status:201,json:{item:credit}});
    }
    if(p==='/api/documents/preview')return route.fulfill({body:fixturePdf,contentType:'application/pdf'});
    if(p.startsWith('/api/demo/')||p==='/api/operator/demo-session')return route.fulfill({status:410,json:{error:'demo_retired'}});
    if(p==='/api/expenses'){posts++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:failMutation?503:200,json:failMutation?{message:'Fixture offline'}:{item:{...expense,id:'new-expense'}}});}
    if(p==='/api/support/tickets/ticket-one/messages'){messagePosts++;await new Promise(resolve=>setTimeout(resolve,150));const item={id:'sent-'+messagePosts,author_type:'customer',body:JSON.parse(req.postData()).body,created_at:'2026-10-08T10:00:00Z'};if(!failSend)supportMessages.push(item);return route.fulfill({status:failSend?503:200,json:failSend?{message:'Fixture message offline'}:{item}});}
    if(p==='/api/expenses/scan-receipt'){await new Promise(resolve=>{releaseReceiptScan=resolve});return route.fulfill({json:{merchant:'SBB',total:89,currency:'CHF',date:'2026-10-08',confidence:0.95}});}
    if(p==='/api/files'){uploads++;return route.fulfill({json:{item:{id:'receipt-one'}}});}
    if(p==='/api/settings/team/invitations'||p.startsWith('/api/settings/team/invitations/')||p.startsWith('/api/settings/team/members/')){teamPosts++;await new Promise(resolve=>setTimeout(resolve,150));if(!failTeam&&req.method()==='PATCH')teamMemberRole=JSON.parse(req.postData()).role;if(!failTeam&&req.method()==='DELETE'){if(p.endsWith('/expired-one'))teamHasExpiredInvitation=false;else teamHasInvitation=false;}return route.fulfill({status:failTeam?503:200,json:failTeam?{message:'Fixture team unavailable'}:{ok:true}});}
    if(p==='/api/time-entries/policy'){policyPosts++;return route.fulfill({status:409,json:{error:'independent_review_required',message:'Freigabe folgt der aktiven Teamzuordnung.'}});}
    if(p==='/api/settings/notifications'){notificationWrites++;preferencePosts++;await new Promise(resolve=>setTimeout(resolve,100));if(holdPreference)await new Promise(resolve=>{releasePreference=resolve;preferenceHeld();});return route.fulfill({status:(failNotificationWrite||failPreferences)?503:200,json:(failNotificationWrite||failPreferences)?{message:'Fixture notification unavailable'}:{ok:true}});}
    if(p.startsWith('/api/auth/sessions')){sessionDeletes++;return route.fulfill({json:{ok:true,revoked:1}});}
    if(p==='/api/settings/profile'&&req.method()==='PATCH'){const body=JSON.parse(req.postData());if(body.theme)preferenceTheme=body.theme;return route.fulfill({json:{ok:true,item:{theme:preferenceTheme,language:finalSample?finalLocale:'de'}}});}
    if(p==='/api/operator/logout')return route.fulfill({status:503,json:{message:'Fixture logout unavailable'}});
    if(p==='/api/auth/logout')return route.fulfill({json:{ok:true}});
    return route.fulfill({json:{ok:true,item:product,items:[],tracker:null}});
   }
   if(dataPaymentMode&&holdDataRefresh&&p==='/api/documents')await new Promise(resolve=>dataRefreshWaiters.push(resolve));
   if(securityRetryGate&&["/api/auth/mfa","/api/auth/sessions"].includes(p)&&req.method()==="GET")await securityRetryGate;
   if(securityUnavailable&&["/api/auth/mfa","/api/auth/sessions"].includes(p))return route.fulfill({status:503,json:{message:p.endsWith("mfa")?"Fixture security status unavailable":"Fixture sessions unavailable"}});
   if(projectSourceMode&&p==='/api/documents/AN-TEST-1')return route.fulfill({status:failProjectSource?503:200,json:failProjectSource?{message:'Synthetic source unavailable'}:{item:{...offer,status:'accepted',title:projectSourceTitle}}});
   let data;
   if(p==='/api/auth/register')data={state:'new',context:{plan:null,billingCycle:'monthly',trialDays:14,termsVersion:'2026-10-05',privacyVersion:'2026-10-05.2',dpaVersion:'2026-10-05'}};
   else if(p==='/api/auth/session')data={authenticated:true,...(processRecoveryMode?{user:{id:'process-fixture-user'}}:{}),tenant:{id:'fixture-tenant',role:policyRole,plan:'pro',readOnly:policyReadOnly}};
   else if(p==='/api/settings/team/invitations')data={members:[{user_id:'member-one',name:'Team Person',email:'team@example.invalid',role:teamMemberRole,created_at:'2026-10-08'}],invitations:[...(teamHasInvitation?[{id:'pending-one',email:'pending@example.invalid',role:'member',status:'pending',expires_at:'2099-01-01',created_at:'2026-10-01'}]:[]),...(teamHasExpiredInvitation?[{id:'expired-one',email:'expired@example.invalid',role:'member',status:'pending',expires_at:'2020-01-01',created_at:'2020-01-01'}]:[])],capacityConfigured:true,userLimit:null,plan:'pro'};
   else if(p==='/api/notifications/push')data={enabled:false,publicKey:null,registered:false,stored:false};
   else if(p==='/api/notifications')data={items:[{id:'notification-one',kind:'document',title:'Neue Rechnung',body:'Prüffirma AG',href:'/rechnungen/RE-TEST-1',read_at:null,created_at:'2026-10-09T09:00:00Z'},{id:'notification-two',kind:'announcement',title:'Produktinformation',body:'Testinformation',read_at:'2026-10-08T10:00:00Z',created_at:'2026-10-08T09:00:00Z'}]};
   else if(p==='/api/time-entries/policy'){if(failPolicy)return route.fulfill({status:503,json:{message:'Fixture policy unavailable'}});data={time_approval_required:policyRequired};}
   else if(p==='/api/time-tracker')data={tracker:null};
   else if(p==='/api/settings/profile')data={item:{id:'profile-one',display_name:'Test Person',first_name:'Test',last_name:'Person',phone:'',job_title:'ICT',theme:preferenceTheme,language:finalSample?finalLocale:'de',avatar_url:null},email:'test@example.invalid'};
   else if(p==='/api/settings/security')data={item:{required:false}};
   else if(p==='/api/settings/company')data={item:{name:customer.name,city:'Bern',logo_url:null,email:'firma@example.invalid'}};

   else if(p==='/api/operator/payments')data={items:[{id:'operator-payment-one',paid_on:'2026-10-09',amount:79,currency:'CHF',status:'booked',reference:'Synthetic subscription',tenant:{name:'Prüffirma AG'}}]};
   else if(p==='/api/operator/users')data={items:[{id:'operator-one',display_name:'Fixture Operator',email:'operator@example.invalid',role:'platform_owner',active:true,last_entra_sync_at:'2026-10-09T09:00:00Z'}]};
   else if(p==='/api/operator/accounts')data={items:[operatorAccount]};
   else if(p==='/api/operator/preferences')data={item:{language:null}};
   else if(p==='/api/operator/customers')data={items:[{id:'tenant-one',name:'Prüffirma AG',created_at:'2026-10-09',account:{plan:'pro',account_status:'trial'}},{id:'tenant-two',name:'Zeta AG',created_at:'2026-10-08',account:{plan:'start',account_status:'suspended'}},{id:'tenant-three',name:'Büro AG',created_at:'2026-10-08',account:{plan:'start',account_status:'read_only'}}]};
   else if(p==='/api/operator/tickets')data={items:[{...ticket,tenant:{name:'Prüffirma AG'}}]};
   else if(p==='/api/operator/dashboard')data={stats:{customers_total:2,subscriptions_active:1,trials_active:1,users_active:1,payments_30d:79,monthly_contract_value:79,tickets_open:2,tickets_in_progress:3,tickets_resolved:5},tickets:[{...ticket,tenant:{name:'Prüffirma AG'}}],incidents:[]};
   else if(p==='/api/operator/monitoring')data=monitoringFixture();
   else if(p==='/api/operator/restrictions')data={items:[{id:'restriction-one',tenant_id:'tenant-one',tenant:{name:'Prüffirma AG'},active:true,scope:'write',reason:'Manuelle Prüfung',starts_at:'2026-01-01T00:00:00.000Z',ends_at:null}]};
   else if(p==='/api/operator/announcements')data={items:[]};
   else if(p==='/api/operator/audit')data={items:[{id:'audit-one',createdAt:'2026-10-11T12:03:00Z',userName:'Fixture Operator',userEmail:'operator@example.invalid',action:'operator.entra_login',entityType:'platform_operator',entityId:'operator-one'},{id:'audit-two',createdAt:null,userName:null,userEmail:null,action:'system.check',entityType:null,entityId:null}]};
   else if(p==='/api/operator/tickets/ticket-one')data={item:{id:'ticket-one',tenant:{name:'Prüffirma AG'},status:'open',priority:'normal'},messages:[{id:'public',body:'Öffentliche Nachricht',author_type:'customer',created_at:'2026-10-09',internal:false},{id:'private',body:'Vertrauliche interne Notiz',author_type:'operator',created_at:'2026-10-09',internal:true}]};
   else if(p==='/api/auth/sensitive-access')data={capabilities:[]};
   else if(/^\/api\/employees\/[^/]+\/wages$/.test(p))data={items:[]};
   else if(/^\/api\/employees\/[^/]+\/family$/.test(p))data={children:[],claims:[]};
   else if(p==='/api/absences')data={items:[],total:0,ownEmployeeId:null,mayRequest:false,mayReadTeam:false,mayReview:false};
   else if(p==='/api/absences/context')data={items:[]};
   else if(p==='/api/contracts')data={items:[commercialContract],total:1};
   else if(p==='/api/contracts/contract-one')data={item:commercialContract,conditions:[],documentManifest:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',documentsReady:true,documentCount:0,reviewSnapshot:null};
   else if(p==='/api/auth/invitation')data={email:'eingeladen@example.invalid',organization:customer.name,existingAccount:false};





   else if(p==='/api/settings/notifications')data={channels:{email:true,push:false},items:[{kind:'Rechnungen',email:true,push:false}]};
   else if(p==='/api/search'){const term=url.searchParams.get('q');if(term==='old')await new Promise(resolve=>{releaseOldSearch=resolve;oldSearchArrived?.()});data={items:term==='none'?[]:[{type:'Kunde',title:term==='old'?'Veraltetes Ergebnis':'Prüffirma AG',meta:'Bern',href:'/kunden/customer-one',icon:'users'},{type:'Rechnung',title:'RE-TEST-1',meta:'Prüffirma AG',href:'/rechnungen/RE-TEST-1',icon:'receipt'}]};}
   else if(p==='/api/settings/readiness')data=url.searchParams.get('action')==='issue_invoice'?{item:{ready:true,number:url.searchParams.get('number')}}:{item:{dismissed:false,editable:true,requiredComplete:3,requiredTotal:3,tasks:[]}};
   else if(p==='/api/settings/documents')data={item:{vat_rate:8.1,payment_terms_days:30,iban:'CH9300762011623852957',qr_iban:'',invoice_intro_text:'Synthetischer Rechnungstext',invoice_footer_text:'Synthetischer Schlusstext',quote_intro_text:'Synthetischer Angebotstext',quote_footer_text:'Synthetischer Schlusstext'}};
   else if(p==='/api/settings/subscription')data={item:{plan:'pro',subscription_status:'active',account_status:'active',unit_amount_chf:79,user_limit:10,storage_limit_bytes:21474836480,current_period_ends_at:'2026-11-09'}};
   else if(p==='/api/operator/maintenance')data={enabled:false,endsAt:null};
   else if(p==='/api/integrations/status')data={items:[{key:'billing',configured:false}]};
   else if(p==='/api/billing/catalog')data={live:false,demo:false,automaticTax:false,items:[]};
   else if(p==='/api/auth/mfa')data={enabled:true,required:true,role:'owner'};
   else if(p==='/api/auth/passkeys')data={items:[]};
   else if(p==='/api/auth/sessions')data={items:[{id:'session-current',current:true,userAgent:'Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/605.1.15',lastSeenAt:'2026-10-09T09:00:00Z',expiresAt:'2026-11-09T09:00:00Z'},{id:'session-other',current:false,userAgent:'Mozilla/5.0 (Windows) Chrome/130.0',lastSeenAt:'2026-10-08T09:00:00Z',expiresAt:'2026-11-09T09:00:00Z'}]};
   else if(p==='/api/settings/organization')data={organization:{name:customer.name,city:'Bern',country:'CH'}};
   
   else if(p==='/api/finance/overview')data=url.searchParams.get('include')==='workspace'?{...summary,documents:collections.documents,cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),data:{payments:[{payment_date:'2026-09-15',amount:120},{payment_date:'2026-10-05',amount:dataPaymentMode?invoice.paid_amount:200}],expenses:[{expense_date:'2026-09-15',amount:20},{expense_date:'2026-10-05',amount:50}],payroll:[],operatingCosts:[]}}:summary;
   else if(p==='/api/operator/finance')data={payments:[{payment_date:'2026-10-05',amount:200}],subscriptions:[{created_at:'2026-10-05',monthly_revenue_chf:79}],operatingCosts:[{cost_date:'2026-10-05',amount:20}]};
   else if(p==='/api/finance')data={cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),payments:[{payment_date:'2026-09-15',amount:120},{payment_date:'2026-10-05',amount:dataPaymentMode?invoice.paid_amount:200}],expenses:[{expense_date:'2026-09-15',amount:20},{expense_date:'2026-10-05',amount:50}],payroll:[],operatingCosts:[]};
   else if(p==='/api/customers/duplicates')data={items:url.searchParams.get('name')===customer.name?[customer]:[]};
   else if(p==='/api/documents/AN-TEST-1'&&revisedOfferFixture)data={item:revisedOfferFixture};
   else if(/^\/api\/documents\/[^/]+\/followups$/.test(p))data={eligible:(revisedOfferFixture??offer).status==='sent',currentVersion:(revisedOfferFixture??offer).offer_version??1,items:offerFollowups};
   else if(p==='/api/notifications/followups')data={processed:0};
   else if(/^\/api\/documents\/[^/]+\/versions$/.test(p)){if(url.searchParams.has('version'))return route.fulfill({contentType:'application/pdf',body:fixturePdf});data={versions:[{version:1,number:offer.number,created_at:'2026-10-21T10:00:00Z'}],events:[],deliveries:[]};}
   else if(p==='/api/customers')data=customerListFixture(url.searchParams);
   else if(['/api/products','/api/employees','/api/suppliers','/api/expenses','/api/payments'].includes(p))data=recordListFixture(p.split('/')[2],url.searchParams);
   else if(/^\/api\/employees\/[^/]+\/employment$/.test(p))data={items:[]};
   else if(/^\/api\/suppliers\/[^/]+\/resources$/.test(p))data={items:[],assignments:[]};
   else if(/^\/api\/suppliers\/[^/]+\/invoices$/.test(p))data={items:[]};
   else if(/^\/api\/suppliers\/[^/]+\/bank$/.test(p))data={item:{id:supplier.id,iban:null,revision:supplier.revision}};
   else if(p==='/api/reports'){
    if(url.searchParams.get('format')==='csv'){reportExports++;await new Promise(resolve=>setTimeout(resolve,150));if(failReportDownload)return route.fulfill({status:503,json:{message:'Synthetic report export unavailable'}});return route.fulfill({headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="binso-reports-fixture.csv"'},body:'"Kennzahl";"Wert";"Einheit"\r\n'});}
    data={period:{from:statisticToday.slice(0,7)+'-01',to:statisticToday},asOf:new Date().toISOString(),customers:{total:'2',added:'1'},projects:[{status:'active',count:'1'}],time:{hours:'12.5',billable_hours:'10',invoiced_hours:'5'},payments:[{currency:'CHF',amount:'200'}],expenses:[{currency:'CHF',amount:'50'}],employees:{total:'2',active:'2'}};
   }
   else if(p==='/api/workforce-assignments')data={items:[{id:'assignment-one',employee_name:employee.name,customer_name:customer.name,project_name:projectFixture.name,starts_on:'2026-01-01',ends_on:null,revoked_at:null}],employees:[{id:employee.id,name:employee.name,user_id:'member-one'}],members:[{user_id:'member-one',email:'team@example.invalid',role:'member'}]};
   else if(p==='/api/projects')data={items:[projectFixture],total:1};
   else if(p==='/api/projects/project-one')data={item:projectFixture,time:[{id:'project-time',work_date:'2026-10-01',hours:12.5,description:'Synthetic project work',billable:true,approved:true}],totals:{hours:12.5,invoiced_hours:0,entries:1},invoices:[{...invoice,total_amount:invoice.total}]};
   else if(p==='/api/documents')data={items:collections.documents.filter(item=>!url.searchParams.has('kind')||item.kind===url.searchParams.get('kind'))};
   else if(p==='/api/dashboard')data={cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),canFinance:true,recent:[invoice],attention:[],invoices:[invoice],payments:[payment],stats:{customer_count:2},analyticsInvoices:[{issue_date:'2026-10-01',total:135.13,invoice_count:1}],analyticsPayments:[{paid_on:'2026-10-01',amount:dataPaymentMode?invoice.paid_amount:100}]};
   else if(p==='/api/support/tickets')data={items:[ticket]};
   else if(p==='/api/support/tickets/ticket-one/messages')data={items:[...Array.from({length:30},(_,i)=>({id:'message-'+i,author_type:i%2?'support':'customer',body:'Testnachricht '+(i+1)+' – Prüfung des scrollbareren Nachrichtenverlaufs.',created_at:'2026-10-08T10:00:00Z'})),...supportMessages]};
   else if(p==='/api/expenses/options')data={items:[employee]};
   else if(p==='/api/files')data={items:[]};
   else if(p==='/api/time-entries'&&groupingFixture&&!url.searchParams.has('employeeId'))data={items:[{id:'internal',project_name:'Administration',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:false,approved:true},{id:'group-one',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'group-two',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T10:00:00Z',billable:true,approved:true},{id:'other-customer',customer_id:'customer-two',customer_name:'Alpin Systems AG',project_name:'Managed IT Services',duration_minutes:405,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true},{id:'other-project',customer_id:customer.id,customer_name:customer.name,project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T12:00:00Z',billable:true,approved:true,invoiced_invoice_id:'already-invoiced'}]};
   else if(p==='/api/time-entries')data={items:url.searchParams.has('employeeId')?(employeeLedgerFixture?[{id:'employee-time',description:'Modern Workplace',project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T09:00:00Z',approved:true,billable:true}]:[]):[{id:'time-one',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'time-two',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:45,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true}]};
   else if(p.endsWith('/pdf'))return route.fulfill({contentType:'application/pdf',body:fixturePdf});
   else if(/^\/api\/customers\/[^/]+$/.test(p)&&['workspace','hub'].includes(url.searchParams.get('include')))data={counts:{projects:1,offers:1,invoices:1,payments:0,contacts:1,files:0},item:collections.customers.find(item=>item.id===p.split('/')[3]),statistics:[{currency:'CHF',date:statisticToday,paid:dataPaymentMode?invoice.paid_amount:100,billed:invoice.total,invoice_count:1}],contacts:[{id:'contact-one',first_name:'Alex',last_name:'Muster',job_title:'Projektleitung',email:'alex.muster@internationales-unternehmen.example.invalid',phone:'+41315551020',is_primary:true}],documents:[invoice,offer],summary,activity:dataPaymentMode&&invoice.paid_amount>0?[{at:'2026-10-09T12:00:00Z',title:'Zahlung erhalten',detail:'CHF 1’000.00'}]:[]};
   else if(p==='/api/customers/customer-one/contacts')data={items:[{id:'contact-one',first_name:'Alex',last_name:'Muster',job_title:'Projektleitung',email:'alex.muster@internationales-unternehmen.example.invalid',phone:'+41315551020',is_primary:true}]};
   else if(p==='/api/customers/customer-one/activity')data={items:dataPaymentMode&&invoice.paid_amount>0?[{id:'payment-event',title:'Zahlung erhalten',at:'2026-10-09T12:00:00Z',detail:'CHF 1’000.00'}]:[]};
   else if(p==='/api/customers/customer-one/documents')data={items:[invoice,offer]};
   else if(/^\/api\/customers\/[^/]+\/(contacts|activity|documents)$/.test(p))data={items:[]};
   else {
    const [,,collection,id]=p.split('/');const rows=collections[collection];
    if(rows)data=id?{item:rows.find(item=>item.id===id||item.number===id)}:{items:rows};
   }
   if(failLedger&&url.searchParams.has('employeeId'))return route.fulfill({status:503,json:{message:'Fixture ledger unavailable'}});
   if(!data)console.log('Missing isolated API fixture: '+p);
   return route.fulfill({status:data?200:503,json:data??{message:'UI fixture unavailable'}});
  });
  const trackedPage=async()=>{const next=await context.newPage();next.on('pageerror',error=>{if(process.env.BINSO_UX_DEBUG)console.log('PAGE ERROR',error.stack);errors.push(next.url()+': '+error.message)});if(process.env.BINSO_UX_DEBUG)next.on('requestfailed',req=>console.log('FAILED REQUEST',req.url(),req.failure()));return next};
  const listFrameProbe=await context.newPage();try{await verifyListFrameMeasurement(listFrameProbe);}finally{await listFrameProbe.close();}
  let page=await trackedPage();
  // Hard fixture resets use a new document; real Link navigation stays on the same page.
  // WebKit cannot carry Next's old-document RSC prefetch scheduler across page.goto resets.
  const waitForScenarioReady=async target=>{if(new URL(target.url()).pathname==='/dev/ux-lab'&&process.env.BINSO_UX_SERVER_MODE==='dev')await waitForLabReady(target);else await target.waitForLoadState('networkidle');};
  const navigate=async(...args)=>{await waitForScenarioReady(page);assert.deepEqual(errors,[],'Runtime errors before scenario reset');const viewport=page.viewportSize();page.removeAllListeners("pageerror");await page.close();page=await trackedPage();await page.setViewportSize(viewport);const response=await page.goto(...args);await waitForScenarioReady(page);return response};
  if(finalSample){
   results.push(...await verifyFinalResponsiveSample({page,base,theme,locale:finalLocale,navigate:async url=>{await navigate(url);return page;},capture:(target,name)=>capture(target,{animations:'disabled',path:path.join(output,name+'.png'),fullPage:true}),output}));
   assert.deepEqual(errors,[],'Final sample has no browser runtime errors');
   await context.close();context=null;await browser.close();browser=null;continue;
  }
  const routes=fullRoutes;
  await Promise.all((process.env.BINSO_UX_WIDTHS?.split(",").map(Number)??[1440,1024,820,430,375]).map(async width=>{
   console.log(`Checking ${theme} ${width}px`);
   for(const route of (process.env.BINSO_UX_ROUTES?.split(",")??routes)){
    // Independent route cases must not abort the preceding page’s delayed RSC prefetch.
    // Interaction scenarios below still exercise navigation in a persistent page.
    const page=await context.newPage();page.on("pageerror",error=>errors.push(page.url()+": "+error.message));
    await page.setViewportSize({width,height:1000});
    console.log(`Route ${route}`);if(route==='/operator/wallboard'){const anonymous=await browser.newContext({serviceWorkers:'block'});try{await anonymous.addCookies([{name:'binso_operator_demo',value:'1',url:base}]);const denied=await anonymous.newPage();await denied.goto(base+route);await denied.waitForURL('**/operator/login');assert.ok(denied.url().endsWith('/operator/login'),'Legacy demo cookie must not grant wallboard access');}finally{await anonymous.close();}results.push({theme,width,route,passed:true,scope:'legacy-cookie wallboard denial; positive matrix in observability-browser-test.mjs'});await page.close();continue;}const response=await page.goto(base+route);if(route==='/dev/ux-lab'&&process.env.BINSO_UX_SERVER_MODE!=='dev'){assert.equal(response.status(),404,'UX-Lab is never published');results.push({theme,width,route,passed:true,scope:'production 404 guard'});await page.close();continue;}if(route==='/dev/ux-lab'&&process.env.BINSO_UX_SERVER_MODE==='dev')await waitForLabReady(page);else await page.waitForLoadState('networkidle');await page.waitForFunction(()=>!document.querySelector('.app-launch-screen,.app-session-loading,.app-launch'));
    try{await page.locator(route.startsWith('/preview/')?'h1,h2':'h1').filter({visible:true}).first().waitFor({state:'visible'});}catch(error){console.log('Route render failure',route,width,errors,(await page.locator('body').innerText()).slice(0,5000));await capture(page,{path:path.join(output,`${theme}-${width}-${route.replace(/[^a-zA-Z0-9_.-]/g,'_')}-render-error.png`)});throw error;}
    assert.ok(!(await page.locator('body').innerText()).includes('UI fixture unavailable'),`${route}: a missing fixture cannot pass as content acceptance`);
    if(route==='/einstellungen/abonnement')await page.locator('.plan-hero').getByText('Aktiv',{exact:true}).waitFor();
    if(route==='/einstellungen/dokumente'){await page.getByRole('heading',{name:'Rechnungsstandard',exact:true}).waitFor();await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();}
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,`${route}: explicit theme must override system dark mode`);
    if(!process.env.BINSO_UX_BASELINE&&route==='/login'&&width<=760){
      await verifyMobileLoginGeometry(page,{captureCode:process.env.BINSO_UX_CAPTURE_ALL==='1'?()=>capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-auth-email-code.png`),fullPage:true}):undefined});
    }
    if(process.env.BINSO_UX_COMPLIANCE==='1')await measureCompliance(page,{output:path.join(output,'compliance'),route,theme,width,state:process.env.BINSO_UX_FIXTURE_CASE??'normal',engine:process.env.BINSO_UX_BROWSER??'chromium'});
    // Explicit 15 October white-workspace contract; no screenshot baseline is rewritten.
    if(!process.env.BINSO_UX_BASELINE&&theme==='light'){
      const surfaces=await page.locator('.app-root,.operator-root,.page-container,.operator-app-content,.desktop-appbar,.mobile-header,.operator-app-header').evaluateAll(nodes=>nodes.filter(el=>el.getClientRects().length).map(el=>({name:el.className,background:getComputedStyle(el).backgroundColor})));
      assert.ok(surfaces.every(surface=>surface.background==='rgb(255, 255, 255)'),`${route}: white workspace surfaces ${JSON.stringify(surfaces)}`);
    }
    const navigationToggle=page.locator('.desktop-navigation-toggle').filter({visible:true});
    const modal=page.locator('[aria-modal="true"]').filter({visible:true});
    if(!process.env.BINSO_UX_BASELINE&&width>=761&&await navigationToggle.count()&&await modal.count()){
      assert.ok(await modal.last().evaluate(el=>el.contains(document.activeElement)),'Open modal owns keyboard focus');
      assert.ok(await navigationToggle.evaluate(el=>{const box=el.getBoundingClientRect();return !el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2))}),'Modal backdrop blocks desktop navigation pointer access');
    }
    if(!process.env.BINSO_UX_BASELINE&&width>=761&&await navigationToggle.count()&&!await modal.count()){
     await withNavigationPreferenceLock(async()=>{
      await page.waitForFunction(()=>document.querySelector('.desktop-navigation-toggle')?.getAttribute('aria-expanded')==='true');
      await assertNavigationToggle(navigationToggle,false);
      const sidebar=page.locator('.app-sidebar,.operator-sidebar').filter({visible:true});
      await navigationToggle.click();
      assert.equal(await navigationToggle.getAttribute('aria-expanded'),'false','Desktop navigation exposes collapsed state');
      assert.equal(Math.round((await sidebar.boundingBox()).width),68,'Collapsed navigation preserves an accessible icon rail');
      const layout=await page.locator('.app-main,.operator-main').first().boundingBox();
      assert.equal(Math.round(layout.x),68,'Workspace reclaims collapsed navigation space');
      assert.equal(await page.evaluate(()=>localStorage.getItem('binso.desktop-navigation')),'collapsed','Desktop preference survives navigation');
      await navigationToggle.click();
      assert.equal(await navigationToggle.getAttribute('aria-expanded'),'true','Desktop navigation expands again');
     });
    }
    if(!process.env.BINSO_UX_BASELINE&&width<=760)assert.equal(await navigationToggle.count(),0,'Desktop collapse control stays out of the mobile shell');
    const assertRingTotal=async ring=>{const geometry=await ring.evaluate(el=>{const box=el.getBoundingClientRect(),total=el.parentElement.querySelector('.bo-ring-total').getBoundingClientRect(),details=el.parentElement.querySelector('.bo-ring-details');return {separate:total.top>=box.bottom-1||total.left>=box.right-1,totalVisible:total.width>0&&total.height>0,overflow:details.scrollWidth>details.clientWidth+1,center:el.querySelector('.bo-ring-center')!==null}});
      assert.ok(geometry.separate&&geometry.totalVisible&&!geometry.overflow&&!geometry.center,'Ring totals remain readable outside the constrained center on every viewport');};
    if(!process.env.BINSO_UX_BASELINE)for(const ring of await page.locator('.bo-ring-visual').filter({visible:true}).all()){
      await assertRingTotal(ring);
    }

    if(!process.env.BINSO_UX_BASELINE){const disclosure=page.locator('details.financial-snapshot').filter({has:page.locator('.bo-ring-visual')});if(await disclosure.count()){const opened=await disclosure.evaluate(el=>el.open);if(!opened)await disclosure.locator(':scope > summary').click();const ring=disclosure.locator('.bo-ring-visual');await ring.waitFor({state:'visible'});await assertRingTotal(ring);if([390,1440].includes(width))await capture(page,{animations:"disabled",path:path.join(output,`${theme}-${width}-expanded-receivables.png`)});if(!opened)await disclosure.locator(":scope > summary").click();}}
    const geometry=await page.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80),parent:el.parentElement?.className,right:el.getBoundingClientRect().right})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,sort:[...document.querySelectorAll('.toolbar .filter-button')].map(el=>el.getBoundingClientRect().width),metricDividers:[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>getComputedStyle(el).borderLeftWidth)}));
    if(geometry.scroll>width+1||geometry.body>width+1){console.log('Overflow details',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+2).slice(0,30).map(el=>({tag:el.tagName,cls:el.className,width:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX,children:[...el.children].map(c=>({tag:c.tagName,width:c.clientWidth,scroll:c.scrollWidth,rect:c.getBoundingClientRect().width,min:getComputedStyle(c).minWidth,grid:getComputedStyle(el).gridTemplateColumns})),rect:JSON.stringify(el.getBoundingClientRect())}))),null,2));await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-overflow.png`)});}
    assert.ok(geometry.scroll<=width+1&&geometry.body<=width+1,`${theme} ${width} ${route}: horizontal overflow ${JSON.stringify(geometry)}`);
    if(!process.env.BINSO_UX_BASELINE&&width<=760){await assertFlatMobileNavigation(page);if(route==='/dashboard'&&width===390&&!process.env.BINSO_UX_FIXTURE_CASE)await verifyFlatNavigationAdversaries(page);}
    if(!process.env.BINSO_UX_BASELINE){
     const listFrames=await measureListFrameBorders(page);
     if(!listFrames.every(frame=>frame.top==='0px'&&frame.bottom==='0px'))await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-list-frame-error.png`)});
     assert.ok(listFrames.every(frame=>frame.top==='0px'&&frame.bottom==='0px'),`${route} ${theme} ${width}px: list containers have no duplicate leading or terminal separator ${JSON.stringify(listFrames)}`);
     const tables=await page.evaluate(()=>[...document.querySelectorAll('.desktop-record-table')].flatMap(el=>{const box=el.getBoundingClientRect();if(!box.width||!box.height||['hidden','collapse'].includes(getComputedStyle(el).visibility))return [];const headers=el.querySelectorAll('.desktop-record-head,.operator-table-head'),rows=el.querySelectorAll('.desktop-record-row,.operator-table-row');return [{headerCount:headers.length,header:headers.length?getComputedStyle(headers[0]).borderBottomWidth:null,rowCount:rows.length,first:rows.length?getComputedStyle(rows[0]).borderBottomWidth:null,last:rows.length?getComputedStyle(rows[rows.length-1]).borderBottomWidth:null}]}));
     for(const table of tables){
      if(table.headerCount){assert.equal(table.headerCount,1,'A record table has one heading');assert.equal(table.header,'1px','The actual table heading retains its row separator');}
      if(table.rowCount){assert.equal(table.last,'0px','The final table entry has no terminal line');if(table.rowCount>1)assert.equal(table.first,'1px','Separators between actual table entries remain');}
     }
    }
    if(!process.env.BINSO_UX_BASELINE){await assertOpaqueChrome(page);await assertPresentationControls(page);if(width===390&&['/dashboard','/einstellungen/darstellung'].includes(route))await verifyPresentationControlRegression(page);if(width<=760)await assertMobileHeaderTargets(page);}
    if(!process.env.BINSO_UX_BASELINE&&width<=760&&await page.locator('.page-container,.operator-app-content').count()){
      const appearance=await page.locator('.page-container,.operator-app-content').first().evaluate(el=>({ink:getComputedStyle(el).color,surface:getComputedStyle(el).getPropertyValue('--app-surface').trim(),controls:[...el.querySelectorAll('.form-control,.form-textarea')].filter(node=>!['checkbox','radio','file'].includes(node.type)&&!node.closest('.searchbox,.thread-composer,.records-choice-control')).map(node=>({radius:getComputedStyle(node).borderTopLeftRadius,font:getComputedStyle(node).fontSize})),groups:[...el.querySelectorAll('.bo-settings-group-body')].map(node=>({background:getComputedStyle(node).backgroundColor,border:getComputedStyle(node).borderTopWidth}))}));
      assert.equal(appearance.ink,theme==='light'?(route.startsWith('/operator')?'rgb(32, 43, 59)':'rgb(33, 48, 71)'):(route.startsWith('/operator')?'rgb(215, 227, 243)':'rgb(215, 227, 243)'),`${route}: app text uses the central theme`);
      const recordTools=await page.locator('.records-choice-control>.app-select-trigger').evaluateAll(nodes=>nodes.filter(node=>node.getClientRects().length).map(node=>{const css=getComputedStyle(node),box=node.getBoundingClientRect();return {width:box.width,height:box.height,radius:css.borderRadius,icon:!!node.querySelector('svg'),label:node.getAttribute('aria-label')}}));
      for(const tool of recordTools){assert.equal(tool.width,44,'V4 tool touch width');assert.equal(tool.height,44,'V4 tool touch height');assert.equal(tool.radius,'50%','V4 round icon shape');assert.ok(tool.icon&&tool.label,'A record tool retains its icon and accessible label');}
      assert.ok(appearance.controls.every(control=>control.radius==='12px'),`${route}: shared app field corners ${JSON.stringify(appearance.controls)}`);
      assert.ok(appearance.groups.every(group=>group.border==='0px'&&group.background===(theme==='light'?'rgb(255, 255, 255)':'rgb(0, 0, 0)')),`${route}: grouped app surfaces in both themes`);
    }
    const creationShapes=await page.evaluate(()=>[...document.querySelectorAll('.bo-create-action')].flatMap(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height||['hidden','collapse'].includes(c.visibility))return [];const label=el.querySelector('.create-action-label'),short=el.querySelector('.create-action-short');return [{width:r.width,height:r.height,radius:c.borderRadius,background:c.backgroundColor,label:!!label?.getClientRects().length,short:!!short?.checkVisibility()&&short.getBoundingClientRect().width>0&&short.getBoundingClientRect().right<=r.right}]}));
    for(const shape of creationShapes){
      if(width>=761){assert.ok(shape.label,`${route}: desktop creation keeps its visible label`);assert.equal(shape.radius,'12px','Desktop creation follows the shared 12px control shape; mobile FAB geometry remains frozen');assert.equal(shape.background,theme==='light'?'rgb(37, 102, 189)':'rgb(72, 167, 255)');}
      else{assert.equal(shape.label,false,'Mobile creation uses its icon');assert.equal(shape.short,false,'No competing text inside the round action');assert.ok(shape.width>=44&&shape.height>=44,'Creation keeps its touch target');assert.equal(shape.radius,'50%','Approved mobile creation is circular');}
    }
    // Snapshot values in one browser task: query hydration can replace metric nodes between awaited locator calls.
    const moneyDirections=await page.evaluate(()=>[...document.querySelectorAll('.metric-money')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden').map(el=>({direction:getComputedStyle(el).flexDirection,compact:!!el.closest(':is(.app-root[data-ux="master-v3"] .bo-cash-overview,.bo-finance-analysis)[data-compact]')})));
    for(const {direction,compact} of moneyDirections){
      assert.equal(direction,compact?'row':width<=760?'column-reverse':'row',`${route} ${width}px: compact KPIs keep CHF beside the amount; existing other KPI arrangements remain`);
    }
    assert.ok(geometry.sort.every(size=>size<=44),`${route}: sorting control is too wide`);
    const cards=await page.evaluate(()=>[...document.querySelectorAll(':is(.app-root[data-ux="master-v3"] .bo-cash-overview,.bo-finance-analysis)[data-compact] .metric')].map(el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return {height:box.height,padding:style.padding,borders:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth]}}));
    if(cards.length){
      assert.equal(cards.length,4,`${route}: all four compact KPI cards participate in the geometry check`);
      assert.ok(cards.every(card=>card.borders.every(border=>border==='1px')&&Math.abs(card.height-cards[0].height)<1&&card.padding===cards[0].padding),`${route}: approved compact KPI cards have equal heights, padding and thin borders`);
    }
    const otherMetricDividers=(await measureMetricDividers(page)).filter(metric=>!metric.compact);
    assert.ok(otherMetricDividers.every(metric=>parseFloat(metric.left)===0),`${route} ${theme} ${width}px: other metrics retain their existing divider contract ${JSON.stringify(otherMetricDividers)}`);
    for(const sectionShape of await measureOpenSectionShapes(page)){
      assert.equal(sectionShape.radius,sectionShape.compactTimeCard?'16px':'0px',`${route} ${theme} ${width}px: approved mobile time cards retain the shared radius; other open sections retain their existing shape ${JSON.stringify(sectionShape)}`);
    }
    if(!process.env.BINSO_UX_BASELINE&&width<=760){for(const toolbar of await page.locator('.toolbar:has(.searchbox):has(.filter-button)').all()){const search=await toolbar.locator('.searchbox').boundingBox(),filter=await toolbar.locator('.filter-button').boundingBox(),tabs=await toolbar.locator('.chips').boundingBox();assert.ok(filter.x>search.x&&Math.abs(filter.y-search.y)<2&&Math.abs(filter.height-search.height)<2,'Search and filter share a row and height');assert.ok(!tabs||tabs.y>=search.y+search.height,'Status tabs occupy their own row')}}
    if(!process.env.BINSO_UX_BASELINE&&width<=760&&await page.locator('.app-root:not(.app-preview)').count()&&!route.startsWith('/operator')&&!route.startsWith('/support/')){
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const header=await page.locator('.mobile-header').boundingBox();assert.ok(header&&header.y>=-1&&header.y<=1,`${route}: primary header stays visible while scrolling`);
      await page.evaluate(()=>window.scrollTo(0,0));await settleFrames(page);
    }
    if(width<=760&&await page.locator('.mobile-header-detail .mobile-header-title').count()){const titleBox=await page.locator('.mobile-header-detail .mobile-header-title').boundingBox();assert.ok(titleBox&&Math.abs(titleBox.x+titleBox.width/2-width/2)<=1.5,`${route}: detail title is geometrically centered`);}
    if(width<=760&&await page.locator('.mobile-back').count()){const back=page.locator('.mobile-back');assert.ok(await back.isVisible(),`${route}: detail back control is visible`);const icon=await back.locator('svg').boundingBox();assert.ok(icon&&icon.width>=18&&icon.height>=18&&icon.x>=0,`${route}: back icon is not clipped`);}
    if(!process.env.BINSO_UX_BASELINE&&['/dashboard','/finanzen'].includes(route)){
      const ready=await page.waitForFunction(({dashboard})=>{const metrics=document.querySelectorAll('.bo-cash-overview .bo-metric-tiles>.metric').length,actions=[...document.querySelectorAll('.app-section-dashboard .page-actions .bo-create-action')].filter(el=>el.checkVisibility()).length,legacyActions=document.querySelectorAll('.bo-quick-create-links>a').length,bars=document.querySelectorAll('.bo-overview-bars>button').length;return metrics===4&&(dashboard?actions===1:!!document.querySelector('.bo-cash-overview .bo-comparison-card,.bo-cash-overview .empty-state'))?{metrics,actions,legacyActions,bars,analysis:document.querySelectorAll('.bo-ring-chart,.bo-statistics').length}:null},{dashboard:route==='/dashboard'});
      const overview=await ready.jsonValue();await ready.dispose();
      assert.equal(await page.getByText('undefined',{exact:true}).count(),0,'Finance/overview never renders missing fixture values as text');
      assert.equal(overview.metrics,4,'The original overview has four domain metrics');
      assert.equal(overview.analysis,0,'Detailed analysis is kept out of the compact original overview');
      if(route==='/dashboard'){assert.equal(overview.actions,1,'Dashboard has one page-owned creation trigger');assert.equal(overview.legacyActions,0,'Dashboard has no competing legacy quick links');}
      else{
       const overview=page.locator('.bo-cash-overview'),control=overview.locator('.bo-period-control');await control.waitFor();assert.equal(await control.locator('.bo-period-segments>button').count(),5,'Shared 1/3/6/12-month and custom controls remain available');
       const expectedFrom=new Date(Date.UTC(statisticYear,statisticMonth-6,1)).toISOString().slice(0,10),format=day=>new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
       await withNavigationPreferenceLock(async()=>{
        await page.bringToFront();await waitForFiniteAnimations(page);
        await chooseStatisticPeriod(page,overview,6);assert.equal(await control.getAttribute('title'),format(expectedFrom)+' – '+format(statisticToday),'Compact caption reflects the same inclusive calendar window');assert.equal(await overview.locator('.bo-statistics-dates').count(),0,'No duplicate date line');
        await chooseStatisticPeriod(page,overview,1);
       });
      }
    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/finanzen/analyse'){
      assert.equal(await page.locator('.bo-statistics .bo-metric-tiles>.metric').count(),4,'Final V1: income, outflows, cash balance and current receivables');
      assert.equal(await page.locator('.bo-statistics').count(),1,'One central statistics surface');
      assert.equal(await page.locator('.bo-statistics').evaluate(el=>getComputedStyle(el).backgroundColor),width<=760?(theme==='light'?'rgb(255, 255, 255)':'rgb(0, 0, 0)'):(theme==='light'?'rgb(255, 255, 255)':'rgb(0, 0, 0)'),'Statistics follow the app surface on phone/tablet and page surface on desktop');
      assert.equal(await page.locator('.bo-comparison-track').count(),2,'Final V1 uses two actual-value horizontal bars');
      assert.equal(await page.locator('.bo-statistics-line,.bo-statistics-point').count(),0,'The replaced large time-series chart is absent');
      assert.equal(await page.locator('.bo-finance-analysis>.bo-data-disclosure[open]').count(),0,'Both analysis disclosures start closed');
      assert.equal(await page.locator('.revenue-insight,.dashboard-summary,.quick-section,.finance-overview-chart').count(),0,'No competing KPI/chart layout');
    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/kunden/customer-one'){
     // Parallel viewport pages share the real navigation preference. Keep the
     // multi-read dossier geometry inside the same lock as sidebar mutations.
     await withNavigationPreferenceLock(async()=>{
      if(width>=761)await page.waitForFunction(()=>document.querySelector('.desktop-navigation-toggle')?.getAttribute('aria-expanded')==='true');
      await waitForFiniteAnimations(page);
      await assertCustomerHub(page);
      assert.equal(await page.locator('h1').filter({visible:true}).count(),1,'Customer hub has one visible heading');
     });

    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/mitarbeiter/employee-one'){await page.locator('.detail-list').getByText(employee.email,{exact:true}).waitFor();assert.equal(await page.locator('.entity-detail-workspace .settings-profile').count(),0,'The original employee dossier does not repeat its identity in a profile card')}
    if(!process.env.BINSO_UX_BASELINE&&route==='/support/ticket-one'){assert.equal(await page.locator('.thread-composer').count(),0,'Ticket detail never opens the chat implicitly');assert.equal(await page.getByRole('link',{name:'Unterhaltung',exact:true}).count(),1,'Conversation has one explicit entry');}
    if(!process.env.BINSO_UX_BASELINE&&route==='/support/ticket-one?view=conversation'){
      assert.equal(await page.locator('nav.bottom-nav').count(),0,'Chat dedicates the viewport to messages without navigation');
      await assertChatTargets(page);
      await withNavigationPreferenceLock(async()=>{
       if(width>=761){await page.waitForFunction(()=>document.querySelector('.desktop-navigation-toggle')?.getAttribute('aria-expanded')==='true');await waitForFiniteAnimations(page);}
       const before=await page.locator('.thread-composer').boundingBox();await page.locator('.thread-messages').evaluate(el=>{el.scrollTop=0});const after=await page.locator('.thread-composer').boundingBox();assert.deepEqual(after,before,'Only messages scroll; composer stays fixed');
      });
      const visible=await page.evaluate(()=>{const composer=document.querySelector('.thread-composer').getBoundingClientRect(),nav=document.querySelector('.bottom-nav');const limit=nav?.getClientRects().length?nav.getBoundingClientRect().top:innerHeight;return composer.bottom<=limit+1&&composer.top>=0&&scrollY===0});assert.ok(visible,'Chat input stays above navigation in every app viewport');
    }
    if(!process.env.BINSO_UX_BASELINE){await waitForFiniteAnimations(page);await assertCanonicalClosedFields(page,route);}
    for(const label of await page.locator('.detail-list dt').filter({visible:true}).all()){const confined=await label.evaluate(el=>{const r=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].every(text=>text.right<=r.right+1)});assert.ok(confined,`${route}: detail labels never overlap their values`);}
    if(width<=760&&await page.locator('.mobile-header-detail').count()){assert.equal(await page.locator('.mobile-header-title .status').count(),0,'Status never displaces the centered header title');assert.ok(await page.locator('.page-head .status').filter({visible:true}).count()<=1,'One content status badge, without duplicate header status');}
    if(width<=760&&await page.locator('.mobile-header-detail').count())assert.equal(await page.locator('.page-head h1,.desktop-back').filter({visible:true}).count(),0,route+' '+width+': app detail header owns its title/back once, including tablet');
    if(route.endsWith('/neu')&&await page.locator('.mobile-sticky-save').count()){assert.equal(await page.locator('.mobile-sticky-save .button-primary').filter({visible:true}).count(),1,`${route}: form footer action must be reachable`);assert.equal(await page.locator('.page-head .page-actions .button-primary,.mobile-detail-actions .button-primary').filter({visible:true}).count(),0,`${route}: duplicate header save`);}
    if(width<=760&&await page.locator('.app-root:not(.app-preview):not(.app-editing):not(.app-chat)').count()&&!route.endsWith('/neu')&&!route.startsWith('/operator'))assert.equal(await page.locator('nav.bottom-nav').isVisible(),true,`${route}: bottom navigation hidden`);
    if(await page.locator('.app-editing').count())assert.equal(await page.locator('nav.bottom-nav').count(),0,`${route}: capture processes apply the existing visibility contract`);
    if(route==='/operator'&&width>=768){for(const title of await page.locator('.operator-insight-grid .compact-list>a>b').all()){const box=await title.boundingBox();assert.ok(box.width>=80,'Admin activity titles have readable width alongside customer and status');}}
    if(route.startsWith('/operator')){const operatorHeader=page.locator('.operator-app-header');if(await operatorHeader.count()){assert.equal(await operatorHeader.evaluate(el=>getComputedStyle(el).backdropFilter),'none','Operator header has no blur');assert.equal(await page.locator('h1').filter({visible:true}).count(),1,'Admin has one visible primary title on app and desktop viewports');}}
    if(!process.env.BINSO_UX_BASELINE&&width<=760){
     for(const row of await page.locator('.document-summary-row.has-value').filter({visible:true}).all()){
      const geometry=await row.evaluate(el=>{
       const box=selector=>{const node=el.querySelector(selector);return node?.getClientRects().length?node.getBoundingClientRect().toJSON():null};
       const meta=el.querySelector(':scope>small'),amount=el.querySelector('.document-summary-amount'),rect=box('.document-summary-amount');
       let amountFits=false;
       if(amount&&rect){const range=document.createRange();range.selectNodeContents(amount);amountFits=amount.scrollWidth<=amount.clientWidth+1&&[...range.getClientRects()].every(r=>r.left>=rect.left-1&&r.right<=rect.right+1);}
       return {height:el.getBoundingClientRect().height,information:el.classList.contains('is-information'),metadataAmount:el.classList.contains('amount-in-metadata'),metaHidden:!!meta&&getComputedStyle(meta).position==='absolute'&&meta.getBoundingClientRect().width<=1&&meta.getBoundingClientRect().height<=1,title:box(':scope>b'),meta:box(':scope>small'),status:box(':scope>.status'),amount:rect,amountFits,control:box('.document-summary-amount :is(button,input,select,[role="switch"])')};
      });
      if(geometry.amount)assertRowPresentation(geometry,`${route}, ${width}px`);

     }
     if(['/rechnungen/RE-TEST-1','/angebote/AN-TEST-1'].includes(route)){
      const heading=page.locator('.page-head[data-heading-placement="content"],.mobile-header-detail').filter({visible:true});assert.equal(await heading.locator('.status').filter({visible:true}).count(),0,'Document header stays free of the repeated content status');
      const statuses=(await page.locator('.document-detail-view .status').filter({visible:true}).allTextContents()).map(value=>value.trim());
      const expectedStatus=route.startsWith('/rechnungen/')?['Teilweise bezahlt','Ausgestellt',invoice.due_date<statisticToday?'Überfällig':invoice.due_date===statisticToday?'Heute fällig':'Nicht fällig']:['Versendet'];
      assert.deepEqual(statuses.sort(),expectedStatus.sort(),'Each independent payment/document/due axis appears exactly once; no duplicate status in the header');
      if(route.startsWith('/rechnungen/'))assert.equal(await page.getByText('Kein Versandnachweis',{exact:true}).count(),1,'No provider delivery is invented from the invoice state');
      const header=page.locator('.mobile-header-detail');const actions=await header.locator('.mobile-detail-actions,.mobile-page-actions').filter({visible:true}).first().boundingBox(),box=await header.boundingBox();
      assert.ok(actions&&actions.x+actions.width>=box.x+box.width-35,'Document actions stay at the right edge');
     }
    }
    for(const heading of await page.locator('.section-title:has(>.section-title-actions)').filter({visible:true}).all()){
     const boxes=await heading.evaluate(el=>({title:el.querySelector('h2')?.getBoundingClientRect().toJSON(),actions:el.querySelector('.section-title-actions')?.getBoundingClientRect().toJSON(),owner:el.getBoundingClientRect().toJSON()}));
     assert.ok(boxes.title&&boxes.actions);assert.ok(boxes.actions.right<=boxes.owner.right+1&&boxes.actions.left>=boxes.owner.left-1,'Section actions stay inside the shared content width');if(boxes.actions.top<boxes.title.bottom&&boxes.actions.bottom>boxes.title.top)assert.ok(boxes.title.right<=boxes.actions.left+1,'Section title and actions never overlap');
    }
    if(process.env.BINSO_UX_A11Y==='1'&&[375,1440].includes(width)){
      await page.addScriptTag({path:process.env.BINSO_AXE_MODULE});
      const violations=await page.evaluate(async()=>{const {violations}=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return violations.map(({id,impact,description,nodes})=>({id,impact,description,targets:nodes.map(n=>n.target)}))});
      await writeTestOutput(path.join(output,`${theme}-${width}-${route.replace(/[^a-zA-Z0-9_.-]/g,'_')}-a11y.json`),JSON.stringify(violations,null,2));
      const blocking=violations.filter(v=>['serious','critical'].includes(v.impact));
      if(blocking.length){accessibilityFailures.push({route,theme,width,violations:blocking});console.log('A11Y',route,JSON.stringify(blocking));}
    }
  assert.deepEqual(errors,[],'Browser runtime errors');
    results.push({theme,width,route,passed:true});
    if(process.env.BINSO_UX_VISUAL_AUDIT==='1')visualAudit.push({route,width,theme,derived:route.startsWith('/operator')||theme==='dark',observed:await page.evaluate(()=>{
      const root=document.querySelector('.page-container,.operator-app-content')??document.querySelector('main')??document.body;
      const visible=el=>!!el.getClientRects().length;
      return {headings:[...root.querySelectorAll('h1,h2,h3')].filter(visible).map(el=>({tag:el.tagName,text:el.textContent})),surfaceCandidates:[...root.querySelectorAll('section,[class*="card"],[class*="panel"],[class*="surface"]')].filter(visible).flatMap(el=>{
        const css=getComputedStyle(el),box=el.getBoundingClientRect();
        if(box.width<100||box.height<60||parseFloat(css.borderRadius)<10||css.boxShadow==='none'&&parseFloat(css.borderWidth)===0)return [];
        return [{className:el.className,text:el.textContent?.slice(0,100),radius:css.borderRadius,background:css.backgroundColor,border:css.borderWidth,shadow:css.boxShadow,rect:{x:box.x,y:box.y,width:box.width,height:box.height}}];
      })};
    })});
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'||[1440,430].includes(width)&&['/dashboard','/rechnungen','/support/ticket-one','/produkte','/produkte/product-one','/spesen/expense-one','/support','/finanzen','/zeit','/finanzen/analyse','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu'].includes(route))await capture(page,{animations:"disabled",path:path.join(output,`${theme}-${width}-${route.replace(/[^a-zA-Z0-9_.-]/g,'_')}.png`),fullPage:true});
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'&&width<=760&&await page.locator('nav.bottom-nav').isVisible()){const hide=await page.addStyleTag({content:'.page-container{visibility:hidden}'});await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-${route.replace(/[^a-zA-Z0-9_.-]/g,'_')}-nav.png`)},page.locator('nav.bottom-nav'));await hide.evaluate(el=>{el.remove();return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
    await page.waitForLoadState("networkidle");
    assert.deepEqual(errors,[],"Browser runtime errors after rendering");
    page.removeAllListeners("pageerror");await page.close();
   }
  }));
  if(hasInteraction('chrome')&&process.env.BINSO_UX_MATRIX_ONLY!=='1'){
    await verifyNavigationPersistence(page,{base,capture:state=>capture(page,{animations:'disabled',path:path.join(output,theme+'-navigation-'+state+'.png'),fullPage:true})});
   for(const width of [320,375,390,430,768,1024,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/dashboard');
    if(width===390)await capture(page,{animations:'disabled',path:path.join(output,theme+'-390-shared-app-dashboard.png')});
    const create=page.getByRole('button',{name:'Neu erstellen',exact:true}).filter({visible:true});
    await create.waitFor({state:'visible'});
    assert.equal(await create.count(),1,'One visible creation entry point on every viewport');
    await create.evaluate(el=>{window.__creationTrigger=el;window.__creationFocus=[];document.addEventListener('focusin',event=>window.__creationFocus.push({tag:event.target.tagName,label:event.target.getAttribute('aria-label'),className:event.target.className}),true)});
    if(width<=760){
     const geometry=await page.evaluate(()=>{const rect=selector=>document.querySelector(selector).getBoundingClientRect().toJSON(),css=selector=>getComputedStyle(document.querySelector(selector));return {nav:rect('.bottom-nav'),plus:rect('.workspace-command-bar .bo-create-action,.app-section-dashboard .page-actions .bo-create-action'),capsule:css('.mobile-header-actions').backgroundColor,material:css('.bottom-nav').backgroundColor,header:css('.mobile-header').backgroundColor,page:css('.page-container').backgroundColor,blur:css('.mobile-header').backdropFilter,navBlur:css('.bottom-nav').backdropFilter,targets:[...document.querySelector('.bottom-nav').children].map(el=>el.getBoundingClientRect().toJSON())}});
     assert.equal(geometry.header,geometry.page,'Header and page share one opaque canvas');assert.equal(geometry.blur,'none');assert.ok([geometry.page,'rgba(0, 0, 0, 0)'].includes(geometry.capsule),'Header actions use the shared canvas or a transparent surface');assert.equal(geometry.material,theme==='light'?'rgb(255, 255, 255)':'rgb(0, 0, 0)','Flat navigation shares the opaque theme canvas');assert.equal(geometry.navBlur,'none','Flat navigation never restores the old glass blur');await assertFlatMobileNavigation(page);
     assert.ok(geometry.targets.every(t=>t.width>=44&&t.height>=44),'Destinations keep minimum touch targets');
     assert.ok(geometry.plus.bottom<=geometry.nav.top,'Creation belongs to the page above navigation');
     assert.equal(await page.locator('.mobile-dock .bo-create-action,.dock-create-action').count(),0,'Navigation has no attached creation action');
     assert.ok(geometry.plus.right<=width&&geometry.plus.bottom<=740);
     assert.equal(await page.locator('.workspace-command-bar .bo-create-action,.app-section-dashboard .page-actions .bo-create-action').filter({visible:true}).count(),1,'Exactly one page-owned creation trigger is visible');
     assert.equal(await page.locator('.bottom-nav a[href="/projekte"]').count(),1,'Approved navigation V2 keeps orders as a direct destination');await page.locator('.bottom-nav').getByRole('button',{name:'Mehr',exact:true}).click();const more=page.getByRole('dialog',{name:'Mehr',exact:true});await more.getByRole('link',{name:'Finanzen',exact:true}).waitFor();await page.keyboard.press('Escape');await more.waitFor({state:'hidden'});
     await captureNavigation(page,theme,width,true);
    }
    await create.click();const menu=page.getByRole('dialog',{name:'Neu erstellen',exact:true});assert.equal(await menu.locator('h2').count(),1,'One sheet heading');
    await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});await page.waitForFunction(()=>[...document.querySelectorAll('.bo-create-action')].some(el=>el.checkVisibility()&&el===document.activeElement)).catch(async error=>{console.log('Creation focus diagnostics',await page.evaluate(()=>({width:innerWidth,triggerConnected:window.__creationTrigger?.isConnected,trace:window.__creationFocus,active:{tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label'),className:document.activeElement?.className},overlay:document.documentElement.dataset.modalOverlay,creates:[...document.querySelectorAll('.bo-create-action')].map(el=>({visible:el.checkVisibility(),inert:!!el.closest('[inert]'),label:el.getAttribute('aria-label')}))})));throw error});assert.equal(await create.evaluate(el=>el===document.activeElement),true,'Closing creation restores the actual trigger');
    if(width<=760){await navigate(base+'/kunden/customer-one');await captureNavigation(page,theme,width,false);}
   }
   await page.setViewportSize({width:390,height:740});await navigate(base+'/kunden');
   await verifyStableAppNavigation(page);
   const customerCreate=page.getByRole('link',{name:'Neuer Kunde',exact:true}).filter({visible:true});assert.equal(await customerCreate.count(),1,'Customer list has one context-specific creation action');await customerCreate.click();await page.waitForURL(url=>url.pathname==='/kunden/neu');assert.equal(await page.locator('.mobile-dock').count(),0,'Forms do not retain navigation');await page.getByRole('dialog',{name:'Kunde erstellen',exact:true}).getByRole('button',{name:'Abbrechen',exact:true}).click();await waitForLocalizedRoute(page,base+'/kunden');
   await navigate(base+'/kunden/customer-one');assert.equal(await page.locator('.dock-create-action').count(),0,'Entity detail uses its own contextual actions');
   await navigate(base+'/kunden');await verifyRecordTools(page);
   await navigate(base+'/dashboard');await page.locator('.mobile-header').getByRole('button',{name:'Suche',exact:true}).click();const searchView=page.getByRole('dialog',{name:'Suche',exact:true});await searchView.getByLabel('Suchen',{exact:true}).fill('Prüffirma');await searchView.getByLabel('Suchen',{exact:true}).press('Enter');await searchView.getByRole('button',{name:'Suche leeren',exact:true}).click();await searchView.getByRole('heading',{name:'Letzte Suchanfragen',exact:true}).waitFor();await searchView.getByRole('button',{name:'Löschen',exact:true}).click();await searchView.getByRole('button',{name:'Rückgängig',exact:true}).click();await searchView.getByRole('heading',{name:'Letzte Suchanfragen',exact:true}).waitFor();await page.keyboard.press('Escape');
   policyReadOnly=true;await navigate(base+'/dashboard');const readOnlyCreate=page.locator('.workspace-command-bar .bo-create-action,.app-section-dashboard .page-actions .bo-create-action').filter({visible:true});await readOnlyCreate.waitFor({state:'visible'});assert.equal(await readOnlyCreate.count(),1,'Read-only dashboard retains one page-owned support action');assert.equal(await readOnlyCreate.getAttribute('aria-label'),'Support-Anfrage');assert.equal(await readOnlyCreate.getAttribute('href'),'/support/neu?returnTo=%2Fdashboard');assert.equal(await page.locator('.mobile-dock .bo-create-action').count(),0,'Read-only support never returns to navigation');await readOnlyCreate.click();await page.waitForURL(url=>url.pathname==='/support/neu');await page.getByRole('dialog',{name:'Neue Support-Anfrage',exact:true}).waitFor();policyReadOnly=false;
   const originalCreateRole=policyRole;
   try{
    const createContracts={owner:['/kunden/neu','/angebote/neu','/rechnungen/neu','/zeit','/projekte/neu','/zahlungen/neu','/spesen/neu','/produkte/neu','/mitarbeiter/neu','/support/neu'],finance:['/kunden/neu','/rechnungen/neu','/zahlungen/neu','/spesen/neu','/support/neu'],member:['/zeit','/spesen/neu','/support/neu']};
    for(const [role,expectedPaths] of Object.entries(createContracts)){
     policyRole=role;await navigate(base+'/dashboard');
     const trigger=page.locator('.app-section-dashboard .page-actions .bo-create-action').filter({visible:true});
     await trigger.waitFor({state:'visible'});assert.equal(await trigger.count(),1,'One creation trigger for '+role);
     assert.equal(await page.locator('.bo-quick-create-links').count(),0,'No legacy duplicate actions for '+role);
     await trigger.click();const dialog=page.getByRole('dialog',{name:'Neu erstellen',exact:true});await dialog.waitFor();
     const hrefs=await dialog.locator('a[href]').evaluateAll(items=>items.map(item=>item.getAttribute('href')));
     assert.deepEqual(hrefs.map(href=>new URL(href,'https://fixture.invalid').pathname).sort(),[...expectedPaths].sort(),'Independent creation-target contract for '+role);
     for(const href of hrefs)assert.equal(new URL(href,'https://fixture.invalid').searchParams.get('returnTo'),'/dashboard');
     await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    }
   }finally{policyRole=originalCreateRole;}
   await navigate(base+'/operator/sperrungen');const adminDock=await page.locator('.mobile-dock').boundingBox();assert.ok(adminDock.x>=0&&adminDock.x+adminDock.width<=391,'Admin dock remains inside the viewport');assert.equal(await page.locator('.operator-page-head').getByRole('button',{name:'Einschränkung erstellen',exact:true}).filter({visible:true}).count(),1);assert.equal(await page.locator('.mobile-dock .bo-create-action').count(),0,'Operator creation also stays on the page');await page.locator('.operator-mobile-nav').getByRole('button',{name:'Mehr',exact:true}).click();const more=page.getByRole('dialog',{name:'Weitere Admin-Bereiche',exact:true});assert.equal(await more.getAttribute('data-sheet-kind'),'action','Admin navigation uses the shared sheet');await page.setViewportSize({width:390,height:400});await page.waitForFunction(()=>{const el=document.querySelector('[aria-label="Weitere Admin-Bereiche"]');const r=el?.getBoundingClientRect();return r&&r.y>=0&&r.bottom<=401});const box=await more.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=401,'Admin sheet fits a short viewport');await page.keyboard.press('Escape');
   await capture(page,{animations:'disabled',path:path.join(output,theme+'-390-shared-glass-admin.png')});
  }
  if(process.env.BINSO_UX_MATRIX_ONLY==="1"){await context.close();context=null;await browser.close();browser=null;continue;}
  await page.setViewportSize({width:430,height:900});
  if(process.env.BINSO_UX_DEBUG)page.on('response',async response=>{if(response.url().includes('/api/auth/session'))console.log('Session fixture response',response.status(),await response.text())});
  if(hasInteraction('customers')){
    await verifyCustomerStates(page,{base,capture:state=>capture(page,{animations:'disabled',path:path.join(output,theme+'-customer-'+state+'.png'),fullPage:true})});

    customerPosts=0;customerReplays.clear();
    await navigate(base+'/kunden/neu');const customerSheet=()=>page.getByRole('dialog',{name:'Kunde erstellen',exact:true});await customerSheet().waitFor();if(page.viewportSize().width<=760){const spacing=await customerSheet().evaluate(el=>{const grid=el.querySelector('.form-section:not([hidden])>.form-grid'),fields=Array.from(grid.children).filter(child=>child.classList.contains('form-field'));return {gap:fields[1].getBoundingClientRect().top-fields[0].getBoundingClientRect().bottom,expected:parseFloat(getComputedStyle(grid).rowGap)}});assert.ok(spacing.gap>=spacing.expected-1&&spacing.expected>0,'Customer fields use the shared grid gap rather than touching the previous control');}await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await waitForLocalizedRoute(page,base+'/kunden');assert.equal(await page.getByRole('alertdialog').count(),0,'An unchanged customer sheet closes without warning');
    await navigate(base+'/kunden/neu');await customerSheet().getByLabel('Kundenname *',{exact:true}).fill(customer.name);await customerSheet().getByRole('heading',{name:'Mögliche Dubletten',exact:true}).waitFor();await customerSheet().getByLabel('Als separaten Kunden erfassen',{exact:true}).check();await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Minimal Company AG');await customerSheet().getByLabel('Kontaktperson · Vorname *',{exact:true}).fill('Synthetic');await customerSheet().getByLabel('Kontaktperson · Nachname *',{exact:true}).fill('Contact');await customerSheet().getByRole('heading',{name:'Mögliche Dubletten',exact:true}).waitFor({state:'hidden'});assert.equal(await customerSheet().getByText(/^K-\d+/).count(),0,'No generated customer number appears in creation');failCustomerCreate=true;await customerSheet().getByRole('button',{name:'Weiter',exact:true}).click();await page.waitForLoadState('networkidle');assert.equal(customerPosts,0,'Moving to details must never submit a customer');await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await page.getByText('Synthetic customer creation unavailable',{exact:true}).waitFor();assert.equal(customerPosts,1);await customerSheet().getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await appControlValue(customerSheet().getByLabel('Kundenname *',{exact:true})),'Minimal Company AG');await customerSheet().getByRole('button',{name:'Weiter',exact:true}).click();
    await customerSheet().getByLabel('E-Mail',{exact:true}).fill('invalid-email');await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();assert.equal(customerPosts,1,'An invalid optional email cannot submit');await customerSheet().getByLabel('E-Mail',{exact:true}).fill('');
    await page.setViewportSize({width:320,height:400});await customerSheet().getByLabel('Ort',{exact:true}).focus();const customerGeometry=await customerSheet().evaluate(el=>{const header=el.querySelector('.sheet-header').getBoundingClientRect(),footer=el.querySelector('.mobile-sticky-save').getBoundingClientRect();return {headerTop:header.top,footerBottom:footer.bottom,width:el.getBoundingClientRect().width,height:window.innerHeight}});assert.ok(customerGeometry.headerTop>=0&&customerGeometry.footerBottom<=customerGeometry.height+1&&customerGeometry.width<=320,'Customer sheet header and action footer remain reachable in a short narrow viewport');await capture(page,{path:path.join(output,`${theme}-320-400-customer-sheet.png`)},customerSheet());await page.setViewportSize({width:430,height:900});
    failCustomerCreate=false;await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).dblclick();await waitForLocalizedRoute(page,base+'/kunden/customer-created-1');assert.equal(customerPosts,2,'Two completion taps send one customer retry');assert.equal(customerReplays.size,1);
    processRecoveryMode=true;await navigate(base+'/kunden/neu');await page.waitForLoadState('networkidle');const minimalDuplicate=page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname==='/api/customers/duplicates'&&url.searchParams.get('name')==='Minimal Person'});await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Minimal Person');await customerSheet().getByLabel('Kontaktperson · Vorname *',{exact:true}).fill('Synthetic');await customerSheet().getByLabel('Kontaktperson · Nachname *',{exact:true}).fill('Contact');await (await minimalDuplicate).finished();loseCustomerResponse=true;await customerSheet().getByRole('button',{name:'Weiter',exact:true}).click();await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await customerSheet().getByRole('alert').waitFor();assert.equal(customerReplays.size,2);await page.waitForLoadState('networkidle');const restoredDuplicate=page.waitForResponse(response=>{const url=new URL(response.url());return url.pathname==='/api/customers/duplicates'&&url.searchParams.get('name')==='Minimal Person'});await page.reload();await (await restoredDuplicate).finished();await page.waitForFunction(()=>document.querySelector('input[placeholder="Muster AG"]')?.value==='Minimal Person');await customerSheet().getByRole('button',{name:'Weiter',exact:true}).click();await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await waitForLocalizedRoute(page,base+'/kunden/customer-created-2');assert.equal(customerPosts,4);assert.equal(customerReplays.size,2,'Reload recovery returns the same customer without allocating another number');processRecoveryMode=false;
    await navigate(base+'/kunden/neu');await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Unsaved customer');await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(customerSheet().getByLabel('Kundenname *',{exact:true})),'Unsaved customer');await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/kunden');
    await navigate(base+'/kunden/neu');await selectAppOption(customerSheet().getByLabel('Kundentyp',{exact:true}),'person');assert.equal(await customerSheet().getByLabel('Kundenname *',{exact:true}).count(),0,'Private customers do not need a company field');await customerSheet().getByLabel('Vorname *',{exact:true}).fill('Ada');await customerSheet().getByLabel('Nachname *',{exact:true}).fill('Example');await customerSheet().getByRole('button',{name:'Weiter',exact:true}).click();await customerSheet().getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await appControlValue(customerSheet().getByLabel('Vorname *',{exact:true})),'Ada','Step changes preserve private customer identity');await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/kunden');
    await navigate(base+'/kunden');await page.waitForLoadState('networkidle');
    const listActions=page.locator('.page-container');
    await listActions.getByRole('searchbox',{name:'Kunden suchen...',exact:true}).waitFor({state:'visible'});
    assert.equal(await listActions.locator('.records-search-row').getByRole('searchbox',{name:'Kunden suchen...',exact:true}).count(),1,'Search is inline');assert.equal(await listActions.locator('.records-search-row').getByRole('combobox',{name:'Filter',exact:true}).count(),1,'Filter follows search');assert.equal(await page.locator('.workspace-command-bar').getByRole('link',{name:'Neuer Kunde',exact:true}).count(),1,'Context creation is in the shared mobile header');assert.equal(await page.getByRole('link',{name:'Neuer Kunde',exact:true}).count(),1,'Only one creation entry is accessible');assert.equal(await page.locator('.dock-create-action').count(),0,'No navigation-attached create action');
    assert.equal(await page.locator('main select').filter({visible:true}).count(),0,'Mobile sorting remains in its sheet');assert.equal(await listActions.getByRole('tab',{name:'Alle',exact:true}).count(),0,'Status belongs to the shared filter sheet');
    await page.getByPlaceholder('Kunden suchen...').fill('not-present');await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Suche leeren',exact:true}).click();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await verifyRecordTools(page);await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await chooseRecordFilter(page,'Inaktiv');await page.getByText('Keine inaktiven Kunden',{exact:true}).waitFor();await page.getByRole('button',{name:'Filter zurücksetzen',exact:true}).click();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await selectAppOption(page.getByRole('combobox',{name:'Sortieren',exact:true}),'0:desc');await page.locator('.records-active-filters').getByText('Sortierung: Name Z–A',{exact:true}).waitFor();
    await page.locator('.mobile-record-list a').first().click();await waitForLocalizedRoute(page,base+"/kunden/customer-one");await page.goBack();await page.waitForURL(url=>matchesLocalizedRoute(url,base+'/kunden','de'));await page.locator('.records-active-filters').getByText('Sortierung: Name Z–A',{exact:true}).waitFor();
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-customer-list-standard.png`)});
    await page.getByRole('button',{name:'Sortierung zurücksetzen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Sortierung zurücksetzen',exact:true}).count(),0,'Removing the sort chip restores the default');assert.equal(await page.locator('.filter-count').count(),0,'No hidden active filters remain');
    const originalCustomers=[...collections.customers];
    await selectAppOption(page.getByRole('combobox',{name:'Sortieren',exact:true}),'0:asc');
    collections.customers.push(...Array.from({length:55},(_,index)=>({...customer,id:'pagination-'+index,name:'Paging customer '+String(index).padStart(2,'0'),customer_no:'K-PAGING-'+index,city:'Bern'})));
    await page.reload();await page.locator('.mobile-record-list .record-wrapper').nth(49).waitFor({state:'visible'});
    await page.evaluate(()=>{window.scrollTo(0,500);document.querySelector('.mobile-record-list a').click()});await page.waitForURL('**/kunden/pagination-*');await page.goBack();await page.waitForURL(url=>matchesLocalizedRoute(url,base+'/kunden','de'));await page.waitForFunction(()=>window.scrollY>=450);assert.ok(await page.evaluate(()=>window.scrollY)>=450,'Returning to a populated list restores its content scroll position');
    await page.getByRole('navigation',{name:'Listenseiten',exact:true}).getByRole('button',{name:'Weiter',exact:true}).click();await page.getByText('Seite 2 von 2',{exact:true}).waitFor();await page.locator('.mobile-record-list .record-wrapper').nth(5).waitFor({state:'visible'});assert.equal(await page.locator('.mobile-record-list .record-wrapper').count(),6,'The second customer page exposes the remaining authorized rows');
    await page.locator('.mobile-record-list a[href="/kunden/customer-one"]').click();await waitForLocalizedRoute(page,base+"/kunden/customer-one");await page.goBack();await page.waitForURL(url=>matchesLocalizedRoute(url,base+'/kunden','de'));await page.getByText('Seite 2 von 2',{exact:true}).waitFor();await page.locator('.mobile-record-list .record-wrapper').nth(5).waitFor({state:'visible'});assert.equal(await page.locator('.mobile-record-list .record-wrapper').count(),6,'Returning from details restores the active page');
    collections.customers.splice(0,collections.customers.length,...originalCustomers);await page.reload();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'Listenseiten',exact:true}).count(),0,'Reload resets private list context; one restored fixture row needs no pager');
    await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
    const extraFacts=page.locator('.bo-data-disclosure');if(await extraFacts.count()&&!await extraFacts.evaluate(el=>el.open))await extraFacts.locator('summary').click();await page.locator('.detail-list').getByText('K-000001',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Kundenaktionen',exact:true}).filter({visible:true}).click();
    const actions=page.getByRole('dialog',{name:'Kundenaktionen',exact:true});await actions.waitFor();await actionEvidence(page,'Kundenaktionen',theme);
    await actions.getByRole('button',{name:/Kontakt hinzufügen/}).click();
    const contact=page.getByRole('dialog',{name:'Kontakt hinzufügen',exact:true});await contact.waitFor();
    await page.setViewportSize({width:375,height:400});await contact.getByLabel('Funktion',{exact:true}).focus();
    await contact.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});
    const g=await contact.evaluate(el=>({header:el.querySelector('.sheet-header').getBoundingClientRect().top,footer:el.querySelector('.filter-sheet-actions').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth,viewport:innerWidth,height:innerHeight}));
    assert.ok(g.header>=0&&g.footer<=g.height+1&&g.overflow<=g.viewport,'Customer contact form keeps header and actions visible in a short viewport');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-375-400-contact.png`)});
    await page.keyboard.press('Escape');await contact.waitFor({state:'hidden'});await page.setViewportSize({width:430,height:900});
  }
  if(hasInteraction('time')){
  await page.waitForLoadState("networkidle");await navigate(base+'/projekte/neu');await page.waitForLoadState('networkidle');try{await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).waitFor()}catch(error){console.log('Project diagnostics',page.url(),await page.locator('body').innerText(),errors);await capture(page,{animations:'disabled',path:path.join(output,'project-error.png')});throw error;}
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),0,'Project creation has no competing save action');
  assert.equal(await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).count(),1);
  projectReplays.clear();
  const projectSheet=page.getByRole('dialog',{name:'Auftrag starten',exact:true});await projectSheet.getByRole('button',{name:'Schliessen',exact:true}).click();await waitForLocalizedRoute(page,base+"/zeit");assert.equal(await page.getByRole('alertdialog').count(),0,'Untouched project setup closes directly');
  await navigate(base+'/projekte/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Bezeichnung *',{exact:true}).fill('Synthetic internal project');projectPosts=0;failProjectCreate=true;try{await page.getByRole('button',{name:'Auftrag starten',exact:true}).click()}catch(error){console.log('Project submit diagnostics',await appControlValue(page.getByLabel('Bezeichnung *',{exact:true})),await page.locator('body').innerText(),errors);await capture(page,{animations:'disabled',path:path.join(output,'project-submit-error.png')});throw error;}await page.getByRole('alert').getByText('Synthetic project creation unavailable',{exact:true}).waitFor();assert.equal(projectPosts,1);assert.equal(await appControlValue(page.getByLabel('Bezeichnung *',{exact:true})),'Synthetic internal project','A failed create preserves the project draft');
  failProjectCreate=false;await page.getByRole('button',{name:'Auftrag starten',exact:true}).dblclick();await waitForLocalizedRoute(page,base+"/zeit?projectId=project-created");assert.equal(projectPosts,2,'Two completion taps cause exactly one retry request');
  processRecoveryMode=true;await navigate(base+'/projekte/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Bezeichnung *',{exact:true}).fill('Synthetic recoverable internal project');loseProjectResponse=true;await page.getByRole('button',{name:'Auftrag starten',exact:true}).click();await page.getByRole('dialog',{name:'Auftrag starten',exact:true}).getByRole('alert').waitFor();assert.equal(projectReplays.size,2,'The lost reply happened after one committed project');
  await page.waitForLoadState('networkidle');await page.reload();await page.waitForFunction(()=>document.querySelector('input[placeholder="z. B. Cloud Migration"]')?.value==='Synthetic recoverable internal project');await page.getByRole('button',{name:'Auftrag starten',exact:true}).click();await waitForLocalizedRoute(page,base+"/zeit?projectId=project-created-2");assert.equal(projectReplays.size,2,'Reload recovery retries the saved request key without creating another project');assert.equal(projectPosts,4);
  projectSourceMode=true;failProjectSource=true;projectSourceTitle='Synthetic accepted offer';
  await navigate(base+'/projekte/neu?sourceOffer=AN-TEST-1');await page.getByRole('alert').getByText('Synthetic source unavailable',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Auftrag starten',exact:true}).count(),0,'Failed source cannot create a partial fictional project');
  const projectMarker=await page.evaluate(()=>{window.v215ProjectMarker='same-document';return window.v215ProjectMarker});failProjectSource=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByLabel('Bezeichnung *',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('input[placeholder="z. B. Cloud Migration"]')?.value==='Synthetic accepted offer');
  assert.equal(await page.evaluate(()=>window.v215ProjectMarker),projectMarker,'Source retry uses a targeted query, no app reload');assert.equal(await appControlValue(page.getByLabel('Kunde',{exact:true})),'customer-one');assert.equal(await page.getByLabel('Kunde',{exact:true}).isDisabled(),true);
  await page.getByLabel('Bezeichnung *',{exact:true}).fill('Unsaved project draft');projectSourceTitle='Updated server offer';
  const sourceRefresh=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/documents/AN-TEST-1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await sourceRefresh;await page.waitForLoadState('networkidle');assert.equal(await appControlValue(page.getByLabel('Bezeichnung *',{exact:true})),'Unsaved project draft','Source revalidation cannot overwrite the local project draft');
  await page.getByRole('dialog',{name:'Auftrag starten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(page.getByLabel('Bezeichnung *',{exact:true})),'Unsaved project draft');await page.getByRole('dialog',{name:'Auftrag starten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+"/angebote/AN-TEST-1");projectSourceMode=false;processRecoveryMode=false;
  processRecoveryMode=true;await navigate(base+'/projekte');await page.locator('a[href="/projekte/project-one"]:visible').first().waitFor();await page.locator('a[href="/projekte/project-one"]:visible').first().click();await waitForLocalizedRoute(page,base+"/projekte/project-one");
  await page.locator('.bo-detail-meta').getByText('Status',{exact:true}).waitFor();
  const relatedInvoiceHref='/rechnungen/'+encodeURIComponent(invoice.number)+'?returnTo='+encodeURIComponent('/projekte/project-one');const projectInvoice=page.locator('.records a[href="'+relatedInvoiceHref+'"]');await projectInvoice.waitFor();assert.equal(await projectInvoice.getAttribute('href'),relatedInvoiceHref,'Shared related invoice retains exact project return navigation');assert.ok((await projectInvoice.locator('.status').innerText()).trim(),'Related invoices show their existing server status');assert.ok((await projectInvoice.locator('.document-summary-amount').innerText()).includes('CHF'),'Related invoices retain currency and amount');await capture(page,{animations:'disabled',path:path.join(output,theme+'-390-project-related-records.png')});await page.locator('.time-record-list .document-summary-row').getByText('Synthetic project work',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Auftragsaktionen',exact:true}).first().click();await page.getByRole('button',{name:'Bearbeiten',exact:true}).click();let projectEdit=page.getByRole('dialog',{name:'Auftrag bearbeiten',exact:true});await projectEdit.getByRole('button',{name:'Speichern',exact:true}).click({trial:true});await page.bringToFront();const projectSessionRefresh=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/session');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await projectSessionRefresh;await projectEdit.getByRole('button',{name:'Speichern',exact:true}).click({trial:true});await projectEdit.getByLabel('Bezeichnung',{exact:true}).fill('Rechnungen');
  await page.waitForFunction(()=>Object.keys(sessionStorage).some(key=>key.includes('project:edit:project-one')&&JSON.parse(sessionStorage.getItem(key)||'null')?.value?.name==='Rechnungen'));await page.reload();await page.getByRole('button',{name:'Auftragsaktionen',exact:true}).first().click();await page.getByRole('button',{name:'Bearbeiten',exact:true}).click();projectEdit=page.getByRole('dialog',{name:'Auftrag bearbeiten',exact:true});await page.waitForFunction(()=>document.querySelector('[role="dialog"] input')?.value==='Rechnungen');
  await projectEdit.getByRole('button',{name:'Speichern',exact:true}).dblclick();await projectEdit.waitFor({state:'hidden'});await page.getByRole('heading',{name:'Rechnungen',level:1,exact:true}).waitFor();assert.equal(projectFixture.version,2,'Project completion taps create one versioned update');
  processRecoveryMode=false;
  await navigate(base+'/berichte');await page.getByRole('heading',{name:'Aktueller Bestand',exact:true}).waitFor();const reportFrom=new Date(Date.UTC(statisticYear,statisticMonth-3,1)).toISOString().slice(0,10);const reportChanged=page.waitForRequest(request=>{const url=new URL(request.url());return url.pathname==='/api/reports'&&url.searchParams.get('months')==='custom'&&url.searchParams.get('from')===reportFrom&&url.searchParams.get('to')===statisticToday});await chooseStatisticPeriod(page,page.locator('.app-root'),3);await reportChanged;
  reportExports=0;failReportDownload=true;await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();const exportButton=page.getByRole('button',{name:'CSV exportieren',exact:true});await exportButton.click();await page.getByRole('alert').getByText('Synthetic report export unavailable',{exact:true}).waitFor();assert.equal(reportExports,1);failReportDownload=false;
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();const reportDownload=page.waitForEvent('download');await exportButton.dblclick();const exported=await reportDownload;assert.equal(exported.suggestedFilename(),'binso-reports-fixture.csv');assert.ok((await fs.readFile(await exported.path(),'utf8')).startsWith('"Kennzahl";"Wert";"Einheit"'),'Reports save verified CSV content');assert.equal(reportExports,2,'Failure and one deduplicated retry are the only export requests');assert.equal(new URL(page.url()).pathname,'/berichte');


  }
  if(hasInteraction('employees')){
  processRecoveryMode=true;
  await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('button',{name:'Zurück',exact:true}).count(),0,'First wizard step has no dead back button');
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await waitForLocalizedRoute(page,base+"/mitarbeiter");await navigate(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');
  await page.getByLabel('Vorname',{exact:true}).fill('Test');await page.getByLabel('Nachname',{exact:true}).fill('Person');assert.equal(await page.getByLabel('E-Mail',{exact:true}).getAttribute('required'),null,'An employee dossier does not require app access or email');await page.getByLabel('Funktion',{exact:true}).fill('ICT');
  const employeeFooter=await page.locator('.mobile-sticky-save').boundingBox();await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),1,'Employee wizard has one final save');
  await page.getByLabel('Eintritt',{exact:true}).fill('2026-01-01');await page.getByLabel('Austritt',{exact:true}).fill('2026-12-31');await page.getByLabel('Arbeitsort',{exact:true}).fill('Bern');
  const employeeSave=await page.locator('.mobile-sticky-save').boundingBox();assert.equal(employeeSave.y,employeeFooter.y,'Full-page wizard actions remain fixed across steps');assert.ok(employeeSave.y+employeeSave.height<=page.viewportSize().height+1,'Wizard save stays in the visible viewport');await page.getByText('Ferientage',{exact:true}).scrollIntoViewIfNeeded();
  await page.setViewportSize({width:430,height:400});
  await settleLayout(page);
  const shortFooter=await page.locator('.form-wizard .mobile-sticky-save').boundingBox();assert.ok(shortFooter.y>=0&&shortFooter.y+shortFooter.height<=400,'Wizard actions stay visible in a short viewport');
  await page.locator('.wizard-content').evaluate(el=>{el.scrollTop=el.scrollHeight});
  const afterScroll=await page.locator('.form-wizard .mobile-sticky-save').boundingBox();assert.ok(Math.abs(shortFooter.y-afterScroll.y)<2,'Only wizard content scrolls');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-400-employee-wizard.png`)});
  await page.setViewportSize({width:430,height:900});
  await page.reload();await page.waitForFunction(()=>document.querySelector('input[autocomplete="given-name"]')?.value==='Test');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();assert.equal(await page.getByLabel('Austritt',{exact:true}).inputValue(),'2026-12-31');assert.equal(await page.getByLabel('Arbeitsort',{exact:true}).inputValue(),'Bern','New basic fields survive authenticated draft reload');
  await page.getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await appControlValue(page.getByLabel('Vorname',{exact:true})),'Test','Wizard retains input without navigation or dirty warnings');
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(page.getByLabel('Vorname',{exact:true})),'Test','Cancel guard retains draft');await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+"/mitarbeiter");
  processRecoveryMode=false;

  }
  if(hasInteraction('time')){
  for(const height of [568,400]){
    await page.setViewportSize({width:375,height});await page.waitForLoadState("networkidle");await navigate(base+'/zeit');await page.waitForLoadState('networkidle');const timerOrder=await page.locator('.timer-card').evaluate(el=>{const controls=el.querySelector('.timer-actions'),context=el.querySelector('.timer-project');return !!controls&&!!context&&!!(controls.compareDocumentPosition(context)&Node.DOCUMENT_POSITION_FOLLOWING)});assert.equal(timerOrder,true,'Timer controls precede customer and order assignment');
    assert.equal(await page.getByRole('button',{name:'Zeitfilter',exact:true}).count(),0,'Timer hides entry-only filters');
    await page.getByRole('button',{name:'Zeit erfassen',exact:true}).filter({visible:true}).click();
    const manual=page.getByRole('dialog',{name:'Zeit manuell erfassen'});await manual.waitFor();await manual.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))});
    await manual.getByLabel('Beschreibung',{exact:true}).focus();
    const geometry=await manual.evaluate(el=>{const header=el.querySelector('.sheet-header').getBoundingClientRect(),footer=el.querySelector('.filter-sheet-actions').getBoundingClientRect();return {headerTop:header.top,footerBottom:footer.bottom,width:document.documentElement.scrollWidth,height:innerHeight}});
    if(!(geometry.headerTop>=0&&geometry.footerBottom<=geometry.height+1&&geometry.width<=375)){console.log('Sheet geometry',geometry);await capture(page,{animations:'disabled',path:path.join(output,'sheet-error.png')});}
    assert.ok(geometry.headerTop>=0&&geometry.footerBottom<=geometry.height+1&&geometry.width<=375,'Short viewport keeps sheet header/actions visible without page overflow');
    await capture(page,{animations:"disabled",path:path.join(output,`${theme}-375-${height}-manual-time.png`)});
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:430,height:900});
  }
  if(hasInteraction('finance')){
   await navigate(base+'/finanzen');await page.waitForLoadState('networkidle');
   const overview=page.locator('.bo-cash-overview');
   assert.equal(await overview.locator('.metric').count(),4,'Finance opens the compact original overview');
   assert.equal(await overview.locator('.metric>strong').first().textContent(),'CHF 400.00');
   await chooseStatisticPeriod(page,overview,6);
   assert.equal(await overview.locator('.metric>strong').first().textContent(),'CHF 640.00');
   assert.equal(await overview.locator('.metric>strong').nth(1).textContent(),'CHF 200.00','Snapshot balances stay independent of the selected period');
   assert.deepEqual(await overview.locator('.bo-comparison-row strong').allTextContents(),['CHF 320.00','CHF 50.00'],'Approved comparison bars use actual six-month cash totals');assert.equal(await overview.locator('.bo-comparison-card footer strong').textContent(),'CHF 270.00','Comparison balance uses recorded income minus outflows');assert.equal(await overview.locator('.bo-overview-bars').count(),0,'Finance overview uses comparison bars instead of the retired month chart');
   await overview.locator('.bo-overview-details>summary').click();await overview.getByRole('link',{name:'Finanzanalyse',exact:true}).click();await page.waitForLoadState('networkidle');
   const statistics=page.locator('.bo-statistics');
   await statistics.locator('.bo-metric-tiles>.metric').filter({has:page.getByText('Einnahmen',{exact:true})}).locator(':scope>strong').getByText('CHF 200.00',{exact:true}).waitFor();
   assert.equal(await statistics.locator('.bo-metric-tiles>.metric').count(),4);
   for(const months of [1,3,6,12]){await chooseStatisticPeriod(page,statistics,months);assert.equal(await statistics.locator('.metric>strong').first().textContent(),months===1?'CHF 200.00':'CHF 320.00');}
   const periodViewport=page.viewportSize(),periodCaption=await statistics.locator('.bo-period-control').getAttribute('title');
   const resizeSheet=await openStatisticCalendar(page,statistics);
   await resizeSheet.getByLabel('Von',{exact:true}).fill(previousStatisticFrom);await resizeSheet.getByLabel('Bis',{exact:true}).fill(previousStatisticTo);
   await page.setViewportSize({...periodViewport,width:periodViewport.width>=1024?390:1440});await resizeSheet.waitFor({state:'detached'});
   assert.equal(await statistics.locator('.bo-period-control').getAttribute('title'),periodCaption,'A layout breakpoint closes the chooser without applying its draft');
   assert.equal(await statistics.locator('.metric>strong').first().textContent(),'CHF 320.00','Resizing does not change the applied financial window');
   await page.setViewportSize(periodViewport);
   const periodSheet=await openStatisticCalendar(page,statistics);
   await periodSheet.getByLabel('Von',{exact:true}).fill(previousStatisticFrom);await periodSheet.getByLabel('Bis',{exact:true}).fill(previousStatisticTo);
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-period-sheet.png`)});
   await periodSheet.getByRole('button',{name:'Anwenden',exact:true}).click();
   assert.equal(await statistics.locator('.metric>strong').first().textContent(),'CHF 120.00');
   assert.equal(await statistics.locator('.metric>strong').nth(1).textContent(),'CHF 0.00','No invented historical outflows');
   assert.equal(await statistics.locator('.metric>strong').nth(2).textContent(),'CHF 120.00','Payment balance uses income minus recorded outflows');
   await page.locator('.bo-finance-analysis>.bo-data-disclosure').first().locator('summary').click();assert.ok((await page.locator('.bo-finance-analysis>.bo-data-disclosure').first().innerText()).includes('20.00'),'Overdue receivables stay separate from the period cash ledger');
   await page.locator('.bo-finance-analysis>.bo-data-disclosure').first().getByRole('link').filter({hasText:'Bezahlt'}).click();await page.waitForURL(url=>url.pathname==='/rechnungen'&&url.searchParams.get('status')==='Bezahlt');await chooseRecordFilter(page,'Alle');await waitForLocalizedRoute(page,base+"/rechnungen");await page.waitForLoadState('networkidle');
   await page.locator('.document-summary-row').filter({hasText:'RE-TEST-1'}).filter({visible:true}).first().waitFor();assert.ok(await page.locator('.document-summary-row').filter({hasText:'RE-TEST-1'}).filter({visible:true}).count()>0,'Analysis period does not filter the actual invoice list');
   await page.locator('a[href="/dashboard"]').filter({visible:true}).first().click();await waitForLocalizedRoute(page,base+"/dashboard");await page.waitForLoadState('networkidle');const dashboardOverview=page.locator('.bo-cash-overview');await chooseStatisticPeriod(page,dashboardOverview,6);assert.equal(await dashboardOverview.locator('.bo-overview-bars>button').count(),6,'Dashboard retains six actual monthly buckets');await dashboardOverview.locator('.bo-overview-bars>button').last().click();assert.match(await dashboardOverview.locator('output').textContent(),/CHF 400/);if(await page.locator('.bottom-nav').isVisible()){await page.locator('.bottom-nav').getByRole('button',{name:'Mehr',exact:true}).click();await page.getByRole('dialog',{name:'Mehr',exact:true}).getByRole('link',{name:'Finanzen',exact:true}).click();}else await page.locator('a[href="/finanzen"]').filter({visible:true}).first().click();await waitForLocalizedRoute(page,base+"/finanzen");await page.waitForLoadState('networkidle');
   await overview.locator('.bo-overview-details>summary').click();await overview.getByRole('link',{name:'Finanzanalyse',exact:true}).click();await page.waitForLoadState('networkidle');
   try{await page.locator('.bo-statistics .metric>strong').first().filter({hasText:/^CHF 120\.00$/}).waitFor();}catch(error){console.log('Period restore diagnostics',await page.locator('.bo-statistics .metric>strong').allTextContents(),await page.evaluate(()=>({...sessionStorage})),page.url());throw error;}
   assert.equal(await page.locator('.bo-statistics .metric>strong').first().textContent(),'CHF 120.00','Custom period survives actual same-tab navigation');
   const emptySheet=await openStatisticCalendar(page,page.locator('.bo-statistics'));await emptySheet.getByLabel('Von',{exact:true}).fill('2020-01-01');await emptySheet.getByLabel('Bis',{exact:true}).fill('2020-01-02');await emptySheet.getByRole('button',{name:'Anwenden',exact:true}).click();
   assert.equal(await page.locator('.bo-comparison-track>i').evaluateAll(nodes=>nodes.every(node=>parseFloat(getComputedStyle(node).width)===0)),true,'Empty cash periods render neutral empty tracks');
   const emptyTrend=page.getByRole('button',{name:'Zeitverlauf anzeigen',exact:true});assert.equal(await emptyTrend.count(),0,'An empty period must not offer a meaningless trend toggle');
   assert.equal(await page.locator('.bo-statistics-line,.bo-statistics-point').count(),0,'An empty period renders no fabricated zero chart');
   assert.equal(await page.locator('.bo-comparison-track>i').evaluateAll(nodes=>nodes.every(node=>parseFloat(getComputedStyle(node).width)===0)),true,'Zero cash renders empty comparison tracks');
   const snapshot=page.locator('.bo-finance-analysis>.bo-data-disclosure').first();if(await snapshot.getAttribute('open')===null)await snapshot.locator('summary').click();const overdueLink=snapshot.getByRole('link').filter({hasText:'Überfällig'});await overdueLink.focus();await overdueLink.press('Enter');await page.waitForURL(url=>url.pathname==='/rechnungen'&&url.searchParams.get('status')==='Überfällig');
   await page.locator('.records-active-line').filter({hasText:'Überfällig'}).waitFor();
   await chooseRecordFilter(page,'Alle');assert.equal(new URL(page.url()).searchParams.has('status'),false,'A user filter change clears the consumed chart drilldown');
  }
  if(hasInteraction('time')){
  await page.waitForLoadState("networkidle");await navigate(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
  const group=page.locator('details.time-group').first();await group.waitFor();
  assert.equal(await group.locator('summary strong').textContent(),'2:15 h','Grouped duration uses exact minutes and the approved explicit hour unit');
  assert.equal(await group.getAttribute('open'),null,'Entry groups start collapsed');
  await group.locator('summary').click();await group.locator('.time-record-list').waitFor();
  assert.equal(await group.locator('.time-record-list>div').count(),2,'Expansion shows both entries');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-entries.png`),fullPage:true});
  const searchRect=await page.locator('.time-filter-toolbar .searchbox').boundingBox(),filterRect=await page.getByRole('button',{name:'Listenwerkzeuge',exact:true}).boundingBox();
  assert.ok(filterRect.x>searchRect.x&&Math.abs(filterRect.y-searchRect.y)<5,'Mobile filter follows search on the same row');
  await verifyTimeWorkspace(page,{capture:width=>capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-time-workspace-central.png`),fullPage:true})});
  }
  if(hasInteraction('time')){
   let filter=await openStatisticCalendar(page,page.locator('.app-root'));const initialFrom=await appControlValue(filter.getByLabel('Von',{exact:true}));await filter.getByLabel('Bis',{exact:true}).fill('2099-01-02');await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await page.keyboard.press('Escape');assert.equal(await page.locator('.time-group').count(),1,'Cancelling a filter preserves the applied range');
   filter=await openStatisticCalendar(page,page.locator('.app-root'));assert.equal(await appControlValue(filter.getByLabel('Von',{exact:true})),initialFrom,'Discarded range is not applied');await filter.getByLabel('Bis',{exact:true}).fill('2099-01-02');await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await filter.getByRole('button',{name:'Anwenden',exact:true}).click();assert.equal(await page.locator('.time-group').count(),0,'Applying updates the entries');
   // Independent review is a server/DB invariant, never a user-disableable toggle.
   policyPosts=0;policyRequired=true;failPolicy=true;await navigate(base+'/einstellungen/zeiterfassung');await page.waitForLoadState('networkidle');
   await page.getByRole('alert').filter({hasText:'Fixture policy unavailable'}).waitFor();assert.equal(await page.getByText('Unabhängige Freigabe',{exact:true}).count(),0,'Failed policy read cannot claim a known approval state');
   failPolicy=false;await navigate(base+'/einstellungen/zeiterfassung');await page.getByText('Unabhängige Freigabe',{exact:true}).waitFor();
   assert.equal(await page.getByRole('switch',{name:'Freigabe erforderlich'}).count(),0,'Even owners cannot disable independent review');assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0);
   assert.equal(policyPosts,0,'Read-only policy display performs no mutation');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-settings.png`)});
   policyRole='member';await navigate(base+'/einstellungen/zeiterfassung');await page.getByText('Unabhängige Freigabe',{exact:true}).waitFor();assert.equal(await page.getByRole('switch').count(),0);assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0,'Member cannot change approval requirements');
   policyRole='owner';policyRequired=false;await navigate(base+'/einstellungen/zeiterfassung');await page.getByText('Alleiniger Inhaber',{exact:true}).waitFor();assert.equal(await page.getByRole('switch').count(),0,'Solo exception is derived, not a writable policy');assert.equal(policyPosts,0);policyRequired=true;
   teamPosts=0;failTeam=false;teamHasExpiredInvitation=true;await navigate(base+'/einstellungen/team');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Mitarbeiter einladen',exact:true}).filter({visible:true}).click();const invitation=page.getByRole('dialog',{name:'Einladung',exact:true});await invitation.getByLabel('E-Mail',{exact:true}).fill('invalid');await invitation.getByRole('button',{name:'Einladen',exact:true}).click();assert.equal(teamPosts,0,'Invalid invitations do not write');await invitation.getByLabel('E-Mail',{exact:true}).fill('team@example.invalid');failTeam=true;await invitation.getByRole('button',{name:'Einladen',exact:true}).dblclick();await page.getByText('Fixture team unavailable',{exact:true}).waitFor();assert.equal(teamPosts,1,'Invitation locks duplicate writes');assert.equal(await appControlValue(invitation.getByLabel('E-Mail',{exact:true})),'team@example.invalid');failTeam=false;await invitation.getByRole('button',{name:'Einladen',exact:true}).click();await invitation.waitFor({state:'hidden'});assert.equal(teamPosts,2,'Invitation failure can be retried');
   teamHasInvitation=true;await navigate(base+'/einstellungen/team');
   const pendingInvitation=page.locator('.settings-static-row').filter({hasText:'pending@example.invalid'}),expiredInvitation=page.locator('.settings-static-row').filter({hasText:'expired@example.invalid'});
   await pendingInvitation.getByText('Ausstehend',{exact:true}).waitFor();await expiredInvitation.getByText('Abgelaufen',{exact:true}).waitFor();
   assert.equal(await expiredInvitation.getByRole('link').count(),0,'Expired invitation management cannot expose an acceptance link');
   teamPosts=0;await expiredInvitation.getByRole('button',{name:'Einladungsaktionen',exact:true}).click();await page.getByRole('button',{name:'Einladung erneut senden',exact:true}).click();
   const resendInvitation=page.getByRole('alertdialog',{name:'Einladung erneut senden?',exact:true});await resendInvitation.waitFor();
   await resendInvitation.getByText('Der bisherige Link wird ungültig. Die neue Einladung gilt sieben Tage; Rolle und Modulprofil bleiben erhalten.',{exact:true}).waitFor();
   assert.equal(teamPosts,0,'Opening resend requires explicit confirmation before any mutation');await resendInvitation.getByRole('button',{name:'Abbrechen',exact:true}).click();await resendInvitation.waitFor({state:'hidden'});assert.equal(teamPosts,0,'Cancelling resend preserves the expired invitation without sending');
   await expiredInvitation.getByRole('button',{name:'Einladungsaktionen',exact:true}).click();await page.getByRole('button',{name:'Zurückziehen',exact:true}).click();await expiredInvitation.waitFor({state:'hidden'});assert.equal(teamPosts,1,'Explicit revoke removes only the expired invitation');await pendingInvitation.waitFor();assert.ok(teamHasInvitation,'Revoking an expired invitation preserves another pending invitation');
   teamPosts=0;failTeam=true;await pendingInvitation.getByRole('button',{name:'Einladungsaktionen',exact:true}).click();await page.getByRole('button',{name:'Zurückziehen',exact:true}).click();await page.getByText('Fixture team unavailable',{exact:true}).waitFor();assert.equal(teamPosts,1);assert.ok(teamHasInvitation,'Failed revoke leaves the invitation intact');failTeam=false;await pendingInvitation.getByRole('button',{name:'Einladungsaktionen',exact:true}).click();await page.getByRole('button',{name:'Zurückziehen',exact:true}).dblclick();await page.getByRole('heading',{name:'Offene Einladungen',exact:true}).waitFor({state:'hidden'});assert.equal(teamPosts,2,'Revoke retry sends exactly one further request');
  }
  if(hasInteraction('documents')){
  projectSourceMode=true;failProjectSource=true;
  await navigate(base+'/rechnungen/neu?sourceOffer=AN-TEST-1');await page.getByRole('alert').getByText('Synthetic source unavailable',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Weiter',exact:true}).count(),0,'Source failure blocks guided creation');
  failProjectSource=false;await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByRole('button',{name:'Weiter',exact:true}).waitFor();assert.equal(await page.getByLabel('Kunde auswählen',{exact:true}).isDisabled(),true,'Source customer is locked');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.document-position-open').first().click();
  const sourcePosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await sourcePosition.getByLabel('Beschreibung',{exact:true}).fill('Preserved source draft');await sourcePosition.getByRole('button',{name:'Übernehmen',exact:true}).click();
  const refreshedSource=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/documents/AN-TEST-1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await refreshedSource;await page.waitForLoadState('networkidle');assert.ok((await page.locator('.document-position-open').first().innerText()).includes('Preserved source draft'),'Source refresh cannot overwrite edited input');
  await page.locator('.app-editing').getByRole('button',{name:'Schliessen',exact:true}).filter({visible:true}).first().click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/rechnungen');projectSourceMode=false;
  processRecoveryMode=true;await navigate(base+'/angebote/neu');await page.waitForLoadState('networkidle');await page.evaluate(()=>{const url=new URL(location.href);url.searchParams.delete('lang');history.replaceState(history.state,'',url)});
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.document-position-open').first().click();const recoveryPosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await recoveryPosition.getByLabel('Beschreibung',{exact:true}).fill('Recovered unsaved offer');await recoveryPosition.getByRole('button',{name:'Übernehmen',exact:true}).click();
  await page.waitForFunction(()=>Object.keys(sessionStorage).some(key=>key.startsWith('binso.process-draft.v1:')&&sessionStorage.getItem(key)?.includes('Recovered unsaved offer')));await page.evaluate(()=>{const url=new URL(location.href);url.searchParams.set('lang','de');history.replaceState(history.state,'',url)});await page.reload();await page.locator('.document-position-open').first().waitFor();assert.ok((await page.locator('.document-position-open').first().innerText()).includes('Recovered unsaved offer'),'Reload restores input and wizard step');
  const parentRecoveryKey=await page.evaluate(()=>Object.keys(sessionStorage).find(key=>key.startsWith('binso.process-draft.v1:')&&sessionStorage.getItem(key)?.includes('Recovered unsaved offer')));assert.ok(parentRecoveryKey);
  await page.locator('.document-position-open').first().click();const discardedChild=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await discardedChild.getByLabel('Beschreibung',{exact:true}).fill('Discard only the position editor');
  await discardedChild.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Verwerfen',exact:true}).click();await discardedChild.waitFor({state:'hidden'});
  assert.ok(await page.evaluate(key=>sessionStorage.getItem(key)?.includes('Recovered unsaved offer'),parentRecoveryKey),'Discarding an inner sheet preserves the recoverable parent draft');
  await page.reload();await page.locator('.document-position-open').first().waitFor();assert.ok((await page.locator('.document-position-open').first().innerText()).includes('Recovered unsaved offer'),'The parent draft survives reload after discarding its child sheet');
  await page.locator('.app-editing').getByRole('button',{name:'Schliessen',exact:true}).filter({visible:true}).first().click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.ok((await page.locator('.document-position-open').first().innerText()).includes('Recovered unsaved offer'));await page.locator('.app-editing').getByRole('button',{name:'Schliessen',exact:true}).filter({visible:true}).first().click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/angebote');assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.startsWith('binso.process-draft.v1:')).length),0,'Confirmed discard removes recoverable input');processRecoveryMode=false;
  await navigate(base+'/rechnungen');await page.waitForLoadState('networkidle');await page.locator('a[href="/rechnungen/neu"]').filter({visible:true}).first().click();await waitForLocalizedRoute(page,base+'/rechnungen/neu');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.document-position-open').first().click();
  const appliedPosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await appliedPosition.getByLabel('Beschreibung',{exact:true}).fill('Übernommener Entwurf');await appliedPosition.getByRole('button',{name:'Übernehmen',exact:true}).click();await appliedPosition.waitFor({state:'hidden'});
  await page.evaluate(()=>history.back());
  const parentDiscard=page.getByRole('alertdialog');try{await parentDiscard.waitFor()}catch(error){console.log('Draft-transfer diagnostics',page.url(),await page.evaluate(()=>history.state));throw error;}
  await parentDiscard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.locator('.document-position-open').first().innerText().then(text=>text.includes('Übernommener Entwurf')),true,'Applying a child sheet preserves the parent draft and its back guard');
  await page.evaluate(()=>history.back());await parentDiscard.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/rechnungen');
  await navigate(base+'/rechnungen/neu');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await page.locator('.document-position-open').first().click();
  const position=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await position.getByLabel('Beschreibung',{exact:true}).fill('Ungespeicherte Position');
  await position.getByRole('button',{name:'Abbrechen',exact:true}).click();
  const discard=page.getByRole('alertdialog');await discard.waitFor();
  const layers=await page.evaluate(()=>({confirm:Number(getComputedStyle(document.querySelector('.confirm-layer')).zIndex),sheet:Number(getComputedStyle(document.querySelector('.mobile-position-layer')).zIndex)}));assert.ok(layers.confirm>layers.sheet,'Discard confirmation is above the position sheet');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-position-discard.png`)});
  await page.setViewportSize({width:320,height:568});
  for(const button of await discard.getByRole('button').all())assert.equal(await button.evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Discard actions fit a 320px viewport');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-position-discard.png`)});
  await page.setViewportSize({width:430,height:900});
  await discard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(position.getByLabel('Beschreibung',{exact:true})),'Ungespeicherte Position');
  await position.getByRole('button',{name:'Abbrechen',exact:true}).click();await discard.getByRole('button',{name:'Verwerfen',exact:true}).click();await position.waitFor({state:'hidden'});
  await page.waitForLoadState("networkidle");await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.document-detail-view button').count(),0,'Document content has no duplicate PDF/copy/edit buttons');
  await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
  await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Nummer kopieren',exact:true}).waitFor();
  await actionEvidence(page,'Weitere Aktionen',theme);await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Vorschau',exact:true}).click();
  const expectedPdfPages=Number(process.env.BINSO_UX_PDF_PAGES||2);
  const previous=page.getByRole('button',{name:'Vorherige Seite',exact:true}),next=page.getByRole('button',{name:'Nächste Seite',exact:true});
  const rendered=async number=>{await page.locator(`.pdf-page canvas[data-rendered-page="${number}"]`).waitFor();assert.equal(await page.locator('.pdf-page').count(),1,'Exactly one PDF page is mounted');await page.getByRole('status').filter({hasText:`Seite ${number} von ${expectedPdfPages}`}).waitFor();};
  await rendered(1);assert.equal(await previous.isDisabled(),true);
  await verifyPreviewControls(page,{capture:width=>capture(page,{animations:'disabled',path:path.join(output,theme+'-pdf-controls-'+width+'.png')})});
  const fit=await page.locator('.pdf-page canvas').boundingBox(),stage=await page.locator('.document-page-stage').boundingBox();
  assert.ok(Math.abs(fit.width/fit.height-210/297)<.01&&fit.width<=stage.width&&fit.height<=stage.height,'Whole A4 page fits both dimensions');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-pdf-preview.png`),fullPage:true});
  for(let number=2;number<=expectedPdfPages;number++){await next.focus();await next.press('Enter');await rendered(number);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-pdf-page-${number}.png`)});}
  assert.equal(await next.isDisabled(),true);
  for(let number=expectedPdfPages-1;number>=1;number--){await previous.click();await rendered(number);}
  await page.getByRole('button',{name:'Vorschau vergrössern',exact:true}).click();
  await page.locator('.document-page-stage.is-zoomed canvas[data-rendered-page="1"][data-rendered-zoom="2.5"]').waitFor();
  const zoom=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,document:document.querySelector('.document-page-stage').scrollWidth}));
  assert.ok(zoom.page<=zoom.viewport+1&&zoom.document>zoom.viewport,'Zoom scrolls only inside the document area');
  await page.getByRole('button',{name:'Auf Bildschirm einpassen',exact:true}).click();
  await page.locator('.document-page-stage:not(.is-zoomed) canvas[data-rendered-page="1"][data-rendered-zoom="1"]').waitFor();
  await page.setViewportSize({width:430,height:400});await settleLayout(page);
  const nav=await page.locator('.document-page-navigation').boundingBox(),small=await page.locator('.pdf-page canvas').boundingBox();assert.ok(nav.y+nav.height<=401&&small.y+small.height<=nav.y+1,'Full page and navigation remain reachable at short height');await page.setViewportSize({width:430,height:1000});
  // Deliberately exercise the browser-download capability fallback; no native share UI is simulated.
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Teilen oder herunterladen',exact:true}).click();
  const download=await downloaded;assert.deepEqual(await fs.readFile(await download.path()),fixturePdf,'Download is byte-identical to the preview PDF');
  await page.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  // A worker can download successfully without ever signalling readiness.
  // Verify that the real viewer leaves loading and can render on retry.
  const stalledWorker=route=>route.fulfill({contentType:'text/javascript',body:'await new Promise(()=>{});'});
  await context.route('**/*pdf.worker*.mjs',stalledWorker);
  await navigate(base+'/angebote/AN-TEST-1');
  await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
  const previewActions=page.getByRole('dialog',{name:'Weitere Aktionen'});
  await previewActions.waitFor();
  await page.clock.install();
  await previewActions.getByRole('button',{name:'Vorschau',exact:true}).click();
  await page.getByText('PDF wird angezeigt …',{exact:true}).waitFor();
  await page.clock.fastForward(20001);
  await page.getByText('Die PDF-Vorschau dauert zu lange. Bitte erneut versuchen.',{exact:true}).waitFor();
  assert.equal(await page.getByText('PDF wird angezeigt …',{exact:true}).count(),0,'Stalled worker cannot leave an endless loader');
  await context.unroute('**/*pdf.worker*.mjs',stalledWorker);
  await page.clock.resume();
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();
  await rendered(1);
  await page.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  }
  if(hasInteraction('documents')){
   invoice.status='draft';await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');assert.equal(await page.getByText('Zahlungsstand',{exact:true}).count(),0,'Draft does not demand payment');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-draft-invoice.png`)});invoice.status='sent';
   const creditBefore={amount:invoice.credit_amount,credits:invoice.credits};creditPosts=0;creditKeys.length=0;
   await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
   await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Gutschrift erfassen',exact:true}).click();
   const creditDialog=page.getByRole('dialog',{name:'Gutschrift erfassen'});await creditDialog.waitFor();
   await creditDialog.getByLabel('Betrag',{exact:true}).fill('20');await creditDialog.getByLabel('Interne Begründung',{exact:true}).fill('Synthetic price correction');
   failCredit=true;await creditDialog.getByRole('button',{name:'Gutschrift erfassen',exact:true}).click();
   await creditDialog.getByText('Synthetic credit unavailable',{exact:true}).waitFor();
   assert.equal(await appControlValue(creditDialog.getByLabel('Betrag',{exact:true})),'20','A failed credit retains the entered amount');
   assert.equal(await page.getByText('Gutschrift erfasst.',{exact:true}).count(),0,'Failure cannot show a successful booking');
   failCredit=false;await creditDialog.getByRole('button',{name:'Gutschrift erfassen',exact:true}).click();
   await creditDialog.waitFor({state:'hidden'});await openDocumentHistory(page);await page.getByText('GS-2026-000001',{exact:true}).waitFor();
   assert.equal(creditPosts,2);assert.equal(creditKeys[0],creditKeys[1],'Retry reuses the same credit key');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-credit-note.png`)});
   if(creditBefore.amount===undefined)delete invoice.credit_amount;else invoice.credit_amount=creditBefore.amount;
   if(creditBefore.credits===undefined)delete invoice.credits;else invoice.credits=creditBefore.credits;
   revisionPosts=0;revisionKeys.length=0;failRevision=true;
   await navigate(base+'/angebote/AN-TEST-1');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
   const revisionActions=page.getByRole('dialog',{name:'Weitere Aktionen'});
   await revisionActions.getByRole('button',{name:'Angebot überarbeiten',exact:true}).click();await revisionActions.getByText('Synthetic revision unavailable',{exact:true}).waitFor();
   assert.equal(new URL(page.url()).pathname,'/angebote/AN-TEST-1');failRevision=false;
   await revisionActions.getByRole('button',{name:'Angebot überarbeiten',exact:true}).click();const revisionEditor=page.locator('.app-editing .document-entry-page');await revisionEditor.waitFor();await revisionActions.waitFor({state:'hidden'});assert.equal(new URL(page.url()).pathname,'/angebote/AN-TEST-1','Revision retains the business number and route');assert.equal(await revisionEditor.getByLabel('Angebotsnummer',{exact:true}).count(),0,'Number is not an editable field');await revisionEditor.getByRole('button',{name:'Abbrechen',exact:true}).click();await revisionEditor.waitFor({state:'hidden'});await page.locator('.document-reference-row').getByText('Version 2',{exact:true}).waitFor();const versions=page.locator('.document-detail-view details').filter({has:page.locator('summary',{hasText:'Versionen und Verlauf'})});await versions.locator('summary').click();await versions.getByRole('button',{name:/Version 1/}).waitFor();
   assert.equal(revisionPosts,2);assert.equal(revisionKeys[0],revisionKeys[1]);assert.equal(revisedOfferFixture.status,'draft');assert.equal(revisedOfferFixture.offer_version,2,'Revision advances the current draft while immutable version 1 remains available');revisedOfferFixture=undefined;
   const validOfferUntil=offer.valid_until;offer.valid_until='2020-01-01';
   await navigate(base+'/angebote/AN-TEST-1');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
   assert.equal(await page.getByRole('dialog',{name:'Weitere Aktionen',exact:true}).getByRole('button',{name:'Erinnerung',exact:true}).count(),0,'Expired offers cannot schedule reminders');
   offer.valid_until=validOfferUntil;
   await navigate(base+'/angebote/AN-TEST-1');await page.waitForLoadState('networkidle');
   const followupSection=page.locator('.document-detail-view details').filter({has:page.locator('summary',{hasText:'Erinnerung'})});
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();await page.getByRole('dialog',{name:'Weitere Aktionen',exact:true}).getByRole('button',{name:'Erinnerung',exact:true}).click();
   const followupDialog=page.getByRole('dialog',{name:'Erinnerung planen',exact:true});await followupDialog.waitFor();
   assert.equal(await followupDialog.getByRole('button',{name:'Speichern',exact:true}).isDisabled(),true,'Reminder is never opted in by default');
   await followupDialog.getByLabel('Persönliche Erinnerung aktivieren',{exact:true}).check();
   failFollowup=true;const beforeFollowup=followupPosts;await followupDialog.getByRole('button',{name:'Speichern',exact:true}).click();await followupDialog.getByText('Synthetic reminder unavailable',{exact:true}).waitFor();
   assert.equal(await followupDialog.getByLabel('Persönliche Erinnerung aktivieren',{exact:true}).isChecked(),true,'Failure preserves explicit draft opt-in');
   failFollowup=false;await followupDialog.getByRole('button',{name:'Speichern',exact:true}).click();await followupDialog.waitFor({state:'hidden'});
   await followupSection.locator('summary').click();await followupSection.getByText('Geplant',{exact:true}).waitFor();assert.equal(followupPosts,beforeFollowup+2);assert.equal(offerFollowups.length,1);
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();await page.getByRole('dialog',{name:'Weitere Aktionen',exact:true}).getByRole('button',{name:'Erinnerung',exact:true}).click();await followupDialog.waitFor();await followupDialog.getByRole('button',{name:'Erinnerung entfernen',exact:true}).click();await followupDialog.waitFor({state:'hidden'});
   assert.equal(offerFollowups[0].state,'cancelled');offerFollowups=[];
   const ledgerBefore={paid_amount:invoice.paid_amount,credit_amount:invoice.credit_amount,refund_amount:invoice.refund_amount,refunds:invoice.refunds,reminders:invoice.reminders,due_date:invoice.due_date};
   invoice.paid_amount=invoice.total;invoice.credit_amount=35.13;invoice.refund_amount=0;adjustmentPosts=0;adjustmentKeys.length=0;
   await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
   await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Rückerstattung erfassen',exact:true}).click();
   const refundDialog=page.getByRole('dialog',{name:'Rückerstattung erfassen'});await refundDialog.waitFor();
   await refundDialog.getByLabel('Betrag',{exact:true}).fill('20');await refundDialog.getByLabel('Interne Begründung',{exact:true}).fill('Synthetic bank refund REF-123');await refundDialog.getByLabel('Rückerstattungsdatum',{exact:true}).fill('2026-10-15');
   failAdjustment=true;await refundDialog.getByRole('button',{name:'Rückerstattung erfassen',exact:true}).click();await refundDialog.getByText('Synthetic refund unavailable',{exact:true}).waitFor();
   assert.equal(await appControlValue(refundDialog.getByLabel('Betrag',{exact:true})),'20');
   failAdjustment=false;await refundDialog.getByRole('button',{name:'Rückerstattung erfassen',exact:true}).click();await refundDialog.waitFor({state:'hidden'});await openDocumentHistory(page);
   const refundEntry=page.locator('.document-detail-section').filter({has:page.getByRole('heading',{name:'Rückerstattungen',exact:true})}).locator('p').filter({hasText:'Synthetic bank refund REF-123'});
   await refundEntry.waitFor();assert.equal(await refundEntry.count(),1,'Refund is shown once in its history');
   const refundHistoryText=await refundEntry.innerText();assert.ok(refundHistoryText.includes('Synthetic bank refund REF-123'));assert.ok(refundHistoryText.includes('15.10.2026'));assert.match(refundHistoryText,/CHF\s+20[.,]00/,'Refund history retains the actual booked amount');
   assert.equal(adjustmentPosts,2);assert.equal(adjustmentKeys[0],adjustmentKeys[1]);assert.equal(invoice.paid_amount,invoice.total,'Refund cannot rewrite the original receipt');
   Object.assign(invoice,ledgerBefore);invoice.due_date='2020-01-01';adjustmentPosts=0;adjustmentKeys.length=0;
   await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
   await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Zahlungserinnerung senden',exact:true}).click();
   const reminderDialog=page.getByRole('dialog',{name:'Zahlungserinnerung senden'});await reminderDialog.waitFor();await reminderDialog.getByLabel('Empfänger',{exact:true}).fill('reminder@example.invalid');
   failAdjustment=true;await reminderDialog.getByRole('button',{name:'Zahlungserinnerung senden',exact:true}).click();await reminderDialog.getByText('Synthetic reminder unavailable',{exact:true}).waitFor();
   failAdjustment=false;await reminderDialog.getByRole('button',{name:'Zahlungserinnerung senden',exact:true}).click();await reminderDialog.waitFor({state:'hidden'});await openDocumentHistory(page);await page.getByRole('heading',{name:'Mahnhistorie',exact:true}).waitFor();
   assert.equal(adjustmentPosts,2);assert.equal(adjustmentKeys[0],adjustmentKeys[1],'Retry retains the delivery key');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-reminder-history.png`)});
   Object.assign(invoice,ledgerBefore);


  }
  if(hasInteraction('employees')){
  employeeLedgerFixture=true;
  await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Übersicht',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mitarbeiteraktionen',exact:true}).filter({visible:true}).click();await actionEvidence(page,'Mitarbeiteraktionen',theme);await page.keyboard.press('Escape');
  const heading=page.locator('.page-head[data-heading-placement="content"],.mobile-header-detail').filter({visible:true});assert.equal(await heading.locator('.status').filter({visible:true}).count(),1,'Employee status appears once in the visible detail heading');
  await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();await page.getByText('7:30 h',{exact:true}).waitFor();assert.equal(await page.locator('.employee-tab-panel .document-summary-row').count(),1,'Employee time uses central rows');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-time.png`),fullPage:true});
  await page.getByRole('tab',{name:'Spesen',exact:true}).click();await page.locator('.employee-tab-panel a[href="/spesen/expense-one"]').waitFor();assert.equal(await page.locator('.employee-tab-panel .document-summary-row').count(),1,'Employee expenses use the main module row');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-expenses.png`),fullPage:true});
  await page.getByRole('tab',{name:'Dokumente',exact:true}).click();await page.getByText('Keine Dokumente erfasst',{exact:true}).waitFor();assert.equal(await page.locator('.employee-tab-panel [data-empty-state="compact"]').count(),1,'Documents use the central empty state');assert.equal(await page.locator('.employee-tab-panel .compact-list').count(),0,'No legacy employee document list is rendered');
  await page.getByRole('button',{name:'Dateiaktionen',exact:true}).click();
  const attachmentMenu=page.getByRole('dialog',{name:'Dateiaktionen',exact:true});await attachmentMenu.getByRole('button',{name:'Datei hinzufügen',exact:true}).waitFor();
  const attachmentChooser=page.waitForEvent('filechooser'),attachmentUploaded=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/files'&&response.request().method()==='POST');await attachmentMenu.getByRole('button',{name:'Datei hinzufügen',exact:true}).click();await (await attachmentChooser).setFiles({name:'synthetic-employee.pdf',mimeType:'application/pdf',buffer:fixturePdf});assert.ok((await attachmentUploaded).ok(),'The visible attachment menu opens the picker and uploads through the existing API');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-documents.png`),fullPage:true});
  employeeLedgerFixture=false;
  }
  if(hasInteraction('products')){
   await navigate(base+'/produkte/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Name',{exact:true}).fill('Unconfirmed synthetic product');await page.getByLabel('Verkaufspreis (CHF)',{exact:true}).fill('125');incompleteProductResponse=true;
   await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).click();await page.getByText('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.',{exact:true}).waitFor();assert.equal(await page.getByText('Produkt gespeichert.',{exact:true}).count(),0,'Unconfirmed ordinary create cannot show success');assert.equal(new URL(page.url()).pathname,'/produkte/neu');assert.equal(await appControlValue(page.getByLabel('Name',{exact:true})),'Unconfirmed synthetic product','Unconfirmed create preserves the draft');incompleteProductResponse=false;
   await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).click();await page.getByText('Produkt gespeichert.',{exact:true}).waitFor();await waitForLocalizedRoute(page,base+'/produkte');

  await page.waitForLoadState("networkidle");await navigate(base+'/produkte');await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{localStorage.removeItem('binso.demo.session');localStorage.removeItem('binso.demo.database')});
  await page.setViewportSize({width:430,height:900});
  await page.waitForLoadState("networkidle");await navigate(base+'/produkte');await page.waitForLoadState('networkidle');await page.getByPlaceholder('Produkte suchen...').fill('not-present');
  await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
  await page.getByPlaceholder('Produkte suchen...').fill('Beratung');
  await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();
  await page.waitForLoadState("networkidle");await navigate(base+'/produkte/product-one');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();
  const dialog=page.getByRole('dialog',{name:'Produktaktionen'});await dialog.waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-action-sheet.png`)});
  assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Opening the sheet moves focus inside');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Produktaktionen','Sheet restores trigger focus');
  await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();await actionEvidence(page,'Produktaktionen',theme);await page.getByRole('dialog',{name:'Produktaktionen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();await page.getByLabel('Verkaufspreis (CHF)',{exact:true}).fill('130');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).first().click();await waitForLocalizedRoute(page,base+'/produkte');await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();await page.waitForLoadState('networkidle');
  // SPA navigation does not reset Playwright's load state. Allow the destination
  // fixtures and idle link prefetch to settle before the next hard navigation.
  }
  if(hasInteraction('expenses')){
  failMutation=true;posts=0;uploads=0;
  await page.waitForLoadState("networkidle");await navigate(base+'/spesen/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Händler',{exact:true}).fill('SBB');await page.getByLabel('Betrag',{exact:true}).fill('89');await selectAppOption(page.getByLabel('Bezahlt mit',{exact:true}),'company_card');
  await page.locator('#expense-receipt-upload').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Einreichen'&&button.disabled));
  assert.equal(await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().isEnabled(),false,'Cannot submit while receipt recognition is running');
  while(!releaseReceiptScan)await new Promise(resolve=>setTimeout(resolve,10));releaseReceiptScan();releaseReceiptScan=undefined;
  await page.getByText(/Erkannt.*Angaben prüfen/).waitFor();
  await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().dblclick();
  await page.getByText('Fixture offline',{exact:true}).waitFor();assert.equal(posts,1,'Two rapid clicks must issue one expense write');
  assert.equal(Number(await appControlValue(page.getByLabel('Betrag',{exact:true}))),89,'Failed submission preserves input');
  assert.equal(await appControlValue(page.getByLabel('Bezahlt mit',{exact:true})),'company_card','Failed submission preserves explicit payer');
  failMutation=false;await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().click();
  await waitForLocalizedRoute(page,base+'/spesen');await page.locator('.mobile-record-list').getByText('SBB',{exact:true}).waitFor();await page.waitForLoadState('networkidle');assert.equal(posts,2,'Failed expense write can be retried');assert.equal(uploads,1,'Receipt is uploaded once after a successful expense save');
  }
  if(hasInteraction('employees')){
  failLedger=true;await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();
  await page.getByText('Fixture ledger unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).count(),0,'Failed ledger must not look empty');failLedger=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).waitFor();
  }
  if(hasInteraction('chat')){
  await page.setViewportSize({width:390,height:740});await navigate(base+'/support/neu');await page.waitForLoadState('networkidle');const supportForm=page.getByRole('dialog',{name:'Neue Support-Anfrage',exact:true});await supportForm.waitFor();await supportForm.getByLabel('Betreff',{exact:true}).fill('Keyboard draft');await supportForm.getByLabel('Nachricht',{exact:true}).fill('Preserved message');
  await supportForm.locator('#support-file-upload').setInputFiles({name:'support-note.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic support note')});await supportForm.getByText('support-note.txt',{exact:true}).waitFor();await supportForm.getByRole('button',{name:'Entfernen',exact:true}).click();assert.equal(await supportForm.getByText('support-note.txt',{exact:true}).count(),0,'Removing a draft attachment never requires creating a ticket');assert.equal(await appControlValue(supportForm.getByLabel('Nachricht',{exact:true})),'Preserved message');
  await page.setViewportSize({width:390,height:400});await supportForm.getByLabel('Nachricht',{exact:true}).focus();await settleLayout(page);const supportFooter=await supportForm.locator('.sheet-form-footer').boundingBox();assert.ok(supportFooter.y+supportFooter.height<=400,'Native support form actions remain above the keyboard');assert.equal(await appControlValue(supportForm.getByLabel('Betreff',{exact:true})),'Keyboard draft');const focus=await supportForm.getByLabel('Nachricht',{exact:true}).evaluate(el=>({shadow:getComputedStyle(el).boxShadow,offset:getComputedStyle(el).outlineOffset}));assert.equal(focus.shadow,'none');assert.equal(focus.offset,'-2px','Single inset outline replaces competing focus rings');await supportForm.getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();
  await page.setViewportSize({width:375,height:400});await page.waitForLoadState('networkidle');await navigate(base+'/support/ticket-one?view=conversation');await page.waitForLoadState('networkidle');
  await assertChatTargets(page);
  const sendTarget=page.locator('.thread-composer>button:last-child'),sendStyle=await sendTarget.getAttribute('style');
  try{
   await sendTarget.evaluate(el=>{el.style.setProperty('width','40px','important');el.style.setProperty('min-width','0','important')});
   await assert.rejects(()=>assertChatTargets(page),/44px touch targets/,'The historical undersized chat control must be rejected');
  }finally{await sendTarget.evaluate((el,style)=>style===null?el.removeAttribute('style'):el.setAttribute('style',style),sendStyle);}
  await assertChatTargets(page);
  await page.getByLabel('Nachricht',{exact:true}).focus();const composer=await page.locator('.thread-composer').boundingBox(),chatHeader=await page.locator('.mobile-header').boundingBox();assert.ok(composer.y>=chatHeader.y+chatHeader.height&&composer.y+composer.height<=400,'Short chat viewport retains header and input');
  const sendsBeforeNewline=messagePosts;
  await page.getByLabel('Nachricht',{exact:true}).fill('First line');await page.getByLabel('Nachricht',{exact:true}).press('Enter');await page.getByLabel('Nachricht',{exact:true}).pressSequentially('Second line');
  assert.equal(await appControlValue(page.getByLabel('Nachricht',{exact:true})),'First line\nSecond line','Composer supports real multiline drafts');assert.equal(messagePosts,sendsBeforeNewline,'Return inserts a newline instead of sending');
  await page.getByLabel('Nachricht',{exact:true}).fill('Viewport draft');
  await page.evaluate(()=>{const vv=window.visualViewport;Object.defineProperty(vv,'height',{configurable:true,value:300});Object.defineProperty(vv,'offsetTop',{configurable:true,value:40});vv.dispatchEvent(new Event('resize'));});await settleLayout(page);
  const panned=await page.locator('.thread-composer').boundingBox(),pannedHeader=await page.locator('.mobile-header').boundingBox();assert.ok(pannedHeader.y>=39&&panned.y+panned.height<=341,'Chat honors the visual viewport height and pan offset exactly once');assert.equal(await appControlValue(page.getByLabel('Nachricht',{exact:true})),'Viewport draft');
  await page.evaluate(()=>{const vv=window.visualViewport;delete vv.height;delete vv.offsetTop;vv.dispatchEvent(new Event('resize'));});await settleLayout(page);
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-375-400-chat.png`)});await page.setViewportSize({width:430,height:900});
  failSend=true;messagePosts=0;await page.waitForLoadState("networkidle");await navigate(base+'/support/ticket-one?view=conversation');await page.waitForLoadState('networkidle');await page.getByLabel('Nachricht',{exact:true}).fill('Test message');await page.getByRole('button',{name:'Senden',exact:true}).dblclick();await page.getByText('Fixture message offline',{exact:true}).waitFor();assert.equal(messagePosts,1);assert.equal(await appControlValue(page.getByLabel('Nachricht',{exact:true})),'Test message');failSend=false;await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Test message',{exact:true}).waitFor();assert.equal(messagePosts,2);
  }
  if(hasInteraction('customers')){
   await page.setViewportSize({width:320,height:740});await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('.customer-detail-workspace .surface .status').filter({hasText:/^Aktiv$/}).count(),0,'Customer status appears only in the header');
   assert.equal(await page.locator('.navigation-group>.action-row').count(),8,'V7 hub has eight canonical destinations');
   await page.getByRole('link',{name:'Kontakte 1',exact:true}).click();
   const row=page.locator('.contact-list>div').first(),name=await row.locator('b').boundingBox(),menu=await row.locator('.contact-main').boundingBox();
   assert.ok(menu.height>=44&&menu.x<=name.x&&menu.x+menu.width>=name.x+name.width,'The complete contact label is a touch-friendly action');assert.equal(await row.getByRole('button',{name:'Alex Muster Aktionen'}).count(),0,'No separate contact row menu');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contacts-final.png`)});
   await row.locator('.contact-main').click();await actionEvidence(page,'Kontaktaktionen',theme);await page.getByRole('button',{name:'Kontakt bearbeiten'}).click();
   const primary=page.getByRole('checkbox',{name:'Als Hauptkontakt festlegen'}),box=await primary.boundingBox();assert.ok(box.width<=24&&box.height<=24,'Primary contact checkbox stays compact');assert.equal(await primary.isChecked(),true,'Existing primary contact value is retained');assert.ok((await page.getByRole('dialog').boundingBox()).x>=0,'Contact sheet stays inside the viewport');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contact-form-final.png`)});await page.keyboard.press('Escape');
   await navigate(base+'/kunden/customer-one?section=documents');await page.locator('.customer-tab-panel').getByRole('heading',{name:'Dokumente',exact:true}).waitFor();await page.locator('.customer-tab-panel .mobile-record-list .document-summary-row').first().waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-customer-finance-final.png`)});assert.equal(await page.locator('.mobile-record-list .document-summary-row').count(),2,'Offers and invoices share the same financial row');
  }
  if(hasInteraction('time')){
   groupingFixture=true;   await page.setViewportSize({width:320,height:740});await navigate(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('.time-group').length===4);
   assert.equal(await page.locator('.time-group').count(),4,'Internal time and distinct customer/project identities remain four groups');assert.equal(await page.locator('.timer-card .section-title strong').innerText(),'40:45 h','Group total counts each entry once');
   const group=page.locator('.time-group-head').first();assert.equal(await group.evaluate(el=>getComputedStyle(el).textAlign),'left','Time group does not inherit timer centering');
   const customerBox=await group.locator('b').boundingBox(),duration=await group.locator('strong').boundingBox(),chevron=await group.locator('svg').boundingBox();assert.ok(customerBox.x<duration.x&&duration.x<chevron.x,'Group duration and chevron are right aligned');assert.ok((await group.boundingBox()).height<=76,'Collapsed group is compact');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-time-groups-final.png`)});
   await page.getByRole('button',{name:'Zeit erfassen',exact:true}).click();const sheet=page.getByRole('dialog',{name:'Zeit manuell erfassen'});assert.equal(await sheet.getByRole('button',{name:'Speichern',exact:true}).count(),1);
   await page.setViewportSize({width:320,height:400});await sheet.getByLabel('Beschreibung',{exact:true}).focus();await sheet.getByLabel('Beschreibung',{exact:true}).scrollIntoViewIfNeeded();const footer=await sheet.locator('.filter-sheet-actions').boundingBox(),header=await sheet.locator('.sheet-header').boundingBox();assert.ok(header.y>=0&&footer.y+footer.height<=401&&footer.x+footer.width<=321,'Manual time sheet keeps header and footer visible at keyboard-sized height');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-400-manual-time-final.png`)});await page.keyboard.press('Escape');groupingFixture=false;
  }
  if(hasInteraction('header')){
   await page.setViewportSize({width:390,height:740});await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');await verifyHeaderTargetRegression(page);
   for(const width of [390,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');
    const create=page.getByRole('button',{name:'Neu erstellen',exact:true}).filter({visible:true});
    const size=await create.boundingBox();
    assert.ok(size.width>=44&&size.height>=44,'Content creation keeps at least 44px touch targets');assert.equal(await create.evaluate(el=>!!el.closest('.workspace-command-bar,.app-section-dashboard .page-actions')),true,'Creation belongs to content controls or the dashboard heading');if(width>760)assert.ok(size.width>size.height,'Desktop creation exposes its visible text label');
    await create.click();const menu=page.getByRole('dialog',{name:'Neu erstellen',exact:true});
    assert.deepEqual(await menu.locator('.action-row>span').allTextContents(),['Kunde','Angebot','Rechnung','Zeit erfassen','Auftrag','Zahlung','Spese','Produkt','Mitarbeiter','Support-Anfrage']);
    assert.equal(await page.getByRole('button',{name:'Weiter',exact:true}).count(),0,'Opening global plus never starts an invoice wizard');
    await menu.getByRole('link',{name:'Kunde',exact:true}).click();await page.waitForURL(url=>url.pathname==='/kunden/neu'&&url.searchParams.get('returnTo')==='/dashboard');
    await page.getByRole('dialog',{name:'Kunde erstellen',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await waitForLocalizedRoute(page,base+'/dashboard');
   }
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');
    const header=page.locator(width<=760?'.mobile-header':'.desktop-appbar');
    await page.evaluate(()=>window.scrollTo(0,180));const scroll=await page.evaluate(()=>scrollY);
    const searchTrigger=await header.getByRole('button',{name:'Suche',exact:true}).boundingBox();await page.mouse.click(searchTrigger.x+searchTrigger.width/2,searchTrigger.y+searchTrigger.height/2);
    const panel=page.getByRole('dialog',{name:'Suche',exact:true});await panel.waitFor();
    assert.equal(await page.locator('.bottom-sheet').count(),0,'Header search is not a bottom sheet');
    assert.equal(await panel.getByRole('button',{name:'Abbrechen',exact:true}).filter({visible:true}).count(),width<=760?1:0,'Mobile search cancels beside the input; desktop uses the anchored close control');
    assert.equal(await panel.getByLabel('Suchen',{exact:true}).evaluate(el=>el===document.activeElement),true,'Search focuses its input');
    const box=await panel.boundingBox(),bar=await header.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,'Panel stays within viewport');if(width<=760){assert.ok(box.y<=1&&box.height>=739,'Mobile search owns a full view');assert.match(await page.locator('.page-head h1').filter({visible:true}).textContent(),/^Guten (Morgen|Tag|Abend)(, .+)?$/,'Dashboard keeps its actual profile/time greeting while search is open');}else assert.ok(box.y>=bar.y+bar.height-1,'Desktop panel remains anchored under header');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'clip');
    assert.equal(await panel.getByText('Mindestens zwei Zeichen eingeben.',{exact:true}).count(),0);
    // Request observation precedes route-handler entry in WebKit. Synchronize both
    // ends of the held fixture; networkidle alone is not response completion.
    const heldSearch=new Promise(resolve=>{oldSearchArrived=resolve});
    const oldRequest=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/search'&&new URL(request.url()).searchParams.get('q')==='old');
    await panel.getByLabel('Suchen',{exact:true}).fill('old');const staleRequest=await oldRequest;await heldSearch;oldSearchArrived=null;
    await panel.getByLabel('Suchen',{exact:true}).fill('Prüffirma');
    await panel.getByText('Prüffirma AG',{exact:true}).first().waitFor();
    const staleResponse=page.waitForResponse(response=>response.request()===staleRequest);
    releaseOldSearch();releaseOldSearch=null;
    const completedStale=await staleResponse;assert.equal(completedStale.status(),200,'The delayed old response is actually delivered');assert.equal(await completedStale.finished(),null,'The old response finishes before navigation/fixture cleanup');
    await page.waitForLoadState('networkidle');assert.equal(await panel.getByText('Veraltetes Ergebnis',{exact:true}).count(),0,'Stale responses never replace current search');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-search.png`)});
    await page.setViewportSize({width,height:400});
    const keyboardGeometry=await panel.evaluate(el=>{const root=document.documentElement,previous=root.style.getPropertyValue('--dialog-viewport-height');root.style.setProperty('--dialog-viewport-height','740px');const box=el.getBoundingClientRect();root.style.setProperty('--dialog-viewport-height',previous);return {top:box.top,bottom:box.bottom,height:innerHeight}});
    assert.ok(keyboardGeometry.bottom<=401,'Search remains bounded even while the VisualViewport callback is pending: '+JSON.stringify(keyboardGeometry));
    await page.setViewportSize({width,height:740});await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    assert.equal(await page.evaluate(()=>scrollY),scroll,'Closing panel retains document scroll position');
    await header.getByRole('button',{name:'Benutzerkonto',exact:true}).click();const account=page.getByRole('dialog',{name:'Konto',exact:true});await account.getByText('Test Person',{exact:true}).waitFor();await assertAccountAvatarSpacing(account);
    assert.equal(await account.locator('.person-avatar').innerText(),'TP');assert.equal(await account.getByRole('link',{name:'Abonnement',exact:true}).count(),0,'Account panel does not duplicate company billing');
    const accountRows=await account.locator('.action-row').evaluateAll(rows=>rows.map(row=>{const css=getComputedStyle(row),box=row.getBoundingClientRect(),icon=row.firstElementChild.getBoundingClientRect(),text=row.children[1].getBoundingClientRect();return {height:box.height,font:css.fontSize,weight:css.fontWeight,display:css.display,grid:css.gridTemplateColumns,iconLeft:icon.left,textLeft:text.left,iconWidth:icon.width}}));
    assert.ok(accountRows.length>=6);for(const row of accountRows){const {height,...geometry}=row;const {height:minimum,...reference}=accountRows[0];assert.ok(height>=minimum,'Wrapped labels grow rather than clipping');assert.deepEqual(geometry,reference,'Account groups share icon/text columns and typography');}
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-account.png`)});
    if(width<=760)await account.getByRole('button',{name:'Zurück',exact:true}).click();
    await header.getByRole('button',{name:'Benachrichtigungen',exact:true}).click();const notifications=page.getByRole('dialog',{name:'Benachrichtigungen',exact:true});await notifications.getByText('Neue Rechnung',{exact:true}).waitFor();assert.equal(await account.count(),0,'Only one header panel is mounted');
    await notifications.getByRole('button',{name:'Ungelesen',exact:true}).click();assert.equal(await notifications.getByText('Produktinformation',{exact:true}).count(),0);
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-notifications.png`)});await page.keyboard.press('Escape');
   }
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/einstellungen/darstellung');await page.waitForLoadState('networkidle');
    const choices=page.getByRole('radiogroup',{name:'Darstellung',exact:true});await choices.waitFor({state:'visible'});assert.equal(await choices.getByRole('radio').count(),3);assert.equal(await page.locator('.appearance-card,.theme-preview').count(),0);
    const heights=await choices.getByRole('radio').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));assert.ok(heights.every(height=>Math.abs(height-heights[0])<1),'Theme rows keep equal heights');
    assert.equal(await page.getByLabel('Sprache',{exact:true}).count(),0,'Appearance owns theme only; language has its dedicated settings route');
    await choices.getByRole('radio',{name:/^Hell/}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await choices.getByRole('radio',{name:/^Dunkel/}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await choices.getByRole('radio',{name:/^Dunkel/}).press('ArrowDown');await page.waitForFunction(()=>document.documentElement.dataset.themeMode==='system');
    await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await page.waitForLoadState('networkidle');await page.reload();await choices.waitFor();await page.waitForLoadState('networkidle');assert.equal(await choices.getByRole('radio',{name:/^System/}).getAttribute('aria-checked'),'true','System selection survives reload');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-appearance-rows.png`)});
    await choices.getByRole('radio',{name:theme==='light'?/^Hell/:/^Dunkel/}).click();await page.waitForLoadState('networkidle');
    await navigate(base+'/einstellungen/sprache');await page.waitForLoadState('networkidle');
    assert.deepEqual(await page.getByLabel('Sprache',{exact:true}).locator('..').locator('select option').evaluateAll(options=>options.map(option=>option.value)),['de','fr','it','en','tr'],'Shared language selection includes Turkish for the five-language period control');
   }
   await page.setViewportSize({width:390,height:740});await navigate(base+'/einstellungen/konto');await page.waitForLoadState('networkidle');
   await openSettingsEditor(page);
   await page.getByLabel('Vorname',{exact:true}).fill('Neu');await page.getByRole('dialog',{name:'Persönliche Daten bearbeiten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();const confirm=page.getByRole('alertdialog');await confirm.waitFor();await confirm.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(page.getByLabel('Vorname',{exact:true})),'Neu');
   await page.getByLabel('Vorname',{exact:true}).fill('Test');await page.getByRole('dialog',{name:'Persönliche Daten bearbeiten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.locator('.mobile-back,.detail-back').filter({visible:true}).click();await waitForLocalizedRoute(page,base+'/einstellungen');assert.equal(await page.getByRole('alertdialog').count(),0,'Restoring original values clears dirty state');
   await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');const profileTrigger=page.getByRole('button',{name:'Benutzerkonto',exact:true}).filter({visible:true});try{await profileTrigger.click();}catch(error){console.log('Profile navigation trigger diagnostics',await page.evaluate(()=>({url:location.href,width:innerWidth,language:document.documentElement.lang,headers:[...document.querySelectorAll('.mobile-header,.desktop-appbar')].map(el=>({className:el.className,visible:el.checkVisibility(),inert:!!el.closest('[inert]'),buttons:[...el.querySelectorAll('button')].map(button=>({label:button.getAttribute('aria-label'),visible:button.checkVisibility()}))})),dialogs:[...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map(el=>({label:el.getAttribute('aria-label'),text:el.textContent?.slice(0,300)}))})));throw error;}await page.getByRole('link',{name:'Persönliche Daten',exact:true}).click();await page.waitForURL(url=>url.pathname==='/einstellungen/konto');assert.equal(new URL(page.url()).searchParams.get('accountReturn'),'/dashboard?panel=account','Profile retains invoking account menu context');await openSettingsEditor(page);await page.getByLabel('Vorname',{exact:true}).fill('Browserentwurf');await page.evaluate(()=>history.back());await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(page.getByLabel('Vorname',{exact:true})),'Browserentwurf','Safari browser back retains unsaved input');await page.evaluate(()=>history.back());await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await waitForLocalizedRoute(page,base+'/dashboard');
   await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');await page.getByRole('link',{name:'Kontakte 1',exact:true}).click();await page.getByRole('button',{name:'Kontakt hinzufügen',exact:true}).click();const form=page.getByRole('dialog',{name:'Kontakt hinzufügen',exact:true});await form.getByLabel('Vorname',{exact:true}).fill('Unsaved');await page.keyboard.press('Control+k');assert.equal(await page.locator('.header-panel').count(),0,'Global shortcut cannot open a header panel over a form sheet');assert.equal(await form.isVisible(),true);await page.keyboard.press('Escape');await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await appControlValue(form.getByLabel('Vorname',{exact:true})),'Unsaved');await form.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Verwerfen',exact:true}).click();await form.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.body.style.overflow),'','Nested confirmations restore scroll lock');
  }
  if(hasInteraction('header')){
   await navigate(base+'/einstellungen/benachrichtigungen');await page.waitForLoadState('networkidle');const emailSwitch=page.getByRole('switch',{name:'Rechnungen · E-Mail',exact:true});assert.equal(await emailSwitch.getAttribute('aria-checked'),'true');failPreferences=true;preferencePosts=0;await emailSwitch.dblclick();await page.getByRole('alert').getByText('Einstellung konnte nicht gespeichert werden.',{exact:true}).waitFor();assert.equal(preferencePosts,1,'An in-flight channel cannot be toggled twice');assert.equal(await emailSwitch.getAttribute('aria-checked'),'true','Failed immediate persistence restores original preference');failPreferences=false;holdPreference=true;const heldAcknowledgement=new Promise(resolve=>{preferenceHeld=resolve});await emailSwitch.click();await heldAcknowledgement;assert.equal(await emailSwitch.getAttribute('aria-checked'),'true','A pending save preserves the last confirmed preference');releasePreference();holdPreference=false;await page.getByRole('switch',{name:'Rechnungen · E-Mail',exact:true,checked:false}).waitFor();assert.equal(await emailSwitch.getAttribute('aria-checked'),'false');assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0,'Immediately saved preferences have no second save action');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-notification-preferences.png`)});
   await navigate(base+'/einstellungen/team');await page.waitForLoadState('networkidle');await page.getByRole('button').filter({hasText:'Team Person'}).click();const member=page.getByRole('dialog',{name:'Teammitglied',exact:true});await selectAppOption(member.getByRole('combobox',{name:/^Rolle/}), 'admin');teamPosts=0;await member.getByRole('button',{name:'Rolle speichern',exact:true}).click();const roleConfirm=page.getByRole('alertdialog');await roleConfirm.waitFor();assert.equal(teamPosts,0,'Rights are not changed before explicit confirmation');await roleConfirm.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(await appControlValue(member.getByRole('combobox',{name:/^Rolle/})),'admin');await member.getByRole('button',{name:'Rolle speichern',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Rolle ändern',exact:true}).dblclick();await member.waitFor({state:'hidden'});assert.equal(teamPosts,1,'Confirmed rights mutation is locked against duplicate submissions');await page.getByRole('button').filter({hasText:'Team Person'}).getByText('Administrator',{exact:true}).waitFor();
  }
  if(hasInteraction('header'))for(const route of ['/einladung?token=fixture','/passwort-zuruecksetzen?token=fixture']){
   await navigate(base+route);await page.waitForLoadState('networkidle');const field=page.locator('input').first();await field.fill(route.startsWith('/einladung')?'Einladung Entwurf':'SyntheticPassword!123');await page.waitForFunction(()=>typeof history.state?.binsoDraftBoundary==='string',{},{timeout:3000});await page.goBack();const discard=page.getByRole('alertdialog');await discard.waitFor();await discard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.ok((await appControlValue(field)).length>0,'Auth creation drafts survive canceled browser back');await field.fill('');await page.waitForFunction(()=>!history.state?.binsoDraftBoundary,{},{timeout:3000});assert.equal(await page.getByRole('alertdialog').count(),0,'Reverting a draft removes the warning');
  }
  for(const scenario of [
   {group:'customers',route:'/kunden/customer-one/bearbeiten',field:'Kundenname *',back:'/kunden/customer-one'},
   {group:'customers',route:'/kunden/customer-one/bearbeiten?returnTo='+encodeURIComponent('/kunden/customer-one?tab=activity'),field:'Kundenname *',back:'/kunden/customer-one?tab=activity'},
   {group:'products',route:'/produkte/product-one',menu:'Produktaktionen',field:'Name',back:'/produkte'},
   {group:'employees',route:'/mitarbeiter/employee-one',menu:'Mitarbeiteraktionen',field:'Vorname',back:'/mitarbeiter'},
  ]){
   if(!hasInteraction(scenario.group))continue;
   await page.setViewportSize({width:390,height:740});await navigate(base+scenario.route);await page.waitForLoadState('networkidle');
   if(scenario.menu){await page.getByRole('button',{name:scenario.menu,exact:true}).filter({visible:true}).click();await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click()}
   const field=page.getByLabel(scenario.field,{exact:true});const original=await appControlValue(field);await field.fill(original+' geändert');await field.fill(original);await settleLayout(page);
   if(scenario.group==='customers')await page.getByRole('dialog',{name:'Kunde bearbeiten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();else{const sheet=page.getByRole('dialog',{name:scenario.group==='products'?'Produkt bearbeiten':'Mitarbeiter bearbeiten',exact:true});await sheet.getByRole('button',{name:'Schliessen',exact:true}).click();await sheet.waitFor({state:'detached'});await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-modal-overlay'));assert.equal(await page.getByRole('alertdialog').count(),0,'Pristine sheet closes without a warning');await page.locator('.mobile-back,.detail-back').filter({visible:true}).click();}await waitForLocalizedRoute(page,base+scenario.back);assert.equal(await page.getByRole('alertdialog').count(),0,scenario.group+': restoring original values is pristine');
  }
  if(hasInteraction('settings')){
   await page.setViewportSize({width:390,height:740});await navigate(base+'/einstellungen');
   const settingsContent=page.locator('.page-container');await settingsContent.getByRole('link',{name:'Abonnement',exact:true}).waitFor();
   const timeSetting=page.locator('.settings-overview a[href="/einstellungen/zeiterfassung"]');
   const leaveSettings=async()=>{await waitForFiniteAnimations(page);await timeSetting.scrollIntoViewIfNeeded();await settleFrames(page);await timeSetting.evaluate(el=>el.addEventListener('click',()=>{window.settingsDepartureY=scrollY},{capture:true,once:true}));await timeSetting.click();const position=await page.evaluate(()=>window.settingsDepartureY);assert.ok(Number.isFinite(position),'Capture the actual departure position after browser actionability scrolling');await waitForLocalizedRoute(page,base+'/einstellungen/zeiterfassung');return position;};
   const headerReturn=await leaveSettings();await page.locator('.mobile-back').click();await waitForLocalizedRoute(page,base+'/einstellungen');await assertReturnPosition(page,headerReturn);
   const nativeReturn=await leaveSettings();await page.goBack();await waitForLocalizedRoute(page,base+'/einstellungen');await assertReturnPosition(page,nativeReturn);
   assert.equal(await page.locator('.settings-mobile-navigation').count(),0,'No redundant mobile hamburger/context strip');
   const settingsNavigation=settingsContent.locator('.settings-overview'),guidePreference=settingsContent.getByRole('switch',{name:'Einrichtungshilfe anzeigen',exact:true});
   const guideChecked=await guidePreference.isChecked();
   await settingsNavigation.getByLabel('Einstellungen suchen',{exact:true}).fill('Abonnement');
   assert.equal(await settingsNavigation.locator('.bo-settings-group').count(),1,'Settings search hides empty navigation groups');
   assert.equal(await settingsNavigation.locator('.bo-settings-group .action-row').count(),1,'Settings search retains only the matching authorized route');
   await settingsNavigation.getByRole('link',{name:'Abonnement',exact:true}).waitFor();
   assert.equal(await guidePreference.isChecked(),guideChecked,'Searching destinations preserves the separate setup preference');
   const groupSurface=await settingsNavigation.locator('.bo-settings-group-body').evaluate(el=>({border:getComputedStyle(el).borderTopWidth,radius:getComputedStyle(el).borderTopLeftRadius,background:getComputedStyle(el).backgroundColor}));
   assert.equal(groupSurface.border,'0px');assert.equal(groupSurface.radius,'0px');assert.notEqual(groupSurface.background,'rgba(0, 0, 0, 0)','Grouped settings have a real surface without an outline');
   await settingsNavigation.getByLabel('Einstellungen suchen',{exact:true}).fill('no-such-setting');await settingsNavigation.getByText('Keine passenden Einstellungen',{exact:true}).waitFor();
   assert.equal(await settingsNavigation.locator('.bo-settings-group').count(),0,'A search without matches leaves no empty navigation groups');assert.equal(await guidePreference.isChecked(),guideChecked,'An empty search cannot change setup preferences');
   await settingsNavigation.getByLabel('Einstellungen suchen',{exact:true}).fill('');assert.ok(await settingsNavigation.locator('.bo-settings-group').count()>=2,'Clearing search restores the groups');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-grouped-settings.png`)});

   // Actual settings UI, controlled scanner verdicts; not a live antivirus-engine test.
   const imageBytes=await (await import('sharp')).default({create:{width:512,height:512,channels:3,background:'#123456'}}).png().toBuffer();
   const imageFile={name:'synthetic-branding.png',mimeType:'image/png',buffer:imageBytes};
   const oldImage='/api/files/00000000-0000-4000-8000-000000000091/download',newImageId='00000000-0000-4000-8000-000000000092';
   let uploadCalls=0,scanVerdict='pending',scanFailure=0,companyWrites=0,companyPatch=null,companyLogo=oldImage,profileAvatar=oldImage,activationCalls=0;
   const scanUpload=route=>{uploadCalls++;if(!scanFailure&&scanVerdict==='clean'&&route.request().postData()?.includes('profile_avatar'))profileAvatar='/api/files/'+newImageId+'/download';return route.fulfill(scanFailure?{status:scanFailure,json:{message:'Synthetic scan unavailable'}}:{status:201,json:{item:{id:newImageId,scanStatus:scanVerdict,available:scanVerdict==='clean'}}});};
   const logoResource=route=>route.fulfill({json:{item:{name:'Synthetic Branding Company',logo_url:companyLogo}}});
   const avatarResource=route=>route.fulfill({json:{item:{display_name:'Synthetic Branding User',first_name:'Synthetic',last_name:'Branding User',avatar_url:profileAvatar,theme,language:'de'},email:'branding@fixture.invalid'}});
   const logoSettings=route=>{if(route.request().method()==='GET')return logoResource(route);companyWrites++;companyPatch=route.request().postDataJSON();if(companyPatch.logoUrl!==undefined)companyLogo=companyPatch.logoUrl;return route.fulfill({json:{item:{name:'Synthetic Branding Company',logo_url:companyLogo}}});};
   const imageDownload=route=>route.fulfill({contentType:'image/png',body:imageBytes});
   const activateUpload=async route=>{assert.equal(route.request().method(),'PATCH');assert.deepEqual(route.request().postDataJSON(),{action:'activate_profile_avatar',expectedAvatarUrl:oldImage});activationCalls++;if(scanVerdict!=='clean')return route.fulfill({status:409,json:{error:'avatar_not_ready',message:'Das Profilbild ist noch nicht sicher freigegeben. Das bisherige Bild bleibt erhalten.'}});await new Promise(resolve=>setTimeout(resolve,80));profileAvatar='/api/files/'+newImageId+'/download';return route.fulfill({json:{activated:true,item:{id:newImageId,alreadyActive:false}}});};
   await context.route('**/api/files/'+newImageId,activateUpload);
   await context.route('**/api/files',scanUpload);await context.route('**/api/files/*/download',imageDownload);
   await context.route('**/api/settings/company',logoSettings);await context.route('**/api/settings/profile',avatarResource);
   await page.setViewportSize({width:390,height:844});await navigate(base+'/einstellungen/konto');await page.locator('.settings-profile h2').getByText('Synthetic Branding User',{exact:true}).waitFor();
   await openSettingsEditor(page);
   const avatarEditor=page.getByRole('dialog',{name:'Persönliche Daten bearbeiten',exact:true});assert.equal(await avatarEditor.locator('#profile-avatar-upload').count(),1,'Profile upload belongs inside the active modal, never its inert background');assert.equal(await page.locator('.settings-profile input[type=file]').count(),0);await avatarEditor.getByRole('button',{name:'Datei ersetzen',exact:true}).click({trial:true});await capture(page,{animations:'disabled',path:path.join(output,theme+'-390-profile-upload-dialog.png')});
   const uploadCountBefore=uploadCalls;
   await page.locator('#profile-avatar-upload').setInputFiles(imageFile);const preview=page.getByRole('dialog',{name:'Profilbild prüfen',exact:true});await preview.waitFor();assert.equal(uploadCalls,uploadCountBefore,'Choosing a file only previews it; no network upload');assert.ok((await preview.locator('.person-avatar img').getAttribute('src')).startsWith('blob:'),'Local crop preview uses an object URL');await preview.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(uploadCalls,uploadCountBefore,'Cancelling a preview cannot mutate the stored image');assert.equal(await page.locator('.settings-profile img').getAttribute('src'),oldImage);
   await page.locator('#profile-avatar-upload').setInputFiles(imageFile);await page.getByRole('dialog',{name:'Profilbild prüfen',exact:true}).getByRole('button',{name:'Bild übernehmen',exact:true}).click();await avatarEditor.getByRole('alert').filter({hasText:'Das Profilbild wartet auf die Sicherheitsprüfung.'}).waitFor();
   assert.equal(await page.locator('.settings-profile img').getAttribute('src'),oldImage,'Quarantined avatar preserves the currently stored image');assert.equal(await page.getByText('Profilbild gespeichert.',{exact:true}).count(),0);
   await avatarEditor.getByRole('button',{name:'Bild übernehmen',exact:true}).click();await avatarEditor.getByRole('alert').filter({hasText:'Das Profilbild ist noch nicht sicher freigegeben.'}).waitFor();assert.equal(activationCalls,1);assert.equal(await page.locator('.settings-profile img').getAttribute('src'),oldImage,'Explicit adoption cannot bypass a pending verdict');
   scanFailure=503;await page.locator('#profile-avatar-upload').setInputFiles(imageFile);await page.getByRole('dialog',{name:'Profilbild prüfen',exact:true}).getByRole('button',{name:'Bild übernehmen',exact:true}).click();await page.getByRole('status').filter({hasText:'Synthetic scan unavailable'}).waitFor();assert.equal(await page.locator('.settings-profile img').getAttribute('src'),oldImage);
   await page.getByRole('dialog',{name:'Profilbild prüfen',exact:true}).getByRole('button',{name:'Abbrechen',exact:true}).click();scanFailure=0;scanVerdict='clean';await avatarEditor.getByRole('button',{name:'Bild übernehmen',exact:true}).dblclick();await page.getByText('Profilbild gespeichert.',{exact:true}).waitFor();assert.equal(activationCalls,2,'Double tap adopts exactly once after the explicit earlier pending attempt');assert.equal(await page.locator('.settings-profile img').getAttribute('src'),'/api/files/'+newImageId+'/download');
   scanFailure=0;scanVerdict='clean';await page.locator('#profile-avatar-upload').setInputFiles(imageFile);await page.getByRole('dialog',{name:'Profilbild prüfen',exact:true}).getByRole('button',{name:'Bild übernehmen',exact:true}).click();await page.getByText('Profilbild gespeichert.',{exact:true}).waitFor();assert.equal(await page.locator('.settings-profile img').getAttribute('src'),'/api/files/'+newImageId+'/download');
   await navigate(base+'/einstellungen/firma');await page.locator('.company-logo-card b').getByText('Synthetic Branding Company',{exact:true}).waitFor();
   await openSettingsEditor(page);
   const companySheet=page.getByRole('dialog',{name:'Firmendaten bearbeiten',exact:true});
   assert.equal(await companySheet.locator(':scope>.filter-sheet-actions').count(),1,'Component FormActions is a direct, non-scrolling sheet footer');
   const logoGap=await companySheet.evaluate(el=>{const upload=el.querySelector('#company-logo-upload').closest('.form-field').getBoundingClientRect(),name=el.querySelector('input[autocomplete=organization]').closest('.form-field').getBoundingClientRect(),grid=el.querySelector('.form-grid');return {actual:name.top-upload.bottom,expected:parseFloat(getComputedStyle(grid).rowGap)}});
   assert.ok(Math.abs(logoGap.actual-logoGap.expected)<1,'Logo and company name use the same field-group gap');
   const saveBox=await companySheet.locator(':scope>.filter-sheet-actions>.button').boundingBox(),footerWidth=await companySheet.locator(':scope>.filter-sheet-actions').evaluate(el=>{const css=getComputedStyle(el);return el.getBoundingClientRect().width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth)});
   assert.ok(Math.abs(saveBox.width-footerWidth)<1,'Single action occupies the full shared footer content width, inside page gutters');
   assert.equal(await companySheet.locator('#company-logo-upload').isVisible(),false,'Native file picker stays hidden behind the central upload control');
   await companySheet.locator('#company-logo-upload').setInputFiles({name:'blocked.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic invalid image')});await companySheet.getByRole('alert').getByText('Bitte einen unterstützten Dateityp auswählen.',{exact:true}).waitFor();assert.equal(companyWrites,0,'Invalid logo cannot change company data');
   await page.locator('#company-logo-upload').setInputFiles(imageFile);
   scanVerdict='pending';await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByRole('status').filter({hasText:'Das Firmenlogo wartet auf die Sicherheitsprüfung.'}).waitFor();assert.equal(companyWrites,0,'Quarantine cannot complete company save');assert.equal(await page.locator('#company-logo-upload').count(),1,'Pending upload retains the edit form for recovery');
   scanFailure=503;await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByRole('status').filter({hasText:'Synthetic scan unavailable'}).waitFor();assert.equal(companyWrites,0);
   scanFailure=0;scanVerdict='clean';await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByText('Firmendaten gespeichert.',{exact:true}).waitFor();assert.equal(companyWrites,1,'Clean scan allows exactly one company save');
   await openSettingsEditor(page);await companySheet.getByRole('button',{name:'Entfernen',exact:true}).click();assert.equal(companyWrites,1,'Removing the preview remains a draft until explicit Save');
   await companySheet.getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('alertdialog',{name:'Änderungen verwerfen?',exact:true}).getByRole('button',{name:'Verwerfen',exact:true}).click();assert.equal(companyWrites,1,'Discarding logo removal never writes company settings');
   await openSettingsEditor(page);await companySheet.getByRole('button',{name:'Entfernen',exact:true}).click();const removalSaved=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/settings/company'&&response.request().method()==='PATCH');await companySheet.getByRole('button',{name:'Speichern',exact:true}).click();assert.equal((await removalSaved).status(),200);await companySheet.waitFor({state:'hidden'});assert.equal(companyPatch.logoUrl,'','Explicit removal clears only the existing authorized logo reference');assert.equal(companyWrites,2);
   await context.unroute('**/api/files',scanUpload);await context.unroute('**/api/files/*/download',imageDownload);await context.unroute('**/api/settings/company',logoSettings);await context.unroute('**/api/settings/profile',avatarResource);
   let failDocumentSettings=true;
   const settingsFailure=async route=>{if(failDocumentSettings&&route.request().method()==='GET')return route.fulfill({status:503,json:{message:'Synthetic document settings unavailable'}});return route.fallback()};
   await context.route('**/api/settings/documents',settingsFailure);
   await navigate(base+'/einstellungen/dokumente');await page.getByText('Synthetic document settings unavailable',{exact:true}).waitFor();
   await page.evaluate(()=>{window.__settingsRetryMarker='same-document'});failDocumentSettings=false;
   await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.__settingsRetryMarker),'same-document','Settings retry refetches the resource without reloading the app');
   // This document-settings owner retains its direct authorized edit control.
   await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click();
   await page.getByLabel('Rechnung – Einleitung',{exact:true}).fill('Unsaved settings survive revalidation');
   const settingsRead=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/settings/documents');
   await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await settingsRead;await page.waitForLoadState('networkidle');
   assert.equal(await appControlValue(page.getByLabel('Rechnung – Einleitung',{exact:true})),'Unsaved settings survive revalidation','Background settings data cannot overwrite an edited form');
   await context.unroute('**/api/settings/documents',settingsFailure);
   await verifyBusinessReadinessBrowser({page,context,navigate:url=>page.goto(url),resetPage:async url=>{await navigate(url);return page;},base,invoice,capture:name=>capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-readiness-${name}.png`)})});
   await page.setViewportSize({width:320,height:740});await navigate(base+'/einstellungen/benachrichtigungen');await page.waitForLoadState('networkidle');
   const preferenceRows=page.locator('.document-summary-row.is-information').filter({has:page.getByRole('switch')});assert.ok(await preferenceRows.count()>0,'Real notification switches render in the shared settings rows');
   for(const row of await preferenceRows.all()){
    const geometry=await row.evaluate(el=>{const label=el.querySelector('[id]').getBoundingClientRect(),toggle=el.querySelector('[role="switch"]').getBoundingClientRect(),box=el.getBoundingClientRect();return {label,toggle,box}});
    assert.ok(geometry.toggle.left>=geometry.label.right,'Notification switch follows its label on the same row');assert.ok(Math.abs(geometry.toggle.y+geometry.toggle.height/2-geometry.label.y-geometry.label.height/2)<2,'Notification label and switch share the central baseline');assert.ok(geometry.toggle.width>=44&&geometry.toggle.height>=44,'Notification switches retain touch targets');assert.ok(geometry.box.height>=44&&geometry.label.height<=24,'Compact notification rows retain one-line labels');
   }
   notificationWrites=0;failNotificationWrite=true;const emailPreference=page.getByRole('switch',{name:'Rechnungen · E-Mail',exact:true});await emailPreference.dblclick();await page.getByRole('alert').filter({hasText:'Einstellung konnte nicht gespeichert werden.'}).waitFor();assert.equal(notificationWrites,1,'Notification writes lock repeated clicks');assert.equal(await emailPreference.getAttribute('aria-checked'),'true','Failed optimistic preference returns to saved value');failNotificationWrite=false;await emailPreference.click();await page.getByRole('alert').filter({hasText:'Einstellung konnte nicht gespeichert werden.'}).waitFor({state:'hidden'});assert.equal(await emailPreference.getAttribute('aria-checked'),'false');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-notification-preferences.png`)});
   await navigate(base+'/einstellungen/dokumente');await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();const documentGeometry=await page.evaluate(()=>({header:document.querySelector('.mobile-header').getBoundingClientRect().height,rows:[...document.querySelectorAll('.detail-list>div')].map(row=>({label:row.querySelector('dt').getBoundingClientRect().toJSON(),value:row.querySelector('dd').getBoundingClientRect().toJSON(),labelOverflow:row.querySelector('dt').scrollWidth-row.querySelector('dt').clientWidth}))}));assert.ok(documentGeometry.header<=65,'Long settings title keeps a compact header');for(const row of documentGeometry.rows){assert.ok(row.label.right<=row.value.left||row.label.bottom<=row.value.top,'Detail labels cannot collide with values');assert.ok(row.labelOverflow<=1,'Detail labels wrap within their column')}
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-document-settings.png`)});
   await navigate(base+'/einstellungen/sicherheit');await page.getByText('Safari · iPhone',{exact:true}).waitFor();await page.getByText('Chrome · Windows',{exact:true}).waitFor();
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-security-settings.png`)});
   sessionDeletes=0;await page.getByRole('button',{name:'Abmelden',exact:true}).click();const revoke=page.getByRole('alertdialog');await revoke.waitFor();assert.equal(sessionDeletes,0,'Opening session confirmation does not revoke');await revoke.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(sessionDeletes,0);await page.getByRole('button',{name:'Abmelden',exact:true}).click();await revoke.getByRole('button',{name:'Abmelden',exact:true}).click();await revoke.waitFor({state:'hidden'});assert.equal(sessionDeletes,1);await page.getByText('Dieses Gerät',{exact:false}).waitFor();
   securityUnavailable=true;await navigate(base+'/einstellungen/sicherheit');await page.getByRole('alert').filter({hasText:'Fixture security status unavailable'}).waitFor();await page.getByRole('alert').filter({hasText:'Fixture sessions unavailable'}).waitFor();assert.equal(await page.getByText('Keine aktive Sitzung gefunden.',{exact:true}).count(),0,'Failed session load is not an empty session list');assert.equal(await page.getByText('Sicherheitsstatus wird geladen…',{exact:true}).count(),0,'Failed security load is not perpetual loading');securityUnavailable=false;let releaseSecurityRetry;securityRetryGate=new Promise(resolve=>{releaseSecurityRetry=resolve});await page.getByRole('alert').filter({hasText:'Fixture security status unavailable'}).getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByRole('alert').filter({hasText:'Fixture sessions unavailable'}).getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByRole('button',{name:'Passwort ändern',exact:true}).click();const retryPassword=page.getByRole('dialog',{name:'Passwort ändern',exact:true});await retryPassword.getByLabel('Neues Passwort',{exact:true}).fill('Draft retained through retry');const mfaRetried=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/mfa'&&response.status()===200),sessionsRetried=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/sessions'&&response.status()===200);releaseSecurityRetry();securityRetryGate=null;await Promise.all([mfaRetried,sessionsRetried]);await page.getByText('Safari · iPhone',{exact:true}).waitFor();assert.equal(await appControlValue(retryPassword.getByLabel('Neues Passwort',{exact:true})),'Draft retained through retry','Retry preserves unsaved security inputs');await retryPassword.getByLabel('Neues Passwort',{exact:true}).fill('');await retryPassword.getByRole('button',{name:'Schliessen',exact:true}).click();await retryPassword.waitFor({state:'hidden'});
   await navigate(base+'/einstellungen/abonnement');await page.getByText('Nutzung',{exact:true}).waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-subscription-settings.png`)});
  }
  if(hasInteraction('readiness'))await verifyBusinessReadinessBrowser({page,context,navigate:url=>page.goto(url),resetPage:async url=>{await navigate(url);return page;},base,invoice,capture:state=>capture(page,{animations:'disabled',path:path.join(output,theme+'-readiness-'+state+'.png')})});
  if(hasInteraction('discounts'))await verifyDocumentDiscountBrowser({page,context,base,invoice,customer,navigate:async url=>{await navigate(url);return page;},capture:state=>capture(page,{animations:'disabled',path:path.join(output,theme+'-discount-'+state+'.png')})});
  if(hasInteraction('avatar'))await verifyAvatarBrowser({page,context,base,navigate:async url=>{await navigate(url);return page;},capture:state=>capture(page,{animations:'disabled',path:path.join(output,theme+'-avatar-'+state+'.png')})});
  if(hasInteraction('operator')){
   await page.setViewportSize({width:320,height:740});await navigate(base+'/operator/sperrungen');await page.waitForLoadState('networkidle');const notice=await page.locator('.notice').evaluate(el=>[...el.children].map(child=>child.getBoundingClientRect().toJSON()));for(let i=1;i<notice.length;i++)assert.ok(notice[i].top>=notice[i-1].bottom+7,'Restriction details occupy separated rows');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-operator-restrictions.png`)});
   await navigate(base+'/operator');await page.waitForLoadState('networkidle');
   await page.locator('.operator-app-header').getByRole('button',{name:'Benutzerkonto',exact:true}).click();
   const panel=page.getByRole('dialog',{name:'Konto',exact:true});await panel.waitFor();await assertAccountAvatarSpacing(panel);
   const g=await page.evaluate(()=>({header:document.querySelector('.operator-app-header').getBoundingClientRect().bottom,panel:document.querySelector('.header-panel').getBoundingClientRect().top,inert:document.querySelector('.operator-page-head').inert}));
   assert.ok(g.panel<=1,'Mobile operator account shares the full-view panel');assert.equal(g.inert,true,'Operator background is inert');
   await panel.getByRole('button',{name:'Abmelden',exact:true}).click();await panel.getByRole('alert').waitFor();assert.ok(page.url().endsWith('/operator'),'Failed logout must not pretend the session ended');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-account.png`)});await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
   assert.equal(await page.locator('.operator-app-header').getByRole('button',{name:'Benutzerkonto',exact:true}).evaluate(el=>el===document.activeElement),true,'Operator account restores trigger focus');
   // Real isolated operator session; browser API fixtures never claim live SSO coverage.
   // All API requests remain intercepted; this does not claim real operator SSO coverage.
   await navigate(base+'/operator');await page.getByRole('heading',{name:'Abrechnung',exact:true}).waitFor();const dashboardMetrics=page.locator('.operator-insight-grid .metric');assert.equal(await dashboardMetrics.count(),2,'Secondary dashboard metrics start in one bounded billing view');await page.getByRole('tab',{name:'Support',exact:true}).click();const supportRing=page.locator('.operator-insight-grid .bo-ring-chart');await supportRing.getByRole('group',{name:'Offen / in Bearbeitung / gelöst: 10',exact:true}).waitFor();assert.deepEqual(await supportRing.locator('circle title').allTextContents(),['Offen: 2 · 20 %','In Bearbeitung: 3 · 30 %','Gelöst: 5 · 50 %'],'Support segments use the actual mutually exclusive ticket counts');assert.equal(await supportRing.locator('.bo-ring-details button').count(),3,'Every support segment has an accessible detail action');await supportRing.getByRole('button',{name:/^In Bearbeitung 3(?: ·)? 30 %$/}).click();assert.equal(await supportRing.locator('output').textContent(),'In Bearbeitung: 3','Support segment selection exposes its label and real count');const openSupportSegment=supportRing.getByRole('button',{name:'Offen: 2',exact:true});await openSupportSegment.focus();await openSupportSegment.press('Enter');assert.equal(await supportRing.locator('output').textContent(),'Offen: 2','Interactive chart segments support keyboard selection');await page.getByRole('tab',{name:'Abrechnung',exact:true}).click();for(const metric of await dashboardMetrics.all()){const boxes=await metric.evaluate(el=>({label:el.querySelector('.metric-top').getBoundingClientRect().toJSON(),value:el.querySelector('strong').getBoundingClientRect().toJSON()}));assert.ok(boxes.value.top>=boxes.label.bottom-1,'Dashboard values and labels occupy separate lines');}
   for(const section of await page.locator('.operator-insight-grid>.bo-workspace-section').all())assert.equal(await section.evaluate(el=>getComputedStyle(el).marginTop),'0px','Dashboard grid owns section spacing');const insightGeometry=await page.locator('.operator-insight-grid').evaluate(el=>({grid:el.getBoundingClientRect().width,section:el.firstElementChild.getBoundingClientRect().width}));assert.ok(insightGeometry.section>=insightGeometry.grid-1,'A single selected dashboard view fills its workspace');
   await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-dashboard-production.png')});
   const operatorFinancePattern=/\/api\/operator\/finance$/;
   let emptyFinanceRequests=0;
   const emptyOperatorPayments=route=>route.fulfill({json:{items:[]}}),emptyOperatorFinance=route=>{emptyFinanceRequests++;return route.fulfill({json:{payments:[],subscriptions:[],operatingCosts:[]}})};
   await context.route('**/api/operator/payments',emptyOperatorPayments);await navigate(base+'/operator/zahlungen');await page.getByText('Noch keine Kundenzahlungen',{exact:true}).waitFor();assert.equal(await page.locator('.payment-mini-bars i').count(),0,'Empty payments do not fabricate a trend');assert.equal(await page.locator('.operator-payment-insights .status').count(),0,'Chart classes do not inherit status badge styles');await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-payments-empty.png')});await context.unroute('**/api/operator/payments',emptyOperatorPayments);
   await context.route(operatorFinancePattern,emptyOperatorFinance);await navigate(base+'/operator/finanzen');await page.getByText('Keine Kundenzahlungen im gewählten Zeitraum',{exact:true}).waitFor();assert.ok(emptyFinanceRequests>0,'Empty finance must consume the isolated empty API fixture');assert.equal(await page.locator('.finance-month-bars').count(),0,'Empty finance replaces the chart with a compact contextual state');await chooseStatisticPeriod(page,page.locator('.operator-finance'),12);await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-finance-empty.png')});await context.unroute(operatorFinancePattern,emptyOperatorFinance);
   for(const width of [320,430,820,1440]){
    await page.setViewportSize({width,height:900});await navigate(base+'/operator/monitoring');const more=page.getByRole('button',{name:'Mehr anzeigen',exact:true});await more.waitFor();
    assert.equal(await page.locator('.bo-monitor-headline .metric').count(),4,'Exactly four primary statistics');
    assert.equal(await more.getAttribute('aria-expanded'),'false','Overview starts compact');
    assert.equal(await page.getByRole('heading',{name:'Performance im Verlauf',exact:true}).isVisible(),false,'Additional charts hidden initially');
    assert.equal(await page.locator('.bo-monitor-alert-summary').isVisible(),true,'Critical warnings remain visible before expanding');
    await more.click();await page.getByRole('heading',{name:'Performance im Verlauf',exact:true}).waitFor();
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,charts:document.querySelectorAll('.bo-monitor-chart').length,visibleCharts:[...document.querySelectorAll('.bo-monitor-chart')].filter(el=>el.getBoundingClientRect().height>0).length,tiles:[...document.querySelectorAll('.bo-monitor-headline .metric')].map(el=>el.getBoundingClientRect().toJSON())}));
    assert.equal(layout.overflow,false,'Monitoring has no horizontal overflow at '+width);assert.equal(layout.charts,3,'All three measured vital series remain available');assert.equal(layout.visibleCharts,width<=760?1:3,'Mobile shows one selectable chart; desktop shows three');
    if(width<=760){assert.ok(layout.tiles[1].left>layout.tiles[0].left,'Primary monitoring metrics keep a 2x2 grid');await page.getByRole('tab',{name:'INP',exact:true}).click();assert.equal(await page.locator('.bo-monitor-chart-slot[data-selected="true"] h3').textContent(),'INP p75 pro Stunde');await page.getByRole('tab',{name:'LCP',exact:true}).click();}
    await capture(page,{animations:'disabled',path:path.join(output,theme+'-'+width+'-operator-monitoring-performance.png')});
    await page.getByRole('tab',{name:'Dienste',exact:true}).click();await page.getByRole('heading',{name:'Service-Status',exact:true}).waitFor();
    assert.equal(await page.locator('.bo-monitor-chart').count(),0,'Tabs replace sections instead of adding a long list');
    const serviceGeometry=await page.locator('[data-service-status="unknown"] .status').boundingBox();assert.ok(serviceGeometry.x+serviceGeometry.width<=width+1,'Unknown service status fits the viewport');
    assert.equal(await page.locator('.monitoring-panel').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','Workspace has no card outline');
    await page.getByRole('tab',{name:/^Alarme/}).click();assert.equal(await page.locator('[data-alarm-id="mail-failed"] .status').textContent(),'Kritisch','Actual failure fixture triggers alarm');
    await page.getByRole('tab',{name:'Messwerte',exact:true}).click();await selectAppOption(page.getByLabel('Messbereich',{exact:true}), 'infrastructure');
    assert.equal(await page.locator('[data-metric-id="azure_cpu"]').getAttribute('data-health'),'unknown','Missing Azure data never becomes healthy');
    await page.getByRole('button',{name:'Datenquellen',exact:true}).click();const sources=page.getByRole('dialog',{name:'Datenquellen und Grenzen',exact:true});await sources.waitFor();assert.ok(await sources.getByRole('button',{name:'Schliessen',exact:true}).last().isVisible());await page.keyboard.press('Escape');await sources.waitFor({state:'hidden'});
    await capture(page,{animations:'disabled',path:path.join(output,theme+'-'+width+'-operator-monitoring-shared.png')});
    await page.getByRole('button',{name:'Weniger anzeigen',exact:true}).click();assert.equal(await page.getByRole('heading',{name:'Performance im Verlauf',exact:true}).isVisible(),false,'Further statistics collapse again');
   }
   await page.setViewportSize({width:390,height:740});await navigate(base+'/operator/kunden');const searchWidth=await page.locator('.records-search-row>.searchbox').evaluate(el=>el.getBoundingClientRect().width);await chooseRecordFilter(page,'Gesperrt');assert.ok(Math.abs(await page.locator('.records-search-row>.searchbox').evaluate(el=>el.getBoundingClientRect().width)-searchWidth)<1,'Activating filters never changes search width');const controlBoxes=await page.locator('.records-search-row').evaluate(el=>({search:el.querySelector('.searchbox').getBoundingClientRect().toJSON(),filter:el.querySelector('.records-filter-action').getBoundingClientRect().toJSON()}));assert.ok(controlBoxes.filter.x>=controlBoxes.search.right+4,'Filter stays outside the search field');await page.locator('.mobile-record-list').getByText('Zeta AG',{exact:true}).waitFor();assert.equal(await page.locator('.mobile-record-list').getByText('Prüffirma AG',{exact:true}).count(),0);
   await page.locator('.operator-mobile-nav a[href="/operator/tickets"]').click();await page.getByRole('heading',{name:'Tickets',exact:true}).waitFor();await page.locator('.operator-mobile-nav a[href="/operator/kunden"]').click();const keptFilter=page.locator('.records-active-line').filter({hasText:'Gesperrt'});await keptFilter.waitFor();assert.equal(await keptFilter.locator(':scope>span').innerText(),'Filter: Gesperrt','Admin list filters survive client navigation');assert.equal(await keptFilter.getByRole('button',{name:'Filter zurücksetzen',exact:true}).isVisible(),true,'The preserved filter retains its independent reset action');
   await page.reload();await page.getByRole('searchbox',{name:'Kunden suchen...',exact:true}).waitFor();assert.equal(await page.locator('.records-active-line').count(),0,'A reload clears private in-memory list state, matching the customer app');
    await selectAppOption(page.getByRole('combobox',{name:'Sortieren',exact:true}),'0:desc');assert.equal(await page.locator('.mobile-record-list .document-summary-row>b').first().innerText(),'Zeta AG','Admin sorting uses the canonical record controller');
   await page.getByRole('searchbox',{name:'Kunden suchen...',exact:true}).fill('Prüffirma');await page.locator('.mobile-record-list').getByText('Prüffirma AG',{exact:true}).waitFor();assert.equal(await page.locator('.mobile-record-list .document-summary-row').count(),1,'Inline admin search filters real rows');await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-customers-shared.png')});
   await page.getByRole('searchbox',{name:'Kunden suchen...',exact:true}).fill('');await chooseRecordFilter(page,'Aktiv');assert.equal(await page.locator('.records-toolbar').count(),0,'Inline controls do not repeat active filter summaries');await page.locator('.mobile-record-list').getByText('Testphase',{exact:true}).waitFor();assert.equal(await page.locator('.mobile-record-list').getByText('Zeta AG',{exact:true}).count(),0,'Active customers include live trials but exclude suspended accounts');await chooseRecordFilter(page,'Eingeschränkt');await page.locator('.mobile-record-list').getByText('Büro AG',{exact:true}).waitFor();assert.equal(await page.locator('.mobile-record-list').getByText('read_only',{exact:true}).count(),0,'Organization read-only status uses the central German label and filter');
   await page.setViewportSize({width:390,height:740});await navigate(base+'/operator/abonnemente');
   await page.locator('.bo-metric-tiles .metric').nth(3).waitFor();await page.locator('.mobile-record-list').getByText('Prüffirma AG',{exact:true}).waitFor();assert.equal(await page.locator('.bo-metric-tiles .metric').count(),4,'Subscription summary uses four central compact metrics');assert.equal(await page.locator('.mobile-record-list .status').count(),1,'Each account has one status badge; secondary status is plain metadata');await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-subscription-summary.png')});const accountRow=page.locator('.mobile-record-list button').filter({hasText:'Prüffirma AG'});await accountRow.click();
   const accountSheet=page.getByRole('dialog',{name:'Prüffirma AG',exact:true});await accountSheet.waitFor();assert.equal(await appControlValue(accountSheet.getByLabel('Plan',{exact:true})),'pro');assert.equal(await appControlValue(accountSheet.getByLabel('Benutzerlimit',{exact:true})),'10');assert.equal(await accountSheet.evaluate(el=>el.contains(document.activeElement)),true);
   const operatorPeer=await trackedPage();await operatorPeer.setViewportSize({width:390,height:740});await operatorPeer.goto(base+'/operator/abonnemente');await operatorPeer.locator('.mobile-record-list').getByText('Plan: Pro',{exact:true}).waitFor();
   await selectAppOption(accountSheet.getByLabel('Plan',{exact:true}), 'business');await operatorPeer.locator('.mobile-record-list').getByText('Plan: Business',{exact:true}).waitFor();await page.bringToFront();await accountSheet.getByLabel('Plan',{exact:true}).locator('..').locator('select option[value="business"]:checked').waitFor({state:'attached'});assert.equal(await appControlValue(accountSheet.getByLabel('Plan',{exact:true})),'business','Operator mutation revalidates the list and open account consistently');await operatorPeer.close();
   await page.setViewportSize({width:390,height:400});await accountSheet.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});const actionBox=await accountSheet.locator('.filter-sheet-actions').boundingBox();assert.ok(actionBox.y+actionBox.height<=401,'Operator FormSheet actions fit a short viewport');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-subscription-sheet.png`)});await page.keyboard.press('Escape');await accountSheet.waitFor({state:'hidden'});assert.equal(await accountRow.evaluate(el=>el===document.activeElement),true);
   await page.setViewportSize({width:390,height:740});await navigate(base+'/operator/sperrungen');await page.getByRole('button',{name:'Einschränkung erstellen',exact:true}).click();const restrictionSheet=page.getByRole('dialog',{name:'Einschränkung erstellen',exact:true});await restrictionSheet.waitFor();await restrictionSheet.getByRole('button',{name:'Einschränkung prüfen',exact:true}).click();const restrict=page.getByRole('alertdialog',{name:'Zugriff einschränken?',exact:true});await restrict.waitFor();assert.equal(await restrict.evaluate(el=>el.contains(document.activeElement)),true);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-restriction-confirm.png`)});await restrict.getByRole('button',{name:'Abbrechen',exact:true}).click();await restrict.waitFor({state:'hidden'});await restrictionSheet.getByRole('button',{name:'Schliessen',exact:true}).click();await restrictionSheet.waitFor({state:'hidden'});
   await navigate(base+'/operator/tickets/ticket-one');await page.getByText('Öffentliche Nachricht',{exact:true}).waitFor();assert.equal(await page.getByText('Vertrauliche interne Notiz',{exact:true}).count(),0);await page.getByRole('button',{name:'Interne Notiz',exact:true}).click();await page.getByText('Vertrauliche interne Notiz',{exact:true}).waitFor();assert.equal(await page.getByText('Öffentliche Nachricht',{exact:true}).count(),0);assert.equal(await page.locator('.message').count(),1);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-internal-message.png`)});
   await navigate(base+'/operator/audit');const auditRows=page.locator('.mobile-record-list');await auditRows.getByText('Microsoft-Anmeldung',{exact:true}).waitFor();await auditRows.getByText(/Fixture Operator/).waitFor();assert.equal(await auditRows.getByText(/Invalid Date|undefined/).count(),0,'Audit consumes the camelCase production API contract');await auditRows.getByText(/Zeitpunkt nicht verfügbar · System/).waitFor();await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-audit-contract.png')});
   await navigate(base+'/operator/ankuendigungen');await page.getByText('Noch keine Ankündigungen',{exact:true}).waitFor();assert.equal(await page.locator('input[placeholder="Kurzer Titel"]').count(),0,'Creation form stays in the shared sheet');await page.getByRole('button',{name:'Ankündigung erstellen',exact:true}).click();const announcementSheet=page.getByRole('dialog',{name:'Ankündigung erstellen',exact:true});await announcementSheet.waitFor();await announcementSheet.getByLabel('Titel',{exact:true}).waitFor();assert.ok(await announcementSheet.locator('.filter-sheet-actions').getByRole('button',{name:'Veröffentlichen',exact:true}).isVisible(),'Publishing action uses the shared form footer');await capture(page,{animations:'disabled',path:path.join(output,theme+'-operator-announcement-sheet.png')});let published=null;const announcementContract=async route=>{if(route.request().method()==='POST'){published=route.request().postDataJSON();return route.fulfill({status:201,json:{item:{id:'notice-one'}}})}return route.fulfill({json:{items:published?[{id:'notice-one',title:published.title,message:published.message,kind:published.kind,active:true,organizationId:null,createdAt:'2026-10-12T09:00:00Z'}]:[]}})};await context.route('**/api/operator/announcements',announcementContract);
   await announcementSheet.getByLabel('Titel',{exact:true}).fill('Geprüfter Hinweis');await announcementSheet.getByLabel('Nachricht',{exact:true}).fill('Geprüfte Nachricht');await selectAppOption(announcementSheet.getByLabel('Typ',{exact:true}), 'warning');await announcementSheet.getByRole('button',{name:'Veröffentlichen',exact:true}).click();await announcementSheet.waitFor({state:'hidden'});await page.getByText('Geprüfte Nachricht',{exact:true}).waitFor();assert.deepEqual(published,{title:'Geprüfter Hinweis',message:'Geprüfte Nachricht',kind:'warning',organizationId:null});assert.equal(await page.getByText(/Invalid Date|undefined/).count(),0,'Announcement list consumes the actual API contract');await context.unroute('**/api/operator/announcements',announcementContract);
   let failAccounts=true;const accountFailure=async route=>failAccounts?route.fulfill({status:503,json:{message:'Synthetic operator accounts unavailable'}}):route.fallback();await context.route('**/api/operator/accounts',accountFailure);
   await navigate(base+'/operator/abonnemente');await page.getByText('Synthetic operator accounts unavailable',{exact:true}).waitFor();await page.evaluate(()=>{window.__operatorRetryMarker='same-document'});failAccounts=false;await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.locator('.mobile-record-list').getByText('Prüffirma AG',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__operatorRetryMarker),'same-document','Operator retry preserves the document and targets the query');await context.unroute('**/api/operator/accounts',accountFailure);

  }
  if(hasInteraction('billing')){
   await page.setViewportSize({width:390,height:740});
   await navigate(base+'/einstellungen/abonnement');await page.waitForLoadState('networkidle');
   await page.locator('.invoices-panel').getByText('Noch keine Abrechnungen',{exact:true}).waitFor();
   assert.equal(await page.locator('.invoices-panel .document-summary-row').count(),0,'Unconnected billing never fabricates SaaS invoice history');
   const connected=route=>route.fulfill({json:{item:{plan:'pro',subscription_status:'active',account_status:'active',unit_amount_chf:129,billing_customer_ref:'synthetic-customer',billing_subscription_ref:'synthetic-subscription'}}});
   await context.route('**/api/settings/subscription',connected);await page.reload();
   await page.locator('.invoices-panel').getByRole('button',{name:'Billing-Portal',exact:true}).waitFor();
   assert.equal(await page.locator('.invoices-panel .document-summary-row').count(),0,'Connected SaaS invoices use the real portal, never static examples');
   await capture(page,{animations:'disabled',path:path.join(output,theme+'-390-billing.png')});
   await context.unroute('**/api/settings/subscription',connected);
  }
  if(hasInteraction('lab')){
   assert.equal(process.env.BINSO_UX_SERVER_MODE,'dev','UX-Lab checks require a development server');await navigate(base+'/dev/ux-lab');await waitForLabReady(page);
   assert.equal(await page.getByLabel('Nur lesen',{exact:true}).isDisabled(),true);
   assert.equal(await page.getByLabel('Fehlerfeld',{exact:true}).getAttribute('aria-invalid'),'true');
   const validation=await page.getByLabel('Fehlerfeld',{exact:true}).evaluate(el=>el.getAttribute('aria-describedby').split(' ').map(id=>document.getElementById(id)?.textContent));assert.deepEqual(validation,['Geschäftliche E-Mail-Adresse','Bitte eine gültige E-Mail eingeben.']);
   assert.equal(await page.getByLabel('Datum',{exact:true}).getAttribute('type'),'date');assert.equal(await page.getByLabel('Betrag',{exact:true}).getAttribute('inputmode'),'decimal');
   await page.getByRole('button',{name:'Bestätigung öffnen',exact:true}).click();const confirmation=page.getByRole('alertdialog',{name:'Synthetische Bestätigung',exact:true});await confirmation.waitFor();assert.equal(await confirmation.evaluate(el=>el.contains(document.activeElement)),true);await page.keyboard.press('Escape');await confirmation.waitFor({state:'hidden'});assert.equal(await page.getByRole('button',{name:'Bestätigung öffnen',exact:true}).evaluate(el=>el===document.activeElement),true);
   await capture(page,{animations:'disabled',fullPage:true,path:path.join(output,`${theme}-lab-central-variants.png`)});
   await navigate(base+'/dev/ux-lab');await waitForLabReady(page);await page.setViewportSize({width:390,height:740});await page.getByRole('button',{name:'wizard',exact:true}).click();const wizard=page.getByRole('dialog',{name:'WizardSheet',exact:true});await wizard.getByLabel('Name',{exact:true}).fill('Lab-Entwurf');await wizard.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});const first=await wizard.boundingBox(),footer=await wizard.locator('.mobile-sticky-save').boundingBox();await wizard.getByRole('button',{name:'Weiter',exact:true}).click();const second=await wizard.boundingBox();assert.ok(second.height<first.height&&second.height>footer.height,'A shorter wizard step releases unused sheet space while retaining its footer');assert.equal((await wizard.locator('.mobile-sticky-save').boundingBox()).y,footer.y,'Wizard actions never jump');await wizard.getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await appControlValue(wizard.getByLabel('Name',{exact:true})),'Lab-Entwurf');await page.setViewportSize({width:390,height:400});const short=await wizard.locator('.mobile-sticky-save').boundingBox();assert.ok(short.y+short.height<=401,'Wizard actions remain visible at keyboard-sized height');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-400-lab-wizard.png`)});await page.keyboard.press('Escape');await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();await wizard.getByRole('button',{name:'Weiter',exact:true}).click();await wizard.getByRole('button',{name:'Speichern',exact:true}).click();await wizard.waitFor({state:'hidden'});await page.setViewportSize({width:390,height:740});await page.locator('input[type=file]').setInputFiles({name:'lab.pdf',mimeType:'application/pdf',buffer:fixturePdf});await page.locator('canvas[data-rendered-page="1"]').waitFor();await page.getByRole('button',{name:'Nächste Seite',exact:true}).click();await page.locator('canvas[data-rendered-page="2"]').waitFor();assert.equal(await page.locator('.pdf-page').count(),1);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-lab-reference.png`)});
  }
  if(hasInteraction('data')){
   // Server hydration may fill invoice fields, but cannot make already typed input pristine.
   let releaseInvoice;const delayedInvoice=new Promise(resolve=>{releaseInvoice=resolve});
   const delayInvoiceRoute=async route=>{const url=new URL(route.request().url());if(url.pathname==='/api/documents/RE-TEST-1'||url.searchParams.get('kind')==='invoice'&&(url.pathname==='/api/documents'||url.pathname==='/api/demo/data'))await delayedInvoice;await route.fallback()};
   await context.route('**/api/**',delayInvoiceRoute);
   const hydrationForm=await trackedPage();
   try{
    await hydrationForm.goto(base+'/zahlungen/neu?invoice=RE-TEST-1');
    await hydrationForm.getByLabel('Rechnung',{exact:true}).waitFor({state:'visible'});assert.equal(await hydrationForm.getByLabel('Rechnung',{exact:true}).isDisabled(),true,'Invoice lookup is deliberately pending');
    await hydrationForm.getByLabel('Notiz',{exact:true}).fill('Written before invoice hydration');await hydrationForm.getByLabel('Zahlungsbetrag CHF',{exact:true}).fill('12.50');releaseInvoice();
    const invoiceControlId=await hydrationForm.getByLabel('Rechnung',{exact:true}).locator('..').locator('select').getAttribute('id');
    try{await hydrationForm.waitForFunction(id=>{const control=document.getElementById(id);return control?.value==='invoice-one'&&!control.disabled;},invoiceControlId);}
    catch(error){console.log('Invoice hydration controls',await hydrationForm.locator('select').evaluateAll(items=>items.map(el=>({label:el.getAttribute('aria-label'),value:el.value,disabled:el.disabled,options:[...el.options].map(option=>option.value)}))));throw error;}
    assert.equal(await appControlValue(hydrationForm.getByLabel('Zahlungsbetrag CHF',{exact:true})),'12.50','Invoice hydration cannot overwrite an already entered amount');
    await hydrationForm.getByRole('dialog',{name:'Zahlung erfassen',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();
    const hydrationDiscard=hydrationForm.getByRole('alertdialog');await hydrationDiscard.waitFor();
    await hydrationDiscard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();
    assert.equal(await appControlValue(hydrationForm.getByLabel('Notiz',{exact:true})),'Written before invoice hydration','Invoice hydration preserves input and its dirty guard');
   }finally{releaseInvoice();await context.unroute('**/api/**',delayInvoiceRoute);await hydrationForm.close()}
   // All mounted tabs share a synthetic ledger; only the actual PaymentForm mutation
   // can change it. Broadcast invalidation, not navigation/reload, updates consumers.
   const priorCustomer={...customer};collections.customers.push({...customer,id:'customer-two',city:'Zürich'});customerIdentityMode=true;
   const priorInvoice={...invoice},priorOpenAmount=summary.invoices[0].open_amount;
   dataPaymentMode=true;dataPaymentPosts=0;paymentReplays.clear();invoice.total=2561.97;invoice.subtotal=2370;invoice.vat=191.97;invoice.paid_amount=0;summary.invoices[0].open_amount=2561.97;
   const tabs={};for(const [name,path] of Object.entries({detail:'/rechnungen/RE-TEST-1',list:'/rechnungen',customer:'/kunden/customer-one',customerOverview:'/kunden/customer-one?section=details',payments:'/zahlungen',finance:'/finanzen',dashboard:'/dashboard',activity:'/kunden/customer-one',form:'/zahlungen/neu?invoice=RE-TEST-1'})){tabs[name]=await trackedPage();await tabs[name].goto(base+path);await tabs[name].waitForLoadState('networkidle');await tabs[name].evaluate(()=>{window.v215ConsumerMarker='same-document';window.v215ConsumerChanges=[];window.v215ConsumerObserver=new BroadcastChannel('binso-data-events');window.v215ConsumerObserver.onmessage=event=>{if(event.data?.type==='changed')window.v215ConsumerChanges.push(event.data)}});}
   const customerList=await trackedPage();await customerList.goto(base+'/kunden');await customerList.waitForLoadState('networkidle');
   await customerList.evaluate(()=>{window.v215CustomerListMarker='same-document';window.v215CustomerChanges=[];window.v215CustomerObserver=new BroadcastChannel('binso-data-events');window.v215CustomerObserver.onmessage=event=>{if(event.data?.type==='changed')window.v215CustomerChanges.push(event.data)}});
   const editor=await trackedPage();await editor.goto(base+'/rechnungen/neu?customerId=customer-one');await editor.waitForLoadState('networkidle');const picker=editor.getByLabel('Kunde auswählen',{exact:true});
   const customerOptions=await picker.locator('..').locator('select option').evaluateAll(options=>options.map(option=>({id:option.value,label:option.textContent})));
   assert.deepEqual(customerOptions.filter(option=>option.id).map(option=>option.id).sort(),['customer-one','customer-two'],'Duplicate names retain exactly the two distinct customer identities');
   assert.equal(customerOptions.filter(option=>!option.id).length,1,'The shared directory control retains one unselected placeholder');
   assert.equal(customerOptions.filter(option=>option.id).every(option=>option.label.includes(customer.name)),true,'Both same-name customers remain identifiable choices');
   assert.equal(await appControlValue(picker),'customer-one','Linked customer initialized by ID');await selectAppOption(picker, 'customer-two');
   const rename=await trackedPage();await rename.goto(base+'/kunden/customer-two/bearbeiten');await rename.waitForLoadState('networkidle');await rename.getByLabel('Kundenname *',{exact:true}).fill('Identität bleibt erhalten AG');assert.equal(await appControlValue(rename.getByLabel('Kundenname *',{exact:true})),'Identität bleibt erhalten AG','An editor never appends server hydration to newly entered input');await rename.getByRole('button',{name:'Änderungen speichern',exact:true}).click();await rename.getByText('Kunde gespeichert.',{exact:true}).waitFor();
   await customerList.waitForFunction(()=>window.v215CustomerChanges.some(message=>message.domains?.includes('customers')),undefined,{polling:100});
   await editor.bringToFront();await editor.waitForFunction(()=>document.querySelector('option[value="customer-two"]')?.textContent?.includes('Identität bleibt erhalten AG'));assert.equal(await appControlValue(picker),'customer-two','Rename/revalidation cannot switch a draft back to the URL customer');await customerList.bringToFront();
   // Wait on the visible identity row itself: responsive container visibility is
   // transient while the background consumer commits its refreshed response.
   const renamedCustomerRow=customerList.locator('a[href="/kunden/customer-two"]').filter({visible:true});
   try{
    await renamedCustomerRow.getByText('Identität bleibt erhalten AG',{exact:true}).waitFor();
   }catch(error){
    console.log('Customer consumer diagnostics:',JSON.stringify(await customerList.evaluate(()=>({visibility:document.visibilityState,body:document.body.innerText,rows:[...document.querySelectorAll('a[href="/kunden/customer-two"]')].map(row=>({text:row.textContent,rect:row.getBoundingClientRect().toJSON(),display:getComputedStyle(row).display})),changes:window.v215CustomerChanges}))));
    await capture(customerList,{fullPage:true,path:path.join(output,`${theme}-customer-consumer-error.png`)});
    throw error;
   }
   assert.equal(await customerList.evaluate(()=>window.v215CustomerListMarker),'same-document','Returning to the consumer tab revalidates without a reload');
   for(const consumer of Object.values(tabs))await consumer.waitForFunction(()=>window.v215ConsumerChanges.some(message=>message.domains?.includes('customers')),undefined,{polling:100});
   await rename.close();await editor.close();await customerList.close();customerIdentityMode=false;
   await tabs.list.bringToFront();await tabs.list.waitForLoadState('networkidle');holdDataRefresh=true;
   const backgroundRead=tabs.list.waitForRequest(request=>new URL(request.url()).pathname==='/api/documents');
   await tabs.list.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await backgroundRead;
   if(!await tabs.list.getByText(/2[’']561\.97/).count())console.log('Pending read diagnostics:',await tabs.list.locator('body').innerText());
   assert.ok(await tabs.list.getByText(/2[’']561\.97/).count(),'A confirmed invoice stays visible while a background request is pending');
   holdDataRefresh=false;dataRefreshWaiters.splice(0).forEach(resolve=>resolve());await tabs.list.waitForLoadState('networkidle');
   await tabs.customer.goto(base+'/kunden/customer-one?section=documents');await tabs.activity.goto(base+'/kunden/customer-one?section=activity');
   for(const consumer of Object.values(tabs))await consumer.evaluate(()=>{window.v215ConsumerChanges=[]});
   await tabs.form.getByLabel('Zahlungsbetrag CHF',{exact:true}).fill('1000');
   const initialPosts=dataPaymentPosts;dataPaymentFailed=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Synthetic payment failed',{exact:true}).waitFor();assert.equal(invoice.paid_amount,0);assert.equal(dataPaymentPosts,initialPosts+1);assert.equal(await tabs.detail.getByText(/1[’']561\.97/).count(),0,'Failed payment cannot create a visible fictional balance');
   dataPaymentFailed=false;incompletePaymentResponse=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.',{exact:true}).waitFor();assert.equal(await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).count(),0,'Incomplete JSON confirmation cannot report financial success');assert.equal(invoice.paid_amount,0);incompletePaymentResponse=false;losePaymentResponse=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();try{await tabs.form.getByText('Keine Verbindung zum Server. Bitte die Verbindung und den gespeicherten Stand prüfen.',{exact:true}).waitFor();}catch(error){console.log('Lost payment reply diagnostics',await tabs.form.locator('body').innerText(),{paid:invoice.paid_amount,posts:dataPaymentPosts});await capture(tabs.form,{fullPage:true,path:path.join(output,theme+'-lost-payment-error.png')});throw error;}assert.equal(invoice.paid_amount,1000,'The server committed although its response was lost');assert.equal(await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).count(),0,'Lost response is never reported as success');
   await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).waitFor();assert.equal(dataPaymentPosts,initialPosts+4);assert.equal(invoice.paid_amount,1000,'Retry replays the original request without a second payment');assert.equal(collections.payments.filter(row=>row.id==='foundation-payment-0').length,1);
   for(const [name,value] of [['detail',/1[’']561\.97/],['list',/1[’']561\.97/],['customer',/1[’']561\.97/],['finance',/1[’']561\.97/],['payments',/1[’']000\.00/],['dashboard',/1[’']561\.97/],['customerOverview',/1[’']561\.97/],['activity','Zahlung erhalten']]){
    await tabs[name].waitForFunction(()=>window.v215ConsumerChanges.some(message=>message.domains?.includes('payments')),undefined,{polling:100});await tabs[name].bringToFront();await tabs[name].getByText(value,{exact:typeof value==='string'}).first().waitFor();assert.equal(await tabs[name].evaluate(()=>window.v215ConsumerMarker),'same-document',name+' updates without a reload');
   }
   for(const [name,amount] of [['dashboard',"CHF 1'000.00"],['finance',"CHF 1'561.97"],['customerOverview',"CHF 1'561.97"]]){
    await tabs[name].bringToFront();assert.equal((await tabs[name].locator(name==='customerOverview'?'.detail-grid [data-area="summary"] .metric>strong':'.bo-cash-overview .metric>strong').nth(1).textContent())?.replaceAll('’',"'"),amount,name+' domain metric refreshes from the same confirmed ledger');
   }
   // An already settled invoice may receive a real additional payment, but only
   // after explicit review. A concurrent receipt invalidates that exact consent.
   invoice.paid_amount=invoice.total;invoice.credit_amount=0;invoice.refund_amount=0;
   const surplus=await trackedPage();await surplus.goto(base+'/zahlungen/neu?invoice=RE-TEST-1');await surplus.waitForLoadState('networkidle');
   await surplus.getByLabel('Zahlungsbetrag CHF',{exact:true}).fill('10');
   const consent=surplus.getByRole('checkbox',{name:'Tatsächliche Überzahlung bestätigen',exact:true}),submit=surplus.getByRole('button',{name:'Zahlung speichern',exact:true});
   await consent.waitFor();assert.equal(await consent.isChecked(),false);assert.equal(await submit.isDisabled(),true,'No implicit consent on a settled invoice');
   await consent.check();assert.equal(await submit.isEnabled(),true);stalePaymentBalance=true;
   await submit.click();await surplus.getByText('Der Zahlungsstand hat sich geändert. Bitte Betrag und Überzahlung erneut prüfen.',{exact:true}).waitFor();
   assert.equal(await consent.isChecked(),false,'A stale server balance invalidates consent');assert.equal(await submit.isDisabled(),true);assert.equal(await appControlValue(surplus.getByLabel('Zahlungsbetrag CHF',{exact:true})),'10','Failed confirmation preserves the entered amount');
   await surplus.waitForLoadState('networkidle');await consent.check();const confirmedPost=surplus.waitForRequest(request=>new URL(request.url()).pathname==='/api/payments'&&request.method()==='POST');
   await submit.click();const submitted=(await confirmedPost).postDataJSON();assert.equal(submitted.confirmOverpayment,true);assert.deepEqual(submitted.expectedBalance,{openAmount:0,paidAmount:invoice.total+1,creditAmount:0,refundAmount:0});
   await surplus.getByText('Zahlung gespeichert.',{exact:true}).waitFor();await surplus.waitForURL('**/rechnungen/RE-TEST-1');await surplus.waitForLoadState('networkidle');
   await surplus.getByText('Überbezahlt',{exact:true}).waitFor();await surplus.getByText('Kundenguthaben',{exact:true}).waitFor();assert.equal(invoice.paid_amount,invoice.total+11);await surplus.close();
   console.log('Actual overpayment UI: default-off consent, settled invoice, stale exact balance clears consent without losing amount, fresh four-field confirmation and real detail credit state passed.');
   for(const tab of Object.values(tabs))await tab.close();dataPaymentMode=false;Object.assign(invoice,priorInvoice);for(const key of Object.keys(invoice))if(!(key in priorInvoice))delete invoice[key];summary.invoices[0].open_amount=priorOpenAmount;collections.payments=collections.payments.filter(row=>!row.id.startsWith('foundation-payment-'));collections.customers=collections.customers.filter(row=>row.id!=='customer-two');Object.assign(customer,priorCustomer);
   console.log('Actual PaymentForm: failed mutation has no fictional balance; lost committed response retries the same key without double payment; confirmed partial payment updates eight mounted cross-tab consumers without reload.');
  }
  assert.deepEqual(errors,[],'Browser runtime errors');
  await context.close();context=null;await browser.close();browser=null;
 }
 assert.deepEqual(accessibilityFailures,[],'Blocking accessibility violations');
 if(process.env.BINSO_UX_COMPLIANCE==='1'&&process.env.BINSO_UX_MATRIX_ONLY!=='1'){
  const groups={customers:['UX-INT-001','UX-INT-004'],header:['UX-INT-002'],time:['UX-INT-003'],finance:['UX-FIN-005','UX-FIN-007'],documents:['UX-PDF-001'],data:['UX-FIN-006']};
  const checks=requestedInteractions.flatMap(group=>(groups[group]??[]).map(id=>({id,status:'partial',observed:{suite:group,completed:true,source:'scripts/ux-browser-test.mjs',limitation:'Existing representative assertion suite passed; individual route/state coverage is incomplete'},selector:null})));
  await writeTestOutput(path.join(output,'compliance-interactions-'+(process.env.BINSO_UX_BROWSER??'chromium')+'.json'),JSON.stringify({schemaVersion:1,...complianceIdentity(),route:'representative interaction suites',state:'interaction',engine:process.env.BINSO_UX_BROWSER??'chromium',checks},null,2));
 }
 await writeTestOutput(path.join(output,`results-${process.env.BINSO_UX_THEMES??'light-dark'}.json`),JSON.stringify({browser:process.env.BINSO_UX_BROWSER??'chromium',device:process.env.BINSO_UX_DEVICE??'responsive viewport',scope:'Synthetic API UI fixtures; no production writes',interactions:requestedInteractions,results,errors},null,2));
 await fs.copyFile(path.join(output,`results-${process.env.BINSO_UX_THEMES??'light-dark'}.json`),path.join(output,`results-${process.env.BINSO_UX_BROWSER??'chromium'}-${process.env.BINSO_UX_THEMES??'light-dark'}.json`));
 if(navigationCaptures.length)await writeTestOutput(path.join(output,'navigation-capture.json'),JSON.stringify({schemaVersion:3,provenance:'Explicit 2026-10-18 flat Microsoft material capture; preserved bounds/rights/safe areas/motion; browser fixtures, not physical PWA approval.',cases:navigationCaptures},null,2)+'\n');
 if(process.env.BINSO_UX_VISUAL_AUDIT==='1')await writeTestOutput(path.join(output,'visual-audit.json'),JSON.stringify({scope:'Rendered candidates for human review, not automatic ZIP acceptance',views:visualAudit},null,2));
 console.log(`UX browser checks passed: ${results.length} route/theme/viewport combinations ; interactions: ${process.env.BINSO_UX_MATRIX_ONLY==="1"?"matrix only":requestedInteractions.join(",")}. Artifacts: ${output}`);
}catch(error){console.error('UX regression failed before fixture cleanup:',error.stack??error);throw error;}finally{await context?.close();await browser?.close();server?.kill();await uiAuth.close();}
