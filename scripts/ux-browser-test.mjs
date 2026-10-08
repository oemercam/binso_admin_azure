import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import PDFDocument from 'pdfkit';
import {pathToFileURL} from 'node:url';
import {fullRoutes} from './qa-plan.mjs';

// Synthetic UI fixtures: real business/RLS integration is covered by migration-test.mjs.
// No request reaches a production system; unhandled fixture APIs fail closed.
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser';
await fs.mkdir(output,{recursive:true});
const port=process.env.BINSO_UX_PORT??'3200';
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:'+port;
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
const browserType=engines[process.env.BINSO_UX_BROWSER??"chromium"];
const launchOptions={headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE&&(process.env.BINSO_UX_BROWSER??'chromium')==='chromium'?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--single-process']}: {})};
let browser;
const customer={id:'customer-one',name:'Prüffirma AG',city:'Bern',status:'active',contact_name:'Test Person',email:'test@example.invalid',street:'Teststrasse 1',postal_code:'3000'};
const product={id:'product-one',name:'Beratung',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'};
const employee={id:'employee-one',first_name:'Test',last_name:'Person',email:'mitarbeiterin.mit.langem.namen@internationales-unternehmen.example.invalid',start_date:'2025-01-01',job_title:'ICT',workload_percent:80,weekly_hours:42,status:'active'};
const expense={id:'expense-one',merchant:'SBB',amount:89,currency:'CHF',expense_date:'2026-10-08',status:'submitted',employee_id:employee.id,employee};
const invoice={id:'invoice-one',number:'RE-TEST-1',kind:'invoice',customer_id:customer.id,customer,total:135.13,subtotal:125,vat:10.13,paid_amount:100,currency:'CHF',issue_date:'2026-10-08',due_date:'2026-11-08',status:'sent',items:[{description:'Beratung',quantity:1,unit:'hour',unit_price:125,vat_rate:8.1}]};
const offer={...invoice,id:'offer-one',kind:'offer',number:'AN-TEST-1',status:'sent'};
const payment={id:'payment-one',amount:135.13,currency:'CHF',paid_on:'2026-10-08',method:'bank',status:'booked',customer_id:customer.id,customer,invoice};
const ticket={id:'ticket-one',case_number:'T-TEST-1',subject:'Testanfrage',status:'open',priority:'normal',created_at:'2026-10-08T10:00:00Z'};
const collections={customers:[customer],products:[product],employees:[employee],expenses:[expense],payments:[payment],documents:[invoice,offer],projects:[],time_entries:[]};
const summary={invoices:[{currency:'CHF',open_amount:35.13,revenue:135.13,open_count:1,overdue_count:0,draft_count:0}],offers:{draft_count:0,sent_count:0,accepted_count:0},time:{hours:2.25,invoiced_hours:0,ready_hours:0,unapproved_hours:0},expenses:{ready_amount:0}};
const fixturePdf=process.env.BINSO_UX_PDF_FILE?await fs.readFile(process.env.BINSO_UX_PDF_FILE):await new Promise(resolve=>{const doc=new PDFDocument({size:'A4'}),chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.text('Invoice fixture page one');doc.addPage().text('Payment fixture page two');doc.end()});
const requestedInteractions=process.env.BINSO_UX_INTERACTIONS?.split(',')??['customers','products','employees','documents','finance','time','expenses','chat'];
const hasInteraction=name=>requestedInteractions.includes(name);
async function capture(page,options){if(process.env.BINSO_UX_SCREENSHOTS!=='0'||/error|overflow/.test(options.path))await page.screenshot(options);}
const results=[];const errors=[];const accessibilityFailures=[];let failMutation=false,posts=0,failLedger=false,failSend=false,messagePosts=0,uploads=0,employeeLedgerFixture=false,groupingFixture=false,releaseReceiptScan;
let policyPosts=0,policyRequired=true,policyRole="owner",policyReadOnly=false,failPolicy=false,teamPosts=0,failTeam=false;
let context;
try{
 for(const theme of (process.env.BINSO_UX_THEMES?.split(",")??["light","dark"])){
  browser=await browserType.launch(launchOptions);
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
    if(p==='/api/settings/team/invitations'||p.startsWith('/api/settings/team/members/')){teamPosts++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill({status:failTeam?503:200,json:failTeam?{message:'Fixture team unavailable'}:{ok:true}});}
    if(p==='/api/time-entries/policy'){policyPosts++;await new Promise(resolve=>setTimeout(resolve,150));if(failPolicy)return route.fulfill({status:503,json:{message:'Fixture policy unavailable'}});policyRequired=JSON.parse(req.postData()).required;return route.fulfill({json:{time_approval_required:policyRequired}});}
    if(p==='/api/auth/logout')return route.fulfill({json:{ok:true}});
    return route.fulfill({json:{ok:true,item:product,items:[],tracker:null}});
   }
   let data;
   if(p==='/api/auth/session')data={authenticated:true,tenant:{id:'fixture-tenant',role:policyRole,plan:'pro',readOnly:policyReadOnly}};
   else if(p==='/api/settings/team/invitations')data={members:[{user_id:'member-one',name:'Team Person',email:'team@example.invalid',role:'member',created_at:'2026-10-08'}],invitations:[],userLimit:10,plan:'pro'};
   else if(p==='/api/notifications')data={items:[],unreadCount:0};
   else if(p==='/api/time-entries/policy')data={time_approval_required:policyRequired};
   else if(p==='/api/time-tracker')data={tracker:null};
   else if(p==='/api/settings/profile')data={profile:{name:'Test Person',theme_mode:theme,email:'test@example.invalid'}};
   else if(p==='/api/settings/organization')data={organization:{name:customer.name,city:'Bern',country:'CH'}};
   else if(p==='/api/finance/overview')data=summary;
   else if(p==='/api/finance')data={payments:[{payment_date:'2026-09-15',amount:120},{payment_date:'2026-10-05',amount:200}],expenses:[{expense_date:'2026-09-15',amount:20},{expense_date:'2026-10-05',amount:50}],payroll:[],operatingCosts:[]};
   else if(p==='/api/demo/data')data={items:(collections[url.searchParams.get('collection')]??[]).filter(item=>!url.searchParams.has('kind')||item.kind===url.searchParams.get('kind'))};
   else if(p==='/api/documents')data={items:collections.documents.filter(item=>!url.searchParams.has('kind')||item.kind===url.searchParams.get('kind'))};
   else if(p==='/api/dashboard'||p==='/api/demo/dashboard')data={invoices:[invoice],payments:[payment],stats:{customer_count:2},analyticsInvoices:[{issue_date:'2026-10-01',total:135.13,invoice_count:1}],analyticsPayments:[{paid_on:'2026-10-01',amount:100}]};
   else if(p==='/api/support/tickets')data={items:[ticket]};
   else if(p==='/api/support/tickets/ticket-one/messages')data={items:Array.from({length:30},(_,i)=>({id:'message-'+i,author_type:i%2?'support':'customer',body:'Testnachricht '+(i+1)+' – Prüfung des scrollbareren Nachrichtenverlaufs.',created_at:'2026-10-08T10:00:00Z'}))};
   else if(p==='/api/expenses/options')data={items:[employee]};
   else if(p==='/api/files')data={items:[]};
   else if(p==='/api/time-entries'&&groupingFixture&&!url.searchParams.has('employeeId'))data={items:[{id:'internal',project_name:'Administration',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:false,approved:true},{id:'group-one',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'group-two',customer_id:customer.id,customer_name:customer.name,project_name:'Managed IT Services',duration_minutes:750,started_at:'2026-10-08T10:00:00Z',billable:true,approved:true},{id:'other-customer',customer_id:'customer-two',customer_name:'Alpin Systems AG',project_name:'Managed IT Services',duration_minutes:405,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true},{id:'other-project',customer_id:customer.id,customer_name:customer.name,project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T12:00:00Z',billable:true,approved:true,invoiced_invoice_id:'already-invoiced'}]};
   else if(p==='/api/time-entries')data={items:url.searchParams.has('employeeId')?(employeeLedgerFixture?[{id:'employee-time',description:'Modern Workplace',project_name:'Modern Workplace',duration_minutes:450,started_at:'2026-10-08T09:00:00Z',approved:true,billable:true}]:[]):[{id:'time-one',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:90,started_at:'2026-10-08T09:00:00Z',billable:true,approved:true},{id:'time-two',customer_id:customer.id,customer_name:customer.name,project_name:'Projektprüfung',employee_name:'Test Person',duration_minutes:45,started_at:'2026-10-08T11:00:00Z',billable:true,approved:true}]};
   else if(p.endsWith('/pdf'))return route.fulfill({contentType:'application/pdf',body:fixturePdf});
   else if(p==='/api/customers/customer-one/contacts')data={items:[{id:'contact-one',first_name:'Alex',last_name:'Muster',job_title:'Projektleitung',email:'alex.muster@internationales-unternehmen.example.invalid',phone:'+41315551020',is_primary:true}]};
   else if(p==='/api/customers/customer-one/activity')data={items:[]};
   else if(p==='/api/customers/customer-one/documents')data={items:[invoice,offer]};
   else {
    const [,,collection,id]=p.split('/');const rows=collections[collection];
    if(rows)data=id?{item:rows.find(item=>item.id===id||item.number===id)}:{items:rows};
   }
   if(failLedger&&url.searchParams.has('employeeId'))return route.fulfill({status:503,json:{message:'Fixture ledger unavailable'}});
   return route.fulfill({status:data?200:503,json:data??{message:'UI fixture unavailable'}});
  });
  const page=await context.newPage();page.on('pageerror',error=>{if(process.env.BINSO_UX_DEBUG)console.log('PAGE ERROR',error.stack);errors.push(page.url()+': '+error.message)});if(process.env.BINSO_UX_DEBUG)page.on('requestfailed',req=>console.log('FAILED REQUEST',req.url(),req.failure()));
  const routes=fullRoutes;
  await Promise.all((process.env.BINSO_UX_WIDTHS?.split(",").map(Number)??[1440,1024,820,430,375]).map(async width=>{
   console.log(`Checking ${theme} ${width}px`);
   for(const route of (process.env.BINSO_UX_ROUTES?.split(",")??routes)){
    // Independent route cases must not abort the preceding page’s delayed RSC prefetch.
    // Interaction scenarios below still exercise navigation in a persistent page.
    const page=await context.newPage();page.on("pageerror",error=>errors.push(page.url()+": "+error.message));
    await page.setViewportSize({width,height:1000});
    console.log(`Route ${route}`);await page.goto(base+route);await page.waitForLoadState('networkidle');await page.locator('.app-session-loading').waitFor({state:'hidden'});
    try{await page.locator('h1').filter({visible:true}).first().waitFor({state:'visible'});}catch(error){console.log('Route render failure',route,width,errors,(await page.locator('body').innerText()).slice(0,5000));await capture(page,{path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-render-error.png`)});throw error;}
    assert.equal(await page.locator('html').getAttribute('data-theme'),theme,`${route}: explicit theme must override system dark mode`);
    const geometry=await page.evaluate(()=>({overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,80),parent:el.parentElement?.className,right:el.getBoundingClientRect().right})),viewport:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,sort:[...document.querySelectorAll('.toolbar .filter-button')].map(el=>el.getBoundingClientRect().width),metricDividers:[...document.querySelectorAll('.metric,.finance-flow-primary,.finance-flow-result,.finance-flow-costs,.finance-flow-costs>div')].map(el=>getComputedStyle(el).borderLeftWidth)}));
    if(geometry.scroll>width+1||geometry.body>width+1){console.log('Overflow details',JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+2).slice(0,30).map(el=>({tag:el.tagName,cls:el.className,width:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX,children:[...el.children].map(c=>({tag:c.tagName,width:c.clientWidth,scroll:c.scrollWidth,rect:c.getBoundingClientRect().width,min:getComputedStyle(c).minWidth,grid:getComputedStyle(el).gridTemplateColumns})),rect:JSON.stringify(el.getBoundingClientRect())}))),null,2));await capture(page,{animations:'disabled',path:path.join(output,`${theme}-${width}-overflow.png`)});}
    assert.ok(geometry.scroll<=width+1&&geometry.body<=width+1,`${theme} ${width} ${route}: horizontal overflow ${JSON.stringify(geometry)}`);
    assert.ok(geometry.sort.every(size=>size<=44),`${route}: sorting control is too wide`);
    assert.ok(geometry.metricDividers.every(size=>parseFloat(size)===0),`${route}: metric dividers`);
    if(!process.env.BINSO_UX_BASELINE&&width<=760){for(const toolbar of await page.locator('.toolbar:has(.searchbox):has(.filter-button)').all()){const search=await toolbar.locator('.searchbox').boundingBox(),filter=await toolbar.locator('.filter-button').boundingBox(),tabs=await toolbar.locator('.chips').boundingBox();assert.ok(filter.x>search.x&&Math.abs(filter.y-search.y)<2&&Math.abs(filter.height-search.height)<2,'Search and filter share a row and height');assert.ok(!tabs||tabs.y>=search.y+search.height,'Status tabs occupy their own row')}}
    if(!process.env.BINSO_UX_BASELINE&&width<=760&&await page.locator('.app-shell').count()&&!route.startsWith('/operator')&&!route.startsWith('/support/')){
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const header=await page.locator('.mobile-header').boundingBox();assert.ok(header&&header.y>=-1&&header.y<=1,`${route}: primary header stays visible while scrolling`);
      await page.evaluate(()=>{window.scrollTo(0,0);return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))});
    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/dashboard'){
      assert.equal(await page.locator('.dashboard-summary .metric').count(),4);assert.equal(await page.locator('.dashboard-summary svg').count(),0,'KPIs have no decorative icons');assert.equal(await page.locator('.quick-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=1100?2:4,'Quick actions retain the blueprint grid on narrow screens');
      const order=await page.evaluate(()=>['.dashboard-summary','.quick-section','.revenue-insight','.dashboard-grid'].map(selector=>document.querySelector(selector).getBoundingClientRect().top));assert.ok(order.every((top,i)=>i===0||top>order[i-1]),'Dashboard follows the blueprint hierarchy');
      assert.equal(await page.locator('.bo-metric-tiles').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=760?2:4);
    }
    if(!process.env.BINSO_UX_BASELINE&&route==='/finanzen'){assert.equal(await page.locator('.finance-overview-chart button').count(),3);assert.ok(await page.locator('.finance-overview-chart .finance-bar-pair i').evaluateAll(elements=>elements.some(el=>el.getBoundingClientRect().height>20)),'Real finance values produce visible bars');}
    if(!process.env.BINSO_UX_BASELINE&&route==='/mitarbeiter/employee-one'){await page.getByRole('heading',{name:'Mitarbeiterdetails',exact:true}).waitFor();await page.getByText(employee.email,{exact:true}).waitFor()}
    if(!process.env.BINSO_UX_BASELINE&&route==='/support/ticket-one'){
      const before=await page.locator('.thread-composer').boundingBox();await page.locator('.thread-messages').evaluate(el=>{el.scrollTop=0});const after=await page.locator('.thread-composer').boundingBox();assert.deepEqual(after,before,'Only messages scroll; composer stays fixed');
      const visible=await page.evaluate(()=>{const composer=document.querySelector('.thread-composer').getBoundingClientRect();return composer.bottom<=innerHeight&&composer.top>=0&&scrollY===0});assert.ok(visible,'Chat input stays inside the viewport');
    }
    if(route.endsWith('/neu')&&await page.locator('.mobile-sticky-save').count()){assert.equal(await page.locator('.mobile-sticky-save .button-primary').filter({visible:true}).count(),1,`${route}: form footer action must be reachable`);assert.equal(await page.locator('.page-head .page-actions .button-primary,.mobile-detail-actions .button-primary').filter({visible:true}).count(),0,`${route}: duplicate header save`);}
    if(width<=760&&!route.endsWith('/neu')&&!['/','/portal','/login','/registrieren','/preise','/produkt','/demo','/operator/login'].includes(route)&&!route.startsWith('/operator'))assert.equal(await page.locator('nav.bottom-nav').isVisible(),true,`${route}: bottom navigation hidden`);
    if(route==='/operator'&&width>=768){for(const title of await page.locator('.operator-insight-grid .compact-list>a>b').all()){const box=await title.boundingBox();assert.ok(box.width>=80,'Admin activity titles have readable width alongside customer and status');}}
    if(route.startsWith('/operator')){const operatorHeader=page.locator('.operator-app-header');if(await operatorHeader.count())assert.equal(await operatorHeader.evaluate(el=>getComputedStyle(el).backdropFilter),'none','Operator header has no blur');}
    if(process.env.BINSO_UX_A11Y==='1'&&[375,1440].includes(width)){
      await page.addScriptTag({path:process.env.BINSO_AXE_MODULE});
      const violations=await page.evaluate(async()=>{const {violations}=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return violations.map(({id,impact,description,nodes})=>({id,impact,description,targets:nodes.map(n=>n.target)}))});
      await fs.writeFile(path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-a11y.json`),JSON.stringify(violations,null,2));
      const blocking=violations.filter(v=>['serious','critical'].includes(v.impact));
      if(blocking.length){accessibilityFailures.push({route,theme,width,violations:blocking});console.log('A11Y',route,JSON.stringify(blocking));}
    }
  assert.deepEqual(errors,[],'Browser runtime errors');
    results.push({theme,width,route,passed:true});
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'&&width<=760&&await page.locator('nav.bottom-nav').isVisible()){const hide=await page.addStyleTag({content:'.page-container{visibility:hidden}'});await page.locator('nav.bottom-nav').screenshot({animations:'disabled',path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}-nav.png`)});await hide.evaluate(el=>el.remove());}
    if(process.env.BINSO_UX_CAPTURE_ALL==='1'||[1440,430].includes(width)&&['/dashboard','/rechnungen','/support/ticket-one','/produkte','/produkte/product-one','/spesen/expense-one','/support','/finanzen','/zeit','/finanzen/analyse','/mitarbeiter/neu','/mitarbeiter/employee-one','/projekte/neu'].includes(route))await capture(page,{animations:"disabled",path:path.join(output,`${theme}-${width}-${route.replaceAll('/','_')}.png`),fullPage:true});
    await page.waitForLoadState("networkidle");
    assert.deepEqual(errors,[],"Browser runtime errors after rendering");
    await page.close();
   }
  }));
  if(process.env.BINSO_UX_MATRIX_ONLY==="1"){await context.close();context=null;await browser.close();browser=null;continue;}
  await page.setViewportSize({width:430,height:900});
  if(process.env.BINSO_UX_DEBUG)page.on('response',async response=>{if(response.url().includes('/api/auth/session'))console.log('Session fixture response',response.status(),await response.text())});
  if(hasInteraction('customers')){
    await page.goto(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
    await page.getByRole('button',{name:'Kundenaktionen',exact:true}).filter({visible:true}).click();
    const actions=page.getByRole('dialog',{name:'Kundenaktionen',exact:true});await actions.waitFor();
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
  await page.waitForLoadState("networkidle");await page.goto(base+'/projekte/neu');await page.waitForLoadState('networkidle');try{await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).waitFor()}catch(error){console.log('Project diagnostics',page.url(),await page.locator('body').innerText(),errors);await capture(page,{animations:'disabled',path:path.join(output,'project-error.png')});throw error;}
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),0,'Project creation has no competing save action');
  assert.equal(await page.getByRole('button',{name:'Auftrag starten',exact:true}).filter({visible:true}).count(),1);
  }
  if(hasInteraction('employees')){
  await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/neu');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).count(),1,'Employee creation has one primary action');
  await page.locator('.mobile-sticky-save').scrollIntoViewIfNeeded();
  const employeeSave=await page.locator('.mobile-sticky-save').boundingBox(),lastField=await page.getByText('Ferientage / Jahr',{exact:true}).boundingBox();
  assert.ok(employeeSave.y>lastField.y,'Save follows all employee fields rather than floating between them');
  }
  if(hasInteraction('time')){
  for(const height of [568,400]){
    await page.setViewportSize({width:375,height});await page.waitForLoadState("networkidle");await page.goto(base+'/zeit');await page.waitForLoadState('networkidle');
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
  await page.waitForLoadState("networkidle");await page.goto(base+'/finanzen');await page.waitForLoadState('networkidle');
  await page.locator('.bo-metric-tiles').getByText('CHF 120.00',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Finanzfilter',exact:true}).click();await page.getByRole('radio',{name:'Dieser Monat',exact:true}).check();await page.keyboard.press('Escape');
  await page.locator('.bo-metric-tiles').getByText('CHF 120.00',{exact:true}).waitFor();
  await page.locator('.bo-metric-tiles').getByText('CHF 35.13',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Finanzfilter',exact:true}).click();await page.getByRole('radio',{name:'Dieser Monat',exact:true}).check();await page.getByRole('button',{name:'Anwenden',exact:true}).click();
  await page.locator('.finance-open-invoices').getByText('CHF 35.13',{exact:true}).filter({visible:true}).waitFor();
  await page.locator('.finance-open-invoices').getByText('Offen',{exact:true}).filter({visible:true}).waitFor();
  await page.locator('.bo-metric-tiles').getByText('CHF 200.00',{exact:true}).waitFor();await page.locator('.bo-metric-tiles').getByText('CHF 35.13',{exact:true}).waitFor();
  assert.equal(await page.locator('.bo-metric-tiles .metric').count(),4,'Finance has exactly four compact metrics');
  await page.getByRole('button',{name:'Finanzfilter',exact:true}).click();
  await page.getByRole('dialog',{name:'Zeitraum auswählen'}).waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-period-sheet.png`)});await page.keyboard.press('Escape');
  }
  if(hasInteraction('time')){
  await page.waitForLoadState("networkidle");await page.goto(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
  const group=page.locator('details.time-group').first();await group.waitFor();
  assert.equal(await group.locator('summary strong').textContent(),'2:15','Grouped duration uses exact minutes');
  assert.equal(await group.getAttribute('open'),null,'Entry groups start collapsed');
  await group.locator('summary').click();await group.locator('.time-entry-list').waitFor();
  assert.equal(await group.locator('.time-entry-list>div').count(),2,'Expansion shows both entries');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-entries.png`),fullPage:true});
  const searchRect=await page.locator('.time-filter-toolbar .searchbox').boundingBox(),filterRect=await page.getByRole('button',{name:'Zeitfilter'}).boundingBox();
  assert.ok(filterRect.x>searchRect.x&&Math.abs(filterRect.y-searchRect.y)<5,'Mobile filter follows search on the same row');
  }
  if(hasInteraction('time')){
   await page.getByRole('button',{name:'Zeitfilter',exact:true}).click();let filter=page.getByRole('dialog',{name:'Zeitfilter',exact:true});await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await page.keyboard.press('Escape');assert.equal(await page.locator('.time-group').count(),1,'Cancelling a filter preserves the applied range');
   await page.getByRole('button',{name:'Zeitfilter',exact:true}).click();filter=page.getByRole('dialog',{name:'Zeitfilter',exact:true});assert.equal(await filter.getByLabel('Von',{exact:true}).inputValue(),'','Discarded range is not applied');await filter.getByLabel('Von',{exact:true}).fill('2099-01-01');await filter.getByRole('button',{name:'Anwenden',exact:true}).click();assert.equal(await page.locator('.time-group').count(),0,'Applying updates the entries');
   policyPosts=0;policyRequired=true;failPolicy=true;await page.goto(base+'/einstellungen/zeiterfassung');await page.waitForLoadState('networkidle');const required=page.getByRole('checkbox',{name:'Freigabe erforderlich'});await required.uncheck();await page.getByRole('button',{name:'Speichern',exact:true}).dblclick();await page.getByRole('alert').filter({hasText:'Fixture policy unavailable'}).waitFor();assert.equal(policyPosts,1,'Policy rejects same-frame duplicate writes');assert.equal(await required.isChecked(),false,'Policy error preserves the chosen value');failPolicy=false;await page.getByRole('button',{name:'Speichern',exact:true}).click();await page.getByText('Zeiterfassungseinstellung gespeichert.',{exact:true}).waitFor();assert.equal(policyRequired,false);await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-time-settings.png`)});
   policyRole='member';await page.goto(base+'/einstellungen/zeiterfassung');await page.waitForLoadState('networkidle');assert.equal(await page.getByRole('checkbox',{name:'Freigabe erforderlich'}).isEnabled(),false);assert.equal(await page.getByRole('button',{name:'Speichern',exact:true}).count(),0,'Member cannot change the organization policy');policyRole='owner';
   await page.goto(base+'/einstellungen/team');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Mitarbeiter einladen',exact:true}).filter({visible:true}).click();const invitation=page.getByRole('dialog',{name:'Einladung',exact:true});await invitation.getByLabel('E-Mail',{exact:true}).fill('invalid');await invitation.getByRole('button',{name:'Einladen',exact:true}).click();assert.equal(teamPosts,0,'Invalid invitations do not write');await invitation.getByLabel('E-Mail',{exact:true}).fill('team@example.invalid');failTeam=true;await invitation.getByRole('button',{name:'Einladen',exact:true}).dblclick();await page.getByText('Fixture team unavailable',{exact:true}).waitFor();assert.equal(teamPosts,1,'Invitation locks duplicate writes');assert.equal(await invitation.getByLabel('E-Mail',{exact:true}).inputValue(),'team@example.invalid');failTeam=false;await invitation.getByRole('button',{name:'Einladen',exact:true}).click();await invitation.waitFor({state:'hidden'});assert.equal(teamPosts,2,'Invitation failure can be retried');
  }
  if(hasInteraction('documents')){
  await page.waitForLoadState("networkidle");await page.goto(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');
  await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).click();
  await page.getByRole('dialog',{name:'Weitere Aktionen'}).getByRole('button',{name:'Vorschau',exact:true}).click();
  const expectedPdfPages=Number(process.env.BINSO_UX_PDF_PAGES||2);
  try{await page.locator('.pdf-page canvas').nth(expectedPdfPages-1).waitFor()}catch(error){console.log('PDF dialog diagnostics',await page.getByRole('dialog').innerText());await capture(page,{animations:"disabled",path:path.join(output,'pdf-error.png')});throw error;}
  await page.waitForFunction(()=>[...document.querySelectorAll('.pdf-page canvas')].every(canvas=>canvas.width>300&&canvas.height>400));
  assert.equal(await page.locator('.pdf-page').count(),expectedPdfPages,'Actual generated PDF renders every page');
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-pdf-preview.png`),fullPage:true});
  await page.getByRole('button',{name:'Vorschau vergrössern',exact:true}).click();
  const zoom=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,document:document.querySelector('.document-modal-body').scrollWidth}));
  assert.ok(zoom.page<=zoom.viewport+1&&zoom.document>zoom.viewport,'Zoom scrolls only inside the document area');
  await page.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  }
  if(hasInteraction('documents')){
   invoice.status='draft';await page.goto(base+'/rechnungen/RE-TEST-1');await page.waitForLoadState('networkidle');assert.equal(await page.getByText('Zahlungsstand',{exact:true}).count(),0,'Draft does not demand payment');await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-draft-invoice.png`)});invoice.status='sent';
  }
  if(hasInteraction('employees')){
  employeeLedgerFixture=true;
  await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Übersicht',exact:true}).waitFor();
  const header=page.locator('.mobile-header');assert.equal(await header.locator('.status').count(),1,'Employee status appears beside the name once');
  await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();await page.getByText('7:30 h',{exact:true}).waitFor();
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-time.png`),fullPage:true});
  await page.getByRole('tab',{name:'Spesen',exact:true}).click();await page.locator('.employee-tab-panel a[href="/spesen/expense-one"]').waitFor();
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-expenses.png`),fullPage:true});
  await page.getByRole('tab',{name:'Dokumente',exact:true}).click();await page.getByText('Noch keine Dokumente für diesen Mitarbeiter hinterlegt.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Dokument hinzufügen',exact:true}).waitFor();
  await capture(page,{animations:"disabled",path:path.join(output,`${theme}-430-employee-documents.png`),fullPage:true});
  employeeLedgerFixture=false;
  }
  if(hasInteraction('products')){
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte');await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{localStorage.removeItem('binso.demo.session');localStorage.removeItem('binso.demo.database')});
  await page.setViewportSize({width:430,height:900});
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte');await page.waitForLoadState('networkidle');await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('not-present');
  await page.getByText('Keine Treffer für diese Suche',{exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Produkte suchen...'}).fill('Beratung');
  await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();
  await page.waitForLoadState("networkidle");await page.goto(base+'/produkte/product-one');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();
  const dialog=page.getByRole('dialog',{name:'Produktaktionen'});await dialog.waitFor();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-430-action-sheet.png`)});
  assert.equal(await dialog.evaluate(el=>el.contains(document.activeElement)),true,'Opening the sheet moves focus inside');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Produktaktionen','Sheet restores trigger focus');
  await page.getByRole('button',{name:'Produktaktionen'}).filter({visible:true}).click();await page.getByRole('dialog',{name:'Produktaktionen'}).getByRole('button',{name:'Bearbeiten',exact:true}).click();await page.getByLabel('Verkaufspreis',{exact:true}).fill('130');await page.getByRole('button',{name:'Speichern',exact:true}).filter({visible:true}).first().click();await page.waitForURL(base+'/produkte');await page.locator('.mobile-record-list').getByText('Beratung',{exact:true}).waitFor();await page.waitForTimeout(750);await page.waitForLoadState('networkidle');
  // SPA navigation does not reset Playwright's load state. Allow the destination
  // fixtures and idle link prefetch to settle before the next hard navigation.
  }
  if(hasInteraction('expenses')){
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
  }
  if(hasInteraction('employees')){
  failLedger=true;await page.waitForLoadState("networkidle");await page.goto(base+'/mitarbeiter/employee-one');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Arbeitszeit',exact:true}).click();
  await page.getByText('Fixture ledger unavailable',{exact:true}).waitFor();assert.equal(await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).count(),0,'Failed ledger must not look empty');failLedger=false;
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Arbeitszeiten erfasst',{exact:true}).waitFor();
  }
  if(hasInteraction('chat')){
  await page.setViewportSize({width:375,height:400});await page.waitForLoadState('networkidle');await page.goto(base+'/support/ticket-one');await page.waitForLoadState('networkidle');
  await page.getByLabel('Nachricht',{exact:true}).focus();const composer=await page.locator('.thread-composer').boundingBox(),chatHeader=await page.locator('.mobile-header').boundingBox();assert.ok(composer.y>=chatHeader.y+chatHeader.height&&composer.y+composer.height<=400,'Short chat viewport retains header and input');
  await capture(page,{animations:'disabled',path:path.join(output,`${theme}-375-400-chat.png`)});await page.setViewportSize({width:430,height:900});
  failSend=true;messagePosts=0;await page.waitForLoadState("networkidle");await page.goto(base+'/support/ticket-one');await page.waitForLoadState('networkidle');await page.getByLabel('Nachricht',{exact:true}).fill('Test message');await page.getByRole('button',{name:'Senden',exact:true}).dblclick();await page.getByText('Fixture message offline',{exact:true}).waitFor();assert.equal(messagePosts,1);assert.equal(await page.getByLabel('Nachricht',{exact:true}).inputValue(),'Test message');failSend=false;await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Test message',{exact:true}).waitFor();assert.equal(messagePosts,2);
  }
  if(hasInteraction('customers')){
   await page.setViewportSize({width:320,height:740});await page.goto(base+'/kunden/customer-one');await page.waitForLoadState('networkidle');
   assert.equal(await page.locator('.customer-detail-workspace .surface .status').filter({hasText:/^Aktiv$/}).count(),0,'Customer status appears only in the header');
   await page.getByRole('button',{name:'Kontakte',exact:true}).click();
   const row=page.locator('.contact-list>div').first(),name=await row.locator('b').boundingBox(),menu=await row.getByRole('button',{name:'Alex Muster Aktionen'}).boundingBox();
   assert.ok(menu.x>name.x&&menu.y<=name.y+name.height,'Contact action stays in the first line');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contacts-final.png`)});
   await row.getByRole('button',{name:'Alex Muster Aktionen'}).click();await page.getByRole('button',{name:'Kontakt bearbeiten / Hauptkontakt festlegen'}).click();
   const primary=page.getByRole('checkbox',{name:'Als Hauptkontakt festlegen'}),box=await primary.boundingBox();assert.ok(box.width<=24&&box.height<=24,'Primary contact checkbox stays compact');assert.equal(await primary.isChecked(),true,'Existing primary contact value is retained');assert.ok((await page.getByRole('dialog').boundingBox()).x>=0,'Contact sheet stays inside the viewport');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-contact-form-final.png`)});await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Finanzen',exact:true}).click();await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-customer-finance-final.png`)});assert.equal(await page.locator('.mobile-record-list .document-summary-row').count(),2,'Offers and invoices share the same financial row');
  }
  if(hasInteraction('time')){
   groupingFixture=true;   await page.setViewportSize({width:320,height:740});await page.goto(base+'/zeit');await page.waitForLoadState('networkidle');await page.getByRole('tab',{name:'Einträge',exact:true}).click();
   assert.equal(await page.locator('.time-group').count(),4,'Internal time and distinct customer/project identities remain four groups');assert.equal(await page.locator('.timer-card .section-title strong').innerText(),'40:45 h','Group total counts each entry once');
   const group=page.locator('.time-group-head').first();assert.equal(await group.evaluate(el=>getComputedStyle(el).textAlign),'left','Time group does not inherit timer centering');
   const customerBox=await group.locator('b').boundingBox(),duration=await group.locator('strong').boundingBox(),chevron=await group.locator('svg').boundingBox();assert.ok(customerBox.x<duration.x&&duration.x<chevron.x,'Group duration and chevron are right aligned');assert.ok((await group.boundingBox()).height<=76,'Collapsed group is compact');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-time-groups-final.png`)});
   await page.getByRole('button',{name:'Manuell erfassen',exact:true}).click();const sheet=page.getByRole('dialog',{name:'Zeit manuell erfassen'});assert.equal(await sheet.getByRole('button',{name:'Speichern',exact:true}).count(),1);
   await page.setViewportSize({width:320,height:400});await sheet.getByLabel('Beschreibung',{exact:true}).focus();await sheet.getByLabel('Beschreibung',{exact:true}).scrollIntoViewIfNeeded();const footer=await sheet.locator('.filter-sheet-actions').boundingBox(),header=await sheet.locator('.sheet-header').boundingBox();assert.ok(header.y>=0&&footer.y+footer.height<=401&&footer.x+footer.width<=321,'Manual time sheet keeps header and footer visible at keyboard-sized height');
   await capture(page,{animations:'disabled',path:path.join(output,`${theme}-320-400-manual-time-final.png`)});await page.keyboard.press('Escape');groupingFixture=false;
  }
  assert.deepEqual(errors,[],'Browser runtime errors');
  await context.close();context=null;await browser.close();browser=null;
 }
 assert.deepEqual(accessibilityFailures,[],'Blocking accessibility violations');
 await fs.writeFile(path.join(output,`results-${process.env.BINSO_UX_THEMES??'light-dark'}.json`),JSON.stringify({browser:process.env.BINSO_UX_BROWSER??'chromium',device:process.env.BINSO_UX_DEVICE??'responsive viewport',scope:'Synthetic API UI fixtures; no production writes',interactions:requestedInteractions,results,errors},null,2));
 await fs.copyFile(path.join(output,`results-${process.env.BINSO_UX_THEMES??'light-dark'}.json`),path.join(output,`results-${process.env.BINSO_UX_BROWSER??'chromium'}-${process.env.BINSO_UX_THEMES??'light-dark'}.json`));
 console.log(`UX browser checks passed: ${results.length} route/theme/viewport combinations ; interactions: ${process.env.BINSO_UX_MATRIX_ONLY==="1"?"matrix only":requestedInteractions.join(",")}. Artifacts: ${output}`);
}finally{await context?.close();await browser?.close();server?.kill();}
