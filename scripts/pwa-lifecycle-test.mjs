import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const source=(await fs.readFile('components/pwa-register.tsx','utf8')).replace('import { useEffect } from "react";','');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function target(){const listeners=new Map();return {listeners,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)},fire:name=>listeners.get(name)?.()};}
async function scenario({controlled=false,waiting=false,unmount=false}={}){
 const serviceWorker=target(),registration=target(),worker=target(),document=target();let updates=0,activations=0,reloads=0,cleanup;
 document.visibilityState='visible';worker.state='installing';worker.postMessage=message=>{assert.equal(message.type,'SKIP_WAITING');activations++;serviceWorker.fire('controllerchange')};
 Object.assign(registration,{waiting:waiting?worker:null,installing:worker,update:async()=>{updates++}});
 Object.assign(serviceWorker,{controller:controlled?{}:null,register:async()=>registration});
 const exports={};Function('require','exports','useEffect','navigator','document','window','process',compiled)(require,exports,fn=>cleanup=fn(),{serviceWorker},document,{location:{reload:()=>reloads++}},{env:{NODE_ENV:'production'}});
 assert.equal(exports.PwaRegister(),null,'No update UI is rendered on initial mount');
 if(unmount)cleanup();await Promise.resolve();await Promise.resolve();
 if(unmount){assert.equal(registration.listeners.size,0);assert.equal(activations,0);return;}
 assert.equal(activations,waiting?1:0,'An already waiting update activates without a prompt');
 registration.fire('updatefound');worker.state='installed';registration.waiting=worker;worker.fire('statechange');assert.equal(activations,waiting?2:1);
 assert.equal(reloads,0,'Worker ownership changes never reload an in-progress draft');
 document.visibilityState='hidden';document.fire('visibilitychange');assert.equal(updates,1);
 document.visibilityState='visible';document.fire('visibilitychange');assert.equal(updates,2,'App resume checks for newer workers');
 cleanup();assert.equal(worker.listeners.size,0);assert.equal(registration.listeners.size,0);assert.equal(document.listeners.size,0,'Every lifecycle listener is cleaned up');
}
await scenario();await scenario({controlled:true,waiting:true});await scenario({unmount:true});
const swEvents={};let skip=0;
vm.runInNewContext(await fs.readFile('public/sw.js','utf8'),{self:{location:{origin:"https://fixture.invalid"},addEventListener:(name,fn)=>swEvents[name]=fn,skipWaiting:()=>{skip++}},caches:{open:async()=>({addAll:async()=>{}})}});
let installed;swEvents.install({waitUntil:promise=>installed=promise});await installed;assert.equal(skip,0,'Shell caching finishes before requested activation');
swEvents.message({origin:'https://other.invalid',source:{type:'window'},data:{type:'SKIP_WAITING'}});
swEvents.message({origin:'https://fixture.invalid',source:{type:'worker'},data:{type:'SKIP_WAITING'}});
swEvents.message({data:{type:'SKIP_WAITING'}});assert.equal(skip,0,'Foreign origins and non-window senders cannot activate the worker');
swEvents.message({origin:'https://fixture.invalid',source:{type:'window'},data:{type:'SKIP_WAITING'}});assert.equal(skip,1,'The actual same-origin application can silently activate its waiting worker');
console.log('Silent PWA lifecycle: first install, waiting/new updates, resume checks, no UI/reloads, late registration and listener cleanup passed.');
