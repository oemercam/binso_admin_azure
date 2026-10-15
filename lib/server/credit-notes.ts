import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {lockDocument} from './document-process';
import {idempotentBusiness} from './business-idempotency';
import {authorize} from './rbac';
import {requireModuleEntitlement} from './plan-access';
import {ApiError} from './http';
import {audit} from './audit';
import {businessDate} from '@/lib/financial-status';
import {moneyMinor} from '@/lib/money';

/** Book an immutable gross credit against an issued invoice. No refund, mail or
 * external payment is triggered. Caller supplies the tenant transaction. */
export async function createCreditNote(c:PoolClient,s:SessionUser,number:string,input:{amount:number;reason:string},key:string){
 authorize(s,'invoices:write');
 await requireModuleEntitlement(s.organizationId,'rechnungen');
 const reason=input.reason.trim();
 if(!Number.isFinite(input.amount)||input.amount<=0||!Number.isSafeInteger(Math.round(input.amount*100))||input.amount!==Math.round(input.amount*100)/100)throw new ApiError(400,'amount_invalid','Bitte gültigen Betrag eingeben.');
 if(reason.length<3||reason.length>2000)throw new ApiError(400,'reason_required','Bitte eine Begründung mit 3 bis 2000 Zeichen eingeben.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'invoice.credit',key,body:{number,amount:input.amount,reason}},async()=>{
  const {row,kind}=await lockDocument(c,s,number);
  if(kind!=='invoice'||['draft','cancelled'].includes(row.status))throw new ApiError(409,'invoice_invalid','Nur ausgestellte Rechnungen können gutgeschrieben werden.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status='sending'",[s.organizationId,row.id])).rowCount)throw new ApiError(409,'delivery_pending','Der Versand wird noch geprüft.');
  const today=businessDate();
  if(String(row.issue_date instanceof Date?row.issue_date.toISOString().slice(0,10):row.issue_date).slice(0,10)>today)throw new ApiError(409,'invoice_future','Die Rechnung ist noch nicht ausgestellt.');
  const credited=(await c.query('select coalesce(sum(amount),0) amount from credit_notes where organization_id=$1 and invoice_id=$2',[s.organizationId,row.id])).rows[0].amount;
  if(moneyMinor(input.amount)>moneyMinor(row.total_amount)-moneyMinor(credited))throw new ApiError(409,'credit_exceeds_invoice','Die Gutschrift überschreitet den verbleibenden Rechnungsbetrag.');
  const year=today.slice(0,4),prefix='GS-'+year+'-';
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':credit-number:'+year]);
  const counter=(await c.query(`insert into business_document_counters(organization_id,kind,period,next_value)
   values($1,'credit_note',$2,coalesce((select max(substring(credit_no from $3)::bigint) from credit_notes where organization_id=$1),0)+2)
   on conflict(organization_id,kind,period) do update set next_value=greatest(business_document_counters.next_value+1,excluded.next_value)
   returning next_value-1 number`,[s.organizationId,year,'^'+prefix+'([0-9]+)$'])).rows[0].number;
  const creditNo=prefix+String(counter).padStart(6,'0');
  const item=(await c.query(`insert into credit_notes(organization_id,credit_no,invoice_id,customer_id,credit_date,amount,reason,external_id)
   values($1,$2,$3,$4,$5,$6,$7,$8) returning id,credit_no,invoice_id,credit_date::text,amount,reason`,[s.organizationId,creditNo,row.id,row.customer_id,today,input.amount,reason,randomUUID()])).rows[0];
  await c.query('update invoices set updated_at=now() where organization_id=$1 and id=$2',[s.organizationId,row.id]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'invoice.credit.created',entityType:'credit_note',entityId:item.id,metadata:{invoiceId:row.id,creditNo,amount:input.amount,reason}});
  return item;
 });
}

/** Record a repayment already performed outside this application. Original
 * receipt rows stay intact; the refund is a separate dated ledger event. */
export async function recordInvoiceRefund(c:PoolClient,s:SessionUser,number:string,input:{amount:number;reason:string;date:string},key:string){
 authorize(s,'payments:write');authorize(s,'invoices:write');
 await requireModuleEntitlement(s.organizationId,'zahlungen');
 const reason=input.reason.trim(),today=businessDate();
 if(!Number.isFinite(input.amount)||input.amount<=0||!Number.isSafeInteger(Math.round(input.amount*100))||input.amount!==Math.round(input.amount*100)/100)throw new ApiError(400,'amount_invalid','Bitte gültigen Betrag eingeben.');
 if(reason.length<3||reason.length>2000)throw new ApiError(400,'reason_required','Bitte eine Begründung mit 3 bis 2000 Zeichen eingeben.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date+'T12:00:00Z'))||new Date(input.date+'T12:00:00Z').toISOString().slice(0,10)!==input.date||input.date>today)throw new ApiError(400,'refund_date_invalid','Bitte ein gültiges Rückerstattungsdatum bis heute eingeben.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'invoice.refund',key,body:{number,...input,reason}},async()=>{
  const {row,kind}=await lockDocument(c,s,number);
  if(kind!=='invoice'||['draft','cancelled'].includes(row.status))throw new ApiError(409,'invoice_invalid','Nur ausgestellte Rechnungen können gutgeschrieben werden.');
  const issued=String(row.issue_date instanceof Date?row.issue_date.toISOString().slice(0,10):row.issue_date).slice(0,10);
  if(input.date<issued)throw new ApiError(400,'refund_date_invalid','Bitte ein gültiges Rückerstattungsdatum bis heute eingeben.');
  const effective=(await c.query(`select coalesce((select sum(amount) from payments where organization_id=$1 and invoice_id=$2 and archived_at is null and allocation_status='matched'),0) recorded,coalesce((select sum(amount) from payments where organization_id=$1 and invoice_id=$2 and archived_at is null and allocation_status='matched' and payment_date<=$3::date),0) paid,
   coalesce((select sum(amount) from credit_notes where organization_id=$1 and invoice_id=$2 and credit_date<=$3::date),0) credited,
   coalesce((select sum(amount) from invoice_refunds where organization_id=$1 and invoice_id=$2),0) refunded`,[s.organizationId,row.id,input.date])).rows[0];
  if(moneyMinor(effective.recorded)!==moneyMinor(row.paid_amount))throw new ApiError(409,'payment_ledger_mismatch','Der Zahlungsstand muss vor der Rückerstattung geprüft werden.');
  const available=moneyMinor(effective.paid)-moneyMinor(effective.refunded)-Math.max(0,moneyMinor(row.total_amount)-moneyMinor(effective.credited));
  if(moneyMinor(input.amount)>available)throw new ApiError(409,'refund_exceeds_credit','Die Rückerstattung überschreitet das verfügbare Kundenguthaben am gewählten Datum.');
  const item=(await c.query(`insert into invoice_refunds(organization_id,external_id,invoice_id,customer_id,refund_date,amount,reason,created_by_user_id)
   values($1,$2,$3,$4,$5,$6,$7,$8) returning id,invoice_id,refund_date::text,amount,reason`,[s.organizationId,randomUUID(),row.id,row.customer_id,input.date,input.amount,reason,s.userId])).rows[0];
  await c.query('update invoices set updated_at=now() where organization_id=$1 and id=$2',[s.organizationId,row.id]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'invoice.refund.recorded',entityType:'invoice_refund',entityId:item.id,metadata:{invoiceId:row.id,date:input.date,amount:input.amount,reason}});
  return item;
 });
}
