import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pathToFileURL} from 'node:url';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const engine=process.env.BINSO_TIMER_BROWSER_ENGINE??'chromium';assert.ok(['chromium','webkit'].includes(engine));
const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
const base='http://127.0.0.1:'+port,output=process.env.BINSO_TIMER_BROWSER_OUTPUT??'.qa/timer-calendar';
await fs.mkdir(output,{recursive:true});
const env={...process.env,DATABASE_URL:'',APP_URL:base,APP_MODE:'local',SESSION_COOKIE_NAME:'binso_timer_browser_fixture'};
for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_)/.test(key))delete env[key];
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
let logs='',browser;server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
try{
 for(let attempt=0;;attempt++){try{if((await fetch(base+'/login')).ok)break;}catch{}if(attempt>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
 browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  let finished=false,confirmed=0;
  page.on('pageerror',error=>errors.push(error.message));
  await context.addCookies([{name:'binso_timer_browser_fixture',value:'synthetic-ui-only-not-a-session',url:base}]);
  await context.addInitScript(()=>localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({essential:true,performance:false})));
  await context.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname,respond=(json,status=200)=>route.fulfill({status,json});
   if(path==='/api/auth/session')return respond({authenticated:true,user:{id:'synthetic-timer-owner',name:'Timer owner',email:'timer@example.invalid'},tenant:{id:'synthetic-timer-company',role:'owner',plan:'business',moduleProfile:'standard'},security:{mfaEnabled:false,enrollmentRequired:false}});
   if(path==='/api/settings/profile')return respond({item:{id:'synthetic-timer-owner',display_name:'Timer owner',language:'de'}});
   if(path==='/api/settings/company')return respond({item:{name:'Timer fixture',setup_completed_at:new Date().toISOString()}});
   if(path==='/api/time-tracker'){
    if(route.request().method()==='GET')return respond({tracker:finished?null:{state:'paused',seconds:1800,accumulated_seconds:1800,project_label:'Legacy timer',legacySeconds:1800,started_at:'2026-10-29T09:00:00Z'}});
    const body=route.request().postDataJSON();assert.equal(body.action,'finish');
    if(!body.legacyDays)return respond({error:'timer_dates_required',message:'Bitte die bisherigen Zeiten nach Datum bestätigen.'},409);
    assert.deepEqual(body.legacyDays,[{date:'2026-10-29',seconds:1800}]);confirmed++;finished=true;
    return respond({tracker:null,item:{id:'synthetic-daily-entry'},items:[{id:'synthetic-daily-entry'}]});
   }
   return respond({items:[],total:0,total_minutes:0});
  });
  await page.goto(base+'/zeit');await page.getByRole('button',{name:'Stoppen',exact:true}).click();
  const save=page.getByRole('button',{name:'Bestätigen und speichern',exact:true});await save.waitFor();
  assert.equal(await page.getByLabel('Datum',{exact:true}).inputValue(),'','No guessed date');assert.ok(await save.isDisabled(),'Cannot save before explicit date selection');
  await page.getByLabel('Datum',{exact:true}).fill('2026-10-29');await page.getByLabel('Dauer (Sekunden)',{exact:true}).focus();await page.keyboard.press('Tab');
  assert.ok(await save.isEnabled());await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  await page.screenshot({path:output+'/'+engine+'-legacy-dates-'+width+'.png',fullPage:true});
  await save.click();await save.waitFor({state:'hidden'});assert.equal(confirmed,1,'One explicit confirmed submission');assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Rendered timer recovery: 390/1440px, no guessed date, disabled incomplete confirmation, keyboard focus, no horizontal overflow and exactly one dated submission passed. Synthetic HTTP fixture; no device/provider claim.');
}finally{await browser?.close();server.kill();}
