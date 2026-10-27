import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const value=probe.address().port;probe.close(()=>resolve(value));});});
const base='http://localhost:'+port,output=process.env.BINSO_SURFACE_OUTPUT??'.qa/surface-standard';
await fs.mkdir(output,{recursive:true});
// Synthetic HTTP responses only. The real API/transaction is tested separately
// by company-setup-cases.mjs in the disposable migrated registration database.
const env={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_surface_fixture',PORT:String(port),HOSTNAME:'127.0.0.1'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
const results=[];
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(attempt>100||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
 for(const engine of ['chromium','webkit']){
  const browser=await engines[engine].launch({headless:true});
  try{for(const [width,height] of [[390,844],[820,1180],[1440,1000]])for(const colorScheme of ['light','dark']){
   console.log('Surface case',engine,width,colorScheme);
   const context=await browser.newContext({viewport:{width,height},colorScheme,serviceWorkers:'block'});
   await context.addCookies([{name:'binso_surface_fixture',value:'synthetic-not-a-session',url:base}]);
   await context.addInitScript(()=>{localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));});
   let saved=0;
   let company={name:'Fixture AG',legal_name:'',street:'Testweg',building_number:'2',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',qr_iban:'',vat_rate:8.1,payment_terms_days:30};
   await context.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname,respond=json=>route.fulfill({json});
    if(path==='/api/auth/session')return respond({authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture-company',role:'owner',plan:'pro'}});
    if(path==='/api/settings/profile')return respond({item:{id:'fixture',name:'Fixture',display_name:'Fixture',email:'fixture@example.invalid'}});
    if(path==='/api/time-tracker')return respond({item:null});
    if(path==='/api/settings/company'){
     if(route.request().method()==='PATCH'){const body=route.request().postDataJSON();assert.equal(body.completeCompanySetup,true);assert.equal(body.vatRate,undefined);assert.equal(body.paymentTermsDays,undefined);saved++;company={...company,name:body.name};}
     return respond({item:company});
    }
    return respond({items:[],item:{},stats:{},unreadCount:0});
   });
   const errors=[];
   const trackedPage=async()=>{const next=await context.newPage();next.on('pageerror',error=>errors.push(String(error)));return next;};
   let page=await trackedPage();
   // Match the existing UX suite: fixture document resets use a fresh page.
   // A hard goto can cancel WebKit's old-document Next RSC prefetch scheduler.
   const resetScenario=async()=>{await page.waitForLoadState('networkidle');assert.deepEqual(errors,[],'Runtime errors before fixture reset');page.removeAllListeners('pageerror');await page.close();page=await trackedPage();};
   await page.goto(base+'/einstellungen/firma?setup=1&returnTo=%2Fdashboard');
   const form=page.locator('main.page-container > .form-page');await form.waitFor();
   await page.getByLabel('Firmenname',{exact:true}).fill('Changed fixture AG');
   assert.equal(await form.getByLabel('IBAN',{exact:true}).count(),1,'All required sections share the page');
   assert.equal(await form.getByText('Adresse',{exact:true}).count(),1);
   assert.equal(await form.getByText('Zahlungskonto',{exact:true}).count(),1);
   assert.equal(await page.locator('[role=dialog]:visible').count(),0,'The full editor is a page, not a modal');
   assert.equal(await form.locator('.sheet-header,h1').count(),0,'Existing shell owns the heading');
   assert.equal(await form.getByRole('button',{name:'Weiter',exact:true}).count(),0,'No intermediate step');
   const action=form.getByRole('button',{name:'Angaben bestätigen',exact:true});
   const geometry=await action.evaluate(node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,height:window.visualViewport?.height??window.innerHeight};});
   assert.ok(geometry.scroll<=geometry.width,JSON.stringify(geometry));
   assert.ok(geometry.top>=0&&geometry.bottom<=geometry.height,JSON.stringify(geometry));
   await form.getByLabel('IBAN',{exact:true}).scrollIntoViewIfNeeded();await form.getByLabel('IBAN',{exact:true}).focus();
   await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}.png`,fullPage:true});
   await action.click();await page.getByRole('status').filter({hasText:'Deine Rechnungsangaben sind vollständig'}).waitFor();
   assert.equal(saved,1);
   await resetScenario();
   await page.goto(base+'/kunden/neu');
   const editor=page.locator('main.page-container > .form-page');await editor.waitFor();
   await editor.getByLabel('Kundenname *',{exact:true}).fill('Draft customer');
   assert.equal(await page.locator('[role=dialog]:visible').count(),0);
   assert.equal(await editor.locator('.sheet-header').count(),0);
   const next=editor.getByRole('button',{name:'Weiter',exact:true});
   const nextBox=await next.boundingBox();assert.ok(nextBox&&nextBox.y>=0&&nextBox.y+nextBox.height<=height,'Wizard actions stay within the page');
   await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}-customer.png`,fullPage:true});
   assert.equal(await editor.getAttribute('data-unsaved'),'true','Changed customer data owns the dirty guard');
   await editor.getByRole('button',{name:'Abbrechen',exact:true}).click();
   const discard=page.getByRole('alertdialog',{name:'Änderungen verwerfen?',exact:true});
   try{await discard.waitFor();}catch(error){await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}-discard-failure.png`,fullPage:true});console.log(await page.locator('body').innerText());throw error;}
   await discard.getByRole('button',{name:'Abbrechen',exact:true}).click();
   assert.equal(await editor.getByLabel('Kundenname *',{exact:true}).inputValue(),'Draft customer');
   await page.evaluate(()=>history.back());await discard.waitFor();
   await discard.getByRole('button',{name:'Abbrechen',exact:true}).click();
   assert.equal(await editor.getByLabel('Kundenname *',{exact:true}).inputValue(),'Draft customer','Native back cancellation retains the draft');
   await page.setViewportSize({width:320,height:400});
   await editor.getByLabel('Kundenname *',{exact:true}).focus();
   await page.waitForFunction(()=>{const button=[...document.querySelectorAll('.form-page button')].find(node=>node.textContent==='Weiter');if(!button)return false;const box=button.getBoundingClientRect();return box.top>=0&&box.bottom<=400;});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=320),'Narrow reduced viewport remains scrollable without horizontal overflow');
   await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}-reduced-viewport.png`,fullPage:true});
   await editor.getByRole('button',{name:'Abbrechen',exact:true}).click();await discard.getByRole('button',{name:'Verwerfen',exact:true}).click();
   await page.waitForURL(base+'/kunden');await resetScenario();
   await page.goto(base+'/einstellungen/sicherheit');
   const passwordTrigger=page.getByRole('button',{name:'Passwort ändern',exact:true});
   await passwordTrigger.focus();await page.keyboard.press('Enter');
   const short=page.getByRole('dialog',{name:'Passwort ändern',exact:true});await short.waitFor();
   const shortBox=await short.boundingBox();assert.ok(shortBox&&shortBox.height<height&&shortBox.y>=0,'Short actions remain content-sized');
   await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}-short-action.png`,fullPage:true});
   await page.keyboard.press('Escape');await short.waitFor({state:'hidden'});
   await page.waitForFunction(node=>document.activeElement===node,await passwordTrigger.elementHandle());
   assert.equal(await passwordTrigger.evaluate(node=>document.activeElement===node),true,'Closing the short action restores its trigger');
   await resetScenario();await page.goto(base+'/zeit');
   await page.getByRole('button',{name:'Zeit erfassen',exact:true}).filter({visible:true}).click();
   const manual=page.getByRole('region',{name:'Zeit erfassen',exact:true});await manual.waitFor();
   await manual.getByLabel('Beschreibung',{exact:true}).fill('Synthetic unsaved time');
   assert.equal(await manual.getAttribute('data-unsaved'),'true','Manual time preserves its recovery dirty contract');
   await page.setViewportSize({width:320,height:400});
   await manual.getByLabel('Beschreibung',{exact:true}).focus();
   await page.waitForFunction(()=>{const button=[...document.querySelectorAll('.form-page button')].find(node=>node.textContent==='Speichern');const box=button?.getBoundingClientRect();return box&&box.top>=0&&box.bottom<=400;});
   await page.screenshot({path:`${output}/${engine}-${width}-${colorScheme}-manual-time.png`,fullPage:true});
   await manual.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('alertdialog',{name:'Änderungen verwerfen?',exact:true}).getByRole('button',{name:'Verwerfen',exact:true}).click();
   await manual.waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);
   results.push({engine,width,height,colorScheme,wholePage:true,footerVisible:true,atomicSave:true});
   await context.close();
  }}finally{await browser.close();}
 }
 await fs.writeFile(output+'/results.json',JSON.stringify({results,limitations:['Browser emulation is not physical Safari/iOS-PWA or a real software keyboard.']},null,2));
 console.log('Surface standard: Chromium/WebKit × phone/tablet/desktop × light/dark passed. Physical iOS/PWA acceptance remains separate.');
}finally{server.kill();await fs.writeFile(output+'/server.log',logs);}
