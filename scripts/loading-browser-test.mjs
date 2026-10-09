import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const baseline=process.env.BINSO_LOADING_BASELINE==='1',output=process.env.BINSO_LOADING_OUTPUT??'/tmp/binso-loading-after';
await fs.mkdir(output,{recursive:true});
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:3360';let server,logs='';
if(!process.env.BINSO_BASE_URL){server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3360'],{env:{...process.env,PORT:'3360',HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i===100||server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,100));}}
const browser=await engines[process.env.BINSO_UX_BROWSER??'webkit'].launch({headless:true});const results=[];
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme,reducedMotion:theme==='dark'?'reduce':'no-preference',serviceWorkers:'block'});
  await context.addCookies([{name:'binso_demo',value:'1',url:base}]);let authCalls=0,delay=350,authMode='valid',showCustomer=false;const calls={};
  await context.route('**/api/**',async route=>{const p=new URL(route.request().url()).pathname;calls[p]=(calls[p]||0)+1;
   if(p==='/api/auth/session'){authCalls++;await new Promise(r=>setTimeout(r,delay));return route.fulfill({status:authMode==='error'?503:200,json:authMode==='error'?{message:'Initialisierung fehlgeschlagen'}:authMode==='expired'?{authenticated:false}:{authenticated:true,demo:false,tenant:{id:'fixture',role:'owner',plan:'pro'}}});}
   if(p==='/api/customers'&&showCustomer)return route.fulfill({json:{items:[{id:'fixture',name:'Prüffirma AG',status:'active',city:'Bern'}]}});
   if(p==='/api/finance/overview')return route.fulfill({json:{invoices:[],offers:[],time:{hours:0,invoiced_hours:0}}});
   if(p==='/api/settings/profile')return route.fulfill({json:{item:{display_name:'Prüfung',theme,language:'de'}}});
   if(p==='/api/customers/fixture')return route.fulfill({json:{item:{id:'fixture',name:'Prüffirma AG',status:'active',street:'Teststrasse 1',postal_code:'3000',city:'Bern'}}});
   await new Promise(r=>setTimeout(r,150));return route.fulfill({json:{items:[],tracker:null}});
  });
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-09'}));window.loadingFrames=[];const capture=()=>{const visible=selector=>{const el=document.querySelector(selector);return !!el&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none';};window.loadingFrames.push({at:performance.now(),phase:['.app-launch-screen','.app-session-loading','.app-launch','.app-root'].filter(visible),content:document.querySelector('.page-container')?.innerText??'',iconWidth:document.querySelector('.app-start-icon')?parseFloat(getComputedStyle(document.querySelector('.app-start-icon')).width):null,iconAnimation:document.querySelector('.app-start-icon')?getComputedStyle(document.querySelector('.app-start-icon')).animationName:null});requestAnimationFrame(capture)};requestAnimationFrame(capture)},theme);
  let page=await context.newPage();
  async function measure(label,action,ready='Keine Kunden erfasst'){
   const before=authCalls,requestsBefore={...calls};await action();await page.getByText(ready,{exact:true}).waitFor();await page.waitForTimeout(950);
   const frames=await page.evaluate(()=>window.loadingFrames),readyFrame=frames.find(f=>f.content.includes(ready)&&!f.phase.includes('.app-launch-screen')&&!f.phase.includes('.app-launch'));
   const phases=[...new Set(frames.map(f=>f.phase.join(',')))];const durations={};
   for(let i=0;i<frames.length-1;i++)for(const phase of frames[i].phase)if(phase!=='.app-root')durations[phase]=(durations[phase]||0)+frames[i+1].at-frames[i].at;
   const row={theme,label,firstMeaningfulMs:readyFrame?.at,contentReadyMs:frames.find(f=>f.content.includes(ready))?.at,authRequests:authCalls-before,requests:Object.fromEntries(Object.entries(calls).map(([p,n])=>[p,n-(requestsBefore[p]||0)]).filter(([,n])=>n)),phases,loaderDurationMs:durations,startup:frames.find(f=>f.iconWidth)};results.push(row);
   if(!baseline){assert(!phases.some(p=>p.includes('.app-session-loading')||p.split(',').includes('.app-launch')),'No retired/sequential start loader');assert.equal(row.authRequests,1,'One fresh auth check per page startup');}
   await page.screenshot({path:output+'/'+theme+'-'+label+'.png'});
  }
  await measure('cold',()=>page.goto(base+'/kunden'));
  if(!baseline)assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'),'/manifest-app.webmanifest','Actual customer routes use the app manifest');
  if(!baseline){const startup=results.at(-1).startup;assert.equal(startup?.iconWidth,72);assert.equal(startup?.iconAnimation,theme==='dark'?'none':'binso-start');}
  await measure('refresh',()=>page.reload());
  await page.evaluate(()=>{window.shellBefore=document.querySelector('.app-root');window.navBefore=document.querySelector('.bottom-nav');window.loadingFrames=[];});const beforeNav=authCalls;
  const start=await page.evaluate(()=>performance.now());await page.locator('.app-sidebar a[href="/produkte"]').evaluate(el=>el.click());await page.getByText('Keine Produkte erfasst',{exact:true}).waitFor();
  const navigation=await page.evaluate(t=>({ms:performance.now()-t,shellPreserved:window.shellBefore===document.querySelector('.app-root'),navigationPreserved:window.navBefore===document.querySelector('.bottom-nav'),phases:[...new Set(window.loadingFrames.map(f=>f.phase.join(',')))]}),start);
  results.push({theme,label:'navigation',...navigation,authRequests:authCalls-beforeNav});
  if(!baseline){assert(navigation.shellPreserved&&navigation.navigationPreserved,'Navigation DOM persists');assert(!navigation.phases.some(p=>p.includes('.app-launch-screen')),'No internal splash');assert.equal(authCalls-beforeNav,0,'Warm route uses bounded in-memory session');}
  await page.goBack();await page.getByText('Keine Kunden erfasst',{exact:true}).waitFor();
  if(!baseline)assert(await page.evaluate(()=>window.navBefore===document.querySelector('.bottom-nav')),'Back navigation retains navigation');
  // Use an actual rendered record link to exercise detail/overview transitions.
  showCustomer=true;await page.reload();await page.locator('a[href="/kunden/fixture"]:visible').first().waitFor();await page.evaluate(()=>{window.navBefore=document.querySelector('.bottom-nav')});
  await page.locator('a[href="/kunden/fixture"]:visible').first().click();await page.waitForURL('**/kunden/fixture');await page.getByRole('heading',{name:/Prüffirma AG/}).first().waitFor();await page.locator('.mobile-back').evaluate(el=>el.click());await page.waitForURL('**/kunden');
  if(!baseline)assert(await page.evaluate(()=>window.navBefore===document.querySelector('.bottom-nav')),'Detail/overview retains navigation');showCustomer=false;
  // PWA-like close/reopen of the same browser context, not physical installation.
  await page.close();page=await context.newPage();await measure('reopen',()=>page.goto(base+'/kunden'));
  delay=1200;await measure('slow-refresh',()=>page.reload());delay=350;
  authMode='expired';await page.reload();await page.getByText('Deine Sitzung ist beendet. Bitte melde dich erneut an.',{exact:true}).waitFor();assert.equal(await page.locator('.customer-records-layout').count(),0,'Expired session hides business content');
  authMode='error';await page.reload();await page.getByText('Initialisierung fehlgeschlagen',{exact:true}).waitFor();authMode='valid';await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Kunden erfasst',{exact:true}).waitFor();
  await context.close();
 }
 await fs.writeFile(output+'/measurements.json',JSON.stringify({baseline,browser:process.env.BINSO_UX_BROWSER??'webkit',syntheticAuthDelayMs:350,results,physicalPwa:false},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();server?.kill();}
