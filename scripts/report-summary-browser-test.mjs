import {qaBrowserServer} from './qa-browser-server.mjs';
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
const launch=qaBrowserServer(port,{...process.env,...uiAuth.env});const server=spawn(process.execPath,launch.args,{stdio:['ignore','pipe','pipe'],env:launch.env});let logs='',browser;server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
try{
 for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(i>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});const results=[];
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:780}});await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));},theme);
  let exports=0;await context.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url());assert.equal(request.method(),'GET','This UI proof cannot mutate data');let json={items:[],total:0};
   if(url.pathname==='/api/auth/session')json={authenticated:true,configured:true,user:{id:'fixture-owner'},tenant:{id:'00000000-0000-4000-8000-000000000001',role:'owner',plan:'pro',moduleProfile:'standard',readOnly:false},security:{mfaEnabled:false,enrollmentRequired:false}};
   if(url.pathname==='/api/settings/profile')json={item:{display_name:'Synthetic Owner',language:'de',theme},email:'fixture@example.invalid'};
   if(url.pathname==='/api/settings/company')json={item:{name:'Synthetic Company'}};
   if(url.pathname==='/api/time-tracker')json={item:null};
   if(url.pathname==='/api/reports'){
    if(url.searchParams.get('format')==='csv'){exports++;return route.fulfill({contentType:'text/csv; charset=utf-8',headers:{'Content-Disposition':'attachment; filename="binso-fixture.csv"'},body:'"Synthetic metric";"1.00";"CHF"\r\n'});}
    json={period:{from:'2026-10-01',to:'2026-10-21'},asOf:'2026-10-21T12:00:00Z',customers:null,projects:null,time:null,employees:null,expenses:null,expenseCategories:[{currency:'CHF',category:'Synthetic travel category',amount:'25.00'},{currency:'EUR',category:'Synthetic travel category',amount:'7.00'}],payments:[{currency:'CHF',amount:'2000.00',refund_amount:'100.00',net_amount:'1900.00'}],invoices:[{currency:'CHF',invoiced:'1234.56',open:'400.00',overdue:'50.00',asOf:'2026-10-21'}]};
   }
   return route.fulfill({json});
  });
  const page=await context.newPage();await page.goto(base+'/berichte');await page.getByRole('heading',{name:'Rechnungen',exact:true}).waitFor();
  for(const label of ['Fakturiertes Volumen','Offen','Überfällig','Eingegangene Zahlungen','Rückerstattungen','Zahlungseingänge nach Rückerstattungen'])assert.equal(await page.getByText(label,{exact:true}).count(),1,'Distinct financial meaning: '+label);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Financial KPIs never widen the page');
  const categories=page.locator('section').filter({has:page.getByRole('heading',{name:'Genehmigte Spesen nach Kategorie',exact:true})}).last();
  assert.equal(await categories.locator('dt').filter({hasText:'Synthetic travel category'}).count(),2,'Same category in two currencies remains two distinct rows');
  assert.deepEqual(await categories.locator('dd').allTextContents(),['CHF 25.00','EUR 7.00']);
  await categories.getByText('Nach Belegdatum, einschliesslich noch nicht erstatteter Spesen. Kein Zahlungsabfluss und keine vollständige Kostenrechnung.',{exact:true}).waitFor();
  await page.getByText('Fakturiertes Volumen berücksichtigt Rechnungen und Gutschriften im gewählten Zeitraum. Offene und überfällige Forderungen zeigen den aktuellen Stand.',{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,`${theme}-${width}-report.png`),fullPage:true,animations:'disabled'});
  await page.getByRole('button',{name:'Berichtsaktionen',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Per E-Mail senden',exact:true}).count(),0,'Unimplemented direct report mail is never advertised');
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'CSV exportieren',exact:true}).click()]);assert.equal(download.suggestedFilename(),'binso-fixture.csv');assert.equal(exports,1,'One explicit export request');
  results.push({theme,width,status:'passed',scope:'Synthetic aggregate HTTP UI and download proof with real isolated SSR session; database and field-right tests are separate'});await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log('Report UI: distinct period/current/cash/refund meanings, central actions, one export and responsive light/dark geometry passed.');
}finally{await browser?.close();server.kill();await uiAuth.close();}
