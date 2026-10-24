import 'server-only';
import {log} from './logger';
import webpush from 'web-push';
import {withTenant,withPlatform} from './db';
import {decryptSecret} from './crypto';
import {notificationCanOpen,pendingPushNotifications} from './repositories/notifications';
import {validPushSubscription,pushPreference,type DevicePushSubscription} from '@/lib/push-subscription';
import {translateMessage,asLocale} from '@/lib/locales';
import type {SessionUser} from './session';
import {pushConfiguration} from './push-config';
export {pushConfiguration} from './push-config';

type Device={id:string;organization_id:string;user_id:string};
type Claim={subscription:DevicePushSubscription;notificationId:string;locale:string};

/** Commit a durable claim before network I/O, so another process cannot repeat the send. */
async function claimNext(device:Device):Promise<Claim|null>{
 return withTenant(device.organization_id,device.user_id,async c=>{
  const locked=await c.query('select id from push_subscriptions where id=$1 and disabled_at is null for update skip locked',[device.id]);
  if(!locked.rows.length)return null;
  // Advance ineligible devices too: they must not starve valid devices on the next scan.
  await c.query('update push_subscriptions set last_checked_at=now() where id=$1',[device.id]);
  const sub=(await c.query(`select p.*,m.role,m.module_profile
   from push_subscriptions p
   join auth_sessions a on a.id=p.session_id and a.user_id=p.user_id and a.organization_id=p.organization_id and a.expires_at>now()
   join app_users u on u.id=p.user_id and u.status='active'
   join organization_memberships m on m.organization_id=p.organization_id and m.user_id=p.user_id and m.status='active'
   join organizations o on o.id=p.organization_id and o.status in ('active','trial','grace_period','read_only') and o.is_demo=false
   where p.id=$1 and p.disabled_at is null
   and (o.employee_mfa_required=false or u.mfa_enabled=true)
   and (select count(*) from organization_memberships all_m where all_m.user_id=p.user_id and all_m.status='active')=1`,[device.id])).rows[0];
  if(!sub)return null;
  if(sub.application_server_key!==pushConfiguration().publicKey){
   await c.query('update push_subscriptions set disabled_at=now() where id=$1',[sub.id]);return null;
  }
  let subscription:unknown;
  try{subscription=JSON.parse(decryptSecret(sub.subscription_enc));}catch{
   await c.query('update push_subscriptions set disabled_at=now() where id=$1',[sub.id]);return null;
  }
  if(!validPushSubscription(subscription)){
   await c.query('update push_subscriptions set disabled_at=now() where id=$1',[sub.id]);return null;
  }
  const actor={organizationId:device.organization_id,userId:device.user_id,role:sub.role,moduleProfile:sub.module_profile} as SessionUser;
  const rows=await pendingPushNotifications(c,actor,sub.id,sub.created_at);
  const preferences=(await c.query('select kind,push from notification_preferences where organization_id=$1 and user_id=$2',[device.organization_id,device.user_id])).rows;
  const skipped:string[]=[];
  let next:typeof rows[number]|undefined;
  for(const item of rows){
   if(notificationCanOpen(actor,item)&&preferences.some(p=>p.kind===pushPreference(item.kind,item.href)&&p.push===true)){next=item;break;}
   skipped.push(item.id);
  }
  if(skipped.length)await c.query(`insert into push_deliveries(organization_id,user_id,subscription_id,notification_id,status,completed_at)
   select $1,$2,$3,id,'skipped',now() from unnest($4::uuid[]) as source(id) on conflict do nothing`,[device.organization_id,device.user_id,sub.id,skipped]);
  if(!next)return null;
  const claim=await c.query(`insert into push_deliveries(organization_id,user_id,subscription_id,notification_id,status)
   values($1,$2,$3,$4,'processing') on conflict do nothing returning notification_id`,[device.organization_id,device.user_id,sub.id,next.id]);
  return claim.rowCount?{subscription,notificationId:next.id,locale:sub.locale}:null;
 });
}

/** Provider acceptance is not a device receipt. Uncertain claims are never auto-retried. */
export async function dispatchPush(limit=20,send:typeof webpush.sendNotification=webpush.sendNotification){
 const config=pushConfiguration();
 const result={enabled:config.enabled,attempted:0,accepted:0,failed:0,uncertain:0,gone:0,errors:0};
 if(!config.enabled)return result;
 const size=Number.isFinite(limit)?Math.min(100,Math.max(1,Math.trunc(limit))):20;
 const devices=await withPlatform(async c=>{
  await c.query(`update push_deliveries set status='uncertain',completed_at=now(),error_code='worker_interrupted'
   where status='processing' and attempted_at<now()-interval '5 minutes'`);
  return (await c.query<Device>(`select p.id,p.organization_id,p.user_id from push_subscriptions p
   where p.disabled_at is null
   order by p.last_checked_at,p.id limit $1`,[size])).rows;
 });
 // Five provider attempts per run bound latency; idle devices still advance their scan position.
 for(const device of devices){
  if(result.attempted>=5)break;
  try{
   const claim=await claimNext(device);if(!claim)continue;
   result.attempted++;
   const active=await withTenant(device.organization_id,device.user_id,async c=>(await c.query(`select p.id from push_subscriptions p
    join auth_sessions a on a.id=p.session_id and a.expires_at>now()
    where p.id=$1 and p.disabled_at is null`,[device.id])).rows.length);
   if(!active){
    await withTenant(device.organization_id,device.user_id,c=>c.query(`update push_deliveries set status='skipped',completed_at=now(),error_code='device_revoked' where subscription_id=$1 and notification_id=$2`,[device.id,claim.notificationId]));continue;
   }
   let status:'accepted'|'failed'|'uncertain'|'gone'='accepted',providerStatus:number|null=null,errorCode:string|null=null;
   try{
    const response=await send(claim.subscription,JSON.stringify({title:'Binso One',body:translateMessage('Neue Benachrichtigung',asLocale(claim.locale)),tag:claim.notificationId,url:'/benachrichtigungen'}),{
     vapidDetails:{publicKey:config.publicKey!,privateKey:config.privateKey!,subject:config.subject!},TTL:300,timeout:8000,topic:claim.notificationId.replaceAll('-','')
    });
    providerStatus=response.statusCode;
    if(providerStatus<200||providerStatus>=300){status=providerStatus===404||providerStatus===410?'gone':providerStatus>=400&&providerStatus<500?'failed':'uncertain';errorCode='provider_response';}
   }catch(error){
    const code=Number((error as {statusCode?:number})?.statusCode);
    providerStatus=Number.isInteger(code)&&code>=100&&code<=599?code:null;
    status=code===404||code===410?'gone':code>=400&&code<500?'failed':'uncertain';
    errorCode=providerStatus?'provider_rejected':'network_uncertain';
   }
   await withTenant(device.organization_id,device.user_id,async c=>{
    await c.query(`update push_deliveries set status=$3,completed_at=now(),provider_status=$4,error_code=$5
     where subscription_id=$1 and notification_id=$2 and status='processing'`,[device.id,claim.notificationId,status,providerStatus,errorCode]);
    if(status==='gone')await c.query('update push_subscriptions set disabled_at=now() where id=$1',[device.id]);
   });
   result[status]++;
  }catch(error){
   const sqlState=(error as {code?:unknown})?.code;
   log('warn','web_push_dispatch_failed',{code:typeof sqlState==='string'&&/^[0-9A-Z]{5}$/.test(sqlState)?sqlState:'internal_error'});
   // Retain a committed claim for recovery as uncertain, without leaking payloads or endpoints.
   result.errors++;
  }
 }
 return result;
}
