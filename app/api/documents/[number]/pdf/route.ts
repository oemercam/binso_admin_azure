import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {apiError} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {authorize} from "@/lib/server/rbac";
import {listApiBusiness} from "@/lib/server/repositories/business-api";
import {documentLogo} from "@/lib/server/document-logo";
import {documentPdf} from "@/lib/server/document-pdf";
export async function GET(_request:Request,{params}:{params:Promise<{number:string}>}){try{
 const s=await requireSession();const {number}=await params;
 const pdf=await withTenant(s.organizationId,s.userId,async c=>{
  const doc=(await listApiBusiness(c,s,'documents','number=eq.'+encodeURIComponent(number)))[0];
  if(!doc)throw new Response('Not found',{status:404});
  authorize(s,doc.kind==='invoice'?'invoices:read':'sales:read');await requireModuleEntitlement(s.organizationId,doc.kind==='invoice'?'rechnungen':'offerten');
  if(doc.kind==='invoice'&&doc.status!=='draft'){
   const issued=(await c.query('select pdf from invoice_versions where organization_id=$1 and invoice_id=$2',[s.organizationId,doc.id])).rows[0];if(issued)return Buffer.from(issued.pdf);
  }
  if(doc.kind==='offer'&&doc.status!=='draft'){
   const version=(await c.query('select pdf from offer_versions where organization_id=$1 and quote_id=$2 and version=$3',[s.organizationId,doc.id,doc.offer_version])).rows[0];
   if(version)return Buffer.from(version.pdf);
  }
  const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
  return documentPdf(doc,company,await documentLogo(c,s.organizationId,doc,company));
 });
 return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${number.replace(/[^\w.-]/g,'_')}.pdf"`,'Cache-Control':'private, no-store'}});
}catch(e){return apiError(e)}}
