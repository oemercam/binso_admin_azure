import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {apiError,ApiError,json} from '@/lib/server/http';

export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'invoices:read');
 const customer=request.nextUrl.searchParams.get('customerId')??'',draft=request.nextUrl.searchParams.get('draft')??null;
 if(!/^[0-9a-f-]{36}$/i.test(customer)||draft&&!/^[0-9a-f-]{36}$/i.test(draft))throw new ApiError(400,'billing_agreement_invalid','Die Angaben zum Abrechnungsmodell sind ungültig.');
 const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`with sources as(select i.issue_date,x.id,x.billing_agreement_id agreement_id,i.invoice_no number,x.currency,x.calculation,b.terms,billing_agreement_label(x.organization_id,x.billing_agreement_id) agreement_label,
 coalesce((select json_agg(a.snapshot->'taxGroups') from invoice_advance_allocations a join invoices t on t.organization_id=a.organization_id and t.id=a.invoice_id where a.reversed_at is null and a.organization_id=x.organization_id and a.advance_invoice_id=x.id and a.agreement_id=x.billing_agreement_id and (t.billing_issued or t.archived_at is null and t.status<>'cancelled') and ($3::uuid is null or t.id<>$3::uuid)),'[]'::json) prior_allocations,
 coalesce((select sum(a.amount) from invoice_advance_allocations a join invoices t on t.organization_id=a.organization_id and t.id=a.invoice_id where a.reversed_at is null and a.organization_id=x.organization_id and a.advance_invoice_id=x.id and a.agreement_id=x.billing_agreement_id and (t.billing_issued or t.archived_at is null and t.status<>'cancelled') and ($3::uuid is null or t.id<>$3::uuid)),0) allocated_amount,
 coalesce((select sum(n.amount) from credit_notes n where n.organization_id=x.organization_id and n.invoice_id=x.id),0) credited_amount
 from billing_scope_invoices x join invoices i on i.organization_id=x.organization_id and i.id=x.id join billing_agreements b on b.organization_id=x.organization_id and b.id=x.billing_agreement_id
 where x.organization_id=$1 and x.customer_id=$2 and x.billing_context->>'procedure'='advance' and x.billing_issued and x.archived_at is null and x.status not in ('draft','cancelled') and (b.terms->>'model' in ('time','quantity') or b.terms->>'model'='mixed' and b.terms->>'amount' is null)) select * from sources where credited_amount=0 and (calculation->>'total')::numeric-allocated_amount-credited_amount>0 order by issue_date,id,agreement_id limit 100`,[s.organizationId,customer,draft])).rows,{snapshot:true});
 return json({items});
}catch(error){return apiError(error);}}
