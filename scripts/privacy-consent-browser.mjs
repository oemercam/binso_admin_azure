import assert from 'node:assert/strict';
/** A fresh public context must expose all choices, not silently skip consent. */
export async function verifyConsentRejection(page,text,locale){
 const consent=page.locator('.privacy-consent-layer');await consent.waitFor({state:'visible'});
 assert.equal(await page.locator('#binso-page-content').evaluate(el=>el.inert),true,'The stable page boundary is inert while consent owns focus');
 const geometry=[];for(const label of ['Alle ablehnen','Einstellungen','Alle akzeptieren']){
  const button=consent.getByRole('button',{name:text(label,locale),exact:true});assert.equal(await button.isVisible(),true,'All three consent choices remain available in '+locale);
  geometry.push(await button.evaluate(el=>({height:el.getBoundingClientRect().height,color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,font:getComputedStyle(el).fontSize,weight:getComputedStyle(el).fontWeight})));
 }
 assert.ok(geometry.every(item=>item.height>=44),'Consent choices retain accessible touch targets '+JSON.stringify(geometry));
 assert.ok(geometry.every(item=>item.color===geometry[0].color&&item.background===geometry[0].background&&item.font===geometry[0].font&&item.weight===geometry[0].weight),'Consent options retain equal visual weight');
 await consent.getByRole('link',{name:text('Datenschutzerklärung',locale),exact:true}).click();await page.waitForURL('**/datenschutz');await consent.waitFor({state:'hidden'});
 assert.equal(await page.locator('#binso-page-content').evaluate(el=>el.inert),false,'Reading the policy releases the background without implying consent');
 assert.equal(await page.evaluate(()=>localStorage.getItem('binso.privacy.preferences.v1')),null,'Opening legal information never stores a consent choice');
 await page.locator('.legal-page h1').waitFor();
 await page.getByRole('button',{name:text('Cookie-/Datenschutz-Einstellungen',locale),exact:true}).click();await consent.waitFor({state:'visible'});
 assert.equal(await page.locator('#binso-page-content').evaluate(el=>el.inert),true,'Footer settings restore the same dialog boundary');
 await consent.getByRole('button',{name:text('Alle ablehnen',locale),exact:true}).click();await consent.waitFor({state:'hidden'});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('binso.privacy.preferences.v1')).performance),false,'Rejecting optional measurement is persisted');
 assert.equal(await page.locator('#binso-page-content').evaluate(el=>el.inert),false,'Closing consent restores the page boundary');
 return geometry;
}
