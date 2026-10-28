import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Independent HTTP expectations: never import the permission helper under test.
export async function verifyAdditionalHttpReads({pool,base,get,cookies,roles,organizations,customer,project,employee}){
 const covered=new Set(),finance=['owner','admin','finance'],contracts=[...finance,'project_manager','manager','reader'];
 const check=async(pattern,path,allowed,positive=()=>{})=>{
  for(const role of roles){const r=await get(path,cookies.get('0:'+role));assert.equal(r.status,allowed.includes(role)?200:403,role+' GET '+path+': '+JSON.stringify(r.data));if(r.status===200)positive(r.data,role);}
  covered.add(pattern);
 };
 const mutation=async(path,body,method='POST',tenant=0,actor='owner')=>{const r=await fetch(base+path,{method,headers:{cookie:cookies.get(tenant+':'+actor),origin:base,'content-type':'application/json','idempotency-key':randomUUID()},body:JSON.stringify(body)});const data=await r.json();assert.equal(r.status,method==='POST'?201:200,path+': '+JSON.stringify(data));return data;};
 await check('/api/auth/sensitive-access','/api/auth/sensitive-access',roles,d=>assert.deepEqual(d.capabilities,[]));
 await check('/api/notifications/push','/api/notifications/push',roles,d=>{assert.equal(d.registered,false);assert.equal(d.stored,false);});
 await check('/api/settings/security','/api/settings/security',['owner','admin'],d=>assert.deepEqual(d.item,{required:false,loginMethod:'password'}));
 const memberPath='/api/settings/team/members/http-0-member/sensitive-access';
 await check('/api/settings/team/members/[userId]/sensitive-access',memberPath,['owner','admin'],d=>{assert.equal(d.item.user_id,'http-0-member');assert.deepEqual(d.item.sensitive_grants,[]);});
 assert.equal((await get(memberPath,cookies.get('1:owner'))).status,404);
 for(const role of roles){
  let own=(await pool.query('select id from employees where organization_id=$1 and user_id=$2',[organizations[0],'http-0-'+role])).rows[0];
  if(!own)own=(await pool.query("insert into employees(organization_id,external_id,name,email,role,employment_type,user_id) values($1,$2,$2,$3,'employee','hourly',$4) returning id",[organizations[0],'http-context-'+role,'context-'+role+'@fixture.invalid','http-0-'+role])).rows[0];
  if(role==='member')await mutation('/api/employees/'+own.id+'/employment',{startsOn:'2026-01-01',endsOn:'2026-12-31',workloadPercent:80,weeklyHours:32,vacationDays:25,jobTitle:'Synthetic HTTP absence period',workLocation:'Bern'});
  const path='/api/absences/context?employeeId='+own.id,r=await get(path,cookies.get('0:'+role));assert.equal(r.status,200,role+' own absence context');assert.ok(Array.isArray(r.data.items));if(role==='member'){assert.equal(r.data.items.length,1);assert.equal(r.data.items[0].job_title,'Synthetic HTTP absence period');assert.equal(r.data.items[0].starts_on,'2026-01-01');}
  assert.equal((await get(path,cookies.get('1:'+role))).status,404,role+' foreign absence context');
  assert.equal((await get('/api/absences/context?employeeId='+randomUUID(),cookies.get('0:'+role))).status,404);
  const list=await get('/api/absences',cookies.get('0:'+role));assert.equal(list.status,200);assert.equal(list.data.ownEmployeeId,own.id);assert.equal(list.data.mayReadTeam,false);
  assert.equal((await get('/api/absences?scope=team',cookies.get('0:'+role))).status,403,'No implicit sensitive grant for '+role);
 }
 covered.add('/api/absences/context');covered.add('/api/absences');
 for(const suffix of ['family','wages'])for(const role of roles)assert.equal((await get('/api/employees/'+employee.id+'/'+suffix,cookies.get('0:'+role))).status,403,'No implicit '+suffix+' grant for '+role);
 const hrPath='/api/settings/team/members/http-0-hr/sensitive-access';const before=await get(hrPath,cookies.get('0:owner'));
 await mutation(hrPath,{grants:['family:read','hr_sensitive:read'],expectedRevision:before.data.item.sensitive_grants_version},'PATCH');
 const foreignHrPath='/api/settings/team/members/http-1-hr/sensitive-access',foreignBefore=await get(foreignHrPath,cookies.get('1:owner'));await mutation(foreignHrPath,{grants:['family:read','hr_sensitive:read'],expectedRevision:foreignBefore.data.item.sensitive_grants_version},'PATCH',1);
 const teamContext=await get('/api/absences/context?employeeId='+employee.id,cookies.get('0:hr'));assert.equal(teamContext.status,200);assert.equal((await get('/api/absences/context?employeeId='+employee.id,cookies.get('1:hr'))).status,404,'Even a separately granted foreign HR reader cannot read periods');
 for(const suffix of ['family','wages']){
  const path='/api/employees/'+employee.id+'/'+suffix,r=await get(path,cookies.get('0:hr'));assert.equal(r.status,200,JSON.stringify(r.data));assert.ok(Array.isArray(r.data[suffix==='family'?'children':'items']));assert.equal((await get(path,cookies.get('1:hr'))).status,404);covered.add('/api/employees/[id]/'+suffix);
 }
 const foreignChanged=await get(foreignHrPath,cookies.get('1:owner'));await mutation(foreignHrPath,{grants:[],expectedRevision:foreignChanged.data.item.sensitive_grants_version},'PATCH',1);
 const changed=await get(hrPath,cookies.get('0:owner'));await mutation(hrPath,{grants:[],expectedRevision:changed.data.item.sensitive_grants_version},'PATCH');
 await check('/api/employees/[id]/employment','/api/employees/'+employee.id+'/employment',['owner','admin','hr'],d=>assert.ok(Array.isArray(d.items)));
 assert.equal((await get('/api/employees/'+employee.id+'/employment',cookies.get('1:owner'))).status,404);
 const supplier=(await mutation('/api/suppliers',{name:'Synthetic HTTP inventory supplier'})).item;
 const ap=(await mutation('/api/suppliers/'+supplier.id+'/invoices',{})).item;
 const resource=(await mutation('/api/suppliers/'+supplier.id+'/resources',{name:'Synthetic HTTP external resource',roleLabel:'',active:true})).item;
 const assignment=(await mutation('/api/suppliers/'+supplier.id+'/resources/'+resource.id+'/assignments',{projectId:project.id,startsOn:'2000-01-01',endsOn:'2099-12-31'})).item;
 const day=(await pool.query('select current_date::text as work_day')).rows[0].work_day;
 const time=(await mutation('/api/time-entries',{externalAssignmentId:assignment.id,workDate:day,durationMinutes:1,description:'Synthetic HTTP pricing source',billable:true,timeCategory:'work',isWorkTime:true,payrollRelevant:false})).item;
 await mutation('/api/time-entries/'+time.id,{action:'submit'},'PATCH');await mutation('/api/time-entries/'+time.id,{action:'approve'},'PATCH',0,'admin');
 await check('/api/time-entries/[id]/pricing','/api/time-entries/'+time.id+'/pricing',finance,d=>{assert.equal(d.time.id,time.id);assert.equal(d.item,null);});
 assert.equal((await get('/api/time-entries/'+time.id+'/pricing',cookies.get('1:owner'))).status,404);
 const projectCustomer=(await pool.query('select customer_id from projects where id=$1',[project.id])).rows[0].customer_id;
 const agreement=(await pool.query("insert into billing_agreements(organization_id,customer_id,scope_kind,scope_id,currency,terms,created_by_user_id) values($1,$2,'project',$3,'CHF',$4,'http-0-owner') returning id",[organizations[0],projectCustomer,project.id,{revision:1,model:'time',currency:'CHF',hourlyRate:'125.00'}])).rows[0];
 await check('/api/documents/billing-agreements/[id]','/api/documents/billing-agreements/'+agreement.id,finance,d=>{assert.equal(d.item.id,agreement.id);assert.equal(d.item.terms.hourlyRate,'125.00');});
 assert.equal((await get('/api/documents/billing-agreements/'+agreement.id,cookies.get('1:owner'))).status,409);
 await check('/api/suppliers','/api/suppliers',finance,d=>assert.ok(d.items.some(i=>i.id===supplier.id)));
 await check('/api/suppliers/approval-policy','/api/suppliers/approval-policy',finance);
 for(const [suffix,pattern] of [['','/api/suppliers/[id]'],['/bank','/api/suppliers/[id]/bank'],['/resources','/api/suppliers/[id]/resources'],['/invoices','/api/suppliers/[id]/invoices'],['/invoices/'+ap.id+'/review','/api/suppliers/[id]/invoices/[invoiceId]/review'],['/invoices/'+ap.id+'/match?from=2026-01-01&until=2026-01-31','/api/suppliers/[id]/invoices/[invoiceId]/match']]){
  const path='/api/suppliers/'+supplier.id+suffix;await check(pattern,path,suffix==='/resources'?['owner','admin','project_manager','manager']:finance);assert.equal((await get(path,cookies.get('1:owner'))).status,404,'Foreign supplier child '+suffix);
 }
 const contract=(await mutation('/api/contracts',{name:'Synthetic HTTP sale agreement',side:'sale',partyId:projectCustomer,projectId:project.id,startsOn:'2026-01-01',endsOn:'2026-12-31',noticeDays:30,billingInterval:'monthly',notes:''})).item;
 await check('/api/contracts','/api/contracts',contracts,d=>assert.ok(Array.isArray(d.items)));
 await check('/api/contracts/[id]','/api/contracts/'+contract.id,contracts,d=>assert.equal(d.item.id,contract.id));
 assert.equal((await get('/api/contracts/'+contract.id,cookies.get('1:owner'))).status,404);
 await check('/api/documents/advances','/api/documents/advances?customerId='+customer.id,[...finance,'reader'],d=>assert.ok(Array.isArray(d.items)));
 // Missing sources must be hidden, not accidentally accepted by a generic 200.
 for(const [pattern,path,allowed,missingStatus=404] of [['/api/documents/billing-agreements/[id]','/api/documents/billing-agreements/'+randomUUID(),finance,409],['/api/time-entries/[id]/pricing','/api/time-entries/'+randomUUID()+'/pricing',finance]]){
  for(const role of roles){const r=await get(path,cookies.get('0:'+role));assert.equal(r.status,allowed.includes(role)?missingStatus:403,role+' missing source '+path+': '+JSON.stringify(r.data));}covered.add(pattern);
 }
 console.log('Additional native HTTP GET contracts: '+covered.size+' endpoints; all eight roles, self-service, explicit sensitive grants, source absence and foreign tenant boundaries passed.');
 return covered;
}


