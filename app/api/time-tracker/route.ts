import {businessDate} from "@/lib/financial-status";
import {assertTimeAssignment} from "@/lib/server/workforce-access";
import {projectAllowsTime} from "@/lib/projects";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import {timerDays,timerDay,confirmLegacyTimerDays} from '@/lib/timer-days';
import {audit} from '@/lib/server/audit';

export async function GET(){
  try{
    const s=await requireSession();authorize(s,"time:read");
    return json(await withTenant(s.organizationId,s.userId,async c=>{
      const result=await c.query("select *, now() as measured_at, accumulated_seconds + case when state='running' and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end as seconds from active_time_trackers where organization_id=$1 and user_id=$2",[s.organizationId,s.userId]);
      const tracker=result.rows[0];
      return {tracker:tracker?{...tracker,...timerDays(tracker,new Date(tracker.measured_at).getTime())}:null};
    }));
  }catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);const s=await requireSession();authorize(s,"time:write");
    const body=await readJson<{action?:unknown;project?:unknown;projectId?:unknown;customerId?:unknown;legacyDays?:unknown}>(request);
    if(!["start","pause","project","finish"].includes(String(body.action)))throw new ApiError(400,"invalid_action","Ungültige Aktion.");
    return json(await withTenant(s.organizationId,s.userId,async c=>{
      await c.query("select pg_advisory_xact_lock(hashtextextended($1,0))",[s.organizationId+":"+s.userId]);
      const result=await c.query("select *, now() as measured_at, accumulated_seconds + case when state='running' and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end as seconds from active_time_trackers where organization_id=$1 and user_id=$2 for update",[s.organizationId,s.userId]);
      const current=result.rows[0];
      const checkpoint=current?timerDays(current,new Date(current.measured_at).getTime()):{days:{},legacySeconds:0,seconds:0};
      const seconds=checkpoint.seconds;
      const label=cleanText(body.project,200)||current?.project_label||"Arbeitszeit";
      if(body.action==="finish"){
        if(!current)return {tracker:null};
        if(seconds<=0)throw new ApiError(400,"empty_tracker","Es läuft noch keine Zeitmessung.");
        const days={...checkpoint.days};
        if(checkpoint.legacySeconds){
          if(body.legacyDays===undefined)throw new ApiError(409,'timer_dates_required','Bitte die bisherigen Zeiten nach Datum bestätigen.');
          let confirmed:Record<string,number>;
          try{confirmed=confirmLegacyTimerDays(body.legacyDays,checkpoint.legacySeconds,timerDay(new Date(current.started_at).getTime()),businessDate());}
          catch(error){throw new ApiError(400,'timer_dates_invalid',error instanceof Error?error.message:'Bitte Datum und Dauer prüfen.');}
          for(const [date,duration] of Object.entries(confirmed))days[date]=(days[date]??0)+duration;
        }
        const items=[];
        for(const [date,duration] of Object.entries(days).sort(([a],[b])=>a.localeCompare(b))){
          if(duration<=0)continue;
          await assertTimeAssignment(c,s,current.customer_id,current.project_id,date);
          const entry=await c.query(`insert into time_entries(organization_id,external_id,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id,project_id,project_label,employee_id,customer_id)
            values($1,$2,$3,'employee',$11::date,$4,$5,$6,$6 and app_is_solo_owner(),$7,$8,$9,(select id from employees where organization_id=$1 and user_id=$7 and archived_at is null limit 1),coalesce($10::uuid,(select customer_id from projects where id=$8 and organization_id=$1))) returning id,description,work_date,hours,created_at`,
            [s.organizationId,randomUUID(),s.name,duration/3600,current.project_label+" · "+current.activity_label,current.billable,s.userId,current.project_id,current.project_label,current.customer_id,date]);
          items.push(entry.rows[0]);
        }
        await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.timer_finished',entityType:'time_entry',entityId:items[0].id,metadata:{days:Object.keys(days),legacyDatesConfirmed:checkpoint.legacySeconds>0}});
        await c.query("delete from active_time_trackers where organization_id=$1 and user_id=$2",[s.organizationId,s.userId]);
        return {tracker:null,item:items[0],items};
      }
      if(body.action==="pause"){
        if(!current)return {tracker:null};
        const paused=await c.query("update active_time_trackers set state='paused',active_since=null,accumulated_seconds=$3,day_seconds=$4::jsonb,updated_at=now() where organization_id=$1 and user_id=$2 returning *,accumulated_seconds as seconds",[s.organizationId,s.userId,seconds,JSON.stringify(checkpoint.days)]);
        return {tracker:paused.rows[0]};
      }
      const projectId=body.projectId===undefined?current?.project_id:cleanText(body.projectId,80);
      const customerId=body.customerId===undefined?current?.customer_id:cleanText(body.customerId,80);
      if(customerId){const customer=await c.query("select id from customers where organization_id=$1 and id=$2 and archived_at is null",[s.organizationId,customerId]);if(customer.rowCount!==1)throw new ApiError(400,"customer_invalid","Bitte einen gültigen Kunden auswählen.");}
      const projects=body.projectId===null?{rows:[],rowCount:0}:projectId?await c.query("select id,name,customer_id,status,billing_agreement_id from projects where organization_id=$1 and id=$2 and archived_at is null for share",[s.organizationId,projectId]):await c.query("select id,name,customer_id,status,billing_agreement_id from projects where organization_id=$1 and name=$2 and archived_at is null for share",[s.organizationId,label]);
      if(projects.rowCount&&projects.rowCount>1)throw new ApiError(409,"ambiguous_project","Bitte einen eindeutigen Auftrag auswählen.");
      if(projectId&&projects.rowCount!==1)throw new ApiError(400,"project_invalid","Bitte einen gültigen Auftrag auswählen.");
      if(body.action!=="pause"&&projects.rows[0]&&!projectAllowsTime(projects.rows[0].status))throw new ApiError(409,"project_not_active","Für diesen Auftrag können momentan keine Zeiten erfasst werden.");
      if(customerId&&projects.rows[0]?.customer_id&&String(projects.rows[0].customer_id)!==customerId)throw new ApiError(400,"project_customer_mismatch","Der Auftrag gehört nicht zum gewählten Kunden.");
      if(projects.rows[0]?.billing_agreement_id&&(await c.query('select 1 from billing_closures closed join projects p on p.organization_id=closed.organization_id and p.billing_agreement_id=closed.agreement_id where p.organization_id=$1 and p.id=$2 limit 1',[s.organizationId,projects.rows[0].id])).rowCount)throw new ApiError(409,'project_not_active','Für diesen Auftrag können momentan keine Zeiten erfasst werden.');
      const resolvedCustomer=customerId||projects.rows[0]?.customer_id||null;
      if(body.action!=="pause")await assertTimeAssignment(c,s,resolvedCustomer,projects.rows[0]?.id??null,businessDate());
      if(current&&seconds>0&&(String(current.customer_id??"")!==String(resolvedCustomer??"")||String(current.project_id??"")!==String(projects.rows[0]?.id??"")||current.project_label!==label))throw new ApiError(409,"tracker_context_locked","Bitte die erfasste Zeit zuerst stoppen, bevor du den Kunden oder Auftrag wechselst.");
      const running=body.action==="start"||(body.action==="project"&&current?.state==="running");
      const saved=await c.query(`insert into active_time_trackers(organization_id,user_id,state,active_since,accumulated_seconds,project_label,project_id,customer_id,billable,day_seconds)
        values($1,$2,$3,case when $3='running' then now() else null end,$4,$5,$6,$7,$8,$9::jsonb)
        on conflict(organization_id,user_id) do update set state=excluded.state,active_since=excluded.active_since,
        accumulated_seconds=excluded.accumulated_seconds,day_seconds=excluded.day_seconds,project_label=excluded.project_label,project_id=excluded.project_id,customer_id=excluded.customer_id,billable=excluded.billable,updated_at=now() returning *,accumulated_seconds as seconds`,
        [s.organizationId,s.userId,running?"running":"paused",seconds,label,projects.rows[0]?.id??null,resolvedCustomer,Boolean(resolvedCustomer),JSON.stringify(checkpoint.days)]);
      return {tracker:{...saved.rows[0],customer_id:resolvedCustomer}};
    }));
  }catch(e){return apiError(e)}
}
