import assert from 'node:assert/strict';
import {selectAppOption,appControlValue} from './app-select-browser.mjs';
/** HTTP failures/slow confirmation exercise the actual common settings control.
 * Only isolated QA profile data is used; no production account is changed. */
export async function verifyLanguagePreference(page,{base,locale,text}){
 let current=locale,phase='fail',updates=0,release,started;
 const pending=new Promise(resolve=>release=resolve),received=new Promise(resolve=>started=resolve);
 await page.route('**/api/settings/profile',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{item:{display_name:'Synthetic Locale Owner',language:current}}});
  assert.equal(route.request().method(),'PATCH');updates++;
  const next=route.request().postDataJSON().language;
  if(phase==='fail')return route.fulfill({status:503,json:{message:'Synthetic profile failure'}});
  if(phase==='hold'){started();await pending;}
  current=next;return route.fulfill({json:{item:{language:current}}});
 });
 await page.goto(base+'/einstellungen/sprache?lang='+locale,{waitUntil:'networkidle'});
 const control=page.locator('.form-field .app-select-trigger'),next=locale==='en'?'fr':'en';
 await selectAppOption(control,next);await page.getByRole('alert').getByText(text('Sprache konnte nicht gespeichert werden.',locale),{exact:true}).waitFor();
 assert.equal(await appControlValue(control),locale,'A failed write retains the last confirmed selection');assert.equal(await page.locator('html').getAttribute('lang'),(locale==='tr'?'tr-TR':locale+'-CH'));assert.equal(updates,1);
 phase='hold';await selectAppOption(control,next);await received;
 assert.equal(await control.isEnabled(),false,'Slow writes cannot race another selection');assert.equal(await control.getAttribute('aria-busy'),'true');assert.equal(await appControlValue(control),locale);
 release();await page.waitForFunction(locale=>document.documentElement.lang===(locale==='tr'?'tr-TR':locale+'-CH'),next);
 assert.equal(await appControlValue(control),next);assert.equal(updates,2);
 // Next's separate route announcer deliberately has role=alert. Assert the
 // actual preference error has cleared in every language, not all live regions.
 for(const language of ['de','fr','it','en','tr'])await page.getByRole('alert').filter({hasText:text('Sprache konnte nicht gespeichert werden.',language)}).waitFor({state:'hidden'});
 await page.reload({waitUntil:'networkidle'});assert.equal(await appControlValue(control),next,'Confirmed server preference survives reload');assert.equal(updates,2,'Reload never repeats the write');
 // A mobile settings detail intentionally has a Back header, not a duplicate
 // account action. Open the account panel from the actual workspace header.
 phase='ready';await page.goto(base+'/dashboard?lang='+next,{waitUntil:'networkidle'});await page.locator('button.avatar-button:visible').first().click();
 const account=page.locator('.account-sheet .locale-switcher .app-select-trigger');await selectAppOption(account,locale);
 await page.waitForFunction(locale=>document.documentElement.lang===(locale==='tr'?'tr-TR':locale+'-CH'),locale);assert.equal(updates,3,'The account menu uses the same persisted preference path');
 await page.keyboard.press('Escape');await page.goto(base+'/einstellungen/sprache?lang='+locale,{waitUntil:'networkidle'});assert.equal(await appControlValue(control),locale);assert.equal(updates,3);
 await verifyNotificationPreference(page,{base,locale,text});
 let operatorLocale=null,operatorUpdates=0;
 await page.route('**/api/operator/preferences',route=>{
  if(route.request().method()==='PATCH'){operatorUpdates++;operatorLocale=route.request().postDataJSON().language;}
  else assert.equal(route.request().method(),'GET');
  return route.fulfill({json:{item:{language:operatorLocale}}});
 });
 await page.goto(base+'/operator?lang='+locale,{waitUntil:'networkidle'});await page.locator('.operator-app-header button.avatar-button:visible').click();
 await selectAppOption(page.locator('.account-sheet .locale-switcher .app-select-trigger'),next);
 await page.waitForFunction(locale=>document.documentElement.lang===(locale==='tr'?'tr-TR':locale+'-CH'),next);assert.equal(operatorUpdates,1);assert.equal(updates,3,'Operator storage must never use the tenant profile endpoint');
 await page.keyboard.press('Escape');
 await page.evaluate(locale=>{document.cookie='binso_locale='+locale+'; Path=/; SameSite=Lax';const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(history.state,'',url)},locale);
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(locale=>document.documentElement.lang===(locale==='tr'?'tr-TR':locale+'-CH'),next);assert.equal(operatorUpdates,1,'Reading a stored preference does not replay its mutation');
}

/** Actual switches retain confirmed state, localized names and keyboard semantics.
 * The isolated HTTP adapter never dispatches notifications or changes a real user. */
async function verifyNotificationPreference(page,{base,locale,text}){
 let enabled=true,phase='fail',updates=0,release,started;
 const pending=new Promise(resolve=>release=resolve),received=new Promise(resolve=>started=resolve);
 const handler=async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{channels:{email:true,push:false},items:[{kind:'Rechnungen',email:enabled,push:false}]}});
  assert.equal(route.request().method(),'PATCH');updates++;assert.deepEqual(route.request().postDataJSON(),{kind:'Rechnungen',channel:'email',enabled:false});
  if(phase==='fail')return route.fulfill({status:503,json:{message:'Synthetic preference failure'}});
  started();await pending;enabled=false;return route.fulfill({json:{ok:true}});
 };
 await page.route('**/api/settings/notifications',handler);
 try{
  await page.goto(base+'/einstellungen/benachrichtigungen?lang='+locale,{waitUntil:'networkidle'});
  const control=page.getByRole('switch',{name:text('Rechnungen',locale)+' · '+text('E-Mail',locale),exact:true});
  await control.waitFor();assert.equal(await control.isEnabled(),true);assert.equal(await control.getAttribute('aria-checked'),'true');
  await control.click();await page.getByRole('alert').getByText(text('Einstellung konnte nicht gespeichert werden.',locale),{exact:true}).waitFor();
  assert.equal(await control.getAttribute('aria-checked'),'true','Failure never displays an unsaved setting');assert.equal(updates,1);
  phase='hold';await control.focus();await page.keyboard.press('Space');await received;
  assert.equal(await control.getAttribute('aria-busy'),'true');assert.equal(await control.isEnabled(),false);assert.equal(await control.getAttribute('aria-checked'),'true');
  await page.keyboard.press('Space');assert.equal(updates,2,'Native busy state prevents repeated keyboard mutations');
  release();await page.waitForFunction(()=>document.querySelector('[role="switch"]')?.getAttribute('aria-checked')==='false');
  await page.reload({waitUntil:'networkidle'});assert.equal(await control.getAttribute('aria-checked'),'false');assert.equal(updates,2,'Reload reads persistence without repeating a mutation');
 }finally{release();await page.unroute('**/api/settings/notifications',handler);}
}
