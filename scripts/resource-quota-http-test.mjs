import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
/** Called only from the empty, migrated, strictly loopback quota fixture. */
export async function verifyQuotaHttp({connectionString,db,org,user}){
 const token=randomBytes(32).toString('base64url');
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'business','active')",[org]);
 await db.query("insert into auth_sessions(organization_id,user_id,token_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')",[org,user,createHash('sha256').update(token).digest('hex')]);
 await db.query('update organization_entitlements set max_api_requests_per_month=4 where organization_id=$1',[org]);
 const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
 const base='http://127.0.0.1:'+port,cookie='binso_quota_http_fixture='+token;
 const env={...process.env,DATABASE_URL:connectionString,DATABASE_SSL:'false',APP_URL:base,APP_MODE:'local',SESSION_COOKIE_NAME:'binso_quota_http_fixture'};
 for(const key of Object.keys(env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_)/.test(key))delete env[key];
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:['ignore','pipe','pipe']});
 let logs='';server.stdout.on('data',value=>logs+=value);server.stderr.on('data',value=>logs+=value);
 const get=(path,session=cookie)=>fetch(base+path,{headers:{cookie:session},signal:AbortSignal.timeout(15000)});
 try{
  for(let attempt=0;;attempt++){try{if((await get('/login')).ok)break;}catch{}if(attempt>120||server.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,200));}
  const allowed=await get('/api/customers');assert.equal(allowed.status,200,await allowed.clone().text());
  const denied=await get('/api/customers');assert.equal(denied.status,429);assert.equal((await denied.json()).error,'api_quota_exceeded');
  for(const path of ['/api/auth/session','/api/settings/profile','/api/support/tickets','/api/billing/catalog']){const response=await get(path);assert.equal(response.status,200,path+' remains available: '+await response.clone().text());}
  assert.equal((await get('/api/customers','binso_quota_http_fixture=invalid')).status,401,'Invalid tokens are denied by the real route, never converted into a quota identity');
  assert.equal(Number((await db.query("select api_requests from organization_quota_usage where organization_id=$1 and period=to_char(now() at time zone 'Europe/Zurich','YYYY-MM')",[org])).rows[0].api_requests),4,'Only the single admitted business HTTP request was charged');
  console.log('Production HTTP + PostgreSQL: actual proxy/session/route admitted one remaining request, enforced 429, preserved account/billing/support and rejected an invalid token without charging.');
 }finally{server.kill();}
}
