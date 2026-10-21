import {assertIdentityReference} from './identity-reference-browser.mjs';
import {measureCompliance} from './compliance/measure.mjs';
import {writeTestOutput} from './test-output.mjs';
import {assertChoiceGeometry} from './form-choice-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const catalog=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(await fs.readFile('lib/i18n.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
const port=process.env.BINSO_REGISTRATION_PORT??'3238',base='http://127.0.0.1:'+port,output=process.env.BINSO_REGISTRATION_OUTPUT??'/tmp/binso-v22-registration';
await fs.mkdir(output,{recursive:true});
try{if((await fetch(base+'/api/health')).ok)throw new Error('Registration test port is occupied')}catch(e){if(e.message.includes('occupied'))throw e;}
const server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:'',APP_MODE:'local',PORT:port,HOSTNAME:'127.0.0.1'}});let logs='';server.stdout.on('data',chunk=>logs+=chunk);server.stderr.on('data',chunk=>logs+=chunk);
let browser;
// Synthetic routing must never be bypassed by a claimed service-worker client.
// Installed-PWA/offline behavior is exercised separately with workers enabled.
const evidence=[];
const {default:PDFDocument}=await import('pdfkit');
const previewPdf=await new Promise((resolve,reject)=>{const pdf=new PDFDocument({size:'A4'}),chunks=[];pdf.on('data',chunk=>chunks.push(chunk));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);pdf.text('Synthetic immutable offer PDF; no actual order.');pdf.end();});
const syntheticEmail='verification.'+'long-address.'.repeat(9)+'test@example.invalid';
async function assertReviewGeometry(sheet,page,caseName){
 try{await assertChoiceGeometry(sheet.locator('.form-check'));}
 catch(error){
  console.log('Registration transition diagnostic',JSON.stringify(await sheet.evaluate(el=>({progress:el.querySelector('.wizard-progress')?.textContent,steps:Array.from(el.querySelectorAll('.wizard-content>div[hidden],.wizard-content>div:not([hidden])')).map(step=>({hidden:step.hidden,height:step.getBoundingClientRect().height})),inputs:Array.from(el.querySelectorAll('input')).map(input=>({name:input.name,type:input.type,visible:input.getClientRects().length>0,disabled:input.disabled,valid:input.validity.valid,missing:input.validity.valueMissing,typeMismatch:input.validity.typeMismatch,tooShort:input.validity.tooShort})),focus:document.activeElement?.getAttribute('name')}))));
  await page.screenshot({path:path.join(output,caseName+'-transition-failure.png'),animations:'disabled'});throw error;
 }
}
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(attempt>120||server.exitCode!==null)throw new Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}:{})});
 const widths=process.env.BINSO_REGISTRATION_WIDTHS?.split(',').map(Number)??[320,360,375,390,430,768,820,1024,1280,1440,1920];
 for(const theme of ['light','dark'])for(const width of widths){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:width<768?580:900}});
  await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'}))},theme);
  const page=await context.newPage();await page.goto(base+'/registrieren?plan=business&billing=yearly');
  const sheet=page.getByRole('region',{name:'Binso One einrichten'});await sheet.waitFor();assert.equal(await page.getByRole('dialog').count(),0,'Registration is a real page, never an onboarding modal');
  await sheet.locator('input[name="email"]').fill('synthetic-long-email@company.example.invalid');
  await sheet.getByRole('button',{name:catalog.registrationText('next','de'),exact:true}).click();
  await sheet.locator('input[name="password"]').fill('a sufficiently long test password');
  await sheet.getByRole('button',{name:catalog.registrationText('next','de'),exact:true}).click();
  await sheet.getByRole('textbox',{name:'Firmenname *',exact:true}).fill('Synthetic Company with a deliberately long business name GmbH');
  await sheet.getByRole('checkbox').check();await sheet.getByRole('button',{name:catalog.registrationText('create','de'),exact:true}).click();assert.equal(await sheet.locator('input[name="firstName"]').evaluate(input=>input.validity.valueMissing),true,'Company alone cannot bypass the required personal name');await sheet.locator('input[name="firstName"]').fill('Synthetic');await sheet.locator('input[name="lastName"]').fill('Contact');
  await assertReviewGeometry(sheet,page,`${theme}-${width}`);
  await sheet.locator('button[type="submit"]').scrollIntoViewIfNeeded();
  const geometry=await sheet.evaluate(el=>{const footer=el.querySelector('button[type="submit"]').getBoundingClientRect(),box=el.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,footerBottom:footer.bottom,footerTop:footer.top,height:innerHeight,boxBottom:box.bottom,inputs:Array.from(el.querySelectorAll('input')).map(input=>({name:input.name,type:input.type,value:input.type==='password'?'[omitted]':input.value}))}});
  assert.equal(geometry.overflow,false);assert.ok(geometry.footerBottom<=geometry.height+1&&geometry.footerTop>=0,'The full-page submit action remains reachable in short viewports');
  if(width===320||width===390||width===1440){await page.screenshot({path:path.join(output,`${theme}-${width}-registration.png`),animations:'disabled'});await writeTestOutput(path.join(output,`${theme}-${width}-geometry.json`),JSON.stringify(geometry,null,2));}
  if(process.env.BINSO_AXE_MODULE&&[375,1440].includes(width)){await page.addScriptTag({path:process.env.BINSO_AXE_MODULE});const issues=await page.evaluate(async()=>{const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.filter(issue=>['serious','critical'].includes(issue.impact)).map(issue=>({id:issue.id,nodes:issue.nodes.map(node=>node.target)}))});assert.deepEqual(issues,[]);}
  evidence.push({theme,width,phase:'review',observed:'passed'});await context.close();
 }
 for(const locale of ['de','fr','it','en']){
  const t=key=>catalog.registrationText(key,locale),context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:640}});await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'})));
  const page=await context.newPage();let posts=0,fail=true,resends=0,created=false;
  const fixtureContext=(await (await fetch(base+'/api/auth/register')).json()).context;
  await context.route('**/api/auth/register*',async route=>{if(route.request().method()!=='POST'){if(created)return route.fulfill({json:{state:'pending',context:fixtureContext,pending:{company:'Synthetic Company GmbH',email:syntheticEmail,locale}}});return route.continue();}posts++;await new Promise(resolve=>setTimeout(resolve,100));const body=JSON.parse(route.request().postData());assert.equal(body.name,'Synthetic Contact');assert.equal(body.firstName,'Synthetic');assert.equal(body.lastName,'Contact');assert.equal(body.locale,locale);assert.equal(body.acceptedDpa,true);assert.ok(body.termsVersion&&body.dpaVersion&&body.privacyVersion);if(!fail)created=true;return route.fulfill({status:fail?503:201,json:fail?{error:'service_unavailable'}:{ok:true,emailSent:false}})});
  await context.route('**/api/auth/resend-verification',route=>{resends++;return route.fulfill({json:{ok:true,deliveryUnconfirmed:true}})});
  if(locale==='de'){
   await page.goto(base+'/');await page.locator('.reference-hero .reference-actions a[href="/registrieren"]').click();await page.getByRole('region',{name:t('title')}).waitFor();
   await page.goto(base+'/preise');await page.locator('.pricing-grid a[href="/registrieren?plan=business&billing=yearly"]').click();await page.waitForURL('**/registrieren?plan=business&billing=yearly');await page.getByRole('region',{name:t('title')}).waitFor();
  }
  await page.goto(base+'/registrieren?lang='+locale);const sheet=page.getByRole('region',{name:t('title')});await sheet.waitFor();
  await sheet.getByRole('button',{name:t('cancel'),exact:true}).click();await page.waitForURL('**/preise*');assert.equal(await page.getByRole('alertdialog').count(),0,'Untouched setup closes without a discard prompt');
  await page.goto(base+'/registrieren?lang='+locale);await sheet.waitFor();await sheet.locator('input[name="email"]').fill(syntheticEmail);await sheet.getByRole('button',{name:t('cancel'),exact:true}).click();const discard=page.getByRole('alertdialog',{name:t('leaveTitle')});await discard.waitFor();await discard.getByRole('button',{name:t('keep'),exact:true}).click();await sheet.getByRole('button',{name:t('cancel'),exact:true}).click();await discard.getByRole('button',{name:t('discard'),exact:true}).click();await page.waitForURL('**/preise*');await page.goto(base+'/registrieren?lang='+locale);await sheet.waitFor();assert.equal(await sheet.locator('input[name="email"]').inputValue(),'');
  await sheet.locator('input[name="email"]').fill('invalid-email');await sheet.getByRole('button',{name:t('next'),exact:true}).click();assert.equal(await sheet.locator('input[name="email"]').evaluate(input=>input.validity.typeMismatch),true);await sheet.locator('input[name="email"]').fill(syntheticEmail);assert.equal(await sheet.locator('input[name="email"]').getAttribute('autocomplete'),'email');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  await sheet.locator('input[name="password"]').fill('short');await sheet.getByRole('button',{name:t('next'),exact:true}).click();assert.equal(await sheet.locator('input[name="password"]').evaluate(input=>input.validity.tooShort),true);
  await sheet.locator('input[name="password"]').fill('a sufficiently long test password');
  await page.evaluate(()=>history.back());await discard.waitFor();await discard.getByRole('button',{name:t('keep'),exact:true}).click();await sheet.locator('input[name="password"]').waitFor({state:'visible'});
  await sheet.getByRole('button',{name:t('back'),exact:true}).click();assert.equal(await sheet.locator('input[name="email"]').inputValue(),syntheticEmail);await sheet.getByRole('button',{name:t('next'),exact:true}).click();assert.equal(await sheet.locator('input[name="password"]').inputValue(),'a sufficiently long test password');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  await sheet.locator('input[name="company"]').fill('Synthetic Company GmbH');await sheet.locator('input[name="firstName"]').fill('Synthetic');await sheet.locator('input[name="lastName"]').fill('Contact');await sheet.getByRole('checkbox').check();
  await assertReviewGeometry(sheet,page,locale);
  await sheet.getByRole('checkbox').uncheck();assert.equal(await sheet.getByRole('button',{name:t('create'),exact:true}).isDisabled(),true,'Consent remains mandatory before creation');
  const [legal]=await Promise.all([page.waitForEvent('popup'),sheet.getByRole('link',{name:t('terms'),exact:true}).click()]);await legal.waitForLoadState();assert.ok(legal.url().endsWith('/agb'));await legal.close();await page.bringToFront();assert.equal(await sheet.locator('input[name="company"]').inputValue(),'Synthetic Company GmbH');
  await sheet.getByRole('checkbox').check();const [failedCreation]=await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/register'&&response.request().method()==='POST'),sheet.getByRole('button',{name:t('create'),exact:true}).click()]);await failedCreation.finished();assert.equal(failedCreation.status(),503);await sheet.getByText(t('failure'),{exact:true}).waitFor();assert.equal(posts,1);await sheet.getByRole('button',{name:t('back'),exact:true}).click();assert.equal(await sheet.locator('input[name="password"]').inputValue(),'a sufficiently long test password','An interrupted attempt preserves its in-memory password');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  fail=false;await sheet.getByRole('button',{name:t('create'),exact:true}).dblclick();await sheet.getByText(t('deliveryFailed'),{exact:true}).waitFor();assert.equal(posts,2,'Double taps cause one confirmed create request');
  assert.equal(await sheet.locator('input[type="password"]').count(),0,'The password is cleared after confirmed account creation');
  assert.equal(await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]).includes('a sufficiently long test password')),false,'Passwords never enter browser draft storage');
  await page.setViewportSize({width:320,height:400});await page.waitForLoadState('networkidle');await page.reload();await sheet.getByRole('heading',{name:t('verification'),exact:true}).waitFor();assert.equal(await sheet.locator('input[name="password"]').count(),0,'Pending setup resumes without a password draft');
  const codeInput=sheet.locator('input[name="code"]');await codeInput.scrollIntoViewIfNeeded();await codeInput.focus();const pendingGeometry=await codeInput.evaluate(el=>{const box=el.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,codeTop:box.top,codeBottom:box.bottom,height:innerHeight,modal:!!el.closest('.bottom-sheet')}});assert.equal(pendingGeometry.modal,false,'Pending verification remains on its own auth page');assert.equal(pendingGeometry.overflow,false);assert.ok(pendingGeometry.codeTop>=0&&pendingGeometry.codeBottom<=pendingGeometry.height+1,'Long email and verification input remain reachable at 320×400');await sheet.getByRole('button',{name:t('resend'),exact:true}).scrollIntoViewIfNeeded();
  const [resendResponse]=await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/resend-verification'&&response.request().method()==='POST'),sheet.getByRole('button',{name:t('resend'),exact:true}).click()]);await resendResponse.finished();assert.equal(resendResponse.status(),200);assert.equal(resends,1);await sheet.getByText(t('deliveryUnconfirmed'),{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,`${locale}-verification.png`),animations:'disabled'});
  await page.goto(base+'/email-bestaetigen?lang='+locale);await page.getByText(t('invalidCode'),{exact:true}).waitFor();assert.equal(await page.locator('main.auth-page').getAttribute('lang'),locale,'Verification copy and auth surface retain every supported registration locale');
  evidence.push({locale,phase:'full-page-validation-discard-back-legal-network-create-resend-invalid-link',observed:'passed',provider:'synthetic UI fixture, no real mail'});await context.close();
 }
 for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:740}});await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'})));const page=await context.newPage();
  await page.goto(base+'/login');const passkey=page.getByRole('button',{name:'Mit Passkey anmelden',exact:true});await passkey.waitFor();assert.equal(await passkey.isVisible(),true,'Real passkey login must be visible on mobile AND desktop');
  await assertIdentityReference({page,context,width,base,output});
  await page.goto(base+'/passwort-zuruecksetzen?token=synthetic-ui-only-token');const controls=page.locator('.password-field');await controls.first().waitFor();await controls.last().waitFor();assert.equal(await controls.count(),2);
  await controls.first().locator('input').fill('synthetic-reset-password');await controls.first().getByRole('button',{name:'Passwort anzeigen',exact:true}).click();assert.equal(await controls.first().locator('input').getAttribute('type'),'text');assert.equal(await controls.last().locator('input').getAttribute('type'),'password','Each shared password toggle owns its field');await controls.first().getByRole('button',{name:'Passwort ausblenden',exact:true}).click();
  const box=await controls.first().evaluate(el=>({input:el.querySelector('input').getBoundingClientRect().toJSON(),toggle:el.querySelector('button').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth+1}));assert.equal(box.overflow,false);assert.ok(box.toggle.right<=box.input.right+1&&box.toggle.left>=box.input.left,'Reset visibility control stays inside its field');
  await controls.first().locator('input').fill('');
  let attempts=0;
  await context.route('**/api/auth/verify-email',route=>{attempts++;return route.fulfill({status:attempts===1?503:200,json:attempts===1?{error:'service_unavailable'}:{ok:true,alreadyVerified:true}})});
  await page.goto(base+'/email-bestaetigen?token=synthetic-ui-only-token');await page.getByText(catalog.registrationText('connectionFailure','de'),{exact:true}).waitFor();assert.equal(await page.getByText(catalog.registrationText('invalidCode','de'),{exact:true}).count(),0,'Outage must not be reported as an invalid link');assert.equal(attempts,1,'No automatic verification mutation retry');
  await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();await page.getByText(catalog.registrationText('alreadyVerified','de'),{exact:true}).waitFor();assert.equal(attempts,2);assert.equal(new URL(page.url()).searchParams.has('token'),false,'Successful retry removes the bearer token from history');
  await context.unroute('**/api/auth/verify-email');await context.route('**/api/auth/verify-email',route=>route.fulfill({status:400,json:{error:'invalid_or_expired_code'}}));await page.goto(base+'/email-bestaetigen?token=synthetic-invalid-token');await page.getByText(catalog.registrationText('invalidCode','de'),{exact:true}).waitFor();
  evidence.push({width,phase:'passkey-reset-control-verification-outage-retry-invalid',observed:'passed',provider:'synthetic UI fixture; no actual reset, account or email'});await context.close();
 }
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:700}});await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'}))},theme);
  const page=await context.newPage(),token='t'.repeat(43);let decisions=0,status='sent';
  await context.route('**/api/public/offer',async route=>{
   assert.equal(route.request().method(),'POST');assert.equal(route.request().url().includes(token),false,'The capability must never enter an HTTP URL');assert.equal(route.request().headers().cookie,undefined,'Public proof never borrows the tenant login');
   const body=route.request().postDataJSON();assert.equal(body.token,token);
   if(body.action==='read')return route.fulfill({json:{number:'AN-SYNTHETIC-001',version:2,status,recipientHint:'r…@fixture.invalid',company:{name:'Synthetic Company'},document:{issue_date:'2026-10-21',valid_until:'2099-12-31',currency:'CHF',subtotal:100,vat_amount:8.1,total:108.1,document_snapshot:{intro:'Synthetic offer; no actual order.',closing:'Synthetic conditions.'},items:[{id:'fixture',description:'Synthetic service with a deliberately long description for narrow screens',quantity:1,unit:'Stück',unit_price:100,line_total:100}]},messages:[]}});
   if(body.action==='pdf')return route.fulfill({contentType:'application/pdf',body:previewPdf});
   if(body.action==='respond'){assert.equal(body.confirmed,true);assert.equal(body.code,'123456');decisions++;status='accepted';await new Promise(resolve=>setTimeout(resolve,100));}
   return route.fulfill({json:{ok:true}});
  });
  await page.goto(base+'/angebot#'+token);await page.getByRole('heading',{name:'Angebot AN-SYNTHETIC-001'}).waitFor();assert.equal(decisions,0,'Opening alone never decides an offer');await measureCompliance(page,{output:path.join(output,'compliance'),route:'/angebot',theme,width,state:'normal',engine:process.env.BINSO_UX_BROWSER??'chromium'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.getByRole('button',{name:'PDF ansehen',exact:true}).click();const preview=page.getByRole('dialog',{name:'Angebots-PDF',exact:true});await preview.waitFor();await preview.locator('canvas[data-rendered-page="1"]').waitFor();assert.equal(await preview.getByRole('button',{name:'Teilen oder herunterladen',exact:true}).isEnabled(),true);await preview.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();await preview.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Annehmen',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Angebot annehmen',exact:true});await dialog.waitFor();
  assert.equal(await dialog.getByRole('button',{name:'Code anfordern',exact:true}).isDisabled(),true,'Acceptance requires an explicit authority/terms acknowledgement');await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Code anfordern',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Bestätigungscode',exact:true}).fill('123456');
  const box=await dialog.locator('.filter-sheet-actions').boundingBox();assert.ok(box&&box.y>=0&&box.y+box.height<=700+1,'The explicit decision remains reachable above the viewport edge');
  await page.screenshot({path:path.join(output,`${theme}-${width}-public-offer-confirmation.png`),animations:'disabled'});
  await dialog.getByRole('button',{name:'Angebot verbindlich annehmen',exact:true}).dblclick();await page.getByText('Deine Entscheidung wurde gespeichert.',{exact:true}).waitFor();assert.equal(decisions,1,'A double tap cannot submit twice');
  evidence.push({theme,width,phase:'public-offer-explicit-code-bound-acceptance',observed:'passed',provider:'synthetic API fixture; actual restricted-RLS/concurrency tests are separate'});await context.close();
 }
 await writeTestOutput(path.join(output,'results.json'),JSON.stringify(evidence,null,2));console.log(`Registration and public-offer browser passed: ${evidence.length} responsive/theme and localized workflow cases. Synthetic POST fixtures; real backend integration is separate. Evidence: ${output}`);
}finally{await browser?.close();server.kill();}

// Additional import interactions reuse the same qualified engine and isolated API fixtures.
await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/customer-import-browser-test.mjs'],{stdio:'inherit',env:{...process.env,BINSO_IMPORT_OUTPUT:path.join(output,'imports')}});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Customer import browser failed: '+code)));});

await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/system-state-browser-test.mjs'],{stdio:'inherit',env:{...process.env,BINSO_SYSTEM_STATE_OUTPUT:path.join(output,'system-states')}});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('System-state browser failed: '+code)));});
