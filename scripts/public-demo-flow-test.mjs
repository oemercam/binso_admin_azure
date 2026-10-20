import {moduleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile('scripts/check-route-css.mjs','utf8');
const start=source.indexOf('async function verifyDemoFlow(){'),end=source.indexOf('\nawait verifyDemoFlow();',start);
assert.ok(start>=0&&end>start);
async function run(overrides={}){
 const failures=[],calls=[];
 const fetch=async(url,options={})=>{calls.push([url,options]);if(url.endsWith('/api/demo/session'))return new Response('{}',{status:overrides.status??410,headers:overrides.cookie?{'set-cookie':'binso_demo=1'}:{}});if(url.endsWith('/demo'))return new Response(null,{status:307,headers:{location:overrides.redirect??'/registrieren'}});throw Error('Unexpected URL');};
 const fn=vm.runInNewContext('('+source.slice(start,end)+')',{failures,fetch,base:'http://127.0.0.1:3000',URL,process:{env:{}},console});await fn();return {failures,calls};
}
assert.deepEqual((await run()).failures,[]);
for(const scenario of [{status:200},{status:404},{cookie:true},{redirect:'/dashboard'}])assert.ok((await run(scenario)).failures.length>0,JSON.stringify(scenario));
assert.equal((await run()).calls.filter(([url])=>url.endsWith('/api/demo/session')).length,2,'Legacy proof cannot reactivate the retired endpoint');
const {default:config}=await import(moduleUrl(await fs.readFile('next.config.ts','utf8')));
assert.deepEqual(await config.redirects(),[{source:'/demo',destination:'/registrieren',permanent:false}]);
console.log('Actual Next configuration resolves the legacy demo before streamed page rendering.');
assert.doesNotMatch(await fs.readFile('app/login/page.tsx','utf8'),/href=["']\/demo["']/,'Public login must not revive a demo conversion entry');
