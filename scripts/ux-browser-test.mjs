import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import PDFDocument from 'pdfkit';
import {pathToFileURL} from 'node:url';

// Synthetic UI fixtures: real business/RLS integration is covered by migration-test.mjs.
// No request reaches a production system; unhandled fixture APIs fail closed.
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser';
await fs.mkdir(output,{recursive:true});
const port=process.env.BINSO_UX_PORT??'3200';
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:'+port;
let server;
if(!process.env.BINSO_BASE_URL){
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe']});
  let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
  for(let attempt=0;;attempt++){
    try{if((await fetch(base+'/api/health')).ok)break;}catch{}
    if(attempt>=60||server.exitCode!==null){server.kill();throw new Error('Test server unavailable: '+logs);}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
}
const browserType=engines[process.env.BINSO_UX_BROWSER??"chromium"];
const browser=await browserType.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--single-process']}: {})});
const customer={id:'customer-one',name:'Prüffirma AG',city:'Bern',status:'active',contact_name:'Test Person',email:'test@example.invalid',street:'Teststrasse 1',postal_code:'3000'};
const product={id:'product-one',name:'Beratung',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'};
const employee={id:'employee-one',first_name:'Test',last_name:'Person',job_title:'ICT',workload_percent:80,weekly_hours:42,status:'active'};
const expense={id:'expense-one',merchant:'SBB',amount:89,currency:'CHF',expense_date:'2026-10-08',status:'submitted',employee_id:employee.id,employee};
const invoice={id:'invoice-one',number:'RE-TEST-1',kind:'invoice',customer_id:customer.id,customer,total:135.13,subtotal:125,vat:10.13,paid_amount:100,currency:'CHF',issue_date:'2026-10-08',due_date:'2026-11-08',status:'sent',items:[{description:'Beratung',quantity:1,unit:'hour',unit_price:125,vat_rate:8.1}]};
const offer={...invoice,id:'offer-one',kind:'offer',number:'AN-TEST-1',status:'sent'};
const payment={id:'payment-one',amount:135.13,currency:'CHF',paid_on:'2026-10-08',method:'bank',status:'booked',customer_id:customer.id,customer,invoice};
const ticket={id:'ticket-one',case_number:'T-TEST-1',subject:'Testanfrage',status:'open',priority:'normal',created_at:'2026-10-08T10:00:00Z'};
const collections={customers:[customer],products:[product],employees:[employee],expenses:[expense],payments:[payment],documents:[invoice,offer],projects:[],time_entries:[]};
const summary={invoices:[],offers:{draft_count:0,sent_count:0,accepted_count:0},time:{ready_hours:0,unapproved_hours:0},expenses:{ready_amount:0}};
const fixturePdf=process.env.BINSO_UX_PDF_FILE?await fs.readFile(process.env.BINSO_UX_PDF_FILE):await new Promise(resolve=>{const doc=new PDFDocument({size:'A4'}),chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.text('Invoice fixture page one');doc.addPage().text('Payment fixture page two');doc.end()});
const results=[];const errors=[];let failMutation=false,posts=0,failLedger=false,failSend=false,messagePosts=0,uploads=0,employeeLedgerFixture=false,releaseReceiptScan;
let context;
try{
 for(const theme of (process.env.BINSO_UX_THEMES?.split(",")??["light","dark"])){
  context=await browser.newContext({...(process.env.BINSO_UX_DEVICE?engines.devices[process.env.BINSO_UX_DEVICE]:{}),viewport:{width:1440,height:1000},colorScheme:"dark",serviceWorkers:"block"});
  await context.addCookies([{name:'binso_demo',value:'1',url:base},{name:'binso_operator_demo',value:'1',url:base}]);
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-08'}))},theme);
  await context.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   if(req.method()!=='GET'){
    if(p==='/api/documents/preview')return route.fulfill({body:fixturePdf,contentType:'application/pdf'});
    if(p==='/api/demo/session')return route.fulfill({json:{ok:true,databaseBacked:true,expiresIn:86400}});
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
   else if(p==='/api/time-entries')data={items:url.searchParams.has('employeeId')?(employeeLedgerFixture?[{id:'employee-time',description:'Modern Workplace',project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T09:00:00Z',approved:true,billable:true}]:[]):[{id:'time-one',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'time-two',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:45,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true}]};
   else if(p.endsWith('/pdf'))return route.fulfill({contentType:'application/pdf',body:fixturePdf});
   else if(p==='/api/customers/customer-one/contacts'||p==='/api/customers/customer-one/activity')data={items:[]};
   else if(p==='/api/customers/customer-one/documents')data={items:[invoice,offer]};
   else {
    const [,,collection,id]=p.split('/');const rows=collections[collection];
    if(rows)data=id?{item:rows.find(item=>item.id===id||item.number===id)}:{items:rows};
   }
   if(failLedger&&url.searchParams.has('employeeId'))return route.fulfill({status:503,json:{message:'Fixture ledger unavailable'}});
   return route.fulfill({status:data?200:503,json:data??{message:'UI fixture unavailable'}});
  });
  const page=await context.newPage();page.on('pageerror',error=>{if(process.env.BINSO_UX_DEBUG)console.log('PAGE ERROR',error.stack);errors.push(page.url()+': '+error.message)});if(process.env.BINSO_UX_DEBUG)page.on('requestfailed',req=>console.log('FAILED REQUEST',req.url(),req.failure()));
  const routes=['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login','/operator','/operator/kunden','/operator/tickets','/operator/monitoring','/operator/zahlungen','/operator/sicherheit','/operator/audit','/kunden','/produkte','/mitarbeiter','/spesen','/zahlungen','/angebote','/rechnungen','/finanzen','/finanzen/analyse','/support','/zeit','/einstellungen','/einstellungen/darstellung','/kunden/customer-one','/produkte/product-one','/mitarbeiter/employee-one','/spesen/expense-one','/zahlungen/payment-one','/rechnungen/RE-TEST-1','/angebote/AN-TEST-1','/support/ticket-one','/produkte/neu','/mitarbeiter/neu','/spesen/neu','/projekte/neu','/kunden/neu','/rechnungen/neu','/angebote/neu','/zahlungen/neu','/support/neu'];
  await Promise.all((process.env.BINSO_UX_WIDTHS?.split(",").map(Number)??[1440,1024,820,430,375]).map(async width=>{
   const page=await context.newPage();page.on("pageerror",error=>errors.push(page.url()+": "+error.message));
   await page.setViewportSize({width,height:1000});
   console.log(`Checking ${theme} ${width}px`);
   for(const route of (process.env.BINSO_UX_ROUTES?.split(",")??routes)){
    console.log(`Route ${route}`);await page.waitForLoadState("networkidle");await page.goto(base+route);await page.waitForLoadState('networkidle');await page.locator('.app-session-loading').waitFor({state:'hidden'});
    await page.locator('h1').filter({visible:true}).first().waitFor({state:'visible'});
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,`${route}: explicit theme must override system dark mode`);
    const geometry=await page.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80),parent:el.parentElement?.className,right:el.getBoundingClientRect().right})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,sort:[...document.querySelectorAll('.toolbar .filter-button')].map(el=>el.getBoundingClientRect().width),metricDividers:[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>getComputedStyle(el).borderLeftWidth)}));
    if(geometry.scroll>width+1||geometry.body>width+1){console.log('Overflow details',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+2).slice(0,30).map(el=>({tag:el.tagName,cls:el.className,width:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX,children:[...el.children].map(c=>({tag:c.tagName,width:c.clientWidth,scroll:c.scrollWidth,rect:c.getBoundingClientRect().width,min:getComputedStyle(c).minWidth,grid:getComputedStyle(el).gridTemplateColumns})),rect:JSON.stringify(el.getBoundingClientRect())}))),null,2));await page.screenshot({animations:'disabled',path:path.join(output,`${theme}-${width}-overflow.png`)});}
    assert.ok(geometry.scroll<=width+1&&geometry.body<=width+1,`${theme} ${width} ${route}: horizontal overflow ${JSON.stringify(geometry)}`);
    assert.ok(geometry.sort.every(size=>size<=44),`${route}: sorting control is too wide`);
    assert.ok(geometry.metricDividers.every(size=>parseFloat(size)===0),`${route}: metric dividers`);
    if(route.endsWith('/neu')&&await page.locator('.mobile-sticky-save').count()){assert.equal(await page.locator('.mobile-sticky-save .button-primary').filter({visible:true}).count(),1,`${route}: form footer action must be reachable`);assert.equal(await page.locator('.page-head .page-actions .button-primary,.mobile-detail-actions .button-primary').filter({visible:true}).count(),0,`${route}: duplicate header save`);}
    if(width<=760&&!route.endsWith('/neu')&&!['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login'].includes(route)&&!route.startsWith('/operator'))assert.equal(await page.locator('nav.bottom-nav').isVisible(),true,`${route}: bottom navigation hidden`);
    assert.deepEqual(errors,[],'Browser runtime errors');
    results.push({theme,width,route,passed:true});
    if([1440,430].includes(width)&&['/produkte','/produkte/product-one','/spesen/expense-one','/support','/finanzen','/zeit','/finanzen/analyse','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu'].includes(route))await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}.png`),fullPage:true});
   }
   await page.close();
  }));
  if(process.env.BINSO_UX_MATRIX_ONLY==="1"){await context.close();context=null;continue;}
  await page.setViewportSize({width:430,height:900});
  if(process.env.BINSO_UX_DEBUG)page.on('response',async response=>{if(response.url().includes('/api/auth/session'))console.log('Session fixture response',response.status(),await response.text())});
  await page.waitForLoadState("networkidle");await page.goto(base+'/projekte/neu');await page.waitForLoadState('networkidle');try{await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).waitFor()}catch(error){console.log('Project diagnostics',page.url(),await page.locator('body').innerText(),errors);await page.screenshot({animations:'disabled',path:path.join(output,'project-error.png')});throw error;}
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),0,'Project creation has no competing save action');
  assert.equal(await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).count(),1);
  await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),1,'Employee creation has one primary action');
  await page.locator('.mobile-sticky-save').scrollIntoViewIfNeeded();
  const employeeSave=await page.locator('.mobile-sticky-save').boundingBox(),lastField=await page.getByText('Ferientage / Jahr',{exact:true}).boundingBox();
  assert.ok(employeeSave.y>lastField.y,'Save follows all employee fields rather than floating between them');
  for(const height of [568,400]){
    await page.setViewportSize({width:375,height});await page.waitForLoadState("networkidle");await page.goto(base+'/zeit');await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('button',{name:'Zeitfilter',exact:true}).count(),0,'Timer hides entry-only filters');
    await page.getByRole('button',{name:'Manuell erfassen',exact:true}).filter({visible:true}).click();
    const manual=page.getByRole('dialog',{name:'Zeit manuell erfassen'});await manual.waitFor();await manual.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})))});
    await manual.getByLabel('Beschreibung',{exact:true}).focus();
    const geometry=await manual.evaluate(el=>{const header=el.querySelector('.sheet-header').getBoundingClientRect(),footer=el.querySelector('.filter-sheet-actions').getBoundingClientRect();return {headerTop:header.top,footerBottom:footer.bottom,width:document.documentElement.scrollWidth,height:innerHeight}});
    if(!(geometry.headerTop>=0&&geometry.footerBottom<=geometry.height+1&&geometry.width<=375)){console.log('Sheet geometry',geometry);await page.screenshot({animations:'disabled',path:path.join(output,'sheet-error.png')});}
    assert.ok(geometry.headerTop>=0&&geometry.footerBottom<=geometry.height+1&&geometry.width<=375,'Short viewport keeps sheet header/actions visible without page overflow');
    await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-375-${height}-manual-time.png`)});
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:430,height:900});
  await page.waitForLoadState("networkidle");await page.goto(base+'/finanzen');await page.waitForLoadState('networkidle');
  await page.locator('.finance-open-invoices').getByText('CHF 35.13',{exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.locator('.bo-metric-tiles .metric').count(),4,'Finance has exactly four compact metrics');
  await page.getByRole('button',{name:'Finanzfilter',exact:true}).click();
  await page.getByRole('dialog',{name:'Finanzfilter'}).waitFor();await page.keyboard.press('Escape');
  await page.waitForLoadState("networkidle");await page.goto(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
  const group=page.locator('details.time-group').first();await group.waitFor();
  assert.equal(await group.locator('summary strong').textContent(),'2:15','Grouped duration uses exact minutes');
  assert.equal(await group.getAttribute('open'),null,'Entry groups start collapsed');
  await group.locator('summary').click();await group.locator('.time-entry-list').waitFor();
  assert.equal(await group.locator('.time-entry-list>div').count(),2,'Expansion shows both entries');
  const searchRect=await page.locator('.time-filter-toolbar .searchbox').boundingBox(),filterRect=await page.getByRole('button',{name:'Zeitfilter'}).boundingBox();
  assert.ok(filterRect.x>searchRect.x&&Math.abs(filterRect.y-searchRect.y)<5,'Mobile filter follows search on the same row');
  await page.waitForLoadState("networkidle");await page.goto(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
  await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Vorschau',exact:true}).click();
  const expectedPdfPages=Number(process.env.BINSO_UX_PDF_PAGES||2);
  try{await page.locator('.pdf-page canvas').nth(expectedPdfPages-1).waitFor()}catch(error){console.log('PDF dialog diagnostics',await page.getByRole('dialog').innerText());await page.screenshot({animations:"disabled",path:path.join(output,'pdf-error.png')});throw error;}
  await page.waitForFunction(()=>[...document.querySelectorAll('.pdf-page canvas')].every(canvas=>canvas.width>300&&canvas.height>400));
  assert.equal(await page.locator('.pdf-page').count(),expectedPdfPages,'Actual generated PDF renders every page');
  await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-430-pdf-preview.png`),fullPage:true});
  await page.getByRole('button',{name:'Vorschau vergrössern',exact:true}).click();
  const zoom=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,document:document.querySelector('.document-modal-body').scrollWidth}));
  assert.ok(zoom.page<=zoom.viewport+1&&zoom.document>zoom.viewport,'Zoom scrolls only inside the document area');
  await page.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  employeeLedgerFixture=true;
  await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Übersicht',exact:true}).waitFor();
  const header=page.locator('.mobile-header');assert.equal(await header.locator('.status').count(),1,'Employee status appears beside the name once');
  await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();await page.getByText('7:30 h',{exact:true}).waitFor();
  await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-430-employee-time.png`),fullPage:true});
  await page.getByRole('tab',{name:'Spesen',exact:true}).click();await page.locator('.employee-tab-panel a[href="/spesen/expense-one"]').waitFor();
  await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-430-employee-expenses.png`),fullPage:true});
  await page.getByRole('tab',{name:'Dokumente',exact:true}).click();await page.getByText('Noch keine Dokumente für diesen Mitarbeiter hinterlegt.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Dokument hinzufügen',exact:true}).waitFor();
  await page.screenshot({animations:"disabled",path:path.join(output,`${theme}-430-employee-documents.png`),fullPage:true});
  employeeLedgerFixture=false;
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte');await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{localStorage.removeItem('binso.demo.session');localStorage.removeItem('binso.demo.database')});
  await page.setViewportSize({width:430,height:900});
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte');await page.waitForLoadState('networkidle');await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('not-present');
  await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('Beratung');
  await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte/product-one');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();
  const dialog=page.getByRole('dialog',{name:'Produktaktionen'});await dialog.waitFor();
  assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Opening the sheet moves focus inside');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Produktaktionen','Sheet restores trigger focus');
  await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();await page.getByRole('dialog',{name:'Produktaktionen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();await page.getByLabel('Verkaufspreis',{exact:true}).fill('130');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).first().click();await page.waitForURL(base+'/produkte');await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();await page.waitForTimeout(750);await page.waitForLoadState('networkidle');
  // SPA navigation does not reset Playwright's load state. Allow the destination
  // fixtures and idle link prefetch to settle before the next hard navigation.
  failMutation=true;posts=0;uploads=0;
  await page.waitForLoadState("networkidle");await page.goto(base+'/spesen/neu');await page.waitForLoadState('networkidle');await page.getByLabel('Händler / Firma',{exact:true}).fill('SBB');await page.getByLabel('Betrag',{exact:true}).fill('89');
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
  failLedger=true;await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();
  await page.getByText('Fixture ledger unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).count(),0,'Failed ledger must not look empty');failLedger=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).waitFor();
  failSend=true;messagePosts=0;await page.waitForLoadState("networkidle");await page.goto(base+'/support/ticket-one');await page.waitForLoadState('networkidle');await page.getByLabel('Nachricht',{exact:true}).fill('Test message');await page.getByRole('button',{name:'Senden',exact:true}).dblclick();await page.getByText('Fixture message offline',{exact:true}).waitFor();assert.equal(messagePosts,1);assert.equal(await page.getByLabel('Nachricht',{exact:true}).inputValue(),'Test message');failSend=false;await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Test message',{exact:true}).waitFor();assert.equal(messagePosts,2);
  assert.deepEqual(errors,[],'Browser runtime errors');
  await context.close();context=null;
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({browser:process.env.BINSO_UX_BROWSER??'chromium',device:process.env.BINSO_UX_DEVICE??'responsive viewport',scope:'Synthetic API UI fixtures; no production writes',results,errors},null,2));
 console.log(`UX browser checks passed: ${results.length} route/theme/viewport combinations plus search, action sheet focus/Escape, failed save/retry/double click and ledger failures. Artifacts: ${output}`);
}finally{await context?.close();await browser.close();server?.kill();}
