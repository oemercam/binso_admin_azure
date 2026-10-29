import assert from 'node:assert/strict';
import {moneyModuleUrl,localeTestModuleUrl} from './data-test-modules.mjs';
const {translateMessage}=await import(await localeTestModuleUrl());
const {calculateDocument,calculateBillingDocument,allocateAdvance,applyAdvanceApplications,reconcileFinalCalculation}=await import(moneyModuleUrl);
export async function verifyBillingCompletionBrowser({engines,base,output,writeFile}){
 const smoke=process.env.BINSO_BILLING_COMPLETION_SMOKE==='1',results=[];
 const gammaProject='99999999-9999-4999-a999-999999999999',gammaAgreement='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
 const customer='11111111-1111-4111-a111-111111111111',project='22222222-2222-4222-a222-222222222222',agreement='33333333-3333-4333-a333-333333333333',otherAgreement='55555555-5555-4555-a555-555555555555',timeA='66666666-6666-4666-a666-666666666666',timeB='77777777-7777-4777-a777-777777777777',advanceId='88888888-8888-4888-a888-888888888888';
 const advance=calculateDocument([{quantity:1,unit_price:100,vat_rate:8.1}],'CHF');
 const agreed=calculateDocument([{quantity:1,unit_price:'100.01',vat_rate:8.1}],'CHF'),third=calculateDocument([{quantity:'0.33',unit_price:100.01,vat_rate:8.1}],'CHF');
 const final=reconcileFinalCalculation(calculateDocument([{quantity:'0.34',unit_price:100.01,vat_rate:8.1}],'CHF'),agreed,[1],[{calculation:third,sourcePositions:[1]},{calculation:third,sourcePositions:[1]}]);
 for(const engine of smoke?['chromium']:['chromium','webkit']){
  const browser=await engines[engine].launch({headless:true});
  try{for(const width of smoke?[390]:[320,375,390,430,768,820,1024,1440])for(const theme of smoke?['light']:['light','dark'])for(const locale of smoke?['de']:['de','fr','it','en','tr']){
   const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,serviceWorkers:'block'});
   await context.addCookies([{name:'binso_billing_fixture',value:'synthetic-not-a-session',url:base},{name:'binso_locale',value:locale,url:base}]);
   await context.addInitScript(theme=>{localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));localStorage.setItem('binso.theme',theme);},theme);
   const errors=[];let saved=null,posted=null;let page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',dialog=>dialog.accept());
   await context.route('**/api/**',async route=>{const url=new URL(route.request().url()),p=url.pathname,reply=json=>route.fulfill({json});
    if(p==='/api/documents/preview')return reply({calculation:calculationForBrowserPreview(route.request().postDataJSON())});
    if(p==='/api/documents'&&route.request().method()==='POST'){posted=route.request().postDataJSON();const lines=posted.items.map(i=>({...i,unit_price:i.unitPrice,vat_rate:i.vatRate,billing_agreement_id:i.billingAgreementId,price_base_quantity:i.priceBaseQuantity}));let calculation=calculateBillingDocument(lines,'CHF',posted.discount,posted.billingScopes);if(posted.advanceApplications?.length)calculation=applyAdvanceApplications(calculation,posted.advanceApplications.map(a=>({...a,taxGroups:allocateAdvance(advance,a.amount)})));saved={id:gammaProject,number:'RE-SAVED',kind:'invoice',status:'draft',customer_id:customer,customer:{name:'Fixture customer'},currency:'CHF',issue_date:posted.issueDate,due_date:posted.dueDate,calculation,subtotal:calculation.subtotal,vat_amount:calculation.vat,total:calculation.total,billing_scopes:posted.billingScopes,items:lines};return route.fulfill({status:201,json:{item:saved}});}
    if(p==='/api/documents/RE-SAVED')return reply({item:saved});
    if(p==='/api/projects')return reply({items:[{id:gammaProject,name:'Gamma',customer_id:customer}],total:1});
    if(p==='/api/projects/'+gammaProject)return reply({item:{id:gammaProject,name:'Gamma',customer_id:customer,billing_agreement_id:gammaAgreement,billing_terms:{revision:1,model:'fixed',currency:'CHF',amount:'50'},billing_snapshot:{items:[{description:'Gamma fixed service',quantity:1,unit:'Stück',unit_price:50,vat_rate:8.1,billing_part:'fixed'}]}}});
    if(p==='/api/auth/session')return reply({authenticated:true,user:{id:'fixture'},security:{mfaEnabled:false,enrollmentRequired:false},tenant:{id:'fixture-company',role:'owner',plan:'pro'}});
    if(p==='/api/settings/profile')return reply({item:{id:'fixture',display_name:'Fixture',email:'fixture@example.invalid',language:locale,theme}});
    if(p==='/api/settings/company')return reply({item:{name:'Fixture AG',street:'Testweg',building_number:'2',postal_code:'8000',city:'Zürich',country_code:'CH',iban:'CH9300762011623852957',vat_rate:8.1,payment_terms_days:30}});
    if(p==='/api/customers')return reply({items:[{id:customer,name:'Fixture customer'}],total:1});
    if(p==='/api/customers/'+customer)return reply({item:{id:customer,name:'Fixture customer'}});
    if(p==='/api/time-entries/billing')return reply({items:[{id:timeA,project_id:project,hours:1,sales_rate:100,vat_rate:'8.1',price_currency:'CHF',customer_id:customer,customer_name:'Fixture customer',project_name:'Alpha',billing_agreement_id:agreement,billing_terms:{revision:1,model:'time',currency:'CHF',hourlyRate:'100'}},{id:timeB,hours:2,sales_rate:75,vat_rate:'2.6',price_currency:'CHF',customer_id:customer,customer_name:'Fixture customer',project_name:'Beta',billing_agreement_id:otherAgreement,billing_terms:{revision:1,model:'time',currency:'CHF',hourlyRate:'75'}}]});
    if(p==='/api/projects/'+project)return reply({item:{id:project,name:'Alpha',customer_id:customer,customer_name:'Fixture customer',billing_agreement_id:agreement,billing_terms:{revision:1,model:'quantity',currency:'CHF'},billing_snapshot:{items:[{description:'Agreed original service',quantity:1,unit:'Stück',unit_price:200,vat_rate:8.1,billing_part:'quantity'}]}}});
    if(p==='/api/documents/advances')return reply({items:[{id:advanceId,agreement_id:agreement,number:'AP-001',currency:'CHF',calculation:advance,prior_allocations:[],allocated_amount:'0',credited_amount:'0'}]});
    if(p==='/api/documents/RE-FINAL')return reply({item:{id:project,kind:'invoice',status:'sent',number:'RE-FINAL',document_revision:'synthetic',customer_id:customer,customer:{name:'Fixture customer'},currency:'CHF',issue_date:'2026-10-27',due_date:'2026-11-27',subtotal:final.subtotal,vat_amount:final.vat,total:final.total,calculation:final,billing_terms:{revision:1,model:'quantity',currency:'CHF'},billing_context:{procedure:'final'},items:[{description:'Original price, final remainder',quantity:.34,unit_price:100.01,vat_rate:8.1,billing_part:'quantity'}]}});
    return reply({items:[],item:{},stats:{},unreadCount:0});
   });
   const resetPage=async()=>{await page.waitForLoadState('networkidle');assert.deepEqual(errors,[],'Runtime errors before a deliberate document reset');await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',dialog=>dialog.accept());};
   await page.goto(base+'/rechnungen/neu?timeEntries='+timeA+','+timeB);
   await page.locator('.invoice-totals strong').filter({hasText:/262[.,]00/}).waitFor({state:'attached'});
   assert.equal(await page.locator('.customer-form-section').getByText('Alpha',{exact:true}).count(),1);assert.equal(await page.locator('.customer-form-section').getByText('Beta',{exact:true}).count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Consolidated form overflow');
   assert.ok((await page.getByRole('combobox',{name:translateMessage('Auftrag hinzufügen',locale),exact:true}).innerText()).includes(translateMessage('Auswählen',locale)),'Directory placeholder follows the selected locale');
   const interactive=width===390&&theme==='light'&&locale==='de';
   if(interactive){await page.getByRole('combobox',{name:'Auftrag hinzufügen',exact:true}).click();await page.getByRole('option',{name:'Gamma',exact:true}).click();await page.getByRole('button',{name:'Übernehmen',exact:true}).click();await page.locator('.invoice-totals strong').filter({hasText:/316[.,]05/}).waitFor({state:'attached'});}
   await page.screenshot({path:`${output}/completion-${engine}-${width}-${theme}-${locale}-collection.png`,fullPage:true});
   await page.getByRole('button',{name:translateMessage('Weiter',locale),exact:true}).click();await page.locator('.document-line-items').waitFor();assert.match(await page.locator('.document-line-items').innerText(),/Alpha/);assert.match(await page.locator('.document-line-items').innerText(),/Beta/);
   if(interactive){await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Als Entwurf speichern',exact:true}).click();await page.waitForURL('**/rechnungen/RE-SAVED');await page.locator('.document-detail-view').waitFor();assert.equal(posted.billingScopes.length,3);assert.deepEqual(posted.items.map(l=>Number(l.unitPrice)),[100,75,50]);assert.ok(posted.billingScopes.every(s=>Object.keys(s).every(k=>['agreementId','projectId','context','discount'].includes(k))));}
   await resetPage();await page.goto(base+'/rechnungen/neu?sourceProject='+project);
   await page.locator('.invoice-totals strong').filter({hasText:/216[.,]20/}).waitFor({state:'attached'});
   const check=page.locator('label.form-check').filter({hasText:'AP-001'}).locator('input[type=checkbox]');await check.check();
   await page.locator('.invoice-totals strong').filter({hasText:/108[.,]10/}).waitFor({state:'attached'});
   const amountInput=page.locator('.form-section').filter({has:check}).last().locator('input[inputmode=decimal]');await amountInput.fill('54.05');await amountInput.focus();
   await page.locator('.invoice-totals strong').filter({hasText:/162[.,]15/}).waitFor({state:'attached'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Advance form overflow');
   await page.screenshot({path:`${output}/completion-${engine}-${width}-${theme}-${locale}-advance.png`,fullPage:true});
   if(interactive){for(let n=0;n<3;n++)await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Als Entwurf speichern',exact:true}).click();await page.waitForURL('**/rechnungen/RE-SAVED');await page.locator('.document-detail-view').waitFor();await page.locator('.invoice-totals strong').filter({hasText:/162[.,]15/}).waitFor();assert.deepEqual(posted.advanceApplications,[{advanceInvoiceId:advanceId,agreementId:agreement,amount:'54.05'}]);}
   await resetPage();await page.goto(base+'/rechnungen/RE-FINAL');await page.locator('.document-detail-view').waitFor();
   assert.match(await page.locator('.invoice-totals strong').innerText(),/36[.,]77/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Final invoice overflow');
   await page.screenshot({path:`${output}/completion-${engine}-${width}-${theme}-${locale}-final.png`,fullPage:true});
   assert.deepEqual(errors,[]);results.push({engine,width,theme,locale,collection:true,variableAdvance:true,finalRounding:true});await context.close();
  }}finally{await browser.close();}
 }
 await writeFile(output+'/completion-results.json',JSON.stringify({results,limitations:['Synthetic HTTP UI fixtures; actual APIs/RLS/receivables are verified separately.','WebKit emulation does not qualify physical iPhone/iPad or installed iOS-PWA.']},null,2));
 return results;
}

export function calculationForBrowserPreview(body){
 const lines=body.positions.map(p=>({quantity:p.quantity,unit_price:p.price,vat_rate:p.vatRate,discount:p.discount,tax_exempt:p.taxExempt,price_base_quantity:p.priceBaseQuantity??1,billing_agreement_id:p.billingAgreementId,billing_source_position:p.billingSourcePosition}));
 let calculation=calculateBillingDocument(lines,body.currency??'CHF',body.discount,body.billingScopes);
 if(body.advanceApplications?.length){const source=calculateDocument([{quantity:1,unit_price:100,vat_rate:8.1}],'CHF');const applications=body.advanceApplications.map(a=>({...a,advanceNumber:'AP-001',taxGroups:allocateAdvance(source,a.amount)}));if('billingScopes' in calculation){throw Error('This browser fixture intentionally has a single-scope advance; mixed-scope advances are verified by actual API tests.');}calculation=applyAdvanceApplications(calculation,applications);}
 return calculation;
}
