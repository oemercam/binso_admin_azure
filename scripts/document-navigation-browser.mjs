/** A load-state flag can predate later SPA/prefetch requests. Retire a document
 * only after its actual requests and queued rendering/idle work have settled.
 * This does not intercept requests, errors, responses or application navigation. */
export function createDocumentNavigation(context,{quietMs=500,timeoutMs=30000}={}){
 const pending=new Map(),activity=new WeakMap(),waiters=new Set(),evidence=[];
 let unframedActivity=0;
 const owner=request=>{try{return request.frame().page()}catch{return null}};
 const changed=page=>{if(page)activity.set(page,Date.now());else unframedActivity=Date.now();for(const notify of [...waiters])notify()};
 context.on('request',request=>{const page=owner(request);pending.set(request,page);changed(page)});
 const finished=request=>{const page=pending.has(request)?pending.get(request):owner(request);pending.delete(request);changed(page)};
 context.on('requestfinished',finished);context.on('requestfailed',finished);
 const count=page=>[...pending.values()].filter(owner=>owner===page||owner===null).length;
 async function settle(page){
  const started=Date.now(),pendingAtEntry=count(page);
  // Flush React's frame commit and the prior idle callbacks that schedule RSC
  // prefetches. The subsequent quiet window observes real new network activity.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(typeof requestIdleCallback==='function')requestIdleCallback(()=>resolve(),{timeout:1000});else resolve();
  }))));
  const checkpoint=Date.now();
  await new Promise((resolve,reject)=>{
   let timer,done=false;
   const finish=error=>{if(done)return;done=true;clearTimeout(timer);waiters.delete(check);page.off('close',closed);error?reject(error):resolve()};
   const closed=()=>finish(Error('Document closed before its requests settled'));
   const check=()=>{
    clearTimeout(timer);if(done)return;
    const now=Date.now(),remaining=timeoutMs-(now-started);
    if(remaining<=0){finish(Error('Document did not settle; pending requests: '+[...pending].filter(([,owner])=>owner===page||owner===null).map(([request])=>request.url()).join(', ')));return;}
    const quietFor=now-Math.max(checkpoint,activity.get(page)??0,unframedActivity);
    if(count(page)===0&&quietFor>=quietMs){finish();return;}
    timer=setTimeout(check,count(page)===0?Math.min(remaining,Math.max(1,quietMs-quietFor)):remaining);
   };
   page.on('close',closed);waiters.add(check);check();
  });
  const result={started,settledAt:Date.now(),pendingAtEntry,pendingAtExit:count(page)};evidence.push({kind:'settle',...result});return result;
 }
 async function goto(page,url,options){await settle(page);evidence.push({kind:'goto',url,pendingBeforeNavigation:count(page),at:Date.now()});return page.goto(url,options)}
 async function reload(page,options){await settle(page);evidence.push({kind:'reload',url:page.url(),pendingBeforeNavigation:count(page),at:Date.now()});return page.reload(options)}
 return {settle,goto,reload,evidence};
}
