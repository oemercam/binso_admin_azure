import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port='3201',base=process.env.BINSO_BASE_URL??'http://127.0.0.1:'+port;
let server;
if(!process.env.BINSO_BASE_URL){
 server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe'],env:{...process.env,PORT:port,HOSTNAME:'127.0.0.1'}});
 let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(attempt>=60||server.exitCode!==null){server.kill();throw new Error('PWA server unavailable: '+logs);}await new Promise(r=>setTimeout(r,250));}
}
const browser=await chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--single-process']}: {})});
try{
 const context=await browser.newContext({viewport:{width:375,height:812},colorScheme:'light',serviceWorkers:'allow'});
 let authenticated=false,tracker=null,startedAt=0,mutations=0,entries=[];
 const savedTracker=()=>tracker?{...tracker,seconds:tracker.seconds+(tracker.state==='running'?Math.floor((Date.now()-startedAt)/1000):0)}:null;
 await context.route('**/api/**',async route=>{
  const request=route.request(),pathname=new URL(request.url()).pathname;
  if(!authenticated)return route.fulfill({status:401,json:{authenticated:false}});
  if(pathname==='/api/auth/session')return route.fulfill({json:{authenticated:true,tenant:{id:'pwa-synthetic',role:'owner',plan:'pro',readOnly:false}}});
  if(pathname==='/api/time-tracker'){
   if(request.method()==='POST'){
    mutations++;const {action}=JSON.parse(request.postData());const current=savedTracker();
    if(action==='finish'){if(current)entries.push({id:'pwa-time',duration_minutes:Math.max(1,current.seconds/60),started_at:new Date().toISOString(),description:'PWA Timer',project_name:'Arbeitszeit',billable:false});tracker=null;}
    else {tracker={state:action==='start'?'running':'paused',seconds:current?.seconds??61,project_label:'Arbeitszeit',project_id:null,customer_id:null};startedAt=Date.now();}
   }
   return route.fulfill({json:{tracker:savedTracker()}});
  }
  if(pathname==='/api/time-entries')return route.fulfill({json:{items:entries}});
  if(pathname==='/api/settings/profile')return route.fulfill({json:{item:{display_name:'PWA Test'},email:'pwa@fixture.invalid'}});
  return route.fulfill({json:{items:[],item:{},time_approval_required:false}});
 });
 let page=await context.newPage();
 await page.goto(base+'/login');
 await page.evaluate(()=>{localStorage.setItem('binso.theme.mode','dark');localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-08'}))});
 await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.close();page=await context.newPage();await page.goto(base+'/login');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark','Theme survives closing and reopening the PWA page');
 const manifests=await page.evaluate(async()=>Promise.all(['/manifest-app.webmanifest','/manifest-admin.webmanifest','/manifest.webmanifest'].map(async path=>{const r=await fetch(path);return {status:r.status,...await r.json()}})));
 assert.deepEqual(manifests.map(m=>m.status),[200,200,200]);
 assert.equal(manifests[0].name,'Binso One');assert.equal(manifests[1].name,'One Admin');
 for(const m of manifests){assert(m.start_url&&m.display==='standalone');assert(m.icons.some(i=>i.sizes==='192x192'&&i.type==='image/png'));assert(m.icons.some(i=>i.sizes==='512x512'&&i.type==='image/png'));for(const icon of m.icons){const image=await context.request.get(base+icon.src);assert.equal(image.status(),200);assert((await image.body()).length>100,'Manifest icon has real content');}}
 await page.goto(base+'/operator/login');assert(await page.locator('link[rel="apple-touch-icon"][href="/brand/apple-touch-icon.png"]').count(),'Operator offers a PNG Apple touch icon');
 await context.setOffline(true);await page.goto(base+'/dashboard');await page.getByRole('heading',{name:/Offline|Verbindung/i}).first().waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await context.setOffline(false);
 const cached=await page.evaluate(async()=>{const keys=await caches.keys();return (await Promise.all(keys.map(async key=>(await (await caches.open(key)).keys()).map(r=>new URL(r.url).pathname)))).flat()});
 assert(cached.includes('/offline'));assert(!cached.some(path=>path.startsWith('/api/')||path==='/dashboard'),'PWA never caches authenticated business data');
 // The same server fixture survives page destruction. No timer state is stored in
 // localStorage; actual TimePage/readTimer must recover it from the API.
 authenticated=true;await context.addCookies([{name:'binso_demo',value:'1',url:base}]);
 await page.goto(base+'/zeit');await page.getByRole('button',{name:'Starten',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal(mutations,1);
 await page.goto(base+'/kunden');await page.goto(base+'/zeit');await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal(mutations,1,'Navigation never starts another timer');
 await page.close();page=await context.newPage();await page.goto(base+'/zeit');await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal(mutations,1,'PWA page restart restores the running server tracker');
 const other=await context.newPage();await other.goto(base+'/zeit');await other.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Fortsetzen',exact:true}).waitFor();await other.getByRole('button',{name:'Fortsetzen',exact:true}).waitFor();assert.equal(mutations,2,'Pause propagates to another mounted tab');
 const pausedSeconds=tracker.seconds;await page.close();page=await context.newPage();await page.goto(base+'/zeit');await page.getByRole('button',{name:'Fortsetzen',exact:true}).waitFor();assert.equal(tracker.seconds,pausedSeconds,'Paused time survives restart');
 await page.getByRole('button',{name:'Fortsetzen',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.getByRole('button',{name:'Stoppen',exact:true}).click();await page.getByRole('button',{name:'Starten',exact:true}).waitFor();assert.equal(entries.length,1,'Stopping stores one confirmed time entry');await other.getByRole('button',{name:'Starten',exact:true}).waitFor();await other.close();
 authenticated=false;await page.reload();await page.getByRole('link',{name:'Anmelden',exact:true}).filter({visible:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Pause',exact:true}).count(),0,'Expired session cannot expose a private timer');
 console.log('Actual TimePage: navigation, page restart, paused restart, cross-tab pause/stop and expired session passed with a synthetic server ledger.');
 await context.close();console.log('PWA service worker, offline fallback, manifest integrity and page-restart theme persistence passed (browser emulation, not physical installation).');
}finally{await browser.close();server?.kill();}
