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

// Execute the real viewer effect with controlled engine/worker promises.
const pdfSource=await fs.readFile('components/pdf-preview.tsx','utf8');
const viewerCode=compile(declaration('pdf.tsx',pdfSource,'DocumentPageViewer')
 .replace(/import\(\/\* webpackIgnore: true \*\/ engineUrl\)/g,'loadEngine(engineUrl)')
 .replaceAll('import.meta.url','"https://fixture.invalid/viewer.js"'));
function viewerHarness(loadEngine){
 const state=[0,null,null],updates=[],timers=new Map();let effect,cleanup,index=0,nextTimer=1;
 const window={setTimeout(fn,ms){assert.equal(ms,20000);const id=nextTimer++;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}};
 const exports={};
 Function('require','exports','useState','useEffect','window','loadEngine','LoadingState','ErrorState','DocumentPages',viewerCode)(require,exports,initial=>{const slot=index++;return [state[slot]??initial,value=>{state[slot]=typeof value==='function'?value(state[slot]):value;updates.push(slot)}]},fn=>{effect=fn},window,loadEngine,stub,stub,stub);
 const file=new Blob(['%PDF-fixture']);exports.DocumentPageViewer({file});cleanup=effect();
 return {file,state,updates,timers,cleanup,timeout:()=>{for(const fn of [...timers.values()])fn();timers.clear()}};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
let resolveEngine;const delayedEngine=new Promise(resolve=>{resolveEngine=resolve});
const importStall=viewerHarness(()=>delayedEngine);importStall.timeout();assert.equal(importStall.state[2].file,importStall.file);assert.match(importStall.state[2].message,/dauert zu lange/);
resolveEngine({getDocument(){throw Error('Late engine must not start a worker')}});await flush();assert.equal(importStall.updates.length,1);importStall.cleanup();
let resolvePdf,destroyed=0;const workerTask={promise:new Promise(resolve=>{resolvePdf=resolve}),destroy:async()=>{destroyed++}};
const workerStall=viewerHarness(async()=>({GlobalWorkerOptions:{},getDocument:()=>workerTask}));await flush();workerStall.timeout();assert.equal(destroyed,1);resolvePdf({numPages:2});await flush();assert.equal(workerStall.state[1],null,'Timed-out worker cannot resurrect the old document');workerStall.cleanup();
const success=viewerHarness(async()=>({GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:2}),destroy:async()=>{}})}));await flush();assert.equal(success.state[1].pdf.numPages,2);assert.equal(success.timers.size,0);assert.equal(success.state[2],null);success.cleanup();
let resolveUnmount;const unmounted=viewerHarness(()=>new Promise(resolve=>{resolveUnmount=resolve}));unmounted.cleanup();resolveUnmount({getDocument(){throw Error('Unmounted viewer must not start a worker')}});await flush();assert.equal(unmounted.updates.length,0);assert.equal(unmounted.timers.size,0);
console.log('Actual PDF viewer: bounded module/worker startup, late-result suppression, successful load and unmount cleanup passed.');

const uiSource=await fs.readFile('components/ui.tsx','utf8'),actualUi={};
Function('require','exports',compile(declaration('ui.tsx',uiSource,'FormActions')))(require,actualUi);
const sheetOwner={};let sheetState=0;
Function('require','exports','useState','useEffect','useRef','useBrowserBackGuard','useDialogFocus','Children','isValidElement','cloneElement','FormActions','sheetForm','sheetValues','createPortal','ConfirmDialog','Icon','document',compile(declaration('ux.tsx',ux,'Sheet')+'\nexport {Sheet};'))(require,sheetOwner,()=>[sheetState++===0,()=>{}],()=>{},value=>({current:value}),()=>()=>{},()=>({current:null}),React.Children,React.isValidElement,React.cloneElement,actualUi.FormActions,helpers.sheetForm,()=>'',element=>element,stub,stub,{body:{}});
const actionHtml=html(React.createElement(sheetOwner.Sheet,{open:true,label:'Company',kind:'form',onClose:()=>{}},React.createElement('p',null,'Company fields'),React.createElement(actualUi.FormActions,null,React.createElement('button',null,'Save'))));
assert.match(actionHtml,/<div class="sheet-body"><p>Company fields<\/p><\/div><div class="filter-sheet-actions">/,'Actual Sheet moves FormActions outside its scrolling body and normalizes the footer contract');
console.log('Actual Sheet: component-based FormActions has a separate shared footer.');
