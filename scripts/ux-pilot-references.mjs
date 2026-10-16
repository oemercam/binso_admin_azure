import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {referenceDocument} from './ux-reference-capture.mjs';
import {writeTestOutput} from './test-output.mjs';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const output=process.env.BINSO_REFERENCE_OUTPUT??'/tmp/binso-pilot-references';
await fs.mkdir(output,{recursive:true});
const browser=await engines.chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
const manifest={scope:'Owner-supplied HTML references; no automatic visual acceptance',framing:'Original HTML is unchanged. Review renders remove preview switches, OS clock and outer presentation frame only. Content selectors, typography, colours and interactions remain unchanged.',views:[]};
const selectors=['#bm h2','#bm .authintro h1','#bm .authform h2','#bm .authform label','#bm .auth-submit','#bm .number','#bm .commandbar button','#bm .dt','#bm .contactpanel','#ba h2','#ba input','#ba .value','#ba .customerrow','#ba .tabs'];
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'light'});await context.route('**/*',route=>route.abort());const page=await context.newPage();
  async function capture(name){
   await page.evaluate(()=>document.fonts.ready);
   const measured=await page.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).slice(0,3).map(el=>{const style=getComputedStyle(el),box=el.getBoundingClientRect();return {selector,rect:{x:box.x,y:box.y,width:box.width,height:box.height},style:Object.fromEntries(['font-family','font-size','font-weight','line-height','letter-spacing','color','background-color','border-radius','padding','margin','gap','grid-template-columns'].map(key=>[key,style.getPropertyValue(key)]))}})),selectors);
   const file=name+'-'+width+'.png';await page.screenshot({path:path.join(output,file),fullPage:true});manifest.views.push({name,width,height:1000,file,measured});
  }
  async function desktop(){await page.setContent(await referenceDocument('desktop-login'),{waitUntil:'load'});await page.evaluate(()=>{document.body.style.padding='0';const root=document.querySelector('#bm');root.style.border='0';root.style.borderRadius='0';document.querySelectorAll('#bm .portalchoices,#bm .preview-switch,#bm .designchoices').forEach(el=>el.remove());});}
  await desktop();await capture('reference-login');
  if(width===1440){
   // Portal controls were framing only; use the original button before removing it.
   await page.setContent(await referenceDocument('desktop-login'),{waitUntil:'load'});await page.locator('[data-portal="app"]').click();await page.evaluate(()=>{document.body.style.padding='0';const root=document.querySelector('#bm');root.style.border='0';root.style.borderRadius='0';root.style.maxWidth='none';root.parentElement.style.maxWidth='none';document.querySelectorAll('#bm .portalchoices,#bm .preview-switch,#bm .designchoices').forEach(el=>el.remove());});await capture('reference-detail');await page.locator('#bm-back').click();await capture('reference-customers');
  }else{
   await page.setContent(await referenceDocument('mobile-app'),{waitUntil:'load'});await page.locator('#ba-pages').selectOption('customers');
   await page.evaluate(()=>{document.body.style.padding='0';const root=document.querySelector('#ba');root.style.padding='0';document.querySelectorAll('#ba .pageselect,#ba .statusbar').forEach(el=>el.remove());const phone=document.querySelector('#ba .phone');Object.assign(phone.style,{maxWidth:'none',width:'100%',border:'0',borderRadius:'0',boxShadow:'none',minHeight:'1000px',display:'flex',flexDirection:'column'});document.querySelector('#ba main').style.flex='1';});
   await capture('reference-customers');await page.locator('[data-customer]').first().click();await capture('reference-detail');
  }
  await context.close();
 }
 await writeTestOutput(path.join(output,'measurements.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({views:manifest.views.length,output}));
}finally{await browser.close()}
