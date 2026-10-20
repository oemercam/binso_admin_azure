import {assertTimeAssignment} from "@/lib/server/workforce-access";
import {projectAllowsTime} from "@/lib/projects";
import { NextRequest } from "next/server";
import {idempotentBusiness} from "@/lib/server/business-idempotency";
import { randomUUID } from "node:crypto";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import {timeWorkspace} from "@/lib/server/repositories/time-workspace";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"time:read");
    return json(await withTenant(s.organizationId,s.userId,c=>timeWorkspace(c,s,request.nextUrl.searchParams),{snapshot:true}));
  }catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);const s=await requireSession();authorize(s,"time:write");
    const body=await readJson<{durationMinutes?:unknown;projectName?:unknown;projectId?:unknown;customerId?:unknown;description?:unknown;startedAt?:unknown;billable?:unknown;salesRate?:unknown;reportMonth?:unknown}>(request,16384);
    const reportMonth=typeof body.reportMonth==='string'?body.reportMonth.trim():'';
    if(body.reportMonth!==undefined&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(reportMonth)||Number(reportMonth.slice(0,4))<2000))throw new ApiError(400,"month_invalid","Ungültiger Monat.");
    const duration=Number(body.durationMinutes);
    if(!Number.isFinite(duration)||duration<=0||duration>(reportMonth?44640:1440))throw new ApiError(400,"duration_invalid","Ungültige Dauer.");
    const salesRate=body.salesRate===undefined?0:Number(body.salesRate);
    if(!Number.isFinite(salesRate)||salesRate<0||salesRate>100000)throw new ApiError(400,"rate_invalid","Ungültiger Stundensatz.");
    const rawDate=cleanText(body.startedAt,40);const workDate=reportMonth?new Date(reportMonth+"-01T12:00:00Z"):rawDate?new Date(rawDate):new Date();
    if(!Number.isFinite(workDate.getTime()))throw new ApiError(400,"date_invalid","Ungültiges Datum.");
    const requestKey=request.headers.get("Idempotency-Key");
    const item=await withTenant(s.organizationId,s.userId,async c=>{const write=async()=>{
      const project=cleanText(body.projectName,200),projectId=cleanText(body.projectId,80),customerId=cleanText(body.customerId,80);
      const found=body.projectId===null?{rows:[],rowCount:0}:projectId?await c.query("select id,name,customer_id,status from projects where organization_id=$1 and id=$2 and archived_at is null for share",[s.organizationId,projectId]):await c.query("select id,name,customer_id,status from projects where organization_id=$1 and name=$2 and archived_at is null for share",[s.organizationId,project]);
      if(found.rowCount&&found.rowCount>1)throw new ApiError(409,"ambiguous_project","Bitte einen eindeutigen Auftrag auswählen.");
      if(projectId&&found.rowCount!==1)throw new ApiError(400,"project_invalid","Bitte einen gültigen Auftrag auswählen.");
      if(found.rows[0]&&!projectAllowsTime(found.rows[0].status))throw new ApiError(409,"project_not_active","Für diesen Auftrag können momentan keine Zeiten erfasst werden.");
      const customers=customerId?await c.query("select id from customers where organization_id=$1 and id=$2 and archived_at is null",[s.organizationId,customerId]):null;
      if(customerId&&customers?.rowCount!==1)throw new ApiError(400,"customer_invalid","Bitte einen gültigen Kunden auswählen.");
      if(customerId&&found.rows[0]?.customer_id&&String(found.rows[0].customer_id)!==customerId)throw new ApiError(400,"project_customer_mismatch","Der Auftrag gehört nicht zum gewählten Kunden.");
      const resolvedCustomer=customers?.rows[0]?.id??found.rows[0]?.customer_id??null;
      if(body.billable===true&&!resolvedCustomer)throw new ApiError(400,"billable_customer_required","Verrechenbare Zeiten benötigen einen Kunden.");
      await assertTimeAssignment(c,s,resolvedCustomer,found.rows[0]?.id??null,workDate.toISOString().slice(0,10));
      if(reportMonth&&(!resolvedCustomer||body.billable===false))throw new ApiError(400,"report_customer_required","Ein Monatsrapport benötigt einen Kunden und verrechenbare Stunden.");
      const billable=Boolean(resolvedCustomer)&&body.billable!==false;
      const employee=await c.query("select id from employees where organization_id=$1 and archived_at is null and active and user_id=$2",[s.organizationId,s.userId]);
      if(["member","project_manager","manager"].includes(s.role)&&!employee.rowCount)throw new ApiError(403,"employee_unlinked","Der Benutzerzugang ist keinem aktiven Mitarbeiter zugeordnet.");
      const approvalRequired=(await c.query("select not app_is_solo_owner() as time_approval_required from organizations where id=$1",[s.organizationId])).rows[0]?.time_approval_required!==false;
      const result=await c.query(`insert into time_entries(organization_id,external_id,project_id,customer_id,employee_id,project_label,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id,sales_rate,report_month)
        values($1,$2,$3,$9,$10,$11,$4,'employee',$5,$6,$7,$12,$14,$8,$13,$15)
        returning id,report_month,project_id,project_label as project_name,description,work_date as started_at,round(hours*60) as duration_minutes,customer_id,employee_id,billable,approved,invoiced_invoice_id,sales_rate,created_at`,
        [s.organizationId,randomUUID(),found.rows[0]?.id??null,s.name,workDate.toISOString().slice(0,10),duration/60,cleanText(body.description,2000)||project,s.userId,customers?.rows[0]?.id??found.rows[0]?.customer_id??null,employee.rows[0]?.id??null,found.rows[0]?.name??project,billable,["member"].includes(s.role)?0:salesRate,reportMonth?false:billable&&!approvalRequired,reportMonth?reportMonth+"-01":null]);
      const context=(await c.query("select c.name customer_name,coalesce(nullif(concat_ws(' ',e.first_name,e.last_name),''),t.person_name) employee_name from time_entries t left join customers c on c.id=t.customer_id and c.organization_id=t.organization_id left join employees e on e.id=t.employee_id and e.organization_id=t.organization_id where t.id=$1 and t.organization_id=$2",[result.rows[0].id,s.organizationId])).rows[0];
      return {...result.rows[0],...context};
    };return requestKey?idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:"time.manual.create",key:requestKey,body},write):write();});return json({item},201);
  }catch(e){return apiError(e)}
}
