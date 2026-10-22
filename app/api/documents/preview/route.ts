import {minuteAllocations,prepareMinuteLine} from '@/lib/server/repositories/business-api';
import {calculateDocument} from "@/lib/money";
import {NextRequest} from "next/server";
import {ApiError,apiError,assertSameOrigin,readJson,cleanText,json} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import {authorize} from "@/lib/server/rbac";
import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {documentLogo} from "@/lib/server/document-logo";
import {documentPdf} from "@/lib/server/document-pdf";
type Body={discount?:unknown;output?:unknown;kind?:unknown;customerId?:unknown;number?:unknown;sourceNumber?:unknown;date?:unknown;due?:unknown;currency?:unknown;note?:unknown;positions?:Array<{timeAllocations?:unknown;priceBaseQuantity?:unknown;discount?:unknown;taxExempt?:unknown;description?:unknown;quantity?:unknown;price?:unknown;vatRate?:unknown;unit?:unknown}>};
/** Read-only preview: all client-supplied documents are drafts, never final bills. */
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession(),body=await readJson<Body>(request,262144);
 const invoice=body.kind==='Rechnung';authorize(s,invoice?'invoices:read':'sales:read');await requireModuleEntitlement(s.organizationId,invoice?'rechnungen':'offerten');
 if(!Array.isArray(body.positions)||body.positions.length>500)throw new ApiError(400,'positions_invalid','Bitte gültige Positionen erfassen.');
 const items=body.positions.map(item=>{const quantity=Number(item.quantity),unit_price=Number(item.price),vat_rate=Number(item.vatRate||0);if(![quantity,unit_price,vat_rate].every(Number.isFinite)||quantity<0||unit_price<0||quantity>1e9||unit_price>999999999.99||vat_rate<0||vat_rate>100)throw new ApiError(400,'position_invalid','Bitte Menge, Preis und MWST prüfen.');return {time_allocations:minuteAllocations(item.timeAllocations,true),price_base_quantity:item.priceBaseQuantity??1,discount:item.discount,tax_exempt:item.taxExempt,description:cleanText(item.description,5000),quantity,unit_price,line_total:0,vat_rate,unit:cleanText(item.unit,40)};});
 const issue=cleanText(body.date,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(issue)||!Number.isFinite(Date.parse(issue))||new Date(issue).toISOString().slice(0,10)!==issue)throw new ApiError(400,'date_invalid','Bitte ein gültiges Datum erfassen.');
 const due=invoice?new Date(Date.parse(issue)+Math.min(365,Math.max(0,Number(body.due)||0))*86400000).toISOString().slice(0,10):cleanText(body.due,10);
 const pdf=await withTenant(s.organizationId,s.userId,async c=>{
  for(const item of items)await prepareMinuteLine(c,s,item,body.customerId,body.currency||'CHF',invoice);
 let calculation:ReturnType<typeof calculateDocument>;
 try{calculation=calculateDocument(items,String(body.currency||'CHF'),body.discount);}catch(error){throw new ApiError(400,'discount_invalid',error instanceof Error?error.message:'Ungültiger Rabatt.');}
 const subtotal=Number(calculation.subtotal),vat=Number(calculation.vat),total=Number(calculation.total);
 items.forEach((item,i)=>{item.line_total=Number(calculation.lines[i].net);});
 if(!Number.isFinite(total)||total>999999999.99)throw new ApiError(400,'total_invalid','Bitte die Positionsbeträge prüfen.');
  const company=(await c.query('select * from organizations where id=$1',[s.organizationId])).rows[0];
  const customer=body.customerId?(await c.query('select name,address as street,zip as postal_code,city,country,discount from customers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,cleanText(body.customerId,80)])).rows[0]:{};
  if(body.customerId&&!customer)throw new ApiError(404,'customer_missing','Kunde wurde nicht gefunden.');
  const saved=body.sourceNumber?(await c.query(`select document_snapshot,intro_text,calculation from ${invoice?'invoices':'quotes'} where organization_id=$1 and ${invoice?'invoice_no':'quote_no'}=$2 and status='draft' and archived_at is null`,[s.organizationId,cleanText(body.sourceNumber,80)])).rows[0]:null;
  if(body.sourceNumber&&!saved)throw new ApiError(404,'draft_missing','Entwurf wurde nicht gefunden.');
  if(saved?.calculation&&((saved.calculation.discount.kind!=='none'&&body.discount===undefined)||(saved.calculation.lines.some((l:Record<string,unknown>)=>(l.discount as Record<string,unknown>).kind!=='none')&&body.positions!.some(l=>l.discount===undefined))))throw new ApiError(409,'discount_confirmation_required','Bitte die gespeicherten Rabatte ausdrücklich übernehmen.');
  if(body.output==='calculation')return {calculation,customerDiscountProposal:customer?.discount===undefined?null:{kind:'percent',value:String(customer.discount),applied:false}};
  const snapshot=saved?{...saved.document_snapshot,intro:cleanText(body.note,12000)||saved.intro_text||saved.document_snapshot.default_intro||''}:undefined;
  const document={document_snapshot:snapshot,kind:invoice?'invoice':'offer',status:'draft',number:cleanText(body.number,80)||'Entwurf',issue_date:issue,due_date:invoice?due:null,valid_until:invoice?null:due,note:cleanText(body.note,12000),currency:body.currency==='EUR'?'EUR':'CHF',customer,items,calculation,subtotal,vat_amount:vat,total};
  return documentPdf(document,company,await documentLogo(c,s.organizationId,document,company));
 });
 if(!Buffer.isBuffer(pdf))return json(pdf);
 return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Cache-Control':'private, no-store'}});
}catch(e){return apiError(e)}}
