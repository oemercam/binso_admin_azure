import 'server-only';
import type {PoolClient} from 'pg';
import type {SessionUser} from './session';
import {authorize} from './rbac';
import {ApiError} from './http';
import {audit} from './audit';
import {businessDate} from '@/lib/financial-status';
import {tenantCan} from '@/lib/permissions';
import {organizationPlanInTransaction} from './plan-access';
import {planAllowsModule} from '@/config/plan-access';

async function access(c:PoolClient,s:SessionUser){
 authorize(s,'sales:write');
 if(s.isDemo)throw new ApiError(403,'demo_write_disabled','Diese Aktion ist nicht verfügbar.');
 if(!planAllowsModule(await organizationPlanInTransaction(c,s.organizationId),'offerten'))throw new ApiError(403,'module_unavailable','Diese Funktion ist in deinem aktuellen Plan nicht enthalten.');
}
async function quote(c:PoolClient,s:SessionUser,number:string){
 const row=(await c.query('select id,quote_no,status,offer_version,valid_until from quotes where organization_id=$1 and quote_no=$2 and archived_at is null for update',[s.organizationId,number])).rows[0];
 if(!row)throw new ApiError(404,'not_found','Angebot nicht gefunden.');
 return row;
}
const dateValue=(value:unknown)=>value instanceof Date?value.toISOString().slice(0,10):String(value??'').slice(0,10);
function active(row:{status:string;valid_until:unknown},today:string){return row.status==='sent'&&(!row.valid_until||dateValue(row.valid_until)>=today);}
export async function offerFollowupHistory(c:PoolClient,s:SessionUser,number:string){
 await access(c,s);const row=await quote(c,s,number);
 const items=(await c.query(`select f.id,f.due_date::text,f.state,v.version from offer_followups f join offer_versions v on v.organization_id=f.organization_id and v.id=f.version_id where f.organization_id=$1 and f.user_id=$2 and v.quote_id=$3 order by f.created_at desc limit 20`,[s.organizationId,s.userId,row.id])).rows;
 return {eligible:active(row,businessDate()),currentVersion:row.offer_version,items};
}
export async function configureOfferFollowup(c:PoolClient,s:SessionUser,number:string,input:{action:'schedule'|'cancel';dueDate?:string;optIn?:boolean}){
 await access(c,s);const row=await quote(c,s,number);
 if(input.action==='cancel'){
  const changed=(await c.query(`update offer_followups f set state='cancelled',updated_at=now() from offer_versions v where f.organization_id=$1 and f.user_id=$2 and f.state='scheduled' and v.organization_id=f.organization_id and v.id=f.version_id and v.quote_id=$3 returning f.id`,[s.organizationId,s.userId,row.id])).rows;
  if(changed.length)await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.followup.cancelled',entityType:'quote',entityId:row.id,metadata:{count:changed.length}});
  return {ok:true};
 }
 const today=businessDate(),due=input.dueDate??'',parsed=new Date(due+'T12:00:00Z'),last=new Date(today+'T12:00:00Z');last.setUTCDate(last.getUTCDate()+365);
 if(input.optIn!==true||!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==due||due<today||parsed>last)throw new ApiError(400,'followup_invalid','Bitte die Erinnerung bestätigen und ein gültiges Datum wählen.');
 if(!active(row,today)||row.valid_until&&due>dateValue(row.valid_until))throw new ApiError(409,'offer_inactive','Für dieses Angebot ist keine Erinnerung möglich.');
 const version=(await c.query('select id from offer_versions where organization_id=$1 and quote_id=$2 and version=$3',[s.organizationId,row.id,row.offer_version])).rows[0];
 if(!version)throw new ApiError(409,'offer_not_issued','Bitte das Angebot zuerst ausstellen.');
 const saved=(await c.query(`insert into offer_followups(organization_id,version_id,user_id,due_date) values($1,$2,$3,$4) on conflict(organization_id,version_id,user_id) do update set due_date=excluded.due_date,state='scheduled',updated_at=now() where offer_followups.state in ('scheduled','cancelled') returning id`,[s.organizationId,version.id,s.userId,due])).rows[0];
 if(!saved)throw new ApiError(409,'followup_completed','Für diese Version wurde die Erinnerung bereits abgeschlossen.');
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'offer.followup.scheduled',entityType:'quote',entityId:row.id,metadata:{version:row.offer_version,dueDate:due,channel:'in_app',optIn:true}});
 return {ok:true};
}
/** Called by an explicit authenticated POST when opening notifications. No GET effects,
 * background-delivery claim, recipient mail, new privilege or automatic retry. */
export async function checkOfferFollowups(c:PoolClient,s:SessionUser){
 if(s.isDemo||s.organizationStatus==='read_only'||!tenantCan(s.role,'sales:write',s.moduleProfile))return {processed:0};
 const due=(await c.query(`select f.id,v.quote_id from offer_followups f join offer_versions v on v.organization_id=f.organization_id and v.id=f.version_id where f.organization_id=$1 and f.user_id=$2 and f.state='scheduled' and f.due_date<=$3::date order by v.quote_id,f.id limit 50`,[s.organizationId,s.userId,businessDate()])).rows;
 if(!due.length)return {processed:0};
 await access(c,s);
 let processed=0;
 for(const candidate of due){
  // Match the lock order of decisions/configuration: quote first, personal row second.
  const current=(await c.query('select status,quote_no,offer_version,valid_until,archived_at from quotes where organization_id=$1 and id=$2 for update',[s.organizationId,candidate.quote_id])).rows[0];
  const reminder=(await c.query(`select f.id,v.version from offer_followups f join offer_versions v on v.organization_id=f.organization_id and v.id=f.version_id where f.organization_id=$1 and f.user_id=$2 and f.id=$3 and f.state='scheduled' and f.due_date<=$4::date for update of f skip locked`,[s.organizationId,s.userId,candidate.id,businessDate()])).rows[0];
  if(!reminder)continue;
  const preference=(await c.query("select in_app from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote' for share",[s.organizationId,s.userId])).rows[0];
  const allowed=current&&!current.archived_at&&active(current,businessDate())&&current.offer_version===reminder.version&&preference?.in_app!==false;
  const notification=allowed?(await c.query("insert into in_app_notifications(organization_id,user_id,kind,title,body,href) values($1,$2,'system','Angebot nachfassen',$3,$4) returning id",[s.organizationId,s.userId,current.quote_no,'/angebote/'+encodeURIComponent(current.quote_no)])).rows[0]:null;
  await c.query('update offer_followups set state=$4,notification_id=$5,updated_at=now() where organization_id=$1 and user_id=$2 and id=$3',[s.organizationId,s.userId,reminder.id,allowed?'notified':'skipped',notification?.id??null]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:allowed?'offer.followup.notified':'offer.followup.skipped',entityType:'quote',entityId:candidate.quote_id,metadata:{version:reminder.version,channel:'in_app'}});processed++;
 }
 return {processed};
}
