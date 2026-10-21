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
  if(prior){if(prior.kind!==kind||prior.body!==input.body)throw new ApiError(409,'key_conflict','Die Aktion wurde bereits anders verwendet.');return {ok:true,confirmation:'already_recorded'};}
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
  return {ok:true,confirmation:'recorded',recipient:link.recipient,number:version.number,version:version.version,linkId:link.id,employeeEmail:emailPreference?.email===true?session.email:null,locale:asLocale(link.locale),url:offerLinkUrl(link),company:version.company};
 });
 if('invalid' in outcome)throw new ApiError(403,'code_invalid','Der Code ist ungültig oder abgelaufen.');
 if(!('recipient' in outcome)||typeof outcome.recipient!=='string')return {ok:true,confirmation:outcome.confirmation};
 const t=(value:string)=>translateMessage(value,outcome.locale);
 const title=t(input.action==='accept'?'Angebot angenommen':input.action==='decline'?'Angebot abgelehnt':'Frage gespeichert');
 const detail=`${outcome.number} · ${t('Version')} ${outcome.version}\n${input.body}`;
 let accepted=false;
 try{accepted=(await sendMail({to:outcome.recipient,senderName:String(outcome.company.legal_name||outcome.company.name||'Binso One').slice(0,160),subject:title+' – '+outcome.number,text:detail+'\n\n'+outcome.url,html:mailLayout(title,'<p>'+escape(detail).replace(/\n/g,'<br>')+'</p>',{label:t('Angebot und Verlauf ansehen'),url:outcome.url},outcome.locale,{name:String(outcome.company.legal_name||outcome.company.name||'Binso One')})})).delivered;}catch{/* Decision is already committed. Never replay it because email is uncertain. */}
 if(outcome.employeeEmail)try{await sendMail({to:outcome.employeeEmail,subject:title+' – '+outcome.number,text:detail,html:mailLayout(title,'<p>'+escape(detail).replace(/\n/g,'<br>')+'</p>')});}catch{/* The in-app notification remains the source of truth. */}
 try{await withPublicOffer(token,async(c,{link})=>{await c.query("insert into offer_public_events(organization_id,link_id,kind,actor,request_key) values($1,$2,$3,'provider',$4) on conflict(link_id,request_key) do nothing",[link.organization_id,link.id,accepted?'provider_accepted':'provider_unconfirmed','confirmation:'+input.requestKey]);});}catch{/* Concurrent revocation must not undo or obscure the completed decision. */}
 return {ok:true,confirmation:outcome.confirmation,notification:accepted?'provider_accepted':'unconfirmed'};
}
