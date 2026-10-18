import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {withoutLocalization} from './localized-source.mjs';
import {navigationAccess} from './navigation-foundation-test.mjs';
const require=createRequire(import.meta.url),read=file=>fs.readFileSync(file,'utf8');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const ast=ts.createSourceFile('workspace.tsx',withoutLocalization(read('components/binso-ux.tsx')),99,true,4);
const source=ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n');
const exports={},root={current:null};let state=0;
const control=({children,...props})=>React.createElement('button',props,children);
Function('require','exports','Children','isValidElement','cloneElement','useState','useRef','useEffect','useRouter','useDialogFocus','useBrowserBackGuard','ConfirmDialog','FormActions','Button','Icon','createPortal','document',compile(source))(
 require,exports,React.Children,React.isValidElement,React.cloneElement,
 initial=>[state++===1?true:initial,()=>{}],()=>root,()=>{},()=>({push(){}}),()=>root,()=>()=>{},()=>null,
 ({children})=>React.createElement('footer',null,children),control,()=>React.createElement('svg'),children=>children,{body:{}});
function render(workspace){state=0;return renderToStaticMarkup(React.createElement(exports.FormSheet,{label:'Task',open:true,workspace,onClose(){},description:'Details',dirty:true},React.createElement('input',{defaultValue:'Unsaved'})));}
const inline=render(true),modal=render(false);
assert.match(inline,/role="region"/);assert.doesNotMatch(inline,/aria-modal|sheet-layer|<h2/,'Route workspace has no modal semantics, scrim or repeated heading');
assert.match(inline,/value="Unsaved"/);assert.match(inline,/aria-label="Schliessen"/,'Workspace keeps an explicit guarded exit');
assert.match(modal,/role="dialog"/);assert.match(modal,/aria-modal="true"/);assert.match(modal,/sheet-layer/,'Short contextual forms retain actual modal behavior');
const access=navigationAccess(read);
assert.notDeepEqual(navigationAccess(file=>file==='components/app-shell.tsx'?read(file).replace('canOpen("/kunden")','canOpen("/zahlungen")'):read(file)),access,'A changed destination permission cannot pass the layout migration');
assert.notDeepEqual(navigationAccess(file=>file==='components/app-shell.tsx'?read(file).replace('href="/dashboard" className={active===','href="/zahlungen" className={active==='):read(file)),access,'A changed bottom navigation target cannot pass');
const display={};Function('require','exports',compile(read('lib/display-format.ts').replace('import {formatCurrency} from "./financial-status";','')))(require,display);
assert.equal(display.messageDay('2026-10-17T22:30:00Z'),'18.10.2026','Zurich midnight is a new chat day');
assert.equal(display.messageDay('2026-01-17T22:30:00Z'),'17.01.2026','Winter offset is respected');
assert.equal(display.messageDay('invalid'),'','Bad metadata never invents Today');
console.log('Actual workspace/modal rendering, guarded-exit presence, unchanged-access adversaries and Swiss chat-day boundaries passed.');

// Execute the actual update-notice effect/handler with isolated browser services.
{
 const updateAst=ts.createSourceFile('update.tsx',withoutLocalization(read('components/app-version-notice.tsx')),99,true,4);
 const code=compile(updateAst.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(updateAst)).join('\n'));
 let available=false,blocked=false,index=0,dispose,sha='a'.repeat(40),requests=0,reloads=0,dirty=false;
 const baseline={current:null},events=new Map(),updates={};
 const document={visibilityState:'visible',querySelector:()=>dirty?{}:null,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 const window={setTimeout,clearTimeout,location:{reload:()=>reloads++},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 Function('require','exports','useEffect','useRef','useState','Button','document','window','fetch',code)(require,updates,fn=>{if(!dispose)dispose=fn()},()=>baseline,()=>{const first=index++===0;return [first?available:blocked,value=>{if(first)available=value;else blocked=value}]},control,document,window,async()=>{requests++;return {ok:true,json:async()=>({sha})}});
 const render=()=>{index=0;return updates.AppVersionNotice()};
 assert.equal(render(),null);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests,1);assert.equal(available,false);sha='b'.repeat(40);
 events.get('visibilitychange')();events.get('pageshow')();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests,2,'Simultaneous resume events coalesce');assert.equal(available,true);assert.equal(reloads,0,'Discovery never reloads the active editor');
 dirty=true;render().props.children[1].props.onClick();assert.equal(reloads,0);assert.equal(blocked,true,'Unsaved/busy work blocks manual reload');
 dirty=false;render().props.children[1].props.onClick();assert.equal(reloads,1,'An explicit clean-state click performs exactly one reload');
 dispose();assert.equal(events.size,0,'Resume listeners are released');
 console.log('Actual version notice: foreground coalescing, no automatic reload, dirty-state protection and explicit clean-state update passed.');
}
