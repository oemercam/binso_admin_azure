import './localization-test-adapter.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {moduleUrl,moneyModuleUrl} from './data-test-modules.mjs';

const require=createRequire(import.meta.url);
const source=fs.readFileSync('components/flow-home.tsx','utf8');
const ast=ts.createSourceFile('flow-home.tsx',source,99,true,4);
const body=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n');
const compiled=ts.transpileModule(body,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
let allowed=new Set();
const exports={};
const {createReturnHref}=await import(moduleUrl(fs.readFileSync('config/create-actions.ts','utf8')));
const {sumMoney}=await import(moneyModuleUrl);
const {localeTags}=await import(moduleUrl(fs.readFileSync('lib/locales/config.ts','utf8')));
Function('require','exports','Link','Icon','usePageAccess','createReturnHref','sumMoney','useLocale','localeTags',compiled)(require,exports,({children,...props})=>React.createElement('a',props,children),()=>React.createElement('svg'),()=>({write:true,canOpen:href=>allowed.has(href)}),createReturnHref,sumMoney,()=>({locale:'de'}),localeTags);
function render(paths){allowed=new Set(paths);return renderToStaticMarkup(React.createElement(exports.FlowQuickActions));}
assert.equal(render([]),'','No destinations are exposed to a role without access');
const reader=render(['/zeit']);
assert.ok(reader.includes('href="/zeit"'));
assert.ok(!reader.includes('/rechnungen/neu')&&!reader.includes('/kunden/neu'),'Read-only access cannot leak create destinations');
const readerWithCustomers=render(['/zeit','/kunden']);
assert.ok(readerWithCustomers.includes('href="/kunden"')&&!readerWithCustomers.includes('/neu'),'Customer shortcut remains available without customer-write permission');
const owner=render(['/zeit','/rechnungen/neu','/kunden']);
for(const href of ['/zeit','/rechnungen/neu','/kunden'])assert.ok(owner.includes(`href="${href.endsWith('/neu')?createReturnHref(href,'/dashboard'):href}"`));
const monthly=renderToStaticMarkup(React.createElement(exports.FlowMonthSummary,{data:{financial:{snapshot:{as_of:'2026-10-01'},revenueEvents:[{date:'2026-09-30',amount:990},{date:'2026-10-01',amount:125.25},{date:'2026-10-01',amount:-25.25},{date:'2025-10-01',amount:500}]}}}));
assert.ok(monthly.includes('CHF')&&monthly.includes('100.00')&&monthly.includes('Oktober'),'Revenue uses the snapshot month and year, decimal arithmetic, and signed credit notes');
assert.equal(renderToStaticMarkup(React.createElement(exports.FlowMonthSummary,{data:{}})),'','Unavailable finance data never becomes an invented zero');
const postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const palettes={};
postcss.parse(fs.readFileSync('app/styles/tokens.css','utf8')).walkRules(rule=>{if([':root','html[data-theme="dark"]'].includes(rule.selector))rule.walkDecls(d=>{(palettes[rule.selector]??={})[d.prop]=d.value;});});
function luminance(hex){const raw=hex.slice(1),full=raw.length===3?[...raw].map(x=>x+x).join(''):raw;return full.match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);}
for(const theme of [':root','html[data-theme="dark"]']){
 const values={...palettes[':root'],...palettes[theme]};
 for(const [bg,fg] of [['--flow-chrome-bg','--flow-chrome-fg'],['--flow-sand','--flow-sand-text'],['--flow-sage','--flow-sage-text'],['--flow-apricot','--flow-apricot-text'],['--app-action-accent','--app-accent-text']]){
  const a=luminance(values[bg]),b=luminance(values[fg]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${theme}: ${bg}/${fg} must support readable normal text`);
 }
}
console.log('Flow Noir: actual action renderer preserves access restrictions; light/dark text contrast passed.');
