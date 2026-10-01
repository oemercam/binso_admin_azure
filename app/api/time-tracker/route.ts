import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {withTenant} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
export const runtime="nodejs";

type Row={state:string;startedAt:Date;activeSince:Date|null;accumulatedSeconds:number;projectId:string|null;projectLabel:string|null;activity:string;billable:boolean;updatedAt:Date};
function dto(row:Row|undefined){return row?{state:row.state,startedAt:row.startedAt,activeSince:row.activeSince,accumulatedSeconds:Number(row.accumulatedSeconds)||0,projectId:row.projectId||"",projectLabel:row.projectLabel||"",activity:row.activity||"Arbeitszeit",billable:Boolean(row.billable),updatedAt:row.updatedAt}:null}
async function current(c:import("pg").PoolClient,organizationId:string,userId:string){return (await c.query<Row>(`select state,started_at as "startedAt",active_since as "activeSince",accumulated_seconds as "accumulatedSeconds",project_external_id as "projectId",project_label as "projectLabel",activity_label as activity,billable,updated_at as "updatedAt" from active_time_trackers where organization_id=$1 and user_id=$2`,[organizationId,userId])).rows[0]}
export async function GET(){try{const s=await requireSession();authorize(s,"time:read");return json({item:await withTenant(s.organizationId,s.userId,async c=>dto(await current(c,s.organizationId,s.userId)))})}catch(e){return apiError(e)}}
export async function POST(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();authorize(s,"time:write");const b=asObject(await readJson(request,16_000));const action=stringField(b,"action",{min:2,max:20});const item=await withTenant(s.organizationId,s.userId,async c=>{
 const existing=await current(c,s.organizationId,s.userId);
 if(action==="start"){
   if(existing)return {item:dto(existing)};
   const projectId=typeof b.projectId==="string"?b.projectId.slice(0,120):"";
   const projectLabel=typeof b.projectLabel==="string"?b.projectLabel.trim().slice(0,160):"";
   const activity=typeof b.activity==="string"&&b.activity.trim()?b.activity.trim().slice(0,160):"Arbeitszeit";
   const billable=b.billable!==false;
   const row=(await c.query<Row>(`insert into active_time_trackers(organization_id,user_id,state,started_at,active_since,accumulated_seconds,project_external_id,project_label,activity_label,billable) values($1,$2,'running',now(),now(),0,nullif($3,''),nullif($4,''),$5,$6) returning state,started_at as "startedAt",active_since as "activeSince",accumulated_seconds as "accumulatedSeconds",project_external_id as "projectId",project_label as "projectLabel",activity_label as activity,billable,updated_at as "updatedAt"`,[s.organizationId,s.userId,projectId,projectLabel,activity,billable])).rows[0];
   return {item:dto(row)};
 }
 if(!existing)return {item:null};
 if(action==="pause"&&existing.state==="running"){
   const row=(await c.query<Row>(`update active_time_trackers set accumulated_seconds=accumulated_seconds+greatest(0,extract(epoch from (now()-active_since))::int),state='paused',active_since=null,updated_at=now() where organization_id=$1 and user_id=$2 returning state,started_at as "startedAt",active_since as "activeSince",accumulated_seconds as "accumulatedSeconds",project_external_id as "projectId",project_label as "projectLabel",activity_label as activity,billable,updated_at as "updatedAt"`,[s.organizationId,s.userId])).rows[0];return {item:dto(row)};
 }
 if(action==="resume"&&existing.state==="paused"){
   const row=(await c.query<Row>(`update active_time_trackers set state='running',active_since=now(),updated_at=now() where organization_id=$1 and user_id=$2 returning state,started_at as "startedAt",active_since as "activeSince",accumulated_seconds as "accumulatedSeconds",project_external_id as "projectId",project_label as "projectLabel",activity_label as activity,billable,updated_at as "updatedAt"`,[s.organizationId,s.userId])).rows[0];return {item:dto(row)};
 }
 if(action==="stop"){
   const worked=Math.max(1,existing.accumulatedSeconds+(existing.state==="running"&&existing.activeSince?Math.max(0,Math.floor((Date.now()-new Date(existing.activeSince).getTime())/1000)):0));
   const wall=Math.max(worked,Math.floor((Date.now()-new Date(existing.startedAt).getTime())/1000));
   const project=existing.projectId?(await c.query<{id:string}>(`select id::text from projects where organization_id=$1 and external_id=$2 and archived_at is null limit 1`,[s.organizationId,existing.projectId])).rows[0]?.id:null;
   const externalId=randomUUID();
   await c.query(`insert into time_entries(organization_id,external_id,order_id,employee_id,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate,internal_cost_rate,project_id,product_service_id,start_time,end_time,break_minutes,created_by_user_id) values($1,$2,null,null,$3,'employee',(($4::timestamptz at time zone 'Europe/Zurich')::date),$5,$6,$7,false,0,0,$8,null,(($4::timestamptz at time zone 'Europe/Zurich')::time),((now() at time zone 'Europe/Zurich')::time),$9,$10)`,[s.organizationId,externalId,s.name,existing.startedAt,worked/3600,existing.activity,existing.billable,project,Math.max(0,Math.round((wall-worked)/60)),s.userId]);
   await c.query(`delete from active_time_trackers where organization_id=$1 and user_id=$2`,[s.organizationId,s.userId]);
   return {item:null,createdId:externalId,workedSeconds:worked};
 }
 return {item:dto(existing)};
 });
 return json(item);
}catch(e){return apiError(e,request)}}
