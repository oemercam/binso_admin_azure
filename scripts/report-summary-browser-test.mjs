import {qaBrowserServer} from './qa-browser-server.mjs';
import {verifyPdfZoom} from './document-controls-browser.mjs';
import {verifyPublicReport} from './public-report-browser.mjs';
import {selectAppOption} from './app-select-browser.mjs';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const output=process.env.BINSO_REPORT_OUTPUT;if(!output)throw Error('Explicit isolated evidence directory required');await fs.mkdir(output,{recursive:true});
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright'),engine=process.env.BINSO_UX_BROWSER??'chromium',port='3288',base='http://127.0.0.1:'+port;
try{await fetch(base+'/api/health');throw Error('Report browser port occupied')}catch(error){if(error.message==='Report browser port occupied')throw error;}
const uiAuth=await createUiAuthFixture();
const {default:PDFDocument}=await import('pdfkit');
const reportPdf=await new Promise((resolve,reject)=>{const doc=new PDFDocument({size:'A4'}),chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.text('Synthetic immutable report. No production data.');doc.end();});
const launch=qaBrowserServer(port,{...process.env,...uiAuth.env});const server=spawn(process.execPath,launch.args,{stdio:['ignore','pipe','pipe'],env:launch.env});let logs='',browser;server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
try{
 for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(i>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});const results=[];
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:780}});await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));},theme);
  let exports=0,prepared=0,pdfReads=0,currentRole='owner',readOnly=false;const sendKeys=[],shareRequests=[],shareRows=[];await context.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url());let json={items:[],total:0};
   if(url.pathname==='/api/reports/exports'){
    assert.equal(request.method(),'POST');assert.match(request.headers()['idempotency-key'],/^[0-9a-f-]{36}$/i);const body=request.postDataJSON();assert.equal(body.locale,'de');assert.equal(typeof body.query,'string');prepared++;
    return route.fulfill({json:{item:{id:'00000000-0000-4000-8000-000000000072'}}});
   }
   if(url.pathname==='/api/reports/exports/00000000-0000-4000-8000-000000000072/send'){
    if(request.method()==='GET')return route.fulfill({json:{items:[]}});
    assert.equal(request.method(),'POST');const body=request.postDataJSON();assert.deepEqual(body,{recipient:'recipient@example.invalid',subject:'Synthetic subject',message:'Synthetic report message'});sendKeys.push(request.headers()['idempotency-key']);await new Promise(resolve=>setTimeout(resolve,150));
    return route.fulfill({json:{id:'00000000-0000-4000-8000-000000000073',status:'uncertain',providerAccepted:false,deliveryConfirmed:false}});
   }
   if(url.pathname==='/api/reports/exports/00000000-0000-4000-8000-000000000072/share'){
    if(request.method()==='GET')return route.fulfill({json:{items:shareRows}});
    assert.equal(request.method(),'POST');const body=request.postDataJSON();shareRequests.push(body);
    if(body.action==='create'){assert.deepEqual(body,{action:'create',recipient:'recipient@example.invalid',days:7});assert.match(request.headers()['idempotency-key'],/^[0-9a-f-]{36}$/i);const item={id:'00000000-0000-4000-8000-000000000074',recipient:body.recipient,expiresAt:'2030-01-01T00:00:00Z',revokedAt:null,active:true};shareRows.push(item);return route.fulfill({json:{item:{...item,url:base+'/bericht?lang=de#'+'R'.repeat(43)}}});}
    assert.deepEqual(body,{action:'revoke',linkId:shareRows[0].id});shareRows[0].active=false;shareRows[0].revokedAt='2026-10-21T12:00:00Z';return route.fulfill({json:{ok:true}});
   }
   assert.equal(request.method(),'GET','Only explicit snapshot preparation/send may POST in this isolated UI proof');
   if(url.pathname==='/api/reports/exports/00000000-0000-4000-8000-000000000072'){pdfReads++;return route.fulfill({contentType:'application/pdf',body:reportPdf});}
   if(url.pathname==='/api/auth/session')json={authenticated:true,configured:true,user:{id:'fixture-owner'},tenant:{id:'00000000-0000-4000-8000-000000000001',role:currentRole,plan:'pro',moduleProfile:'standard',readOnly},security:{mfaEnabled:false,enrollmentRequired:false}};
   if(url.pathname==='/api/settings/profile')json={item:{display_name:'Synthetic Owner',language:'de',theme},email:'fixture@example.invalid'};
   if(url.pathname==='/api/settings/company')json={item:{name:'Synthetic Company'}};
   if(url.pathname==='/api/time-tracker')json={item:null};
   if(url.pathname==='/api/reports'){
    if(url.searchParams.get('format')==='csv'){exports++;return route.fulfill({contentType:'text/csv; charset=utf-8',headers:{'Content-Disposition':'attachment; filename="binso-fixture.csv"'},body:'"Synthetic metric";"1.00";"CHF"\r\n'});}
    json={period:{from:'2026-10-01',to:'2026-10-21'},asOf:'2026-10-21T12:00:00Z',customers:null,projects:null,time:null,employees:null,expenses:null,offers:[{currency:'CHF',status:'accepted',count:'2',volume:'1000.00'},{currency:'CHF',status:'declined',count:'1',volume:'500.00'},{currency:'CHF',status:'draft',count:'900',volume:'900.00'},{currency:'EUR',status:'sent',count:'500',volume:'500.00'}],expenseCategories:[{currency:'CHF',category:'Synthetic travel category',amount:'25.00'},{currency:'EUR',category:'Synthetic travel category',amount:'7.00'}],payments:[{currency:'CHF',amount:'2000.00',refund_amount:'100.00',net_amount:'1900.00'}],invoices:[{currency:'CHF',invoiced:'1234.56',open:'400.00',overdue:'50.00',asOf:'2026-10-21'}]};
   }
   return route.fulfill({json});
  });
  const page=await context.newPage();await page.goto(base+'/berichte');await page.getByRole('heading',{name:'Rechnungen',exact:true}).waitFor();
  for(const label of ['Fakturiertes Volumen','Offen','Überfällig','Eingegangene Zahlungen','Rückerstattungen','Zahlungseingänge nach Rückerstattungen'])assert.equal(await page.getByText(label,{exact:true}).count(),1,'Distinct financial meaning: '+label);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Financial KPIs never widen the page');
  const decisions=page.locator('.bo-ring-chart');await decisions.getByRole('group',{name:'Angebotsentscheidungen: 3',exact:true}).waitFor();
  const accepted=decisions.getByRole('button',{name:'Angenommen: 2',exact:true});await accepted.focus();await accepted.press('Enter');await page.waitForFunction(()=>document.querySelector('.bo-ring-chart output')?.textContent==='Angenommen: 2');assert.equal(await accepted.getAttribute('aria-pressed'),'true','Actual common ring exposes keyboard selection without including drafts/pending');
  const categories=page.locator('section').filter({has:page.getByRole('heading',{name:'Genehmigte Spesen nach Kategorie',exact:true})}).last();
  assert.equal(await categories.locator('dt').filter({hasText:'Synthetic travel category'}).count(),2,'Same category in two currencies remains two distinct rows');
  assert.deepEqual(await categories.locator('dd').allTextContents(),['CHF 25.00','EUR 7.00']);
  await categories.getByText('Nach Belegdatum, einschliesslich noch nicht erstatteter Spesen. Kein Zahlungsabfluss und keine vollständige Kostenrechnung.',{exact:true}).waitFor();
  await page.getByText('Fakturiertes Volumen berücksichtigt Rechnungen und Gutschriften im gewählten Zeitraum. Offene und überfällige Forderungen zeigen den aktuellen Stand.',{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,`${theme}-${width}-report.png`),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Per E-Mail senden',exact:true}).count(),1,'Explicit send is offered only with the existing write permission');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'CSV exportieren',exact:true}).click()]);assert.equal(download.suggestedFilename(),'binso-fixture.csv');assert.equal(exports,1,'One explicit export request');
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();await page.getByRole('button',{name:'PDF ansehen',exact:true}).click();
  const preview=page.getByRole('dialog',{name:'Berichte',exact:true});await preview.locator('canvas[data-rendered-page="1"][data-rendered-zoom="1"]').waitFor();assert.equal(prepared,1);assert.equal(pdfReads,1,'Preview uses the one immutable prepared snapshot');
  await verifyPdfZoom(page);
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true}));const saved=page.waitForEvent('download');await preview.getByRole('button',{name:'Teilen oder herunterladen',exact:true}).click();const pdfDownload=await saved;
  assert.deepEqual(await fs.readFile(await pdfDownload.path()),reportPdf,'Preview and downloaded report use byte-identical immutable content');assert.equal(pdfReads,1,'Download never silently regenerates the report');await preview.getByRole('button',{name:'Vorschau schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();await page.getByRole('button',{name:'Per E-Mail senden',exact:true}).click();const compose=page.getByRole('dialog',{name:'Bericht senden',exact:true});await compose.waitFor();assert.equal(prepared,2);assert.equal(pdfReads,2);
  await compose.getByLabel('Empfänger',{exact:true}).fill('recipient@example.invalid');await compose.getByLabel('Betreff',{exact:true}).fill('Synthetic subject');await compose.getByLabel('Begleittext',{exact:true}).fill('Synthetic report message');
  await compose.getByRole('button',{name:'Schliessen',exact:true}).last().click();const discard=page.getByRole('alertdialog');await discard.waitFor();await discard.getByRole('button',{name:'Weiter bearbeiten',exact:true}).click();assert.equal(await compose.getByLabel('Begleittext',{exact:true}).inputValue(),'Synthetic report message');
  await compose.getByRole('button',{name:'Per E-Mail senden',exact:true}).dblclick();await compose.getByText('Der Versand läuft oder ist ungeklärt. Bitte den Versandstatus prüfen, nicht erneut senden.',{exact:true}).waitFor();assert.equal(sendKeys.length,1,'One explicit send despite double click');assert.equal(await compose.getByLabel('Empfänger',{exact:true}).isDisabled(),true);
  await Promise.all([page.waitForResponse(response=>response.url().endsWith('/send')&&response.request().method()==='POST'),compose.getByRole('button',{name:'Versandstatus prüfen',exact:true}).click()]);assert.equal(sendKeys.length,2);assert.equal(sendKeys[0],sendKeys[1],'Outcome checks retain the exact request identity');
  await compose.getByRole('button',{name:'Schliessen',exact:true}).last().click();await page.getByRole('alertdialog').getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();await compose.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();await page.getByRole('button',{name:'Freigabelink',exact:true}).click();const share=page.getByRole('dialog',{name:'Bericht freigeben',exact:true});await share.waitFor();
  await share.getByLabel('Empfänger',{exact:true}).fill('recipient@example.invalid');await selectAppOption(share.getByLabel('Gültigkeit',{exact:true}),'7');await share.getByRole('button',{name:'Link erstellen',exact:true}).click();const shareUrl=share.getByLabel('Freigabelink',{exact:true});await shareUrl.waitFor();assert.ok((await shareUrl.inputValue()).endsWith('#'+'R'.repeat(43)));assert.equal(shareRequests.length,1,'Link creation is explicit and does not send mail');
  await page.screenshot({path:path.join(output,`${theme}-${width}-report-share.png`),animations:'disabled'});
  await share.getByRole('button',{name:'Widerrufen',exact:true}).click();const revoke=page.getByRole('alertdialog');await revoke.waitFor();await revoke.getByRole('button',{name:'Abbrechen',exact:true}).click();assert.equal(shareRequests.length,1,'Cancelling revocation has no side effect');
  await share.getByRole('button',{name:'Widerrufen',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Widerrufen',exact:true}).click();await share.getByText('Widerrufen',{exact:true}).waitFor();await shareUrl.waitFor({state:'hidden'});assert.equal(shareRequests.length,2);await share.getByRole('button',{name:'Schliessen',exact:true}).last().click();await share.waitFor({state:'hidden'});
  currentRole='reader';await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Per E-Mail senden',exact:true}).count(),0,'Readers retain exports but no outbound send');assert.equal(await page.getByRole('button',{name:'Freigabelink',exact:true}).count(),0);await page.keyboard.press('Escape');
  currentRole='owner';readOnly=true;await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Per E-Mail senden',exact:true}).count(),0,'Read-only company access never offers outbound send');await page.keyboard.press('Escape');
  await verifyPublicReport(page,{base,pdf:reportPdf,capture:phase=>page.screenshot({path:path.join(output,`${theme}-${width}-public-report-${phase}.png`),animations:'disabled'})});
  results.push({theme,width,status:'passed',scope:'Synthetic aggregate HTTP UI and download proof with real isolated SSR session; database and field-right tests are separate'});await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log('Report UI: distinct period/current/cash/refund meanings, central actions, one export and responsive light/dark geometry passed.');
}finally{await browser?.close();server.kill();await uiAuth.close();}
