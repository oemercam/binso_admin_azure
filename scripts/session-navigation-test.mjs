import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const load=async file=>{const exports={};Function('exports',compile(await fs.readFile(file,'utf8')))(exports);return exports;};
const {watchSession}=await load('lib/client/session-watch.ts');
const {safeAppPath}=await load('lib/navigation.ts');
const settle=()=>new Promise(setImmediate);
const pageShown=persisted=>{const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);};
const browser=new EventTarget(),doc=new EventTarget();let tick;
globalThis.window=browser;globalThis.document=doc;doc.visibilityState='visible';
window.setInterval=(callback,delay)=>{assert.equal(delay,60000);tick=callback;return 1};window.clearInterval=()=>{tick=null};
try{
 let status=true,checks=0,ended=0;
 const stop=watchSession(async()=>{checks++;if(status instanceof Error)throw status;return status},()=>ended++);
 await settle();assert.equal(checks,1);tick();await settle();assert.equal(checks,2);
 status=new Error('offline');window.dispatchEvent(new Event('online'));await settle();assert.equal(ended,0,'Offline is not logout');
 status=true;doc.visibilityState='hidden';const hiddenChecks=checks;tick();await settle();assert.equal(checks,hiddenChecks,'Hidden tabs do not poll');doc.visibilityState='visible';doc.dispatchEvent(new Event('visibilitychange'));await settle();assert.equal(checks,hiddenChecks+1);
 for(const name of ['focus','binso-session-invalid']){const before=checks;window.dispatchEvent(new Event(name));await settle();assert.equal(checks,before+1);}
 const beforeInitialShow=checks;pageShown(false);await settle();assert.equal(checks,beforeInitialShow,'Normal first pageshow does not duplicate the fresh startup check');
 pageShown(true);await settle();assert.equal(checks,beforeInitialShow+1,'A real bfcache return still rechecks the authoritative session');
 const storage=new Event('storage');storage.key='binso.session.changed';status=false;window.dispatchEvent(storage);await settle();assert.equal(ended,1);window.dispatchEvent(new Event('focus'));await settle();assert.equal(ended,1,'End navigation happens once');stop();assert.equal(tick,null);
 let resolve,requests=0;const stopPending=watchSession(()=>{requests++;return new Promise(r=>{resolve=r})},()=>ended++);window.dispatchEvent(new Event('focus'));assert.equal(requests,1);resolve(true);await settle();assert.equal(requests,2,'Events during a pending read trigger a fresh follow-up');stopPending();resolve(false);await settle();assert.equal(ended,1,'Unmounted pages cannot redirect');
 for(const persisted of [false,true]){
  let release,initialRequests=0;const beforeEnded=ended;
  const stopInitial=watchSession(()=>{initialRequests++;return new Promise(r=>{release=r})},()=>ended++);
  pageShown(persisted);assert.equal(initialRequests,1,'An event cannot create parallel authoritative requests');
  release(true);await settle();assert.equal(initialRequests,persisted?2:1,'Only a persisted pageshow queues a fresh follow-up during startup');
  if(persisted){release(false);await settle();assert.equal(ended,beforeEnded+1,'Expiry discovered after bfcache resume still ends the session');}
  stopInitial();pageShown(true);await settle();assert.equal(initialRequests,persisted?2:1,'Unmount removes the bfcache listener');
 }

 // Execute the real React session effects with controlled server responses.
 for(const file of ['components/app-shell.tsx','components/operator.tsx']){
  const source=ts.createSourceFile(file,await fs.readFile(file,'utf8'),99,true,4);let effect;
  function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='useEffect'&&node.arguments[0].getText(source).includes('watchSession(')){effect=node.arguments[0].getText(source);if(!file.includes('operator')){const dependencies=node.arguments[1].elements.map(item=>item.getText(source));assert.deepEqual(dependencies,['accessRetry','identityRevision'],'Internal navigation must retain the session watcher; explicit retry and identity changes still recheck');}}ts.forEachChild(node,visit)}visit(source);assert.ok(effect,file);
  const operator=file.includes('operator');
  for(const result of ['active','expired','offline']){
   const actions=[];window.location={pathname:'/kunden',search:'?status=aktiv',replace:path=>actions.push(['replace',path])};
   const deps={watchSession,safeAppPath,readClientSession:async force=>{assert.equal(force,true);if(result==='offline')throw Error('offline');return {authenticated:result==='active'}},accessFromSession:s=>s.authenticated?{}:null,prefetchApiQuery:()=>Promise.resolve(),setAccess:()=>{},setAccessError:()=>{},clearClientSession:()=>actions.push(['clear']),allowDraftNavigation:()=>actions.push(['allow']),fetch:async(path,options)=>{assert.equal(path,'/api/operator/preferences');assert.equal(options.cache,'no-store');if(result==='offline')throw Error('offline');return {status:result==='expired'?401:200}}};
   const setup=Function(...Object.keys(deps),compile('const effect='+effect+'; return effect;'))(...Object.values(deps));const cleanup=setup();await settle();
   assert.deepEqual(actions,result==='expired'?[['clear'],['allow'],['replace',operator?'/operator/login':'/login?next=%2Fkunden%3Fstatus%3Daktiv']]:[],file+' '+result);cleanup();
  }
 }
 // Execute the actual logout handlers: confirmed success redirects, errors stay retryable.
 for(const file of ['components/app-shell.tsx','components/operator.tsx']){
  const source=ts.createSourceFile(file,await fs.readFile(file,'utf8'),99,true,4);let handler;
  function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='logout')handler=node.getText(source);if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='logout')handler='const '+node.getText(source);ts.forEachChild(node,visit)}visit(source);assert.ok(handler);
  const operator=file.includes('operator');
  for(const failed of [false,true]){
   const actions=[];window.location={origin:'https://fixture.invalid',replace:path=>actions.push(['replace',path])};
   const deps={logoutBusy:false,logoutBusyRef:{current:false},setLogoutBusy:()=>{},setLogoutError:()=>{},setConfirmLogout:()=>{},hasProtectedDraft:()=>false,unsavedChanges:false,dirty:false,allowDraftNavigation:()=>actions.push(['allow']),logoutClientSession:async()=>{if(failed)throw Error('offline')},logoutOperatorClientSession:async()=>{if(failed)throw Error('offline');return {microsoftLogoutUrl:null}}};
   const run=Function(...Object.keys(deps),compile(handler+'; return logout;'))(...Object.values(deps));await run();
   assert.deepEqual(actions,failed?[]:[['allow'],['replace',operator?'https://fixture.invalid/operator/login':'/login']],file+' logout '+failed);
  }
 }
 console.log('Session lifecycle: expiry, periodic checks, resume, bfcache, other tabs, offline, concurrency, unmount and actual tenant/operator redirect effects passed.');
}finally{delete globalThis.window;delete globalThis.document;}
