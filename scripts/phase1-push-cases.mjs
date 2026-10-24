import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import webpush from 'web-push';
export async function verifyWebPush({db,load,request,current,foreignOrganizationId}){
 const keys=webpush.generateVAPIDKeys(),saved={...process.env},org=current.organizationId,user=current.userId,ids=[];
 process.env.WEB_PUSH_PUBLIC_KEY=keys.publicKey;process.env.WEB_PUSH_PRIVATE_KEY=keys.privateKey;process.env.WEB_PUSH_SUBJECT='mailto:qa@example.invalid';
 const route=await import(await load('app/api/notifications/push/route.ts')),sender=await import(await load('lib/server/push.ts'));
 const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/synthetic-'+randomUUID(),keys:{p256dh:keys.publicKey,auth:randomBytes(16).toString('base64url')}};
 const post=value=>route.POST(request('POST',{subscription:value,organizationId:foreignOrganizationId,locale:'tr'},'https://example.invalid/api/notifications/push'));
 const notify=async()=>{const id=randomUUID();ids.push(id);await db.query("insert into in_app_notifications(id,organization_id,user_id,kind,title,body,href) values($1,$2,$3,'billing','Private invoice title','Sensitive invoice contents','/rechnungen')",[id,org,user]);return id};
 try{
  for(const endpoint of ['http://127.0.0.1/test','https://localhost/private','https://fcm.googleapis.com.attacker.invalid/fcm/send/x','https://user:pass@fcm.googleapis.com/fcm/send/x'])assert.equal((await post({...subscription,endpoint})).status,400,'Arbitrary endpoint/credential SSRF denied');
  assert.equal((await post(subscription)).status,200);
  assert.equal((await post(subscription)).status,200,'Registration is idempotent');
  assert.equal((await db.query('select count(*)::int n from push_subscriptions where user_id=$1',[user])).rows[0].n,1);
  const stored=(await db.query('select organization_id,subscription_enc from push_subscriptions where user_id=$1',[user])).rows[0];assert.equal(stored.organization_id,org);assert.ok(!stored.subscription_enc.includes(subscription.endpoint),'Device endpoint and keys are encrypted at rest');
  await db.query("insert into notification_preferences(organization_id,user_id,kind,push) values($1,$2,'Rechnungen',true) on conflict(organization_id,user_id,kind) do update set push=true",[org,user]);
  await notify();let calls=0;
  const sink=async(device,payload,options)=>{calls++;const body=JSON.parse(payload);assert.equal(body.body,'Yeni bildirim');assert.equal(body.url,'/benachrichtigungen');assert.ok(!payload.includes('Sensitive')&&!payload.includes('invoice title'));assert.equal(device.endpoint,subscription.endpoint);assert.equal(options.vapidDetails.publicKey,keys.publicKey);return {statusCode:201}};
  assert.equal((await sender.dispatchPush(20,sink)).attempted,1);assert.equal(calls,1);
  assert.equal((await sender.dispatchPush(20,sink)).attempted,0);assert.equal(calls,1,'A committed notification/device pair is never resent');
  await notify();
  const parallel=await Promise.all(Array.from({length:4},()=>sender.dispatchPush(20,sink)));
  assert.equal(parallel.reduce((count,result)=>count+result.attempted,0),1,'Competing workers claim one notification/device pair only once');
  assert.equal(calls,2,'Concurrent workers cannot repeat provider I/O for the same pair');
  const uncertain=await notify();
  const interrupted=await sender.dispatchPush(20,async()=>{throw Error('Synthetic network interruption')});
  assert.equal(interrupted.uncertain,1);
  assert.equal((await db.query('select status from push_deliveries where notification_id=$1',[uncertain])).rows[0].status,'uncertain');
  assert.equal((await sender.dispatchPush(20,sink)).attempted,0,'A lost provider response must not cause automatic retry');
  const orphan=await notify();
  await db.query("insert into push_deliveries(organization_id,user_id,subscription_id,notification_id,status,attempted_at) select organization_id,user_id,id,$2,'processing',now()-interval '6 minutes' from push_subscriptions where user_id=$1",[user,orphan]);
  assert.equal((await sender.dispatchPush(20,sink)).attempted,0,'A crashed committed claim is not sent a second time');
  assert.equal((await db.query('select status from push_deliveries where notification_id=$1',[orphan])).rows[0].status,'uncertain');
  const id=await notify();await sender.dispatchPush(20,async()=>{throw Object.assign(Error('Gone'),{statusCode:410})});
  assert.equal((await db.query('select status from push_deliveries where notification_id=$1',[id])).rows[0].status,'gone');
  assert.equal((await (await route.GET()).json()).registered,false,'Expired endpoint disabled after actual 410');
  assert.equal((await route.DELETE(request('DELETE',null,'https://example.invalid/api/notifications/push'))).status,200);
 }finally{
  await db.query('delete from push_subscriptions where user_id=$1',[user]);
  await db.query('delete from in_app_notifications where id=any($1::uuid[])',[ids]);
  for(const key of ['WEB_PUSH_PUBLIC_KEY','WEB_PUSH_PRIVATE_KEY','WEB_PUSH_SUBJECT'])if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];
 }
 console.log('Web Push: actual migrated RLS/API, encrypted registration, SSRF denials, private payload, concurrent committed claims, uncertain/crash non-retry and expired endpoint cleanup passed; no external provider contacted.');
}
