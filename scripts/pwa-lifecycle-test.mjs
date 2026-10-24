import './pwa-navigation-timeout-test.mjs';
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
const viewportSource=(await fs.readFile('components/use-workspace-viewport.ts','utf8')).replace('import {useEffect} from "react";','');
const viewportCompiled=ts.transpileModule(viewportSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
for(const hasVisualViewport of [true,false]){
 const browser=target(),visual=target(),doc=target(),properties=new Map();let dispose;
 const attributes=new Set();
 const rootStyle={overflow:'auto',setProperty:(key,value)=>properties.set(key,value),removeProperty:key=>properties.delete(key)};
 Object.assign(browser,{innerHeight:844,visualViewport:hasVisualViewport?Object.assign(visual,{height:700,offsetTop:0}):undefined});
 Object.assign(doc,{visibilityState:'visible',activeElement:{matches:()=>false},documentElement:{style:rootStyle,clientHeight:844,toggleAttribute:(name,on)=>on?attributes.add(name):attributes.delete(name),removeAttribute:name=>attributes.delete(name)},body:{style:{overflow:'scroll'}}});
 const hook={};
 // Use an actual global binding for the existing innerHeight browser fallback.
 const sandbox={exports:hook,useEffect:fn=>dispose=fn(),window:browser,document:doc,requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame:()=>{}};
 Object.defineProperty(sandbox,'innerHeight',{get:()=>browser.innerHeight});
 vm.runInNewContext(viewportCompiled,sandbox);hook.useWorkspaceViewport();
 assert.equal(properties.get('--workspace-viewport-height'),hasVisualViewport?'700px':'844px');
 browser.innerHeight=600;visual.height=450;visual.offsetTop=12;
 browser.fire('resize');
 assert.equal(properties.get('--workspace-viewport-height'),hasVisualViewport?'450px':'600px','Chat resizes with both visual and window-only viewport APIs');
 if(hasVisualViewport){doc.activeElement={matches:()=>true};visual.height=300;visual.offsetTop=25;visual.fire('resize');assert.equal(properties.get('--workspace-viewport-top'),'25px');assert.equal(properties.get('--workspace-viewport-height'),'300px','Keyboard viewport remains authoritative');assert.equal(attributes.has('data-workspace-keyboard'),true,'Focused keyboard viewport removes duplicate safe-area padding');}
 browser.innerHeight=900;visual.height=800;visual.offsetTop=0;browser.fire('pageshow');
 assert.equal(properties.get('--workspace-viewport-height'),hasVisualViewport?'800px':'900px','Restored chat refreshes stale viewport dimensions');
 browser.innerHeight=950;visual.height=850;doc.visibilityState='hidden';doc.fire('visibilitychange');
 assert.equal(properties.get('--workspace-viewport-height'),hasVisualViewport?'800px':'900px','Hidden chat does not recalculate');
 doc.visibilityState='visible';doc.fire('visibilitychange');assert.equal(properties.get('--workspace-viewport-height'),hasVisualViewport?'850px':'950px');
 dispose();assert.equal(rootStyle.overflow,'auto');assert.equal(doc.body.style.overflow,'scroll');assert.equal(properties.size,0);assert.equal(browser.listeners.size,0);assert.equal(doc.listeners.size,0);assert.equal(visual.listeners.size,0,'Chat releases all viewport lifecycle listeners');
}
console.log('PWA lifecycle: silent updates, no draft reload, safe activation, theme-independent chat viewport resume/fallback and cleanup passed.');
