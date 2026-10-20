import assert from 'node:assert/strict';
import {checkDeployedAuth} from './check-deployed-auth.mjs';
const run=async override=>{
 const calls=[];const request=async(url,options)=>{assert.equal(options.method,undefined,'Production verifier only performs GET');calls.push(url.pathname);if(override?.transient&&calls.length===1)return new Response('{}',{status:503});if(url.pathname.startsWith('/demo/'))return new Response(null,{status:override?.staticStatus??404});if(!url.pathname.startsWith('/api/'))return new Response(null,{status:override?.pageStatus??307,headers:{location:override?.location??'/login'}});const retired=url.pathname.includes('/demo/')||url.pathname==='/api/operator/demo-session';return new Response(JSON.stringify({authenticated:override?.authenticated??false}),{status:retired?override?.retiredStatus??410:url.pathname==='/api/auth/session'?200:override?.apiStatus??401,headers:override?.cookie?{'set-cookie':'unsafe=1'}:{}});};
 const result=await checkDeployedAuth('https://fixture.invalid',request);assert.equal(calls.length,override?.transient?19:18);return result;
};
assert.equal((await run()).readOnly,true);
assert.equal((await run({transient:true})).readOnly,true,'Transient 503 is retried without relaxing authentication assertions');
for(const scenario of [{retiredStatus:200},{retiredStatus:404},{authenticated:true},{apiStatus:200},{cookie:true},{staticStatus:200},{pageStatus:200},{location:'/dashboard'},{location:'https://foreign.invalid/login'}])await assert.rejects(()=>run(scenario),JSON.stringify(scenario));
console.log('Production auth verification: retired URL/cookie refusal and protected API denial positives and negatives, GET-only requests passed.');
