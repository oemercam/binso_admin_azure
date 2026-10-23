import assert from 'node:assert/strict';
import {moneyModuleUrl} from './data-test-modules.mjs';
import {selectAppOption} from './app-select-browser.mjs';
import {matchesLocalizedRoute} from './localized-route-contract.mjs';
const {calculateDocument}=await import(moneyModuleUrl);
/** Rendered application with isolated transport; actual HTTP/RLS stays in the native gate. */
export async function verifyDocumentDiscountBrowser({page,context,base,navigate,invoice,customer,capture}){
 let version=1,writes=0,patches=0,fail=true,lose=true;const keys=[],replays=new Map(),records=new Map();
 const build=(body,number,id)=>{const calculation=calculateDocument(body.items.map(l=>({quantity:l.quantity,unit_price:l.unitPrice,vat_rate:l.vatRate,discount:l.discount,tax_exempt:l.taxExempt})),body.currency,body.discount);return {...invoice,id,number,kind:body.kind,status:'draft',customer_id:customer.id,customer:{...customer,name:customer.name},currency:body.currency,issue_date:body.issueDate,due_date:body.dueDate,valid_until:body.validUntil,note:body.note,paid_amount:0,credit_amount:0,refund_amount:0,document_revision:'discount-'+version,calculation,subtotal:Number(calculation.subtotal),vat_amount:Number(calculation.vat),total:Number(calculation.total),items:body.items.map((l,i)=>({id:'discount-line-'+i,position:i+1,description:l.description,quantity:l.quantity,unit:l.unit??'Stück',unit_price:l.unitPrice,vat_rate:l.vatRate,discount:calculation.lines[i].discount,tax_exempt:l.taxExempt??false,line_total:Number(calculation.lines[i].net)}))};};
 const number=invoice.number,api='/api/documents/'+number;
 records.set(number,build({kind:'invoice',currency:'CHF',issueDate:'2026-10-22',dueDate:'2026-11-22',discount:{kind:'none'},items:[{description:'Synthetic discounted invoice',quantity:2,unitPrice:500,vatRate:8.1}]},number,invoice.id));
 const documents=async route=>{const r=route.request(),path=new URL(r.url()).pathname;
  if(path==='/api/documents'&&r.method()==='POST'){
   const body=r.postDataJSON(),key=r.headers()['idempotency-key'];assert.ok(key);assert.equal(body.kind,'offer');const record=build(body,'AN-DISCOUNT-TEST','discount-offer');records.set(record.number,record);return route.fulfill({status:201,json:{item:record}});
  }
  const keyNumber=decodeURIComponent(path.slice('/api/documents/'.length));if(!records.has(keyNumber))return route.fallback();
  if(r.method()==='GET')return route.fulfill({json:{item:records.get(keyNumber)}});
  if(r.method()!=='PATCH')return route.fallback();patches++;const body=r.postDataJSON(),key=r.headers()['idempotency-key'];keys.push(key);assert.ok(key,'PATCH has a stable replay key');
  if(fail){fail=false;return route.fulfill({status:503,json:{message:'Synthetic discount save unavailable'}});}
  if(replays.has(key))return route.fulfill({json:{item:replays.get(key)}});
  if(body.expectedUpdatedAt!==records.get(keyNumber).document_revision)return route.fulfill({status:409,json:{error:'document_changed',message:'Synthetic concurrent document change'}});
  version++;writes++;const record=build(body,keyNumber,records.get(keyNumber).id);records.set(keyNumber,record);replays.set(key,structuredClone(record));
  if(lose){lose=false;return route.abort('failed');}return route.fulfill({json:{item:record}});
 };
 const directory=route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/api/customers'?{items:[{...customer,discount:5}]}:{item:{...customer,discount:5}}});};
 const handlers=[['**/api/documents',documents],['**/api/documents/*',documents],['**/api/customers?*',directory],['**/api/customers/'+customer.id,directory]];
 for(const [pattern,fn] of handlers)await context.route(pattern,fn);
 const openEdit=async()=>{await page.getByRole('button',{name:'Weitere Aktionen',exact:true}).filter({visible:true}).first().click();await page.getByRole('button',{name:'Bearbeiten',exact:true}).filter({visible:true}).click();};
 const openPosition=async()=>{if(await page.locator('.mobile-position-summary').first().isVisible())await page.locator('.mobile-position-summary').first().click();else{await page.getByRole('button',{name:'Position 01',exact:true}).click();await page.getByRole('button',{name:'Rabatt',exact:true}).click();}return page.getByRole('dialog',{name:'Position bearbeiten',exact:true});};
 const global=async()=>{await page.getByRole('button',{name:'Rabattoptionen',exact:true}).click();await page.getByRole('button',{name:'Gesamtrabatt',exact:true}).click();return page.getByRole('dialog',{name:'Gesamtrabatt',exact:true});};
 const apply=async sheet=>{await sheet.getByRole('button',{name:'Übernehmen',exact:true}).click();await sheet.waitFor({state:'hidden'});};
 const total=async(expected)=>{await page.locator('.invoice-totals').filter({visible:true}).last().getByText('CHF '+expected,{exact:true}).waitFor();};
 try{
  await page.setViewportSize({width:1440,height:1000});page=await navigate(base+'/rechnungen/'+number);await page.waitForLoadState('networkidle');await openEdit();
  let sheet=await openPosition();await selectAppOption(sheet.getByLabel('Positionsrabatt',{exact:true}),'percent');await sheet.getByLabel('Rabatt in Prozent',{exact:true}).fill('10');await apply(sheet);await total('972.90');
  sheet=await global();await selectAppOption(sheet.getByLabel('Rabattart',{exact:true}),'percent');await sheet.getByLabel('Rabatt in Prozent',{exact:true}).fill('5');await apply(sheet);await total('924.26');
  await capture('desktop-combined');
  const save=()=>page.getByRole('button',{name:'Speichern',exact:true});await save().click();await page.getByText('Synthetic discount save unavailable',{exact:true}).waitFor();await save().click();await save().waitFor({state:'visible'});assert.equal(writes,1,'Lost response follows one committed mutation');await save().click();await page.getByRole('dialog',{name:'Rechnung bearbeiten',exact:true}).waitFor({state:'hidden'});assert.equal(patches,3);assert.equal(writes,1);assert.equal(new Set(keys).size,1,'Failure and lost-response retry reuse exactly one key');await total('924.26');
  await page.waitForLoadState('networkidle');await page.reload();await page.waitForLoadState('networkidle');await total('924.26');await openEdit();
  sheet=await global();await selectAppOption(sheet.getByLabel('Rabattart',{exact:true}),'none');await apply(sheet);await total('972.90');
  sheet=await global();await selectAppOption(sheet.getByLabel('Rabattart',{exact:true}),'percent');await sheet.getByLabel('Rabatt in Prozent',{exact:true}).fill('101');assert.equal(await sheet.getByRole('button',{name:'Übernehmen',exact:true}).isDisabled(),true);await sheet.getByRole('alert').waitFor();await selectAppOption(sheet.getByLabel('Rabattart',{exact:true}),'fixed');await sheet.getByLabel('Rabattbetrag',{exact:true}).fill('100');await apply(sheet);await total('864.80');
  records.get(number).document_revision='changed-by-another-editor';await save().click();await page.getByText('Synthetic concurrent document change',{exact:true}).waitFor();assert.equal(await page.getByRole('dialog',{name:'Rechnung bearbeiten',exact:true}).count(),1);await total('864.80');assert.equal(writes,1,'A stale revision cannot overwrite the current document');
  await page.getByRole('dialog',{name:'Rechnung bearbeiten',exact:true}).getByRole('button',{name:'Schliessen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();
  await page.setViewportSize({width:390,height:844});page=await navigate(base+'/angebote/neu');await page.waitForLoadState('networkidle');await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByText('Kundenrabatt vorgeschlagen: 5 %',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Rabattoptionen',exact:true}).click();await page.getByRole('button',{name:'Kundenrabatt übernehmen',exact:true}).click();sheet=page.getByRole('dialog',{name:'Gesamtrabatt',exact:true});await apply(sheet);
  sheet=await openPosition();await sheet.getByLabel('Beschreibung',{exact:true}).fill('Synthetic mobile discounted offer');await sheet.getByLabel('Menge',{exact:true}).fill('2');await sheet.getByLabel('Einzelpreis',{exact:true}).fill('500');await selectAppOption(sheet.getByLabel('Positionsrabatt',{exact:true}),'percent');await sheet.getByLabel('Rabatt in Prozent',{exact:true}).fill('10');
  const geometry=await sheet.evaluate(el=>{const footer=el.querySelector('.filter-sheet-actions,.mobile-sticky-save');const r=(footer??el).getBoundingClientRect();return {right:el.getBoundingClientRect().right,bottom:r.bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,radius:parseFloat(getComputedStyle(el.querySelector('input')).borderRadius),font:getComputedStyle(el.querySelector('input')).fontFamily};});assert.ok(geometry.right<=391&&geometry.bottom<=geometry.height+1&&!geometry.overflow,'Mobile sheet/footer fit the viewport');assert.equal(geometry.radius,12,'Shared input radius remains 12px');assert.match(geometry.font,/Inter/i,'Editor uses the shared Inter typography');await capture('mobile-position');await apply(sheet);await total('924.26');await capture('mobile-combined');
  await page.getByRole('button',{name:'Weiter',exact:true}).click();await page.getByRole('button',{name:'Weiter',exact:true}).click();await total('924.26');await page.getByRole('button',{name:'Als Entwurf speichern',exact:true}).click();await page.waitForURL(url=>matchesLocalizedRoute(url,base+'/angebote/AN-DISCOUNT-TEST','de'));await total('924.26');assert.equal(records.get('AN-DISCOUNT-TEST').calculation.discount.value,'5.00');
  await page.waitForLoadState('networkidle');await page.reload();await page.waitForLoadState('networkidle');await total('924.26');await capture('mobile-persisted');
 }finally{for(const [pattern,fn] of handlers)await context.unroute(pattern,fn);}
 console.log('Discount editor browser: desktop/mobile, both stages, explicit customer proposal, invalid/switch/remove, saved reload, failure/lost-response replay and stale-edit retention passed.');
}
