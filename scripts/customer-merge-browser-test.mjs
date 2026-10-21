import {qaBrowserServer} from './qa-browser-server.mjs';
import {createUiAuthFixture} from './ui-auth-fixture.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright'),engine=process.env.BINSO_UX_BROWSER??'chromium',port='3283',base='http://127.0.0.1:'+port,output=process.env.BINSO_MERGE_OUTPUT;
if(!output)throw Error('Explicit isolated evidence path is required');await fs.mkdir(output,{recursive:true});
try{if((await fetch(base+'/api/health')).ok)throw Error('Merge browser port occupied');}catch(error){if(error.message==='Merge browser port occupied')throw error;}
const auth=await createUiAuthFixture(),launch=qaBrowserServer(port,{...process.env,...auth.env}),server=spawn(process.execPath,launch.args,{stdio:['ignore','pipe','pipe'],env:launch.env});let logs='',browser;server.stdout.on('data',v=>logs+=v);server.stderr.on('data',v=>logs+=v);
const source='0dcd8673-f466-4d52-9a81-a65455d6e986',target='fedcedcb-ad50-4941-a078-c322dc471829',revision='a'.repeat(64);
try{
 for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i>120||server.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,250));}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});const results=[];
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:780}});await context.addCookies(auth.cookies.map(cookie=>({...cookie,url:base})));await context.addInitScript(theme=>{localStorage.setItem('binso.theme.mode',theme);localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false}));},theme);
  const page=await context.newPage(),keys=[];let writes=0,statusReads=0;
  await context.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url());let json={items:[],total:0};
   if(url.pathname==='/api/auth/session')json={authenticated:true,configured:true,user:{id:'fixture-owner'},tenant:{id:'00000000-0000-4000-8000-000000000001',role:'owner',plan:'pro',moduleProfile:'standard',readOnly:false},security:{mfaEnabled:false,enrollmentRequired:false}};
   if(url.pathname==='/api/settings/profile')json={item:{id:'fixture-owner',display_name:'Synthetic Owner',language:'de',theme},email:'fixture@example.invalid'};
   if(url.pathname==='/api/settings/company')json={item:{name:'Synthetic Company'}};
   if(url.pathname==='/api/finance/overview')json={invoices:[],offers:[],time:null};
   if(url.pathname==='/api/time-tracker')json={item:null};
   if(url.pathname==='/api/customers')json={items:[{id:source,name:'Synthetic duplicate',customer_no:'S-1'},{id:target,name:'Synthetic retained',customer_no:'T-1'}],total:2};
   if(url.pathname==='/api/customers/merge'){
    const body=request.postDataJSON();
    if(body.action==='preview'){assert.equal(body.sourceId,source);assert.equal(body.targetId,target);json={item:{revision,eligible:true,source:{id:source,name:'Synthetic duplicate',number:'S-1'},target:{id:target,name:'Synthetic retained',number:'T-1'},changes:[{field:'phone',label:'Telefon',sourceValue:'Synthetic phone',targetValue:'',mode:'fill'}],contactsToMove:1,activitiesToMove:0,blockers:[]}};}
    else if(body.action==='commit'){writes++;keys.push(request.headers()['idempotency-key']);assert.equal(body.confirmed,true);assert.equal(body.revision,revision);return route.fulfill({status:503,json:{error:'service_unavailable',message:'Synthetic unknown response'}});}
    else if(body.action==='status'){statusReads++;assert.equal(body.key,keys[0]);json={state:'not_recorded'};}
    else if(body.action==='cancel'){keys.push(request.headers()['idempotency-key']);json={cancelled:true,id:target,sourceId:source};}else throw Error('Unexpected merge action');
   }
   await route.fulfill({json});
  });
  await page.goto(base+'/kunden');await page.getByRole('button',{name:'Kundenaktionen',exact:true}).click();await page.getByRole('button',{name:'Dubletten zusammenführen',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Kundendubletten zusammenführen',exact:true});await dialog.waitFor();
  await dialog.getByRole('combobox',{name:'Dublette',exact:true}).click();await page.getByRole('option',{name:'Synthetic duplicate',exact:true}).click();
  await dialog.getByRole('combobox',{name:'Zielkunde',exact:true}).click();await page.getByRole('option',{name:'Synthetic retained',exact:true}).click();
  await dialog.getByRole('button',{name:'Vorschau prüfen',exact:true}).click();await dialog.getByText('Keine geschützten Verknüpfungen gefunden',{exact:true}).waitFor();assert.equal(writes,0);
  assert.equal(await dialog.getByRole('button',{name:'Zusammenführen',exact:true}).isDisabled(),true);await dialog.getByRole('checkbox').check();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(output,`${theme}-${width}-preview.png`),animations:'disabled'});
  await dialog.getByRole('button',{name:'Zusammenführen',exact:true}).click();await dialog.getByText('Synthetic unknown response',{exact:true}).waitFor();assert.equal(writes,1,'No automatic retry after an uncertain response');
  await dialog.getByRole('button',{name:'Status prüfen',exact:true}).click();await dialog.getByRole('button',{name:'Erneut bestätigen',exact:true}).waitFor();assert.equal(statusReads,1);assert.equal(writes,1,'Status reads cannot repeat a mutation');
  await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.getByRole('button',{name:'Änderungen verwerfen',exact:true}).click();
  await dialog.waitFor({state:'hidden'});assert.equal(keys.length,2);assert.equal(keys[0],keys[1],'Cancellation settles exactly the original uncertain intent');
  results.push({theme,width,passed:true,scope:'Synthetic transport; real migrated persistence and runtime RLS are verified separately'});await context.close();
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));console.log('Customer merge browser: explicit preview/confirmation, responsive light/dark, uncertain response, status without writes and same-intent cancellation passed.');
}finally{await browser?.close();server.kill();await auth.close();}
