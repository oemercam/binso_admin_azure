import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {verifyLegalPage} from './legal-page-browser.mjs';
const output=process.env.BINSO_SYSTEM_STATE_OUTPUT;if(!output)throw Error('Explicit evidence directory required');await fs.mkdir(output,{recursive:true});
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const engine=process.env.BINSO_UX_BROWSER??'chromium';
const base='http://127.0.0.1:3286';
try{await fetch(base+'/api/health');throw Error('Test port occupied')}catch(error){if(error.message==='Test port occupied')throw error;}
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3286'],{env:{...process.env,DATABASE_URL:'',APP_MODE:'local'},stdio:['ignore','pipe','pipe']});let logs='',browser;
server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const walk=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(async x=>x.isDirectory()?walk(path.join(dir,x.name)):path.join(dir,x.name)))).flat();
try{
 for(let n=0;;n++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(n>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 const reporterChunks=[];for(const file of (await walk('.next/static/chunks')).filter(x=>x.endsWith('.js')))if((await fs.readFile(file,'utf8')).includes('/api/telemetry/web-vitals'))reporterChunks.push(path.basename(file));assert.ok(reporterChunks.length,'Locate the actual optional measurement chunk, without stored hashes');
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});const results=[];
 for(const theme of ['light','dark'])for(const width of [320,1440])for(const route of ['/offline','/wartung','/unavailable-revision7-fixture']){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900}});await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({version:2,essential:true,performance:false,updatedAt:new Date().toISOString()}));},theme);
  const page=await context.newPage(),requested=[];page.on('request',request=>requested.push(request.url()));await page.route('**/api/telemetry/web-vitals',route=>route.fulfill({status:202,json:{ok:true}}));
  const response=await page.goto(base+route);assert.equal(response.status(),route.startsWith('/unavailable')?404:200);
  await page.locator('#system-state-title').waitFor();assert.equal(await page.locator('main.auth-workspace[data-layout="message"]').count(),1);assert.equal(await page.locator('.auth-workspace-intro').count(),0,'Recovery has no promotional intro');
  await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No horizontal overflow');assert.equal(await page.getByRole('link',{name:'Zur Website',exact:true}).count(),1);
  assert.ok(!requested.some(url=>reporterChunks.some(file=>url.endsWith('/'+file))),'Optional measurement code is not downloaded before consent');
  await page.screenshot({path:path.join(output,`${theme}-${width}-${route.slice(1)}.png`),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Cookie-/Datenschutz-Einstellungen',exact:true}).click();await page.locator('[role="dialog"][aria-labelledby="privacy-consent-title"]').waitFor();
  await page.setViewportSize({width,height:400});const dialog=page.locator('[role="dialog"][aria-labelledby="privacy-consent-title"]'),box=await dialog.boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=401,'Consent remains within a short landscape viewport');
  const reject=dialog.getByRole('button',{name:'Alle ablehnen',exact:true});await reject.scrollIntoViewIfNeeded();const action=await reject.boundingBox();assert.ok(action&&action.y>=0&&action.y+action.height<=401,'A real consent choice stays scroll-reachable on short screens');
  results.push({route,width,theme,status:'passed',reference:'derived shared recovery layout; not an original-approved visual comparison',consent:'optional chunk absent; footer opens settings'});await context.close();
 }
 for(const theme of ['light','dark'])for(const width of [320,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:900}});await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({version:2,essential:true,performance:false,updatedAt:new Date().toISOString()}));},theme);
  results.push(await verifyLegalPage(await context.newPage(),{base,width,theme,output}));await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2)+'\n');console.log('12 recovery and4 legal-navigation cases passed: real404, responsive themes, consent-gated measurement, settings access and keyboard/deep-link navigation. Physical devices and original-reference/legal approval remain open.');
}finally{await browser?.close();server.kill();}
