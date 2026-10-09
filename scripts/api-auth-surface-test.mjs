import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';

// Only a server started here is allowed. No external URL or production database.
const port=process.env.BINSO_AUTH_TEST_PORT??'3217',base='http://127.0.0.1:'+port;
const inventory=JSON.parse(await fs.readFile('docs/architecture/v21-3-data-inventory.json','utf8'));
const publicPaths=new Set([
 '/api/auth/invitation','/api/auth/login','/api/auth/logout','/api/auth/password','/api/auth/recover','/api/auth/register','/api/auth/resend-verification','/api/auth/session','/api/auth/verify-email',
 '/api/billing/catalog','/api/billing/webhook','/api/health','/api/health/ready','/api/telemetry/web-vitals',
 '/api/demo/session','/api/operator/demo-session','/api/operator/logout','/api/operator/sso/callback',
]);
const probes=inventory.apis.filter(item=>!publicPaths.has(item.path)).flatMap(item=>item.methods.map(method=>({file:item.file,path:item.path.replace(/\[[^\]]+\]/g,'00000000-0000-4000-8000-000000000001'),method})));
const env={...process.env,PORT:port,HOSTNAME:'127.0.0.1'};delete env.DATABASE_URL;
const server=spawn(process.execPath,process.env.BINSO_UX_SERVER_FILE?[process.env.BINSO_UX_SERVER_FILE]:['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{env,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
try{
 for(let i=0;;i++){if(server.exitCode!==null)throw new Error('Isolated API server exited: '+logs);try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i>80)throw new Error('Isolated API server unavailable: '+logs);await new Promise(resolve=>setTimeout(resolve,250));}
 const results=[];
 for(const probe of probes){
  const response=await fetch(base+probe.path+(probe.path==='/api/demo/data'?'?collection=customers':''),{method:probe.method,redirect:'manual',headers:{origin:base,'content-type':'application/json','idempotency-key':'isolated-api-probe'},...(probe.method==='GET'?{}:{body:JSON.stringify({kind:'invoice',number:'RE-SYNTHETIC',customerName:'Synthetic customer',customerId:'00000000-0000-4000-8000-000000000001',items:[{description:'Synthetic',quantity:1,unitPrice:1,vatRate:0}],issueDate:'2026-10-09',dueDate:'2026-11-09',name:'Synthetic',unitPrice:1,vatRate:0,action:'start',amount:1,invoiceId:'00000000-0000-4000-8000-000000000001',paidOn:'2026-10-09',email:'api@fixture.invalid',role:'member',status:'draft'})}),signal:AbortSignal.timeout(15000)});
  const body=await response.text();results.push({...probe,status:response.status});
  assert.ok(([401,403].includes(response.status)||([['/api/auth/mfa','DELETE'],['/api/operator/users','POST']].some(([path,method])=>probe.path===path&&probe.method===method)&&response.status===405)),probe.method+' '+probe.path+' did not reject an anonymous request: '+response.status+' '+body.slice(0,250));
 }
 if(process.env.BINSO_AUTH_TEST_OUTPUT)await fs.writeFile(process.env.BINSO_AUTH_TEST_OUTPUT,JSON.stringify({scope:'anonymous HTTP boundary only; tenant/role behavior has separate database tests',publicExceptions:[...publicPaths],results},null,2));
 console.log('Actual anonymous HTTP requests rejected across '+probes.length+' private route methods (including explicitly unsupported MFA DELETE / Entra-managed operator creation). Public/token/webhook entry points explicitly excluded; no authenticated tenant coverage claimed.');
}finally{server.kill();}
