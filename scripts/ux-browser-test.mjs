import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// Synthetic UI fixtures: real business/RLS integration is covered by migration-test.mjs.
// No request reaches a production system; unhandled fixture APIs fail closed.
const {chromium}=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser';
await fs.mkdir(output,{recursive:true});
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:3200';
let server;
if(!process.env.BINSO_BASE_URL){
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3200'],{stdio:['ignore','pipe','pipe']});
  let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
  for(let attempt=0;;attempt++){
    try{if((await fetch(base+'/api/health')).ok)break;}catch{}
    if(attempt>=60||server.exitCode!==null){server.kill();throw new Error('Test server unavailable: '+logs);}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
}
const browser=await chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--single-process']}: {})});
const customer={id:'customer-one',name:'Prüffirma AG',city:'Bern',status:'active',contact_name:'Test Person',email:'test@example.invalid',street:'Teststrasse 1',postal_code:'3000'};
const product={id:'product-one',name:'Beratung',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'};
const employee={id:'employee-one',first_name:'Test',last_name:'Person',job_title:'ICT',workload_percent:80,weekly_hours:42,status:'active'};
const expense={id:'expense-one',merchant:'SBB',amount:89,currency:'CHF',expense_date:'2026-10-08',status:'submitted',employee_id:employee.id,employee};
const invoice={id:'invoice-one',number:'RE-TEST-1',kind:'invoice',customer_id:customer.id,customer,total:135.13,subtotal:125,vat:10.13,paid_amount:0,currency:'CHF',issue_date:'2026-10-08',due_date:'2026-11-08',status:'sent',items:[{description:'Beratung',quantity:1,unit:'hour',unit_price:125,vat_rate:8.1}]};
const offer={...invoice,id:'offer-one',kind:'offer',number:'AN-TEST-1',status:'sent'};
const payment={id:'payment-one',amount:135.13,currency:'CHF',paid_on:'2026-10-08',method:'bank',status:'booked',customer_id:customer.id,customer,invoice};
const ticket={id:'ticket-one',case_number:'T-TEST-1',subject:'Testanfrage',status:'open',priority:'normal',created_at:'2026-10-08T10:00:00Z'};
const collections={customers:[customer],products:[product],employees:[employee],expenses:[expense],payments:[payment],documents:[invoice,offer],projects:[],time_entries:[]};
const summary={invoices:[],offers:{draft_count:0,sent_count:0,accepted_count:0},time:{ready_hours:0,unapproved_hours:0},expenses:{ready_amount:0}};
const results=[];const errors=[];let failMutation=false,posts=0,failLedger=false,failSend=false,messagePosts=0,uploads=0,releaseReceiptScan;
let context;
try{
 for(const theme of (process.env.BINSO_UX_THEMES?.split(",")??["light","dark"])){
  context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:"dark"});
  await context.addCookies([{name:'binso_demo',value:'1',url:base},{name:'binso_operator_demo',value:'1',url:base}]);
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-08'}))},theme);
  await context.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(req.method()!=='GET'){
    if(p==='/api/expenses'){posts++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:failMutation?503:200,json:failMutation?{message:'Fixture offline'}:{item:{...expense,id:'new-expense'}}});}
    if(p==='/api/support/tickets/ticket-one/messages'){messagePosts++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:failSend?503:200,json:failSend?{message:'Fixture message offline'}:{item:{id:'sent-'+messagePosts,author_type:'customer',body:JSON.parse(req.postData()).body,created_at:'2026-10-08T10:00:00Z'}}});}
    if(p==='/api/expenses/scan-receipt'){await new Promise(resolve=>{releaseReceiptScan=resolve});return route.fulfill({json:{merchant:'SBB',total:89,currency:'CHF',date:'2026-10-08',confidence:0.95}});}
    if(p==='/api/files'){uploads++;return route.fulfill({json:{item:{id:'receipt-one'}}});}
    if(p==='/api/auth/logout')return route.fulfill({json:{ok:true}});
    return route.fulfill({json:{ok:true,item:product,items:[],tracker:null}});
   }
   let data;
   if(p==='/api/auth/session')data={authenticated:true,tenant:{id:'fixture-tenant',role:'owner',plan:'pro',readOnly:false}};
   else if(p==='/api/time-tracker')data={tracker:null};
   else if(p==='/api/settings/profile')data={profile:{name:'Test Person',theme_mode:theme,email:'test@example.invalid'}};
   else if(p==='/api/settings/organization')data={organization:{name:customer.name,city:'Bern',country:'CH'}};
   else if(p==='/api/finance/overview')data=summary;
   else if(p==='/api/finance')data={payments:[],expenses:[],payroll:[],operatingCosts:[]};
   else if(p==='/api/demo/data')data={items:collections[url.searchParams.get('collection')]??[]};
   else if(p==='/api/dashboard')data={invoices:[],offers:[],payments:[],expenses:[],activities:[],stats:{}};
   else if(p==='/api/support/tickets')data={items:[ticket]};
   else if(p==='/api/support/tickets/ticket-one/messages')data={items:[{id:'message-one',author_type:'customer',body:'Testnachricht',created_at:'2026-10-08T10:00:00Z'}]};
   else if(p==='/api/expenses/options')data={items:[employee]};
   else if(p==='/api/files')data={items:[]};
   else if(p==='/api/time-entries')data={items:[]};
   else if(p==='/api/customers/customer-one/contacts'||p==='/api/customers/customer-one/activity')data={items:[]};
   else if(p==='/api/customers/customer-one/documents')data={items:[invoice,offer]};
   else {
    const [,,collection,id]=p.split('/');const rows=collections[collection];
    if(rows)data=id?{item:rows.find(item=>item.id===id||item.number===id)}:{items:rows};
   }
   if(failLedger&&url.searchParams.has('employeeId'))return route.fulfill({status:503,json:{message:'Fixture ledger unavailable'}});
   return route.fulfill({status:data?200:503,json:data??{message:'UI fixture unavailable'}});
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(page.url()+': '+error.message));
  const routes=['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login','/operator','/operator/kunden','/operator/tickets','/operator/monitoring','/operator/zahlungen','/operator/sicherheit','/operator/audit','/kunden','/produkte','/mitarbeiter','/spesen','/zahlungen','/angebote','/rechnungen','/finanzen','/finanzen/analyse','/support','/zeit','/einstellungen','/einstellungen/darstellung','/kunden/customer-one','/produkte/product-one','/mitarbeiter/employee-one','/spesen/expense-one','/zahlungen/payment-one','/rechnungen/RE-TEST-1','/angebote/AN-TEST-1','/support/ticket-one','/produkte/neu','/mitarbeiter/neu','/spesen/neu','/kunden/neu','/rechnungen/neu','/angebote/neu','/zahlungen/neu','/support/neu'];
  for(const width of (process.env.BINSO_UX_WIDTHS?.split(",").map(Number)??[1440,1024,820,430,375])){
   await page.setViewportSize({width,height:1000});
   console.log(`Checking ${theme} ${width}px`);
   for(const route of (process.env.BINSO_UX_ROUTES?.split(",")??routes)){
    console.log(`Route ${route}`);await page.goto(base+route);await page.waitForLoadState('networkidle');await page.locator('.app-session-loading').waitFor({state:'hidden'});
    await page.locator('h1').filter({visible:true}).first().waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,`${route}: explicit theme must override system dark mode`);
    const geometry=await page.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80),parent:el.parentElement?.className,right:el.getBoundingClientRect().right})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,sort:[...document.querySelectorAll('.toolbar .filter-button')].map(el=>el.getBoundingClientRect().width),metricDividers:[...document.querySelectorAll('.metric')].map(el=>getComputedStyle(el).borderLeftWidth)}));
    assert.ok(geometry.scroll<=width+1&&geometry.body<=width+1,`${theme} ${width} ${route}: horizontal overflow ${JSON.stringify(geometry)}`);
    assert.ok(geometry.sort.every(size=>size<=44),`${route}: sorting control is too wide`);
    assert.ok(geometry.metricDividers.every(size=>parseFloat(size)===0),`${route}: metric dividers`);
    if(width<=760&&!route.endsWith('/neu')&&!['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login'].includes(route)&&!route.startsWith('/operator'))assert.equal(await page.locator('nav.bottom-nav').isVisible(),true,`${route}: bottom navigation hidden`);
    results.push({theme,width,route,passed:true});
    if([1440,430].includes(width)&&['/produkte','/produkte/product-one','/spesen/expense-one','/support','/finanzen/analyse'].includes(route))await page.screenshot({path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}.png`),fullPage:true});
   }
  }
  await page.setViewportSize({width:430,height:900});
  await page.goto(base+'/produkte');await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('not-present');
  await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('Beratung');
  await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();
  await page.goto(base+'/produkte/product-one');await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();
  const dialog=page.getByRole('dialog',{name:'Produktaktionen'});await dialog.waitFor();
  assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Opening the sheet moves focus inside');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Produktaktionen','Sheet restores trigger focus');
  await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();await page.getByRole('dialog',{name:'Produktaktionen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();await page.getByLabel('Verkaufspreis',{exact:true}).fill('130');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).first().click();await page.waitForURL(base+'/produkte');
  failMutation=true;posts=0;uploads=0;
  await page.goto(base+'/spesen/neu');await page.getByLabel('Händler / Firma',{exact:true}).fill('SBB');await page.getByLabel('Betrag',{exact:true}).fill('89');
  await page.locator('#expense-receipt-upload').setInputFiles({name:'receipt.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1kAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Einreichen'&&button.disabled));
  assert.equal(await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().isEnabled(),false,'Cannot submit while receipt recognition is running');
  while(!releaseReceiptScan)await new Promise(resolve=>setTimeout(resolve,10));releaseReceiptScan();releaseReceiptScan=undefined;
  await page.getByText(/Erkannt.*Angaben prüfen/).waitFor();
  await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().dblclick();
  await page.getByText('Fixture offline',{exact:true}).waitFor();assert.equal(posts,1,'Two rapid clicks must issue one expense write');
  assert.equal(Number(await page.getByLabel('Betrag',{exact:true}).inputValue()),89,'Failed submission preserves input');
  failMutation=false;await page.getByRole('button',{name:'Einreichen',exact:true}).filter({visible:true}).first().click();
  await page.waitForURL(base+'/spesen');assert.equal(posts,2,'Failed expense write can be retried');assert.equal(uploads,1,'Receipt is uploaded once after a successful expense save');
  failLedger=true;await page.goto(base+'/mitarbeiter/employee-one');await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();
  await page.getByText('Fixture ledger unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).count(),0,'Failed ledger must not look empty');failLedger=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).waitFor();
  failSend=true;messagePosts=0;await page.goto(base+'/support/ticket-one');await page.getByLabel('Nachricht',{exact:true}).fill('Test message');await page.getByRole('button',{name:'Senden',exact:true}).dblclick();await page.getByText('Fixture message offline',{exact:true}).waitFor();assert.equal(messagePosts,1);assert.equal(await page.getByLabel('Nachricht',{exact:true}).inputValue(),'Test message');failSend=false;await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Test message',{exact:true}).waitFor();assert.equal(messagePosts,2);
  assert.deepEqual(errors,[],'Browser runtime errors');
  await context.close();context=null;
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({browser:'Chromium',scope:'Synthetic API UI fixtures; no production writes',results,errors},null,2));
 console.log(`UX browser checks passed: ${results.length} route/theme/viewport combinations plus search, action sheet focus/Escape, failed save/retry/double click and ledger failures. Artifacts: ${output}`);
}finally{await context?.close();await browser.close();server?.kill();}
