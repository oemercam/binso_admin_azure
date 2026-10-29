import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
const output=process.argv[2];if(!output)throw Error('Explicit isolated output file required');
const {chromium}=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
const base='http://localhost:'+port,env={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_v8_perf_fixture'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});let logs='',browser;
server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(attempt>100||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
 browser=await chromium.launch({headless:true});const results=[];
 for(const width of [390,1440])for(const [route,label] of [['/einstellungen/firma?setup=1','Firmenname'],['/kunden/neu','Kundenname *']])for(let sample=0;sample<5;sample++){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'light',serviceWorkers:'block'}),page=await context.newPage();
  await context.addCookies([{name:env.SESSION_COOKIE_NAME,value:'synthetic-not-authentication',url:base}]);
  await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false})));
  const requests={},errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await context.route('**/api/**',async request=>{const path=new URL(request.request().url()).pathname;requests[path]=(requests[path]??0)+1;
   let json={items:[],item:{},stats:{},unreadCount:0};
   if(path==='/api/auth/session')json={authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture',role:'owner',plan:'pro'}};
   if(path==='/api/settings/profile')json={item:{id:'fixture',display_name:'Synthetic',language:'de'}};
   if(path==='/api/settings/company')json={item:{name:'Synthetic AG',street:'Testweg',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',qr_iban:''}};
   await request.fulfill({json});
  });
  const started=performance.now();await page.goto(base+route);const field=page.getByLabel(label,{exact:true});await field.waitFor();
  await page.waitForFunction(input=>!input.disabled&&input.getClientRects().length>0,await field.elementHandle());
  const readyMs=performance.now()-started;await page.waitForLoadState('networkidle');assert.deepEqual(errors,[]);assert.equal(requests['/api/auth/session'],1,'One identity read per page bootstrap');
  results.push({width,route,sample,readyMs:Math.round(readyMs),requests});page.removeAllListeners('pageerror');await context.close();
 }
 const summary=[];for(const width of [390,1440])for(const route of ['/einstellungen/firma?setup=1','/kunden/neu']){const samples=results.filter(row=>row.width===width&&row.route===route),times=samples.map(row=>row.readyMs).sort((a,b)=>a-b);summary.push({width,route,medianReadyMs:times[2],minReadyMs:times[0],maxReadyMs:times[4],identityRequests:samples.map(row=>row.requests['/api/auth/session'])});}
 await fs.mkdir(path.dirname(output),{recursive:true});
 await fs.writeFile(output,JSON.stringify({buildId:(await fs.readFile('.next/BUILD_ID','utf8')).trim(),conditions:'Local compiled production build; Chromium, five fresh contexts per route/width; synthetic identical HTTP responses; service workers blocked; no provider or real API latency measured',summary,results},null,2)+'\n');console.log(JSON.stringify(summary));
}finally{await browser?.close();server.kill();}
