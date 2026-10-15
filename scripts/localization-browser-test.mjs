import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const base='http://127.0.0.1:3370',output=process.env.BINSO_LOCALIZATION_OUTPUT??await fs.mkdtemp(path.join(os.tmpdir(),'binso-localization-'));
await fs.mkdir(output,{recursive:true,mode:0o700});
const server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3370'],{env:{...process.env,PORT:'3370',HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
let logs='',browser;server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);
const messages=JSON.parse(await fs.readFile('lib/locales/messages.json','utf8'));
const text=(source,locale)=>locale==='de'?source:messages[source][{en:0,fr:1,it:2}[locale]];
const results=[];
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(attempt>240||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true});
 for(const width of [390,768,1440])for(const locale of ['de','fr','it','en']){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addCookies([{name:'binso_demo',value:'1',url:base},{name:'binso_operator_demo',value:'1',url:base}]);
  await context.route('**/api/**',route=>{const pathname=new URL(route.request().url()).pathname;return route.fulfill({json:pathname==='/api/auth/session'?{authenticated:true,demo:true,user:{id:'fixture'},tenant:{id:'fixture',role:'owner',plan:'pro'}}:pathname==='/api/settings/profile'?{item:{display_name:'Fixture Person',language:locale}}:{items:[],tracker:null}})});
  const faults=[],cancelledReloadPrefetches=[];let reloading=false;
  const trackedPage=async()=>{const next=await context.newPage();next.on('pageerror',error=>{
   // WebKit reports old-document speculative RSC fetches as page errors when
   // an explicit full reload cancels them. Keep startup/application errors and
   // the same error outside that reload phase fatal; retain cancellation evidence.
   if(reloading&&error.message.includes('_rsc=')&&error.message.includes('due to access control checks.'))cancelledReloadPrefetches.push(error.message);
   else faults.push(error.message);
  });return next};
  let page=await trackedPage();
  await page.goto(base+'/?lang='+locale,{waitUntil:'networkidle'});await page.locator('.hero').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale+'-CH');
  const selector=page.locator('.locale-switcher select:visible').first();await selector.selectOption(locale==='en'?'fr':'en');
  const chosen=locale==='en'?'fr':'en';await page.waitForFunction(code=>document.documentElement.lang===code+'-CH',chosen);
  await page.waitForLoadState('networkidle');reloading=true;try{await page.reload({waitUntil:'networkidle'})}finally{reloading=false}assert.equal(await page.locator('html').getAttribute('lang'),chosen+'-CH','Choice survives reload');
  for(const route of ['/?lang='+locale,'/dashboard?lang='+locale,'/operator?lang='+locale,'/wartung?lang='+locale,'/missing-localization-route?lang='+locale]){
   await page.waitForLoadState('networkidle');assert.deepEqual(faults,[],'No runtime failures before an isolated route reset');
   page.removeAllListeners('pageerror');await page.close();page=await trackedPage();
   await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('h1:visible').first().waitFor();
   // Public 404 is outside the locale-query matcher; the selected cookie remains authoritative.
   assert.equal(await page.locator('html').getAttribute('lang'),locale+'-CH');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,route+' '+locale+' '+width+' overflow');
   if(route.startsWith('/dashboard')){
    const navigation=page.locator(width<=1100?'.bottom-nav':'.app-sidebar');
    assert.equal((await navigation.locator('a[href="/kunden"] span').first().textContent()).trim(),text('Kunden',locale));
    await page.locator('button.avatar-button:visible').first().click();
    const accountLanguage=page.locator('.locale-switcher select:visible').first();await accountLanguage.waitFor();assert.equal(await accountLanguage.inputValue(),locale);await page.keyboard.press('Escape');
   }
   if(route.startsWith('/?')){assert.equal((await page.locator('.hero h1').textContent()).replace(/\s/g,''),(text('Dein Büro.',locale)+text('Einfach dabei.',locale)).replace(/\s/g,''));}if(route.startsWith('/?'))await page.screenshot({path:output+'/landing-'+locale+'-'+width+'.png',fullPage:true});
  }
  assert.deepEqual(faults,[],'No uncaught browser errors');results.push({locale,width,passed:true,cancelledReloadPrefetches});await context.close();
 }
 await fs.writeFile(output+'/results.json',JSON.stringify(results,null,2),{flag:'wx',mode:0o600});console.log('Four-language landing/customer/operator/404, persistent selection and responsive overflow checks passed.');
}finally{await browser?.close();server.kill()}
