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
 assert.equal(await appControlValue(control),locale,'A failed write retains the last confirmed selection');assert.equal(await page.locator('html').getAttribute('lang'),locale+'-CH');assert.equal(updates,1);
 phase='hold';await selectAppOption(control,next);await received;
 assert.equal(await control.isEnabled(),false,'Slow writes cannot race another selection');assert.equal(await control.getAttribute('aria-busy'),'true');assert.equal(await appControlValue(control),locale);
 release();await page.waitForFunction(locale=>document.documentElement.lang===locale+'-CH',next);
 assert.equal(await appControlValue(control),next);assert.equal(updates,2);assert.equal(await page.getByRole('alert').count(),0);
 await page.reload({waitUntil:'networkidle'});assert.equal(await appControlValue(control),next,'Confirmed server preference survives reload');assert.equal(updates,2,'Reload never repeats the write');
 phase='ready';await page.locator('button.avatar-button:visible').first().click();
 const account=page.locator('.account-sheet .locale-switcher .app-select-trigger');await selectAppOption(account,locale);
 await page.waitForFunction(locale=>document.documentElement.lang===locale+'-CH',locale);assert.equal(updates,3,'The account menu uses the same persisted preference path');
 await page.keyboard.press('Escape');await page.reload({waitUntil:'networkidle'});assert.equal(await appControlValue(control),locale);assert.equal(updates,3);
 let operatorLocale=null,operatorUpdates=0;
 await page.route('**/api/operator/preferences',route=>{
  if(route.request().method()==='PATCH'){operatorUpdates++;operatorLocale=route.request().postDataJSON().language;}
  else assert.equal(route.request().method(),'GET');
  return route.fulfill({json:{item:{language:operatorLocale}}});
 });
 await page.goto(base+'/operator?lang='+locale,{waitUntil:'networkidle'});await page.locator('.operator-app-header button.avatar-button:visible').click();
 await selectAppOption(page.locator('.account-sheet .locale-switcher .app-select-trigger'),next);
 await page.waitForFunction(locale=>document.documentElement.lang===locale+'-CH',next);assert.equal(operatorUpdates,1);assert.equal(updates,3,'Operator storage must never use the tenant profile endpoint');
 await page.keyboard.press('Escape');
 await page.evaluate(locale=>{document.cookie='binso_locale='+locale+'; Path=/; SameSite=Lax';const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(history.state,'',url)},locale);
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(locale=>document.documentElement.lang===locale+'-CH',next);assert.equal(operatorUpdates,1,'Reading a stored preference does not replay its mutation');
}
