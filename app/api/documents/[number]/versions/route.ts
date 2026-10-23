import {asLocale,translateMessage} from '@/lib/locales';
import {NextRequest} from 'next/server';
import {apiError,ApiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {authorize} from '@/lib/server/rbac';
import {asObject,enumField,stringField} from '@/lib/server/validation';
import {offerLinkUrl,resumeOfferResponseMail} from '@/lib/server/public-offers';
import {mailLayout} from '@/lib/server/email';
import {audit} from '@/lib/server/audit';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function GET(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 const s=await requireSession();authorize(s,'sales:read');const {number}=await params;
 return await withTenant(s.organizationId,s.userId,async c=>{
  const quote=(await c.query('select id from quotes where organization_id=$1 and quote_no=$2 and archived_at is null',[s.organizationId,number])).rows[0];
  if(!quote)throw new ApiError(404,'not_found','Angebot nicht gefunden.');
  const version=request.nextUrl.searchParams.get('version');
  if(version){
   if(!/^[1-9]\d{0,5}$/.test(version))throw new ApiError(400,'version_invalid','Ungültige Version.');
   const archived=(await c.query('select pdf from offer_versions where organization_id=$1 and quote_id=$2 and version=$3',[s.organizationId,quote.id,Number(version)])).rows[0];
   if(!archived)throw new ApiError(404,'not_found','Version nicht gefunden.');
   return new Response(new Uint8Array(archived.pdf),{headers:{'content-type':'application/pdf','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }
  const versions=(await c.query('select version,number,created_at,pdf_sha256 from offer_versions where organization_id=$1 and quote_id=$2 order by version desc',[s.organizationId,quote.id])).rows;
  const events=(await c.query(`select e.id,e.link_id,e.kind,e.body,e.actor,e.created_at,v.version,l.recipient,l.revoked_at
   from offer_public_events e join offer_public_links l on l.id=e.link_id and l.organization_id=e.organization_id
   join offer_versions v on v.id=l.version_id and v.organization_id=l.organization_id
   where e.organization_id=$1 and v.quote_id=$2 order by e.created_at desc,e.id limit 100`,[s.organizationId,quote.id])).rows;
  const deliveries=(await c.query('select d.id,d.recipient,d.status,d.created_at,d.completed_at,v.version from document_deliveries d left join offer_versions v on v.id=d.offer_version_id and v.organization_id=d.organization_id where d.organization_id=$1 and d.document_id=$2 order by d.created_at desc limit 50',[s.organizationId,quote.id])).rows;
  return json({versions,events,deliveries,deliveryNote:'Vom Anbieter angenommen bedeutet nicht zugestellt. Seitenaufrufe sind unbestätigte Clientmeldungen.'});
 });
}catch(error){return apiError(error);}}

export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);await enforceRateLimit(request,'offer-reply',20,15*60_000);
 const s=await requireSession();authorize(s,'sales:write');const {number}=await params,body=asObject(await readJson(request,8192));
 const action=enumField(body,'action',['reply','revoke'] as const),linkId=stringField(body,'linkId',{min:36,max:36}),key=stringField(body,'requestKey',{min:16,max:80});
 const text=action==='reply'?stringField(body,'message',{min:1,max:4000}):'';
 const mail=await withTenant(s.organizationId,s.userId,async c=>{
  const quote=(await c.query('select id,offer_version from quotes where organization_id=$1 and quote_no=$2 and archived_at is null for update',[s.organizationId,number])).rows[0];
  if(!quote)throw new ApiError(404,'not_found','Angebot nicht gefunden.');
  const link=(await c.query('select l.*,v.company as issuer_company from offer_public_links l join offer_versions v on v.id=l.version_id and v.organization_id=l.organization_id where l.organization_id=$1 and l.id::text=$2 and v.quote_id=$3 and v.version=$4 for update of l',[s.organizationId,linkId,quote.id,quote.offer_version])).rows[0];
  if(!link)throw new ApiError(404,'not_found','Aktueller Angebotsdialog nicht gefunden.');
  if(action==='revoke'){
   await c.query('update offer_public_links set revoked_at=coalesce(revoked_at,now()) where organization_id=$1 and id=$2',[s.organizationId,link.id]);
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.link.revoked',entityType:'quote',entityId:quote.id,metadata:{linkId:link.id}});
   return null;
  }
  if(link.revoked_at||new Date(link.expires_at).getTime()<=Date.now())throw new ApiError(409,'link_inactive','Dieser Angebotsdialog ist nicht mehr aktiv.');
  const prior=(await c.query('select kind,body,created_by_user_id from offer_public_events where organization_id=$1 and link_id=$2 and request_key=$3',[s.organizationId,link.id,key])).rows[0];
  if(prior){if(prior.kind!=='reply'||prior.body!==text||prior.created_by_user_id!==s.userId)throw new ApiError(409,'key_conflict','Diese Versandkennung wurde anders verwendet.');return {token:new URL(offerLinkUrl(link)).hash.slice(1)};}
  await c.query("insert into offer_public_events(organization_id,link_id,kind,body,actor,created_by_user_id,request_key) values($1,$2,'reply',$3,'employee',$4,$5)",[s.organizationId,link.id,text,s.userId,key]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.reply.recorded',entityType:'quote',entityId:quote.id,metadata:{linkId:link.id}});
  const locale=asLocale(link.locale),t=(value:string)=>translateMessage(value,locale),url=offerLinkUrl(link),title=t('Antwort zu Angebot')+' '+number,company=link.issuer_company??{};
  const html=mailLayout(title,'<p>'+text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!)).replace(/\n/g,'<br>')+'</p>',{label:t('Angebot und Verlauf ansehen'),url},locale,{name:String(company.legal_name||company.name||'Binso One')});
  await c.query("insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by) values($1,$2,'offer_confirmation',$3,$4,$5,$6,$7,$8) on conflict(organization_id,deduplication_key) do nothing",[s.organizationId,'offer-reply:'+link.id+':'+key+':offer_confirmation',link.id+':'+key,link.recipient,title,text+'\n\n'+url,html,s.userId]);
  return {token:new URL(url).hash.slice(1)};
 });
 if(!mail)return json({ok:true,notification:'not_repeated'});
 const notification=await resumeOfferResponseMail(mail.token,key,{createdBy:s.userId}).catch(()=> 'unconfirmed');
 return json({ok:true,notification});
}catch(error){return apiError(error);}}
