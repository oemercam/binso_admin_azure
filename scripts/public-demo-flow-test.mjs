import {moduleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile('scripts/check-route-css.mjs','utf8');
const start=source.indexOf('async function verifyDemoFlow(){'),end=source.indexOf('\nawait verifyDemoFlow();',start);
assert.ok(start>=0&&end>start);
async function run(overrides={}){
 const failures=[],calls=[];
 const fetch=async(url,options={})=>{calls.push([url,options]);if(url.endsWith('/api/demo/session'))return options.headers['x-binso-smoke-test']?new Response('{}',{status:overrides.qaStatus??200,headers:{'set-cookie':'binso_demo=1'}}):new Response('{}',{status:overrides.publicStatus??404,headers:overrides.publicCookie?{'set-cookie':'binso_demo=1'}:{}});if(url.endsWith('/demo'))return new Response(null,{status:307,headers:{location:overrides.redirect??'/registrieren'}});return new Response('ok');};
 const fn=vm.runInNewContext('('+source.slice(start,end)+')',{failures,fetch,base:'http://127.0.0.1:3000',URL,process:{env:overrides.noProof?{}:{BINSO_SMOKE_TEST_TOKEN:'isolated-qa-fixture'}},console});
 await fn();return {failures,calls};
}
assert.deepEqual((await run()).failures,[]);
for(const scenario of [{publicStatus:200},{publicCookie:true},{redirect:'/dashboard'},{qaStatus:403},{noProof:true}])assert.ok((await run(scenario)).failures.length>0,JSON.stringify(scenario));
const positive=await run();assert.equal(positive.calls.filter(([,options])=>options.headers?.['x-binso-smoke-test']).length,1);
console.log('Actual runtime demo verifier: public denial, cookie refusal, registration redirect, protected QA positive and failure/missing-proof negatives passed.');

const {default:config}=await import(moduleUrl(await fs.readFile('next.config.ts','utf8')));
assert.deepEqual(await config.redirects(),[{source:'/demo',destination:'/registrieren',permanent:false}]);
console.log('Actual Next configuration resolves the legacy demo before streamed page rendering.');
