import {requireModuleEntitlement} from "@/lib/server/plan-access";
import {NextRequest} from "next/server";
import {apiError,json} from "@/lib/server/http";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
export async function GET(request:NextRequest){try{
 const s=await requireSession();authorize(s,'invoices:write');await requireModuleEntitlement(s.organizationId,'spesen');await requireModuleEntitlement(s.organizationId,'rechnungen');
 const ids=(request.nextUrl.searchParams.get('ids')??'').split(',').filter(Boolean).slice(0,100);
 const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query("select e.id,e.customer_id,e.description,e.quantity,e.unit_price,e.vat_rate,e.currency,c.name customer_name from expenses e join customers c on c.id=e.customer_id and c.organization_id=e.organization_id where e.organization_id=$1 and e.archived_at is null and e.billable=true and e.status in ('approved','posted') and e.invoiced_invoice_id is null and (cardinality($2::uuid[])=0 or e.id=any($2::uuid[])) order by e.expense_date",[s.organizationId,ids])).rows);
 return json({items});
}catch(e){return apiError(e)}}
