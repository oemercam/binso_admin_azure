import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Execute the actual hook with deterministic DOM events. A pointer deliberately
// does not focus its target; no browser-specific click policy is assumed.
const listeners=new Map();
const emit=(type,target,extra={})=>{for(const fn of [...(listeners.get(type)??[])])fn({type,target,preventDefault(){},...extra})};
class Element {
 constructor(name,parent=null){this.name=name;this.parent=parent;this.children=[];this.isConnected=true;this.inert=false;this.modal=false;this.dataset={};this.style={setProperty(){},removeProperty(){}};if(parent)parent.children.push(this);}
 contains(target){return target===this||this.children.some(child=>child.contains(target));}
 closest(selector){if(selector==='[inert]'&&this.inert||selector==='[aria-modal="true"]'&&this.modal||selector.startsWith('button,a[href]')&&!this.modal&&!['body','html'].includes(this.name))return this;return this.parent?.closest(selector)??null;}
 matches(){return false;}
 getClientRects(){return this.isConnected?[{}]:[];}
 querySelectorAll(){return this.children.filter(child=>child.isConnected);}
 focus(){document.activeElement=this;emit('focusin',this);}
 scrollIntoView(){}
}
const body=new Element('body'),html=new Element('html');body.children=[];
const document={body,documentElement:html,activeElement:body,querySelectorAll:()=>[],addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn)},removeEventListener(type,fn){listeners.get(type)?.delete(fn)}};
const window={innerHeight:800,visualViewport:null,dispatchEvent(){}};
let current;
const useRef=initial=>{const at=current.cursor++;return current.refs[at]??(current.refs[at]={current:initial})};
const useEffect=(create,deps)=>{const at=current.effectCursor++,old=current.effects[at];if(!old||deps.some((dep,index)=>!Object.is(dep,old.deps[index])))current.pending.push({at,create,deps})};
const compiled=ts.transpileModule(fs.readFileSync('components/use-dialog-focus.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
Function('require','exports','document','window','HTMLElement','Element','Node','requestAnimationFrame','cancelAnimationFrame',compiled)(name=>name==='react'?{useRef,useEffect}:{lockPageScroll:()=>()=>{}},exports,document,window,Element,Element,Element,()=>1,()=>{});
function instance(){return {refs:[],effects:[],pending:[],cursor:0,effectCursor:0}}
function render(hook,open,dialog,onClose=()=>{}){
 current=hook;hook.cursor=0;hook.effectCursor=0;hook.pending=[];
 const ref=exports.useDialogFocus(open,onClose);ref.current=dialog;
 for(const item of hook.pending)hook.effects[item.at]?.cleanup?.();
 for(const item of hook.pending)hook.effects[item.at]={deps:item.deps,cleanup:item.create()};
 return ref;
}
const flush=()=>new Promise(resolve=>queueMicrotask(resolve));
const tracker=instance();render(tracker,false,null);
for(const activation of ['pointer','keyboard'])for(const dismissal of ['Escape','X','selection']){
 const trigger=new Element('actual '+activation),unrelated=new Element('unrelated');unrelated.focus();
 const hook=instance();render(hook,false,null);
 if(activation==='pointer'){document.activeElement=body;emit('pointerdown',trigger);emit('click',trigger)}else{trigger.focus();emit('click',trigger)}
 const dialog=new Element('dialog');dialog.modal=true;const close=new Element('close',dialog);let closes=0;
 render(hook,true,dialog,()=>closes++);assert.equal(document.activeElement,close,'Opening puts focus inside');
 if(dismissal==='Escape'){emit('keydown',close,{key:'Escape'});assert.equal(closes,1)}else{emit('pointerdown',close);emit('click',close)}
 dialog.isConnected=false;close.isConnected=false;document.activeElement=body;render(hook,false,null);await flush();
 assert.equal(document.activeElement,trigger,activation+' '+dismissal+' returns to the actual invoker');
}
// Selecting an action replaces its menu. Its retired button must not lose the
// lineage to the original row, nor restore focus over the newly active dialog.
const row=new Element('contact row');row.focus();const menu=new Element('contact actions');menu.modal=true;const edit=new Element('edit',menu);
const menuHook=instance();render(menuHook,true,menu);emit('pointerdown',edit);emit('click',edit);
menu.isConnected=false;edit.isConnected=false;document.activeElement=body;
const editor=new Element('contact editor');editor.modal=true;const field=new Element('field',editor),editorHook=instance();
render(editorHook,true,editor);render(menuHook,false,null);await flush();assert.equal(document.activeElement,field,'Retiring menu cannot steal focus from its replacement');
editor.isConnected=false;field.isConnected=false;document.activeElement=body;render(editorHook,false,null);await flush();
assert.equal(document.activeElement,row,'Replacement returns to the original connected row');
console.log('Actual dialog hook: pointer/keyboard Escape, X, selection and replaced-menu lineage passed.');

// The actual recovery hook must survive a portal inserted after its first frame
// and an inert ancestor. Once focus succeeds, later DOM changes cannot steal it.
let mutation,disconnected=false,fieldNode=null;const frames=new Map();let nextFrame=0;
class Observer {constructor(callback){mutation=callback}observe(){}disconnect(){disconnected=true}}
const recoveryWindow={addEventListener(){},removeEventListener(){}};
document.getElementById=()=>fieldNode;
const recovery={};
const recoverySource=ts.transpileModule(fs.readFileSync('components/use-setup-field.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const recoveryRequire=name=>name==='react'?{useRef,useEffect}:name==='next/navigation'?{useSearchParams:()=>({get:key=>key==='setupField'?'iban':null})}:name.includes('action-readiness')?{setupField:value=>value,setupFieldIds:{iban:'setup-iban'}}:{safeAppPath:()=>null};
Function('require','exports','document','window','HTMLInputElement','MutationObserver','requestAnimationFrame','cancelAnimationFrame',recoverySource)(recoveryRequire,recovery,document,recoveryWindow,Element,Observer,fn=>{const id=++nextFrame;frames.set(id,fn);return id},id=>frames.delete(id));
const recoveryHook=instance();current=recoveryHook;recovery.useSetupField(['iban'],true,true,()=>{throw Error('Already editing')},true);
const cleanups=recoveryHook.pending.map(item=>item.create());
const flushFrame=()=>{const batch=[...frames.values()];frames.clear();for(const fn of batch)fn()};
const prior=document.activeElement;flushFrame();assert.equal(document.activeElement,prior,'Missing portal never consumes the recovery focus');
fieldNode=new Element('iban');fieldNode.inert=true;mutation?.();flushFrame();assert.equal(document.activeElement,prior,'Inert field cannot consume focus');
fieldNode.inert=false;mutation?.();flushFrame();assert.equal(document.activeElement,fieldNode,'Late committed and unlocked field receives focus');assert.equal(disconnected,true,'Observation ends after success');
const anotherField=new Element('user typing');anotherField.focus();mutation?.();flushFrame();assert.equal(document.activeElement,anotherField,'A later mutation never steals user focus');
for(const cleanup of cleanups)cleanup?.();
console.log('Actual field recovery: delayed portal, inert release and one-shot focus without timer polling passed.');
