import {verifyBillingCompletionBrowser,calculationForBrowserPreview} from './billing-completion-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
// Presentation fixtures only. Actual API/RLS/financial chains live in registration-test.
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const port=await new Promise(resolve=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base='http://localhost:'+port,output=process.env.BINSO_BILLING_BROWSER_OUTPUT??'.qa/billing-inheritance';
await fs.mkdir(output,{recursive:true});
const env={...process.env,APP_URL:base,APP_MODE:'local',DATABASE_URL:'',SESSION_COOKIE_NAME:'binso_billing_fixture'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',...(process.env.BINSO_BILLING_BROWSER_DEV==='1'?['dev','--webpack']:['start']),'--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);
const results=[],customerId='11111111-1111-4111-a111-111111111111',projectId='22222222-2222-4222-a222-222222222222',agreementId='33333333-3333-4333-a333-333333333333',milestoneId='44444444-4444-4444-a444-444444444444';
const labels={fixed:'Pauschal/Fixpreis',time:'Nach Aufwand',quantity:'Nach Menge',mixed:'Gemischt',recurring:'Wiederkehrend',milestone:'Nach Meilensteinen'};
try{
 for(let n=0;;n++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(n>100||server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,200));}
 for(const engine of process.env.BINSO_BILLING_COMPLETION_SMOKE==='1'?[]:['chromium','webkit']){
  const browser=await engines[engine].launch({headless:true});
  try{for(const model of Object.keys(labels))for(const source of model==='time'?['project','offer','time']:['project','offer']){
   const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await context.addCookies([{name:'binso_billing_fixture',value:'synthetic-not-a-session',url:base},{name:'binso_locale',value:'de',url:base}]);
   await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false})));
   const terms={revision:1,model,currency:'CHF',...(['fixed','mixed','recurring'].includes(model)?{amount:'100.00'}:{}),...(model==='mixed'?{additionalTime:false,quantity:true}:{}),...(model==='recurring'?{startsOn:'2026-01-31',endsOn:null,intervalMonths:1}:{}),...(model==='milestone'?{milestones:[{id:milestoneId,label:'Delivered stage',amount:'100.00',completed:true}]}:{})};
   const positions=[{description:'Agreed service',quantity:2,unit:model==='time'?'Stunden':'Stück',unit_price:50,vat_rate:8.1,billing_part:model==='time'?'time':model==='quantity'?'quantity':'fixed'}];
   const customer={id:customerId,name:'Fixture customer',paymentDays:30};
   let projectRequests=0;const retryCase=engine==='chromium'&&model==='fixed'&&source==='project';
   await context.route('**/api/**',async route=>{
    const p=new URL(route.request().url()).pathname,reply=json=>route.fulfill({json});
    if(p==='/api/documents/preview')return reply({calculation:calculationForBrowserPreview(route.request().postDataJSON())});
    if(p==='/api/auth/session')return reply({authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture-company',role:'owner',plan:'pro'}});
    if(p==='/api/settings/profile')return reply({item:{id:'fixture',display_name:'Fixture',email:'fixture@example.invalid',language:'de',theme:'light'}});
    if(p==='/api/settings/company')return reply({item:{name:'Fixture AG',street:'Testweg',building_number:'2',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',vat_rate:8.1,payment_terms_days:30}});
    if(p==='/api/time-entries/billing')return reply({items:[{id:milestoneId,hours:2,sales_rate:50,vat_rate:'8.1',price_currency:'CHF',customer_id:customerId,customer_name:customer.name,project_name:'Agreed service',billing_agreement_id:agreementId,billing_terms:terms}]});
    if(p==='/api/customers')return reply({items:[customer]});
    if(p==='/api/customers/'+customerId)return reply({item:customer});
    if(p==='/api/projects/'+projectId){projectRequests++;if(retryCase&&projectRequests===1)return route.fulfill({status:503,json:{error:'fixture_unavailable',message:'Daten konnten nicht geladen werden.'}});return reply({item:{id:projectId,name:'Agreed project',customer_id:customerId,customer_name:customer.name,billing_agreement_id:agreementId,billing_terms:terms,billing_snapshot:{note:'Agreed conditions',items:positions}}});}
    if(p==='/api/documents/AN-V8')return reply({item:{id:projectId,number:'AN-V8',kind:'offer',status:'accepted',customer_id:customerId,customer:{name:customer.name},currency:'CHF',issue_date:'2026-10-27',subtotal:100,vat_amount:8.1,total:108.1,billing_agreement_id:agreementId,billing_terms:terms,items:positions}});
    return reply({items:[],item:{},stats:{},unreadCount:0});
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'/rechnungen/neu?'+(source==='project'?'sourceProject='+projectId:source==='time'?'timeEntries='+milestoneId:'sourceOffer=AN-V8'));
   if(retryCase)await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();
   const modelField=page.getByRole('combobox',{name:'Abrechnungsmodell',exact:true});
   await page.waitForFunction(label=>[...document.querySelectorAll('button[role=combobox]')].some(n=>n.textContent.includes(label)&&n.disabled),labels[model]);
   if(retryCase)assert.ok(projectRequests>=2,'Retry reloads the actual project source');
   assert.equal(await modelField.isDisabled(),true,'Inherited model is immutable');
   assert.equal(await page.getByRole('combobox',{name:'Währung',exact:true}).isDisabled(),true,'Inherited currency is immutable');
   assert.equal(await page.getByRole('combobox',{name:'Kunde auswählen',exact:true}).isDisabled(),true,'Source customer cannot be replaced');
   assert.ok((await page.locator('.invoice-totals strong').innerText()).includes('108.10'),'Inherited source totals use the agreed prices and tax before any edit');
   await page.getByRole('combobox',{name:'Rechnungsverfahren',exact:true}).click();await page.getByRole('option').filter({hasText:'Teilrechnung'}).click();
   if(model==='recurring')await page.getByLabel('Periodennummer',{exact:true}).fill('2');
   if(model==='milestone'){await page.getByRole('combobox',{name:'Meilenstein',exact:true}).click();await page.getByRole('option').filter({hasText:'Delivered stage'}).click();}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=390),'Source form must not overflow');
   await page.screenshot({path:`${output}/${engine}-${model}-${source}.png`,fullPage:true});
   await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.locator('.document-line-items').waitFor();
   assert.ok((await page.locator('.document-line-items').innerText()).includes('Agreed service'),'The agreed position is retained');
   assert.deepEqual(errors,[]);results.push({engine,model,source,customerLocked:true,modelLocked:true,positionRetained:true});await context.close();
  }}finally{await browser.close();}
 }
 results.push(...await verifyBillingCompletionBrowser({engines,base,output,writeFile:fs.writeFile}));
 await fs.writeFile(output+'/results.json',JSON.stringify({results,limitations:['Synthetic HTTP presentation fixtures; actual financial persistence is tested separately.','Not physical iOS/PWA acceptance.']},null,2));
 console.log('Billing inheritance browser: '+results.length+' project/offer/time-to-invoice cases passed.');
}finally{server.kill();await fs.writeFile(output+'/server.log',logs);}
