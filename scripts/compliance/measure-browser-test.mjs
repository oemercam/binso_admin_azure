import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {measureActionClearance,measureCompliance} from './measure.mjs';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const engine=process.env.BINSO_UX_BROWSER??'chromium';
const browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}: {})});
const output=await fs.mkdtemp(path.join(os.tmpdir(),'binso-header-measure-'));
try{
 const page=await browser.newPage({viewport:{width:320,height:1000}});
 const fixture=padding=>`<style>body{margin:0}.page-container{padding-top:1200px;padding-bottom:${padding}px}.bottom-nav{position:fixed;bottom:0;height:76px;width:100%;background:#eee}button{height:44px}</style><main class="page-container"><button>Action</button></main><nav class="bottom-nav"></nav>`;
 await page.setContent(fixture(160));
 await page.evaluate(()=>{const native=window.scrollTo.bind(window);let calls=0;window.scrollTo=(...args)=>{native(...args);if(++calls===1)requestAnimationFrame(()=>native(0,0));};});
 const settled=await measureActionClearance(page);
 assert(settled.scrollEndEstablished,'A delayed route scroll reset must be retried');
 assert(settled.scrollY>0&&settled.lastActionBottom<settled.navigationTop,'Compare the real document endpoint');
 assert.equal(await page.evaluate(()=>scrollY),0,'Restore the original scroll');
 await page.setContent(fixture(0));
 const overlap=await measureActionClearance(page);
 assert(overlap.scrollEndEstablished&&overlap.lastActionBottom>overlap.navigationTop,'True navigation overlap stays blocking');
 // Native closed details can retain descendant layout rectangles without painting
 // their links. Both closed and genuinely open/overlapping states must be measured.
 const disclosureFixture=(padding,open)=>fixture(padding).replace('<button>Action</button>',`<button>Action</button><details ${open?'open':''}><summary>Sections</summary><nav>${Array.from({length:12},()=>'<section><a href="#" style="display:flex;min-height:52px">Destination</a></section>').join('')}</nav></details>`);
 await page.setContent(disclosureFixture(160,false));
 const closedDisclosure=await measureActionClearance(page);
 assert(closedDisclosure.scrollEndEstablished&&closedDisclosure.lastActionBottom<closedDisclosure.navigationTop,'Unpainted links in closed native details cannot fabricate an overlap');
 await page.setContent(disclosureFixture(160,true));
 const openDisclosure=await measureActionClearance(page);
 assert(openDisclosure.scrollEndEstablished&&openDisclosure.lastActionBottom<openDisclosure.navigationTop,'Open native details with adequate clearance pass');
 await page.setContent(disclosureFixture(0,true));
 const obstructedDisclosure=await measureActionClearance(page);
 assert(obstructedDisclosure.scrollEndEstablished&&obstructedDisclosure.lastActionBottom>obstructedDisclosure.navigationTop,'Real overlap in an open native menu remains blocking');
 await page.evaluate(()=>{window.scrollTo=()=>{};});
 const blocked=await measureActionClearance(page);
 assert.equal(blocked.scrollEndEstablished,false,'Unreachable endpoint cannot pass as measured geometry');
 await page.setViewportSize({width:1440,height:1000});
 const notification='<button class="desktop-notification-button">Bell</button>',avatar='<button class="avatar-button">Account</button>',search='<button class="desktop-global-search" aria-label="Search">Search</button>';
 const normalActions=search+notification+avatar;
 const header=(actions,location='')=>`<div class="desktop-appbar">${location}<button class="desktop-navigation-toggle" aria-controls="customer-desktop-navigation">Navigation</button><div class="desktop-appbar-actions">${actions}</div></div>`;
 const checkHeader=async(actions,state,location)=>{
  await page.setContent(header(actions,location));
  const evidence=await measureCompliance(page,{output,route:'/dashboard',theme:'light',width:page.viewportSize().width,state,engine});
  return evidence.checks.filter(c=>c.id==='UX-LAY-003');
 };
 assert.equal((await checkHeader(normalActions,'header-breadcrumb','<div class="workspace-location"><a href="/dashboard">Workspace</a><span>/ Customers</span></div>'))[0].status,'passed','The ZIP workspace breadcrumb is navigation, not a business action');
 assert.equal((await checkHeader(normalActions,'header-fake-breadcrumb','<div class="workspace-location"><a href="/zahlungen">Pay</a></div>'))[0].status,'failed','The breadcrumb owner cannot authorize arbitrary business destinations');
 const normal=await checkHeader(normalActions,'header-normal');
 assert.equal(normal.length,1,'The actual desktop action owner must produce evidence');
 assert.equal(normal[0].status,'passed','Approved search, notifications and account occupy the shared right action group');
 assert.equal((await checkHeader(normalActions+'<button>Extra</button>','header-extra'))[0].status,'failed','Additional business actions must fail');
 assert.equal((await checkHeader(search+notification+'<button>Wrong replacement</button>','header-replacement'))[0].status,'failed','Counting controls cannot approve an unrelated replacement');
 assert.equal((await checkHeader(search+'<a class="desktop-header-timer" href="/zeit">01:24:36</a>'+notification+avatar,'header-timer'))[0].status,'failed','Retired header timers cannot return beside the existing reminder');
 assert.equal((await checkHeader(search+'<a class="desktop-header-timer" href="/zahlungen">01:24:36</a>'+notification+avatar,'header-fake-timer'))[0].status,'failed','A timer class cannot authorize a different business destination');
 assert.equal((await checkHeader(search+search+notification+avatar,'header-duplicate-search'))[0].status,'failed','Duplicate allowed roles remain blocking');
 assert.equal((await checkHeader(notification+avatar,'header-missing-search'))[0].status,'failed','The approved global search is required, not just permitted');
 assert.equal((await checkHeader(normalActions+'<button hidden>Hidden</button>','header-hidden'))[0].status,'passed','Hidden controls are excluded from visible actions');
 await page.setViewportSize({width:1024,height:1000});
 assert.equal((await checkHeader(normalActions,'header-breakpoint'))[0].status,'passed','The desktop criterion includes the exact 1024px breakpoint');
 await page.setViewportSize({width:1023,height:1000});
 assert.equal((await checkHeader(normalActions+'<button>Mobile</button>','header-mobile')).length,0,'The desktop criterion starts at 1024px');
 // Counts are view-specific; the latest cash analysis never permits the retired fourth KPI.
 await page.route('https://metric-fixture.invalid/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 const kpis=async(route,owner,count)=>{await page.goto('https://metric-fixture.invalid'+route);await page.setContent('<section class="'+owner+'"><div class="bo-metric-tiles">'+Array.from({length:count},(_,i)=>'<div class="metric">Metric '+i+'</div>').join('')+'</div></section>');const evidence=await measureCompliance(page,{output,route,theme:'light',width:page.viewportSize().width,state:'kpis-'+count,engine});const checks=evidence.checks.filter(check=>check.id==='UX-FIN-001');assert.equal(checks.length,1,'The actual KPI owner must emit evidence');return checks[0].status;};
 assert.equal(await kpis('/finanzen/analyse','bo-statistics',3),'passed');
 for(const count of [2,4])assert.equal(await kpis('/finanzen/analyse','bo-statistics',count),'failed','Missing or retired extra analysis KPIs stay blocking');
 for(const route of ['/dashboard','/finanzen']){assert.equal(await kpis(route,'bo-cash-overview',4),'passed');for(const count of [3,5])assert.equal(await kpis(route,'bo-cash-overview',count),'failed','The compact overview retains its exact four metrics');}
 assert.equal(await kpis('/kunden/customer-one','bo-statistics',3),'passed');assert.equal(await kpis('/kunden/customer-one','bo-statistics',4),'failed');
 for(const width of [390,1100,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});
  const background=theme==='light'?'#fff':'#000',oldSurface=theme==='light'?'#f5f6f8':'#141414';
  for(const surface of ['--color-bg','--app-surface']){
   await page.setContent(`<style>:root{--color-bg:${background};--app-surface:${oldSurface}}body{background:var(--color-bg)}.bo-statistics{height:120px;background:var(${surface})}</style><section class="bo-statistics"></section>`);
   const evidence=await measureCompliance(page,{output,route:'/finanzen/analyse',theme,width,state:'palette-'+surface,engine});
   const palette=evidence.checks.filter(check=>check.id==='UX-FIN-010');assert.equal(palette.length,1);
   assert.equal(palette[0].status,surface==='--color-bg'?'passed':'failed','The ZIP canvas passes and the superseded gray surface stays blocking at every viewport');
  }
 }
 // RecordsControls now owns these classes; a stale selector must not silently
 // leave the real mobile toolbar outside the geometry gate.
 await page.setViewportSize({width:390,height:1000});
 const toolbar=({reverse=false,stack=false,tabsAbove=false,hidden=false}={})=>`<style>body{margin:0}.records-search-row{display:flex;${stack?'flex-direction:column;':''}}.searchbox{display:block;width:240px;height:44px}.records-filter-action{width:44px;height:44px;${hidden?'display:none;':''}}.tabs{height:30px}</style><div class="records-inline-controls">${tabsAbove?'<div class="tabs">Tabs</div>':''}<div class="records-search-row">${reverse?'<button class="records-filter-action">Filter</button>':''}<label class="searchbox">Search</label>${reverse?'':'<button class="records-filter-action">Filter</button>'}</div>${tabsAbove?'':'<div class="tabs">Tabs</div>'}</div>`;
 const toolbarCheck=async options=>{await page.setContent(toolbar(options));const result=await measureCompliance(page,{output,route:'/kunden',theme:'light',width:390,state:'toolbar-'+JSON.stringify(options),engine});return result.checks.filter(check=>check.id==='UX-CTL-001');};
 assert.equal((await toolbarCheck({}))[0].status,'passed','The current RecordsControls owner emits mobile geometry evidence');
 for(const options of [{reverse:true},{stack:true},{tabsAbove:true}])assert.equal((await toolbarCheck(options))[0].status,'failed','Wrong order, stacked controls and misplaced tabs stay blocking');
 assert.equal((await toolbarCheck({hidden:true})).length,0,'An invisible filter is not evidence of a measured control pair');
 await page.close();
 console.log('Scroll-end, desktop-header, exact per-view KPI and ZIP canvas/old-gray-surface adversaries passed. Engine: '+engine);
}finally{await browser.close();await fs.rm(output,{recursive:true,force:true});}
