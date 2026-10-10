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
const evidence=[];
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(attempt>120||server.exitCode!==null)throw new Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[process.env.BINSO_UX_BROWSER??'chromium'].launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader']}:{})});
 const widths=process.env.BINSO_REGISTRATION_WIDTHS?.split(',').map(Number)??[320,360,375,390,430,768,820,1024,1280,1440,1920];
 for(const theme of ['light','dark'])for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width<768?580:900}});
  await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'}))},theme);
  const page=await context.newPage();await page.goto(base+'/registrieren?plan=business&billing=yearly');
  const sheet=page.getByRole('dialog',{name:'Binso One einrichten'});await sheet.waitFor();
  await sheet.getByRole('textbox',{name:'Firmenname *',exact:true}).fill('Synthetic Company with a deliberately long business name GmbH');
  await sheet.getByRole('button',{name:'Weiter',exact:true}).click();await sheet.getByRole('textbox',{name:'Geschäftliche E-Mail-Adresse *',exact:true}).fill('synthetic-long-email@company.example.invalid');
  await sheet.locator('input[name="password"]').fill('a sufficiently long test password');await sheet.getByRole('button',{name:'Weiter',exact:true}).click();
  const geometry=await sheet.evaluate(el=>{const footer=el.querySelector('.mobile-sticky-save').getBoundingClientRect(),box=el.getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth+1,footerBottom:footer.bottom,footerTop:footer.top,height:innerHeight,boxBottom:box.bottom,inputs:Array.from(el.querySelectorAll('input')).map(input=>({name:input.name,type:input.type,value:input.type==='password'?'[omitted]':input.value}))}});
  assert.equal(geometry.overflow,false);assert.ok(geometry.footerBottom<=geometry.height+1&&geometry.footerTop>=0,'The wizard footer stays reachable in short viewports');
  if(width===320||width===390||width===1440){await page.screenshot({path:path.join(output,`${theme}-${width}-registration.png`),animations:'disabled'});await fs.writeFile(path.join(output,`${theme}-${width}-geometry.json`),JSON.stringify(geometry,null,2));}
  if(process.env.BINSO_AXE_MODULE&&[375,1440].includes(width)){await page.addScriptTag({path:process.env.BINSO_AXE_MODULE});const issues=await page.evaluate(async()=>{const result=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return result.violations.filter(issue=>['serious','critical'].includes(issue.impact)).map(issue=>({id:issue.id,nodes:issue.nodes.map(node=>node.target)}))});assert.deepEqual(issues,[]);}
  evidence.push({theme,width,phase:'review',observed:'passed'});await context.close();
 }
 for(const locale of ['de','fr','it','en','tr']){
  const t=key=>catalog.registrationText(key,locale),context=await browser.newContext({viewport:{width:390,height:640}});await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false,updatedAt:'2026-10-10'})));
  const page=await context.newPage();let posts=0,fail=true,resends=0,created=false;
  const fixtureContext=(await (await fetch(base+'/api/auth/register')).json()).context;
  await context.route('**/api/auth/register*',async route=>{if(route.request().method()!=='POST'){if(created)return route.fulfill({json:{state:'pending',context:fixtureContext,pending:{company:'Synthetic Company GmbH',email:'synthetic@example.invalid',locale}}});return route.continue();}posts++;await new Promise(resolve=>setTimeout(resolve,100));const body=JSON.parse(route.request().postData());assert.equal(body.locale,locale);assert.equal(body.acceptedDpa,true);assert.ok(body.termsVersion&&body.dpaVersion&&body.privacyVersion);if(!fail)created=true;return route.fulfill({status:fail?503:201,json:fail?{error:'service_unavailable'}:{ok:true,emailSent:false}})});
  await context.route('**/api/auth/resend-verification',route=>{resends++;return route.fulfill({json:{ok:true,deliveryUnconfirmed:true}})});
  if(locale==='de'){
   await page.goto(base+'/');await page.locator('.hero-actions a[href="/registrieren"]').click();await page.getByRole('dialog',{name:t('title')}).waitFor();
   await page.goto(base+'/preise');await page.locator('.pricing-grid a[href="/registrieren?plan=business&billing=yearly"]').click();await page.waitForURL('**/registrieren?plan=business&billing=yearly');await page.getByRole('dialog',{name:t('title')}).waitFor();
  }
  await page.goto(base+'/registrieren?lang='+locale);const sheet=page.getByRole('dialog',{name:t('title')});await sheet.waitFor();
  await sheet.getByRole('button',{name:t('close'),exact:true}).click();await page.waitForURL('**/preise*');assert.equal(await page.getByRole('alertdialog').count(),0,'Untouched setup closes without a discard prompt');
  await page.goto(base+'/registrieren?lang='+locale);await sheet.waitFor();await sheet.locator('input[name="company"]').fill('Synthetic Company GmbH');await sheet.getByRole('button',{name:t('close'),exact:true}).click();const discard=page.getByRole('alertdialog',{name:t('leaveTitle')});await discard.waitFor();await discard.getByRole('button',{name:t('keep'),exact:true}).click();await sheet.getByRole('button',{name:t('close'),exact:true}).click();await discard.getByRole('button',{name:t('discard'),exact:true}).click();await page.waitForURL('**/preise*');await page.goto(base+'/registrieren?lang='+locale);await sheet.waitFor();assert.equal(await sheet.locator('input[name="company"]').inputValue(),'');await sheet.locator('input[name="company"]').fill('Synthetic Company GmbH');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  await sheet.locator('input[name="email"]').fill('invalid-email');await sheet.getByRole('button',{name:t('next'),exact:true}).click();assert.equal(await sheet.locator('input[name="email"]').evaluate(input=>input.validity.typeMismatch),true);await sheet.locator('input[name="email"]').fill('synthetic@example.invalid');assert.equal(await sheet.locator('input[name="email"]').getAttribute('autocomplete'),'email');await sheet.locator('input[name="password"]').fill('short');await sheet.getByRole('button',{name:t('next'),exact:true}).click();assert.equal(await sheet.locator('input[name="password"]').evaluate(input=>input.validity.tooShort),true);
  await sheet.locator('input[name="password"]').fill('a sufficiently long test password');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  await page.evaluate(()=>history.back());await sheet.locator('input[name="password"]').waitFor({state:'visible'});assert.equal(await sheet.locator('input[name="email"]').inputValue(),'synthetic@example.invalid');await sheet.getByRole('button',{name:t('next'),exact:true}).click();
  assert.equal(await sheet.getByRole('button',{name:t('create'),exact:true}).isDisabled(),true);
  const [legal]=await Promise.all([page.waitForEvent('popup'),sheet.getByRole('link',{name:t('terms'),exact:true}).click()]);await legal.waitForLoadState();assert.ok(legal.url().endsWith('/agb'));await legal.close();await page.bringToFront();assert.equal(await sheet.locator('input[name="company"]').inputValue(),'Synthetic Company GmbH');
  await sheet.getByRole('checkbox').check();const [failedCreation]=await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/register'&&response.request().method()==='POST'),sheet.getByRole('button',{name:t('create'),exact:true}).click()]);await failedCreation.finished();assert.equal(failedCreation.status(),503);await sheet.getByText(t('failure'),{exact:true}).waitFor();assert.equal(posts,1);assert.equal(await sheet.locator('input[name="password"]').inputValue(),'a sufficiently long test password','An interrupted attempt preserves its in-memory password');
  fail=false;await sheet.getByRole('button',{name:t('create'),exact:true}).dblclick();await sheet.getByText(t('deliveryFailed'),{exact:true}).waitFor();assert.equal(posts,2,'Double taps cause one confirmed create request');
  assert.equal(await sheet.locator('input[type="password"]').count(),0,'The password is cleared after confirmed account creation');
  assert.equal(await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]).includes('a sufficiently long test password')),false,'Passwords never enter browser draft storage');
  await page.reload();await sheet.getByRole('heading',{name:t('verification'),exact:true}).waitFor();assert.equal(await sheet.locator('input[name="password"]').count(),0,'Pending setup resumes without a password draft');
  const [resendResponse]=await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/resend-verification'&&response.request().method()==='POST'),sheet.getByRole('button',{name:t('resend'),exact:true}).click()]);await resendResponse.finished();assert.equal(resendResponse.status(),200);assert.equal(resends,1);await sheet.getByText(t('deliveryUnconfirmed'),{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,`${locale}-verification.png`),animations:'disabled'});
  evidence.push({locale,phase:'guided-validation-back-legal-network-create-resend',observed:'passed',provider:'synthetic UI fixture, no real mail'});await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(evidence,null,2));console.log(`Registration browser passed: ${evidence.length} responsive/theme and five-language workflow cases. Synthetic POST fixtures; real backend integration is separate. Evidence: ${output}`);
}finally{await browser?.close();server.kill();}
