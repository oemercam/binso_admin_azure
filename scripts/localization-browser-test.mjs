import {verifyConsentRejection} from './privacy-consent-browser.mjs';
import {verifyLanguagePreference} from './language-preference-browser.mjs';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import {selectAppOption,appControlValue} from './app-select-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const base='http://127.0.0.1:3370',output=process.env.BINSO_LOCALIZATION_OUTPUT??await fs.mkdtemp(path.join(os.tmpdir(),'binso-localization-'));
await fs.mkdir(output,{recursive:true,mode:0o700});
const uiAuth=await createUiAuthFixture();
const server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3370'],{env:{...process.env,...uiAuth.env,PORT:'3370',HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
let logs='',browser;server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);
const messages=JSON.parse(await fs.readFile('lib/locales/messages.json','utf8'));
const text=(source,locale)=>locale==='de'?source:messages[source][{en:0,fr:1,it:2}[locale]];
const results=[];
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(attempt>240||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true});
 for(const width of [390,768,1440])for(const locale of ['de','fr','it','en']){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));
  await context.route('**/api/**',route=>{const pathname=new URL(route.request().url()).pathname;return route.fulfill({json:pathname==='/api/auth/session'?{authenticated:true,demo:true,user:{id:'fixture'},tenant:{id:'fixture',role:'owner',plan:'pro'}}:pathname==='/api/settings/profile'?{item:{display_name:'Fixture Person',language:locale}}:pathname==='/api/settings/company'?{item:{name:'Synthetic Localization Company'}}:{items:[],tracker:null}})});
  const faults=[],cancelledReloadPrefetches=[];let reloading=false;
  const trackedPage=async()=>{const next=await context.newPage();next.on('pageerror',error=>{
   // WebKit reports old-document speculative RSC fetches as page errors when
   // an explicit full reload cancels them. Keep startup/application errors and
   // the same error outside that reload phase fatal; retain cancellation evidence.
   if(reloading&&error.message.includes('_rsc=')&&error.message.includes('due to access control checks.'))cancelledReloadPrefetches.push(error.message);
   else faults.push(error.message);
  });next.on('console',message=>{if(/hydration|hydrated|server rendered HTML|react\.dev\/errors\/\d+/i.test(message.text()))faults.push('React hydration/runtime: '+message.text());});return next};
  let page=await trackedPage();
  await page.goto(base+'/?lang='+locale,{waitUntil:'networkidle'});await page.locator('.reference-hero').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),locale+'-CH');
  await verifyConsentRejection(page,text,locale);
  const selector=page.locator('.locale-switcher .app-select-trigger:visible').first();await selectAppOption(selector, locale==='en'?'fr':'en');
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
    const navigation=page.locator(width<=760?'.bottom-nav':'.app-sidebar');
    assert.equal((await navigation.locator('a[href="/kunden"] span').first().textContent()).trim(),text('Kunden',locale));
    await page.locator('button.avatar-button:visible').first().click();
    const accountLanguage=page.locator('.locale-switcher .app-select-trigger:visible').first();await accountLanguage.waitFor();assert.equal(await appControlValue(accountLanguage),locale);await page.keyboard.press('Escape');
   }
   if(route.startsWith('/?')){assert.equal((await page.locator('.reference-hero h1').textContent()).replace(/\s/g,''),(text('Dein Geschäft.',locale)+text('Ein klarer',locale)+text('Überblick.',locale)).replace(/\s/g,''));}if(route.startsWith('/?')){
    const features=page.locator('#funktionen');
    await features.getByRole('tab',{name:text('Finanzen',locale),exact:true}).click();
    await page.waitForFunction(()=>{const image=document.querySelector('#reference-feature-panel img');return image?.complete&&image.naturalWidth>0&&image.getAttribute('src').includes('invoices-desktop-')});
    await features.getByRole('tab',{name:text('Kunden & Verkauf',locale),exact:true}).click();
    await page.waitForFunction(()=>{const image=document.querySelector('#reference-feature-panel img');return image?.complete&&image.naturalWidth>0&&image.getAttribute('src').includes('customers-desktop-')});
    await page.screenshot({path:output+'/landing-'+locale+'-'+width+'.png',fullPage:true});
   }
  }
  await verifyLanguagePreference(page,{base,locale,text});
  assert.deepEqual(faults,[],'No uncaught browser errors');results.push({locale,width,passed:true,cancelledReloadPrefetches,profilePreference:'failure, pending lock, confirmation, reload and account-menu storage verified'});await context.close();
 }
 await fs.writeFile(output+'/results.json',JSON.stringify(results,null,2),{flag:'wx',mode:0o600});console.log('Four-language landing/customer/operator/404, persistent selection and responsive overflow checks passed.');
}finally{await browser?.close();server.kill();await uiAuth.close()}
