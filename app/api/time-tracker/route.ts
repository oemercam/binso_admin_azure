import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";

export async function GET(){
  try{
    const s=await requireSession();authorize(s,"time:read");
    return json(await withTenant(s.organizationId,s.userId,async c=>{
      const result=await c.query("select *, accumulated_seconds + case when state='running' and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end as seconds from active_time_trackers where organization_id=$1 and user_id=$2",[s.organizationId,s.userId]);
      return {tracker:result.rows[0]??null};
    }));
  }catch(e){return apiError(e)}
}
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);const s=await requireSession();authorize(s,"time:write");
    const body=await readJson<{action?:unknown;project?:unknown}>(request);
    if(!["start","pause","project","finish"].includes(String(body.action)))throw new ApiError(400,"invalid_action","Ungültige Aktion.");
    return json(await withTenant(s.organizationId,s.userId,async c=>{
      await c.query("select pg_advisory_xact_lock(hashtextextended($1,0))",[s.organizationId+":"+s.userId]);
      const result=await c.query("select *, accumulated_seconds + case when state='running' and active_since is not null then greatest(0,extract(epoch from now()-active_since)::integer) else 0 end as seconds from active_time_trackers where organization_id=$1 and user_id=$2 for update",[s.organizationId,s.userId]);
      const current=result.rows[0];const seconds=Number(current?.seconds??0);
      const label=cleanText(body.project,200)||current?.project_label||"Arbeitszeit";
      if(body.action==="finish"){
        if(!current)return {tracker:null};
        if(seconds<=0)throw new ApiError(400,"empty_tracker","Es läuft noch keine Zeitmessung.");
        const entry=await c.query(`insert into time_entries(organization_id,external_id,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id,project_id,project_label,employee_id,customer_id)
          values($1,$2,$3,'employee',current_date,$4,$5,$6,false,$7,$8,$9,(select id from employees where organization_id=$1 and lower(email)=lower($10) and archived_at is null limit 1),(select customer_id from projects where id=$8 and organization_id=$1)) returning id,description,work_date,hours,created_at`,
          [s.organizationId,randomUUID(),s.name,seconds/3600,current.project_label+" · "+current.activity_label,current.billable,s.userId,current.project_id,current.project_label,s.email]);
        await c.query("delete from active_time_trackers where organization_id=$1 and user_id=$2",[s.organizationId,s.userId]);
        return {tracker:null,item:entry.rows[0]};
      }
      const projects=await c.query("select id from projects where organization_id=$1 and name=$2 and archived_at is null",[s.organizationId,label]);
      if(projects.rowCount&&projects.rowCount>1)throw new ApiError(409,"ambiguous_project","Bitte ein eindeutiges Projekt auswählen.");
      const running=body.action==="start"||(body.action==="project"&&current?.state==="running");
      const saved=await c.query(`insert into active_time_trackers(organization_id,user_id,state,active_since,accumulated_seconds,project_label,project_id)
        values($1,$2,$3,case when $3='running' then now() else null end,$4,$5,$6)
        on conflict(organization_id,user_id) do update set state=excluded.state,active_since=excluded.active_since,
        accumulated_seconds=excluded.accumulated_seconds,project_label=excluded.project_label,project_id=excluded.project_id,updated_at=now() returning *,accumulated_seconds as seconds`,
        [s.organizationId,s.userId,running?"running":"paused",seconds,label,projects.rows[0]?.id??null]);
      return {tracker:saved.rows[0]};
    }));
  }catch(e){return apiError(e)}
}
