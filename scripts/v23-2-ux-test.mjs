import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PGlite} from '@electric-sql/pglite';
import {moduleUrl,financialModuleUrl,moneyModuleUrl} from './data-test-modules.mjs';
const require=createRequire(import.meta.url),html=element=>renderToStaticMarkup(element);
const {supportReference}=await import(moduleUrl(await fs.readFile('lib/support-reference.ts','utf8')));
const {formatHours,formatDateTime,formatActivityDetail}=await import(moduleUrl((await fs.readFile('lib/display-format.ts','utf8')).replace('\"./financial-status\"',JSON.stringify(financialModuleUrl))));
assert.equal(formatHours('12.500000'),'12,5 h');assert.equal(formatActivityDetail('Arbeitszeit erfasst','12.500000 h · Support · Person'),'12,5 h · Support · Person');assert.equal(formatActivityDetail('Zahlung erhalten','RE-1 · 1000.000 CHF'),"RE-1 · CHF 1'000.00");assert.ok(formatDateTime('2026-10-13T10:00:00Z').includes('13.10.2026'));assert.equal(formatDateTime('invalid'),'');
const uuid='45954093-1ff2-49ae-9756-2120b4e1127e';
assert.equal(supportReference(uuid,'DEMO-5832-'+uuid),'SUP-DEMO-5832');
assert.equal(supportReference(uuid,'T-'+uuid),'SUP-45954093');
assert.equal(supportReference(uuid,'SUP-2026-01042'),'SUP-2026-01042');
assert.equal(supportReference(uuid,'#5832'),'5832');
assert.equal(supportReference(uuid),'SUP-45954093');
const route=await fs.readFile('app/api/support/tickets/route.ts','utf8');
const numberSql=route.match(/c\.query<\{case_number:string\}>\("([^"]+)"/)[1];
const db=new PGlite();try{
 await db.exec('create sequence support_case_number_seq start 9999');
 const results=await Promise.all(Array.from({length:4},()=>db.query(numberSql)));
 const numbers=results.map(result=>result.rows[0].case_number);
 assert.equal(new Set(numbers).size,4,'Concurrent allocations are unique');
 assert.deepEqual(numbers.map(value=>value.split('-').at(-1)),['9999','10000','10001','10002'],'Sequence values cannot truncate after four digits');
}finally{await db.close()}
function declaration(path,text,name){const ast=ts.createSourceFile(path,text,99,true,4);return ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name).getText(ast)}
function compile(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText}
const ux=await fs.readFile('components/binso-ux.tsx','utf8');
const FormActions=({children})=>React.createElement('div',null,children),helpers={};
Function('require','exports','Children','isValidElement','cloneElement','FormActions',compile(declaration('ux.tsx',ux,'sheetForm')+'\nexport {sheetForm};'))(require,helpers,React.Children,React.isValidElement,React.cloneElement,FormActions);
const nativeForm=React.createElement('form',{id:'ticket',method:'post'},React.createElement('input',{name:'message',defaultValue:'Draft'}),React.createElement(FormActions,null,React.createElement('button',{type:'submit'},'Save')));
const nativeHtml=html(helpers.sheetForm(nativeForm));assert.ok(nativeHtml.includes('sheet-form-content'));assert.ok(nativeHtml.includes('sheet-form-footer'));assert.ok(nativeHtml.includes('value="Draft"'));assert.ok(nativeHtml.indexOf('type="submit"')<nativeHtml.indexOf('</form>'),'Submit remains inside its actual form');assert.equal((nativeHtml.match(/<form/g)||[]).length,1);
const quick={};const stub=({children})=>React.createElement('div',null,children),ActionRow=({title,href})=>React.createElement('a',{href},title);
Function('require','exports','useState','usePageAccess','CreateAction','ActionSheet','ActionRow',compile(declaration('ux.tsx',ux,'QuickCreateAction')))(require,quick,()=>[true,()=>{}],()=>({write:true,canOpen:href=>href==='/zeit/neu'}),stub,stub,ActionRow);
const quickHtml=html(quick.QuickCreateAction());assert.ok(quickHtml.includes('/zeit?manual=1&amp;returnTo=/dashboard'));assert.ok(!quickHtml.includes('/rechnungen/neu'),'Unpermitted actions are absent');
const statistics=await fs.readFile('components/statistics.tsx','utf8'),ring={};
const {formatCurrency}=await import(financialModuleUrl),{sumMoney}=await import(moneyModuleUrl);
Function('require','exports','useState','formatCurrency','sumMoney',compile(declaration('statistics.tsx',statistics,'RingChart')))(require,ring,()=>[null,()=>{}],formatCurrency,sumMoney);
const parts=[{key:'a',label:'Einnahmen',tone:'positive',value:0.1},{key:'b',label:'Ausgaben',tone:'negative',value:0.2}];
const ringHtml=html(React.createElement(ring.RingChart,{label:'Zahlungsvolumen',parts}));assert.ok(ringHtml.includes('CHF 0.30'));assert.ok(ringHtml.includes('33.3 %'));assert.ok(ringHtml.includes('66.7 %'));
for(const invalid of [parts.map(part=>({...part,value:0})),[{...parts[0],value:-10}],[{...parts[0],value:NaN}]])assert.ok(!html(React.createElement(ring.RingChart,{label:'Volumen',parts:invalid})).includes('<svg'),'Zero, negative and missing data cannot fabricate a ring');
console.log('V23.2: legacy/demo references, race-safe untruncated numbering, native form draft/submit preservation, quick-create permissions and honest decimal ring segments passed.');
