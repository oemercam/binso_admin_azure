import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

type CompanyBody=Record<string,unknown>;
const fields=`id,name,legal_name,legal_form,uid,vat_number,street,building_number,postal_code,city,country_code,email,phone,website,logo_url,vat_rate,payment_terms_days,iban,qr_iban,invoice_intro_text,invoice_footer_text,quote_intro_text,quote_footer_text,mail_sender_name,mail_reply_to,mail_signature`;

export async function GET(){
 try{
  const s=await requireSession();authorize(s,"settings:read");
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select ${fields} from organizations where id=$1`,[s.organizationId])).rows[0]);
  return json({item});
 }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"settings:write");
  const b=await readJson<CompanyBody>(request,32768);
  const name=cleanText(b.name,160);const vatRate=Number(b.vatRate);const terms=Number(b.paymentTermsDays);
  if(!name)return json({error:"name_required",message:"Firmenname ist erforderlich."},400);
  if(!Number.isFinite(vatRate)||vatRate<0)return json({error:"vat_invalid",message:"Ungültiger MwSt.-Satz."},400);
  if(!Number.isInteger(terms)||terms<0||terms>365)return json({error:"terms_invalid",message:"Ungültiges Zahlungsziel."},400);
  const email=cleanText(b.email,320);const reply=cleanText(b.mailReplyTo,320);
  if(email&&!validEmail(email))return json({error:"email_invalid",message:"Ungültige Firmen-E-Mail."},400);
  if(reply&&!validEmail(reply))return json({error:"reply_to_invalid",message:"Ungültige Reply-to-Adresse."},400);
  const vals=[name,cleanText(b.legalName,160)||null,cleanText(b.legalForm,80)||null,cleanText(b.uid,40)||null,cleanText(b.vatNumber,40)||null,cleanText(b.street,160)||null,cleanText(b.buildingNumber,30)||null,cleanText(b.postalCode,20)||null,cleanText(b.city,120)||null,(cleanText(b.countryCode,2)||"CH").toUpperCase(),email||null,cleanText(b.phone,80)||null,cleanText(b.website,240)||null,cleanText(b.logoUrl,1000)||null,vatRate,terms,cleanText(b.iban,40).replace(/\s/g,"")||null,cleanText(b.qrIban,40).replace(/\s/g,"")||null,cleanText(b.invoiceIntroText,2000)||null,cleanText(b.invoiceFooterText,2000)||null,cleanText(b.quoteIntroText,2000)||null,cleanText(b.quoteFooterText,2000)||null,cleanText(b.mailSenderName,160)||null,reply||null,cleanText(b.mailSignature,2000)||null,s.organizationId];
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`update organizations set name=$1,legal_name=$2,legal_form=$3,uid=$4,vat_number=$5,street=$6,building_number=$7,postal_code=$8,city=$9,country_code=$10,email=$11,phone=$12,website=$13,logo_url=$14,vat_rate=$15,payment_terms_days=$16,iban=$17,qr_iban=$18,invoice_intro_text=$19,invoice_footer_text=$20,quote_intro_text=$21,quote_footer_text=$22,mail_sender_name=$23,mail_reply_to=$24,mail_signature=$25,updated_at=now() where id=$26 returning ${fields}`,vals)).rows[0]);
  return json({item});
 }catch(error){return apiError(error);}
}
