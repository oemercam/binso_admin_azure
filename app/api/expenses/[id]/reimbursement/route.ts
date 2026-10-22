import {requireModuleEntitlement} from '@/lib/server/plan-access';
import {NextRequest} from 'next/server';
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {businessDate} from '@/lib/financial-status';
import {moneyMinor} from '@/lib/money';

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,'payments:write');
  await requireModuleEntitlement(s.organizationId,'spesen');await requireModuleEntitlement(s.organizationId,'zahlungen');
  const {id}=await params;
  const body=await readJson<{reference?:unknown;paidOn?:unknown;amount?:unknown;currency?:unknown}>(request,4096);
  const reference=cleanText(body.reference,200),paidOn=cleanText(body.paidOn,10),currency=cleanText(body.currency,3);
  if(!reference)throw new ApiError(400,'reference_required','Bitte den Zahlungsbeleg oder die Zahlungsreferenz angeben.');
  const date=new Date(paidOn+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==paidOn||paidOn>businessDate())throw new ApiError(400,'payment_date_invalid','Bitte ein gültiges Zahlungsdatum bis heute eingeben.');
  if(typeof body.amount!=='string'||!/^\d{1,9}(?:\.\d{1,2})?$/.test(body.amount)||moneyMinor(body.amount)<=0||!['CHF','EUR'].includes(currency))throw new ApiError(400,'payment_amount_invalid','Bitte den Erstattungsbetrag und die Währung prüfen.');
  const item=await withTenant(s.organizationId,s.userId,async c=>{
   await requireFreshAuthentication(s,c);
   const row=(await c.query('select id,status,payment_kind,reimbursed_at,reimbursement_reference,reimbursement_paid_on::text,reimbursement_amount,reimbursement_currency,currency,(quantity*unit_price)::text amount from expenses where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
   if(!row)throw new ApiError(404,'not_found','Spese wurde nicht gefunden.');
   if(row.reimbursed_at){
    if(row.reimbursement_reference===reference&&row.reimbursement_paid_on===paidOn&&row.reimbursement_currency===currency&&moneyMinor(row.reimbursement_amount)===moneyMinor(body.amount))return {id:row.id,reimbursed_at:row.reimbursed_at,reimbursement_reference:row.reimbursement_reference,reimbursement_paid_on:row.reimbursement_paid_on,reimbursement_amount:row.reimbursement_amount,reimbursement_currency:row.reimbursement_currency};
    throw new ApiError(409,'already_reimbursed','Diese Spese ist bereits als erstattet erfasst.');
   }
   if(row.payment_kind!=='private')throw new ApiError(409,'private_payment_required','Nur nachweislich privat bezahlte Spesen können erstattet werden.');
   if(!['approved','posted'].includes(row.status))throw new ApiError(409,'approval_required','Nur genehmigte Spesen können als erstattet erfasst werden.');
   if(currency!==row.currency||moneyMinor(body.amount)!==moneyMinor(row.amount))throw new ApiError(409,'expense_changed','Der Spesenbetrag wurde geändert. Bitte den aktuellen Stand prüfen.');
   const result=(await c.query('update expenses set reimbursed_at=now(),reimbursed_by_user_id=$3,reimbursement_reference=$4,reimbursement_paid_on=$5,reimbursement_amount=round(quantity*unit_price,2),reimbursement_currency=currency,updated_at=now() where organization_id=$1 and id=$2 returning id,reimbursed_at,reimbursement_reference,reimbursement_paid_on::text,reimbursement_amount,reimbursement_currency',[s.organizationId,row.id,s.userId,reference,paidOn])).rows[0];
   await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'expense.reimbursement_recorded',entityType:'expenses',entityId:row.id,metadata:{reference,paidOn,amount:result.reimbursement_amount,currency}});
   return result;
  });return json({item});
 }catch(error){return apiError(error);}
}
