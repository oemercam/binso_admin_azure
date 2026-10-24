import assert from 'node:assert/strict';
import {verifyChoiceField} from './form-choice-browser.mjs';

/** Shared dossier geometry; content and server financial values are not replaced. */
export async function assertCustomerDossier(page){
 const dossier=page.locator('.detail-grid[data-layout="dossier"]');
 const context=dossier.locator(':scope > [data-area="context"]');
 assert.equal(await context.count(),1,'Contact and address share one dossier context owner');
 const facts=await context.locator('[data-area="facts"]').boundingBox();
 const extra=await context.locator('[data-area="extra"]').boundingBox();
 const records=await dossier.locator('[data-area="records"]').boundingBox();
 if(page.viewportSize().width>760){
  assert.ok(Math.abs(facts.x-extra.x)<1,'Desktop context has one aligned contact/address column');
  assert.ok(extra.y>=facts.y+facts.height&&extra.y-facts.y-facts.height<=25,'Address follows contact without waiting for the left financial rows');
 }else assert.ok(extra.y>=records.y+records.height,'Mobile supplementary facts follow open invoices');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Customer dossier has no horizontal overflow');
}

/** Exercise real components using only isolated responses from the existing fixture. */
export async function verifyCustomerStates(page,{base,capture=async()=>{}}){
 const url=base+'/kunden/customer-one';
 const endpoint='**/api/customers/customer-one?include=workspace';
 let mode='loading',release;
 const gate=new Promise(resolve=>{release=resolve});
 // Page routes override the context fixture; fallback delegates to it explicitly.
 const handler=async route=>{
  if(mode==='loading')await gate;
  if(mode==='error')return route.fulfill({status:503,json:{message:'Synthetic dossier unavailable'}});
  if(mode==='empty')return route.fulfill({json:{item:{id:'customer-one',name:'Synthetic empty customer',status:'active'},contacts:[],documents:[],summary:{invoices:[],payments:[],credits:[]},statistics:[],activity:[]}});
  return route.fallback();
 };
 await page.route(endpoint,handler);
 try{
  await page.goto(url);
  await page.locator('.loading-state').waitFor({state:'attached'});
  assert.equal(await page.locator('.loading-state .sr-only').textContent(),'Die Kundendaten werden abgerufen.','Loading remains announced to assistive technology');
  assert.equal(await page.locator('.loading-state .sr-only').evaluate(el=>getComputedStyle(el).position),'absolute','Loading copy is visually hidden, not removed from accessibility');
  await capture('loading');mode='error';release();
  await page.getByRole('alert').getByText('Synthetic dossier unavailable',{exact:true}).waitFor();await capture('error');
  mode='normal';await page.getByRole('button',{name:'Erneut versuchen',exact:true}).click();
  await page.locator('.detail-grid[data-layout="dossier"]').waitFor();
  await assertCustomerDossier(page);
  await page.getByRole('tab',{name:'Übersicht',exact:true}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Dokumente',exact:true}).getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowLeft');assert.equal(await page.getByRole('tab',{name:'Übersicht',exact:true}).getAttribute('aria-selected'),'true');await page.locator('.contact-main').waitFor();
  const contact=page.locator('button.contact-main');await contact.focus();await contact.press('Enter');
  const actions=page.getByRole('dialog',{name:'Kontaktaktionen',exact:true});await actions.waitFor();await actions.getByRole('button',{name:'Kontakt bearbeiten',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Kontakt bearbeiten',exact:true});await dialog.waitFor();await capture('contact');
  await verifyChoiceField(page,dialog.locator('.form-check'),{capture:width=>capture('choice-'+width)});
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert.equal(await contact.evaluate(el=>el===document.activeElement),true,'Contact dialog restores keyboard focus');
  await page.getByRole('tab',{name:'Dokumente',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.customer-tab-panel .mobile-record-list .document-summary-row').length===2);
  await page.locator('.customer-tab-panel').getByRole('heading',{name:'Dokumente',exact:true}).waitFor();assert.equal(await page.locator('.bo-statistics').count(),0,'Documents retain files and records without a second finance analysis');assert.equal(await page.locator('.customer-tab-panel .mobile-record-list .document-summary-row').count(),2,'Actual invoice and offer remain available');assert.equal(await page.getByPlaceholder('Dokumente suchen...',{exact:true}).isVisible(),true,'Customer documents use the common searchable collection');await page.getByRole('button',{name:'Dokument erstellen',exact:true}).click();const documentActions=page.getByRole('dialog',{name:'Dokument erstellen',exact:true});await documentActions.waitFor();assert.equal(await documentActions.getByRole('link',{name:'Angebot erstellen',exact:true}).getAttribute('href'),'/angebote/neu?customerId=customer-one','New offer retains the dossier customer');assert.equal(await documentActions.getByRole('link',{name:'Rechnung erstellen',exact:true}).getAttribute('href'),'/rechnungen/neu?customerId=customer-one','New invoice retains the dossier customer');await page.keyboard.press('Escape');await documentActions.waitFor({state:'hidden'});await capture('documents');
  const session='**/api/auth/session';
  const readOnly=route=>route.fulfill({json:{authenticated:true,tenant:{id:'fixture-tenant',role:'owner',plan:'pro',readOnly:true}}});
  await page.route(session,readOnly);
  try{
   await page.goto(url+'?tab=overview');await page.locator('button.contact-main').waitFor();
   assert.equal(await page.locator('button.contact-main').isDisabled(),false,'Read-only contacts retain communication actions');await page.locator('button.contact-main').click();const readActions=page.getByRole('dialog',{name:'Kontaktaktionen',exact:true});await readActions.waitFor();assert.equal(await readActions.getByRole('button',{name:'Kontakt bearbeiten',exact:true}).isDisabled(),true,'Read-only cannot enter the editor');assert.equal(await readActions.getByRole('button',{name:'Kontakt entfernen',exact:true}).isDisabled(),true,'Read-only cannot remove a contact');await page.keyboard.press('Escape');await readActions.waitFor({state:'hidden'});
   assert.equal(await page.getByRole('button',{name:'Kontakt hinzufügen',exact:true}).isDisabled(),true,'Read-only cannot create contacts');
   assert.equal(await page.getByRole('dialog').count(),0);await capture('read-only');
  }finally{await page.unroute(session,readOnly)}
  mode='empty';await page.goto(url);await page.getByText('Keine Kontakte erfasst',{exact:true}).first().waitFor();
  await page.getByText('Keine Rechnungen erfasst',{exact:true}).waitFor();await capture('empty');
  await page.getByRole('tab',{name:'Verlauf',exact:true}).click();await page.getByText('Keine Geschäftsaktivität vorhanden',{exact:true}).waitFor();
 }finally{release();await page.unroute(endpoint,handler)}
}
