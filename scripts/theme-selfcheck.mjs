import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const themeUrl=moduleUrl(await fs.readFile('lib/theme.ts','utf8'));
const backendUrl=moduleUrl('export const isProductionBackendEnabled=()=>true;export const apiGet=()=>globalThis.__themeRead();export const apiPatch=async()=>{}');
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
for(const key of ['__themeRead','localStorage','document','window','CustomEvent'])delete globalThis[key];
console.log('Theme ownership, reload resolver and stale profile response checks passed.');
