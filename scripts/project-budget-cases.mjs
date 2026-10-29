import assert from 'node:assert/strict';
/** Actual routes and restricted-runtime RLS inside the existing disposable fixture. */
export async function verifyProjectBudgets({db,load,request,current,foreignOrganizationId}){
 const projects=await import(await load('app/api/projects/route.ts')),detail=await import(await load('app/api/projects/[id]/route.ts'));
 const {tenantCan}=await import(await load('lib/permissions.ts'));
 const org=current.organizationId,user=current.userId,organizationStatus=(await db.query('select status from organizations where id=$1',[org])).rows[0].status;
 const context=id=>({params:Promise.resolve({id})});let id;
 const ddl=sql=>db.exec?db.exec(sql):db.query(sql);
 try{
  const created=await projects.POST(request('POST',{name:'V8 isolated budget project',customerId:''},'https://example.invalid/api/projects'));assert.equal(created.status,201);id=(await created.json()).item.id;assert.ok(id);
  const get=async()=>(await (await detail.GET(request('GET',null),context(id))).json()).item;
  const patch=body=>detail.PATCH(request('PATCH',body,'https://example.invalid/api/projects/'+id),context(id));
  let item=await get();assert.equal(item.hours_budget,null,'New projects have no inferred zero-hour budget');assert.equal(item.cost_budget,null);
  const body={name:item.name,status:item.status,notes:'',hoursBudget:null,costBudget:'0.00',budgetCurrency:'CHF',version:item.version};
  assert.equal((await patch(body)).status,200);item=await get();assert.equal(item.hours_budget,null);assert.equal(Number(item.cost_budget),0,'A deliberately entered zero is retained');assert.equal(item.budget_currency,'CHF');
  assert.equal((await patch({...body,hoursBudget:'0',version:item.version})).status,200);item=await get();assert.equal(Number(item.hours_budget),0,'An explicitly zero-hour budget remains different from missing');
  assert.equal((await patch({...body,costBudget:'999',version:body.version})).status,409,'Stale root versions cannot overwrite budgets');assert.equal(Number((await get()).cost_budget),0);
  for(const invalid of [false,-1,'-1','1.001','NaN','Infinity',{},[]])assert.equal((await patch({...body,costBudget:invalid,version:item.version})).status,400);
  assert.equal((await patch({...body,hoursBudget:'1000000.01',version:item.version})).status,400);assert.equal((await patch({...body,budgetCurrency:'USD',version:item.version})).status,400);
  for(const budgetCurrency of [null,['CHF'],{},1,true])assert.equal((await patch({...body,budgetCurrency,version:item.version})).status,400);
  assert.equal((await patch({...body,hoursBudget:'2.50',costBudget:'100.25',version:item.version})).status,200);item=await get();assert.equal(Number(item.hours_budget),2.5);assert.equal(Number(item.cost_budget),100.25);
  assert.equal((await patch({...body,hoursBudget:'2.50',costBudget:'100.25',budgetCurrency:'EUR',version:item.version})).status,200);item=await get();assert.equal(item.budget_currency,'EUR');
  const {budgetCurrency:omittedCurrency,...costOnly}=body;assert.equal(omittedCurrency,'CHF');assert.equal((await patch({...costOnly,hoursBudget:'2.50',costBudget:'100.25',version:item.version})).status,200);item=await get();assert.equal(item.budget_currency,'EUR','Omitting currency must not relabel an existing EUR budget as CHF');
  assert.equal((await patch({name:item.name,status:item.status,notes:'',budgetCurrency:'CHF',version:item.version})).status,400,'A currency change requires an explicit amount');
  assert.equal((await patch({name:item.name,status:item.status,notes:'Only notes changed',version:item.version})).status,200);item=await get();assert.equal(Number(item.hours_budget),2.5);assert.equal(Number(item.cost_budget),100.25,'An omitted budget is preserved by partial-compatible updates');
  for(const role of ['admin','finance','reader','manager','project_manager','hr','member']){
   await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[role,org,user]);
   // This internal project has no workforce assignment. Existing restrictive
   // project RLS must continue hiding it from scoped manager/member roles.
   const unassigned=['manager','project_manager','member'].includes(role);
   const response=await detail.GET(request('GET',null),context(id));assert.equal(response.status,tenantCan(role,'projects:read')?(unassigned?404:200):403,'Budget read preserves role and workforce scope for '+role);
   if(response.ok){const visible=(await response.json()).item;assert.equal(visible.cost_budget===null,!tenantCan(role,'finance-overview:read'),'Cost planning follows the canonical financial grant for '+role);}
   const write=await patch({...body,hoursBudget:'2.50',costBudget:'100.25',budgetCurrency:'EUR',version:item.version});assert.equal(write.status,tenantCan(role,'projects:write')&&tenantCan(role,'finance-overview:read')?(unassigned?404:200):403,'Budget write preserves existing grants and workforce scope for '+role);
   if(write.ok)item={...item,...(await write.json()).item};
  }
  await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  assert.equal((await patch({...body,hoursBudget:'',costBudget:'',version:item.version})).status,200);item=await get();assert.equal(item.hours_budget,null);assert.equal(item.cost_budget,null,'Empty and zero have distinct stored states');
  await db.query("update organization_memberships set role='member' where organization_id=$1 and user_id=$2",[org,user]);assert.equal((await patch({...body,version:item.version})).status,403);await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  await db.query("update organizations set status='read_only' where id=$1",[org]);assert.equal((await patch({...body,version:item.version})).status,403);await db.query('update organizations set status=$1 where id=$2',[organizationStatus,org]);
  const foreign=(await db.query("insert into projects(organization_id,external_id,name) values($1,gen_random_uuid()::text,'Foreign budget fixture') returning id",[foreignOrganizationId])).rows[0].id;
  try{assert.equal((await detail.GET(request('GET',null),context(foreign))).status,404);await assert.rejects(()=>globalThis.__registrationTransaction(async c=>{await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,user]);return c.query('insert into project_financial_budgets(organization_id,project_id,cost_budget,updated_by_user_id) values($1,$2,10,$3)',[foreignOrganizationId,foreign,user]);}),error=>error.code==='42501'||error.code==='23503');}finally{await db.query('delete from projects where id=$1',[foreign]);}
  await ddl("create function v8_budget_fixture_fail() returns trigger language plpgsql as $$begin if new.action='project.updated' then raise exception 'isolated budget audit failure';end if;return new;end$$;create trigger v8_budget_fixture_fail before insert on audit_events for each row execute function v8_budget_fixture_fail()");
  const version=item.version;assert.equal((await patch({...body,hoursBudget:'5',costBudget:'200',version})).status,500);item=await get();assert.equal(item.version,version);assert.equal(item.hours_budget,null);assert.equal(item.cost_budget,null,'Audit failure rolls back the root and financial budget together');
 }finally{
  await ddl('drop trigger if exists v8_budget_fixture_fail on audit_events;drop function if exists v8_budget_fixture_fail()');
  await db.query('update organizations set status=$1 where id=$2',[organizationStatus,org]);await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  if(id)await db.query('delete from projects where id=$1',[id]);
 }
 console.log('V8 project budgets: actual routes, absent/zero/omitted values, exact input bounds, stale versions, roles/read-only, tenant RLS and atomic audit rollback passed. No legacy value rewritten.');
}
