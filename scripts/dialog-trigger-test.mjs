import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

// Browser inert may synchronously blur a background control. Exercise the actual
// hook against that DOM behavior, rather than asserting source statement order.
let document;
class Element {
 constructor(name){this.name=name;this.isConnected=true;this.tagName='DIV';this.children=[];this._inert=false;}
 contains(node){return this===node||this.children.some(child=>child.contains(node));}
 matches(selector){return this.name==='dialog'&&selector==='.bottom-sheet';}
 closest(){return null;}
 getClientRects(){return [{}];}
 querySelectorAll(){return this.children;}
 focus(){if(!background?.inert||!background.contains(this))document.activeElement=this;}
 get inert(){return this._inert;}
 set inert(value){this._inert=value;if(value&&this.contains(document.activeElement))document.activeElement=document.body;}
}
const trigger=new Element('trigger'),close=new Element('close'),dialog=new Element('dialog'),background=new Element('app'),layer=new Element('layer'),body=new Element('body');
background.children=[trigger];dialog.children=[close];layer.children=[dialog];body.children=[background,layer];
document={body,activeElement:trigger,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){},documentElement:{dataset:{},style:{setProperty(){},removeProperty(){}}}};
const effects=[],microtasks=[],refs=[{current:dialog},{current:()=>{}},{current:trigger}];let refIndex=0;
const sandbox={exports:{},Element,HTMLElement:Element,Node:Element,document,window:{innerHeight:900,visualViewport:null,dispatchEvent(){}},Event,queueMicrotask:callback=>microtasks.push(callback),requestAnimationFrame:()=>1,cancelAnimationFrame(){},require:name=>name==='react'?{useRef:()=>refs[refIndex++],useEffect:effect=>effects.push(effect)}:{lockPageScroll:()=>()=>{}}};
const source=fs.readFileSync('components/use-dialog-focus.ts','utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,sandbox);
document.activeElement=body;
sandbox.exports.useDialogFocus(false,()=>{});
for(const effect of effects)effect();
assert.equal(refs[2].current,trigger,'Transient body focus cannot replace the last real trigger');
effects.length=0;refIndex=0;document.activeElement=trigger;
sandbox.exports.useDialogFocus(true,()=>{});
const cleanups=effects.map(effect=>effect()).filter(Boolean);
assert.equal(background.inert,true,'The actual modal hook locks its background');
assert.equal(document.activeElement,close,'Focus enters the actual dialog control');
for(const cleanup of cleanups.reverse())cleanup();
microtasks.splice(0).forEach(callback=>callback());
assert.equal(background.inert,false,'Closing restores the background');
assert.equal(document.activeElement,trigger,'Focus returns to the control captured before inert blurred it');
effects.length=0;refIndex=0;refs[2].current=null;document.activeElement=trigger;
sandbox.exports.useDialogFocus(true,()=>{},true);
const headerCleanups=effects.map(effect=>effect()).filter(Boolean);
background.inert=true;
document.activeElement=close;
for(const cleanup of headerCleanups.reverse())cleanup();
// A mobile header selector changes after its viewport effect. Reinitializing
// that same open dialog must retain the original page trigger.
effects.length=0;refIndex=0;
sandbox.exports.useDialogFocus(true,()=>{},true,'.header-panel');
const mobileCleanups=effects.map(effect=>effect()).filter(Boolean);
microtasks.splice(0).forEach(callback=>callback());
document.activeElement=body;
for(const cleanup of mobileCleanups.reverse())cleanup();
assert.equal(document.activeElement,body,'Focus waits while the header background owner is still locked');
background.inert=false;
microtasks.splice(0).forEach(callback=>callback());
assert.equal(document.activeElement,trigger,'Header-panel cleanup releases its own lock before deferred focus restoration');
console.log('Dialog trigger: actual hook preserves the original control across synchronous inert blur and restores background/focus on close.');
