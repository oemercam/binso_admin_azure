import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

export async function checkDeployedAuth(base,request=fetch){
 const origin=new URL(base);assert.ok(origin.protocol==='https:'||['127.0.0.1','localhost'].includes(origin.hostname),'HTTPS required');
 const get=async route=>{
  for(let attempt=0;attempt<3;attempt++){
   try{const response=await request(new URL(route,origin),{redirect:'manual',headers:{'cache-control':'no-cache',cookie:'binso_demo=1; binso_demo_write=retired; binso_operator_demo=1'},signal:AbortSignal.timeout(20000)});if(response.status<500||attempt===2)return response;}catch(error){if(attempt===2)throw error;}
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw Error('Production verification unavailable');
 };
 for(const route of ['demo/session','demo/data','demo/dashboard','demo/finance','demo/platform-finance','operator/demo-session']){
  const response=await get('/api/'+route);assert.equal(response.status,410,'Retired endpoint must deny access: '+route);assert.equal(response.headers.get('set-cookie'),null,'No retired endpoint may issue authentication');
 }
 const session=await get('/api/auth/session');assert.equal(session.status,200);assert.equal((await session.json()).authenticated,false,'Legacy cookies must not authenticate');
 for(const route of ['/api/customers','/api/documents','/api/finance/summary','/api/settings/team/invitations','/api/operator/dashboard']){
  const response=await get(route);assert.ok([401,403].includes(response.status),'Protected API must deny legacy cookies: '+route+' HTTP '+response.status);
 }
 return {retiredEndpoints:6,protectedApis:5,legacyCookiesRejected:true,readOnly:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 console.log(JSON.stringify(await checkDeployedAuth(process.env.BINSO_BASE_URL??'http://127.0.0.1:3000')));
}
