import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
/** Exercise the shipped stylesheet owners while the animation is still active. */
export async function verifyStartupGeometry(browser){
 const manifest=JSON.parse(await fs.readFile('app/design-system/manifest.json','utf8'));
 const css=(await Promise.all(manifest.sources.map(source=>fs.readFile(source.path,'utf8')))).join('\n');
 const page=await browser.newPage();const evidence=[];
 try{
  for(const width of [320,390,760])for(const theme of ['light','dark'])for(const root of ['app-root','operator-root']){
   await page.setViewportSize({width,height:844});
   const probe=async legacy=>{
    await page.setContent('<style>'+css+(legacy?'@keyframes page-enter{from{opacity:.01;transform:translateY(3px)}to{opacity:1;transform:none}}':'')+'</style><div class="'+root+'"><main class="app-main"><div class="page-container"><div class="workspace-command-bar"><button class="button bo-create-action" aria-label="Neu erstellen">+</button></div><section style="height:350px">Fixture</section></div></main></div>');
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    return page.evaluate(()=>{
     const container=document.querySelector('.page-container'),animation=container.getAnimations()[0],button=document.querySelector('.bo-create-action');
     if(!animation)throw Error('The real page animation must be present in this probe');animation.pause();
     return [0,30,75,500].map(time=>{animation.currentTime=time;const r=button.getBoundingClientRect();return {time,x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}});
    });
   };
   const stable=await probe(false),final=stable.at(-1);
   for(const frame of stable){assert.equal(frame.width,44);assert.equal(frame.height,44);assert(Math.abs(frame.y-final.y)<=1&&Math.abs(frame.x-final.x)<=1,'Fixed creation must stay viewport-anchored during every startup frame');}
   assert(final.right<=width-12&&final.bottom<844-68,'Preserve existing page/navigation insets');
   const broken=await probe(true);assert(Math.abs(broken[0].y-broken.at(-1).y)>100,'The previous ancestor transform must reproduce the reported jump');
   evidence.push({width,theme,root,stableY:final.y,oldJump:broken.at(-1).y-broken[0].y});
  }
 }finally{await page.close()}
 console.log('PWA startup geometry: 12 real-stylesheet mobile/customer/operator cases and old-animation countercases passed.');
 return evidence;
}
if(process.argv[1]===new URL(import.meta.url).pathname||process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright'),engine=process.env.BINSO_UX_BROWSER??'chromium';
 const browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
 try{console.log(JSON.stringify(await verifyStartupGeometry(browser)))}finally{await browser.close()}
}
