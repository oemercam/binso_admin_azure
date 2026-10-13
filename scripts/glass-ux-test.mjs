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
