import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';
import {compareSupplierInvoice,type SupplierMatchInput} from '@/lib/supplier-invoice-match';

const dates=(from:unknown,until:unknown)=>{
 const valid=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!valid(from)||!valid(until)||String(until)<String(from)||Date.parse(String(until))-Date.parse(String(from))>365*86400000)throw new ApiError(400,'ap_period_invalid','Bitte einen gültigen Leistungszeitraum von höchstens einem Jahr auswählen.');
 return {from:String(from),until:String(until)};
};
async function access(c:PoolClient,s:SessionUser,supplierId:string,id:string,write=false){
 authorize(s,write?'purchasing:write':'purchasing:read');
 const allowed=(await c.query('select app_ap_match_access($1) allowed',[write])).rows[0]?.allowed;
 if(allowed!==true||s.moduleProfile==='time_only'||s.isDemo||write&&s.organizationStatus==='read_only')throw new ApiError(403,'ap_match_access','Für den Vertragsabgleich fehlt die Finanz- oder Vertragsberechtigung.');
 const row=(await c.query(`select i.id,i.version,i.status from supplier_invoices i join suppliers p on p.organization_id=i.organization_id and p.id=i.supplier_id where i.organization_id=$1 and i.id::text=$2 and i.supplier_id::text=$3 and i.archived_at is null and p.archived_at is null${write?' for update of i':''}`,[s.organizationId,id,supplierId])).rows[0];
 if(!row)throw new ApiError(404,'not_found','Eingangsrechnung wurde nicht gefunden.');return row;
}
export async function supplierMatchState(c:PoolClient,s:SessionUser,supplierId:string,id:string,from:string,until:string){
 const parent=await access(c,s,supplierId,id),period=dates(from,until);
 const sources=(await c.query(`select p.id price_source_id,t.id time_entry_id,t.work_date::text,t.recorded_duration_minutes minutes,t.description,pr.name project_name,p.source_snapshot->>'unitPrice' unit_price,p.source_snapshot->>'currency' currency,p.source_snapshot->>'vatRate' vat_rate
 from time_entries t join time_price_sources p on p.organization_id=t.organization_id and p.time_entry_id=t.id and p.side='purchase' and p.is_current and p.time_version=t.version left join projects pr on pr.organization_id=t.organization_id and pr.id=t.project_id
 where t.organization_id=$1 and t.supplier_id::text=$2 and t.approved and t.submitted_at is not null and t.external_resource_id is not null and t.archived_at is null and t.work_date between $3::date and $4::date order by t.work_date,t.id limit 101`,[s.organizationId,supplierId,period.from,period.until])).rows;
 const matches=(await c.query(`select id,invoice_version,input_snapshot,created_at,created_by_user_id,
 input_snapshot is distinct from supplier_invoice_match_input(invoice_id,invoice_version,period_start,period_end,reported_minutes,reported_unit_price,price_source_ids) stale
 from supplier_invoice_matches where organization_id=$1 and invoice_id=$2 order by created_at desc,id desc limit 20`,[s.organizationId,parent.id])).rows;
 return {invoice:parent,sources:sources.slice(0,100),hasMore:sources.length>100,matches:matches.map(m=>({...m,result:compareSupplierInvoice(m.input_snapshot as SupplierMatchInput)}))};
}
export async function saveSupplierMatch(c:PoolClient,s:SessionUser,supplierId:string,id:string,input:Record<string,unknown>,key:string){
 if(Object.keys(input).some(k=>!['expectedRevision','periodStart','periodEnd','reportedMinutes','reportedUnitPrice','priceSourceIds'].includes(k))||!Number.isSafeInteger(input.expectedRevision)||Number(input.expectedRevision)<1||!Number.isInteger(input.reportedMinutes)||Number(input.reportedMinutes)<0||Number(input.reportedMinutes)>144000||typeof input.reportedUnitPrice!=='string'||!/^\d{1,9}(?:\.\d{1,2})?$/.test(input.reportedUnitPrice)||!Array.isArray(input.priceSourceIds)||!input.priceSourceIds.length||input.priceSourceIds.length>100||input.priceSourceIds.some(x=>typeof x!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x))||new Set(input.priceSourceIds.map(x=>String(x).toLowerCase())).size!==input.priceSourceIds.length)throw new ApiError(400,'ap_match_invalid','Bitte Rechnungsrevision, ganze Minuten und bestätigte Einkaufsquellen auswählen.');
 const priceSourceIds=input.priceSourceIds.map(String);
 const period=dates(input.periodStart,input.periodEnd),parent=await access(c,s,supplierId,id,true);
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'supplier_invoice.match',key,body:{supplierId,id,...input}},async()=>{
  if(parent.status!=='draft'||parent.version!==input.expectedRevision)throw new ApiError(409,'ap_changed','Die Eingangsrechnung wurde geändert oder ist kein bearbeitbarer Entwurf.');
  const item=(await c.query(`insert into supplier_invoice_matches(organization_id,invoice_id,invoice_version,period_start,period_end,reported_minutes,reported_unit_price,price_source_ids,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8::uuid[],$9) returning id,input_snapshot,invoice_version,created_at,created_by_user_id`,[s.organizationId,parent.id,parent.version,period.from,period.until,input.reportedMinutes,input.reportedUnitPrice,priceSourceIds,s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'supplier_invoice.matched',entityType:'supplier_invoice',entityId:parent.id,metadata:{matchId:item.id,revision:parent.version,sourceCount:priceSourceIds.length}});
  return {item:{...item,stale:false,result:compareSupplierInvoice(item.input_snapshot as SupplierMatchInput)}};
 });
}
