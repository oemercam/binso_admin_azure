import {selectAppOption,appControlValue} from './app-select-browser.mjs';
import {writeTestOutput} from './test-output.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
const url=new URL(process.env.BINSO_OBSERVABILITY_TEST_URL??'');
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_observability_test'&&url.username==='binso_test','Only empty isolated observability test DB allowed');
const pool=new pg.Pool({connectionString:url.href}),output=process.env.BINSO_OBSERVABILITY_OUTPUT??'/tmp/binso-observability-browser';
const base='http://127.0.0.1:3228';let server,browser;const errors=[],results=[];
let lastOperatorNavigation=0;
async function navigateOperator(page,route){
 const target=base+route;
 if(page.url()===target)return;
 // Cached route sweeps must respect WebKit's native History API rate limit.
 const delay=500-(Date.now()-lastOperatorNavigation);
 if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
 lastOperatorNavigation=Date.now();
 const links=page.locator('.operator-root a[href='+JSON.stringify(route)+']');
 if(await links.count()){
  // Use the existing Next Link handler instead of repeatedly unloading its RSC streams.
  await links.first().evaluate(link=>link.click());await page.waitForURL(target);
 }else await page.goto(target);
}
const observeErrors=observedPage=>{
 observedPage.on('pageerror',error=>{errors.push(error.message);console.log('Uncaught operator browser error',{url:observedPage.url(),message:error.message,stack:error.stack});});
 observedPage.on('requestfailed',request=>{const target=new URL(request.url());if(target.searchParams.has('_rsc'))console.log('Failed operator RSC request',{route:target.pathname,prefetch:request.headers()['next-router-prefetch']==='1',failure:request.failure()?.errorText});});
};
try{
 assert.equal(Number((await pool.query("select count(*) n from information_schema.tables where table_schema='public'")).rows[0].n),0,'Never reset existing data');
 for(const name of (await fs.readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort())await pool.query(await fs.readFile('database/migrations/'+name,'utf8'));
 const org='00000000-0000-4000-8000-000000000088';
 await pool.query("insert into organizations(id,name,slug,is_demo) values($1,'Synthetic customer','observability-synthetic',false)",[org]);
 await pool.query("insert into organization_subscriptions(organization_id,plan,status,billing_interval,unit_amount_chf) values($1,'professional','active','yearly',1200)",[org]);
 await pool.query("insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency) values($1,'manual','obs-chf',current_date,12.34,'CHF'),($1,'manual','obs-eur',current_date,9999,'EUR')",[org]);
 await pool.query("insert into web_vitals(metric,value,rating,route,created_at) values('LCP',1200,'good','/operator',now()),('INP',100,'good','/operator',now()),('CLS',0.05,'good','/operator',now())");
 const supportCase=(await pool.query("insert into support_cases(case_number,organization_id,created_by_user_id,category,subject,status) values('OBS-ADMIN',$1,'fixture','technical','Admin regression ticket','open') returning id",[org])).rows[0];
 await pool.query("insert into support_messages(case_id,author_user_id,author_type,message,internal) values($1,'fixture','customer','Original customer message',false)",[supportCase.id]);
 await pool.query("insert into platform_announcements(title,message,kind,active) values('Admin regression notice','Actual announcement API contract','warning',true)");
 const tokens=new Map();
 for(const role of ['platform_owner','platform_admin','platform_support','platform_billing','platform_auditor']){
  const token=randomBytes(32).toString('base64url'),user='obs-'+role;tokens.set(role,token);
  await pool.query('insert into platform_operator_assignments(user_id,email,role,status) values($1,$2,$3,\'active\')',[user,user+'@fixture.invalid',role]);
  await pool.query("insert into platform_auth_sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",[user,createHash('sha256').update(token).digest('hex')]);
 }
 const env={...process.env,DATABASE_URL:url.href,DATABASE_SSL:'false',APP_MODE:'local',OPERATOR_SESSION_COOKIE_NAME:'binso_observability_session',PORT:'3228',HOSTNAME:'127.0.0.1'};
 for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_)/.test(key))delete env[key];
 let logs='';
 try{await fetch(base+'/api/health');throw Error('Refusing occupied test port');}catch(error){if(error.message==='Refusing occupied test port')throw error;}
 server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3228'],{env,stdio:['ignore','pipe','pipe']});server.stdout.on('data',s=>{logs+=s});server.stderr.on('data',s=>{logs+=s});
 for(let i=0;;i++){if(server.exitCode!==null)throw Error('Test server exited: '+logs);try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i>120)throw Error('Test server unavailable');await new Promise(resolve=>setTimeout(resolve,250));}
 const anon=await fetch(base+'/api/operator/monitoring');assert.equal(anon.status,401);
 for(const [role,token] of tokens){const response=await fetch(base+'/api/operator/monitoring',{headers:{cookie:'binso_observability_session='+token}});assert.equal(response.status,200,role);const data=await response.json();assert.equal(data.schemaVersion,1);const dashboardResponse=await fetch(base+'/api/operator/dashboard',{headers:{cookie:'binso_observability_session='+token}});assert.equal(dashboardResponse.status,200);const dashboard=await dashboardResponse.json();assert.equal(dashboard.stats.monthly_contract_value===null,!['platform_owner','platform_admin','platform_billing'].includes(role),'Dashboard finance masking '+role);assert.equal(dashboard.stats.tickets_open===null,!['platform_owner','platform_admin','platform_support'].includes(role),'Dashboard support masking '+role);const overviewResponse=await fetch(base+'/api/operator/customers/'+org,{headers:{cookie:'binso_observability_session='+token}});assert.equal(overviewResponse.status,200);const overview=(await overviewResponse.json()).overview;assert.equal(overview.payments_total===null,!['platform_owner','platform_admin','platform_billing'].includes(role),role+' customer financial access');assert.equal(data.metrics.find(m=>m.id==='payments').dataState,['platform_owner','platform_admin','platform_billing'].includes(role)?'fresh':'no_permission',role+' finance data access');assert.equal(data.metrics.find(m=>m.id==='azure_cpu').state,'unknown');assert.ok(!JSON.stringify(data).includes('@fixture.invalid'),'No operator identity exposed');}
 const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true});await fs.mkdir(output,{recursive:true});
 // Route interception must observe page-owned requests; PWA lifecycle has its own gate.
 const anonymousContext=await browser.newContext({serviceWorkers:'block'});const anonymousPage=await anonymousContext.newPage();await anonymousPage.goto(base+'/operator/wallboard');await anonymousPage.waitForURL('**/operator/login');assert.equal(await anonymousPage.locator('.bo-wallboard-root').count(),0,'Anonymous user cannot render wallboard');await anonymousContext.close();
 const context=await browser.newContext({serviceWorkers:'block'});await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:new Date().toISOString()}))); await context.addCookies([{name:'binso_observability_session',value:tokens.get('platform_owner'),url:base}]);let page=await context.newPage();observeErrors(page);
 // Authenticated governance pages load on explicit navigation, without speculative RSC requests.
 const speculativeGovernance=[];
 page.on('request',request=>{const target=new URL(request.url());if(['/operator/ankuendigungen','/operator/sicherheit','/operator/audit','/operator/monitoring'].includes(target.pathname)&&request.headers()['next-router-prefetch']==='1')speculativeGovernance.push(target.pathname);});
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'/operator');await page.locator('.operator-root').getByRole('heading',{level:1}).waitFor();await page.waitForLoadState('networkidle');
 assert.deepEqual(speculativeGovernance,[],'Desktop admin navigation does not preload authenticated pages');
 await page.locator('.operator-sidebar a[href="/operator/sicherheit"]').click();await page.waitForURL(base+'/operator/sicherheit');await page.locator('.operator-root').getByRole('heading',{level:1}).waitFor();await page.waitForLoadState('networkidle');
 assert.equal(await page.getByRole('heading',{name:'Keine Berechtigung für diesen Bereich',exact:true}).count(),0,'Explicit authenticated sidebar navigation still works');
 // The independent wallboard opens in its own document; keep the portal mounted.
 const portalPage=page;page=await context.newPage();observeErrors(page);
 for(const theme of ['light','dark'])for(const width of [390,768,1920,2560,3840]){
  await page.setViewportSize({width,height:width>=1920?Math.round(width*9/16):900});await page.goto(base+'/operator/wallboard');await page.getByRole('heading',{name:'Binso One · Monitoring',exact:true}).waitFor();await page.locator('[data-metric-id="customers"]').waitFor();
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  assert.equal(await page.locator('.operator-mobile-nav').count(),0,'Independent wallboard does not alter or embed navigation');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Wallboard overflow '+width);
  for(const profile of ['technical','business','combined']){
   await selectAppOption(page.getByLabel('Wallboard-Profil'), profile);
   if(profile==='business'){assert.equal(await page.locator('[data-metric-id="payments"]').count(),1);assert.equal(await page.locator('.bo-monitor-chart').count(),0);}else assert.equal(await page.locator('.bo-monitor-chart').count(),3);
   if(width>=1920)assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'Wallboard fits 16:9 viewport '+width+' '+profile);await page.screenshot({path:path.join(output,theme+'-'+width+'-'+profile+'.png'),fullPage:true});results.push({theme,width,profile,passed:true});
  }
 }
 await page.close();page=portalPage;
 await page.setViewportSize({width:390,height:900});await navigateOperator(page,'/operator/zahlungen');await page.getByText('12.34',{exact:false}).first().waitFor();
 assert.ok((await page.locator('.operator-payment-insights').innerText()).includes('CHF 12.34'),'Foreign currency excluded from CHF KPI');assert.ok((await page.locator('.operator-table-card').innerText()).includes('EUR'),'Original payment currency retained');
 await navigateOperator(page,'/operator/kunden/'+org);await page.getByText('Synthetic customer',{exact:true}).first().waitFor();assert.ok((await page.locator('.operator-customer-metrics').innerText()).includes('CHF 12.34'),'Customer metrics from actual API');assert.ok((await page.locator('.operator-customer-metrics').innerText()).includes('Limit nicht verfügbar'),'Missing entitlements never imply an unlimited account');await page.screenshot({path:path.join(output,'customer-actual-data.png'),fullPage:true});
 // Every implemented admin page and both detail views consume real isolated APIs.
 const portalRoutes=['','tickets','tickets/'+supportCase.id,'kunden','kunden/'+org,'zahlungen','finanzen','abonnemente','sperrungen','monitoring','ankuendigungen','sicherheit','audit'];
 for(const theme of ['light','dark'])for(const width of [320,390,820,1440])for(const section of portalRoutes){
  await page.setViewportSize({width,height:900});await navigateOperator(page,'/operator'+(section?'/'+section:''));await page.locator('.operator-root').getByRole('heading',{level:1}).waitFor();
  await page.waitForLoadState('networkidle');await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  assert.equal(await page.locator('.operator-root').getByRole('heading',{level:1}).count(),1,'One visible admin title '+section+' '+width);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Admin overflow '+section+' '+width);
  assert.equal(await page.getByText(/Invalid Date|undefined/).count(),0,'Actual admin contract '+section);
  const loadErrors=await page.locator('.operator-root').getByRole('alert').allTextContents();
  if(loadErrors.length){await page.screenshot({path:path.join(output,'failed-admin-page.png'),fullPage:true});console.log('Admin loading errors:',section,loadErrors);}
  assert.deepEqual(loadErrors,[],'Admin page loads without API errors '+section);
  assert.equal(await page.getByRole('heading',{name:'Keine Berechtigung für diesen Bereich',exact:true}).count(),0,'Owner page accessible '+section);
  await page.screenshot({path:path.join(output,'admin-'+theme+'-'+width+'-'+(section.replaceAll('/','-')||'dashboard')+'.png'),fullPage:true});results.push({theme,width,section,passed:true});
 }
 await page.setViewportSize({width:390,height:900});await navigateOperator(page,'/operator/tickets/'+supportCase.id);await page.getByText('Original customer message',{exact:true}).waitFor();
 await selectAppOption(page.getByLabel('Status',{exact:true}), 'waiting_customer');assert.equal(await appControlValue(page.getByLabel('Status',{exact:true})),'waiting_customer');
 await page.getByPlaceholder('Antwort an Kunden schreiben...').fill('Real isolated operator reply');await page.getByRole('button',{name:'Senden',exact:true}).click();await page.getByText('Real isolated operator reply',{exact:true}).waitFor();
 assert.equal((await pool.query('select status from support_cases where id=$1',[supportCase.id])).rows[0].status,'waiting_for_customer','Actual ticket status persisted');
 const failedReply=route=>route.fulfill({status:503,json:{message:'Synthetic provider unavailable'}});await page.route('**/api/operator/tickets/'+supportCase.id+'/messages',failedReply);await page.getByPlaceholder('Antwort an Kunden schreiben...').fill('Retained reply draft');await page.getByRole('button',{name:'Senden',exact:true}).click();await page.locator('.toast-danger').getByText('Synthetic provider unavailable',{exact:true}).waitFor();assert.equal(await appControlValue(page.getByPlaceholder('Antwort an Kunden schreiben...')),'Retained reply draft','Failed operator write retains the draft');await page.unroute('**/api/operator/tickets/'+supportCase.id+'/messages',failedReply);
 const restrictedContext=await browser.newContext({serviceWorkers:'block'});await restrictedContext.addCookies([{name:'binso_observability_session',value:tokens.get('platform_support'),url:base}]);const restrictedPage=await restrictedContext.newPage();let deniedCalls=0;restrictedPage.on('request',request=>{if(request.url()===base+'/api/operator/finance')deniedCalls++});await restrictedPage.goto(base+'/operator/finanzen');await restrictedPage.getByRole('heading',{name:'Keine Berechtigung für diesen Bereich',exact:true}).waitFor();assert.equal(deniedCalls,0,'Denied page does not mount a failing privileged API');await restrictedContext.close();
 const notFound=await page.goto(base+'/operator/invalid-admin-route');assert.equal(notFound.status(),404,'Unknown route cannot masquerade as dashboard');
 await page.close();page=await context.newPage();observeErrors(page);await page.bringToFront();await page.goto(base+'/operator/wallboard');await page.locator('[data-metric-id="customers"]').waitFor();
 await page.setViewportSize({width:1920,height:1080});await selectAppOption(page.getByLabel('Wallboard-Profil'), 'combined');
 let attempts=0;await page.route('**/api/operator/monitoring',route=>{attempts++;return route.fulfill({status:503,json:{message:'Synthetic API outage'}});});assert.equal(await page.evaluate(()=>document.visibilityState),'visible','Polling requires a visible wallboard');await page.waitForResponse(response=>response.url()===base+'/api/operator/monitoring'&&response.status()===503,{timeout:75000});await page.getByText(/Verbindung unterbrochen/).waitFor();assert.ok(attempts>0,'Auto refresh actually attempted');assert.equal(await page.locator('[data-metric-id="payments"]').getAttribute('data-health'),'unknown');
 await page.unroute('**/api/operator/monitoring');await page.waitForResponse(response=>response.url()===base+'/api/operator/monitoring'&&response.status()===200,{timeout:75000});await page.getByText(/Automatische Aktualisierung/).waitFor();assert.equal(await page.locator('[data-metric-id="payments"]').getAttribute('data-health'),'healthy','Recovery consumes fresh server data');
 const previousTheme=await page.evaluate(()=>document.documentElement.dataset.theme);await page.getByRole('button',{name:'Hell / Dunkel'}).click();assert.notEqual(await page.evaluate(()=>document.documentElement.dataset.theme),previousTheme,'Theme button changes the actual theme');
 await context.close();assert.deepEqual(errors,[]);
 console.log('Authenticated wallboard: five real operator roles, anonymous denial, three profiles, light/dark, 390–3840px, automatic refresh, outage and recovery passed.');
}finally{
 await fs.mkdir(output,{recursive:true});await writeTestOutput(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));await browser?.close();if(server&&server.exitCode===null)server.kill('SIGTERM');await pool.end();
}
