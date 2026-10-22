import {verifiedMailReplyTo} from './mail-identity';
import 'server-only';
import {createHash,createHmac,randomBytes,randomInt,timingSafeEqual} from 'node:crypto';
import type {PoolClient} from 'pg';
import {withTransaction} from './db';
import {ApiError} from './http';
import {encryptSecret,decryptSecret} from './crypto';
import {env} from './env';
import {businessDate} from '@/lib/financial-status';
import {asLocale,translateMessage} from '@/lib/locales';
import {authorize} from './rbac';
import {audit} from './audit';
import type {SessionUser} from './session';
import {mailLayout,sendMail} from './email';

export type OfferVersion={id:string;organization_id:string;quote_id:string;version:number;number:string;document:Record<string,unknown>;company:Record<string,unknown>;pdf:Buffer;pdf_sha256:string};
type PublicLink={id:string;organization_id:string;version_id:string;recipient:string;locale:string;created_by_user_id:string;expires_at:Date;revoked_at:Date|null;token_enc:string};
type PublicContext={link:PublicLink;version:OfferVersion;status:string;session:SessionUser};
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
const escape=(text:string)=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const unavailable=()=>new ApiError(410,'offer_unavailable','Dieser Angebotslink ist abgelaufen, ersetzt oder nicht mehr verfügbar.');

export async function createOfferLink(c:PoolClient,s:SessionUser,version:OfferVersion,recipient:string){
 const token=randomBytes(32).toString('base64url');
 const snapshot=version.document.document_snapshot as {locale?:string}|undefined;
 const locale=asLocale(snapshot?.locale);
 const link=(await c.query<PublicLink>(`insert into offer_public_links(organization_id,version_id,token_hash,token_enc,recipient,created_by_user_id,locale,expires_at)
 values($1,$2,$3,$4,$5,$6,$7,now()+interval '90 days') returning *`,[s.organizationId,version.id,hash(token),encryptSecret(token),recipient,s.userId,locale])).rows[0];
 return {link,url:offerLinkUrl(link)};
}
export function offerLinkUrl(link:PublicLink){const url=new URL('/angebot',env.appUrl);url.searchParams.set('lang',asLocale(link.locale));url.hash=decryptSecret(link.token_enc);return url.href;}

/** First identify one hashed capability, then recheck under tenant and quote locks.
 * Public input never supplies organization/user/version IDs or SQL authorization. */
export async function withPublicOffer<T>(token:string,fn:(c:PoolClient,context:PublicContext)=>Promise<T>):Promise<T>{
 if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw unavailable();
 return withTransaction(async c=>{
  await c.query("select set_config('app.offer_token_hash',$1,true)",[hash(token)]);
  const candidate=(await c.query<PublicLink>('select * from offer_public_links where token_hash=$1',[hash(token)])).rows[0];
  if(!candidate)throw unavailable();
  await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[candidate.organization_id,candidate.created_by_user_id]);
  const version=(await c.query<OfferVersion>('select * from offer_versions where organization_id=$1 and id=$2',[candidate.organization_id,candidate.version_id])).rows[0];
  if(!version)throw unavailable();
  const quote=(await c.query<{offer_version:number;status:string;valid_until:Date|string|null}>("select offer_version,status,valid_until::text from quotes where organization_id=$1 and id=$2 and archived_at is null for update",[candidate.organization_id,version.quote_id])).rows[0];
  const link=(await c.query<PublicLink>('select * from offer_public_links where organization_id=$1 and id=$2 for update',[candidate.organization_id,candidate.id])).rows[0];
  if(!link||link.revoked_at||new Date(link.expires_at).getTime()<=Date.now()||!quote||quote.offer_version!==version.version||['draft','expired','revised','cancelled'].includes(quote.status))throw unavailable();
  const until=quote.valid_until instanceof Date?quote.valid_until.toISOString().slice(0,10):quote.valid_until?.slice(0,10);
  if(until&&until<businessDate())throw unavailable();
  const member=(await c.query<{role:SessionUser['role'];module_profile:SessionUser['moduleProfile'];email:string;name:string;organization_status:string}>(`select m.role,m.module_profile,u.email,u.display_name as name,o.status organization_status from organization_memberships m
   join app_users u on u.id=m.user_id and u.status='active' join organizations o on o.id=m.organization_id
   where m.organization_id=$1 and m.user_id=$2 and m.status='active'
   and not exists(select 1 from organization_subscriptions sub where sub.organization_id=m.organization_id and sub.status='trial' and sub.trial_until<=now())`,[link.organization_id,link.created_by_user_id])).rows[0];
  if(!member||!['active','trial','grace_period'].includes(member.organization_status))throw unavailable();
  const session:SessionUser={sessionId:'',userId:link.created_by_user_id,organizationId:link.organization_id,email:member.email,name:member.name,role:member.role,moduleProfile:member.module_profile,mfaEnabled:false,organizationStatus:member.organization_status};
  try{authorize(session,'sales:write');}catch{throw unavailable();}
  return fn(c,{link,version,status:quote.status,session});
 });
}
export async function publicOfferData(token:string){return withPublicOffer(token,async(c,context)=>{
 const {link,version,status}=context;
 const messages=(await c.query('select kind,body,actor,created_at from offer_public_events where organization_id=$1 and link_id=$2 and kind in (\'question\',\'reply\',\'accepted\',\'declined\') order by created_at,id',[link.organization_id,link.id])).rows;
 const document=Object.fromEntries(['issue_date','valid_until','currency','subtotal','vat_amount','total','document_snapshot'].map(key=>[key,version.document[key]]));
 document.items=(Array.isArray(version.document.items)?version.document.items:[]).map(line=>Object.fromEntries(['description','quantity','unit','unit_price','vat_rate','line_total'].map(key=>[key,(line as Record<string,unknown>)[key]])));
 return {version:version.version,number:version.number,document,company:version.company,status,messages,recipientHint:link.recipient.replace(/^(.).+(@.+)$/,'$1…$2')};
});}
const codeHash=(link:string,action:string,code:string)=>{
 if(!env.appEncryptionKey)throw new Error('APP_ENCRYPTION_KEY is required');
 return createHmac('sha256',env.appEncryptionKey).update(`${link}|${action}|${code}`).digest('hex');
};
export async function requestOfferCode(token:string,action:'accept'|'decline'|'question'){
 const delivery=await withPublicOffer(token,async(c,{link,version,status})=>{
  if(action!=='question'&&status!=='sent')throw new ApiError(409,'decision_recorded','Für dieses Angebot wurde bereits entschieden.');
  const recent=(await c.query<{count:string}>('select count(*) from offer_recipient_codes where organization_id=$1 and link_id=$2 and created_at>now()-interval \'15 minutes\'',[link.organization_id,link.id])).rows[0];
  if(Number(recent.count)>=5)throw new ApiError(429,'code_rate_limited','Bitte vor einem neuen Code warten.');
  await c.query('update offer_recipient_codes set consumed_at=now() where organization_id=$1 and link_id=$2 and consumed_at is null',[link.organization_id,link.id]);
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  await c.query("insert into offer_recipient_codes(organization_id,link_id,action,code_hash,expires_at) values($1,$2,$3,$4,now()+interval '10 minutes')",[link.organization_id,link.id,action,codeHash(link.id,action,code)]);
  return {recipient:link.recipient,number:version.number,version:version.version,code,locale:asLocale(link.locale),company:version.company};
 });
 const t=(value:string)=>translateMessage(value,delivery.locale),title=t('Aktion zum Angebot bestätigen');
 const detail=t('Bestätigungscode')+': '+delivery.code+'. '+t('Angebot')+' '+delivery.number+' · '+t('Version')+' '+delivery.version+'. '+t('10 Minuten gültig. Nur für die von dir angeforderte Aktion verwenden.');
 const result=await sendMail({to:delivery.recipient,senderName:String(delivery.company.legal_name||delivery.company.name||'Binso One').slice(0,160),subject:t('Angebot')+' '+delivery.number+' – '+t('Bestätigungscode'),text:detail,html:mailLayout(title,'<p>'+escape(detail)+'</p>',undefined,delivery.locale,{name:String(delivery.company.legal_name||delivery.company.name||'Binso One')})});
 if(!result.delivered)throw new ApiError(503,'mail_unavailable','Der Bestätigungscode konnte nicht versendet werden.');
 return {ok:true};
}
export async function respondToOffer(token:string,input:{action:'accept'|'decline'|'question';code:string;body:string;requestKey:string;confirmed:boolean}){
 const outcome=await withPublicOffer(token,async(c,{link,version,status,session})=>{
  const kind=input.action==='accept'?'accepted':input.action==='decline'?'declined':'question';
  const prior=(await c.query<{kind:string;body:string}>("select kind,body from offer_public_events where organization_id=$1 and link_id=$2 and request_key=$3",[link.organization_id,link.id,input.requestKey])).rows[0];
  if(prior){if(prior.kind!==kind||prior.body!==input.body)throw new ApiError(409,'key_conflict','Die Aktion wurde bereits anders verwendet.');return {ok:true,confirmation:'already_recorded',resume:true};}
  if(!input.confirmed)throw new ApiError(400,'confirmation_required','Bitte die Aktion ausdrücklich bestätigen.');
  if(input.action!=='question'&&status!=='sent')throw new ApiError(409,'decision_recorded','Für dieses Angebot wurde bereits entschieden.');
  const challenge=(await c.query<{id:string;code_hash:string;attempts:number}>("select id,code_hash,attempts from offer_recipient_codes where organization_id=$1 and link_id=$2 and action=$3 and consumed_at is null and expires_at>now() order by created_at desc limit 1 for update",[link.organization_id,link.id,input.action])).rows[0];
  if(!challenge||challenge.attempts>=5)return {invalid:true};
  await c.query('update offer_recipient_codes set attempts=attempts+1 where organization_id=$1 and id=$2',[link.organization_id,challenge.id]);
  if(!/^\d{6}$/.test(input.code)||!timingSafeEqual(Buffer.from(challenge.code_hash,'hex'),Buffer.from(codeHash(link.id,input.action,input.code),'hex')))return {invalid:true};
  await c.query('update offer_recipient_codes set consumed_at=now() where organization_id=$1 and id=$2',[link.organization_id,challenge.id]);
  if(input.action!=='question')await c.query("update quotes set status=$3,decision_at=now(),decision_by_user_id=null,decision_note=$4,updated_at=now() where organization_id=$1 and id=$2 and offer_version=$5 and status='sent'",[link.organization_id,version.quote_id,kind,input.body,version.version]);
  await c.query('insert into offer_public_events(organization_id,link_id,kind,body,actor,request_key) values($1,$2,$3,$4,\'recipient\',$5)',[link.organization_id,link.id,kind,input.body,input.requestKey]);
  await c.query("insert into in_app_notifications(organization_id,user_id,kind,title,body,href) values($1,$2,'system',$3,$4,$5)",[link.organization_id,session.userId,input.action==='question'?'Frage zum Angebot':input.action==='accept'?'Angebot angenommen':'Angebot abgelehnt',version.number+' · Version '+version.version,'/angebote/'+encodeURIComponent(version.number)]);
  await audit(c,{organizationId:link.organization_id,userName:'Verifizierter Angebotsempfänger',action:'offer.public.'+input.action,entityType:'quote',entityId:version.quote_id,metadata:{version:version.version,linkId:link.id,recipientVerified:true}});
  const emailPreference=(await c.query<{email:boolean}>("select email from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[link.organization_id,session.userId])).rows[0];
  const locale=asLocale(link.locale),t=(value:string)=>translateMessage(value,locale),title=t(input.action==='accept'?'Angebot angenommen':input.action==='decline'?'Angebot abgelehnt':'Frage gespeichert');
  const detail=version.number+' · '+t('Version')+' '+version.version+'\n'+input.body,url=offerLinkUrl(link),branding={name:String(version.company.legal_name||version.company.name||'Binso One')};
  const messages=[{kind:'offer_confirmation',recipient:link.recipient,text:detail+'\n\n'+url,html:mailLayout(title,'<p>'+escape(detail).replace(/\n/g,'<br>')+'</p>',{label:t('Angebot und Verlauf ansehen'),url},locale,branding)}];
  if(emailPreference?.email===true)messages.push({kind:'offer_employee',recipient:session.email,text:detail,html:mailLayout(title,'<p>'+escape(detail).replace(/\n/g,'<br>')+'</p>')});
  for(const message of messages)await c.query("insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(organization_id,deduplication_key) do nothing",[link.organization_id,'offer-response:'+link.id+':'+input.requestKey+':'+message.kind,message.kind,link.id+':'+input.requestKey,message.recipient,title+' – '+version.number,message.text,message.html,session.userId]);
  return {ok:true,confirmation:'recorded',resume:true};
 });
 if('invalid' in outcome)throw new ApiError(403,'code_invalid','Der Code ist ungültig oder abgelaufen.');
 const notification=await resumeOfferResponseMail(token,input.requestKey).catch(()=> 'unconfirmed');
 return {ok:true,confirmation:outcome.confirmation,notification};
}
/** Replays resume only definitely unattempted/failed work. Sending/uncertain
 * attempts remain blocked, even after a crash; Graph202 is not inbox delivery. */
export async function resumeOfferResponseMail(token:string,requestKey:string,staffReply?:{createdBy:string}){
 let customerAccepted=false;
 for(const kind of (staffReply?['offer_confirmation']:['offer_confirmation','offer_employee'])){
  const claim=await withPublicOffer(token,async(c,{link,session,version})=>{
   const key=(staffReply?'offer-reply:':'offer-response:')+link.id+':'+requestKey+':'+kind;
   const row=(await c.query<{id:string;status:string;recipient:string;subject:string;body:string;attachment_html:string}>("select id,status,recipient,subject,body,attachment_html from mail_outbox where organization_id=$1 and deduplication_key=$2 and kind=$3 and created_by=$4 for update",[link.organization_id,key,kind,staffReply?.createdBy??session.userId])).rows[0];
   if(!row)return null;
   if(staffReply){const actor=(await c.query<{role:SessionUser['role'];module_profile:SessionUser['moduleProfile']}>("select m.role,m.module_profile from organization_memberships m join app_users u on u.id=m.user_id and u.status='active' where m.organization_id=$1 and m.user_id=$2 and m.status='active'",[link.organization_id,staffReply.createdBy])).rows[0];if(!actor)throw unavailable();authorize({...session,userId:staffReply.createdBy,role:actor.role,moduleProfile:actor.module_profile},'sales:write');}
   if(row.status==='accepted')return {row,send:false,company:version.company};
   if(!['queued','failed'].includes(row.status))return {row,send:false,company:version.company};
   // A retry must respect current notification preferences and the same creator.
   const preference=kind==='offer_employee'?(await c.query<{email:boolean}>("select email from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[link.organization_id,session.userId])).rows[0]:null;
   if(kind==='offer_employee'&&(preference?.email!==true||row.recipient!==session.email)){
    await c.query("update mail_outbox set status='cancelled',last_error='recipient_preference_changed',updated_at=now() where organization_id=$1 and id=$2",[link.organization_id,row.id]);
    await audit(c,{organizationId:link.organization_id,userId:staffReply?.createdBy??session.userId,action:'offer.response.mail.cancelled',entityType:'mail_outbox',entityId:row.id});return null;
   }
   await c.query("update mail_outbox set status='sending',attempts=attempts+1,last_error=null,updated_at=now() where organization_id=$1 and id=$2",[link.organization_id,row.id]);
   await audit(c,{organizationId:link.organization_id,userId:staffReply?.createdBy??session.userId,action:'offer.response.mail.claimed',entityType:'mail_outbox',entityId:row.id});
   return {row,send:true,company:version.company,replyTo:await verifiedMailReplyTo(c,link.organization_id,version.company.mail_reply_to||session.email)};
  });
  if(!claim)continue;
  if(!claim.send){if(kind==='offer_confirmation'&&claim.row.status==='accepted')customerAccepted=true;continue;}
  let status='uncertain';
  try{status=(await sendMail({to:claim.row.recipient,subject:claim.row.subject,text:claim.row.body,html:claim.row.attachment_html,replyTo:claim.replyTo,senderName:String(claim.company.legal_name||claim.company.name||'Binso One').slice(0,160)})).delivered?'accepted':'failed';}catch{/* Never infer a safe retry from an ambiguous provider/network error. */}
  try{await withPublicOffer(token,async(c,{link,session})=>{
   const saved=await c.query("update mail_outbox set status=$3,last_error=$4,updated_at=now() where organization_id=$1 and id=$2 and status='sending' returning id",[link.organization_id,claim.row.id,status,status==='accepted'?null:status==='failed'?'delivery_unavailable':'delivery_uncertain']);
   if(!saved.rowCount)throw new ApiError(409,'delivery_uncertain','Versand konnte nicht bestätigt werden.');
   await audit(c,{organizationId:link.organization_id,userId:staffReply?.createdBy??session.userId,action:'offer.response.mail.result',entityType:'mail_outbox',entityId:claim.row.id,metadata:{status}});
   if(kind==='offer_confirmation')await c.query("insert into offer_public_events(organization_id,link_id,kind,actor,request_key) values($1,$2,$3,'provider',$4) on conflict(link_id,request_key) do nothing",[link.organization_id,link.id,status==='accepted'?'provider_accepted':'provider_unconfirmed',(staffReply?'reply:':'confirmation:')+requestKey+':'+status]);
  });if(kind==='offer_confirmation'&&status==='accepted')customerAccepted=true;}
  catch{/* The decision stays committed. Unrecorded results remain sending, never resendable. */}
 }
 return customerAccepted?'provider_accepted':'unconfirmed';
}
