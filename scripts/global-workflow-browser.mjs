import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
import {localeTestModuleUrl} from './data-test-modules.mjs';
import {calculationForBrowserPreview} from './billing-completion-browser.mjs';
const {translateMessage}=await import(await localeTestModuleUrl());
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
const base='http://localhost:'+port,output=process.env.BINSO_WORKFLOW_OUTPUT??'.qa/global-workflow';
await fs.mkdir(output,{recursive:true});
const env={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_workflow_fixture'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);
const results=[];
try{
 for(let n=0;;n++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(n>100||server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,200));}
 const browser=await engines.chromium.launch({headless:true});
 try{for(const width of [390,1440])for(const theme of ['light','dark'])for(const locale of (process.env.BINSO_WORKFLOW_LOCALES??'de,fr,it,en,tr').split(',')){
  const t=value=>translateMessage(value,locale),context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,serviceWorkers:'block'});
  await context.addCookies([{name:'binso_workflow_fixture',value:'synthetic-not-a-session',url:base},{name:'binso_locale',value:locale,url:base}]);
  await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false})));
  const id='11111111-1111-4111-a111-111111111111';let customer=null,creates=0;
  await context.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname,reply=json=>route.fulfill({json});
   if(path==='/api/auth/session')return reply({authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture-company',role:'owner',plan:'pro'}});
   if(path==='/api/dashboard')return reply({canFinance:false,canInvoices:false,stats:{},work:null,recent:[]});
   if(path==='/api/projects')return reply({items:[{id:'project-one',name:'Fixture project one',customer_name:'Inline fixture AG',status:'planned',hours:1},{id:'project-two',name:'Fixture project two',customer_name:'Inline fixture AG',status:'active',hours:2}],total:2});
   if(path==='/api/settings/profile')return reply({item:{id:'fixture',display_name:'Fixture',email:'fixture@example.invalid',language:locale,theme}});
   if(path==='/api/settings/company')return reply({item:{name:'Fixture AG',street:'Testweg',building_number:'2',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',vat_rate:8.1,payment_terms_days:30}});
   if(path==='/api/customers'){
    if(route.request().method()==='POST'){const body=route.request().postDataJSON();assert.equal(body.contactFirstName,'Ada');assert.equal(body.contactLastName,'Test');assert.ok(route.request().headers()['idempotency-key']);customer={id,name:body.name};creates++;return reply({item:customer});}
    return reply({items:customer?[customer]:[],total:customer?1:0});
   }
   if(path==='/api/products')return reply({items:[{id:'product-one',name:'Fixture catalog service',unit:'Stück',unit_price:125,vat_rate:2.6,status:'active'}],total:1});
   if(path==='/api/customers/'+id)return reply({item:customer});
   if(path==='/api/documents/preview')return reply({calculation:calculationForBrowserPreview(route.request().postDataJSON())});
   return reply({items:[],item:{},stats:{},unreadCount:0});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  try{
   await page.goto(base+'/angebote/neu');
   await page.getByRole('button',{name:t('Kunde erstellen'),exact:true}).waitFor();
   assert.ok((await page.locator('.wizard-progress').innerText()).includes('1'));
   await page.getByRole('button',{name:t('Kunde erstellen'),exact:true}).click();
   const form=page.locator('main.page-container > [data-form-page-root]');await form.waitFor();
   await form.getByLabel(t('Kundenname *'),{exact:true}).fill('Inline fixture AG');
   await form.getByLabel(t('Kontaktperson · Vorname *'),{exact:true}).fill('Ada');
   await form.getByLabel(t('Kontaktperson · Nachname *'),{exact:true}).fill('Test');
   await form.getByRole('button',{name:t('Kunde speichern'),exact:true}).click();
   await form.waitFor({state:'hidden'});assert.equal(new URL(page.url()).pathname,'/angebote/neu');assert.equal(creates,1);
   await page.getByRole('combobox',{name:t('Kunde auswählen'),exact:true}).filter({visible:true}).waitFor();
   await page.waitForFunction(()=>[...document.querySelectorAll('[role=combobox]')].some(node=>node.textContent.includes('Inline fixture AG')));
   await page.getByRole('button',{name:t('Weiter'),exact:true}).click();
   await page.locator('.document-position-open').first().click();
   const position=page.getByRole('dialog',{name:t('Position bearbeiten'),exact:true});await position.waitFor();
   await position.getByRole('combobox',{name:t('Produkt übernehmen'),exact:true}).click();
   await page.getByRole('option').filter({hasText:'Fixture catalog service'}).click();
   assert.equal(await position.getByLabel(t('Beschreibung'),{exact:true}).inputValue(),'Fixture catalog service');
   assert.equal(await position.getByLabel(t('Einzelpreis'),{exact:true}).inputValue(),'125');
   await position.getByLabel(t('Beschreibung'),{exact:true}).fill('Fixture service');
   await position.getByLabel(t('Einzelpreis'),{exact:true}).fill('100');
   await position.getByRole('button',{name:t('Übernehmen'),exact:true}).click();
   await page.getByRole('button',{name:t('Weiter'),exact:true}).click();
   await page.locator('.document-review').waitFor();
   assert.equal(await page.locator('.invoice-workspace').isVisible(),false,'The mounted editor leaves no empty card in the review');
   assert.equal(await page.getByRole('button',{name:t('Weiter'),exact:true}).count(),0,'Step three is the final review');
   assert.equal(await page.getByRole('button',{name:t('Als Entwurf speichern'),exact:true}).count(),1);
   assert.ok((await page.locator('.document-review').innerText()).includes('Inline fixture AG'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   assert.deepEqual(errors,[]);
   await page.screenshot({path:`${output}/${locale}-${width}-${theme}.png`,fullPage:true,animations:'disabled'});
   const overview=await context.newPage();overview.on('pageerror',error=>errors.push(String(error)));
   await overview.goto(base+'/dashboard');
   await overview.getByRole('button',{name:t('Neu erstellen'),exact:true}).click();
   const menu=overview.getByRole('dialog',{name:t('Neu erstellen'),exact:true});await menu.waitFor();
   const links=menu.getByRole('link');assert.equal(await links.count(),6);
   for(const [index,label] of ['Kunde','Angebot','Auftrag','Rechnung','Zeiteintrag','Ausgabe'].entries())assert.ok((await links.nth(index).innerText()).includes(t(label)));
   await overview.screenshot({path:`${output}/${locale}-${width}-${theme}-plus.png`,fullPage:true,animations:'disabled'});
   const listing=await context.newPage();listing.on('pageerror',error=>errors.push(String(error)));
   await listing.goto(base+'/projekte');
   await listing.getByText('Fixture project one',{exact:true}).filter({visible:true}).waitFor();
   if(width===1440){const rows=listing.locator('.desktop-record-row');assert.equal(await rows.count(),2);const geometry=await rows.first().evaluate(node=>({height:node.getBoundingClientRect().height,border:getComputedStyle(node).borderBottomWidth}));assert.ok(geometry.height>=44&&geometry.height<86,JSON.stringify(geometry));assert.equal(geometry.border,'1px');assert.equal(await rows.last().evaluate(node=>getComputedStyle(node).borderBottomWidth),'0px');}
   await listing.screenshot({path:`${output}/${locale}-${width}-${theme}-list.png`,fullPage:true,animations:'disabled'});
   assert.deepEqual(errors,[]);
   results.push({width,theme,locale,inlineCustomer:true,threeSteps:true,sixCreateActions:true,compactList:true});
  }catch(error){await page.screenshot({path:`${output}/failure-${locale}-${width}-${theme}.png`,fullPage:true,animations:'disabled'});await fs.writeFile(output+'/failure.txt',await page.locator('body').innerText());throw error;}
  finally{await context.close();}
 }}finally{await browser.close();}
 await fs.writeFile(output+'/results.json',JSON.stringify({results,limits:['Synthetic HTTP fixtures; backend/RLS/PDF parity is tested separately. Chromium is not physical Safari/iOS/PWA acceptance.']},null,2));
 console.log('Global workflow: '+results.length+' inline-customer and three-step offer cases passed.');
}finally{server.kill();await fs.writeFile(output+'/server.log',logs);}
