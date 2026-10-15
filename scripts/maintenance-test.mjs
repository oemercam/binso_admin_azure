import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
try{
 await db.exec(await fs.readFile('database/migrations/0050_platform_maintenance.sql','utf8'));
 await db.exec('create role maintenance_fixture;grant usage on schema public to maintenance_fixture;grant select,update on platform_maintenance to maintenance_fixture;set role maintenance_fixture');
 const load=async(file,modules)=>{
  const exports={};const source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  Function('require','exports',source)(name=>{if(Object.hasOwn(modules,name))return modules[name];throw Error('Missing isolated dependency '+name)},exports);return exports;
 };
 const query=(...args)=>db.query(...args);
 const state=await load('lib/server/maintenance.ts',{'server-only':{},'@/lib/server/env':{env:{appMode:'production'}},'@/lib/server/db':{query}});
 class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}
 let role='platform_owner',auditFailure=false;const audit=[];
 const route=await load('app/api/operator/maintenance/route.ts',{
  'next/server':{},'@/lib/server/operator/session':{requireOperatorSession:async()=>({role,userId:'00000000-0000-4000-8000-000000000001',email:'fixture@example.invalid'})},
  '@/lib/server/operator/rbac':{authorizeOperator:(s,p)=>{if(p==='security:manage'&&s.role!=='platform_owner')throw new ApiError(403,'forbidden','Forbidden')}},
  '@/lib/server/operator/audit':{platformAudit:async input=>{if(auditFailure)throw Error('synthetic audit failure');audit.push(input)}},
  '@/lib/server/db':{withPlatform:fn=>db.transaction(async client=>{await client.query("select set_config('app.platform_operator','true',true)");return fn(client)})},'@/lib/server/maintenance':state,
  '@/lib/server/validation':{asObject:value=>value},
  '@/lib/server/http':{ApiError,assertSameOrigin:request=>{if(request.headers.get('origin')!=='https://fixture.invalid')throw new ApiError(403,'origin','Forbidden')},readJson:request=>request.json(),json:(data,status=200)=>Response.json(data,{status}),apiError:error=>Response.json({error:error.code??'internal'},{status:error.status??500})}
 });
 const request=body=>new Request('https://fixture.invalid/api/operator/maintenance',{method:'POST',headers:{origin:'https://fixture.invalid','content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await state.maintenanceState()).enabled,false);
 role='platform_support';assert.equal((await route.POST(request({enabled:true,minutes:60}))).status,403);assert.equal((await state.maintenanceState()).enabled,false);
 role='platform_owner';for(const minutes of [0,241,'60',1.5])assert.equal((await route.POST(request({enabled:true,minutes}))).status,400);
 assert.equal((await route.POST(request({enabled:true,minutes:15}))).status,200);assert.equal((await state.maintenanceState()).enabled,true);assert.equal(audit.at(-1).action,'platform.maintenance.enabled');
 auditFailure=true;assert.equal((await route.POST(request({enabled:false}))).status,500);assert.equal((await state.maintenanceState()).enabled,true,'Audit failure rolls back switch');auditFailure=false;
 await db.exec("update platform_maintenance set enabled=false");assert.equal((await state.maintenanceState()).enabled,true,"Tenant DB context cannot change platform maintenance");
 await db.exec("reset role;update platform_maintenance set ends_at=now()-interval '1 minute';set role maintenance_fixture");assert.equal((await state.maintenanceState()).enabled,false,'Expired maintenance cannot lock customers out');
 assert.equal((await route.POST(request({enabled:false}))).status,200);assert.equal((await state.maintenanceState()).enabled,false);
 console.log('Maintenance: authorization, duration validation, activation, expiry, deactivation and atomic audit rollback passed.');
}finally{await db.close()}
