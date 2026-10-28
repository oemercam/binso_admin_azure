import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {audit} from '@/lib/server/audit';
import {billingIssue,readBillingAgreement} from '@/lib/server/billing-agreements';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string;milestoneId:string}>}){
 try{assertSameOrigin(request);const s=await requireSession();authorize(s,'projects:write');const {id,milestoneId}=await params;const body=await readJson<{version?:unknown}>(request,2048);
  const item=await withTenant(s.organizationId,s.userId,async c=>{
   const p=(await c.query('select id,version,billing_agreement_id from projects where organization_id=$1 and id::text=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];if(!p||body.version!==p.version||!p.billing_agreement_id)throw billingIssue();
   const a=await readBillingAgreement(c,s,p.billing_agreement_id);if(a.terms.model!=='milestone'||!a.terms.milestones.some(m=>m.id===milestoneId))throw billingIssue();
   const inserted=await c.query('insert into billing_milestone_completions(organization_id,agreement_id,milestone_id,completed_by_user_id) values($1,$2,$3,$4) on conflict do nothing returning milestone_id',[s.organizationId,a.id,milestoneId,s.userId]);
   if(inserted.rowCount)await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'project.milestone.completed',entityType:'project',entityId:id,metadata:{agreementId:a.id,milestoneId}});
   return {milestoneId,completed:true};
  });return json({item});
 }catch(error){return apiError(error)}
}
