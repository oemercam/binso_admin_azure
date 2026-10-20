import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quote=value=>{assert.match(value,/^[a-z_][a-z0-9_]*$/);return '"'+value+'"';};

export async function resetMetadata(client,email){
 const tables=(await client.query(`select c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
 array(select a.attname::text from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped order by a.attnum) as columns
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') order by c.relname`)).rows;
 const constraints=(await client.query(`select c.relname,con.conname,pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by c.relname,con.conname`)).rows;
 const policies=(await client.query("select tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname")).rows;
 const triggers=(await client.query("select c.relname,t.tgname,t.tgtype,pg_get_triggerdef(t.oid) as definition from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal order by c.relname,t.tgname")).rows;
 const fks=(await client.query(`select con.conrelid::regclass::text as source,con.confrelid::regclass::text as target from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where con.contype='f' and n.nspname='public' order by source,target`)).rows;
 const admin=(await client.query("select p.user_id,p.email,p.role,p.status,p.auth_source,p.entra_object_id,p.entra_tenant_id,encode(sha256(convert_to(to_jsonb(p)::text,'UTF8')),'hex') as row_fingerprint from public.platform_operator_assignments p where lower(email)=lower($1)",[email])).rows;
 const personal=(await client.query("select u.id,u.email,u.status,encode(sha256(convert_to(to_jsonb(u)::text,'UTF8')),'hex') as row_fingerprint from public.app_users u where lower(email)=lower($1)",[email])).rows;
 const companies=(await client.query('select id::text,status,is_demo from public.organizations order by id')).rows;
 return {tables,constraints,policies,triggers,fks,admin,personal,companies};
}

export async function prepareReset(client,{email,objectId,tenantId,reviewedTables}){
 assert.ok(email&&objectId&&tenantId,'Explicit retained Entra identity required');
 const metadata=await resetMetadata(client,email);
 assert.equal(metadata.admin.length,1,'Exactly one retained operator required');
 const admin=metadata.admin[0];
 assert.equal(admin.role,'platform_owner');assert.equal(admin.status,'active');assert.equal(admin.auth_source,'entra');
 assert.equal(admin.entra_object_id,objectId);assert.equal(admin.entra_tenant_id,tenantId);
 assert.ok(metadata.personal.length<=1,'Ambiguous retained personal identity');
 const targets=new Set(metadata.tables.filter(t=>t.columns.includes('organization_id')||t.relname==='organizations').map(t=>t.relname));
 let expanded=true;while(expanded){expanded=false;for(const fk of metadata.fks)if(targets.has(fk.target)&&!targets.has(fk.source)){targets.add(fk.source);expanded=true;}}
 const tables=[...targets].sort();
 assert.ok(!metadata.triggers.some(t=>targets.has(t.relname)&&(Number(t.tgtype)&32)!==0),'Unexpected TRUNCATE trigger requires review');
 assert.deepEqual(tables,[...reviewedTables].sort(),'Reset table scope differs from reviewed allowlist');
 for(const name of ['app_users','platform_operator_assignments','platform_auth_sessions','schema_migrations','subscription_plan_catalog','subscription_plan_features','platform_feature_flags','platform_maintenance'])assert.ok(!targets.has(name),'Protected table in reset scope: '+name);
 assert.ok(metadata.tables.every(t=>t.relkind==='r'),'Partitioned schema requires separate review');
 const plan={format:'binso-reviewed-test-reset-v1',email,objectId,tenantId,tables,metadata};
 return {...plan,sha256:digest(plan)};
}

/** Explicit, bounded maintenance operation. No CASCADE, DDL, RLS toggle or grant. */
export async function applyReset(client,plan,confirmation){
 assert.equal(confirmation,plan.sha256,'Exact reviewed plan confirmation required');
 const {sha256,...body}=plan;assert.equal(digest(body),sha256,'Plan was modified');
 await client.query('begin');
 let committed=false;
 try{
  await client.query("set local lock_timeout='5s'");await client.query("set local statement_timeout='30s'");
  const locked=[...new Set([...plan.tables,'app_users','platform_operator_assignments','platform_auth_sessions','push_subscriptions','schema_migrations','subscription_plan_catalog','subscription_plan_features','platform_feature_flags','platform_maintenance'])].sort();
  await client.query('lock table '+locked.map(t=>'public.'+quote(t)).join(',')+' in access exclusive mode');
  const fresh=await prepareReset(client,{...plan,reviewedTables:plan.tables});
  assert.equal(fresh.sha256,sha256,'Database identity, companies or schema drifted; no reset applied');
  const preserved=['schema_migrations','subscription_plan_catalog','subscription_plan_features','platform_feature_flags','platform_maintenance'];
  const config={};for(const table of preserved)config[table]=(await client.query('select to_jsonb(t) as row from public.'+quote(table)+' t order by to_jsonb(t)::text')).rows;
  const operatorSessions=(await client.query('select * from public.platform_auth_sessions where user_id=$1 order by id',[fresh.metadata.admin[0].user_id])).rows;
  await client.query('truncate table '+plan.tables.map(t=>'public.'+quote(t)).join(',')+' restrict');
  const removedOperators=await client.query('delete from public.platform_operator_assignments where user_id<>$1',[fresh.metadata.admin[0].user_id]);
  const removedUsers=await client.query('delete from public.app_users where lower(email)<>lower($1)',[plan.email]);
  const after=await resetMetadata(client,plan.email);
  assert.equal(after.companies.length,0);assert.deepEqual(after.admin,fresh.metadata.admin);assert.deepEqual(after.personal,fresh.metadata.personal);
  assert.deepEqual(after.tables,fresh.metadata.tables);assert.deepEqual(after.constraints,fresh.metadata.constraints);assert.deepEqual(after.policies,fresh.metadata.policies);
  assert.deepEqual(after.triggers,fresh.metadata.triggers);
  assert.deepEqual((await client.query('select * from public.platform_auth_sessions where user_id=$1 order by id',[fresh.metadata.admin[0].user_id])).rows,operatorSessions);
  assert.equal(Number((await client.query('select count(*) n from public.platform_operator_assignments')).rows[0].n),1);
  assert.equal(Number((await client.query('select count(*) n from public.app_users where lower(email)<>lower($1)',[plan.email])).rows[0].n),0);
  for(const table of preserved)assert.deepEqual((await client.query('select to_jsonb(t) as row from public.'+quote(table)+' t order by to_jsonb(t)::text')).rows,config[table]);
  await client.query('commit');committed=true;
  return {planSha256:sha256,resetTables:plan.tables,removedCompanies:fresh.metadata.companies.length,removedOtherOperators:removedOperators.rowCount,removedOtherUsers:removedUsers.rowCount,retainedOwnerUnchanged:true,retainedOwnerSessionsUnchanged:true,schemaPoliciesConstraintsUnchanged:true,configurationAndMigrationsUnchanged:true};
 }catch(error){if(!committed)await client.query('rollback');throw error;}
}
