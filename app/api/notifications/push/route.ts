import {createHash,ECDH} from 'node:crypto';
import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {encryptSecret} from '@/lib/server/crypto';
import {pushConfiguration} from '@/lib/server/push-config';
import {validPushSubscription} from '@/lib/push-subscription';
import {asLocale} from '@/lib/locales';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function GET(){
 try{
  const s=await requireSession(),config=pushConfiguration();
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select
   exists(select 1 from push_subscriptions where organization_id=$1 and user_id=$2 and session_id=$3 and disabled_at is null and application_server_key=$4) registered,
   exists(select 1 from push_subscriptions where organization_id=$1 and user_id=$2 and session_id=$3) stored`,[s.organizationId,s.userId,s.sessionId,config.publicKey])).rows[0]);
  return json({enabled:config.enabled,publicKey:config.publicKey,registered:item.registered,stored:item.stored});
 }catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);await enforceRateLimit(request,'push-device',20,60000);
  const s=await requireSession(),config=pushConfiguration();
  if(!config.enabled)throw new ApiError(409,'push_unavailable','Push-Zustellung ist noch nicht verfügbar.');
  const body=await readJson<{subscription:unknown;locale?:unknown}>(request,8192);
  if(!validPushSubscription(body?.subscription))throw new ApiError(400,'invalid_push_subscription','Ungültige Push-Anmeldung.');
  const subscription={endpoint:body.subscription.endpoint,keys:{p256dh:body.subscription.keys.p256dh,auth:body.subscription.keys.auth}};
  try{
   ECDH.convertKey(Buffer.from(subscription.keys.p256dh,'base64url'),'prime256v1');
   if(Buffer.from(subscription.keys.auth,'base64url').length!==16)throw Error('invalid');
  }catch{throw new ApiError(400,'invalid_push_subscription','Ungültige Push-Anmeldung.');}
  await withTenant(s.organizationId,s.userId,async c=>{
   const result=await c.query(`insert into push_subscriptions(organization_id,user_id,session_id,endpoint_hash,subscription_enc,locale,application_server_key)
    values($1,$2,$3,$4,$5,$6,$7) on conflict(endpoint_hash) where organization_id is not null do update
    set created_at=case when push_subscriptions.session_id is distinct from excluded.session_id
      or push_subscriptions.disabled_at is not null or push_subscriptions.application_server_key is distinct from excluded.application_server_key
      then now() else push_subscriptions.created_at end,
    session_id=excluded.session_id,subscription_enc=excluded.subscription_enc,locale=excluded.locale,
    application_server_key=excluded.application_server_key,disabled_at=null,updated_at=now()
    where push_subscriptions.organization_id=$1 and push_subscriptions.user_id=$2 returning id`,[
     s.organizationId,s.userId,s.sessionId,hash(subscription.endpoint),encryptSecret(JSON.stringify(subscription)),asLocale(body.locale),config.publicKey
    ]);
   if(!result.rowCount)throw new ApiError(409,'push_device_conflict','Dieses Gerät ist bereits einem anderen Konto zugeordnet.');
  });
  return json({ok:true});
 }catch(e){return apiError(e)}
}
export async function DELETE(request:NextRequest){
 try{
  assertSameOrigin(request);await enforceRateLimit(request,'push-device-remove',20,60000);
  const s=await requireSession();
  await withTenant(s.organizationId,s.userId,c=>c.query('delete from push_subscriptions where organization_id=$1 and user_id=$2 and session_id=$3',[s.organizationId,s.userId,s.sessionId]));
  return json({ok:true});
 }catch(e){return apiError(e)}
}
