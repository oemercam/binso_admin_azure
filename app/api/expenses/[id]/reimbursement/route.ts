import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {NextRequest} from "next/server";
import {ApiError,apiError,assertSameOrigin,cleanText,json,readJson} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {audit} from "@/lib/server/audit";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'payments:write');await requireModuleEntitlement(s.organizationId,'spesen');await requireModuleEntitlement(s.organizationId,'zahlungen');const {id}=await params;
 const b=await readJson<{reference?:unknown}>(request,4096);const reference=cleanText(b.reference,200);
 if(!reference)throw new ApiError(400,'reference_required','Bitte den Zahlungsbeleg oder die Zahlungsreferenz angeben.');
 const item=await withTenant(s.organizationId,s.userId,async c=>{
  const row=(await c.query('select * from expenses where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
  if(!row)throw new ApiError(404,'not_found','Spese wurde nicht gefunden.');
  if(row.reimbursed_at){if(row.reimbursement_reference===reference)return row;throw new ApiError(409,'already_reimbursed','Diese Spese ist bereits als erstattet erfasst.');}
  if(!['approved','posted'].includes(row.status))throw new ApiError(409,'approval_required','Nur genehmigte Spesen können als erstattet erfasst werden.');
  const result=(await c.query('update expenses set reimbursed_at=now(),reimbursed_by_user_id=$3,reimbursement_reference=$4,updated_at=now() where organization_id=$1 and id=$2 returning id,reimbursed_at,reimbursement_reference',[s.organizationId,row.id,s.userId,reference])).rows[0];
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'expense.reimbursement_recorded',entityType:'expenses',entityId:row.id,metadata:{reference,amount:Number(row.quantity)*Number(row.unit_price)}});return result;
 });return json({item});
}catch(e){return apiError(e)}}
