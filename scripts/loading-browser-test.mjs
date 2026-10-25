import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import {writeTestOutput} from './test-output.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const baseline=process.env.BINSO_LOADING_BASELINE==='1',output=process.env.BINSO_LOADING_OUTPUT??'/tmp/binso-loading-after';
await fs.mkdir(output,{recursive:true});
const base=process.env.BINSO_BASE_URL??'http://127.0.0.1:3360';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Synthetic browser authentication requires a loopback app server');
const uiAuth=await createUiAuthFixture();
let server,logs='';
if(!process.env.BINSO_BASE_URL){server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3360'],{env:{...process.env,...uiAuth.env,PORT:'3360',HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i===100||server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,100));}}
const browser=await engines[process.env.BINSO_UX_BROWSER??'webkit'].launch({headless:true});const results=[];
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport,colorScheme:theme,reducedMotion:theme==='dark'?'reduce':'no-preference',serviceWorkers:'block'});
  await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));let authCalls=0,delay=350,authMode='valid',showCustomer=false,profileGate=null,dashboardGate=null;const calls={};
  await context.route('**/api/**',async route=>{const p=new URL(route.request().url()).pathname;calls[p]=(calls[p]||0)+1;
   if(p==='/api/auth/session'){authCalls++;await new Promise(r=>setTimeout(r,delay));return route.fulfill({status:authMode==='error'?503:200,json:authMode==='error'?{message:'Initialisierung fehlgeschlagen'}:authMode==='expired'?{authenticated:false}:{authenticated:true,demo:false,tenant:{id:'fixture',role:'owner',plan:'pro'}}});}
   if(p==='/api/customers'&&showCustomer)return route.fulfill({json:{items:[{id:'fixture',name:'Prüffirma AG',status:'active',city:'Bern'}]}});
   if(p==='/api/finance/overview')return route.fulfill({json:{invoices:[],offers:[],time:{hours:0,invoiced_hours:0}}});
   if(p==='/api/settings/company')return route.fulfill({json:{item:{name:'Synthetic Startup Company'}}});
   if(p==='/api/settings/profile'){if(profileGate)await profileGate;return route.fulfill({json:{item:{id:'fixture-profile',first_name:'Fixture',display_name:'Prüfung',theme,language:'de'}}});}
   if(p==='/api/dashboard'){
    if(dashboardGate)await dashboardGate;
    return route.fulfill({json:{canFinance:true,canInvoices:true,cash:{payments:[],refunds:[],outflows:[],incomplete:false,financial:{revenueEvents:[],snapshot:{as_of:'2026-10-24',paid:0,open:0,overdue:0,receivables:0,open_count:0,overdue_count:0,credit_balance:0}}},stats:{customer_count:1},work:null,recent:[]}});
   }
   if(p==='/api/customers/fixture')return route.fulfill({json:{item:{id:'fixture',name:'Prüffirma AG',status:'active',street:'Teststrasse 1',postal_code:'3000',city:'Bern'},contacts:[],documents:[],statistics:[],activity:[],summary:{invoices:[],offers:[],time:{hours:0,invoiced_hours:0}}}});
   await new Promise(r=>setTimeout(r,150));return route.fulfill({json:{items:[],tracker:null}});
  });
  await context.addInitScript(mode=>{localStorage.setItem('binso.theme.mode',mode);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-09'}));window.loadingFrames=[];const capture=()=>{const visible=selector=>{const el=document.querySelector(selector);return !!el&&el.getBoundingClientRect().height>0&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none';};window.loadingFrames.push({at:performance.now(),phase:['.app-launch-screen','.app-session-loading','.app-launch','.app-root'].filter(visible),content:document.querySelector('.page-container')?.innerText??'',visibleLoadingCopy:[...document.querySelectorAll('.page-container *')].some(el=>el.childElementCount===0&&/\b(?:wird|werden)\b.*\b(?:geladen|abgerufen)\b/i.test(el.textContent??'')&&!el.closest('.sr-only,.visually-hidden')&&el.checkVisibility()),iconWidth:document.querySelector('.app-start-icon')?parseFloat(getComputedStyle(document.querySelector('.app-start-icon')).width):null,iconAnimation:document.querySelector('.app-start-icon')?getComputedStyle(document.querySelector('.app-start-icon')).animationName:null});requestAnimationFrame(capture)};requestAnimationFrame(capture)},theme);
  let page=await context.newPage();
  async function measure(label,action,ready='Keine Kunden erfasst'){
   const before=authCalls,requestsBefore={...calls};await action();await page.getByText(ready,{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.app-launch-screen,.app-session-loading,.app-launch'));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const frames=await page.evaluate(()=>window.loadingFrames),readyFrame=frames.find(f=>f.content.includes(ready)&&!f.phase.includes('.app-launch-screen')&&!f.phase.includes('.app-launch'));
   const phases=[...new Set(frames.map(f=>f.phase.join(',')))];const durations={};
   for(let i=0;i<frames.length-1;i++)for(const phase of frames[i].phase)if(phase!=='.app-root')durations[phase]=(durations[phase]||0)+frames[i+1].at-frames[i].at;
   const row={theme,viewport,label,firstMeaningfulMs:readyFrame?.at,contentReadyMs:frames.find(f=>f.content.includes(ready))?.at,authRequests:authCalls-before,requests:Object.fromEntries(Object.entries(calls).map(([p,n])=>[p,n-(requestsBefore[p]||0)]).filter(([,n])=>n)),phases,loaderDurationMs:durations,startup:frames.find(f=>f.iconWidth)};results.push(row);
   if(!baseline){assert(!phases.some(p=>p.includes('.app-session-loading')||p.split(',').includes('.app-launch')),'No retired/sequential start loader');assert.equal(row.authRequests,1,'One fresh auth check per page startup');assert.ok(!frames.some(frame=>frame.visibleLoadingCopy),'No visible intermediate loading copy during cold/refresh/reopen');}
   await page.screenshot({path:output+'/'+theme+'-'+viewport.width+'-'+label+'.png'});
  }
  await measure('cold',()=>page.goto(base+'/kunden'));
  if(!baseline){
   // Separate real readiness events, not fixed sleeps: the profile may arrive
   // well before the ledger. Neither may reveal an empty first dashboard.
   let releaseProfile,releaseDashboard;
   profileGate=new Promise(resolve=>{releaseProfile=resolve});dashboardGate=new Promise(resolve=>{releaseDashboard=resolve});
   const profileRequested=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/settings/profile');
   const dashboardRequested=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/dashboard');
   try{
    await page.goto(base+'/dashboard');await Promise.all([profileRequested,dashboardRequested]);
    assert.equal(await page.locator('.app-root').isVisible(),false,'Identity alone cannot reveal placeholder identity or an empty dashboard');
    assert.equal(await page.locator('.app-launch-screen').isVisible(),true,'Existing launch surface covers first-page readiness');
    const profileReceived=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/settings/profile');
    releaseProfile();await (await profileReceived).finished();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.locator('.app-root').isVisible(),false,'A completed profile cannot expose an unfinished ledger');
    assert.equal(await page.locator('.app-launch-screen').isVisible(),true,'The existing launch surface still covers the held ledger');
    assert.equal(await page.locator('.bo-page-heading h1').filter({hasText:'Fixture'}).count(),0,'The personal heading is withheld until both profile and ledger are ready');
    releaseDashboard();await page.locator('.bo-cash-overview').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('.app-launch-screen'));
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await page.locator('.bo-dashboard-overview .loading-state').count(),0,'The first visible dashboard already includes its restored KPI period');
    const exposed=await page.evaluate(()=>window.loadingFrames.filter(frame=>frame.phase.includes('.app-root')&&frame.content.includes('Fixture')));
    assert(exposed.length>0);assert(exposed.every(frame=>frame.content.includes('Umsatz')),'No visible greeting-only intermediate dashboard');
   }finally{releaseProfile();releaseDashboard();profileGate=null;dashboardGate=null;}
   await page.goto(base+'/kunden');await page.getByText('Keine Kunden erfasst',{exact:true}).waitFor();
  }
  assert.equal(await page.locator('.records-inline-controls').count(),1,'The allowed customer controls are actually mounted before the expiry check');
  if(!baseline)assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'),'/manifest-app.webmanifest','Actual customer routes use the app manifest');
  if(!baseline){const startup=results.at(-1).startup;assert.equal(startup?.iconWidth,80,'The approved original icon keeps one size on every viewport');assert.equal(startup?.iconAnimation,'none','Startup never pulses or scales');assert.ok((await page.evaluate(()=>window.loadingFrames)).filter(frame=>frame.iconWidth).every(frame=>frame.iconWidth===80&&frame.iconAnimation==='none'),'Every sampled startup frame retains the same icon geometry');}
  await measure('refresh',()=>page.reload());
  await page.evaluate(()=>{window.shellBefore=document.querySelector('.app-root');window.navBefore=document.querySelector('.bottom-nav');window.loadingFrames=[];});const beforeNav=authCalls,navCalls={...calls};
  const start=await page.evaluate(()=>performance.now());await page.locator('.app-sidebar a[href="/produkte"]').evaluate(el=>el.click());await page.getByText('Keine Produkte erfasst',{exact:true}).waitFor();
  const navigation=await page.evaluate(t=>({ms:performance.now()-t,shellPreserved:window.shellBefore===document.querySelector('.app-root'),navigationPreserved:window.navBefore===document.querySelector('.bottom-nav'),phases:[...new Set(window.loadingFrames.map(f=>f.phase.join(',')))]}),start);
  results.push({theme,viewport,label:'navigation',...navigation,authRequests:authCalls-beforeNav,requests:Object.fromEntries(Object.entries(calls).map(([p,n])=>[p,n-(navCalls[p]||0)]).filter(([,n])=>n))});
  if(!baseline){assert(navigation.shellPreserved&&navigation.navigationPreserved,'Navigation DOM persists');assert(!navigation.phases.some(p=>p.includes('.app-launch-screen')),'No internal splash');assert.equal(authCalls-beforeNav,0,'Warm route uses bounded in-memory session');assert.ok(!(await page.evaluate(()=>window.loadingFrames)).some(frame=>frame.visibleLoadingCopy),'Page changes never flash visible loading copy');}
  const beforeBackRequests=calls['/api/customers']??0;
  await page.goBack();await page.getByText('Keine Kunden erfasst',{exact:true}).waitFor();
  if(!baseline){await page.waitForLoadState('networkidle');assert.equal(calls['/api/customers']??0,beforeBackRequests,'A fresh same-session return reuses customer data without another GET');}
  if(!baseline)assert(await page.evaluate(()=>window.navBefore===document.querySelector('.bottom-nav')),'Back navigation retains navigation');
  // Use an actual rendered record link to exercise detail/overview transitions.
  showCustomer=true;await page.reload();await page.locator('a[href="/kunden/fixture"]:visible').first().waitFor();await page.evaluate(()=>{window.navBefore=document.querySelector('.bottom-nav')});
  await page.locator('a[href="/kunden/fixture"]:visible').first().click();await page.waitForURL('**/kunden/fixture');await page.getByRole('heading',{name:/Prüffirma AG/}).first().waitFor();
  const detailBack=page.getByRole('link',{name:'Kunden',exact:true}).and(page.locator('.mobile-back,.desktop-back')).filter({visible:true});assert.equal(await detailBack.count(),1,'The contextual mobile or desktop header exposes one visible return action');await detailBack.click();await page.waitForURL('**/kunden');
  if(!baseline)assert(await page.evaluate(()=>window.navBefore===document.querySelector('.bottom-nav')),'Detail/overview retains navigation');showCustomer=false;
  // PWA-like close/reopen of the same browser context, not physical installation.
  await page.close();page=await context.newPage();await measure('reopen',()=>page.goto(base+'/kunden'));
  delay=1200;await measure('slow-refresh',()=>page.reload());delay=350;
  authMode='expired';await page.reload();await page.getByText('Deine Sitzung ist beendet. Bitte melde dich erneut an.',{exact:true}).waitFor();assert.equal(await page.locator('.records-inline-controls').count(),0,'Expired session hides business content');
  authMode='error';await page.reload();await page.getByText('Initialisierung fehlgeschlagen',{exact:true}).waitFor();authMode='valid';await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText('Keine Kunden erfasst',{exact:true}).waitFor();
  await context.close();
 }
 await writeTestOutput(output+'/measurements.json',JSON.stringify({baseline,browser:process.env.BINSO_UX_BROWSER??'webkit',syntheticAuthDelayMs:350,results,physicalPwa:false},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();server?.kill();await uiAuth.close();}
