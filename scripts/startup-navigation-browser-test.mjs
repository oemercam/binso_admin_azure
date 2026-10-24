import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
const auth=await createUiAuthFixture(),port=process.env.BINSO_STARTUP_PORT??'3227',base='http://127.0.0.1:'+port;
const engine=process.env.BINSO_UX_BROWSER??'chromium',engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe'],env:{...process.env,...auth.env}});let serverFailed=false;server.stderr.on('data',()=>{serverFailed=true});server.stdout.on('data',()=>{});
let browser;
try{
 for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(i>120||server.exitCode!==null)throw Error('Isolated production server unavailable');await new Promise(r=>setTimeout(r,250))}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
 const evidence=[];
 const markers={'/dashboard':'.bo-dashboard-overview','/kunden':'input[placeholder="Kunden suchen..."]','/projekte':'input[placeholder="Aufträge suchen..."]','/zeit':'.timer-display','/einstellungen':'.settings-overview'};
 async function ready(page,path){
  await page.locator(markers[path]).first().waitFor({state:'visible'});
  await page.waitForFunction(()=>!document.querySelector('.page-container .loading-state'));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.page-container [role=alert]').count(),0,'Business data must resolve without an error');
 }

 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'allow'});await context.addCookies(auth.cookies.map(c=>({...c,url:base})));
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',response=>{const u=new URL(response.url());if(u.pathname.startsWith('/api/'))requests.push({path:u.pathname,status:response.status()})});
  await page.addInitScript(()=>{localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({version:2,essential:true,performance:false,updatedAt:new Date().toISOString()}));window.__startupFrames=[];let count=0;function frame(){const button=document.querySelector('.bo-create-action');if(button?.checkVisibility()){const r=button.getBoundingClientRect();window.__startupFrames.push({x:r.x,y:r.y,width:r.width,height:r.height,time:performance.now()})}if(++count<500)requestAnimationFrame(frame)}requestAnimationFrame(frame)});
  const started=Date.now();await page.goto(base+'/dashboard');await ready(page,'/dashboard');const startupMs=Date.now()-started;
  const frames=await page.evaluate(()=>window.__startupFrames);if(width<=760){assert(frames.length>2);const last=frames.at(-1);for(const f of frames)assert(Math.abs(f.y-last.y)<=1&&Math.abs(f.x-last.x)<=1,'Real PWA boot keeps the plus anchored from its first rendered frame')}
  const transitions=[];
  for(const path of ['/kunden','/projekte','/zeit','/einstellungen','/dashboard']){
   const start=Date.now();let target=page.locator('.app-sidebar a[href="'+path+'"],.bottom-nav a[href="'+path+'"]').filter({visible:true});if(!await target.count()){await page.locator('.bottom-nav>button').click();target=page.locator('[role=dialog] a[href="'+path+'"]').filter({visible:true});}await target.first().click();await page.waitForURL(base+path);await ready(page,path);assert.equal(await page.locator('.app-start').filter({visible:true}).count(),0,'Internal navigation must preserve the shell');transitions.push({path,settledMs:Date.now()-start});
  }
  await ready(page,'/dashboard');
  await page.screenshot({path:(process.env.BINSO_STARTUP_SCREENSHOT_PREFIX??'.qa-phase1/pwa-startup')+'-'+width+'.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(requests.filter(r=>r.status>=400),[],'Actual authenticated reads must succeed');
  const sessions=requests.filter(r=>r.path==='/api/auth/session').length;assert(sessions<=2,'Navigation shares the validated session rather than performing a session waterfall');
  evidence.push({width,startupMs,transitions,sessionRequests:sessions,apiRequests:requests.length,frames:frames.length});await context.close();
 }
 console.log(JSON.stringify({synthetic:true,productionBuild:true,engine,evidence,deviceAcceptance:false,serverStderrObserved:serverFailed}));
}finally{await browser?.close();server.kill();await new Promise(r=>server.once('exit',r));await auth.close()}
