import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
const source=await fs.readFile('public/sw.js','utf8');
for(const outcome of ['success','offline','stall','cancel']){
 const handlers={},offline={publicOffline:true};let timeout,clears=0,reads=0,fetches=0;
 const controller=new AbortController();
 const scope={self:{location:{origin:'https://fixture.invalid'},addEventListener:(name,callback)=>handlers[name]=callback},URL,AbortController,setTimeout:(callback,ms)=>{assert.equal(ms,8000);timeout=callback;return 7},clearTimeout:id=>{assert.equal(id,7);clears++},caches:{open:async()=>({match:async path=>{assert.equal(path,'/offline');reads++;return offline}})},fetch:async(request,options)=>{fetches++;assert.equal(options.cache,'no-store');assert(options.signal);if(outcome==='success')return {network:true};if(outcome==='offline')throw Error('offline');return new Promise((resolve,reject)=>{const fail=()=>reject(Error('aborted'));if(options.signal.aborted)fail();else options.signal.addEventListener('abort',fail,{once:true})})}};
 vm.runInNewContext(source,scope);let response;
 handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://fixture.invalid/dashboard',signal:controller.signal},respondWith:promise=>response=promise});
 if(outcome==='stall')timeout();if(outcome==='cancel')controller.abort();
 assert.deepEqual(await response,outcome==='success'?{network:true}:offline);assert.equal(clears,1);assert.equal(reads,outcome==='success'?0:1);
 let intercepted=false;handlers.fetch({request:{method:'GET',url:'https://fixture.invalid/_next/static/current.js'},respondWith:()=>intercepted=true});assert.equal(intercepted,false,'Build assets remain outside service-worker caching');
 handlers.fetch({request:{method:'GET',url:'https://fixture.invalid/api/dashboard'},respondWith:()=>intercepted=true});assert.equal(intercepted,false,'Private API responses remain network-only');assert.equal(fetches,1);
}
console.log('Actual PWA worker: online success, offline/stalled/cancelled navigation, bounded timeout cleanup and private/build-cache exclusions passed.');
