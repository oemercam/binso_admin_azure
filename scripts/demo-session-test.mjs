import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
let current={isDemo:true,organizationId:'old-demo'},provisionFailure=false,rateFailure=false;
const provisioned=[],created=[],destroyed=[],limited=[];
const env={databaseUrl:'synthetic',smokeTestToken:undefined};
const dependencies={
 '@/lib/server/env':{env},
 '@/lib/server/provisioning':{provisionOrganization:async input=>{if(provisionFailure)throw Error('Synthetic provisioning failure');provisioned.push(input);return {organizationId:'new-demo-'+provisioned.length}}},
 '@/lib/server/session':{getSession:async()=>current,createSession:async input=>created.push(input),destroySession:async name=>destroyed.push(name)},
 '@/lib/server/rate-limit':{enforceRateLimit:async(request,scope)=>{if(rateFailure)throw Object.assign(Error('Limited'),{status:429});limited.push(scope)}},
 'next/headers':{cookies:async()=>new Map([['binso_demo',{value:'1'}]])},
 '@/lib/server/http':{assertSameOrigin:request=>{if(request.headers.get('origin')==='https://foreign.invalid')throw Object.assign(Error('Origin'),{status:403})},json:(data,status=200)=>({data,status,cookies:{set(){}}}),apiError:error=>({status:error.status??500})},
 'node:crypto':await import('node:crypto'),
};
const output={};
const source=ts.transpileModule(await fs.readFile('app/api/demo/session/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
Function('require','exports',source)(name=>{if(!Object.hasOwn(dependencies,name))throw Error('Unexpected dependency: '+name);return dependencies[name]},output);
const request=(search='',origin='https://fixture.invalid')=>({nextUrl:new URL('https://fixture.invalid/api/demo/session'+search),headers:new Headers({origin})});
assert.equal((await output.POST(request())).status,200);assert.equal(provisioned.length,0,'Resume preserves the current private demo');
assert.equal((await output.POST(request('?reset=1'))).status,200);assert.equal(provisioned.length,1);assert.equal(provisioned[0].mode,'demo');assert.ok(provisioned[0].email.endsWith('@demo.example.invalid'));
assert.deepEqual(destroyed,['binso_demo_write']);assert.equal(created[0].cookieName,'binso_demo_write');assert.equal(created[0].organizationId,'new-demo-1');assert.equal(limited.length,1);
provisionFailure=true;assert.equal((await output.POST(request('?reset=1'))).status,500);assert.equal(destroyed.length,1,'A failed replacement cannot revoke the existing demo');provisionFailure=false;
rateFailure=true;assert.equal((await output.POST(request('?reset=1'))).status,429);assert.equal(provisioned.length,1);rateFailure=false;
assert.equal((await output.POST(request('?reset=1','https://foreign.invalid'))).status,403);assert.equal(provisioned.length,1);
current={isDemo:false,organizationId:'real-account'};assert.equal((await output.GET()).data.active,false);
assert.equal((await output.POST(request('?reset=1'))).status,200);assert.equal(provisioned.length,2);assert.equal(destroyed.length,1,'A production session is never destroyed by demo replacement');
assert.equal((await output.DELETE(request())).status,200);assert.ok(destroyed.every(name=>name==='binso_demo_write'));
console.log('Actual demo route: resume, isolated reset, reserved synthetic email, rate/origin denial, provisioning failure recovery and production-cookie preservation passed. No external service is called.');
