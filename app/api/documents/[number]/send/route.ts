import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson,validEmail} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {lockDocument} from "@/lib/server/document-process";
import {listApiBusiness} from "@/lib/server/repositories/business-api";
import {documentPdf} from "@/lib/server/document-pdf";
import {sendMail,mailLayout} from "@/lib/server/email";
import {audit} from "@/lib/server/audit";
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();if(s.isDemo)throw new ApiError(403,'demo_send_disabled','Die Demo versendet keine E-Mails.');
 const {number}=await params;const b=await readJson<{recipient?:unknown;requestKey?:unknown}>(request,4096);
 const recipient=cleanText(b.recipient,320).toLowerCase(),key=cleanText(b.requestKey,80);
 if(!validEmail(recipient)||!key)throw new ApiError(400,'send_invalid','Empfänger und Versandkennung sind erforderlich.');
 const delivery=await withTenant(s.organizationId,s.userId,async c=>{
  const {row,kind}=await lockDocument(c,s,number);
  const prior=(await c.query('select * from document_deliveries where organization_id=$1 and request_key=$2',[s.organizationId,key])).rows[0];
  if(prior){if(prior.recipient!==recipient||prior.document_id!==row.id)throw new ApiError(409,'key_conflict','Die Versandkennung wurde bereits verwendet.');if(prior.status==='sent')return {sent:true};throw new ApiError(409,'delivery_unconfirmed','Dieser Versand ist noch nicht bestätigt. Prüfe den Versandstatus, bevor du erneut sendest.');}
  if(['cancelled','declined','expired'].includes(row.status))throw new ApiError(409,'document_locked','Dieses Dokument kann nicht versendet werden.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,row.id])).rowCount)throw new ApiError(409,'delivery_pending','Ein Versand dieses Dokuments ist noch nicht bestätigt.');
  const document=(await listApiBusiness(c,s,'documents','id=eq.'+row.id+'&kind=eq.'+kind))[0];
  const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
  const pdf=await documentPdf(document,company);const id=randomUUID();
  await c.query("insert into document_deliveries(id,organization_id,kind,document_id,recipient,status,request_key,created_by_user_id) values($1,$2,$3,$4,$5,'sending',$6,$7)",[id,s.organizationId,kind,row.id,recipient,key,s.userId]);
  return {sent:false,id,kind,document,pdf,company};
 });
 if(delivery.sent)return json({ok:true});
 const label=delivery.kind==='invoice'?'Rechnung':'Angebot';
 try{
  const result=await sendMail({to:recipient,subject:label+' '+number,text:`${label} ${number} von ${delivery.company!.legal_name||delivery.company!.name} im Anhang.`,html:mailLayout(escape(label+' '+number),'<p>Im Anhang findest du das Dokument als PDF.</p>'),attachments:[{name:number.replace(/[^\w.-]/g,'_')+'.pdf',contentType:'application/pdf',content:delivery.pdf!}]});
  if(!result.delivered)throw new Error('E-Mail-Versand ist nicht konfiguriert.');
 }catch{
  await withTenant(s.organizationId,s.userId,c=>c.query("update document_deliveries set status='failed',completed_at=now() where organization_id=$1 and id=$2",[s.organizationId,delivery.id]));
  throw new ApiError(502,'delivery_unconfirmed','Der Versand konnte nicht bestätigt werden. Prüfe den Postausgang vor einem erneuten Versand.');
 }
 await withTenant(s.organizationId,s.userId,async c=>{
  await c.query("update document_deliveries set status='sent',completed_at=now() where organization_id=$1 and id=$2",[s.organizationId,delivery.id]);
  const table=delivery.kind==='invoice'?'invoices':'quotes';
  await c.query(`update ${table} set status=case when status='draft' then 'sent' else status end,updated_at=now() where organization_id=$1 and id=$2`,[s.organizationId,delivery.document!.id]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'document.sent',entityType:table,entityId:String(delivery.document!.id),metadata:{recipient,deliveryId:delivery.id}});
 });
 return json({ok:true});
}catch(e){return apiError(e)}}
