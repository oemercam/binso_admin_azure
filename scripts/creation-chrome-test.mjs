// Current Microsoft chrome and creation permissions; no legacy glass material.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {moduleUrl} from './data-test-modules.mjs';
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {createActions,permittedCreateActions,createReturnHref}=await import(moduleUrl(compile(await fs.readFile('config/create-actions.ts','utf8'))));
assert.equal(new Set(createActions.map(action=>action.href)).size,createActions.length);
const allowed=new Set(['/zeit/neu','/kunden/neu']);
assert.deepEqual(permittedCreateActions('zeit',href=>allowed.has(href)).map(action=>action.title),['Zeit erfassen','Kunde']);
assert.deepEqual(permittedCreateActions('kunden',()=>false),[],'Read-only or denied paths cannot produce creation actions');
assert.deepEqual(permittedCreateActions('support',href=>href==='/support/neu').map(action=>action.title),['Support-Anfrage'],'Read-only tenant support is independently authorized');
for(const action of createActions){const href=new URL(createReturnHref(action.href,'/kunden?status=active'),'https://binso.invalid');assert.equal(href.searchParams.get('returnTo'),'/kunden?status=active');assert.ok(href.pathname.startsWith('/'));if(action.section==='zeit')assert.equal(href.searchParams.get('manual'),'1');}
console.log('Shared creation: permission paths, context ordering, no duplicate destinations, independent support access and encoded return context passed.');

// Render the actual shared chrome: an old caller cannot reattach a creation action.
const {createRequire}=await import('node:module'),require=createRequire(import.meta.url);
const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
const chrome={};
Function('require','exports',ts.transpileModule(await fs.readFile('components/app-chrome.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText)(require,chrome);
for(const compact of [false,true]){
 const navigation=React.createElement('nav',{'aria-label':'Hauptnavigation'},React.createElement('a',{href:'/dashboard'},'Start'));
 const rendered=renderToStaticMarkup(React.createElement(chrome.MobileDock,{compact,action:React.createElement('button',null,'Forbidden dock action')},navigation));
 assert.ok(rendered.includes('href="/dashboard"'),'Navigation children are preserved');
 assert.ok(!rendered.includes('Forbidden dock action'),'Shared dock cannot render an attached creation action');
 assert.equal(rendered.includes('is-compact'),compact,'Compact navigation behavior is preserved');
}
console.log('Actual shared dock renders only navigation and preserves compact mode; obsolete creation injection is ignored.');

for(const contentHeader of [false,true])for(const detail of [false,true]){
 const rendered=renderToStaticMarkup(React.createElement(chrome.AppHeader,{contentHeader,detail,leading:'Binso',actions:React.createElement('button',null,'Suchen')}));
 assert.ok(rendered.includes('app-header-actions'));assert.ok(rendered.includes('Suchen'));
 assert.ok(!/app-glass|backdrop|translucent/.test(rendered),'All actual shared header variants exclude the retired material');
}
