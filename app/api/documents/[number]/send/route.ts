import {NextRequest} from "next/server";
import {asLocale,translateMessage} from "@/lib/locales";
import {domainConfig} from "@/config/domain";
import {financialStatus,openAmount,formatCurrency,formatDate} from "@/lib/financial-status";
import {planPaymentReminder} from "@/lib/payment-reminder";
import {randomUUID} from "node:crypto";
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson,validEmail} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {lockDocument,changeDocumentStatus} from "@/lib/server/document-process";
import {listApiBusiness} from "@/lib/server/repositories/business-api";
import {documentLogo} from "@/lib/server/document-logo";
import {documentPdf} from "@/lib/server/document-pdf";
import {sendMail,mailLayout} from "@/lib/server/email";
import {audit} from "@/lib/server/audit";
import {sealOfferVersion} from '@/lib/server/offer-versions';
import {createOfferLink,type OfferVersion} from '@/lib/server/public-offers';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();if(s.isDemo)throw new ApiError(403,'demo_send_disabled','Die Demo versendet keine E-Mails.');
 const {number}=await params;const b=await readJson<{recipient?:unknown;requestKey?:unknown;purpose?:unknown;subject?:unknown;message?:unknown;issueConfirmed?:unknown}>(request,8192);
 const purpose=b.purpose===undefined||b.purpose==='document'?'document':b.purpose==='reminder'?'reminder':null;
 if(!purpose)throw new ApiError(400,'send_invalid','Ungültiger Versandzweck.');
 const recipient=cleanText(b.recipient,320).toLowerCase(),key=cleanText(b.requestKey,80);
 const subject=b.subject===undefined?null:cleanText(b.subject,180),message=b.message===undefined?null:cleanText(b.message,4000);
 if(subject!==null&&(!subject||/[\r\n]/.test(subject)))throw new ApiError(400,'subject_invalid','Bitte einen gültigen Betreff eingeben.');
 if(!validEmail(recipient)||!key)throw new ApiError(400,'send_invalid','Empfänger und Versandkennung sind erforderlich.');
 const delivery=await withTenant(s.organizationId,s.userId,async c=>{
  const {row,kind}=await lockDocument(c,s,number);
  const prior=(await c.query('select * from document_deliveries where organization_id=$1 and request_key=$2',[s.organizationId,key])).rows[0];
  if(prior){if(prior.recipient!==recipient||prior.document_id!==row.id||prior.purpose!==purpose||prior.subject!==subject||prior.message!==message)throw new ApiError(409,'key_conflict','Die Versandkennung wurde bereits verwendet.');if(prior.status==='sent')return {sent:true};throw new ApiError(409,'delivery_unconfirmed','Dieser Versand ist noch nicht bestätigt. Prüfe den Versandstatus, bevor du erneut sendest.');}
  if(row.status==='draft'){
   if(kind!=='offer'||purpose!=='document'||b.issueConfirmed!==true)throw new ApiError(409,'draft_not_issued','Bitte das Dokument zuerst prüfen und ausstellen. Entwürfe werden nicht versendet.');
   await changeDocumentStatus(c,s,number,'issue','Explicitly confirmed for email dispatch');row.status='sent';
  }
  if(['cancelled','declined','expired','revised'].includes(row.status))throw new ApiError(409,'document_locked','Dieses Dokument kann nicht versendet werden.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,row.id])).rowCount)throw new ApiError(409,'delivery_pending','Ein Versand dieses Dokuments ist noch nicht bestätigt.');
  const document=(await listApiBusiness(c,s,'documents','id=eq.'+row.id+'&kind=eq.'+kind))[0];
  let reminder:{stage:number;amount:number;deadline:string}|undefined;
  if(purpose==='reminder'){
   const history=(await c.query("select reminder_stage stage,status,payment_deadline::text deadline,(completed_at at time zone 'Europe/Zurich')::date::text completed_at from document_deliveries where organization_id=$1 and document_id=$2 and purpose='reminder'",[s.organizationId,row.id])).rows;
   const plan=planPaymentReminder(document,history);
   if('error' in plan)throw new ApiError(409,plan.error,plan.error==='reminder_not_due'?'Nur überfällige offene Rechnungen können gemahnt werden.':plan.error==='reminder_too_soon'?'Die letzte Zahlungsfrist ist noch nicht abgelaufen.':plan.error==='reminder_history_invalid'?'Die Mahnhistorie muss vor dem Versand geprüft werden.':'Die vorgesehenen Mahnstufen sind abgeschlossen.');
   reminder=plan;
  }
  const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
  const version=kind==='offer'?await sealOfferVersion(c,s,row) as OfferVersion:null;
  const publicLink=version?await createOfferLink(c,s,version,recipient):null;
  const issued=kind==='invoice'&&!reminder?(await c.query('select pdf from invoice_versions where organization_id=$1 and invoice_id=$2',[s.organizationId,row.id])).rows[0]:null;
  const pdf=version?Buffer.from(version.pdf):issued?Buffer.from(issued.pdf):await documentPdf(document,company,await documentLogo(c,s.organizationId,document,company));const id=randomUUID();
  await c.query("insert into document_deliveries(id,organization_id,kind,document_id,recipient,status,request_key,created_by_user_id,purpose,reminder_stage,balance_amount,payment_deadline) values($1,$2,$3,$4,$5,'sending',$6,$7,$8,$9,$10,$11)",[id,s.organizationId,kind,row.id,recipient,key,s.userId,purpose,reminder?.stage??null,reminder?.amount??null,reminder?.deadline??null]);
  await c.query('update document_deliveries set subject=$3,message=$4,offer_version_id=$5,public_link_id=$6 where organization_id=$1 and id=$2',[s.organizationId,id,subject,message,version?.id??null,publicLink?.link.id??null]);
  const verifiedReplyTo=(await c.query("select u.email from app_users u join organization_memberships m on m.user_id=u.id where m.organization_id=$1 and m.status='active' and u.status='active' and u.email_verified_at is not null and lower(u.email)=lower($2) limit 1",[s.organizationId,company.mail_reply_to||s.email])).rows[0]?.email;
  return {sent:false,id,kind,document,pdf,company,reminder,publicLink,verifiedReplyTo};
 });
 if(delivery.sent)return json({ok:true});
 const locale=asLocale((delivery.document!.customer as {language?:unknown})?.language),t=(value:string)=>translateMessage(value,locale);
 const label=t(delivery.reminder?domainConfig.reminderStages[delivery.reminder.stage-1]:delivery.kind==='invoice'?'Rechnung':'Angebot');
 const detail=delivery.reminder?t('Offener Betrag')+': '+formatCurrency(delivery.reminder.amount,String(delivery.document!.currency))+'. '+t('Zahlungsfrist')+': '+formatDate(delivery.reminder.deadline)+'. '+t('Bereits verbuchte Zahlungen und Gutschriften sind berücksichtigt.'):t('Das ausgestellte Dokument wird als PDF versendet.');

 try{
  if(delivery.reminder)await withTenant(s.organizationId,s.userId,async c=>{
   const {row}=await lockDocument(c,s,number);
   const current=(await listApiBusiness(c,s,'documents','id=eq.'+row.id+'&kind=eq.invoice'))[0];
   if(financialStatus(current)!=='overdue'||openAmount(current)!==delivery.reminder!.amount)throw new ApiError(409,'reminder_changed','Der Zahlungsstand hat sich geändert. Bitte die Rechnung aktualisieren.');
  });
  const mailSubject=purpose==='document'&&subject?subject:label+' '+number;
  const mailBody=purpose==='document'&&message!==null?message:detail;
  const result=await sendMail({to:recipient,senderName:String(delivery.company!.mail_sender_name||delivery.company!.legal_name||delivery.company!.name).slice(0,160),replyTo:delivery.verifiedReplyTo,subject:mailSubject,text:`${mailSubject} · ${delivery.company!.legal_name||delivery.company!.name}.\n${mailBody}${delivery.publicLink?'\n'+t('Angebot ansehen und beantworten')+': '+delivery.publicLink.url:''}`,html:mailLayout(mailSubject,'<p>'+escape(mailBody).replace(/\n/g,'<br>')+'</p>',delivery.publicLink?{label:t('Angebot ansehen'),url:delivery.publicLink.url}:undefined,locale,{name:String(delivery.company!.legal_name||delivery.company!.name)}),attachments:[{name:number.replace(/[^\w.-]/g,'_')+'.pdf',contentType:'application/pdf',content:delivery.pdf!}]});
  if(!result.delivered)throw new Error('E-Mail-Versand ist nicht konfiguriert.');
 }catch(error){
  await withTenant(s.organizationId,s.userId,c=>c.query("update document_deliveries set status='failed',completed_at=now() where organization_id=$1 and id=$2",[s.organizationId,delivery.id]));
  if(error instanceof ApiError)throw error;
  throw new ApiError(502,'delivery_unconfirmed','Der Versand konnte nicht bestätigt werden. Prüfe den Postausgang vor einem erneuten Versand.');
 }
 await withTenant(s.organizationId,s.userId,async c=>{
  await c.query("update document_deliveries set status='sent',completed_at=now() where organization_id=$1 and id=$2",[s.organizationId,delivery.id]);
  const table=delivery.kind==='invoice'?'invoices':'quotes';
  await c.query(`update ${table} set status=case when status='draft' then 'sent' else status end,updated_at=now() where organization_id=$1 and id=$2`,[s.organizationId,delivery.document!.id]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:purpose==='reminder'?'invoice.reminder.sent':'document.sent',entityType:table,entityId:String(delivery.document!.id),metadata:{recipient,deliveryId:delivery.id,purpose,reminder:delivery.reminder??null}});
 });
 return json({ok:true});
}catch(e){return apiError(e)}}
