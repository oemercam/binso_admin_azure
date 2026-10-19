import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

// Real migrated PostgreSQL and the restricted runtime role. Synthetic data only.
const db=new PGlite({extensions:{pgcrypto}}),org=randomUUID(),other=randomUUID();
const owner='workforce-owner',member='workforce-member',reviewer='workforce-reviewer';
try{
 await db.exec('create extension pgcrypto');
 for(const name of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+name,'utf8'));
 await db.exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 for(const id of [org,other])await db.query("insert into organizations(id,name,slug) values($1,'Synthetic workforce',$2)",[id,'wf-'+id]);
 for(const [user,role] of [[owner,'owner'],[member,'member'],[reviewer,'admin']]){
  await db.query("insert into app_users(id,email,display_name,status) values($1,$2,'Synthetic','active')",[user,user+'@example.invalid']);
  await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,$4,'active')",[org,user,user+'@example.invalid',role]);
 }
 const employee=(await db.query("insert into employees(organization_id,external_id,name,email,role,employment_type,user_id) values($1,'wf-worker','Synthetic worker','wf-worker@example.invalid','employee','hourly',$2) returning id",[org,member])).rows[0].id;
 const customers=[];
 for(const tenant of [org,org,other])customers.push((await db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,$2,$2,'Synthetic customer') returning id",[tenant,randomUUID()])).rows[0].id);
 const project=(await db.query("insert into projects(organization_id,external_id,customer_id,name,status) values($1,'wf-order',$2,'Synthetic order','active') returning id",[org,customers[0]])).rows[0].id;
 const grant=(await db.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,project_id,starts_on,created_by_user_id) values($1,$2,$3,$4,$5,current_date-365,$6) returning id",[org,member,employee,customers[0],project,owner])).rows[0].id;
 await db.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,starts_on,ends_on,created_by_user_id) values($1,$2,$3,$4,'2000-01-01','2001-01-01',$5)",[org,member,employee,customers[1],owner]);
 await assert.rejects(()=>db.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,project_id,created_by_user_id) values($1,$2,$3,$4,$5,$6)",[org,member,employee,customers[1],project,owner]),error=>error.code==='23514');
 const files=[];
 for(const customer of customers.slice(0,2)){
  const id=(await db.query("insert into file_objects(organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,purpose,customer_id) values($1,$2,'Synthetic.txt','text/plain',4,$3,'clean',$4,'customer_document',$5) returning id",[org,org+'/'+randomUUID(),createHash('sha256').update('test').digest('hex'),owner,customer])).rows[0].id;
  await db.query('insert into file_contents(file_id,organization_id,body) values($1,$2,$3)',[id,org,Buffer.from('test')]);files.push(id);
 }
 const run=async(user,fn)=>{await db.exec('begin');try{await db.exec('set local role binso_runtime');await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,user]);const result=await fn();await db.exec('commit');return result;}catch(error){await db.exec('rollback');throw error}};
 const query=(sql,args=[])=>db.query(sql,args);
 assert.deepEqual((await run(member,()=>query('select id from customers'))).rows.map(x=>x.id),[customers[0]]);
 assert.equal((await run(member,()=>query('select id from customers where id=$1',[customers[1]]))).rows.length,0,'Direct unassigned ID is invisible');
 assert.equal((await run(member,()=>query('select id from file_objects where id=$1',[files[0]]))).rows.length,1,'Assigned attachment metadata is visible');
 assert.equal((await run(member,()=>query('select body from file_contents where file_id=$1',[files[1]]))).rows.length,0,'Direct file-content access cannot bypass assignment');
 assert.equal((await run(owner,()=>query('select id from customers where id=$1',[customers[2]]))).rows.length,0,'Admin remains tenant-fenced');
 await assert.rejects(()=>run(member,()=>query("insert into customers(organization_id,external_id,customer_no,name) values($1,'forbidden-customer','forbidden-customer','Forbidden')",[org])),error=>error.code==='42501');
 await assert.rejects(()=>run(member,()=>query('update employees set user_id=$2 where id=$1',[employee,reviewer])),error=>error.code==='42501','Employees cannot rebind their user identity');
 assert.equal((await run(member,()=>query('select app_workforce_access($1,$2,current_date,true) allowed',[customers[0],project]))).rows[0].allowed,true);
 assert.equal((await run(member,()=>query('select app_workforce_access($1,null,current_date,true) allowed',[customers[0]]))).rows[0].allowed,false,'Order access cannot become a direct customer grant');
 assert.equal((await run(member,()=>query('update workforce_assignments set revoked_at=now() where id=$1 returning id',[grant]))).rows.length,0,'Members cannot revoke grants');
 const insertTime=(customer,order,month=null,date=null)=>query("insert into time_entries(organization_id,external_id,employee_id,customer_id,project_id,person_name,worker_type,work_date,hours,description,created_by_user_id,report_month) values($1,$2,$3,$4,$5,'Synthetic worker','employee',coalesce($6::date,current_date),$7,'Synthetic work',$8,$9) returning id",[org,randomUUID(),employee,customer,order,date??month,month?198:1,member,month]);
 const daily=(await run(member,()=>insertTime(customers[0],project))).rows[0].id;
 await assert.rejects(()=>run(member,()=>query('update time_entries set created_by_user_id=$2 where id=$1',[daily,reviewer])),error=>error.code==='42501','Changing the creator cannot bypass self-review');
 await assert.rejects(()=>run('unknown-user',()=>insertTime(customers[0],project)),error=>error.code==='42501');
 await assert.rejects(()=>run(member,()=>insertTime(customers[1],null)),error=>error.code==='42501');
 await assert.rejects(()=>run(member,()=>insertTime(customers[0],project,new Date().toISOString().slice(0,7)+'-01')),error=>error.code==='23514'&&error.constraint==='monthly_time_no_overlap');
 await assert.rejects(()=>run(member,()=>query('update time_entries set approved=true where id=$1',[daily])),error=>error.code==='42501');
 await run(reviewer,()=>query('update time_entries set approved=true where id=$1',[daily]));
 const expense=(await run(member,()=>query("insert into expenses(organization_id,external_id,employee_id,customer_id,expense_date,description,merchant,category,quantity,unit_price,currency,status,created_by_user_id) values($1,'workforce-expense',$2,$3,current_date,'Synthetic meal','Synthetic merchant','expense',1,42,'CHF','submitted',$4) returning id",[org,employee,customers[0],member]))).rows[0].id;
 await assert.rejects(()=>run(member,()=>query('update expenses set customer_id=$2 where id=$1',[expense,customers[1]])),error=>error.code==='42501','Draft edits cannot move an expense to an unassigned customer');
 await assert.rejects(()=>run(member,()=>query("update expenses set status='approved' where id=$1",[expense])),error=>error.code==='42501');
 await run(reviewer,()=>query("update expenses set status='approved' where id=$1",[expense]));
 await assert.rejects(()=>run(owner,()=>query('update expenses set unit_price=99 where id=$1',[expense])),error=>error.code==='42501','Approved expense amounts remain immutable');
 await assert.rejects(()=>run(owner,()=>query('update time_entries set hours=2 where id=$1',[daily])),error=>error.code==='42501');
 await run(owner,()=>query('update workforce_assignments set revoked_at=now() where id=$1',[grant]));
 assert.equal((await run(member,()=>query('select id from customers'))).rows.length,0,'Revocation hides choices immediately');
 assert.equal((await run(member,()=>query('select body from file_contents where file_id=$1',[files[0]]))).rows.length,0,'Revocation also removes attachment access');
 await assert.rejects(()=>run(member,()=>insertTime(customers[0],project)),error=>error.code==='42501');
 assert.equal((await run(member,()=>query('select id from time_entries where id=$1',[daily]))).rows.length,1,'Revocation preserves own recorded history');
 console.log('Workforce: real runtime RLS, direct-ID/tenant denial, exact order scope, write/revocation guards, monthly overlap, independent approval and immutable history passed.');
}finally{await db.close()}
