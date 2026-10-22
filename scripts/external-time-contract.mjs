import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function verifyExternalTimeContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const routes=load('app/api/time-entries/route.ts'),detail=load('app/api/time-entries/[id]/route.ts'),options=load('app/api/time-entries/options/route.ts');
 const as=(role,organizationId=org,extra={})=>act(role,organizationId,{userId:'employee-dossier-'+(organizationId===other?'foreign':role),name:'Synthetic time actor',...extra});
 const initialPlan=(await db.query('select plan from organization_subscriptions where organization_id=$1',[org])).rows[0].plan;
 const initialOtherPlan=(await db.query('select plan from organization_subscriptions where organization_id=$1',[other])).rows[0].plan;
 const day=(await db.query('select current_date::text work_day')).rows[0].work_day;
 const beforeUsers=(await db.query('select count(*)::int n from app_users')).rows[0].n,beforeEmployees=(await db.query('select count(*)::int n from employees')).rows[0].n;
 const fixtures=[];
 for(const tenant of [org,other]){
  const supplier=(await db.query("insert into suppliers(organization_id,external_id,supplier_no,name,status) values($1,$2,$2,'Synthetic time supplier','active') returning id",[tenant,randomUUID()])).rows[0].id;
  const customer=(await db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,$2,$2,'Synthetic time customer') returning id",[tenant,randomUUID()])).rows[0].id;
  const project=(await db.query("insert into projects(organization_id,external_id,customer_id,name,status) values($1,$2,$3,'Synthetic time project','active') returning id",[tenant,randomUUID(),customer])).rows[0].id;
  const resource=(await db.query("insert into external_resources(organization_id,supplier_id,name,created_by_user_id) values($1,$2,'Synthetic external worker',$3) returning id",[tenant,supplier,tenant===org?'employee-dossier-owner':'employee-dossier-foreign'])).rows[0].id;
  const assignment=(await db.query("insert into external_resource_assignments(organization_id,resource_id,project_id,starts_on,created_by_user_id) values($1,$2,$3,current_date-1,$4) returning id",[tenant,resource,project,tenant===org?'employee-dossier-owner':'employee-dossier-foreign'])).rows[0].id;
  fixtures.push({supplier,customer,project,resource,assignment});
 }
 const f=fixtures[0];
 const body={externalAssignmentId:f.assignment,workDate:day,durationMinutes:1,description:'Synthetic external time',billable:true,timeCategory:'travel',isWorkTime:true,payrollRelevant:false};
 const create=(body,key=randomUUID())=>routes.POST(request(body,key));
 const patch=(id,body)=>detail.PATCH(request(body,randomUUID(),'PATCH'),{params:Promise.resolve({id})});
 const list=(project=f.project)=>options.GET(new (request({}).constructor)('https://employee.invalid/api/time-entries/options?kind=external&projectId='+project+'&workDate='+day));
 as('owner');const key=randomUUID();let response=await create(body,key);assert.equal(response.status,201,await response.clone().text());const entry=(await response.json()).item;
 assert.equal(entry.duration_minutes,1);assert.equal(entry.payroll_relevant,false);assert.equal(entry.approved,false);assert.equal(entry.submitted_at,null);assert.equal(entry.external_resource_id,f.resource);
 let stored=(await db.query('select * from time_entries where id=$1',[entry.id])).rows[0];assert.equal(stored.employee_id,null);assert.equal(stored.worker_type,'external');assert.equal(stored.supplier_id,f.supplier);assert.equal(stored.hours,'0.016667');assert.equal(stored.recorded_duration_minutes,1);
 assert.equal((await (await create(body,key)).json()).item.id,entry.id);assert.equal((await create({...body,durationMinutes:2},key)).status,409);
 for(const change of [{durationMinutes:0},{durationMinutes:1.5},{durationMinutes:1441},{workDate:'2026-02-30'},{payrollRelevant:true},{employeeId:randomUUID()},{salesRate:'100'},{supplierId:fixtures[1].supplier},{timeCategory:'salary'}])assert.equal((await create({...body,...change})).status,400);
 assert.equal((await create({...body,externalAssignmentId:fixtures[1].assignment})).status,403);
 assert.equal((await patch(entry.id,{action:'approve'})).status,403,'No external creator self approval');
 response=await patch(entry.id,{action:'correct',durationMinutes:61,description:'Corrected external time'});assert.equal(response.status,200,await response.clone().text());
 stored=(await db.query('select hours,recorded_duration_minutes from time_entries where id=$1',[entry.id])).rows[0];assert.equal(stored.hours,'1.016667');assert.equal(stored.recorded_duration_minutes,61);
 const workspace=await routes.GET(new (request({}).constructor)('https://employee.invalid/api/time-entries?projectId='+f.project));const page=await workspace.json();assert.equal(page.total_minutes,61);assert.equal(Number(page.items[0].duration_minutes),61,'Do not turn rounded decimal hours into fractional minutes');
 as('admin');assert.equal((await patch(entry.id,{action:'approve'})).status,409,'Must submit first');
 as('owner');assert.equal((await patch(entry.id,{action:'submit'})).status,200);
 assert.equal((await patch(entry.id,{action:'correct',durationMinutes:60,description:'Locked'})).status,403);
 as('admin');assert.equal((await patch(entry.id,{action:'reject',note:'Correct source'})).status,200);
 as('owner');assert.equal((await patch(entry.id,{action:'correct',durationMinutes:120,description:'Resubmitted'})).status,200);assert.equal((await patch(entry.id,{action:'submit'})).status,200);
 as('admin');assert.equal((await patch(entry.id,{action:'approve'})).status,200);
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query('update time_entries set payroll_relevant=true where id=$1',[entry.id])),e=>e.code==='42501');
 await assert.rejects(()=>transaction(org,'employee-dossier-admin',c=>c.query('update time_entries set hours=3,recorded_duration_minutes=180 where id=$1',[entry.id])),e=>e.code==='42501');
 await assert.rejects(()=>transaction(org,'employee-dossier-admin',c=>c.query('update time_entries set archived_at=now() where id=$1',[entry.id])),e=>e.code==='42501');
 assert.equal((await transaction(org,'employee-dossier-owner',c=>c.query('delete from time_entries where id=$1',[entry.id]))).rowCount,0,'External history cannot be physically deleted');
 await assert.rejects(()=>transaction(org,'employee-dossier-admin',c=>c.query('update time_entries set invoiced_invoice_id=$2 where id=$1',[entry.id,randomUUID()])),e=>e.code==='42501');
 const invoice=(await db.query("insert into invoices(organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status) values($1,$2,$2,$3,current_date,current_date+30,'draft') returning id",[org,randomUUID(),f.customer])).rows[0].id;
 const line=(await db.query("insert into invoice_lines(organization_id,invoice_id,external_id,description,quantity,unit,unit_price) values($1,$2,$3,'Synthetic allocation guard',1,'h',125) returning id",[org,invoice,randomUUID()])).rows[0].id;
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query('insert into invoice_line_time_entries(organization_id,invoice_line_id,time_entry_id) values($1,$2,$3)',[org,line,entry.id])),e=>e.code==='42501','No zero-price or unqualified external invoice link');
 as('owner');const billing=await load('app/api/time-entries/billing/route.ts').GET(new (request({}).constructor)('https://employee.invalid/api/time-entries/billing?ids='+entry.id));assert.equal(billing.status,200);assert.deepEqual((await billing.json()).items,[],'Unqualified external source is absent from the legacy billing picker');
 const copySql=`insert into time_entries(organization_id,external_id,project_id,customer_id,supplier_id,person_name,project_label,worker_type,work_date,hours,description,billable,created_by_user_id,external_resource_id,external_assignment_id,recorded_duration_minutes,time_category,is_work_time,payroll_relevant)
  select organization_id,$2,project_id,customer_id,supplier_id,person_name,project_label,worker_type,work_date,hours,description,billable,'employee-dossier-owner',external_resource_id,$3::uuid,$4::integer,time_category,is_work_time,payroll_relevant from time_entries where id=$1`;
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query(copySql,[entry.id,randomUUID(),f.assignment,null])),e=>e.code==='23514','Direct SQL cannot exploit nullable CHECK semantics');
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query(copySql,[entry.id,randomUUID(),fixtures[1].assignment,120])),e=>e.code==='42501','Database independently rejects the foreign assignment');
 as('owner');assert.equal((await list()).status,200);assert.deepEqual((await (await list()).json()).items.map(r=>r.id),[f.assignment]);
 const managerEmployee=(await db.query("select id from employees where organization_id=$1 and user_id='employee-dossier-project_manager'",[org])).rows[0].id;
 await db.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,project_id,starts_on,created_by_user_id) values($1,'employee-dossier-project_manager',$2,$3,$4,current_date-1,'employee-dossier-owner')",[org,managerEmployee,f.customer,f.project]);
 as('project_manager');assert.equal((await list()).status,200);response=await create({...body,durationMinutes:15});assert.equal(response.status,201,await response.clone().text());
 const internal={projectId:f.project,customerId:f.customer,startedAt:day+'T12:00:00Z',durationMinutes:30,description:'Synthetic own time classification',billable:false,timeCategory:'travel',isWorkTime:true,payrollRelevant:true};
 response=await create(internal);assert.equal(response.status,201,await response.clone().text());const proposed=(await response.json()).item;assert.equal(proposed.payroll_relevant,true);assert.equal(proposed.is_work_time,true);assert.equal(proposed.time_category,'travel');assert.equal(proposed.billable,false);assert.equal(proposed.approved,false,'Payroll proposal is independent of billing and review');
 const legacy={...internal};delete legacy.timeCategory;delete legacy.isWorkTime;delete legacy.payrollRelevant;response=await create(legacy);assert.equal(response.status,201);assert.equal((await response.json()).item.payroll_relevant,null,'No payroll inference for older clients');
 assert.equal((await create({...legacy,timeCategory:'work'})).status,400,'Incomplete classification is never inferred');
 await db.query("update organization_memberships set role='member',module_profile='time_only' where organization_id=$1 and user_id='employee-dossier-project_manager'",[org]);assert.equal((await create(body)).status,403,'Actual membership beats a stale standard session');
 await db.query("update organization_memberships set role='project_manager',module_profile='standard' where organization_id=$1 and user_id='employee-dossier-project_manager'",[org]);
 as('manager');assert.deepEqual((await (await list()).json()).items,[]);assert.equal((await create(body)).status,403,'Unassigned project manager denied');
 for(const role of ['member','reader','hr','finance']){as(role);assert.equal((await create(body)).status,403);assert.equal((await list()).status,403);}
 as('owner',org,{moduleProfile:'time_only'});assert.equal((await create(body)).status,403);
 as('owner',org,{organizationStatus:'read_only'});assert.equal((await create(body)).status,403);
 as('owner',other);assert.equal((await create(body)).status,403);assert.equal((await transaction(other,'employee-dossier-foreign',c=>c.query('select id from time_entries where id=$1',[entry.id]))).rows.length,0);
 // The sole owner rule for internal personal time never approves external facts.
 await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[other]);
 assert.equal((await transaction(other,'employee-dossier-foreign',c=>c.query('select app_is_solo_owner() allowed'))).rows[0].allowed,true,'Actual sole-owner fixture');
 response=await create({...body,externalAssignmentId:fixtures[1].assignment});assert.equal(response.status,201,await response.clone().text());const solo=(await response.json()).item;
 response=await patch(solo.id,{action:'submit'});assert.equal(response.status,200);assert.equal((await response.json()).item.approved,false);
 assert.equal((await patch(solo.id,{action:'approve'})).status,403);
 await assert.rejects(()=>transaction(other,'employee-dossier-foreign',c=>c.query('update time_entries set approved=true where id=$1',[solo.id])),e=>e.code==='42501');
 as('owner');await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);assert.equal((await create(body)).status,403);assert.equal((await list()).status,403);
 assert.equal((await transaction(org,'employee-dossier-owner',c=>c.query("select response_json from business_idempotency_keys where operation='time.external.create'"))).rows.length,0,'Replay obeys current module entitlement');
 await db.query('update organization_subscriptions set plan=$2 where organization_id=$1',[org,initialPlan]);
 await db.query('update external_resources set active=false where id=$1',[f.resource]);assert.equal((await create(body)).status,403);await db.query('update external_resources set active=true where id=$1',[f.resource]);
 await db.query("update projects set status='completed' where id=$1",[f.project]);assert.equal((await create(body)).status,409);await db.query("update projects set status='active' where id=$1",[f.project]);
 const count=(await db.query('select count(*)::int n from time_entries')).rows[0].n;setAuditFailure(true);assert.equal((await create(body)).status,500);setAuditFailure(false);assert.equal((await db.query('select count(*)::int n from time_entries')).rows[0].n,count);
 await transaction(org,'employee-dossier-owner',c=>c.query('update external_resource_assignments set revoked_at=now(),revoked_by_user_id=$2 where id=$1',[f.assignment,'employee-dossier-owner']));assert.equal((await create(body)).status,403,'Revocation stops new capture');
 assert.equal((await db.query('select count(*)::int n from app_users')).rows[0].n,beforeUsers);assert.equal((await db.query('select count(*)::int n from employees')).rows[0].n,beforeEmployees);
 await db.query('update organization_subscriptions set plan=$2 where organization_id=$1',[other,initialOtherPlan]);
 console.log('External time: actual create/correct/submit/reject/independent approval, exact minutes, no payroll or automatic billing, replay, current assignments, role/tenant/plan boundaries and audit rollback passed.');
}
