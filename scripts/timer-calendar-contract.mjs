import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function verifyTimerCalendar({load,db,transaction,act,request,setAuditFailure,getSqlError,setTimerClock}){
 const org=randomUUID(),user='timer-calendar-owner',route=load('app/api/time-tracker/route.ts');
 await db.query("insert into organizations(id,name,slug,status) values($1,'Timer calendar',$2,'active')",[org,'timer-'+org]);
 await db.query("insert into app_users(id,email,display_name,status) values($1,'timer-calendar@example.invalid','Timer owner','active')",[user]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'timer-calendar@example.invalid','owner','active')",[org,user]);
 act('owner',org,{userId:user,name:'Timer owner'});
 await db.query("insert into active_time_trackers(organization_id,user_id,state,active_since,project_label) values($1,$2,'running','2026-10-31T22:50:00Z','Synthetic timer')",[org,user]);
 // Controlled database clock at the connection boundary; a wildly different
 // application clock must not change the persisted Swiss working dates.
 setTimerClock(Date.parse('2026-10-31T23:10:00Z'));
 const originalNow=Date.now;Date.now=()=>0;
 try{
  const pause=await route.POST(request({action:'pause'}));assert.equal(pause.status,200,await pause.clone().text());
  const state=(await pause.json()).tracker;assert.equal(Number(state.accumulated_seconds),1200);
  assert.deepEqual(state.day_seconds,{'2026-10-31':600,'2026-11-01':600},'Pause persists the two actual Swiss dates');
  setAuditFailure(true);assert.equal((await route.POST(request({action:'finish'}))).status,500);setAuditFailure(false);
  assert.equal((await db.query('select count(*)::int n from time_entries where organization_id=$1',[org])).rows[0].n,0,'Failed audit rolls back every daily entry');
  assert.equal((await db.query('select count(*)::int n from active_time_trackers where organization_id=$1',[org])).rows[0].n,1,'Failed finish retains the timer');
  const finished=await route.POST(request({action:'finish'}));assert.equal(finished.status,200,(await finished.clone().text())+' '+JSON.stringify(getSqlError?.()));
  const items=(await finished.json()).items;assert.equal(items.length,2);
  const persisted=(await db.query('select work_date::text date,hours from time_entries where organization_id=$1 order by work_date',[org])).rows;
  assert.deepEqual(persisted.map(row=>row.date),['2026-10-31','2026-11-01']);
  assert.ok(persisted.every(row=>Math.abs(Number(row.hours)*3600-600)<0.003),'Stored hours preserve each daily interval at existing database precision');
  assert.equal((await transaction(org,user,c=>c.query('select * from active_time_trackers'))).rows.length,0);
  await db.query("insert into active_time_trackers(organization_id,user_id,state,started_at,accumulated_seconds,project_label) values($1,$2,'paused','2026-10-29T09:00:00Z',1800,'Legacy timer')",[org,user]);
  assert.equal((await route.POST(request({action:'finish'}))).status,409,'Undated legacy pauses are never assigned automatically');
  assert.equal((await route.POST(request({action:'finish',legacyDays:[{date:'2026-10-30',seconds:1799}]}))).status,400);
  const legacy=await route.POST(request({action:'finish',legacyDays:[{date:'2026-10-29',seconds:600},{date:'2026-10-30',seconds:1200}]}));
  assert.equal(legacy.status,200,await legacy.clone().text());assert.equal((await legacy.json()).items.length,2);
 }finally{Date.now=originalNow;setTimerClock(null);setAuditFailure(false);}
 console.log('Actual timer API: dated pause checkpoints, atomic daily entries, audit rollback, retained legacy state and explicit date confirmation passed.');
}
