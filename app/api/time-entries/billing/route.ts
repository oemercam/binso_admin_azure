import {billingRateOptions,billingTerms} from '@/lib/server/billing-agreements';
import {billingTermsReady,type BillingTerms,type BillingRateOption} from '@/lib/billing-model';
import {requireModuleEntitlement} from "@/lib/server/plan-access";
import { NextRequest } from "next/server";
import { apiError, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"invoices:write");await requireModuleEntitlement(s.organizationId,"zeiterfassung");await requireModuleEntitlement(s.organizationId,"rechnungen");
    const minutes=request.nextUrl.searchParams.get('minuteAllocations')==='1';
    const draft=(request.nextUrl.searchParams.get('draft')??'').slice(0,80);
    const reserved=`select coalesce(sum(x.allocated_minutes),0)::int from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id and not exists(select 1 from invoice_lines own_line join invoices own_invoice on own_invoice.organization_id=own_line.organization_id and own_invoice.id=own_line.invoice_id where own_line.organization_id=x.organization_id and own_line.id=x.invoice_line_id and own_invoice.invoice_no=$4::text and own_invoice.status='draft' and own_invoice.archived_at is null)`;
    const ids=(request.nextUrl.searchParams.get("ids")??"").split(",").filter(Boolean).slice(0,100);
    const items=await withTenant(s.organizationId,s.userId,async c=>{const items=(await c.query(`
      select t.id,p.billing_agreement_id,t.hours,t.description,case when t.external_resource_id is null then t.sales_rate else (ps.source_snapshot->>'unitPrice')::numeric end sales_rate,t.work_date,t.customer_id,t.project_id,t.external_resource_id,ps.id price_source_id,coalesce((ps.source_snapshot->>'unitMinutes')::integer,60) price_base_quantity,ps.source_snapshot->>'currency' price_currency,ps.source_snapshot->>'vatRate' vat_rate,ps.source_snapshot->>'taxTreatment' tax_treatment,
        case when t.external_resource_id is null then null else (select coalesce(sum(x.allocated_minutes),0)::int from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id) end allocated_minutes,
        case when t.external_resource_id is null then null else t.recorded_duration_minutes-(${reserved}) end remaining_minutes,
        c.name customer_name,coalesce(p.name,t.project_label,'Arbeitszeit') project_name
      from time_entries t
      join customers c on c.id=t.customer_id and c.organization_id=t.organization_id
      left join projects p on p.id=t.project_id and p.organization_id=t.organization_id
      left join time_price_sources ps on ps.organization_id=t.organization_id and ps.time_entry_id=t.id and ps.side='sale' and ps.is_current
      where (t.external_resource_id is null or ($3::boolean and ps.id is not null and t.recorded_duration_minutes>(${reserved}))) and t.organization_id=$1 and t.archived_at is null and c.archived_at is null and t.billable=true and t.approved=true and t.invoiced_invoice_id is null and (p.billing_agreement_id is null or exists(select 1 from billing_agreements ba where ba.organization_id=p.organization_id and ba.id=p.billing_agreement_id and (ba.terms->>'model'='time' or (ba.terms->>'model'='mixed' and ba.terms->>'additionalTime'='true'))))
        and (cardinality($2::uuid[])=0 or t.id=any($2::uuid[]))
      order by c.name,project_name,t.work_date,t.created_at`,[s.organizationId,ids,minutes,draft])).rows;
      const agreementIds=[...new Set(items.map(row=>row.billing_agreement_id).filter(Boolean))];
      const agreements=agreementIds.length?(await c.query('select id,terms,commercial_snapshot,currency from billing_agreements where organization_id=$1 and id=any($2::uuid[])',[s.organizationId,agreementIds])).rows:[];
      const plans=new Map<string,{terms:BillingTerms;currency:string;options:BillingRateOption[];documentDiscount?:unknown;conditions?:string}>(agreements.map(a=>[String(a.id),{conditions:a.commercial_snapshot?.note,documentDiscount:a.commercial_snapshot?.calculation?.discount,currency:String(a.currency),terms:billingTerms(a.terms),options:billingRateOptions(billingTerms(a.terms),a.commercial_snapshot)}]));
      return items.flatMap(item=>{const plan=plans.get(item.billing_agreement_id);if(!plan)return [item];if(!billingTermsReady(plan.terms))return [];const options=plan.options;const first=options[0],uniform=first&&options.every(o=>o.unitPrice===first.unitPrice&&o.vatRate===first.vatRate&&o.taxExempt===first.taxExempt);return [{...item,price_currency:plan.currency,...(!item.external_resource_id&&uniform?{sales_rate:first.unitPrice,vat_rate:first.vatRate,tax_treatment:first.taxExempt?'exempt':'taxable',billing_discount:first.discount,billing_source_position:first.position}:{}),...(ids.length?{billing_terms:plan.terms,billing_rate_options:options,billing_conditions:plan.conditions,billing_document_discount:(plan as {documentDiscount?:unknown}).documentDiscount}:{})}];});
    });
    return json({items});
  }catch(e){return apiError(e)}
}
