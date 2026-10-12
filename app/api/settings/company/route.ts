import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

type CompanyBody=Record<string,unknown>;
const fields=`id,is_demo,name,legal_name,legal_form,uid,vat_number,street,building_number,postal_code,city,country_code,email,phone,website,logo_url,vat_rate,payment_terms_days,iban,qr_iban,invoice_intro_text,invoice_footer_text,quote_intro_text,quote_footer_text,mail_sender_name,mail_reply_to,mail_signature`;

export async function GET(){
 try{
  const s=await requireSession();authorize(s,"organization:read");
  const item=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select ${fields} from organizations where id=$1`,[s.organizationId])).rows[0]);
  return json({item});
 }catch(error){return apiError(error);}
}

export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"organization:write");
  const b=await readJson<CompanyBody>(request,32768);
  const textFields:Record<string,[string,number]>={name:['name',160],legalName:['legal_name',160],legalForm:['legal_form',80],uid:['uid',40],vatNumber:['vat_number',40],street:['street',160],buildingNumber:['building_number',30],postalCode:['postal_code',20],city:['city',120],countryCode:['country_code',2],email:['email',320],phone:['phone',80],website:['website',240],logoUrl:['logo_url',1000]};
  const data:Record<string,unknown>={};
  for(const [key,[column,max]] of Object.entries(textFields))if(b[key]!==undefined){const value=cleanText(b[key],max);if(key==='name'&&!value)return json({error:'name_required',message:'Firmenname ist erforderlich.'},400);if(key==='email'&&value&&!validEmail(value))return json({error:'email_invalid',message:'Ungültige Firmen-E-Mail.'},400);data[column]=key==='countryCode'?(value||'CH').toUpperCase():value||null;}
  const keys=Object.keys(data);if(!keys.length)return json({error:'empty_update',message:'Keine Änderungen angegeben.'},400);
  const item=await withTenant(s.organizationId,s.userId,async c=>{
   if(data.logo_url){
    const match=String(data.logo_url).match(/^\/api\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/download$/i);
    if(!match)throw new ApiError(400,'logo_reference_invalid','Bitte ein geprüftes Firmenlogo hochladen.');
    const logo=(await c.query("select scan_status from file_objects where id=$1 and organization_id=$2 and purpose='company_logo' and content_type in ('image/png','image/jpeg','image/webp')",[match[1],s.organizationId])).rows[0];
    if(!logo)throw new ApiError(404,'logo_not_found','Firmenlogo wurde nicht gefunden.');
    if(logo.scan_status!=='clean')throw new ApiError(423,'logo_not_ready','Das Firmenlogo ist noch nicht für die Verwendung freigegeben.');
   }
   const item=(await c.query(`update organizations set ${keys.map((key,i)=>key+'=$'+(i+1)).join(',')},updated_at=now() where id=$${keys.length+1} returning ${fields}`,[...Object.values(data),s.organizationId])).rows[0];
   if(b.completeOnboarding===true&&item){
    await c.query("insert into organization_milestones(organization_id,milestone,source) values($1,'onboarding_completed','company_setup') on conflict do nothing",[s.organizationId]);
   }
   return item;
  });
  return json({item});
 }catch(error){return apiError(error);}
}
