import {qaBrowserServer} from './qa-browser-server.mjs';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright'),engine=process.env.BINSO_UX_BROWSER??'chromium',port='3281',base='http://127.0.0.1:'+port,output=process.env.BINSO_IMPORT_OUTPUT;
if(!output)throw Error('Explicit isolated evidence path is required');await fs.mkdir(output,{recursive:true});
try{if((await fetch(base+'/api/health')).ok)throw Error('Import browser port occupied')}catch(error){if(error.message==='Import browser port occupied')throw error;}
const uiAuth=await createUiAuthFixture();
const launch=qaBrowserServer(port,{...process.env,...uiAuth.env});const server=spawn(process.execPath,launch.args,{stdio:['ignore','pipe','pipe'],env:launch.env});let logs='';server.stdout.on('data',chunk=>logs+=chunk);server.stderr.on('data',chunk=>logs+=chunk);let browser;
try{
 for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(i>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,250));}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});const results=[];
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:780}});await context.addCookies(uiAuth.cookies.map(cookie=>({...cookie,url:base})));await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));},theme);
  const page=await context.newPage();let commits=0,keys=[],failed=false;
  await context.route('**/api/**',async route=>{const request=route.request(),url=new URL(request.url());let json={items:[],total:0};
   if(url.pathname==='/api/auth/session')json={authenticated:true,configured:true,user:{id:'fixture-owner'},tenant:{id:'00000000-0000-4000-8000-000000000001',role:'owner',plan:'pro',moduleProfile:'standard',readOnly:false},security:{mfaEnabled:false,enrollmentRequired:false}};
   if(url.pathname==='/api/settings/profile')json={item:{id:'fixture-owner',display_name:'Synthetic Owner',first_name:'Synthetic',last_name:'Owner',language:'de',theme},email:'fixture@example.invalid'};
   if(url.pathname==='/api/settings/company')json={item:{name:'Synthetic Company'}};
   if(url.pathname==='/api/time-tracker')json={item:null};if(url.pathname==='/api/finance/overview')json={invoices:[],offers:[],time:null};
   if(url.pathname==='/api/customers/import'){
    if(request.headers()['content-type']?.startsWith('multipart/form-data'))json={headers:['Firma','Vorname','Nachname'],rows:[['Synthetic New AG','Test','Person'],['Duplicate AG','Other','Person']],rowNumbers:[2,3],sheets:[],sheet:''};
    else{const body=request.postDataJSON();if(body.action==='preview'){assert.equal(body.rows.length,2);assert.equal(body.rows[0].name,'Synthetic New AG');json={items:body.rows.map((input,index)=>({row:index+2,input,issues:index?['Mögliche Dublette. Diese Zeile wird nicht importiert.']:[],duplicate:!!index}))};}
    else{assert.equal(body.action,'commit');assert.equal(body.rows.length,1);assert.equal(body.rows[0].name,'Synthetic New AG');commits++;keys.push(request.headers()['idempotency-key']);if(!failed){failed=true;return route.fulfill({status:503,json:{error:'service_unavailable',message:'Der Dienst ist momentan nicht verfügbar.'}})}await new Promise(resolve=>setTimeout(resolve,80));json={count:1,created:[{id:'fixture-created'}]};}}
   }
   return route.fulfill({json});
  });
  await page.goto(base+'/kunden');try{await page.getByRole('button',{name:'Kundenaktionen',exact:true}).click({timeout:10000});}catch(error){await page.screenshot({path:path.join(output,'menu-failure.png')});console.log(JSON.stringify({url:page.url(),body:(await page.locator('body').innerText()).slice(0,2200),buttons:await page.getByRole('button').allTextContents()}));throw error;}await page.getByRole('button',{name:'Importieren',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Kunden importieren',exact:true});await dialog.waitFor();
  await dialog.locator('input[type="file"]').setInputFiles({name:'synthetic.csv',mimeType:'text/csv',buffer:Buffer.from('Firma;Vorname;Nachname\nSynthetic New AG;Test;Person\nDuplicate AG;Other;Person')});await dialog.getByRole('button',{name:'Datei prüfen',exact:true}).click();
  await dialog.getByRole('button',{name:'Vorschau prüfen',exact:true}).click();const duplicate=dialog.locator('.document-summary-row').filter({has:page.getByText('Duplicate AG',{exact:true})});await duplicate.waitFor();assert.equal(await duplicate.locator('b').innerText(),'Duplicate AG');assert.equal((await duplicate.locator('small').innerText()).replace(/\s+/g,' ').trim(),'Zeile 3 · Mögliche Dublette. Diese Zeile wird nicht importiert.');assert.equal(await duplicate.getByText('Prüfen',{exact:true}).count(),1);assert.equal(await dialog.locator('.document-summary-row').count(),2,'Both the valid and rejected source row remain visible');
  assert.equal(commits,0,'File and mapping previews cannot create records');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(output,theme+'-'+width+'-preview.png')});
  await dialog.getByRole('button',{name:'Neue Datensätze importieren',exact:true}).click();await dialog.getByText('Der Dienst ist momentan nicht verfügbar.',{exact:true}).waitFor();assert.equal(commits,1,'No automatic retry of an ambiguous write');
  await dialog.getByRole('button',{name:'Neue Datensätze importieren',exact:true}).dblclick();await dialog.getByText('Import abgeschlossen',{exact:false}).waitFor();assert.equal(commits,2);assert.equal(keys[0],keys[1],'Explicit retry reuses the same batch identity');assert.ok(keys[0]);
  results.push({theme,width,passed:true,evidence:'Synthetic HTTP UI fixture; real isolated database/worker tests are separate'});await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log('Import browser: mapping, duplicate exclusion, explicit commit, ambiguous-write retry identity, double-tap guard and responsive light/dark cases passed.');
}finally{await browser?.close();server.kill();await uiAuth.close();}
