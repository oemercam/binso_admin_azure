import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const themeUrl=moduleUrl(await fs.readFile('lib/theme.ts','utf8'));
globalThis.__themeWrite=async()=>{};
const backendUrl=moduleUrl('export const isProductionBackendEnabled=()=>true;export const apiGet=()=>globalThis.__themeRead();export const apiPatch=(_url,body)=>globalThis.__themeWrite(body.theme)');
const clientSource=(await fs.readFile('lib/client/theme.ts','utf8')).replace("'./backend'",JSON.stringify(backendUrl)).replace("'../theme'",JSON.stringify(themeUrl));
const shell=await fs.readFile('components/app-shell.tsx','utf8');
assert.ok(!/document\.documentElement\.dataset\.theme\s*=(?!=)/.test(shell),'Shell must observe the central theme, never overwrite it on mount');
const values=new Map([['binso.theme.mode','dark']]);
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
globalThis.document={documentElement:{dataset:{}},querySelectorAll:()=>[]};
globalThis.window={matchMedia:()=>({matches:false}),dispatchEvent(){}};
globalThis.CustomEvent=class{constructor(type,options){this.type=type;this.detail=options.detail}};
const {initializeTheme}=await import(themeUrl);
const {loadTheme,saveTheme}=await import(moduleUrl(clientSource));
for(const mode of ['dark','light','system']){
 await saveTheme(mode);
 const expected=mode==='dark'?'dark':'light';
 initializeTheme();assert.equal(document.documentElement.dataset.theme,expected);
 // Repeated application simulates the resolver used for document reloads.
 initializeTheme();assert.equal(document.documentElement.dataset.theme,expected);
}
let resolveRead;
globalThis.__themeRead=()=>new Promise(resolve=>{resolveRead=resolve});
const staleRead=loadTheme();
await saveTheme('dark');
resolveRead({item:{theme:'light'}});
await staleRead;
assert.equal(document.documentElement.dataset.theme,'dark','An older profile response must not undo a newly saved theme');
let finishWrite;
globalThis.__themeWrite=()=>new Promise(resolve=>{finishWrite=resolve});
const slowSave=saveTheme('light');
assert.equal(document.documentElement.dataset.theme,'light','Theme changes before a slow server response');
await new Promise(resolve=>setImmediate(resolve));finishWrite();await slowSave;
const writes=[],releases=[];
globalThis.__themeWrite=mode=>{writes.push(mode);return new Promise(resolve=>releases.push(resolve));};
const firstSave=saveTheme('dark'),lastSave=saveTheme('system');
await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(writes,['dark'],'Rapid preference writes must not race');
assert.equal(document.documentElement.dataset.themeMode,'system');
releases.shift()();await firstSave;await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(writes,['dark','system']);
releases.shift()();await lastSave;
globalThis.__themeWrite=async()=>{throw Error('Synthetic persistence failure')};
const failedFirst=saveTheme('dark'),failedLast=saveTheme('light');
assert.equal(document.documentElement.dataset.theme,'light');
await Promise.all([assert.rejects(failedFirst),assert.rejects(failedLast)]);
assert.equal(document.documentElement.dataset.themeMode,'system','Consecutive failures restore the last persisted preference');
window.matchMedia=()=>({matches:true});initializeTheme();assert.equal(document.documentElement.dataset.theme,'dark','System resolves the current device preference on restart');
window.matchMedia=()=>({matches:false});initializeTheme('system');
let reads=0;globalThis.__themeRead=()=>{reads++;return new Promise(resolve=>{resolveRead=resolve})};
const readOne=loadTheme(),readTwo=loadTheme();await new Promise(resolve=>setImmediate(resolve));assert.equal(reads,1,'Concurrent profile readers share one request');resolveRead({item:{theme:'system'}});await Promise.all([readOne,readTwo]);
// Suspended PWAs/BFCache documents can miss the OS media change event. Resume
// must resolve the current preference, while explicit choices remain explicit.
const runtimeSource=(await fs.readFile('components/theme-runtime.tsx','utf8'))
 .replace("import {useEffect} from 'react';",'')
 .replace("import {applyTheme} from '@/lib/client/theme';",'');
const runtimeCompiled=ts.transpileModule(runtimeSource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const eventTarget=()=>{const listeners=new Map();return {listeners,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name)},fire:name=>listeners.get(name)?.()};};
const runtimeWindow=eventTarget(),runtimeDocument=eventTarget(),media=eventTarget();
let cleanup,osDark=false;
Object.assign(runtimeDocument,{head:{},visibilityState:'visible',documentElement:{dataset:{themeMode:'system',theme:'light'}},querySelectorAll:()=>[]});
runtimeWindow.matchMedia=()=>({...media,matches:osDark});
const observers=[];class Observer{constructor(callback){observers.push(callback)}observe(){}disconnect(){}}
const runtimeExports={};
Function('exports','useEffect','applyTheme','window','document','MutationObserver',runtimeCompiled)(runtimeExports,fn=>cleanup=fn(),mode=>{
 runtimeDocument.documentElement.dataset.themeMode=mode;
 runtimeDocument.documentElement.dataset.theme=mode==='system'?(osDark?'dark':'light'):mode;
},runtimeWindow,runtimeDocument,Observer);
runtimeExports.ThemeRuntime();
osDark=true;runtimeWindow.fire('pageshow');
assert.equal(runtimeDocument.documentElement.dataset.theme,'dark','Restored PWA resolves an OS change missed while suspended');
osDark=false;runtimeDocument.visibilityState='hidden';runtimeDocument.fire('visibilitychange');
assert.equal(runtimeDocument.documentElement.dataset.theme,'dark','Hidden documents do not reapply their theme');
runtimeDocument.visibilityState='visible';runtimeDocument.fire('visibilitychange');
assert.equal(runtimeDocument.documentElement.dataset.theme,'light','Foreground PWA resolves the current system theme');
runtimeDocument.documentElement.dataset.themeMode='dark';osDark=false;runtimeWindow.fire('pageshow');
assert.equal(runtimeDocument.documentElement.dataset.theme,'dark','Resume never replaces an explicit dark preference');
runtimeDocument.documentElement.dataset.themeMode='light';osDark=true;runtimeWindow.fire('pageshow');
assert.equal(runtimeDocument.documentElement.dataset.theme,'light','Resume never replaces an explicit light preference');
const statusMeta={content:'#ffffff'};runtimeDocument.querySelectorAll=()=>[statusMeta];
runtimeDocument.documentElement.dataset.modalOverlay='true';observers.forEach(fn=>fn());assert.equal(statusMeta.content,'#c2c2c2','A sheet dims supported browser chrome with the same 24% scrim');
runtimeDocument.documentElement.dataset.theme='dark';observers.forEach(fn=>fn());assert.equal(statusMeta.content,'#000000');
delete runtimeDocument.documentElement.dataset.modalOverlay;runtimeDocument.documentElement.dataset.theme='light';observers.forEach(fn=>fn());assert.equal(statusMeta.content,'#ffffff','Closing the last sheet restores the light status bar');
cleanup();assert.equal(runtimeWindow.listeners.size,0);assert.equal(runtimeDocument.listeners.size,0);assert.equal(media.listeners.size,0,'All theme lifecycle listeners are removed');
for(const key of ['__themeWrite','__themeRead','localStorage','document','window','CustomEvent'])delete globalThis[key];
// A root-layout failure replaces the document: test the actual fallback render,
// rather than assuming that the normal layout's head survives it.
const errorSource=await fs.readFile('app/global-error.tsx','utf8');
const errorAst=ts.createSourceFile('global-error.tsx',errorSource,99,true,4);
const errorBody=errorAst.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(errorAst)).join('\n');
const errorCompiled=ts.transpileModule(errorBody,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const errorExports={},childrenOnly=({children})=>React.createElement(React.Fragment,null,children);
const stateAst=ts.createSourceFile('system-state.tsx',await fs.readFile('components/system-state.tsx','utf8'),99,true,4),stateBody=stateAst.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(stateAst)).join('\n'),stateExports={};
Function('require','exports','AuthWorkspace','Button','LocalizedText',ts.transpileModule(stateBody,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(createRequire(import.meta.url),stateExports,childrenOnly,({children})=>React.createElement('button',null,children),childrenOnly);
Function('require','exports','useSyncExternalStore','asLocale','localeCookie','localeTags','SystemState','PrivacyConsent','LocaleProvider','initializeTheme','ThemeRuntime',errorCompiled)(createRequire(import.meta.url),errorExports,React.useSyncExternalStore,mode=>mode,'binso.locale',{'de':'de-CH'},stateExports.SystemState,()=>null,childrenOnly,initializeTheme,()=>null);
const errorHtml=renderToStaticMarkup(React.createElement(errorExports.default,{reset(){},error:Object.assign(Error('Synthetic root failure; private stack'),{digest:'fixture-reference'})}));
assert.ok(!errorHtml.includes('private stack')&&!errorHtml.includes('Synthetic root failure'),'Root recovery cannot disclose the actual error object');assert.ok(errorHtml.includes('fixture-reference'),'Bounded diagnostic reference remains available for support');
const unsafeState=renderToStaticMarkup(React.createElement(stateExports.SystemState,{title:'Fixture',description:'Fixture',reference:'private value <script>'}));assert.ok(!unsafeState.includes('private value'),'Arbitrary diagnostic text is not exposed as a reference');
const errorInit=errorHtml.match(/<script\b[^>]*id="binso-theme-init"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(errorInit,'The independent root error document initializes the shared theme before paint');
assert.ok(errorHtml.indexOf(errorInit[0])<errorHtml.indexOf('<body'),'Fallback theme script belongs to its own head');
assert.match(errorHtml,/<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"\/>/,'Fallback preserves device scaling and safe-area viewport');
assert.ok(!/maximum-scale|user-scalable=no/.test(errorHtml),'Error recovery must not disable user zoom');
for(const sample of [{mode:'dark',dark:false,expected:'dark'},{mode:'light',dark:true,expected:'light'},{mode:'system',dark:true,expected:'dark'},{mode:null,dark:true,blocked:true,expected:'dark'}]){
 const dataset={},meta={content:'#ffffff',removeAttribute(){}};
 runInNewContext(errorInit[1],{document:{documentElement:{dataset},querySelectorAll:()=>[meta]},window:{matchMedia:()=>({matches:sample.dark})},localStorage:{getItem:()=>{if(sample.blocked)throw Error('Storage blocked');return sample.mode},setItem:()=>{if(sample.blocked)throw Error('Storage blocked')}}});
 assert.equal(dataset.theme,sample.expected);assert.equal(meta.content,sample.expected==='dark'?'#000000':'#ffffff');
}
console.log('Theme ownership, reload resolver and stale profile response checks passed.');
