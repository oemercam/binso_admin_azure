import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {readBillingAgreement,billingIssue} from '@/lib/server/billing-agreements';
import {apiError,json} from '@/lib/server/http';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession();authorize(s,'invoices:write');const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw billingIssue();
 const item=await withTenant(s.organizationId,s.userId,async c=>{const a=await readBillingAgreement(c,s,id);if(a.scope_kind==='quote'&&!(await c.query("select 1 from quotes where organization_id=$1 and id=$2 and status='accepted' and archived_at is null",[s.organizationId,a.scope_id])).rowCount)throw billingIssue();return {...a,billing_completed_milestones:(await c.query('select milestone_id::text from billing_milestone_completions where organization_id=$1 and agreement_id=$2',[s.organizationId,a.id])).rows.map(r=>r.milestone_id)};},{snapshot:true});
 return json({item});
}catch(error){return apiError(error);}}
