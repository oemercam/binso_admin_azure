import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
const base=(process.env.BINSO_BASE_URL??'http://127.0.0.1:3000').replace(/\/$/,'');
const response=await fetch(base+'/',{signal:AbortSignal.timeout(20000)});
assert.equal(response.status,200);
const html=await response.text();
const match=html.match(/<script\b[^>]*id="binso-theme-init"[^>]*>([\s\S]*?)<\/script>/);
assert.ok(match,'Initial theme resolver must be present');
assert.ok(html.indexOf(match[0])<html.indexOf('<body'),'Theme must resolve before body rendering');
for(const scenario of [
 {mode:null,dark:false,expected:'light'},
 {mode:null,dark:true,expected:'dark'},
 {mode:'light',dark:true,expected:'light'},
 {mode:'dark',dark:false,expected:'dark'},
 {mode:'system',dark:true,expected:'dark'},
 {mode:'system',dark:false,expected:'light'},
 {mode:'invalid',dark:true,expected:'dark'},
 {mode:null,dark:true,blocked:true,expected:'dark'},
 {mode:null,dark:false,blocked:true,expected:'light'},
]){
 const dataset={},meta={content:'#ffffff',removeAttribute(){}};
 const values={'binso.theme.mode':scenario.mode};
 runInNewContext(match[1],{
  document:{documentElement:{dataset},querySelectorAll:()=>[meta]},
  window:{matchMedia:()=>({matches:scenario.dark})},
  localStorage:{getItem:key=>{if(scenario.blocked)throw new Error('Storage blocked');return values[key]??null},setItem:(key,value)=>{if(scenario.blocked)throw new Error('Storage blocked');values[key]=value}},
 },{timeout:1000});
 assert.equal(dataset.theme,scenario.expected,JSON.stringify(scenario));
 assert.equal(meta.content,scenario.expected==='dark'?'#000000':'#ffffff');
}
console.log('Initial theme integrity OK: explicit/system modes, opposite OS preference, blocked storage and browser chrome.');
