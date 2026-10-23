import 'server-only';
import {createHash,createHmac,randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {withTenant,withTransaction} from './db';
import {ApiError,validEmail} from './http';
import {authorizeReportDelivery,readReportExport} from './report-exports';
import {organizationPlanInTransaction} from './plan-access';
import {idempotentBusiness} from './business-idempotency';
import {encryptSecret,decryptSecret} from './crypto';
import {env} from './env';
import {audit} from './audit';
import {mailConfigured,sendMail,mailLayout} from './email';
import {translateMessage} from '@/lib/locales';

type Link={id:string;organization_id:string;export_id:string;created_by_user_id:string;recipient:string;token_hash:string;token_enc:string;expires_at:string|Date;revoked_at:string|Date|null};
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const unavailable=()=>new ApiError(410,'report_share_unavailable','Dieser Berichtslink ist abgelaufen, widerrufen oder nicht mehr verfügbar.');
const metadata=(link:Link)=>({id:link.id,recipient:link.recipient,expiresAt:new Date(link.expires_at).toISOString(),revokedAt:link.revoked_at?new Date(link.revoked_at).toISOString():null,active:!link.revoked_at&&new Date(link.expires_at).getTime()>Date.now()});
function linkUrl(link:Link,locale:string){
 const url=new URL('/bericht',env.appUrl);
 if(url.username||url.password||url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new ApiError(503,'report_share_configuration','Die Berichtsfreigabe ist noch nicht korrekt konfiguriert.');
 url.searchParams.set('lang',locale);url.hash=decryptSecret(link.token_enc);return url.href;
}

export async function createReportShare(s:SessionUser,id:string,recipient:string,days:number,key:string){
 authorizeReportDelivery(s);id=id.toLowerCase();recipient=recipient.trim().toLowerCase();
 if(!validEmail(recipient)||recipient.length>254||/[<>,;"\r\n]/.test(recipient)||![1,7].includes(days))throw new ApiError(400,'invalid_report_share','Bitte Empfänger und Gültigkeit prüfen.');
 return withTenant(s.organizationId,s.userId,async c=>{
  const report=await readReportExport(c,s,id,await organizationPlanInTransaction(c,s.organizationId));
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':report-share:'+id]);
  const response=await idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'report.share.create',key,body:{id,recipient,days}},async()=>{
   const active=(await c.query<{count:string}>('select count(*) from report_public_links where organization_id=$1 and export_id=$2 and revoked_at is null and expires_at>now()',[s.organizationId,id])).rows[0];if(Number(active.count)>=20)throw new ApiError(409,'report_share_limit','Bitte zuerst nicht mehr benötigte Berichtslinks widerrufen.');
   const token=randomBytes(32).toString('base64url');
   const row=(await c.query<Link>("insert into report_public_links(organization_id,export_id,created_by_user_id,recipient,token_hash,token_enc,expires_at) values($1,$2,$3,$4,$5,$6,least($7::timestamptz,now()+($8||' days')::interval)) returning *",[s.organizationId,id,s.userId,recipient,hash(token),encryptSecret(token),report.expiresAt,String(days)])).rows[0];
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'report.share.created',entityType:'report_export',entityId:id,metadata:{linkId:row.id,days}});return {id:row.id};
  });
  const link=(await c.query<Link>('select * from report_public_links where organization_id=$1 and created_by_user_id=$2 and id=$3',[s.organizationId,s.userId,response.id])).rows[0];
  if(!link||link.revoked_at||new Date(link.expires_at).getTime()<=Date.now())throw unavailable();
  // Plain capabilities never enter audit or the idempotency response ledger.
  return {...metadata(link),url:linkUrl(link,report.locale)};
 });
}
export async function reportShares(s:SessionUser,id:string){
 authorizeReportDelivery(s);return withTenant(s.organizationId,s.userId,async c=>{
  await readReportExport(c,s,id,await organizationPlanInTransaction(c,s.organizationId));
  return (await c.query<Link>('select * from report_public_links where organization_id=$1 and export_id=$2 and created_by_user_id=$3 order by (revoked_at is null and expires_at>now()) desc,created_at desc,id desc limit 40',[s.organizationId,id,s.userId])).rows.map(metadata);
 },{snapshot:true});
}
export async function revokeReportShare(s:SessionUser,id:string,linkId:string){
 authorizeReportDelivery(s);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(linkId))throw unavailable();
 return withTenant(s.organizationId,s.userId,async c=>{
  await readReportExport(c,s,id,await organizationPlanInTransaction(c,s.organizationId));
  const row=(await c.query<Link>('select * from report_public_links where organization_id=$1 and export_id=$2 and id=$3 and created_by_user_id=$4 for update',[s.organizationId,id,linkId,s.userId])).rows[0];if(!row)throw unavailable();
  if(!row.revoked_at){await c.query('update report_public_links set revoked_at=now() where organization_id=$1 and id=$2',[s.organizationId,row.id]);await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'report.share.revoked',entityType:'report_export',entityId:id,metadata:{linkId:row.id}});}
  return {ok:true};
 });
}

/** Same narrow hashed-capability lookup pattern as the existing offer owner.
 * Publisher membership, plan, original scope and PDF hash are rechecked every
 * time. An unverified capability alone can never receive report contents. */
async function withPublicReport<T>(token:string,fn:(c:PoolClient,link:Link,report:Awaited<ReturnType<typeof readReportExport>>)=>Promise<T>){
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw unavailable();
 return withTransaction(async c=>{
  await c.query("select set_config('app.report_token_hash',$1,true)",[hash(token)]);
  const candidate=(await c.query<Link>('select * from report_public_links where token_hash=$1',[hash(token)])).rows[0];if(!candidate)throw unavailable();
  await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[candidate.organization_id,candidate.created_by_user_id]);
  const link=(await c.query<Link>('select * from report_public_links where organization_id=$1 and id=$2 for update',[candidate.organization_id,candidate.id])).rows[0];
  if(!link||link.revoked_at||new Date(link.expires_at).getTime()<=Date.now())throw unavailable();
  const member=(await c.query<{role:SessionUser['role'];module_profile:SessionUser['moduleProfile'];status:string;is_demo:boolean}>("select m.role,m.module_profile,o.status,o.is_demo from organization_memberships m join app_users u on u.id=m.user_id and u.status='active' join organizations o on o.id=m.organization_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and not exists(select 1 from organization_subscriptions sub where sub.organization_id=m.organization_id and sub.status='trial' and sub.trial_until<=now())",[link.organization_id,link.created_by_user_id])).rows[0];
  if(!member||!['active','trial','grace_period'].includes(member.status))throw unavailable();
  const session:SessionUser={sessionId:'',userId:link.created_by_user_id,organizationId:link.organization_id,email:'',name:'',role:member.role,moduleProfile:member.module_profile,mfaEnabled:false,organizationStatus:member.status,isDemo:member.is_demo};
  try{
   authorizeReportDelivery(session);
   const report=await readReportExport(c,session,link.export_id,await organizationPlanInTransaction(c,session.organizationId));
   return await fn(c,link,report);
  }catch(error){if(error instanceof Response&&error.status===403||error instanceof ApiError&&[403,404,409,410].includes(error.status)&&error.code!=='report_code_invalid')throw unavailable();throw error;}
 });
}
function codeHash(linkId:string,code:string){if(!env.appEncryptionKey)throw new Error('APP_ENCRYPTION_KEY is required');return createHmac('sha256',env.appEncryptionKey).update(linkId+'|report.pdf|'+code).digest('hex');}
export async function requestReportCode(token:string){
 const delivery=await withPublicReport(token,async(c,link,report)=>{
  if(!mailConfigured())throw new ApiError(503,'delivery_unavailable','Der Bestätigungscode kann momentan nicht versendet werden.');
  const recent=(await c.query<{count:string}>("select count(*) from report_recipient_codes where organization_id=$1 and link_id=$2 and created_at>now()-interval '15 minutes'",[link.organization_id,link.id])).rows[0];
  if(Number(recent.count)>=5)throw new ApiError(429,'code_rate_limited','Bitte vor einem neuen Code warten.');
  await c.query('update report_recipient_codes set consumed_at=coalesce(consumed_at,now()),request_key=null where organization_id=$1 and link_id=$2',[link.organization_id,link.id]);
  const code=String(randomInt(0,1_000_000)).padStart(6,'0');await c.query('insert into report_recipient_codes(organization_id,link_id,code_hash) values($1,$2,$3)',[link.organization_id,link.id,codeHash(link.id,code)]);
  await audit(c,{organizationId:link.organization_id,action:'report.share.code_requested',entityType:'report_export',entityId:link.export_id,metadata:{linkId:link.id}});
  return {recipient:link.recipient,code,locale:report.locale};
 });
 const title=translateMessage('Bestätigungscode',delivery.locale),text=translateMessage('Dein Bestätigungscode',delivery.locale)+': '+delivery.code;
 let accepted=false;try{accepted=(await sendMail({to:delivery.recipient,subject:title,text,html:mailLayout(title,'<p>'+text+'</p>',undefined,delivery.locale)})).delivered;}catch{/* A timeout cannot be declared delivered or automatically retried. */}
 if(!accepted)throw new ApiError(503,'delivery_uncertain','Der Codeversand konnte nicht bestätigt werden. Bitte den Posteingang prüfen.');
 return {providerAccepted:true,deliveryConfirmed:false};
}
export async function verifiedReportPdf(token:string,code:string,key:string){
 if(key.length<8||key.length>128||!/^\d{6}$/.test(code))throw new ApiError(400,'invalid_report_code','Bitte den sechsstelligen Code eingeben.');
 const outcome=await withPublicReport(token,async(c,link,report)=>{
  const challenge=(await c.query<{id:string;code_hash:string;attempts:number;consumed_at:Date|null;request_key:string|null}>("select id,code_hash,attempts,consumed_at,request_key from report_recipient_codes where organization_id=$1 and link_id=$2 and expires_at>now() order by created_at desc,id desc limit 1 for update",[link.organization_id,link.id])).rows[0];
  if(!challenge||challenge.attempts>=5||challenge.consumed_at&&challenge.request_key!==key)return {invalid:true} as const;
  const correct=timingSafeEqual(Buffer.from(challenge.code_hash,'hex'),Buffer.from(codeHash(link.id,code),'hex'));
  if(!correct){await c.query('update report_recipient_codes set attempts=attempts+1 where organization_id=$1 and id=$2',[link.organization_id,challenge.id]);return {invalid:true} as const;}
  if(!challenge.consumed_at){await c.query('update report_recipient_codes set consumed_at=now(),request_key=$3 where organization_id=$1 and id=$2',[link.organization_id,challenge.id,key]);await audit(c,{organizationId:link.organization_id,action:'report.share.pdf_requested',entityType:'report_export',entityId:link.export_id,metadata:{linkId:link.id,recipientVerified:true}});}
  return {report};
 });
 // Wrong-attempt counters commit before returning the failure to the caller.
 if('invalid' in outcome)throw new ApiError(403,'report_code_invalid','Der Code ist ungültig oder abgelaufen.');return outcome.report;
}
