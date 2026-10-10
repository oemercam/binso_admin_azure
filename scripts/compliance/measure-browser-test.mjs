import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {measureActionClearance} from './measure.mjs';
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const engine=process.env.BINSO_UX_BROWSER??'chromium';
const browser=await engines[engine].launch({headless:true,...(engine==='chromium'&&process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}: {})});
try{
 const page=await browser.newPage({viewport:{width:320,height:1000}});
 const fixture=padding=>`<style>body{margin:0}.page-container{padding-top:1200px;padding-bottom:${padding}px}.bottom-nav{position:fixed;bottom:0;height:76px;width:100%;background:#eee}button{height:44px}</style><main class="page-container"><button>Action</button></main><nav class="bottom-nav"></nav>`;
 await page.setContent(fixture(160));
 await page.evaluate(()=>{const native=window.scrollTo.bind(window);let calls=0;window.scrollTo=(...args)=>{native(...args);if(++calls===1)requestAnimationFrame(()=>native(0,0));};});
 const settled=await measureActionClearance(page);
 assert(settled.scrollEndEstablished,'A delayed route scroll reset must be retried');
 assert(settled.scrollY>0&&settled.lastActionBottom<settled.navigationTop,'Compare the real document endpoint');
 assert.equal(await page.evaluate(()=>scrollY),0,'Restore the original scroll');
 await page.setContent(fixture(0));
 const overlap=await measureActionClearance(page);
 assert(overlap.scrollEndEstablished&&overlap.lastActionBottom>overlap.navigationTop,'True navigation overlap stays blocking');
 await page.evaluate(()=>{window.scrollTo=()=>{};});
 const blocked=await measureActionClearance(page);
 assert.equal(blocked.scrollEndEstablished,false,'Unreachable endpoint cannot pass as measured geometry');
 await page.close();
 console.log('Scroll-end geometry adversaries passed: late reset, restoration, actual overlap, blocked scrolling. Engine: '+engine);
}finally{await browser.close();}
