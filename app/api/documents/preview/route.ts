import {NextRequest} from "next/server";
import {ApiError,apiError,assertSameOrigin,readJson,cleanText} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {authorize} from "@/lib/server/rbac";
import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {documentPdf} from "@/lib/server/document-pdf";
type Body={kind?:unknown;customerId?:unknown;number?:unknown;date?:unknown;due?:unknown;currency?:unknown;note?:unknown;positions?:Array<{description?:unknown;quantity?:unknown;price?:unknown;vatRate?:unknown;unit?:unknown}>};
/** Read-only preview: all client-supplied documents are drafts, never final bills. */
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession(),body=await readJson<Body>(request,262144);
 const invoice=body.kind==='Rechnung';authorize(s,invoice?'invoices:read':'sales:read');await requireModuleEntitlement(s.organizationId,invoice?'rechnungen':'offerten');
 if(!Array.isArray(body.positions)||body.positions.length>500)throw new ApiError(400,'positions_invalid','Bitte gültige Positionen erfassen.');
 const items=body.positions.map(item=>{const quantity=Number(item.quantity),unit_price=Number(item.price),vat_rate=Number(item.vatRate||0);if(![quantity,unit_price,vat_rate].every(Number.isFinite)||quantity<0||unit_price<0||quantity>1e9||unit_price>999999999.99||quantity*unit_price>999999999.99||vat_rate<0||vat_rate>100)throw new ApiError(400,'position_invalid','Bitte Menge, Preis und MWST prüfen.');return {description:cleanText(item.description,5000),quantity,unit_price,vat_rate,unit:cleanText(item.unit,40)};});
 const subtotal=items.reduce((sum,i)=>sum+i.quantity*i.unit_price,0),vat=items.reduce((sum,i)=>sum+i.quantity*i.unit_price*i.vat_rate/100,0);
 if(!Number.isFinite(subtotal+vat)||subtotal+vat>999999999.99)throw new ApiError(400,'total_invalid','Bitte die Positionsbeträge prüfen.');
 const issue=cleanText(body.date,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(issue)||!Number.isFinite(Date.parse(issue))||new Date(issue).toISOString().slice(0,10)!==issue)throw new ApiError(400,'date_invalid','Bitte ein gültiges Datum erfassen.');
 const due=invoice?new Date(Date.parse(issue)+Math.min(365,Math.max(0,Number(body.due)||0))*86400000).toISOString().slice(0,10):cleanText(body.due,10);
 const pdf=await withTenant(s.organizationId,s.userId,async c=>{
  const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
  const customer=body.customerId?(await c.query('select name,address as street,zip as postal_code,city,country from customers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,cleanText(body.customerId,80)])).rows[0]:{};
  if(body.customerId&&!customer)throw new ApiError(404,'customer_missing','Kunde wurde nicht gefunden.');
  return documentPdf({kind:invoice?'invoice':'offer',status:'draft',number:cleanText(body.number,80)||'Entwurf',issue_date:issue,due_date:invoice?due:null,valid_until:invoice?null:due,note:cleanText(body.note,12000),currency:body.currency==='EUR'?'EUR':'CHF',customer,items,subtotal,vat_amount:vat,total:Math.round((subtotal+vat)*100)/100},company);
 });
 return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Cache-Control':'private, no-store'}});
}catch(e){return apiError(e)}}
