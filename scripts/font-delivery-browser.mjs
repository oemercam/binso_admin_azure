import assert from 'node:assert/strict';
/** Computed font-family and a loaded FontFace do not prove glyph usage. */
async function renderedFonts(page){
 const session=await page.context().newCDPSession(page);
 try{await session.send('DOM.enable');await session.send('CSS.enable');const {root}=await session.send('DOM.getDocument');const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.auth-card h1'});return (await session.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;}finally{await session.detach();}
}
const inter=fonts=>assert.ok(fonts.length&&fonts.every(font=>font.isCustomFont&&font.familyName==='Inter'),'Available Inter must actually render the identity heading: '+JSON.stringify(fonts));
export async function verifyFontDelivery(browser,{base,output}){
 const chromium=browser.browserType().name()==='chromium',evidence=[];
 for(const delayed of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:780},serviceWorkers:'block'});let release=()=>{};
  try{
   await context.addInitScript(()=>{localStorage.setItem('binso.privacy.preferences.v1',JSON.stringify({version:2,essential:true,performance:false}));window.__fontLayoutShift=0;try{if(!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')){window.__fontLayoutShift=null;return;}new PerformanceObserver(list=>{for(const item of list.getEntries())if(!item.hadRecentInput)window.__fontLayoutShift+=item.value}).observe({type:'layout-shift',buffered:true})}catch{window.__fontLayoutShift=null}});
   if(delayed){const gate=new Promise(resolve=>release=resolve);await context.route('**/fonts/inter/*.woff2',async route=>{await gate;await route.continue()});}
   const page=await context.newPage();await page.goto(base+'/login',{waitUntil:'domcontentloaded'});await page.locator('.auth-card h1').waitFor();
   assert.equal(await page.locator('head link[rel="preload"][as="font"][crossorigin="anonymous"][href="/fonts/inter/inter-latin-wght-normal.woff2"]').count(),1,'The same first-party font is preloaded exactly once');
   if(delayed)await page.waitForTimeout(250); // Deliberately exceed the optional-font block window.
   const before=chromium?await renderedFonts(page):null,shiftBefore=await page.evaluate(()=>window.__fontLayoutShift);release();await page.evaluate(()=>document.fonts.ready);
   const after=chromium?await renderedFonts(page):null,shiftAfter=await page.evaluate(()=>window.__fontLayoutShift);
   if(delayed&&chromium){assert.ok(before.length&&!before.some(font=>font.isCustomFont&&font.familyName==='Inter'),'The negative case genuinely renders its system fallback');assert.deepEqual(after.map(font=>font.familyName),before.map(font=>font.familyName),'A late optional font never swaps the already rendered fallback');if(shiftBefore!==null&&shiftAfter!==null)assert.ok(shiftAfter-shiftBefore<=0.01,'Late font arrival causes no material layout shift');}
   let warmFonts=null;
   if(!delayed&&chromium){
    await page.reload({waitUntil:'networkidle'});warmFonts=await renderedFonts(page);inter(warmFonts);
    const negative=await page.addStyleTag({content:'.auth-card h1{font-family:serif!important}'});
    try{const wrong=await renderedFonts(page);assert.throws(()=>inter(wrong),'A loaded Inter face cannot hide an actual wrong-family override');}finally{await negative.evaluate(node=>node.remove());}
    inter(await renderedFonts(page));
   }
   await page.screenshot({path:output+'/font-'+(delayed?'delayed-fallback':'available')+'.png',animations:'disabled'});
   evidence.push({delayed,actualFontsBefore:before,actualFontsAfter:after,warmFonts,layoutShiftBefore:shiftBefore,layoutShiftAfter:shiftAfter,glyphInspection:chromium?'CDP actual glyph font usage':'Unavailable in WebKit; no native glyph-usage claim'});
  }finally{release();await context.close();}
 }
 return evidence;
}
