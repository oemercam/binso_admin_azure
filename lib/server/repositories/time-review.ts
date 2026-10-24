import {assertExternalAssignment} from "@/lib/server/repositories/external-resources";
import {ApiError} from "@/lib/server/http";
import type {SessionUser} from "@/lib/server/session";
import type {PoolClient} from "pg";
import { authorize } from "@/lib/server/rbac";
import { normalizeTenantRole } from "@/lib/permissions";
import { audit } from "@/lib/server/audit";
import {assertTimeAssignment} from "@/lib/server/workforce-access";
import {accessibleFileStatuses} from "@/lib/server/file-access";


/** Shared atomic review transition; caller supplies the tenant-scoped transaction. */
export async function reviewTimeEntry(c:PoolClient,s:SessionUser,id:string,body:{action:string;note?:string;durationMinutes?:number;description?:string}){
const submit=body.action==='submit';
 authorize(s,'time:write');
 if(!['submit','approve','reject','correct'].includes(body.action))throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 if(!submit&&body.action!=='correct'&&!['owner','admin','project_manager','manager'].includes(normalizeTenantRole(s.role)))throw new ApiError(403,'approval_forbidden','Nur berechtigte Personen können Zeiten freigeben.');
      const entry=(await c.query('select *,work_date::text as work_date from time_entries where organization_id=$1 and id=$2 and archived_at is null for update',[s.organizationId,id])).rows[0];
      if(!entry)throw new ApiError(404,'time_entry_not_found','Zeiteintrag wurde nicht gefunden.');
      if(body.action==='correct'){
        if(entry.created_by_user_id!==s.userId||entry.approved||entry.submitted_at||entry.invoiced_invoice_id)throw new ApiError(403,'time_locked','Dieser Eintrag kann nicht bearbeitet werden.');
        const minutes=Number(body.durationMinutes);if(!Number.isFinite(minutes)||minutes<=0||minutes>(entry.report_month?44640:1440)||typeof body.description!=='string'||body.description.length>2000)throw new ApiError(400,'duration_invalid','Ungültige Dauer.');
        if(entry.external_resource_id){if(!Number.isInteger(minutes))throw new ApiError(400,'duration_invalid','Bitte volle Minuten erfassen.');await assertExternalAssignment(c,s,entry.external_assignment_id,String(entry.work_date));}
        await assertTimeAssignment(c,s,entry.customer_id,entry.project_id,String(entry.work_date));
        const row=(await c.query('update time_entries set hours=case when external_resource_id is null then $3::numeric else $5::numeric/60 end,recorded_duration_minutes=case when external_resource_id is null then null else $5 end,description=$4,review_note=null where organization_id=$1 and id=$2 returning id,hours,recorded_duration_minutes',[s.organizationId,id,minutes/60,body.description,minutes])).rows[0];
        await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.corrected',entityType:'time_entry',entityId:id});return row;
      }
      if(submit&&entry.created_by_user_id!==s.userId)throw new ApiError(403,'submission_forbidden','Nur eigene Zeiten können eingereicht werden.');
      if(submit)await assertTimeAssignment(c,s,entry.customer_id,entry.project_id,String(entry.work_date).slice(0,10));
      if(!submit&&entry.created_by_user_id===s.userId&&(entry.external_resource_id||body.action!=='approve'||!(await c.query('select app_is_solo_owner() allowed')).rows[0]?.allowed))throw new ApiError(403,'self_approval_forbidden','Eigene Zeiten dürfen nicht selbst freigegeben werden.');
      if(['project_manager','manager'].includes(s.role))await assertTimeAssignment(c,s,entry.customer_id,entry.project_id,String(entry.work_date).slice(0,10));
      if(submit&&entry.report_month&&!(await c.query("select id from file_objects where organization_id=$1 and time_entry_id=$2 and purpose='time_report' and archived_at is null and scan_status=any($3::text[]) limit 1",[s.organizationId,id,accessibleFileStatuses()])).rowCount)throw new ApiError(409,'signed_report_required','Bitte den unterschriebenen Stundenrapport hochladen.');
      if(entry.report_month&&!submit&&!entry.submitted_at)throw new ApiError(409,'report_not_submitted','Der Monatsrapport wurde noch nicht eingereicht.');
      if(!submit&&!entry.submitted_at&&!(entry.created_by_user_id===s.userId&&(await c.query('select app_is_solo_owner() allowed')).rows[0]?.allowed))throw new ApiError(409,'time_not_submitted','Der Zeiteintrag muss zuerst eingereicht werden.');
      if(body.action==='reject'){
        const note=body.note?.trim();if(!note||note.length>2000)throw new ApiError(400,'review_note_required','Bitte eine Begründung eingeben.');
        if(entry.approved||entry.invoiced_invoice_id)throw new ApiError(409,'time_locked','Freigegebene oder verrechnete Zeiten können nicht zurückgewiesen werden.');
        const row=(await c.query('update time_entries set submitted_at=null,review_note=$3 where organization_id=$1 and id=$2 returning id,approved,submitted_at,review_note',[s.organizationId,id,note])).rows[0];
        await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'time.rejected',entityType:'time_entry',entityId:id});return row;
      }
      const result=await c.query(`update time_entries set ${submit?"submitted_at=coalesce(submitted_at,now()),approved=case when external_resource_id is null then app_is_solo_owner() else false end":"approved=true"} where organization_id=$1 and id=$2 and archived_at is null and approved=false and invoiced_invoice_id is null and ($3::boolean=false or created_by_user_id=$4) returning id,approved,billable,submitted_at`,[s.organizationId,id,submit,s.userId]);
      if(!result.rowCount)throw new ApiError(404,"time_entry_not_found","Zeiteintrag wurde nicht gefunden oder kann nicht freigegeben werden.");
      await audit(c,{organizationId:s.organizationId,userId:s.userId,action:submit?"time.submitted":"time.approved",entityType:"time_entry",entityId:id});
      return result.rows[0];
}
