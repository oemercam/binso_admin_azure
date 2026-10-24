import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';
/** A lock barrier proves both real HTTP requests saw the pre-expiry identity. */
export async function verifyConcurrentTrialExpiry({base,pool,cookie,organizationId}){
 assert(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Only isolated loopback servers allowed');
 assert(['binso_ui_test','binso_v213_test'].includes((await pool.query('select current_database() name')).rows[0].name),'Only named disposable databases allowed');
 await pool.query("update organizations set status='trial' where id=$1",[organizationId]);await pool.query("update organization_subscriptions set status='trial',trial_until=now()-interval '1 minute',billing_subscription_id=null where organization_id=$1",[organizationId]);
 let locker=await pool.connect();
 try{
  await locker.query('begin');await locker.query('select 1 from organization_subscriptions where organization_id=$1 for update',[organizationId]);
  const pending=[0,1].map(()=>fetch(base+'/api/auth/session',{headers:{cookie}}).then(r=>r.json()));
  let blocked=0;for(let i=0;i<100;i++){blocked=Number((await pool.query("select count(*)::int n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query like '%with expired as%'")).rows[0].n);if(blocked>=2)break;await new Promise(r=>setTimeout(r,50))}
  assert.equal(blocked,2,'Both real session requests must reach expiry before releasing the lock');
  await locker.query('commit');locker.release();locker=null;
  const responses=await Promise.all(pending);assert(responses.every(r=>r.authenticated&&r.tenant.readOnly),'Both concurrent session checks must reflect committed trial expiry');
  console.log('Native session concurrency: both lock-synchronized HTTP checks observe read-only trial expiry.');
 }finally{if(locker){await locker.query('rollback');locker.release()}}
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const {default:pg}=await import('pg'),{createHash}=await import('node:crypto'),{spawn}=await import('node:child_process'),{createUiAuthFixture}=await import('./ui-auth-fixture.mjs');
 const auth=await createUiAuthFixture(),pool=new pg.Pool({connectionString:auth.env.DATABASE_URL,max:3}),port='3228',base='http://127.0.0.1:'+port;
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:'ignore',env:{...process.env,...auth.env}});
 try{
  for(let i=0;;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}if(i>120)throw Error('Server unavailable');await new Promise(r=>setTimeout(r,250))}
  const cookie=auth.cookies.find(c=>c.name===auth.env.SESSION_COOKIE_NAME),hash=createHash('sha256').update(cookie.value).digest('hex'),organizationId=(await pool.query('select organization_id from auth_sessions where token_hash=$1',[hash])).rows[0].organization_id;
  await verifyConcurrentTrialExpiry({base,pool,cookie:cookie.name+'='+cookie.value,organizationId});
 }finally{server.kill();await new Promise(r=>server.once('exit',r));await pool.end();await auth.close()}
}
