import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { ownRecordOnly } from "@/lib/permissions";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"time:read");
    const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`select t.id,coalesce(p.name,t.project_label,t.description) project_name,t.description,t.employee_id,t.customer_id,t.project_id,
      t.work_date started_at,round(t.hours*60) duration_minutes,t.hours,t.billable,t.approved,t.submitted_at,t.invoiced_invoice_id,t.sales_rate,t.created_at,
      c.name customer_name,coalesce(nullif(concat_ws(' ',e.first_name,e.last_name),''),t.person_name) employee_name
      from time_entries t left join projects p on p.id=t.project_id and p.organization_id=t.organization_id
      left join customers c on c.id=t.customer_id and c.organization_id=t.organization_id
      left join employees e on e.id=t.employee_id and e.organization_id=t.organization_id
      where t.organization_id=$1 and t.archived_at is null and ($3::boolean=false or t.created_by_user_id=$2) and ($4::text is null or t.employee_id::text=$4)
      order by t.work_date desc,t.created_at desc limit 1000`,[s.organizationId,s.userId,ownRecordOnly(s.role,"zeiterfassung"),request.nextUrl.searchParams.get("employeeId")])).rows);
    return json({items});
  }catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);const s=await requireSession();authorize(s,"time:write");
    const body=await readJson<{durationMinutes?:unknown;projectName?:unknown;projectId?:unknown;customerId?:unknown;description?:unknown;startedAt?:unknown;billable?:unknown;salesRate?:unknown}>(request,16384);
    const duration=Number(body.durationMinutes);
    if(!Number.isFinite(duration)||duration<=0||duration>1440)throw new ApiError(400,"duration_invalid","Ungültige Dauer.");
    const salesRate=body.salesRate===undefined?0:Number(body.salesRate);
    if(!Number.isFinite(salesRate)||salesRate<0||salesRate>100000)throw new ApiError(400,"rate_invalid","Ungültiger Stundensatz.");
    const rawDate=cleanText(body.startedAt,40);const workDate=rawDate?new Date(rawDate):new Date();
    if(!Number.isFinite(workDate.getTime()))throw new ApiError(400,"date_invalid","Ungültiges Datum.");
    const item=await withTenant(s.organizationId,s.userId,async c=>{
      const project=cleanText(body.projectName,200),projectId=cleanText(body.projectId,80),customerId=cleanText(body.customerId,80);
      const found=body.projectId===null?{rows:[],rowCount:0}:projectId?await c.query("select id,name,customer_id from projects where organization_id=$1 and id=$2 and archived_at is null",[s.organizationId,projectId]):await c.query("select id,name,customer_id from projects where organization_id=$1 and name=$2 and archived_at is null",[s.organizationId,project]);
      if(found.rowCount&&found.rowCount>1)throw new ApiError(409,"ambiguous_project","Bitte einen eindeutigen Auftrag auswählen.");
      if(projectId&&found.rowCount!==1)throw new ApiError(400,"project_invalid","Bitte einen gültigen Auftrag auswählen.");
      const customers=customerId?await c.query("select id from customers where organization_id=$1 and id=$2 and archived_at is null",[s.organizationId,customerId]):null;
      if(customerId&&customers?.rowCount!==1)throw new ApiError(400,"customer_invalid","Bitte einen gültigen Kunden auswählen.");
      if(customerId&&found.rows[0]?.customer_id&&String(found.rows[0].customer_id)!==customerId)throw new ApiError(400,"project_customer_mismatch","Der Auftrag gehört nicht zum gewählten Kunden.");
      const resolvedCustomer=customers?.rows[0]?.id??found.rows[0]?.customer_id??null;
      if(body.billable===true&&!resolvedCustomer)throw new ApiError(400,"billable_customer_required","Verrechenbare Zeiten benötigen einen Kunden.");
      const billable=Boolean(resolvedCustomer)&&body.billable!==false;
      const employee=await c.query("select id from employees where organization_id=$1 and lower(email)=lower($2) and archived_at is null",[s.organizationId,s.email]);
      const approvalRequired=(await c.query("select time_approval_required from organizations where id=$1",[s.organizationId])).rows[0]?.time_approval_required!==false;
      const result=await c.query(`insert into time_entries(organization_id,external_id,project_id,customer_id,employee_id,project_label,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id,sales_rate)
        values($1,$2,$3,$9,$10,$11,$4,'employee',$5,$6,$7,$12,$14,$8,$13)
        returning id,project_id,project_label as project_name,description,work_date as started_at,round(hours*60) as duration_minutes,customer_id,employee_id,billable,approved,invoiced_invoice_id,sales_rate,created_at`,
        [s.organizationId,randomUUID(),found.rows[0]?.id??null,s.name,workDate.toISOString().slice(0,10),duration/60,cleanText(body.description,2000)||project,s.userId,customers?.rows[0]?.id??found.rows[0]?.customer_id??null,employee.rows[0]?.id??null,found.rows[0]?.name??project,billable,salesRate,billable&&!approvalRequired]);
      const context=(await c.query("select c.name customer_name,coalesce(nullif(concat_ws(' ',e.first_name,e.last_name),''),t.person_name) employee_name from time_entries t left join customers c on c.id=t.customer_id and c.organization_id=t.organization_id left join employees e on e.id=t.employee_id and e.organization_id=t.organization_id where t.id=$1 and t.organization_id=$2",[result.rows[0].id,s.organizationId])).rows[0];
      return {...result.rows[0],...context};
    });return json({item},201);
  }catch(e){return apiError(e)}
}
