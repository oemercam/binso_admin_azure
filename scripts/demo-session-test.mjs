import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

async function load(file,dependencies){
 const source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const output={};
 Function('require','exports',source)(name=>{if(!Object.hasOwn(dependencies,name))throw Error('Unexpected dependency: '+name);return dependencies[name]},output);
 return output;
}
// Retired URLs must not import database, provisioning, cookies or credentials.
for(const path of ['demo/session','demo/data','demo/dashboard','demo/finance','demo/platform-finance','operator/demo-session']){
 const route=await load('app/api/'+path+'/route.ts',{'@/lib/server/http':{json:(body,status)=>({body,status})}});
 for(const method of ['GET','POST','DELETE']){
  const response=await route[method]({headers:new Headers({'x-binso-smoke-test':'legacy-proof'}),nextUrl:new URL('https://fixture.invalid/api/'+path+'?reset=1')});
  assert.equal(response.status,410,path+' '+method);
  assert.equal(response.body.error,'demo_retired');
 }
}
let reads=0;
const jar=new Map([['binso_demo',{value:'1'}],['binso_demo_write',{value:'old-token'}]]);
const session=await load('lib/server/session.ts',{
 './audit':{audit:async()=>{throw Error('Legacy/demo validation must not create a login audit')}},
 './fresh-authentication':await load('lib/server/fresh-authentication.ts',{'server-only':{},'./db':{withTenant:()=>{throw Error('Legacy session must not request fresh proof')}},'./http':{ApiError:class extends Error{}}}),
 'server-only':{},'node:crypto':await import('node:crypto'),
 'next/headers':{cookies:async()=>jar,headers:async()=>new Headers()},
 '@/lib/server/maintenance':{maintenanceState:async()=>({enabled:false})},
 '@/lib/server/db':{query:async()=>{throw Error('Unexpected write')},withTransaction:async fn=>{reads++;return fn({query:async()=>({rows:[]})})}},
 '@/lib/server/http':{ApiError:class extends Error{}},
 '@/lib/server/env':{env:{sessionCookieName:'real_session'}},
 '@/lib/server/subscription-lifecycle':{expireUnpaidTrials:async()=>{throw Error('Unexpected trial mutation')}},
});
assert.equal(await session.getSession(),null);assert.equal(reads,0,'Legacy demo cookies cannot start a database session');
jar.set('real_session',{value:'normal-token'});
assert.equal(await session.getSession(),null);assert.equal(reads,1,'Normal account cookie retains database validation');
let actual=null,validated=0;
const operator=await load('lib/server/operator.ts',{
 'server-only':{},'next/navigation':{redirect:path=>{throw Error('redirect:'+path)}},
 '@/lib/server/operator/session':{getOperatorSession:async()=>actual,requireOperatorSession:async()=>{validated++;return actual}},
});
await assert.rejects(operator.requireOperator(),/redirect:\/operator\/login/);
actual={role:'platform_owner',name:'Synthetic Operator',email:'operator@example.invalid'};
assert.deepEqual(await operator.requireOperator(),{role:actual.role,identity:{name:actual.name,email:actual.email}});assert.equal(validated,1,'Real operator authorization remains mandatory');
const previousCookieName=process.env.SESSION_COOKIE_NAME;process.env.SESSION_COOKIE_NAME='normal_session';
try{
 const response=kind=>({kind,headers:new Headers(kind==='next'?{'x-middleware-next':'1'}:{}),cookies:{set(){}}});
 const proxyModule=await load('proxy.ts',{
  './lib/server/maintenance':{maintenanceState:async()=>({enabled:false})},
  './lib/locales/config':{asLocale:x=>x,localeCookie:'fixture_locale',locales:['de','fr','it','en']},
  './lib/operator-pages':{validOperatorSection:()=>true},
  'next/server':{NextResponse:{next:()=>response('next'),rewrite:()=>response('rewrite'),redirect:url=>({...response('redirect'),url:String(url)})}},
 });
 const request=(route,cookies)=>({url:'https://fixture.invalid'+route,nextUrl:new URL('https://fixture.invalid'+route),headers:new Headers(),cookies:{get:name=>cookies.has(name)?{value:cookies.get(name)}:undefined}});
 const legacy=new Map([['binso_demo','1'],['binso_demo_write','old'],['binso_operator_demo','1']]);
 for(const route of ['/dashboard','/kunden','/projekte/neu','/support/ticket-one']){
  const denied=await proxyModule.proxy(request(route,legacy));assert.equal(denied.kind,'redirect');assert.equal(new URL(denied.url).pathname,'/login');
  assert.equal((await proxyModule.proxy(request(route,new Map([['normal_session','opaque-server-validated-session']])))).kind,'next','Normal cookie presence reaches authoritative server validation');
 }
 assert.equal((await proxyModule.proxy(request('/produkt',legacy))).kind,'next','Public product access remains public');
}finally{if(previousCookieName===undefined)delete process.env.SESSION_COOKIE_NAME;else process.env.SESSION_COOKIE_NAME=previousCookieName;}
console.log('Demo retirement: all six URLs reject legacy access; demo cookies cannot authenticate; normal sessions and operator authorization remain validated.');
