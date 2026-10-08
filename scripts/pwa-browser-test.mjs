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
 await context.route('**/api/**',route=>route.fulfill({status:401,json:{authenticated:false}}));
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
 await context.close();console.log('PWA service worker, offline fallback, manifest integrity and page-restart theme persistence passed (browser emulation, not physical installation).');
}finally{await browser.close();server?.kill();}
