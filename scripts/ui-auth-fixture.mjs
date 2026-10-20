import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import pg from 'pg';

/** Real sessions in a disposable loopback database, never an app auth bypass. */
export async function createUiAuthFixture(){
 const url=new URL(process.env.BINSO_UI_TEST_URL??'postgres://binso_test:binso_test@127.0.0.1:5432/binso_ui_test');
 assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['127.0.0.1','localhost'].includes(url.hostname)&&url.pathname==='/binso_ui_test'&&url.username==='binso_test'&&!url.search&&!url.hash,'UI authentication requires the isolated loopback QA database without connection overrides');
 const adminUrl=new URL(url);adminUrl.pathname='/binso_observability_test';
 const admin=new pg.Client({connectionString:adminUrl.href});await admin.connect();
 try{if(!(await admin.query("select 1 from pg_database where datname='binso_ui_test'")).rowCount)await admin.query('create database binso_ui_test');}finally{await admin.end();}
 const pool=new pg.Pool({connectionString:url.href,max:1});
 try{
  const files=(await fs.readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort();
  const fingerprint=createHash('sha256');for(const file of files)fingerprint.update(file).update(await fs.readFile('database/migrations/'+file));
  const expected=fingerprint.digest('hex');
  const tables=Number((await pool.query("select count(*) n from information_schema.tables where table_schema='public'")).rows[0].n);
  if(tables===0){
   for(const file of files)await pool.query(await fs.readFile('database/migrations/'+file,'utf8'));
   await pool.query('create table public.qa_fixture_metadata(fingerprint text not null)');
   await pool.query('insert into public.qa_fixture_metadata values($1)',[expected]);
  }else assert.deepEqual((await pool.query('select fingerprint from public.qa_fixture_metadata')).rows,[{fingerprint:expected}],'Never reset or reuse an unidentified/stale QA database');
  const user='ui-'+randomBytes(12).toString('hex'),token=randomBytes(32).toString('base64url');
  await pool.query("insert into platform_operator_assignments(user_id,email,role,status) values($1,$2,'platform_owner','active')",[user,user+'@fixture.invalid']);
  await pool.query("insert into platform_auth_sessions(user_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",[user,createHash('sha256').update(token).digest('hex')]);
  const organization=randomUUID(),customerUser=user+'-customer',customerToken=randomBytes(32).toString('base64url');
  await pool.query("insert into app_users(id,email,display_name,status,mfa_enabled) values($1,$2,'Synthetic Customer','active',true)",[customerUser,customerUser+'@fixture.invalid']);
  await pool.query("insert into organizations(id,name,slug,is_demo,status) values($1,'Synthetic browser company',$2,false,'active')",[organization,user]);
  await pool.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'owner','active')",[organization,customerUser,customerUser+'@fixture.invalid']);
  await pool.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active')",[organization]);
  await pool.query("insert into auth_sessions(user_id,organization_id,token_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')",[customerUser,organization,createHash('sha256').update(customerToken).digest('hex')]);
  const env={DATABASE_URL:url.href,DATABASE_SSL:'false',APP_MODE:'local',OPERATOR_SESSION_COOKIE_NAME:'binso_ui_operator',SESSION_COOKIE_NAME:'binso_ui_customer'};
  for(const key of Object.keys(process.env))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))env[key]='';
  return {env,cookies:[{name:'binso_ui_operator',value:token},{name:'binso_ui_customer',value:customerToken}],close:async()=>{try{await pool.query('delete from organizations where id=$1',[organization]);await pool.query('delete from app_users where id=$1',[customerUser]);await pool.query('delete from platform_operator_assignments where user_id=$1',[user]);}finally{await pool.end();}}};
 }catch(error){await pool.end();throw error;}
}
