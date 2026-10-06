import {requireModuleEntitlement} from "@/lib/server/plan-access";
import "server-only";
import type {PoolClient} from "pg";
import type {SessionUser} from "./session";
import {ApiError} from "./http";
import {authorize} from "./rbac";
import {audit} from "./audit";
export async function lockDocument(c:PoolClient,s:SessionUser,number:string){
 for(const [table,column,kind] of [['invoices','invoice_no','invoice'],['quotes','quote_no','offer']] as const){
  const row=(await c.query(`select * from ${table} where organization_id=$1 and ${column}=$2 and archived_at is null for update`,[s.organizationId,number])).rows[0];
  if(row){authorize(s,kind==='invoice'?'invoices:write':'sales:write');await requireModuleEntitlement(s.organizationId,kind==='invoice'?'rechnungen':'offerten');return {row,table,kind};}
 }
 throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
}
export async function changeDocumentStatus(c:PoolClient,s:SessionUser,number:string,action:string,note:string){
 const {row,table,kind}=await lockDocument(c,s,number);
 if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,row.id])).rowCount)throw new ApiError(409,'delivery_pending','Der Versand wird noch geprüft.');
 let next:string;
 if(action==='issue'&&row.status==='draft'){const amount=kind==='invoice'?Number(row.total_amount):Number((await c.query('select coalesce(sum(quantity*unit_price),0) total from quote_lines where organization_id=$1 and quote_id=$2',[s.organizationId,row.id])).rows[0].total);if(amount<=0)throw new ApiError(409,'document_empty','Ein Dokument ohne positiven Betrag kann nicht ausgestellt werden.');next='sent';}
 else if(kind==='offer'&&['accept','decline'].includes(action)&&row.status==='sent'){
  if(action==='accept'&&row.valid_until&&String(row.valid_until instanceof Date?row.valid_until.toISOString().slice(0,10):row.valid_until).slice(0,10)<new Date().toISOString().slice(0,10))throw new ApiError(409,'offer_expired','Das Angebot ist abgelaufen.');
  next=action==='accept'?'accepted':'declined';
 }else if(kind==='invoice'&&action==='cancel'&&['draft','sent','overdue'].includes(row.status)&&Number(row.paid_amount)===0)next='cancelled';
 else throw new ApiError(409,'transition_invalid','Dieser Statuswechsel ist nicht möglich.');
 await c.query(`update ${table} set status=$3,updated_at=now()${kind==='offer'&&['accept','decline'].includes(action)?',decision_at=now(),decision_by_user_id=$4,decision_note=$5':''} where organization_id=$1 and id=$2`,[s.organizationId,row.id,next,...(kind==='offer'&&['accept','decline'].includes(action)?[s.userId,note]:[])]);
 if(next==='cancelled'){await c.query('update time_entries set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2',[s.organizationId,row.id]);await c.query('update expenses set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2',[s.organizationId,row.id]);}
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'document.'+action,entityType:table,entityId:row.id,metadata:{previous:row.status,status:next,note}});
 return {status:next};
}
