import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
import {localeTestModuleUrl} from './data-test-modules.mjs';
const {translateMessage}=await import(await localeTestModuleUrl());
const widths=(process.env.BINSO_SURFACE_WIDTHS??'390,820,1440').split(',').map(Number),locales=(process.env.BINSO_SURFACE_LOCALES??'de').split(','),enginesToRun=(process.env.BINSO_SURFACE_ENGINES??'chromium,webkit').split(',');
assert.ok(widths.every(width=>[320,375,390,430,768,820,1024,1440].includes(width)));assert.ok(locales.every(locale=>['de','fr','it','en','tr'].includes(locale)));assert.ok(enginesToRun.every(engine=>['chromium','webkit'].includes(engine)));
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const value=probe.address().port;probe.close(()=>resolve(value));});});
const base='http://localhost:'+port,output=process.env.BINSO_SURFACE_OUTPUT??'.qa/surface-standard';
await fs.mkdir(output,{recursive:true});
// Synthetic HTTP responses only. The real API/transaction is tested separately
// by company-setup-cases.mjs in the disposable migrated registration database.
const env={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_surface_fixture',PORT:String(port),HOSTNAME:'127.0.0.1'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',...(process.env.BINSO_SURFACE_DEV==='1'?['dev','--webpack']:['start']),'--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
const results=[];
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(attempt>100||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
 for(const engine of enginesToRun){
  const browser=await engines[engine].launch({headless:true});
  try{for(const width of widths)for(const colorScheme of ['light','dark'])for(const locale of locales){
   const height=width<=430?844:width<=820?1180:1000,t=value=>translateMessage(value,locale);
   console.log('Surface case',engine,width,colorScheme,locale);
   const context=await browser.newContext({viewport:{width,height},colorScheme,serviceWorkers:'block'});
   await context.addCookies([{name:'binso_surface_fixture',value:'synthetic-not-a-session',url:base},{name:'binso_locale',value:locale,url:base}]);
   await context.addInitScript(()=>{localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));});
   let saved=0,projectsCreated=0;const createdProjectId='11111111-1111-4111-a111-111111111111';
   let company={name:'Fixture AG',legal_name:'',street:'Testweg',building_number:'2',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',qr_iban:'',vat_rate:8.1,payment_terms_days:30};
   await context.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname,respond=json=>route.fulfill({json});
    if(path==='/api/auth/session')return respond({authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture-company',role:'owner',plan:'pro'}});
    if(path==='/api/settings/profile')return respond({item:{id:'fixture',name:'Fixture',display_name:'Fixture',email:'fixture@example.invalid',language:locale,theme:colorScheme}});
    if(path==='/api/time-tracker')return respond({item:null});
    if(path==='/api/projects'&&route.request().method()==='POST'){const body=route.request().postDataJSON();assert.equal(body.billingTerms.model,'time');assert.equal(body.billingTerms.hourlyRate,'120.00');projectsCreated++;return respond({item:{id:createdProjectId}});}
    if(path==='/api/projects/'+createdProjectId)return respond({item:{id:createdProjectId,name:'Fixture created project',status:'planned',hours_budget:null,cost_budget:null,budget_currency:null,version:1,customer_id:null,customer_name:null,notes:''},time:[],totals:{hours:0,invoiced_hours:0,entries:0},invoices:[]});
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
   const form=page.locator('main.page-container > [data-form-page-root]');await form.waitFor();
   await page.getByLabel(t('Firmenname'),{exact:true}).fill('Changed fixture AG');
   assert.equal(await form.getByLabel(t('IBAN'),{exact:true}).count(),1,'All required sections share the page');
   assert.equal(await form.getByText(t('Adresse'),{exact:true}).count(),1);
   assert.equal(await form.getByText(t('Zahlungskonto'),{exact:true}).count(),1);
   assert.equal(await page.locator('[role=dialog]:visible').count(),0,'The full editor is a page, not a modal');
   assert.equal(await form.locator('.sheet-header,h1').count(),0,'Existing shell owns the heading');
   assert.equal(await form.getByRole('button',{name:t('Weiter'),exact:true}).count(),0,'No intermediate step');
   const action=form.getByRole('button',{name:t('Einrichtung abschliessen'),exact:true});
   const geometry=await action.evaluate(node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,height:window.visualViewport?.height??window.innerHeight};});
   assert.ok(geometry.scroll<=geometry.width,JSON.stringify(geometry));
   assert.ok(geometry.top>=0&&geometry.bottom<=geometry.height,JSON.stringify(geometry));
   await form.getByLabel(t('IBAN'),{exact:true}).scrollIntoViewIfNeeded();await form.getByLabel(t('IBAN'),{exact:true}).focus();
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}.png`,fullPage:true});
   page.once('dialog',async dialog=>{assert.equal(dialog.type(),'beforeunload');await dialog.accept()});await page.reload();await form.getByLabel(t('Firmenname'),{exact:true}).waitFor();await page.waitForFunction(label=>[...document.querySelectorAll('input')].some(input=>input.value===label),'Changed fixture AG');assert.equal(await form.getByLabel(t('Firmenname'),{exact:true}).inputValue(),'Changed fixture AG','Interrupted company setup restores current scoped input');
   await action.click();await page.getByRole('status').filter({hasText:t('Deine Rechnungsangaben sind vollständig')}).waitFor();
   assert.equal(saved,1);
   await resetScenario();
   await page.goto(base+'/kunden/neu');
   const editor=page.locator('main.page-container > [data-form-page-root]');await editor.waitFor();
   await editor.getByLabel(t('Kundenname *'),{exact:true}).fill('Draft customer');
   assert.equal(await editor.getByLabel(t('E-Mail'),{exact:true}).isVisible(),false,'Optional customer data starts collapsed');
   assert.equal(await page.locator('[role=dialog]:visible').count(),0);
   assert.equal(await editor.locator('.sheet-header').count(),0);
   assert.equal(await editor.getByRole('button',{name:t('Weiter'),exact:true}).count(),0,'No customer step before saving');const next=editor.getByRole('button',{name:t('Kunde speichern'),exact:true});
   const nextBox=await next.boundingBox();assert.ok(nextBox&&nextBox.y>=0&&nextBox.y+nextBox.height<=height,'Customer actions stay within the page');
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-customer.png`,fullPage:true});
   await editor.getByLabel(t('Kontaktperson · Vorname *'),{exact:true}).fill('Fixture');
   await editor.getByLabel(t('Kontaktperson · Nachname *'),{exact:true}).fill('Contact');
   const optional=editor.locator('details').filter({has:page.locator('summary',{hasText:t('Weitere Angaben')})});
   await optional.locator('summary').click();await editor.getByLabel(t('E-Mail'),{exact:true}).fill('invalid-address');await optional.locator('summary').click();
   await next.click();await editor.getByLabel(t('E-Mail'),{exact:true}).waitFor({state:'visible'});
   assert.equal(await optional.evaluate(node=>node.open),true,'Native validation opens the collapsed optional section containing the invalid field');
   await editor.getByLabel(t('E-Mail'),{exact:true}).fill('');
   assert.equal(await editor.getAttribute('data-unsaved'),'true','Changed customer data owns the dirty guard');
   await editor.getByRole('button',{name:t('Abbrechen'),exact:true}).click();
   const discard=page.getByRole('alertdialog',{name:t('Änderungen verwerfen?'),exact:true});
   try{await discard.waitFor();}catch(error){await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-discard-failure.png`,fullPage:true});console.log(await page.locator('body').innerText());throw error;}
   await discard.getByRole('button',{name:t('Abbrechen'),exact:true}).click();
   assert.equal(await editor.getByLabel(t('Kundenname *'),{exact:true}).inputValue(),'Draft customer');
   await page.evaluate(()=>history.back());await discard.waitFor();
   await discard.getByRole('button',{name:t('Abbrechen'),exact:true}).click();
   assert.equal(await editor.getByLabel(t('Kundenname *'),{exact:true}).inputValue(),'Draft customer','Native back cancellation retains the draft');
   await page.setViewportSize({width:320,height:400});
   await editor.getByLabel(t('Kundenname *'),{exact:true}).focus();
   await page.waitForFunction(label=>{const button=[...document.querySelectorAll('[data-form-page-root] button')].find(node=>node.textContent===label);if(!button)return false;const box=button.getBoundingClientRect();return box.top>=0&&box.bottom<=400;},t('Kunde speichern'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=320),'Narrow reduced viewport remains scrollable without horizontal overflow');
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-reduced-viewport.png`,fullPage:true});
   await editor.getByRole('button',{name:t('Abbrechen'),exact:true}).click();await discard.getByRole('button',{name:t('Verwerfen'),exact:true}).click();
   await page.waitForURL(base+'/kunden');await resetScenario();
   await page.goto(base+'/einstellungen/sicherheit');
   const passwordTrigger=page.getByRole('button',{name:t('Passwort ändern'),exact:true});
   await passwordTrigger.focus();await page.keyboard.press('Enter');
   const short=page.getByRole('dialog',{name:t('Passwort ändern'),exact:true});await short.waitFor();
   const shortBox=await short.boundingBox();assert.ok(shortBox&&shortBox.height<height&&shortBox.y>=0,'Short actions remain content-sized');
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-short-action.png`,fullPage:true});
   await page.keyboard.press('Escape');await short.waitFor({state:'hidden'});
   await page.waitForFunction(node=>document.activeElement===node,await passwordTrigger.elementHandle());
   assert.equal(await passwordTrigger.evaluate(node=>document.activeElement===node),true,'Closing the short action restores its trigger');
   await resetScenario();await page.goto(base+'/zeit');
   await page.getByRole('button',{name:t('Zeit erfassen'),exact:true}).filter({visible:true}).click();
   const manual=page.getByRole('region',{name:t('Zeit erfassen'),exact:true});await manual.waitFor();
   await manual.getByLabel(t('Beschreibung'),{exact:true}).fill('Synthetic unsaved time');
   assert.equal(await manual.getAttribute('data-unsaved'),'true','Manual time preserves its recovery dirty contract');
   await page.setViewportSize({width:320,height:400});
   await manual.getByLabel(t('Beschreibung'),{exact:true}).focus();
   await page.waitForFunction(label=>{const button=[...document.querySelectorAll('[data-form-page-root] button')].find(node=>node.textContent===label);const box=button?.getBoundingClientRect();return box&&box.top>=0&&box.bottom<=400;},t('Speichern'));
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-manual-time.png`,fullPage:true});
   await manual.getByRole('button',{name:t('Abbrechen'),exact:true}).click();await page.getByRole('alertdialog',{name:t('Änderungen verwerfen?'),exact:true}).getByRole('button',{name:t('Verwerfen'),exact:true}).click();
   await manual.waitFor({state:'hidden'});
   await resetScenario();await page.setViewportSize({width,height});await page.goto(base+'/spesen/neu');
   const expense=page.locator('main.page-container > [data-form-page-root]');await expense.waitFor();
   const legacy=expense.locator('.form-page:not([data-form-page-root])');await legacy.waitFor();
   const legacyGeometry=await legacy.evaluate(node=>({height:node.getBoundingClientRect().height,content:node.scrollHeight,visible:node.clientHeight}));
   assert.ok(legacyGeometry.height>0&&legacyGeometry.content<=legacyGeometry.visible+1,'Legacy expense content card must not inherit the constrained page viewport: '+JSON.stringify(legacyGeometry));
   await expense.getByLabel(t('Beschreibung'),{exact:true}).scrollIntoViewIfNeeded();
   assert.equal(await expense.getByLabel(t('Beschreibung'),{exact:true}).isVisible(),true);
   await page.screenshot({path:`${output}/${engine}-${locale}-${width}-${colorScheme}-expense.png`,fullPage:true});
   await resetScenario();await page.goto(base+'/projekte/neu?returnTo=%2Fprojekte%3Fstatus%3Dplanned');
   const project=page.getByRole('region',{name:t('Auftrag starten'),exact:true});await project.waitFor();
   await project.getByLabel(t('Bezeichnung *'),{exact:true}).fill('Fixture created project');
   const chooseBilling=async model=>{const labels={fixed:'Pauschal/Fixpreis',time:'Nach Aufwand',quantity:'Nach Menge',mixed:'Gemischt',recurring:'Wiederkehrend',milestone:'Nach Meilensteinen'};await project.getByLabel(t('Abrechnungsmodell'),{exact:true}).click();await page.getByRole('option').filter({hasText:t(labels[model])}).click();};
   for(const model of ['fixed','time','quantity','mixed','recurring','milestone']){
    await chooseBilling(model);
    if(['fixed','mixed','recurring'].includes(model))await project.getByLabel(t('Vereinbarter Nettobetrag'),{exact:true}).fill('100');
    if(['time','mixed'].includes(model))await project.getByLabel(t('Stundensatz'),{exact:true}).fill('120');
    if(model==='recurring'){await project.getByLabel(t('Beginn'),{exact:true}).fill('2026-01-31');await project.getByLabel(t('Ende'),{exact:true}).fill('2026-12-31');await project.getByLabel(t('Abrechnungsintervall'),{exact:true}).click();await page.getByRole('option').filter({hasText:t('Quartalsweise')}).click();}
    if(model==='milestone'){await project.getByRole('button',{name:t('Meilenstein hinzufügen'),exact:true}).click();await project.getByLabel(t('Meilenstein'),{exact:true}).fill('Delivered stage');await project.getByLabel(t('Vereinbarter Nettobetrag'),{exact:true}).fill('100');}
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'Billing model '+model+' must not overflow');
    await page.screenshot({path:output+'/'+engine+'-'+locale+'-'+width+'-'+colorScheme+'-billing-'+model+'.png',fullPage:true});
   }
   await project.getByLabel(t('Währung'),{exact:true}).click();await page.getByRole('option').filter({hasText:'EUR'}).click();
   await chooseBilling('time');assert.ok((await project.getByLabel(t('Währung'),{exact:true}).innerText()).includes('EUR'),'Changing the model preserves the explicitly selected currency');
   await project.getByLabel(t('Währung'),{exact:true}).click();await page.getByRole('option').filter({hasText:'CHF'}).click();
   await chooseBilling('time');await project.getByLabel(t('Stundensatz'),{exact:true}).fill('120');
   await project.getByRole('button',{name:t('Auftrag starten'),exact:true}).click();
   await page.waitForURL(url=>url.pathname==='/projekte/'+createdProjectId&&url.searchParams.get('returnTo')==='/projekte?status=planned');
   assert.equal(projectsCreated,1,'A confirmed create opens its detail with the actual caller preserved');
   await page.locator('.mobile-back,.desktop-back').filter({visible:true}).click();
   await page.waitForURL(url=>url.pathname==='/projekte'&&url.searchParams.get('status')==='planned');
   assert.deepEqual(errors,[]);
   results.push({engine,width,height,colorScheme,locale,wholePage:true,footerVisible:true,atomicSave:true});
   await context.close();
  }}finally{await browser.close();}
 }
 await fs.writeFile(output+'/results.json',JSON.stringify({results,limitations:['Browser emulation is not physical Safari/iOS-PWA or a real software keyboard.']},null,2));
 console.log(`Surface standard: ${results.length} cases, engines ${enginesToRun.join('/')}, widths ${widths.join('/')}, locales ${locales.join('/')}, light/dark passed. Physical iOS/PWA acceptance remains separate.`);
}finally{server.kill();await fs.writeFile(output+'/server.log',logs);}
