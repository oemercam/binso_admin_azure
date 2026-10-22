import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from '../session';
import {ApiError} from '../http';
import {authorize} from '../rbac';
import {audit} from '../audit';
import {idempotentBusiness} from '../business-idempotency';
import {moneyMinor} from '@/lib/money';

const columns='id,supplier_id,supplier_invoice_no,invoice_date::text,due_date::text,net_amount,vat_amount,total_amount,currency,status,note,version';
async function supplier(c:PoolClient,s:SessionUser,id:string){if(!(await c.query('select id from suppliers where organization_id=$1 and id::text=$2 and archived_at is null',[s.organizationId,id])).rows.length)throw new ApiError(404,'not_found','Lieferant wurde nicht gefunden.');}
export async function listSupplierInvoices(c:PoolClient,s:SessionUser,supplierId:string){
 authorize(s,'purchasing:read');await supplier(c,s,supplierId);
 return {items:(await c.query(`select ${columns} from supplier_invoices where organization_id=$1 and supplier_id::text=$2 and archived_at is null order by created_at desc,id limit 100`,[s.organizationId,supplierId])).rows};
}
export async function saveSupplierInvoice(c:PoolClient,s:SessionUser,supplierId:string,body:Record<string,unknown>,key:string){
 authorize(s,'purchasing:write');await supplier(c,s,supplierId);
 const allowed=['id','expectedRevision','number','invoiceDate','dueDate','netAmount','vatAmount','totalAmount','currency','note'];
 if(Object.keys(body).some(key=>!allowed.includes(key)))throw new ApiError(400,'ap_fields_invalid','Diese Rechnungsangaben können hier nicht geändert werden.');
 const text=(key:string,max:number)=>{const value=body[key]??'';if(typeof value!=='string'||value.length>max)throw new ApiError(400,'ap_invalid','Bitte die Eingangsrechnungsangaben prüfen.');return value.trim()||null;};
 const id=text('id',80),number=text('number',120),note=text('note',2000),currency=text('currency',3);
 if(currency&&!['CHF','EUR'].includes(currency))throw new ApiError(400,'ap_invalid','Bitte die Eingangsrechnungsangaben prüfen.');
 const date=(key:string)=>{const value=text(key,10);if(!value)return null;const parsed=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw new ApiError(400,'ap_invalid','Bitte die Eingangsrechnungsangaben prüfen.');return value;};
 const invoiceDate=date('invoiceDate'),dueDate=date('dueDate');
 if(invoiceDate&&dueDate&&dueDate<invoiceDate)throw new ApiError(400,'ap_invalid','Bitte die Eingangsrechnungsangaben prüfen.');
 const amount=(key:string)=>{const value=text(key,20);if(value&&!/^\d{1,9}(?:\.\d{1,2})?$/.test(value))throw new ApiError(400,'ap_amount_invalid','Bitte Beträge mit höchstens zwei Nachkommastellen erfassen.');return value;};
 const net=amount('netAmount'),vat=amount('vatAmount'),total=amount('totalAmount');
 if(net!==null&&vat!==null&&total!==null&&moneyMinor(net)+moneyMinor(vat)!==moneyMinor(total))throw new ApiError(400,'ap_total_invalid','Nettobetrag und MwSt. stimmen nicht mit dem Gesamtbetrag überein.');
 if(id&&(!Number.isSafeInteger(body.expectedRevision)||Number(body.expectedRevision)<1))throw new ApiError(400,'ap_invalid','Bitte die Eingangsrechnungsangaben prüfen.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:id?'supplier_invoice.draft.update':'supplier_invoice.draft.create',key,body:{supplierId,...body}},async()=>{
  if(id){
   const previous=(await c.query('select id,status,version from supplier_invoices where organization_id=$1 and supplier_id::text=$2 and id::text=$3 and archived_at is null for update',[s.organizationId,supplierId,id])).rows[0];
   if(!previous)throw new ApiError(404,'not_found','Eingangsrechnung wurde nicht gefunden.');
   if(previous.status!=='draft'||previous.version!==body.expectedRevision)throw new ApiError(409,'ap_changed','Die Eingangsrechnung wurde geändert oder ist kein bearbeitbarer Entwurf.');
  }
  if(number){
   await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':ap-reference:'+supplierId+':'+number.toUpperCase()]);
   if((await c.query('select id from supplier_invoices where organization_id=$1 and supplier_id::text=$2 and archived_at is null and ($3::text is null or id::text<>$3) and upper(btrim(supplier_invoice_no))=upper($4) limit 1',[s.organizationId,supplierId,id,number])).rows.length)throw new ApiError(409,'ap_duplicate','Diese Rechnungsnummer ist bei diesem Lieferanten bereits vorhanden. Bitte den vorhandenen Beleg prüfen.');
  }
  const values=[number,invoiceDate,dueDate,net,vat,total,currency,note,s.organizationId,supplierId];
  const item=id?(await c.query(`update supplier_invoices set supplier_invoice_no=$1,invoice_date=$2,due_date=$3,net_amount=$4,vat_amount=$5,total_amount=$6,currency=$7,note=$8,updated_at=clock_timestamp() where organization_id=$9 and supplier_id::text=$10 and id::text=$11 returning ${columns}`,[...values,id])).rows[0]
   :(await c.query(`insert into supplier_invoices(supplier_invoice_no,invoice_date,due_date,net_amount,vat_amount,total_amount,currency,note,organization_id,supplier_id,external_id,status,created_by_user_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft',$12) returning ${columns}`,[...values,randomUUID(),s.userId])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:id?'supplier_invoice.draft_updated':'supplier_invoice.draft_created',entityType:'supplier_invoice',entityId:item.id,metadata:{revision:item.version}});
  return {item};
 });
}
