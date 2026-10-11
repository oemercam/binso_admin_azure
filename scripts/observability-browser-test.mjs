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
try{
 assert.equal(Number((await pool.query("select count(*) n from information_schema.tables where table_schema='public'")).rows[0].n),0,'Never reset existing data');
 for(const name of (await fs.readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort())await pool.query(await fs.readFile('database/migrations/'+name,'utf8'));
 const org='00000000-0000-4000-8000-000000000088';
 await pool.query("insert into organizations(id,name,slug,is_demo) values($1,'Synthetic customer','observability-synthetic',false)",[org]);
 await pool.query("insert into organization_subscriptions(organization_id,plan,status,billing_interval,unit_amount_chf) values($1,'professional','active','yearly',1200)",[org]);
 await pool.query("insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency) values($1,'manual','obs-chf',current_date,12.34,'CHF'),($1,'manual','obs-eur',current_date,9999,'EUR')",[org]);
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
 for(const [role,token] of tokens){const response=await fetch(base+'/api/operator/monitoring',{headers:{cookie:'binso_observability_session='+token}});assert.equal(response.status,200,role);const data=await response.json();assert.equal(data.schemaVersion,1);const overviewResponse=await fetch(base+'/api/operator/customers/'+org,{headers:{cookie:'binso_observability_session='+token}});assert.equal(overviewResponse.status,200);const overview=(await overviewResponse.json()).overview;assert.equal(overview.payments_total===null,!['platform_owner','platform_admin','platform_billing'].includes(role),role+' customer financial access');assert.equal(data.metrics.find(m=>m.id==='payments').dataState,['platform_owner','platform_admin','platform_billing'].includes(role)?'fresh':'no_permission',role+' finance data access');assert.equal(data.metrics.find(m=>m.id==='azure_cpu').state,'unknown');assert.ok(!JSON.stringify(data).includes('@fixture.invalid'),'No operator identity exposed');}
 const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true});await fs.mkdir(output,{recursive:true});
 const anonymousContext=await browser.newContext();const anonymousPage=await anonymousContext.newPage();await anonymousPage.goto(base+'/operator/wallboard');await anonymousPage.waitForURL('**/operator/login');assert.equal(await anonymousPage.locator('.bo-wallboard-root').count(),0,'Anonymous user cannot render wallboard');await anonymousContext.close();
 const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:new Date().toISOString()}))); await context.addCookies([{name:'binso_observability_session',value:tokens.get('platform_owner'),url:base}]);let page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const theme of ['light','dark'])for(const width of [390,768,1920,2560,3840]){
  await page.setViewportSize({width,height:width>=1920?Math.round(width*9/16):900});await page.goto(base+'/operator/wallboard');await page.getByRole('heading',{name:'Binso One · Monitoring',exact:true}).waitFor();await page.locator('[data-metric-id="customers"]').waitFor();
  await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  assert.equal(await page.locator('.operator-mobile-nav').count(),0,'Independent wallboard does not alter or embed navigation');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Wallboard overflow '+width);
  for(const profile of ['technical','business','combined']){
   await page.getByLabel('Wallboard-Profil').selectOption(profile);
   if(profile==='business'){assert.equal(await page.locator('[data-metric-id="payments"]').count(),1);assert.equal(await page.locator('.bo-monitor-chart').count(),0);}else assert.equal(await page.locator('.bo-monitor-chart').count(),3);
   await page.screenshot({path:path.join(output,theme+'-'+width+'-'+profile+'.png'),fullPage:true});results.push({theme,width,profile,passed:true});
  }
 }
 await page.setViewportSize({width:390,height:900});await page.goto(base+'/operator/zahlungen');await page.getByText('12.34',{exact:false}).first().waitFor();
 assert.ok((await page.locator('.operator-payment-insights').innerText()).includes('CHF 12.34'),'Foreign currency excluded from CHF KPI');assert.ok((await page.locator('.operator-table-card').innerText()).includes('EUR'),'Original payment currency retained');
 await page.goto(base+'/operator/kunden/'+org);await page.getByText('Synthetic customer',{exact:true}).first().waitFor();assert.ok((await page.locator('.operator-customer-metrics').innerText()).includes('CHF 12.34'),'Customer metrics from actual API');await page.screenshot({path:path.join(output,'customer-actual-data.png'),fullPage:true});
 await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.clock.setFixedTime(new Date());await page.goto(base+'/operator/wallboard');await page.locator('[data-metric-id="customers"]').waitFor();
 await page.setViewportSize({width:1920,height:1080});await page.getByLabel('Wallboard-Profil').selectOption('combined');
 let attempts=0;await page.route('**/api/operator/monitoring',route=>{attempts++;return route.fulfill({status:503,json:{message:'Synthetic API outage'}});});await page.clock.runFor(61000);await page.getByText(/Verbindung unterbrochen/).waitFor();assert.ok(attempts>0,'Auto refresh actually attempted');assert.equal(await page.locator('[data-metric-id="payments"]').getAttribute('data-health'),'unknown');
 await page.unroute('**/api/operator/monitoring');await page.clock.runFor(61000);await page.getByText(/Automatische Aktualisierung/).waitFor();assert.equal(await page.locator('[data-metric-id="payments"]').getAttribute('data-health'),'healthy','Recovery consumes fresh server data');
 await page.getByRole('button',{name:'Hell / Dunkel'}).click();assert.ok(['light','dark'].includes(await page.evaluate(()=>document.documentElement.dataset.theme)));
 await context.close();assert.deepEqual(errors,[]);
 console.log('Authenticated wallboard: five real operator roles, anonymous denial, three profiles, light/dark, 390–3840px, automatic refresh, outage and recovery passed.');
}finally{
 await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'results.json'),JSON.stringify({results,errors},null,2));await browser?.close();if(server&&server.exitCode===null)server.kill('SIGTERM');await pool.end();
}
