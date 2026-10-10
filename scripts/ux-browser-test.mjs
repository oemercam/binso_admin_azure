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
import {fullRoutes} from './qa-plan.mjs';
import {saveDomEvidence} from './ux-dom-evidence.mjs';

// Synthetic UI fixtures: real business/RLS integration is covered by migration-test.mjs.
// No request reaches a production system; unhandled fixture APIs fail closed.
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser';
// Keep period assertions valid as the real Swiss calendar advances; never freeze
// Date.now, which would corrupt timer/recovery interactions in the same suite.
const statisticToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const [statisticYear,statisticMonth]=statisticToday.split('-').map(Number);
const previousStatisticFrom=new Date(Date.UTC(statisticYear,statisticMonth-2,1)).toISOString().slice(0,10);
const previousStatisticTo=new Date(Date.UTC(statisticYear,statisticMonth-1,0)).toISOString().slice(0,10);
const cashFixture=(income=200)=>process.env.BINSO_UX_FIXTURE_CASE?{...fixtureCase(process.env.BINSO_UX_FIXTURE_CASE).cash,payments:fixtureCase(process.env.BINSO_UX_FIXTURE_CASE).cash.payments.map(p=>({...p,payment_date:statisticToday})),outflows:fixtureCase(process.env.BINSO_UX_FIXTURE_CASE).cash.outflows.map(p=>({...p,payment_date:statisticToday}))}:({payments:[{payment_date:previousStatisticFrom,amount:120},{payment_date:statisticToday,amount:income}],outflows:[{payment_date:statisticToday,amount:50}],incomplete:false});

await fs.mkdir(output,{recursive:true});
const port=process.env.BINSO_UX_PORT??'3200';
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:'+port;
if(process.env.BINSO_UX_COMPLIANCE==='1'&&!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Compliance fixtures require an isolated loopback test server');
let server;
if(!process.env.BINSO_BASE_URL){
  let occupied=false;try{occupied=(await fetch(base+'/api/health')).ok;}catch{}
  if(occupied)throw new Error('QA port is occupied; supply BINSO_BASE_URL deliberately or choose BINSO_UX_PORT. Refusing an unidentified/stale server.');
  server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next',process.env.BINSO_UX_SERVER_MODE??'start',...(process.env.BINSO_UX_SERVER_MODE==='dev'?['--webpack']:[]),'--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:port,HOSTNAME:'127.0.0.1'}});
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
const customer={id:'customer-one',customer_no:'K-000001',name:'Prüffirma AG',city:'Bern',status:'active',contact_name:'Test Person',email:'test@example.invalid',street:'Teststrasse 1',postal_code:'3000'};
const product={id:'product-one',name:'Beratung',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'};
const employee={id:'employee-one',first_name:'Test',last_name:'Person',email:'mitarbeiterin.mit.langem.namen@internationales-unternehmen.example.invalid',start_date:'2025-01-01',job_title:'ICT',workload_percent:80,weekly_hours:42,status:'active'};
const expense={id:'expense-one',merchant:'SBB',amount:89,currency:'CHF',expense_date:'2026-10-08',status:'submitted',employee_id:employee.id,employee};
const invoice={id:'invoice-one',number:'RE-TEST-1',kind:'invoice',customer_id:customer.id,customer,total:135.13,subtotal:125,vat:10.13,paid_amount:100,currency:'CHF',issue_date:'2026-10-08',due_date:'2026-11-08',status:'sent',items:[{description:'Beratung',quantity:1,unit:'hour',unit_price:125,vat_rate:8.1}]};
const offer={...invoice,id:'offer-one',kind:'offer',number:'AN-TEST-1',status:'sent'};
const payment={id:'payment-one',amount:135.13,currency:'CHF',paid_on:'2026-10-08',method:'bank',status:'booked',customer_id:customer.id,customer,invoice};
const ticket={id:'ticket-one',case_number:'T-TEST-1',subject:'Testanfrage',status:'open',priority:'normal',created_at:'2026-10-08T10:00:00Z',updated_at:'2026-10-08T10:00:00Z'};
const collections={customers:[customer],products:[product],employees:[employee],expenses:[expense],payments:[payment],documents:[invoice,offer],projects:[],time_entries:[]};
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
 const rows=collections.customers.filter(item=>(!status||item.status===status)&&(!query||normalize([item.name,item.customer_no,item.contact_name,item.email,item.phone,item.city].join(' ')).includes(query))).sort((a,b)=>String(a[field]??'').localeCompare(String(b[field]??''),'de-CH')*(direction==='desc'?-1:1));
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
const summary={invoices:[{currency:'CHF',open_amount:35.13,revenue:135.13,open_count:1,overdue_count:0,draft_count:0}],offers:{draft_count:0,sent_count:0,accepted_count:0},time:{hours:2.25,invoiced_hours:0,ready_hours:0,unapproved_hours:0},expenses:{ready_amount:0}};
const fixturePdf=process.env.BINSO_UX_PDF_FILE?await fs.readFile(process.env.BINSO_UX_PDF_FILE):await new Promise(resolve=>{const doc=new PDFDocument({size:'A4'}),chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.text('Invoice fixture page one');doc.addPage().text('Payment fixture page two');doc.end()});
const requestedInteractions=process.env.BINSO_UX_INTERACTIONS?.split(',')??['data','customers','products','employees','documents','finance','time','expenses','chat','billing','header','operator','settings'];
const hasInteraction=name=>requestedInteractions.includes(name);
let captureQueue=Promise.resolve();
async function capture(page,options,target=page){
 if(process.env.BINSO_UX_COMPLIANCE==='1')await measureCompliance(page,{output:path.join(output,'compliance'),route:new URL(page.url()).pathname,theme:await page.locator('html').getAttribute('data-theme'),width:page.viewportSize().width,state:'interaction:'+path.basename(options.path),engine:process.env.BINSO_UX_BROWSER??'chromium'});
 const pending=captureQueue.then(async()=>{await page.bringToFront();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));if(process.env.BINSO_UX_SCREENSHOTS!=='0'||/error|overflow/.test(options.path))await target.screenshot(process.env.BINSO_UX_BROWSER==='webkit'?{...options,animations:'allow'}:options);if(target===page&&process.env.BINSO_UX_DOM_EVIDENCE==='1')await saveDomEvidence(page,options.path.replace(/\.png$/,'.json'));});
 captureQueue=pending.catch(()=>{});return pending;
}
async function assertAccountAvatarSpacing(panel){
 const geometry=await panel.locator('.account-sheet-profile').evaluate(el=>{const avatar=el.firstElementChild.getBoundingClientRect(),name=el.lastElementChild.getBoundingClientRect();return {avatarRight:avatar.right,nameLeft:name.left,gap:parseFloat(getComputedStyle(el).columnGap)}});
 assert.ok(geometry.nameLeft>=geometry.avatarRight+geometry.gap-1,'Account identity preserves its declared gap after the actual avatar: '+JSON.stringify(geometry));
}
async function actionEvidence(page,name,theme){
 const dialog=page.getByRole('dialog',{name,exact:true});
 await dialog.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});
 if(!process.env.BINSO_UX_BASELINE){
  const rows=await dialog.locator('.action-row').evaluateAll(nodes=>nodes.map(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect(),t=el.querySelector('span').getBoundingClientRect();return {height:r.height,font:c.fontSize,weight:c.fontWeight,gap:c.columnGap,text:t.x,icon:el.firstElementChild.tagName,destructive:el.classList.contains('action-row-danger'),chevron:el.querySelectorAll('svg').length}}));
  assert.ok(rows.length>0,'Entity actions use the central row');
  assert.equal(await dialog.locator('.sheet-menu,.button-danger').count(),0,'No legacy action rows or detached destructive button');
  for(const row of rows){assert.ok(row.height>=48);assert.equal(row.font,'14px');assert.equal(row.weight,'500');assert.equal(row.text,rows[0].text);if(row.destructive)assert.equal(row.chevron,1,'Destructive row has no navigation arrow');}
 }
 await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${name}-actions.png`)});
}
const results=[];const errors=[];const accessibilityFailures=[];let failMutation=false,posts=0,failLedger=false,failSend=false,messagePosts=0,uploads=0,employeeLedgerFixture=false,groupingFixture=false,releaseReceiptScan;
let policyPosts=0,policyRequired=true,policyRole=process.env.BINSO_UX_FIXTURE_CASE==='employee'?'member':['owner','admin','finance'].includes(process.env.BINSO_UX_FIXTURE_CASE)?process.env.BINSO_UX_FIXTURE_CASE:"owner",policyReadOnly=false,failPolicy=false,teamPosts=0,failTeam=false;
let failPreferences=false,preferencePosts=0;
let notificationWrites=0,failNotificationWrite=false,securityUnavailable=false,sessionDeletes=0;
let dataPaymentMode=false,dataPaymentFailed=false,dataPaymentPosts=0,holdDataRefresh=false,customerIdentityMode=false,losePaymentResponse=false,incompletePaymentResponse=false;const paymentReplays=new Map(),dataRefreshWaiters=[];
let projectSourceMode=false,failProjectSource=false,projectSourceTitle='Synthetic accepted offer',processRecoveryMode=false;
let incompleteProductResponse=false;
let projectPosts=0,failProjectCreate=false,loseProjectResponse=false;const projectReplays=new Map();
let customerPosts=0,failCustomerCreate=false,loseCustomerResponse=false;const customerReplays=new Map();
let teamMemberRole='member';let supportMessages=[];
const operatorAccount={tenant_id:'tenant-one',tenant:{name:'Prüffirma AG'},plan:'pro',subscription_status:'active',account_status:'active',user_limit:10,updated_at:'2026-10-09'};
let context;
try{
 for(const theme of (process.env.BINSO_UX_THEMES?.split(",")??["light","dark"])){
  teamMemberRole='member';supportMessages=[];let preferenceTheme=theme;
  operatorAccount.plan='pro';
  browser=await browserType.launch(launchOptions);
  context=await browser.newContext({...(process.env.BINSO_UX_DEVICE?engines.devices[process.env.BINSO_UX_DEVICE]:{}),viewport:{width:1440,height:1000},colorScheme:"dark",serviceWorkers:"block"});
  await context.addCookies([{name:'binso_demo',value:'1',url:base},{name:'binso_operator_demo',value:'1',url:base}]);
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-08'}))},theme);
  await context.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(req.method()!=='GET'){
    if(p==='/api/projects'){projectPosts++;const body=JSON.parse(req.postData()),key=req.headers()['idempotency-key'];assert.ok(key,'Project creation carries a stable replay key');assert.equal(body.customerId,'','The minimal internal project needs no artificial customer');assert.ok(body.name.length>=2);await new Promise(resolve=>setTimeout(resolve,150));if(failProjectCreate)return route.fulfill({status:503,json:{message:'Synthetic project creation unavailable'}});if(!projectReplays.has(key))projectReplays.set(key,{id:projectReplays.size?'project-created-'+(projectReplays.size+1):'project-created',name:body.name,customer_id:null});if(loseProjectResponse){loseProjectResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:projectReplays.get(key)}});}
    if(p==='/api/customers'&&req.method()==='POST'){customerPosts++;const body=JSON.parse(req.postData()),key=req.headers()['idempotency-key'];assert.ok(key,'Customer creation carries its recoverable request key');assert.ok(body.name.length>=2);assert.equal(body.city,'','Minimal creation does not invent a mandatory city');await new Promise(resolve=>setTimeout(resolve,150));if(failCustomerCreate)return route.fulfill({status:503,json:{message:'Synthetic customer creation unavailable'}});if(!customerReplays.has(key))customerReplays.set(key,{...customer,id:'customer-created-'+(customerReplays.size+1),customer_no:'K-'+String(customerReplays.size+2).padStart(6,'0'),name:body.name,city:body.city});if(loseCustomerResponse){loseCustomerResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:customerReplays.get(key)}});}
    if(p==='/api/products'&&incompleteProductResponse)return route.fulfill({status:201,json:{ok:true}});
    if(req.method()==='PATCH'&&p==='/api/operator/accounts/tenant-one'){const body=JSON.parse(req.postData());if(body.plan)operatorAccount.plan=body.plan;if(body.userLimit)operatorAccount.user_limit=body.userLimit;if(body.subscriptionStatus)operatorAccount.subscription_status=body.subscriptionStatus;return route.fulfill({json:{item:operatorAccount}});}
    if(customerIdentityMode&&req.method()==='PATCH'&&p.startsWith('/api/customers/')){const item=collections.customers.find(item=>item.id===p.split('/')[3]);Object.assign(item,JSON.parse(req.postData()));return route.fulfill({json:{item}});}
    if(p==='/api/payments'&&dataPaymentMode){dataPaymentPosts++;if(incompletePaymentResponse)return route.fulfill({status:201,json:{}});if(dataPaymentFailed)return route.fulfill({status:503,json:{error:'unavailable',message:'Synthetic payment failed'}});const key=req.headers()['idempotency-key'];assert.ok(key,'Financial requests carry a replay key');if(paymentReplays.has(key))return route.fulfill({status:200,json:{item:paymentReplays.get(key)}});const body=JSON.parse(req.postData());invoice.paid_amount+=body.amount;const row={...payment,id:'foundation-payment',amount:body.amount,paid_on:'2026-10-09'};collections.payments.unshift(row);paymentReplays.set(key,row);summary.invoices[0].open_amount=invoice.total-invoice.paid_amount;if(losePaymentResponse){losePaymentResponse=false;return route.abort('failed');}return route.fulfill({status:201,json:{item:row}});}

    if(p==='/api/documents/preview')return route.fulfill({body:fixturePdf,contentType:'application/pdf'});
    if(p==='/api/demo/session')return route.fulfill({json:{ok:true,databaseBacked:true,expiresIn:86400}});
    if(p==='/api/expenses'){posts++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:failMutation?503:200,json:failMutation?{message:'Fixture offline'}:{item:{...expense,id:'new-expense'}}});}
    if(p==='/api/support/tickets/ticket-one/messages'){messagePosts++;await new Promise(resolve=>setTimeout(resolve,150));const item={id:'sent-'+messagePosts,author_type:'customer',body:JSON.parse(req.postData()).body,created_at:'2026-10-08T10:00:00Z'};if(!failSend)supportMessages.push(item);return route.fulfill({status:failSend?503:200,json:failSend?{message:'Fixture message offline'}:{item}});}
    if(p==='/api/expenses/scan-receipt'){await new Promise(resolve=>{releaseReceiptScan=resolve});return route.fulfill({json:{merchant:'SBB',total:89,currency:'CHF',date:'2026-10-08',confidence:0.95}});}
    if(p==='/api/files'){uploads++;return route.fulfill({json:{item:{id:'receipt-one'}}});}
    if(p==='/api/settings/team/invitations'||p.startsWith('/api/settings/team/members/')){teamPosts++;await new Promise(resolve=>setTimeout(resolve,150));if(!failTeam&&req.method()==='PATCH')teamMemberRole=JSON.parse(req.postData()).role;return route.fulfill({status:failTeam?503:200,json:failTeam?{message:'Fixture team unavailable'}:{ok:true}});}
    if(p==='/api/time-entries/policy'){policyPosts++;await new Promise(resolve=>setTimeout(resolve,150));if(failPolicy)return route.fulfill({status:503,json:{message:'Fixture policy unavailable'}});policyRequired=JSON.parse(req.postData()).required;return route.fulfill({json:{time_approval_required:policyRequired}});}
    if(p==='/api/settings/notifications'){notificationWrites++;preferencePosts++;await new Promise(resolve=>setTimeout(resolve,100));return route.fulfill({status:(failNotificationWrite||failPreferences)?503:200,json:(failNotificationWrite||failPreferences)?{message:'Fixture notification unavailable'}:{ok:true}});}
    if(p.startsWith('/api/auth/sessions')){sessionDeletes++;return route.fulfill({json:{ok:true,revoked:1}});}
    if(p==='/api/settings/profile'&&req.method()==='PATCH'){const body=JSON.parse(req.postData());if(body.theme)preferenceTheme=body.theme;return route.fulfill({json:{ok:true,item:{theme:preferenceTheme,language:'de'}}});}
    if(p==='/api/operator/logout')return route.fulfill({status:503,json:{message:'Fixture logout unavailable'}});
    if(p==='/api/auth/logout')return route.fulfill({json:{ok:true}});
    return route.fulfill({json:{ok:true,item:product,items:[],tracker:null}});
   }
   if(dataPaymentMode&&holdDataRefresh&&p==='/api/documents')await new Promise(resolve=>dataRefreshWaiters.push(resolve));
   if(securityUnavailable&&["/api/auth/mfa","/api/auth/sessions"].includes(p))return route.fulfill({status:503,json:{message:p.endsWith("mfa")?"Fixture security status unavailable":"Fixture sessions unavailable"}});
   if(projectSourceMode&&p==='/api/documents/AN-TEST-1')return route.fulfill({status:failProjectSource?503:200,json:failProjectSource?{message:'Synthetic source unavailable'}:{item:{...offer,status:'accepted',title:projectSourceTitle}}});
   let data;
   if(p==='/api/auth/register')data={state:'new',context:{plan:null,billingCycle:'monthly',trialDays:14,termsVersion:'2026-10-05',privacyVersion:'2026-10-05.2',dpaVersion:'2026-10-05'}};
   else if(p==='/api/auth/session')data={authenticated:true,...(processRecoveryMode?{user:{id:'process-fixture-user'}}:{}),tenant:{id:'fixture-tenant',role:policyRole,plan:'pro',readOnly:policyReadOnly}};
   else if(p==='/api/settings/team/invitations')data={members:[{user_id:'member-one',name:'Team Person',email:'team@example.invalid',role:teamMemberRole,created_at:'2026-10-08'}],invitations:[],userLimit:10,plan:'pro'};
   else if(p==='/api/notifications')data={items:[{id:'notification-one',kind:'document',title:'Neue Rechnung',body:'Prüffirma AG',href:'/rechnungen/RE-TEST-1',read_at:null,created_at:'2026-10-09T09:00:00Z'},{id:'notification-two',kind:'announcement',title:'Produktinformation',body:'Testinformation',read_at:'2026-10-08T10:00:00Z',created_at:'2026-10-08T09:00:00Z'}]};
   else if(p==='/api/time-entries/policy')data={time_approval_required:policyRequired};
   else if(p==='/api/time-tracker')data={tracker:null};
   else if(p==='/api/settings/profile')data={item:{id:'profile-one',display_name:'Test Person',first_name:'Test',last_name:'Person',phone:'',job_title:'ICT',theme:preferenceTheme,language:'de',avatar_url:null},email:'test@example.invalid'};
   else if(p==='/api/settings/company')data={item:{name:customer.name,city:'Bern',logo_url:null,email:'firma@example.invalid'}};

   else if(p==='/api/operator/accounts')data={items:[operatorAccount]};
   else if(p==='/api/operator/customers')data={items:[{id:'tenant-one',name:'Prüffirma AG',created_at:'2026-10-09'}]};
   else if(p==='/api/operator/restrictions')data={items:[]};
   else if(p==='/api/operator/tickets/ticket-one')data={item:{id:'ticket-one',tenant:{name:'Prüffirma AG'},status:'open',priority:'normal'},messages:[{id:'public',body:'Öffentliche Nachricht',author_type:'customer',created_at:'2026-10-09',internal:false},{id:'private',body:'Vertrauliche interne Notiz',author_type:'operator',created_at:'2026-10-09',internal:true}]};
   else if(p==='/api/auth/invitation')data={email:'eingeladen@example.invalid',organization:customer.name,existingAccount:false};





   else if(p==='/api/settings/notifications')data={items:[{kind:'Rechnungen',email:true,push:false}]};
   else if(p==='/api/search'){const term=url.searchParams.get('q');if(term==='old')await new Promise(resolve=>setTimeout(resolve,450));data={items:term==='none'?[]:[{type:'Kunde',title:term==='old'?'Veraltetes Ergebnis':'Prüffirma AG',meta:'Bern',href:'/kunden/customer-one',icon:'users'},{type:'Rechnung',title:'RE-TEST-1',meta:'Prüffirma AG',href:'/rechnungen/RE-TEST-1',icon:'receipt'}]};}
   else if(p==='/api/settings/documents')data={item:{vat_rate:8.1,payment_terms_days:30,iban:'CH9300762011623852957',qr_iban:'',invoice_intro_text:'Synthetischer Rechnungstext',invoice_footer_text:'Synthetischer Schlusstext',quote_intro_text:'Synthetischer Angebotstext',quote_footer_text:'Synthetischer Schlusstext'}};
   else if(p==='/api/settings/subscription')data={item:{plan:'pro',subscription_status:'active',account_status:'active',unit_amount_chf:79,user_limit:10,storage_limit_bytes:21474836480,current_period_ends_at:'2026-11-09'}};
   else if(p==='/api/integrations/status')data={items:[{key:'billing',configured:false}]};
   else if(p==='/api/billing/catalog')data={live:false,demo:false,automaticTax:false,items:[]};
   else if(p==='/api/auth/mfa')data={enabled:true,required:true,role:'owner'};
   else if(p==='/api/auth/sessions')data={items:[{id:'session-current',current:true,userAgent:'Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/605.1.15',lastSeenAt:'2026-10-09T09:00:00Z',expiresAt:'2026-11-09T09:00:00Z'},{id:'session-other',current:false,userAgent:'Mozilla/5.0 (Windows) Chrome/130.0',lastSeenAt:'2026-10-08T09:00:00Z',expiresAt:'2026-11-09T09:00:00Z'}]};
   else if(p==='/api/settings/organization')data={organization:{name:customer.name,city:'Bern',country:'CH'}};
   
   else if(p==='/api/finance/overview')data=url.searchParams.get('include')==='workspace'?{...summary,documents:collections.documents,cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),data:{payments:[{payment_date:'2026-09-15',amount:120},{payment_date:'2026-10-05',amount:dataPaymentMode?invoice.paid_amount:200}],expenses:[{expense_date:'2026-09-15',amount:20},{expense_date:'2026-10-05',amount:50}],payroll:[],operatingCosts:[]}}:summary;
   else if(['/api/operator/finance','/api/demo/platform-finance'].includes(p))data={payments:[{payment_date:'2026-10-05',amount:200}],subscriptions:[{created_at:'2026-10-05',monthly_revenue_chf:79}],operatingCosts:[{cost_date:'2026-10-05',amount:20}]};
   else if(p==='/api/finance')data={cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),payments:[{payment_date:'2026-09-15',amount:120},{payment_date:'2026-10-05',amount:dataPaymentMode?invoice.paid_amount:200}],expenses:[{expense_date:'2026-09-15',amount:20},{expense_date:'2026-10-05',amount:50}],payroll:[],operatingCosts:[]};
   else if(p==='/api/customers'||p==='/api/demo/data'&&url.searchParams.get('collection')==='customers')data=customerListFixture(url.searchParams);
   else if(p==='/api/demo/data')data=recordListFixture(url.searchParams.get('collection'),url.searchParams);
   else if(['/api/products','/api/employees','/api/expenses','/api/payments'].includes(p))data=recordListFixture(p.split('/')[2],url.searchParams);
   else if(p==='/api/documents')data={items:collections.documents.filter(item=>!url.searchParams.has('kind')||item.kind===url.searchParams.get('kind'))};
   else if(p==='/api/dashboard'||p==='/api/demo/dashboard')data={cash:cashFixture(dataPaymentMode?invoice.paid_amount:200),canFinance:true,recent:[invoice],attention:[],invoices:[invoice],payments:[payment],stats:{customer_count:2},analyticsInvoices:[{issue_date:'2026-10-01',total:135.13,invoice_count:1}],analyticsPayments:[{paid_on:'2026-10-01',amount:dataPaymentMode?invoice.paid_amount:100}]};
   else if(p==='/api/support/tickets')data={items:[ticket]};
   else if(p==='/api/support/tickets/ticket-one/messages')data={items:[...Array.from({length:30},(_,i)=>({id:'message-'+i,author_type:i%2?'support':'customer',body:'Testnachricht '+(i+1)+' – Prüfung des scrollbareren Nachrichtenverlaufs.',created_at:'2026-10-08T10:00:00Z'})),...supportMessages]};
   else if(p==='/api/expenses/options')data={items:[employee]};
   else if(p==='/api/files')data={items:[]};
   else if(p==='/api/time-entries'&&groupingFixture&&!url.searchParams.has('employeeId'))data={items:[{id:'internal',project_name:'Administration',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:false,approved:true},{id:'group-one',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'group-two',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T10:00:00Z',billable:true,approved:true},{id:'other-customer',customer_id:'customer-two',customer_name:'Alpin Systems AG',project_name:'Managed IT Services',duration_minutes:405,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true},{id:'other-project',customer_id:customer.id,customer_name:customer.name,project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T12:00:00Z',billable:true,approved:true,invoiced_invoice_id:'already-invoiced'}]};
   else if(p==='/api/time-entries')data={items:url.searchParams.has('employeeId')?(employeeLedgerFixture?[{id:'employee-time',description:'Modern Workplace',project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T09:00:00Z',approved:true,billable:true}]:[]):[{id:'time-one',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'time-two',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:45,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true}]};
   else if(p.endsWith('/pdf'))return route.fulfill({contentType:'application/pdf',body:fixturePdf});
   else if(/^\/api\/customers\/[^/]+$/.test(p)&&url.searchParams.get('include')==='workspace')data={item:collections.customers.find(item=>item.id===p.split('/')[3]),statistics:[{currency:'CHF',date:statisticToday,paid:dataPaymentMode?invoice.paid_amount:100,billed:invoice.total,invoice_count:1}],contacts:[{id:'contact-one',first_name:'Alex',last_name:'Muster',job_title:'Projektleitung',email:'alex.muster@internationales-unternehmen.example.invalid',phone:'+41315551020',is_primary:true}],documents:[invoice,offer],summary,activity:dataPaymentMode&&invoice.paid_amount>0?[{at:'2026-10-09T12:00:00Z',title:'Zahlung erhalten',detail:'CHF 1’000.00'}]:[]};
   else if(p==='/api/customers/customer-one/contacts')data={items:[{id:'contact-one',first_name:'Alex',last_name:'Muster',job_title:'Projektleitung',email:'alex.muster@internationales-unternehmen.example.invalid',phone:'+41315551020',is_primary:true}]};
   else if(p==='/api/customers/customer-one/activity')data={items:dataPaymentMode&&invoice.paid_amount>0?[{id:'payment-event',title:'Zahlung erhalten',at:'2026-10-09T12:00:00Z',detail:'CHF 1’000.00'}]:[]};
   else if(p==='/api/customers/customer-one/documents')data={items:[invoice,offer]};
   else if(/^\/api\/customers\/[^/]+\/(contacts|activity|documents)$/.test(p))data={items:[]};
   else {
    const [,,collection,id]=p.split('/');const rows=collections[collection];
    if(rows)data=id?{item:rows.find(item=>item.id===id||item.number===id)}:{items:rows};
   }
   if(failLedger&&url.searchParams.has('employeeId'))return route.fulfill({status:503,json:{message:'Fixture ledger unavailable'}});
   return route.fulfill({status:data?200:503,json:data??{message:'UI fixture unavailable'}});
  });
  const trackedPage=async()=>{const next=await context.newPage();next.on('pageerror',error=>{if(process.env.BINSO_UX_DEBUG)console.log('PAGE ERROR',error.stack);errors.push(next.url()+': '+error.message)});if(process.env.BINSO_UX_DEBUG)next.on('requestfailed',req=>console.log('FAILED REQUEST',req.url(),req.failure()));return next};
  let page=await trackedPage();
  // Hard fixture resets use a new document; real Link navigation stays on the same page.
  // WebKit cannot carry Next's old-document RSC prefetch scheduler across page.goto resets.
  const navigate=async(...args)=>{await page.waitForLoadState('networkidle');assert.deepEqual(errors,[],'Runtime errors before scenario reset');const viewport=page.viewportSize();page.removeAllListeners("pageerror");await page.close();page=await trackedPage();await page.setViewportSize(viewport);return page.goto(...args)};
  const routes=fullRoutes;
  await Promise.all((process.env.BINSO_UX_WIDTHS?.split(",").map(Number)??[1440,1024,820,430,375]).map(async width=>{
   console.log(`Checking ${theme} ${width}px`);
   for(const route of (process.env.BINSO_UX_ROUTES?.split(",")??routes)){
    // Independent route cases must not abort the preceding page’s delayed RSC prefetch.
    // Interaction scenarios below still exercise navigation in a persistent page.
    const page=await context.newPage();page.on("pageerror",error=>errors.push(page.url()+": "+error.message));
    await page.setViewportSize({width,height:1000});
    console.log(`Route ${route}`);const response=await page.goto(base+route);if(route==='/dev/ux-lab'&&process.env.BINSO_UX_SERVER_MODE!=='dev'){assert.equal(response.status(),404,'UX-Lab is never published');results.push({theme,width,route,passed:true,scope:'production 404 guard'});await page.close();continue;}await page.waitForLoadState('networkidle');await page.locator('.app-session-loading').waitFor({state:'hidden'});
    try{await page.locator(route.startsWith('/preview/')?'h1,h2':'h1').filter({visible:true}).first().waitFor({state:'visible'});}catch(error){console.log('Route render failure',route,width,errors,(await page.locator('body').innerText()).slice(0,5000));await capture(page,{path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-render-error.png`)});throw error;}
    assert.ok(!(await page.locator('body').innerText()).includes('UI fixture unavailable'),`${route}: a missing fixture cannot pass as content acceptance`);
    if(route==='/einstellungen/abonnement')await page.locator('.plan-hero').getByText('Aktiv',{exact:true}).waitFor();
    if(route==='/einstellungen/dokumente'){await page.getByRole('heading',{name:'Rechnungsstandard',exact:true}).waitFor();await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();}
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,`${route}: explicit theme must override system dark mode`);
    if(process.env.BINSO_UX_COMPLIANCE==='1')await measureCompliance(page,{output:path.join(output,'compliance'),route,theme,width,state:process.env.BINSO_UX_FIXTURE_CASE??'normal',engine:process.env.BINSO_UX_BROWSER??'chromium'});
    const geometry=await page.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80),parent:el.parentElement?.className,right:el.getBoundingClientRect().right})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,sort:[...document.querySelectorAll('.toolbar .filter-button')].map(el=>el.getBoundingClientRect().width),metricDividers:[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>getComputedStyle(el).borderLeftWidth)}));
    if(geometry.scroll>width+1||geometry.body>width+1){console.log('Overflow details',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+2).slice(0,30).map(el=>({tag:el.tagName,cls:el.className,width:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX,children:[...el.children].map(c=>({tag:c.tagName,width:c.clientWidth,scroll:c.scrollWidth,rect:c.getBoundingClientRect().width,min:getComputedStyle(c).minWidth,grid:getComputedStyle(el).gridTemplateColumns})),rect:JSON.stringify(el.getBoundingClientRect())}))),null,2));await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-overflow.png`)});}
    assert.ok(geometry.scroll<=width+1&&geometry.body<=width+1,`${theme} ${width} ${route}: horizontal overflow ${JSON.stringify(geometry)}`);
    assert.ok(geometry.sort.every(size=>size<=44),`${route}: sorting control is too wide`);
    assert.ok(geometry.metricDividers.every(size=>parseFloat(size)===0),`${route}: metric dividers`);
    if(!process.env.BINSO_UX_BASELINE&&width<=760){for(const toolbar of await page.locator('.toolbar:has(.searchbox):has(.filter-button)').all()){const search=await toolbar.locator('.searchbox').boundingBox(),filter=await toolbar.locator('.filter-button').boundingBox(),tabs=await toolbar.locator('.chips').boundingBox();assert.ok(filter.x>search.x&&Math.abs(filter.y-search.y)<2&&Math.abs(filter.height-search.height)<2,'Search and filter share a row and height');assert.ok(!tabs||tabs.y>=search.y+search.height,'Status tabs occupy their own row')}}
    if(!process.env.BINSO_UX_BASELINE&&width<=760&&await page.locator('.app-root:not(.app-preview)').count()&&!route.startsWith('/operator')&&!route.startsWith('/support/')){
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const header=await page.locator('.mobile-header').boundingBox();assert.ok(header&&header.y>=-1&&header.y<=1,`${route}: primary header stays visible while scrolling`);
      await page.evaluate(()=>{window.scrollTo(0,0);return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
    }
    if(width<=760&&await page.locator('.mobile-back').count()){const back=page.locator('.mobile-back');assert.ok(await back.isVisible(),`${route}: detail back control is visible`);const icon=await back.locator('svg').boundingBox();assert.ok(icon&&icon.width>=18&&icon.height>=18&&icon.x>=0,`${route}: back icon is not clipped`);}
    if(!process.env.BINSO_UX_BASELINE&&['/dashboard','/finanzen','/finanzen/analyse','/kunden/customer-one'].includes(route)){
      assert.equal(await page.locator('.bo-statistics-kpis>div').count(),3,'Migrated statistics have exactly three metrics');
      assert.equal(await page.locator('.bo-statistics').count(),1,'One central statistics surface');
      assert.equal(await page.locator('.bo-statistics').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(23, 25, 29)','Statistics retain their dark design in both themes');
      assert.ok(process.env.BINSO_UX_FIXTURE_CASE==='empty'||await page.locator('.bo-statistics-bar').evaluateAll(elements=>elements.some(el=>el.getBoundingClientRect().height>20)),'Actual fixture values produce bars');
      assert.equal(await page.locator('.revenue-insight,.dashboard-summary,.quick-section,.finance-overview-chart').count(),0,'Migrated pages have no competing KPI/chart layout');
    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/mitarbeiter/employee-one'){await page.getByRole('heading',{name:'Mitarbeiterdetails',exact:true}).waitFor();await page.getByText(employee.email,{exact:true}).waitFor()}
    if(!process.env.BINSO_UX_BASELINE&&route==='/support/ticket-one'){
      const before=await page.locator('.thread-composer').boundingBox();await page.locator('.thread-messages').evaluate(el=>{el.scrollTop=0});const after=await page.locator('.thread-composer').boundingBox();assert.deepEqual(after,before,'Only messages scroll; composer stays fixed');
      const visible=await page.evaluate(()=>{const composer=document.querySelector('.thread-composer').getBoundingClientRect();return composer.bottom<=innerHeight&&composer.top>=0&&scrollY===0});assert.ok(visible,'Chat input stays inside the viewport');
    }
    if(!process.env.BINSO_UX_BASELINE){for(const control of await page.locator('.form-field>.form-control').filter({visible:true}).all()){
     const g=await control.evaluate(el=>{const c=getComputedStyle(el);return {height:el.getBoundingClientRect().height,radius:c.borderRadius,padding:c.paddingLeft,font:c.fontSize}});
     assert.equal(g.height,width<=760?44:40,`${route}: canonical closed field height`);assert.equal(g.padding,'11px',`${route}: canonical field inset`);assert.equal(g.radius,'10px',`${route}: canonical field radius`);
    }}
    for(const label of await page.locator('.detail-list dt').filter({visible:true}).all()){const confined=await label.evaluate(el=>{const r=el.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].every(text=>text.right<=r.right+1)});assert.ok(confined,`${route}: detail labels never overlap their values`);}
    if(route.endsWith('/neu')&&await page.locator('.mobile-sticky-save').count()){assert.equal(await page.locator('.mobile-sticky-save .button-primary').filter({visible:true}).count(),1,`${route}: form footer action must be reachable`);assert.equal(await page.locator('.page-head .page-actions .button-primary,.mobile-detail-actions .button-primary').filter({visible:true}).count(),0,`${route}: duplicate header save`);}
    if(width<=760&&await page.locator('.app-root:not(.app-preview):not(.app-editing)').count()&&!route.endsWith('/neu')&&!route.startsWith('/operator'))assert.equal(await page.locator('nav.bottom-nav').isVisible(),true,`${route}: bottom navigation hidden`);
    if(await page.locator('.app-editing').count())assert.equal(await page.locator('nav.bottom-nav').count(),0,`${route}: capture processes apply the existing visibility contract`);
    if(route==='/operator'&&width>=768){for(const title of await page.locator('.operator-insight-grid .compact-list>a>b').all()){const box=await title.boundingBox();assert.ok(box.width>=80,'Admin activity titles have readable width alongside customer and status');}}
    if(route.startsWith('/operator')){const operatorHeader=page.locator('.operator-app-header');if(await operatorHeader.count())assert.equal(await operatorHeader.evaluate(el=>getComputedStyle(el).backdropFilter),'none','Operator header has no blur');}
    if(!process.env.BINSO_UX_BASELINE&&width<=760){
     for(const row of await page.locator('.document-summary-row.has-value').filter({visible:true}).all()){
      const geometry=await row.evaluate(el=>{const box=selector=>{const node=el.querySelector(selector);return node?.getClientRects().length?node.getBoundingClientRect().toJSON():null};return {title:box(':scope>b'),meta:box(':scope>small'),amount:box('.document-summary-amount')}});
      if(geometry.amount){assert.ok(geometry.title&&geometry.meta,'A visible financial amount must have a visible title and metadata');assert.ok(geometry.meta.y>=geometry.title.y+geometry.title.height-1&&geometry.amount.y>=geometry.meta.y+geometry.meta.height-1,'Financial row has distinct title, metadata and amount lines');}
     }
     if(['/rechnungen/RE-TEST-1','/angebote/AN-TEST-1'].includes(route)){
      const header=page.locator('.mobile-header');assert.equal(await header.locator('.status').count(),1,'Document status appears once in its header');
      assert.equal(await page.locator('.document-detail-view .status').count(),0,'Document body has no redundant status');
      const actions=await header.locator('.mobile-detail-actions').boundingBox(),box=await header.boundingBox();
      assert.ok(actions.x+actions.width>=box.width-35,'Document actions stay at the right edge');
     }
    }
    if(process.env.BINSO_UX_A11Y==='1'&&[375,1440].includes(width)){
      await page.addScriptTag({path:process.env.BINSO_AXE_MODULE});
      const violations=await page.evaluate(async()=>{const {violations}=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return violations.map(({id,impact,description,nodes})=>({id,impact,description,targets:nodes.map(n=>n.target)}))});
      await writeTestOutput(path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-a11y.json`),JSON.stringify(violations,null,2));
      const blocking=violations.filter(v=>['serious','critical'].includes(v.impact));
      if(blocking.length){accessibilityFailures.push({route,theme,width,violations:blocking});console.log('A11Y',route,JSON.stringify(blocking));}
    }
  assert.deepEqual(errors,[],'Browser runtime errors');
    results.push({theme,width,route,passed:true});
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'||[1440,430].includes(width)&&['/dashboard','/rechnungen','/support/ticket-one','/produkte','/produkte/product-one','/spesen/expense-one','/support','/finanzen','/zeit','/finanzen/analyse','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu'].includes(route))await capture(page,{animations:"disabled",path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}.png`),fullPage:true});
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'&&width<=760&&await page.locator('nav.bottom-nav').isVisible()){const hide=await page.addStyleTag({content:'.page-container{visibility:hidden}'});await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-nav.png`)},page.locator('nav.bottom-nav'));await hide.evaluate(el=>{el.remove();return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
    await page.waitForLoadState("networkidle");
    assert.deepEqual(errors,[],"Browser runtime errors after rendering");
    page.removeAllListeners("pageerror");await page.close();
   }
  }));
  if(process.env.BINSO_UX_MATRIX_ONLY==="1"){await context.close();context=null;await browser.close();browser=null;continue;}
  await page.setViewportSize({width:430,height:900});
  if(process.env.BINSO_UX_DEBUG)page.on('response',async response=>{if(response.url().includes('/api/auth/session'))console.log('Session fixture response',response.status(),await response.text())});
  if(hasInteraction('customers')){
    customerPosts=0;customerReplays.clear();
    await navigate(base+'/kunden/neu');const customerSheet=()=>page.getByRole('dialog',{name:'Kunde erstellen',exact:true});await customerSheet().waitFor();await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.waitForURL(base+'/kunden');assert.equal(await page.getByRole('alertdialog').count(),0,'An unchanged customer sheet closes without warning');
    await navigate(base+'/kunden/neu');await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Minimal Company AG');assert.equal(await customerSheet().getByText(/^K-\d+/).count(),0,'No generated customer number appears in creation');failCustomerCreate=true;await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await page.getByText('Synthetic customer creation unavailable',{exact:true}).waitFor();assert.equal(customerPosts,1);assert.equal(await customerSheet().getByLabel('Kundenname *',{exact:true}).inputValue(),'Minimal Company AG');
    await customerSheet().locator('summary').click();await customerSheet().getByLabel('E-Mail',{exact:true}).fill('invalid-email');await customerSheet().locator('summary').click();await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();assert.equal(customerPosts,1,'An invalid optional email cannot submit even when its group is collapsed');assert.equal(await customerSheet().locator('details').getAttribute('open'),'','Native validation reopens the invalid optional group');await customerSheet().getByLabel('E-Mail',{exact:true}).fill('');await customerSheet().locator('summary').click();
    await page.setViewportSize({width:320,height:400});await customerSheet().locator('summary').click();await customerSheet().getByLabel('Ort',{exact:true}).focus();const customerGeometry=await customerSheet().evaluate(el=>{const header=el.querySelector('.sheet-header').getBoundingClientRect(),footer=el.querySelector('.mobile-sticky-save').getBoundingClientRect();return {headerTop:header.top,footerBottom:footer.bottom,width:el.getBoundingClientRect().width,height:window.innerHeight}});assert.ok(customerGeometry.headerTop>=0&&customerGeometry.footerBottom<=customerGeometry.height+1&&customerGeometry.width<=320,'Customer sheet header and action footer remain reachable in a short narrow viewport');await capture(page,{path:path.join(output,`${theme}-320-400-customer-sheet.png`)},customerSheet());await page.setViewportSize({width:430,height:900});
    failCustomerCreate=false;await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).dblclick();await page.waitForURL(base+'/kunden');assert.equal(customerPosts,2,'Two completion taps send one customer retry');assert.equal(customerReplays.size,1);
    processRecoveryMode=true;await navigate(base+'/kunden/neu');await page.waitForLoadState('networkidle');await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Minimal Person');loseCustomerResponse=true;await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await customerSheet().getByRole('alert').waitFor();assert.equal(customerReplays.size,2);await page.waitForLoadState('networkidle');await page.reload();await page.waitForFunction(()=>document.querySelector('input[placeholder="Firma oder Name"]')?.value==='Minimal Person');await customerSheet().getByRole('button',{name:'Kunde speichern',exact:true}).click();await page.waitForURL(base+'/kunden');assert.equal(customerPosts,4);assert.equal(customerReplays.size,2,'Reload recovery returns the same customer without allocating another number');processRecoveryMode=false;
    await navigate(base+'/kunden/neu');await customerSheet().getByLabel('Kundenname *',{exact:true}).fill('Unsaved customer');await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await customerSheet().getByLabel('Kundenname *',{exact:true}).inputValue(),'Unsaved customer');await customerSheet().getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL(base+'/kunden');
    await navigate(base+'/kunden');await page.waitForLoadState('networkidle');
    const listActions=page.locator('.page-actions');
    await listActions.getByRole('button',{name:'Kunden suchen...',exact:true}).waitFor({state:'visible'});
    assert.deepEqual(await listActions.locator('button,a').evaluateAll(elements=>elements.map(el=>el.getAttribute('aria-label'))),['Kunden suchen...','Filter und Sortierung','Neuer Kunde'],'Customer header exposes search, filters and create in that order');
    assert.equal(await page.locator('main .chips,main select,main input[type="search"]').count(),0,'Status and sort controls live exclusively in their sheet');
    await page.getByRole('button',{name:'Kunden suchen...',exact:true}).click();await page.getByPlaceholder('Kunden suchen...').fill('not-present');await page.getByRole('dialog').getByRole('button',{name:'Anwenden',exact:true}).click();await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Filter zurücksetzen',exact:true}).click();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await page.getByRole('button',{name:'Filter und Sortierung',exact:true}).click();const filters=page.getByRole('dialog',{name:'Filter und Sortierung',exact:true});await filters.getByLabel('Status / Typ',{exact:true}).selectOption('Inaktiv');await filters.getByRole('button',{name:'Schliessen',exact:true}).click();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await page.getByRole('button',{name:'Filter und Sortierung',exact:true}).click();await filters.getByLabel('Status / Typ',{exact:true}).selectOption('Inaktiv');await filters.getByRole('button',{name:'Anwenden',exact:true}).click();await page.getByText('Keine inaktiven Kunden',{exact:true}).waitFor();await page.getByRole('button',{name:'Filter zurücksetzen',exact:true}).click();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();
    await page.getByRole('button',{name:'Filter und Sortierung',exact:true}).click();await filters.getByLabel('Sortierung',{exact:true}).selectOption('0:desc');await filters.getByRole('button',{name:'Anwenden',exact:true}).click();await page.locator('.records-active-filters').getByText('Kunde ↓',{exact:true}).waitFor();
    await page.locator('.mobile-record-list a').first().click();await page.waitForURL('**/kunden/customer-one');await page.goBack();await page.waitForURL('**/kunden');await page.locator('.records-active-filters').getByText('Kunde ↓',{exact:true}).waitFor();
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-customer-list-standard.png`)});
    const originalCustomers=[...collections.customers];
    await page.getByRole('button',{name:'Filter und Sortierung',exact:true}).click();await filters.getByLabel('Sortierung',{exact:true}).selectOption('0:asc');await filters.getByRole('button',{name:'Anwenden',exact:true}).click();
    collections.customers.push(...Array.from({length:55},(_,index)=>({...customer,id:'pagination-'+index,name:'Paging customer '+String(index).padStart(2,'0'),customer_no:'K-PAGING-'+index,city:'Bern'})));
    await page.reload();await page.locator('.mobile-record-list .record-wrapper').nth(49).waitFor({state:'visible'});
    await page.evaluate(()=>{window.scrollTo(0,500);document.querySelector('.mobile-record-list a').click()});await page.waitForURL('**/kunden/pagination-*');await page.goBack();await page.waitForURL('**/kunden');await page.waitForFunction(()=>window.scrollY>=450);assert.ok(await page.evaluate(()=>window.scrollY)>=450,'Returning to a populated list restores its content scroll position');
    await page.getByRole('navigation',{name:'Listenseiten',exact:true}).getByRole('button',{name:'Weiter',exact:true}).click();await page.getByText('Seite 2 von 2',{exact:true}).waitFor();await page.locator('.mobile-record-list .record-wrapper').nth(5).waitFor({state:'visible'});assert.equal(await page.locator('.mobile-record-list .record-wrapper').count(),6,'The second customer page exposes the remaining authorized rows');
    await page.locator('.mobile-record-list a[href="/kunden/customer-one"]').click();await page.waitForURL('**/kunden/customer-one');await page.goBack();await page.waitForURL('**/kunden');await page.getByText('Seite 2 von 2',{exact:true}).waitFor();await page.locator('.mobile-record-list .record-wrapper').nth(5).waitFor({state:'visible'});assert.equal(await page.locator('.mobile-record-list .record-wrapper').count(),6,'Returning from details restores the active page');
    collections.customers.splice(0,collections.customers.length,...originalCustomers);await page.reload();await page.locator('.mobile-record-list').getByText(customer.name,{exact:true}).waitFor();assert.equal(await page.getByRole('navigation',{name:'Listenseiten',exact:true}).count(),0,'Reload resets private list context; one restored fixture row needs no pager');
    await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
    await page.locator('.detail-list').getByText('K-000001',{exact:true}).waitFor();
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
  const projectSheet=page.getByRole('dialog',{name:'Auftrag / Projekt starten',exact:true});await projectSheet.getByRole('button',{name:'Schliessen',exact:true}).click();await page.waitForURL('**/zeit');assert.equal(await page.getByRole('alertdialog').count(),0,'Untouched project setup closes directly');
  await navigate(base+'/projekte/neu');await page.getByLabel('Bezeichnung *',{exact:true}).fill('Synthetic internal project');projectPosts=0;failProjectCreate=true;await page.getByRole('button',{name:'Auftrag starten',exact:true}).click();await page.getByRole('alert').getByText('Synthetic project creation unavailable',{exact:true}).waitFor();assert.equal(projectPosts,1);assert.equal(await page.getByLabel('Bezeichnung *',{exact:true}).inputValue(),'Synthetic internal project','A failed create preserves the project draft');
  failProjectCreate=false;await page.getByRole('button',{name:'Auftrag starten',exact:true}).dblclick();await page.waitForURL('**/zeit?projectId=project-created');assert.equal(projectPosts,2,'Two completion taps cause exactly one retry request');
  processRecoveryMode=true;await navigate(base+'/projekte/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Bezeichnung *',{exact:true}).fill('Synthetic recoverable internal project');loseProjectResponse=true;await page.getByRole('button',{name:'Auftrag starten',exact:true}).click();await page.getByRole('dialog',{name:'Auftrag / Projekt starten',exact:true}).getByRole('alert').waitFor();assert.equal(projectReplays.size,2,'The lost reply happened after one committed project');
  await page.waitForLoadState('networkidle');await page.reload();await page.waitForFunction(()=>document.querySelector('input[placeholder="z. B. Cloud Migration"]')?.value==='Synthetic recoverable internal project');await page.getByRole('button',{name:'Auftrag starten',exact:true}).click();await page.waitForURL('**/zeit?projectId=project-created-2');assert.equal(projectReplays.size,2,'Reload recovery retries the saved request key without creating another project');assert.equal(projectPosts,4);
  projectSourceMode=true;failProjectSource=true;projectSourceTitle='Synthetic accepted offer';
  await navigate(base+'/projekte/neu?sourceOffer=AN-TEST-1');await page.getByRole('alert').getByText('Synthetic source unavailable',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Auftrag starten',exact:true}).count(),0,'Failed source cannot create a partial fictional project');
  const projectMarker=await page.evaluate(()=>{window.v215ProjectMarker='same-document';return window.v215ProjectMarker});failProjectSource=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByLabel('Bezeichnung *',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('input[placeholder="z. B. Cloud Migration"]')?.value==='Synthetic accepted offer');
  assert.equal(await page.evaluate(()=>window.v215ProjectMarker),projectMarker,'Source retry uses a targeted query, no app reload');assert.equal(await page.getByLabel('Kunde',{exact:true}).inputValue(),'customer-one');assert.equal(await page.getByLabel('Kunde',{exact:true}).isDisabled(),true);
  await page.getByLabel('Bezeichnung *',{exact:true}).fill('Unsaved project draft');projectSourceTitle='Updated server offer';
  const sourceRefresh=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/documents/AN-TEST-1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await sourceRefresh;await page.waitForLoadState('networkidle');assert.equal(await page.getByLabel('Bezeichnung *',{exact:true}).inputValue(),'Unsaved project draft','Source revalidation cannot overwrite the local project draft');
  await page.getByRole('dialog',{name:'Auftrag / Projekt starten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.getByLabel('Bezeichnung *',{exact:true}).inputValue(),'Unsaved project draft');await page.getByRole('dialog',{name:'Auftrag / Projekt starten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL('**/angebote/AN-TEST-1');projectSourceMode=false;processRecoveryMode=false;

  }
  if(hasInteraction('employees')){
  await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('button',{name:'Zurück',exact:true}).count(),0,'First wizard step has no dead back button');
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.waitForURL('**/mitarbeiter');await navigate(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');
  await page.getByLabel('Vorname',{exact:true}).fill('Test');await page.getByLabel('Nachname',{exact:true}).fill('Person');await page.getByLabel('E-Mail',{exact:true}).fill('test@example.invalid');await page.getByLabel('Funktion',{exact:true}).fill('ICT');
  const employeeFooter=await page.locator('.mobile-sticky-save').boundingBox();await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),1,'Employee wizard has one final save');
  const employeeSave=await page.locator('.mobile-sticky-save').boundingBox();assert.equal(employeeSave.y,employeeFooter.y,'Full-page wizard actions remain fixed across steps');assert.ok(employeeSave.y+employeeSave.height<=page.viewportSize().height+1,'Wizard save stays in the visible viewport');await page.getByText('Ferientage / Jahr',{exact:true}).scrollIntoViewIfNeeded();
  await page.setViewportSize({width:430,height:400});
  await page.waitForTimeout(100);
  const shortFooter=await page.locator('.form-wizard .mobile-sticky-save').boundingBox();assert.ok(shortFooter.y>=0&&shortFooter.y+shortFooter.height<=400,'Wizard actions stay visible in a short viewport');
  await page.locator('.wizard-content').evaluate(el=>{el.scrollTop=el.scrollHeight});
  const afterScroll=await page.locator('.form-wizard .mobile-sticky-save').boundingBox();assert.ok(Math.abs(shortFooter.y-afterScroll.y)<2,'Only wizard content scrolls');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-400-employee-wizard.png`)});
  await page.setViewportSize({width:430,height:900});
  await page.getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await page.getByLabel('Vorname',{exact:true}).inputValue(),'Test','Wizard retains input without navigation or dirty warnings');
  await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.getByLabel('Vorname',{exact:true}).inputValue(),'Test','Cancel guard retains draft');await page.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL('**/mitarbeiter');

  }
  if(hasInteraction('time')){
  for(const height of [568,400]){
    await page.setViewportSize({width:375,height});await page.waitForLoadState("networkidle");await navigate(base+'/zeit');await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('button',{name:'Zeitfilter',exact:true}).count(),0,'Timer hides entry-only filters');
    await page.getByRole('button',{name:'Manuell erfassen',exact:true}).filter({visible:true}).click();
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
   const statistics=page.locator('.bo-statistics');
   await statistics.locator('dd').getByText('CHF 320.00',{exact:true}).waitFor();
   assert.equal(await statistics.locator('.bo-statistics-kpis>div').count(),3);
   for(const months of [1,3,6,12]){await statistics.getByRole('button',{name:months+' M',exact:true}).click();assert.equal(await statistics.getByRole('button',{name:months+' M',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await statistics.locator('dd').first().textContent(),months===1?'CHF 200.00':'CHF 320.00');}
   await statistics.getByRole('button',{name:'Eigenen Statistikzeitraum wählen',exact:true}).click();
   const periodSheet=page.getByRole('dialog',{name:'Statistikzeitraum',exact:true});
   await periodSheet.getByLabel('Von *',{exact:true}).fill(previousStatisticFrom);await periodSheet.getByLabel('Bis *',{exact:true}).fill(previousStatisticTo);
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-period-sheet.png`)});
   await periodSheet.getByRole('button',{name:'Anwenden',exact:true}).click();
   assert.equal(await statistics.locator('dd').first().textContent(),'CHF 120.00');
   assert.equal(await statistics.locator('dd').nth(1).textContent(),'CHF 0.00');
   assert.equal(await statistics.locator('dd').nth(2).evaluate(el=>el.firstChild.textContent),'CHF 120.00');
   assert.ok(await page.locator('.document-summary-row').filter({hasText:'RE-TEST-1'}).filter({visible:true}).count()>0,'Chart period does not hide a directly searched invoice');
   await page.locator('a[href="/dashboard"]').filter({visible:true}).first().click();await page.waitForURL('**/dashboard');await page.waitForLoadState('networkidle');await page.locator('a[href="/finanzen"]').filter({visible:true}).first().click();await page.waitForURL('**/finanzen');await page.waitForLoadState('networkidle');
   await page.locator('.bo-statistics dd').first().getByText('CHF 120.00',{exact:true}).waitFor();
   assert.equal(await page.locator('.bo-statistics dd').first().textContent(),'CHF 120.00','Custom period survives actual same-tab navigation');
   await page.locator('.bo-statistics').getByRole('button',{name:'Eigenen Statistikzeitraum wählen',exact:true}).click();
   const emptySheet=page.getByRole('dialog',{name:'Statistikzeitraum',exact:true});await emptySheet.getByLabel('Von *',{exact:true}).fill('2020-01-01');await emptySheet.getByLabel('Bis *',{exact:true}).fill('2020-01-02');await emptySheet.getByRole('button',{name:'Anwenden',exact:true}).click();
   assert.ok((await page.locator('.bo-statistics-bar').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height))).every(height=>height===0),'Empty period has no fabricated columns');
   await page.getByText('Keine Buchungen im gewählten Zeitraum.',{exact:true}).waitFor();
  }
  if(hasInteraction('time')){
  await page.waitForLoadState("networkidle");await navigate(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
  const group=page.locator('details.time-group').first();await group.waitFor();
  assert.equal(await group.locator('summary strong').textContent(),'2:15','Grouped duration uses exact minutes');
  assert.equal(await group.getAttribute('open'),null,'Entry groups start collapsed');
  await group.locator('summary').click();await group.locator('.time-record-list').waitFor();
  assert.equal(await group.locator('.time-record-list>div').count(),2,'Expansion shows both entries');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-entries.png`),fullPage:true});
  const searchRect=await page.locator('.time-filter-toolbar .searchbox').boundingBox(),filterRect=await page.getByRole('button',{name:'Zeitfilter'}).boundingBox();
  assert.ok(filterRect.x>searchRect.x&&Math.abs(filterRect.y-searchRect.y)<5,'Mobile filter follows search on the same row');
  }
  if(hasInteraction('time')){
   await page.getByRole('button',{name:'Zeitfilter',exact:true}).click();let filter=page.getByRole('dialog',{name:'Zeitfilter',exact:true});await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await page.keyboard.press('Escape');assert.equal(await page.locator('.time-group').count(),1,'Cancelling a filter preserves the applied range');
   await page.getByRole('button',{name:'Zeitfilter',exact:true}).click();filter=page.getByRole('dialog',{name:'Zeitfilter',exact:true});assert.equal(await filter.getByLabel('Von',{exact:true}).inputValue(),'','Discarded range is not applied');await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await filter.getByRole('button',{name:'Anwenden',exact:true}).click();assert.equal(await page.locator('.time-group').count(),0,'Applying updates the entries');
   policyPosts=0;policyRequired=true;failPolicy=true;await navigate(base+'/einstellungen/zeiterfassung');await page.waitForLoadState('networkidle');const required=page.getByRole('switch',{name:'Freigabe erforderlich'});await required.click();await page.getByRole('button',{name:'Speichern',exact:true}).dblclick();await page.getByRole('alert').filter({hasText:'Fixture policy unavailable'}).waitFor();assert.equal(policyPosts,1,'Policy rejects same-frame duplicate writes');assert.equal(await required.getAttribute('aria-checked'),'false','Policy error preserves the chosen value');failPolicy=false;await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByText('Zeiterfassungseinstellung gespeichert.',{exact:true}).waitFor();assert.equal(policyRequired,false);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-settings.png`)});
   policyRole='member';await navigate(base+'/einstellungen/zeiterfassung');await page.waitForLoadState('networkidle');assert.equal(await page.getByRole('switch',{name:'Freigabe erforderlich'}).isEnabled(),false);assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0,'Member cannot change the organization policy');policyRole='owner';
   teamPosts=0;failTeam=false;await navigate(base+'/einstellungen/team');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Mitarbeiter einladen',exact:true}).filter({visible:true}).click();const invitation=page.getByRole('dialog',{name:'Einladung',exact:true});await invitation.getByLabel('E-Mail',{exact:true}).fill('invalid');await invitation.getByRole('button',{name:'Einladen',exact:true}).click();assert.equal(teamPosts,0,'Invalid invitations do not write');await invitation.getByLabel('E-Mail',{exact:true}).fill('team@example.invalid');failTeam=true;await invitation.getByRole('button',{name:'Einladen',exact:true}).dblclick();await page.getByText('Fixture team unavailable',{exact:true}).waitFor();assert.equal(teamPosts,1,'Invitation locks duplicate writes');assert.equal(await invitation.getByLabel('E-Mail',{exact:true}).inputValue(),'team@example.invalid');failTeam=false;await invitation.getByRole('button',{name:'Einladen',exact:true}).click();await invitation.waitFor({state:'hidden'});assert.equal(teamPosts,2,'Invitation failure can be retried');
  }
  if(hasInteraction('documents')){
  projectSourceMode=true;failProjectSource=true;
  await navigate(base+'/rechnungen/neu?sourceOffer=AN-TEST-1');await page.getByRole('alert').getByText('Synthetic source unavailable',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Weiter',exact:true}).count(),0,'Source failure blocks guided creation');
  failProjectSource=false;await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByRole('button',{name:'Weiter',exact:true}).waitFor();assert.equal(await page.getByLabel('Kunde auswählen',{exact:true}).isDisabled(),true,'Source customer is locked');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.mobile-position-summary').first().click();
  const sourcePosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await sourcePosition.getByLabel('Beschreibung',{exact:true}).fill('Preserved source draft');await sourcePosition.getByRole('button',{name:'Übernehmen',exact:true}).click();
  const refreshedSource=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/documents/AN-TEST-1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await refreshedSource;await page.waitForLoadState('networkidle');assert.ok((await page.locator('.mobile-position-summary').first().innerText()).includes('Preserved source draft'),'Source refresh cannot overwrite edited input');
  await page.locator('.mobile-back').click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL(base+'/rechnungen');projectSourceMode=false;
  processRecoveryMode=true;await navigate(base+'/angebote/neu');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.mobile-position-summary').first().click();const recoveryPosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await recoveryPosition.getByLabel('Beschreibung',{exact:true}).fill('Recovered unsaved offer');await recoveryPosition.getByRole('button',{name:'Übernehmen',exact:true}).click();
  await page.waitForFunction(()=>Object.keys(sessionStorage).some(key=>key.startsWith('binso.process-draft.v1:')));await page.reload();await page.locator('.mobile-position-summary').first().waitFor();assert.ok((await page.locator('.mobile-position-summary').first().innerText()).includes('Recovered unsaved offer'),'Reload restores input and wizard step');
  await page.locator('.mobile-back').click();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.ok((await page.locator('.mobile-position-summary').first().innerText()).includes('Recovered unsaved offer'));await page.locator('.mobile-back').click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL(base+'/angebote');assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>key.startsWith('binso.process-draft.v1:')).length),0,'Confirmed discard removes recoverable input');processRecoveryMode=false;
  await navigate(base+'/rechnungen');await page.waitForLoadState('networkidle');await page.locator('a[href="/rechnungen/neu"]').filter({visible:true}).first().click();await page.waitForURL(base+'/rechnungen/neu');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.mobile-position-summary').first().click();
  const appliedPosition=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await appliedPosition.getByLabel('Beschreibung',{exact:true}).fill('Übernommener Entwurf');await appliedPosition.getByRole('button',{name:'Übernehmen',exact:true}).click();await appliedPosition.waitFor({state:'hidden'});
  await page.evaluate(()=>history.back());
  const parentDiscard=page.getByRole('alertdialog');try{await parentDiscard.waitFor()}catch(error){console.log('Draft-transfer diagnostics',page.url(),await page.evaluate(()=>history.state));throw error;}
  await parentDiscard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.locator('.mobile-position-summary').first().innerText().then(text=>text.includes('Übernommener Entwurf')),true,'Applying a child sheet preserves the parent draft and its back guard');
  await page.evaluate(()=>history.back());await parentDiscard.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL(base+'/rechnungen');
  await navigate(base+'/rechnungen/neu');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await page.locator('.mobile-position-summary').first().click();
  const position=page.getByRole('dialog',{name:'Position bearbeiten',exact:true});await position.getByLabel('Beschreibung',{exact:true}).fill('Ungespeicherte Position');
  await position.getByRole('button',{name:'Abbrechen',exact:true}).click();
  const discard=page.getByRole('alertdialog');await discard.waitFor();
  const layers=await page.evaluate(()=>({confirm:Number(getComputedStyle(document.querySelector('.confirm-layer')).zIndex),sheet:Number(getComputedStyle(document.querySelector('.mobile-position-layer')).zIndex)}));assert.ok(layers.confirm>layers.sheet,'Discard confirmation is above the position sheet');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-position-discard.png`)});
  await page.setViewportSize({width:320,height:568});
  for(const button of await discard.getByRole('button').all())assert.equal(await button.evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Discard actions fit a 320px viewport');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-position-discard.png`)});
  await page.setViewportSize({width:430,height:900});
  await discard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await position.getByLabel('Beschreibung',{exact:true}).inputValue(),'Ungespeicherte Position');
  await position.getByRole('button',{name:'Abbrechen',exact:true}).click();await discard.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await position.waitFor({state:'hidden'});
  await page.waitForLoadState("networkidle");await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
  await actionEvidence(page,'Weitere Aktionen',theme);await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Vorschau',exact:true}).click();
  const expectedPdfPages=Number(process.env.BINSO_UX_PDF_PAGES||2);
  const previous=page.getByRole('button',{name:'Vorherige Seite',exact:true}),next=page.getByRole('button',{name:'Nächste Seite',exact:true});
  const rendered=async number=>{await page.locator(`.pdf-page canvas[data-rendered-page="${number}"]`).waitFor();assert.equal(await page.locator('.pdf-page').count(),1,'Exactly one PDF page is mounted');await page.getByRole('status').filter({hasText:`Seite ${number} von ${expectedPdfPages}`}).waitFor();};
  await rendered(1);assert.equal(await previous.isDisabled(),true);
  const fit=await page.locator('.pdf-page canvas').boundingBox(),stage=await page.locator('.document-page-stage').boundingBox();
  assert.ok(Math.abs(fit.width/fit.height-210/297)<.01&&fit.width<=stage.width&&fit.height<=stage.height,'Whole A4 page fits both dimensions');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-pdf-preview.png`),fullPage:true});
  for(let number=2;number<=expectedPdfPages;number++){await next.click();await rendered(number);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-pdf-page-${number}.png`)});}
  assert.equal(await next.isDisabled(),true);
  for(let number=expectedPdfPages-1;number>=1;number--){await previous.click();await rendered(number);}
  await page.getByRole('button',{name:'Vorschau vergrössern',exact:true}).click();
  await page.locator('.document-page-stage.is-zoomed canvas[data-rendered-page="1"]').waitFor();
  const zoom=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,document:document.querySelector('.document-page-stage').scrollWidth}));
  assert.ok(zoom.page<=zoom.viewport+1&&zoom.document>zoom.viewport,'Zoom scrolls only inside the document area');
  await page.getByRole('button',{name:'Auf Bildschirm einpassen',exact:true}).click();
  await page.locator('.document-page-stage:not(.is-zoomed) canvas[data-rendered-page="1"]').waitFor();
  await page.setViewportSize({width:430,height:400});await page.waitForTimeout(100);
  const nav=await page.locator('.document-page-navigation').boundingBox(),small=await page.locator('.pdf-page canvas').boundingBox();assert.ok(nav.y+nav.height<=401&&small.y+small.height<=nav.y+1,'Full page and navigation remain reachable at short height');await page.setViewportSize({width:430,height:1000});
  // Deliberately exercise the browser-download capability fallback; no native share UI is simulated.
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Teilen oder herunterladen',exact:true}).click();
  const download=await downloaded;assert.deepEqual(await fs.readFile(await download.path()),fixturePdf,'Download is byte-identical to the preview PDF');
  await page.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  }
  if(hasInteraction('documents')){
   invoice.status='draft';await navigate(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');assert.equal(await page.getByText('Zahlungsstand',{exact:true}).count(),0,'Draft does not demand payment');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-draft-invoice.png`)});invoice.status='sent';
  }
  if(hasInteraction('employees')){
  employeeLedgerFixture=true;
  await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Übersicht',exact:true}).waitFor();
  await page.getByRole('button',{name:'Mitarbeiteraktionen',exact:true}).filter({visible:true}).click();await actionEvidence(page,'Mitarbeiteraktionen',theme);await page.keyboard.press('Escape');
  const header=page.locator('.mobile-header');assert.equal(await header.locator('.status').count(),1,'Employee status appears beside the name once');
  await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();await page.getByText('7:30 h',{exact:true}).waitFor();assert.equal(await page.locator('.employee-tab-panel .document-summary-row').count(),1,'Employee time uses central rows');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-time.png`),fullPage:true});
  await page.getByRole('tab',{name:'Spesen',exact:true}).click();await page.locator('.employee-tab-panel a[href="/spesen/expense-one"]').waitFor();assert.equal(await page.locator('.employee-tab-panel .document-summary-row').count(),1,'Employee expenses use the main module row');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-expenses.png`),fullPage:true});
  await page.getByRole('tab',{name:'Dokumente',exact:true}).click();await page.getByText('Keine Dokumente erfasst',{exact:true}).waitFor();assert.equal(await page.locator('.employee-tab-panel [data-empty-state="compact"]').count(),1,'Documents use the central empty state');assert.equal(await page.locator('.employee-tab-panel .compact-list').count(),0,'No legacy employee document list is rendered');
  await page.getByRole('button',{name:'Dokument hinzufügen',exact:true}).waitFor();
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-documents.png`),fullPage:true});
  employeeLedgerFixture=false;
  }
  if(hasInteraction('products')){
   await navigate(base+'/produkte/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Name',{exact:true}).fill('Unconfirmed synthetic product');await page.getByLabel('Verkaufspreis (CHF)',{exact:true}).fill('125');incompleteProductResponse=true;
   await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).click();await page.getByText('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.',{exact:true}).waitFor();assert.equal(await page.getByText('Produkt gespeichert.',{exact:true}).count(),0,'Unconfirmed ordinary create cannot show success');assert.equal(new URL(page.url()).pathname,'/produkte/neu');assert.equal(await page.getByLabel('Name',{exact:true}).inputValue(),'Unconfirmed synthetic product','Unconfirmed create preserves the draft');incompleteProductResponse=false;
   await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).click();await page.getByText('Produkt gespeichert.',{exact:true}).waitFor();await page.waitForURL(base+'/produkte');

  await page.waitForLoadState("networkidle");await navigate(base+'/produkte');await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{localStorage.removeItem('binso.demo.session');localStorage.removeItem('binso.demo.database')});
  await page.setViewportSize({width:430,height:900});
  await page.waitForLoadState("networkidle");await navigate(base+'/produkte');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Produkte suchen...',exact:true}).click();await page.getByPlaceholder('Produkte suchen...').fill('not-present');await page.getByRole('dialog').getByRole('button',{name:'Anwenden',exact:true}).click();
  await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Produkte suchen...',exact:true}).click();await page.getByPlaceholder('Produkte suchen...').fill('Beratung');await page.getByRole('dialog').getByRole('button',{name:'Anwenden',exact:true}).click();
  await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();
  await page.waitForLoadState("networkidle");await navigate(base+'/produkte/product-one');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();
  const dialog=page.getByRole('dialog',{name:'Produktaktionen'});await dialog.waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-action-sheet.png`)});
  assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Opening the sheet moves focus inside');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Produktaktionen','Sheet restores trigger focus');
  await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();await actionEvidence(page,'Produktaktionen',theme);await page.getByRole('dialog',{name:'Produktaktionen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();await page.getByLabel('Verkaufspreis (CHF)',{exact:true}).fill('130');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).first().click();await page.waitForURL(base+'/produkte');await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();await page.waitForTimeout(750);await page.waitForLoadState('networkidle');
  // SPA navigation does not reset Playwright's load state. Allow the destination
  // fixtures and idle link prefetch to settle before the next hard navigation.
  }
  if(hasInteraction('expenses')){
  failMutation=true;posts=0;uploads=0;
  await page.waitForLoadState("networkidle");await navigate(base+'/spesen/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Händler / Firma',{exact:true}).fill('SBB');await page.getByLabel('Betrag',{exact:true}).fill('89');
  await page.locator('#expense-receipt-upload').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Einreichen'&&button.disabled));
  assert.equal(await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().isEnabled(),false,'Cannot submit while receipt recognition is running');
  while(!releaseReceiptScan)await new Promise(resolve=>setTimeout(resolve,10));releaseReceiptScan();releaseReceiptScan=undefined;
  await page.getByText(/Erkannt.*Angaben prüfen/).waitFor();
  await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().dblclick();
  await page.getByText('Fixture offline',{exact:true}).waitFor();assert.equal(posts,1,'Two rapid clicks must issue one expense write');
  assert.equal(Number(await page.getByLabel('Betrag',{exact:true}).inputValue()),89,'Failed submission preserves input');
  failMutation=false;await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().click();
  await page.waitForURL(base+'/spesen');await page.locator('.mobile-record-list').getByText('SBB',{exact:true}).waitFor();await page.waitForTimeout(750);await page.waitForLoadState('networkidle');assert.equal(posts,2,'Failed expense write can be retried');assert.equal(uploads,1,'Receipt is uploaded once after a successful expense save');
  }
  if(hasInteraction('employees')){
  failLedger=true;await page.waitForLoadState("networkidle");await navigate(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();
  await page.getByText('Fixture ledger unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).count(),0,'Failed ledger must not look empty');failLedger=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).waitFor();
  }
  if(hasInteraction('chat')){
  await page.setViewportSize({width:375,height:400});await page.waitForLoadState('networkidle');await navigate(base+'/support/ticket-one');await page.waitForLoadState('networkidle');
  await page.getByLabel('Nachricht',{exact:true}).focus();const composer=await page.locator('.thread-composer').boundingBox(),chatHeader=await page.locator('.mobile-header').boundingBox();assert.ok(composer.y>=chatHeader.y+chatHeader.height&&composer.y+composer.height<=400,'Short chat viewport retains header and input');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-375-400-chat.png`)});await page.setViewportSize({width:430,height:900});
  failSend=true;messagePosts=0;await page.waitForLoadState("networkidle");await navigate(base+'/support/ticket-one');await page.waitForLoadState('networkidle');await page.getByLabel('Nachricht',{exact:true}).fill('Test message');await page.getByRole('button',{name:'Senden',exact:true}).dblclick();await page.getByText('Fixture message offline',{exact:true}).waitFor();assert.equal(messagePosts,1);assert.equal(await page.getByLabel('Nachricht',{exact:true}).inputValue(),'Test message');failSend=false;await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Test message',{exact:true}).waitFor();assert.equal(messagePosts,2);
  }
  if(hasInteraction('customers')){
   await page.setViewportSize({width:320,height:740});await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('.customer-detail-workspace .surface .status').filter({hasText:/^Aktiv$/}).count(),0,'Customer status appears only in the header');
   await page.getByRole('tab',{name:'Kontakte',exact:true}).click();
   const row=page.locator('.contact-list>div').first(),name=await row.locator('b').boundingBox(),menu=await row.getByRole('button',{name:'Alex Muster Aktionen'}).boundingBox();
   assert.ok(menu.x>name.x&&menu.y<=name.y+name.height,'Contact action stays in the first line');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contacts-final.png`)});
   await row.getByRole('button',{name:'Alex Muster Aktionen'}).click();await actionEvidence(page,'Kontaktaktionen',theme);await page.getByRole('button',{name:'Kontakt bearbeiten'}).click();
   const primary=page.getByRole('checkbox',{name:'Als Hauptkontakt festlegen'}),box=await primary.boundingBox();assert.ok(box.width<=24&&box.height<=24,'Primary contact checkbox stays compact');assert.equal(await primary.isChecked(),true,'Existing primary contact value is retained');assert.ok((await page.getByRole('dialog').boundingBox()).x>=0,'Contact sheet stays inside the viewport');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contact-form-final.png`)});await page.keyboard.press('Escape');
   await page.getByRole('tab',{name:'Finanzen',exact:true}).click();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-customer-finance-final.png`)});assert.equal(await page.locator('.mobile-record-list .document-summary-row').count(),2,'Offers and invoices share the same financial row');
  }
  if(hasInteraction('time')){
   groupingFixture=true;   await page.setViewportSize({width:320,height:740});await navigate(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
   assert.equal(await page.locator('.time-group').count(),4,'Internal time and distinct customer/project identities remain four groups');assert.equal(await page.locator('.timer-card .section-title strong').innerText(),'40:45 h','Group total counts each entry once');
   const group=page.locator('.time-group-head').first();assert.equal(await group.evaluate(el=>getComputedStyle(el).textAlign),'left','Time group does not inherit timer centering');
   const customerBox=await group.locator('b').boundingBox(),duration=await group.locator('strong').boundingBox(),chevron=await group.locator('svg').boundingBox();assert.ok(customerBox.x<duration.x&&duration.x<chevron.x,'Group duration and chevron are right aligned');assert.ok((await group.boundingBox()).height<=76,'Collapsed group is compact');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-time-groups-final.png`)});
   await page.getByRole('button',{name:'Manuell erfassen',exact:true}).click();const sheet=page.getByRole('dialog',{name:'Zeit manuell erfassen'});assert.equal(await sheet.getByRole('button',{name:'Speichern',exact:true}).count(),1);
   await page.setViewportSize({width:320,height:400});await sheet.getByLabel('Beschreibung',{exact:true}).focus();await sheet.getByLabel('Beschreibung',{exact:true}).scrollIntoViewIfNeeded();const footer=await sheet.locator('.filter-sheet-actions').boundingBox(),header=await sheet.locator('.sheet-header').boundingBox();assert.ok(header.y>=0&&footer.y+footer.height<=401&&footer.x+footer.width<=321,'Manual time sheet keeps header and footer visible at keyboard-sized height');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-400-manual-time-final.png`)});await page.keyboard.press('Escape');groupingFixture=false;
  }
  if(hasInteraction('header')){
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');
    const header=page.locator(width<=760?'.mobile-header':'.desktop-appbar');
    await page.evaluate(()=>window.scrollTo(0,180));const scroll=await page.evaluate(()=>scrollY);
    const searchTrigger=await header.getByRole('button',{name:'Suche',exact:true}).boundingBox();await page.mouse.click(searchTrigger.x+searchTrigger.width/2,searchTrigger.y+searchTrigger.height/2);
    const panel=page.getByRole('dialog',{name:'Suche',exact:true});await panel.waitFor();
    assert.equal(await page.locator('.bottom-sheet').count(),0,'Header search is not a bottom sheet');
    assert.equal(await panel.getByRole('button',{name:'Abbrechen',exact:true}).count(),0,'Search has only the central close control');
    assert.equal(await panel.getByLabel('Suchen',{exact:true}).evaluate(el=>el===document.activeElement),true,'Search focuses its input');
    const box=await panel.boundingBox(),bar=await header.boundingBox();assert.ok(box.y>=bar.y+bar.height-1&&box.x>=0&&box.x+box.width<=width+1,'Panel begins under the fixed header inside viewport');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'clip');
    assert.equal(await panel.getByText('Mindestens zwei Zeichen eingeben.',{exact:true}).count(),0);
    await panel.getByLabel('Suchen',{exact:true}).fill('old');await page.waitForTimeout(220);await panel.getByLabel('Suchen',{exact:true}).fill('Prüffirma');
    await panel.getByText('Prüffirma AG',{exact:true}).first().waitFor();await page.waitForTimeout(500);assert.equal(await panel.getByText('Veraltetes Ergebnis',{exact:true}).count(),0,'Stale responses never replace current search');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-search.png`)});
    await page.setViewportSize({width,height:400});
    const keyboardGeometry=await panel.evaluate(el=>{const root=document.documentElement,previous=root.style.getPropertyValue('--dialog-viewport-height');root.style.setProperty('--dialog-viewport-height','740px');const box=el.getBoundingClientRect();root.style.setProperty('--dialog-viewport-height',previous);return {top:box.top,bottom:box.bottom,height:innerHeight}});
    assert.ok(keyboardGeometry.bottom<=401,'Search remains bounded even while the VisualViewport callback is pending: '+JSON.stringify(keyboardGeometry));
    await page.setViewportSize({width,height:740});await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    assert.equal(await page.evaluate(()=>scrollY),scroll,'Closing panel retains document scroll position');
    await header.getByRole('button',{name:'Benutzerkonto',exact:true}).click();const account=page.getByRole('dialog',{name:'Konto',exact:true});await account.getByText('Test Person',{exact:true}).waitFor();await assertAccountAvatarSpacing(account);
    assert.equal(await account.locator('.person-avatar').innerText(),'TP');assert.equal(await account.getByRole('link',{name:'Abonnement',exact:true}).count(),0,'Account panel does not duplicate company billing');
    const accountRows=await account.locator('.action-row').evaluateAll(rows=>rows.map(row=>{const css=getComputedStyle(row),box=row.getBoundingClientRect(),icon=row.firstElementChild.getBoundingClientRect(),text=row.children[1].getBoundingClientRect();return {height:box.height,font:css.fontSize,weight:css.fontWeight,display:css.display,grid:css.gridTemplateColumns,iconLeft:icon.left,textLeft:text.left,iconWidth:icon.width}}));
    assert.ok(accountRows.length>=6);for(const row of accountRows)assert.deepEqual(row,accountRows[0],'Personal, company, create-account and logout rows share the same geometry and typography');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-account.png`)});
    await header.getByRole('button',{name:'Benachrichtigungen',exact:true}).click();const notifications=page.getByRole('dialog',{name:'Benachrichtigungen',exact:true});await notifications.getByText('Neue Rechnung',{exact:true}).waitFor();assert.equal(await account.count(),0,'Only one header panel is mounted');
    await notifications.getByRole('button',{name:'Ungelesen',exact:true}).click();assert.equal(await notifications.getByText('Produktinformation',{exact:true}).count(),0);
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-header-notifications.png`)});await page.keyboard.press('Escape');
   }
   for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:740});await navigate(base+'/einstellungen/darstellung');await page.waitForLoadState('networkidle');
    const choices=page.getByRole('radiogroup',{name:'Darstellung',exact:true});assert.equal(await choices.getByRole('radio').count(),3);assert.equal(await page.locator('.appearance-card,.theme-preview').count(),0);
    const heights=await choices.getByRole('radio').evaluateAll(rows=>rows.map(row=>row.getBoundingClientRect().height));assert.ok(heights.every(height=>Math.abs(height-heights[0])<1),'Theme rows keep equal heights');
    assert.equal(await page.getByLabel('Sprache',{exact:true}).locator('option').count(),1,'Offer only the translated language');
    await choices.getByRole('radio',{name:/^Hell/}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await choices.getByRole('radio',{name:/^Dunkel/}).click();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await choices.getByRole('radio',{name:/^Dunkel/}).press('ArrowDown');await page.waitForFunction(()=>document.documentElement.dataset.themeMode==='system');
    await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
    await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await page.waitForLoadState('networkidle');await page.reload();await choices.waitFor();await page.waitForLoadState('networkidle');assert.equal(await choices.getByRole('radio',{name:/^System/}).getAttribute('aria-checked'),'true','System selection survives reload');
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-appearance-rows.png`)});
    await choices.getByRole('radio',{name:theme==='light'?/^Hell/:/^Dunkel/}).click();await page.waitForLoadState('networkidle');
   }
   await page.setViewportSize({width:390,height:740});await navigate(base+'/einstellungen/konto');await page.waitForLoadState('networkidle');
   await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click();
   await page.getByLabel('Vorname',{exact:true}).fill('Neu');await page.locator('.mobile-back').click();const confirm=page.getByRole('alertdialog');await confirm.waitFor();await confirm.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.getByLabel('Vorname',{exact:true}).inputValue(),'Neu');
   await page.getByLabel('Vorname',{exact:true}).fill('Test');await page.locator('.mobile-back').click();await page.waitForURL(base+'/einstellungen');assert.equal(await page.getByRole('alertdialog').count(),0,'Restoring original values clears dirty state');
   await navigate(base+'/dashboard');await page.waitForLoadState('networkidle');await page.locator('.mobile-header').getByRole('button',{name:'Benutzerkonto',exact:true}).click();await page.getByRole('link',{name:'Mein Profil',exact:true}).click();await page.waitForURL(url=>url.pathname==='/einstellungen/konto');assert.equal(new URL(page.url()).searchParams.get('accountReturn'),'/dashboard?panel=account','Profile retains invoking account menu context');await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click();await page.getByLabel('Vorname',{exact:true}).fill('Browserentwurf');await page.evaluate(()=>history.back());await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await page.getByLabel('Vorname',{exact:true}).inputValue(),'Browserentwurf','Safari browser back retains unsaved input');await page.evaluate(()=>history.back());await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await page.waitForURL(base+'/dashboard');
   await navigate(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Kontakte',exact:true}).click();await page.getByRole('button',{name:'Kontakt',exact:true}).click();const form=page.getByRole('dialog',{name:'Kontakt hinzufügen',exact:true});await form.getByLabel('Vorname',{exact:true}).fill('Unsaved');await page.keyboard.press('Control+k');assert.equal(await page.locator('.header-panel').count(),0,'Global shortcut cannot open a header panel over a form sheet');assert.equal(await form.isVisible(),true);await page.keyboard.press('Escape');await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await form.getByLabel('Vorname',{exact:true}).inputValue(),'Unsaved');await form.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await form.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.body.style.overflow),'','Nested confirmations restore scroll lock');
  }
  if(hasInteraction('header')){
   await navigate(base+'/einstellungen/benachrichtigungen');await page.waitForLoadState('networkidle');const emailSwitch=page.getByRole('switch',{name:'E-Mail Rechnungen',exact:true});assert.equal(await emailSwitch.getAttribute('aria-checked'),'true');failPreferences=true;preferencePosts=0;await emailSwitch.dblclick();await page.getByRole('alert').getByText('Einstellung konnte nicht gespeichert werden.',{exact:true}).waitFor();assert.equal(preferencePosts,1,'An in-flight channel cannot be toggled twice');assert.equal(await emailSwitch.getAttribute('aria-checked'),'true','Failed immediate persistence restores original preference');failPreferences=false;await emailSwitch.click();await page.waitForLoadState('networkidle');assert.equal(await emailSwitch.getAttribute('aria-checked'),'false');assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0,'Immediately saved preferences have no second save action');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-notification-preferences.png`)});
   await navigate(base+'/einstellungen/team');await page.waitForLoadState('networkidle');await page.getByRole('button').filter({hasText:'Team Person'}).click();const member=page.getByRole('dialog',{name:'Teammitglied',exact:true});await member.getByRole('combobox',{name:/^Rolle/}).selectOption('admin');teamPosts=0;await member.getByRole('button',{name:'Rolle speichern',exact:true}).click();const roleConfirm=page.getByRole('alertdialog');await roleConfirm.waitFor();assert.equal(teamPosts,0,'Rights are not changed before explicit confirmation');await roleConfirm.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(await member.getByRole('combobox',{name:/^Rolle/}).inputValue(),'admin');await member.getByRole('button',{name:'Rolle speichern',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Rolle ändern',exact:true}).dblclick();await member.waitFor({state:'hidden'});assert.equal(teamPosts,1,'Confirmed rights mutation is locked against duplicate submissions');await page.getByRole('button').filter({hasText:'Team Person'}).getByText('Administrator',{exact:true}).waitFor();
  }
  if(hasInteraction('header'))for(const route of ['/einladung?token=fixture','/passwort-zuruecksetzen?token=fixture']){
   await navigate(base+route);await page.waitForLoadState('networkidle');const field=page.locator('input').first();await field.fill(route.startsWith('/einladung')?'Einladung Entwurf':'SyntheticPassword!123');await page.goBack();const discard=page.getByRole('alertdialog');await discard.waitFor();await discard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.ok((await field.inputValue()).length>0,'Auth creation drafts survive canceled browser back');await field.fill('');await page.waitForTimeout(50);assert.equal(await page.getByRole('alertdialog').count(),0,'Reverting a draft removes the warning');
  }
  for(const scenario of [
   {group:'customers',route:'/kunden/customer-one/bearbeiten',field:'Kundenname *',back:'/kunden'},
   {group:'products',route:'/produkte/product-one',menu:'Produktaktionen',field:'Name',back:'/produkte'},
   {group:'employees',route:'/mitarbeiter/employee-one',menu:'Mitarbeiteraktionen',field:'Vorname',back:'/mitarbeiter'},
  ]){
   if(!hasInteraction(scenario.group))continue;
   await page.setViewportSize({width:390,height:740});await navigate(base+scenario.route);await page.waitForLoadState('networkidle');
   if(scenario.menu){await page.getByRole('button',{name:scenario.menu,exact:true}).filter({visible:true}).click();await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click()}
   const field=page.getByLabel(scenario.field,{exact:true});const original=await field.inputValue();await field.fill(original+' geändert');await field.fill(original);await page.waitForTimeout(100);
   if(scenario.group==='customers')await page.getByRole('dialog',{name:'Kunde bearbeiten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();else{const sheet=page.getByRole('dialog',{name:scenario.group==='products'?'Produkt bearbeiten':'Mitarbeiter bearbeiten',exact:true});await sheet.getByRole('button',{name:'Schliessen',exact:true}).click();await sheet.waitFor({state:'hidden'});assert.equal(await page.getByRole('alertdialog').count(),0,'Pristine sheet closes without a warning');await page.locator('.mobile-back').click();}await page.waitForURL(base+scenario.back);assert.equal(await page.getByRole('alertdialog').count(),0,scenario.group+': restoring original values is pristine');
  }
  if(hasInteraction('settings')){
   let failDocumentSettings=true;
   const settingsFailure=async route=>{if(failDocumentSettings&&route.request().method()==='GET')return route.fulfill({status:503,json:{message:'Synthetic document settings unavailable'}});return route.fallback()};
   await context.route('**/api/settings/documents',settingsFailure);
   await navigate(base+'/einstellungen/dokumente');await page.getByText('Synthetic document settings unavailable',{exact:true}).waitFor();
   await page.evaluate(()=>{window.__settingsRetryMarker='same-document'});failDocumentSettings=false;
   await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.__settingsRetryMarker),'same-document','Settings retry refetches the resource without reloading the app');
   await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).first().click();
   await page.getByLabel('Rechnung – Einleitung',{exact:true}).fill('Unsaved settings survive revalidation');
   const settingsRead=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/settings/documents');
   await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await settingsRead;await page.waitForLoadState('networkidle');
   assert.equal(await page.getByLabel('Rechnung – Einleitung',{exact:true}).inputValue(),'Unsaved settings survive revalidation','Background settings data cannot overwrite an edited form');
   await context.unroute('**/api/settings/documents',settingsFailure);
   await page.setViewportSize({width:320,height:740});await navigate(base+'/einstellungen/benachrichtigungen');await page.waitForLoadState('networkidle');
   for(const row of await page.locator('.preference-row').all()){
    const geometry=await row.evaluate(el=>{const description=el.firstElementChild.getBoundingClientRect(),channels=el.querySelector('.preference-channels').getBoundingClientRect(),label=el.querySelector('.preference-channels label span').getBoundingClientRect();return {description,channels,label}});
    assert.ok(geometry.channels.y>=geometry.description.bottom,'Mobile notification channels follow the category');assert.ok(geometry.channels.width>=geometry.description.width-1,'Channels use the entire row width');assert.ok(geometry.label.height<=22,'E-Mail stays on one line');
   }
   notificationWrites=0;failNotificationWrite=true;const emailPreference=page.getByRole('switch',{name:'E-Mail Rechnungen',exact:true});await emailPreference.dblclick();await page.getByRole('alert').filter({hasText:'Einstellung konnte nicht gespeichert werden.'}).waitFor();assert.equal(notificationWrites,1,'Notification writes lock repeated clicks');assert.equal(await emailPreference.getAttribute('aria-checked'),'true','Failed optimistic preference returns to saved value');failNotificationWrite=false;await emailPreference.click();await page.getByRole('alert').filter({hasText:'Einstellung konnte nicht gespeichert werden.'}).waitFor({state:'hidden'});assert.equal(await emailPreference.getAttribute('aria-checked'),'false');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-notification-preferences.png`)});
   await navigate(base+'/einstellungen/dokumente');await page.getByText('Synthetischer Rechnungstext',{exact:true}).waitFor();const documentGeometry=await page.evaluate(()=>({header:document.querySelector('.mobile-header').getBoundingClientRect().height,rows:[...document.querySelectorAll('.detail-list>div')].map(row=>({label:row.querySelector('dt').getBoundingClientRect().toJSON(),value:row.querySelector('dd').getBoundingClientRect().toJSON(),labelOverflow:row.querySelector('dt').scrollWidth-row.querySelector('dt').clientWidth}))}));assert.ok(documentGeometry.header<=64,'Long settings title keeps a compact header');for(const row of documentGeometry.rows){assert.ok(row.label.right<=row.value.left||row.label.bottom<=row.value.top,'Detail labels cannot collide with values');assert.ok(row.labelOverflow<=1,'Detail labels wrap within their column')}
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-document-settings.png`)});
   await navigate(base+'/einstellungen/sicherheit');await page.getByText('Safari · iPhone',{exact:true}).waitFor();await page.getByText('Chrome · Windows',{exact:true}).waitFor();
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-security-settings.png`)});
   sessionDeletes=0;await page.getByRole('button',{name:'Abmelden',exact:true}).click();const revoke=page.getByRole('alertdialog');await revoke.waitFor();assert.equal(sessionDeletes,0,'Opening session confirmation does not revoke');await revoke.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(sessionDeletes,0);await page.getByRole('button',{name:'Abmelden',exact:true}).click();await revoke.getByRole('button',{name:'Abmelden',exact:true}).click();await revoke.waitFor({state:'hidden'});assert.equal(sessionDeletes,1);await page.getByText('Dieses Gerät',{exact:false}).waitFor();
   securityUnavailable=true;await navigate(base+'/einstellungen/sicherheit');await page.getByRole('alert').filter({hasText:'Fixture security status unavailable'}).waitFor();await page.getByRole('alert').filter({hasText:'Fixture sessions unavailable'}).waitFor();assert.equal(await page.getByText('Keine aktive Sitzung gefunden.',{exact:true}).count(),0,'Failed session load is not an empty session list');assert.equal(await page.getByText('Sicherheitsstatus wird geladen…',{exact:true}).count(),0,'Failed security load is not perpetual loading');securityUnavailable=false;await page.getByLabel('Neues Passwort',{exact:true}).fill('Draft retained through retry');await page.getByRole('alert').filter({hasText:'Fixture security status unavailable'}).getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByRole('alert').filter({hasText:'Fixture sessions unavailable'}).getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Safari · iPhone',{exact:true}).waitFor();assert.equal(await page.getByLabel('Neues Passwort',{exact:true}).inputValue(),'Draft retained through retry','Retry preserves unsaved security inputs');
   await navigate(base+'/einstellungen/abonnement');await page.getByText('Nutzung',{exact:true}).waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-subscription-settings.png`)});
  }
  if(hasInteraction('operator')){
   await page.setViewportSize({width:320,height:740});await navigate(base+'/operator/sperrungen');await page.waitForLoadState('networkidle');const notice=await page.locator('.notice').evaluate(el=>[...el.children].map(child=>child.getBoundingClientRect().toJSON()));for(let i=1;i<notice.length;i++)assert.ok(notice[i].top>=notice[i-1].bottom+7,'Restriction details occupy separated rows');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-operator-restrictions.png`)});
   await navigate(base+'/operator');await page.waitForLoadState('networkidle');
   await page.locator('.operator-app-header').getByRole('button',{name:'Benutzerkonto',exact:true}).click();
   const panel=page.getByRole('dialog',{name:'Konto',exact:true});await panel.waitFor();await assertAccountAvatarSpacing(panel);
   const g=await page.evaluate(()=>({header:document.querySelector('.operator-app-header').getBoundingClientRect().bottom,panel:document.querySelector('.header-panel').getBoundingClientRect().top,inert:document.querySelector('.operator-page-head').inert}));
   assert.ok(g.panel>=g.header&&g.panel-g.header<=12,'Operator account shares the anchored top panel');assert.equal(g.inert,true,'Operator background is inert');
   await panel.getByRole('button',{name:'Abmelden',exact:true}).click();await panel.getByRole('alert').waitFor();assert.ok(page.url().endsWith('/operator'),'Failed logout must not pretend the session ended');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-account.png`)});await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
   assert.equal(await page.locator('.operator-app-header').getByRole('button',{name:'Benutzerkonto',exact:true}).evaluate(el=>el===document.activeElement),true,'Operator account restores trigger focus');
   // Client-renderer fixture only: the server still uses a local demo cookie.
   // All API requests remain intercepted; this does not claim real operator SSO coverage.
   await context.addInitScript(()=>{const selectClient=()=>document.querySelector('[data-operator-demo="true"]')?.setAttribute('data-operator-demo','false');new MutationObserver(selectClient).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['data-operator-demo']});selectClient()});
   await page.setViewportSize({width:390,height:740});await navigate(base+'/operator/abonnemente');
   const accountRow=page.locator('.operator-table-row').filter({hasText:'Prüffirma AG'});await accountRow.click();
   const accountSheet=page.getByRole('dialog',{name:'Prüffirma AG',exact:true});await accountSheet.waitFor();assert.equal(await accountSheet.getByLabel('Plan',{exact:true}).inputValue(),'pro');assert.equal(await accountSheet.getByLabel('Benutzerlimit',{exact:true}).inputValue(),'10');assert.equal(await accountSheet.evaluate(el=>el.contains(document.activeElement)),true);
   const operatorPeer=await trackedPage();await operatorPeer.goto(base+'/operator/abonnemente');await operatorPeer.locator('.operator-table-row').getByText('Pro',{exact:true}).waitFor();
   await accountSheet.getByLabel('Plan',{exact:true}).selectOption('business');await operatorPeer.locator('.operator-table-row').getByText('Business',{exact:true}).waitFor();await page.bringToFront();await accountSheet.getByLabel('Plan',{exact:true}).locator('option[value="business"]:checked').waitFor({state:'attached'});assert.equal(await accountSheet.getByLabel('Plan',{exact:true}).inputValue(),'business','Operator mutation revalidates the list and open account consistently');await operatorPeer.close();
   await page.setViewportSize({width:390,height:400});await accountSheet.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});const actionBox=await accountSheet.locator('.filter-sheet-actions').boundingBox();assert.ok(actionBox.y+actionBox.height<=401,'Operator FormSheet actions fit a short viewport');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-subscription-sheet.png`)});await page.keyboard.press('Escape');await accountSheet.waitFor({state:'hidden'});assert.equal(await accountRow.evaluate(el=>el===document.activeElement),true);
   await page.setViewportSize({width:390,height:740});await navigate(base+'/operator/sperrungen');await page.getByRole('button',{name:'Einschränkung erstellen',exact:true}).click();const restrict=page.getByRole('alertdialog',{name:'Zugriff einschränken?',exact:true});await restrict.waitFor();assert.equal(await restrict.evaluate(el=>el.contains(document.activeElement)),true);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-restriction-confirm.png`)});await restrict.getByRole('button',{name:'Abbrechen',exact:true}).click();await restrict.waitFor({state:'hidden'});
   await navigate(base+'/operator/tickets/ticket-one');await page.getByText('Öffentliche Nachricht',{exact:true}).waitFor();assert.equal(await page.getByText('Vertrauliche interne Notiz',{exact:true}).count(),0);await page.getByRole('button',{name:'Interne Notiz',exact:true}).click();await page.getByText('Vertrauliche interne Notiz',{exact:true}).waitFor();assert.equal(await page.getByText('Öffentliche Nachricht',{exact:true}).count(),0);assert.equal(await page.locator('.message').count(),1);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-operator-internal-message.png`)});
   let failAccounts=true;const accountFailure=async route=>failAccounts?route.fulfill({status:503,json:{message:'Synthetic operator accounts unavailable'}}):route.fallback();await context.route('**/api/operator/accounts',accountFailure);
   await navigate(base+'/operator/abonnemente');await page.getByText('Synthetic operator accounts unavailable',{exact:true}).waitFor();await page.evaluate(()=>{window.__operatorRetryMarker='same-document'});failAccounts=false;await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Prüffirma AG',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__operatorRetryMarker),'same-document','Operator retry preserves the document and targets the query');await context.unroute('**/api/operator/accounts',accountFailure);

  }
  if(hasInteraction('billing')){
   await page.setViewportSize({width:390,height:740});
   await page.evaluate(()=>{localStorage.setItem('binso.demo.session','1');localStorage.removeItem('binso.demo.database')});
   await navigate(base+'/einstellungen/abonnement');await page.waitForLoadState('networkidle');
   for(const date of ['01.10.2026','01.09.2026']){
    assert.equal(await page.locator('.invoices-panel .compact-list').count(),0,'Billing history uses central rows');await page.locator('.invoices-panel button.document-summary-row').filter({hasText:date}).click();
    const modal=page.getByRole('dialog',{name:'Rechnungsvorschau'});await modal.locator('canvas[data-rendered-page="1"]').waitFor();
    assert.equal(await modal.locator('.pdf-page').count(),1,'Billing uses the shared one-page PDF renderer');
    await modal.getByText('Seite 1 von 1',{exact:true}).waitFor();
    assert.equal(await modal.getByRole('button',{name:'Vorherige Seite'}).isDisabled(),true);
    assert.equal(await modal.getByRole('button',{name:'Nächste Seite'}).isDisabled(),true);
    await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-billing-${date.slice(3,5)}.png`)});
    await modal.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
   }
   await page.evaluate(()=>{localStorage.removeItem('binso.demo.session');localStorage.removeItem('binso.demo.database')});
  }
  if(hasInteraction('lab')){
   assert.equal(process.env.BINSO_UX_SERVER_MODE,'dev','UX-Lab checks require a development server');await navigate(base+'/dev/ux-lab');await page.waitForLoadState('networkidle');
   assert.equal(await page.getByLabel('Nur lesen',{exact:true}).isDisabled(),true);
   assert.equal(await page.getByLabel('Fehlerfeld',{exact:true}).getAttribute('aria-invalid'),'true');
   const validation=await page.getByLabel('Fehlerfeld',{exact:true}).evaluate(el=>el.getAttribute('aria-describedby').split(' ').map(id=>document.getElementById(id)?.textContent));assert.deepEqual(validation,['Geschäftliche E-Mail-Adresse','Bitte eine gültige E-Mail eingeben.']);
   assert.equal(await page.getByLabel('Datum',{exact:true}).getAttribute('type'),'date');assert.equal(await page.getByLabel('Betrag',{exact:true}).getAttribute('inputmode'),'decimal');
   await page.getByRole('button',{name:'Bestätigung öffnen',exact:true}).click();const confirmation=page.getByRole('alertdialog',{name:'Synthetische Bestätigung',exact:true});await confirmation.waitFor();assert.equal(await confirmation.evaluate(el=>el.contains(document.activeElement)),true);await page.keyboard.press('Escape');await confirmation.waitFor({state:'hidden'});assert.equal(await page.getByRole('button',{name:'Bestätigung öffnen',exact:true}).evaluate(el=>el===document.activeElement),true);
   await capture(page,{animations:'disabled',fullPage:true,path:path.join(output,`${theme}-lab-central-variants.png`)});
   await navigate(base+'/dev/ux-lab');await page.waitForLoadState('networkidle');await page.setViewportSize({width:390,height:740});await page.getByRole('button',{name:'wizard',exact:true}).click();const wizard=page.getByRole('dialog',{name:'WizardSheet',exact:true});await wizard.getByLabel('Name',{exact:true}).fill('Lab-Entwurf');await wizard.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))});const first=await wizard.boundingBox(),footer=await wizard.locator('.mobile-sticky-save').boundingBox();await wizard.getByRole('button',{name:'Weiter',exact:true}).click();assert.equal((await wizard.boundingBox()).height,first.height,'WizardSheet height stays stable across steps');assert.equal((await wizard.locator('.mobile-sticky-save').boundingBox()).y,footer.y,'Wizard actions never jump');await wizard.getByRole('button',{name:'Zurück',exact:true}).click();assert.equal(await wizard.getByLabel('Name',{exact:true}).inputValue(),'Lab-Entwurf');await page.setViewportSize({width:390,height:400});const short=await wizard.locator('.mobile-sticky-save').boundingBox();assert.ok(short.y+short.height<=401,'Wizard actions remain visible at keyboard-sized height');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-400-lab-wizard.png`)});await page.keyboard.press('Escape');await page.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();await wizard.getByRole('button',{name:'Weiter',exact:true}).click();await wizard.getByRole('button',{name:'Speichern',exact:true}).click();await wizard.waitFor({state:'hidden'});await page.setViewportSize({width:390,height:740});await page.locator('input[type=file]').setInputFiles({name:'lab.pdf',mimeType:'application/pdf',buffer:fixturePdf});await page.locator('canvas[data-rendered-page="1"]').waitFor();await page.getByRole('button',{name:'Nächste Seite',exact:true}).click();await page.locator('canvas[data-rendered-page="2"]').waitFor();assert.equal(await page.locator('.pdf-page').count(),1);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-390-lab-reference.png`)});
  }
  if(hasInteraction('data')){
   // All mounted tabs share a synthetic ledger; only the actual PaymentForm mutation
   // can change it. Broadcast invalidation, not navigation/reload, updates consumers.
   const priorCustomer={...customer};collections.customers.push({...customer,id:'customer-two',city:'Zürich'});customerIdentityMode=true;
   const priorInvoice={...invoice},priorOpenAmount=summary.invoices[0].open_amount;
   dataPaymentMode=true;dataPaymentPosts=0;paymentReplays.clear();invoice.total=2561.97;invoice.subtotal=2370;invoice.vat=191.97;invoice.paid_amount=0;summary.invoices[0].open_amount=2561.97;
   const tabs={};for(const [name,path] of Object.entries({detail:'/rechnungen/RE-TEST-1',list:'/rechnungen',customer:'/kunden/customer-one',customerOverview:'/kunden/customer-one?tab=overview',payments:'/zahlungen',finance:'/finanzen',dashboard:'/dashboard',activity:'/kunden/customer-one',form:'/zahlungen/neu?invoice=RE-TEST-1'})){tabs[name]=await trackedPage();await tabs[name].goto(base+path);await tabs[name].waitForLoadState('networkidle');await tabs[name].evaluate(()=>{window.v215ConsumerMarker='same-document';window.v215ConsumerChanges=[];window.v215ConsumerObserver=new BroadcastChannel('binso-data-events');window.v215ConsumerObserver.onmessage=event=>{if(event.data?.type==='changed')window.v215ConsumerChanges.push(event.data)}});}
   const customerList=await trackedPage();await customerList.goto(base+'/kunden');await customerList.waitForLoadState('networkidle');
   await customerList.evaluate(()=>{window.v215CustomerListMarker='same-document';window.v215CustomerChanges=[];window.v215CustomerObserver=new BroadcastChannel('binso-data-events');window.v215CustomerObserver.onmessage=event=>{if(event.data?.type==='changed')window.v215CustomerChanges.push(event.data)}});
   const editor=await trackedPage();await editor.goto(base+'/rechnungen/neu?customerId=customer-one');await editor.waitForLoadState('networkidle');const picker=editor.getByLabel('Kunde auswählen',{exact:true});assert.equal(await picker.locator('option').count(),2,'Duplicate names retain two distinct choices');assert.equal(await picker.inputValue(),'customer-one','Linked customer initialized by ID');await picker.selectOption('customer-two');
   const rename=await trackedPage();await rename.goto(base+'/kunden/customer-two/bearbeiten');await rename.getByLabel('Kundenname *',{exact:true}).fill('Identität bleibt erhalten AG');assert.equal(await rename.getByLabel('Kundenname *',{exact:true}).inputValue(),'Identität bleibt erhalten AG','An editor never appends server hydration to newly entered input');await rename.getByRole('button',{name:'Änderungen speichern',exact:true}).click();await rename.getByText('Kunde gespeichert.',{exact:true}).waitFor();
   await customerList.waitForFunction(()=>window.v215CustomerChanges.some(message=>message.domains?.includes('customers')),undefined,{polling:100});
   await editor.bringToFront();await editor.waitForFunction(()=>document.querySelector('option[value="customer-two"]')?.textContent?.includes('Identität bleibt erhalten AG'));assert.equal(await picker.inputValue(),'customer-two','Rename/revalidation cannot switch a draft back to the URL customer');await customerList.bringToFront();
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
   await tabs.customer.getByRole('tab',{name:'Finanzen',exact:true}).click();await tabs.activity.getByRole('tab',{name:'Aktivität',exact:true}).click();
   for(const consumer of Object.values(tabs))await consumer.evaluate(()=>{window.v215ConsumerChanges=[]});
   await tabs.form.getByLabel('Zahlungsbetrag CHF',{exact:true}).fill('1000');
   const initialPosts=dataPaymentPosts;dataPaymentFailed=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Synthetic payment failed',{exact:true}).waitFor();assert.equal(invoice.paid_amount,0);assert.equal(dataPaymentPosts,initialPosts+1);assert.equal(await tabs.detail.getByText(/1[’']561\.97/).count(),0,'Failed payment cannot create a visible fictional balance');
   dataPaymentFailed=false;incompletePaymentResponse=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.',{exact:true}).waitFor();assert.equal(await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).count(),0,'Incomplete JSON confirmation cannot report financial success');assert.equal(invoice.paid_amount,0);incompletePaymentResponse=false;losePaymentResponse=true;await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Keine Verbindung zum Server. Bitte die Verbindung und den gespeicherten Stand prüfen.',{exact:true}).waitFor();assert.equal(invoice.paid_amount,1000,'The server committed although its response was lost');assert.equal(await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).count(),0,'Lost response is never reported as success');
   await tabs.form.getByRole('button',{name:'Zahlung speichern',exact:true}).click();await tabs.form.getByText('Zahlung gespeichert.',{exact:true}).waitFor();assert.equal(dataPaymentPosts,initialPosts+4);assert.equal(invoice.paid_amount,1000,'Retry replays the original request without a second payment');assert.equal(collections.payments.filter(row=>row.id==='foundation-payment').length,1);
   for(const [name,value] of [['detail',/1[’']561\.97/],['list',/1[’']561\.97/],['customer',/1[’']561\.97/],['finance',/1[’']561\.97/],['payments',/1[’']000\.00/],['dashboard',/1[’']120\.00/],['customerOverview',/1[’']000\.00/],['activity','Zahlung erhalten']]){
    await tabs[name].waitForFunction(()=>window.v215ConsumerChanges.some(message=>message.domains?.includes('payments')),undefined,{polling:100});await tabs[name].bringToFront();await tabs[name].getByText(value,{exact:typeof value==='string'}).first().waitFor();assert.equal(await tabs[name].evaluate(()=>window.v215ConsumerMarker),'same-document',name+' updates without a reload');
   }
   for(const [name,amount] of [['dashboard',"CHF 1'120.00"],['finance',"CHF 1'120.00"],['customerOverview',"CHF 1'000.00"]]){
    await tabs[name].bringToFront();assert.equal((await tabs[name].locator('.bo-statistics dd').first().textContent())?.replaceAll('’',"'"),amount,name+' cash/statistic totals refresh from the same confirmed ledger');
   }
   for(const tab of Object.values(tabs))await tab.close();dataPaymentMode=false;Object.assign(invoice,priorInvoice);summary.invoices[0].open_amount=priorOpenAmount;collections.payments=collections.payments.filter(row=>row.id!=='foundation-payment');collections.customers=collections.customers.filter(row=>row.id!=='customer-two');Object.assign(customer,priorCustomer);
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
 console.log(`UX browser checks passed: ${results.length} route/theme/viewport combinations ; interactions: ${process.env.BINSO_UX_MATRIX_ONLY==="1"?"matrix only":requestedInteractions.join(",")}. Artifacts: ${output}`);
}finally{await context?.close();await browser?.close();server?.kill();}
