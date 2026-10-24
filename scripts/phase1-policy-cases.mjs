import assert from 'node:assert/strict';
/** Runs inside the existing disposable PostgreSQL/PGlite registration fixture,
 * using actual session, RBAC, fresh proof, RLS, migration and API implementations. */
export async function verifyCompanyMfaPolicy({db,load,actualSession,request,jar,current,foreignOrganizationId}){
 const policy=await import(await load('app/api/settings/security/route.ts'));
 const mfa=await import(await load('app/api/auth/mfa/route.ts'));
 const sessionRoute=await import(await load('app/api/auth/session/route.ts'));
 const company=await import(await load('app/api/settings/company/route.ts'));
 const savedCookies=new Map(jar),org=current.organizationId,user=current.userId,id=current.sessionId;
 const saved=(await db.query('select mfa_enabled,mfa_secret_enc,recovery_code_hashes from app_users where id=$1',[user])).rows[0];
 const patch=required=>policy.PATCH(request('PATCH',{required,organizationId:foreignOrganizationId},'https://example.invalid/api/settings/security'));
 try{
  assert.equal((await (await policy.GET()).json()).item.required,false,'Existing organizations remain optional after migration');
  await db.query('update auth_sessions set step_up_at=null where id=$1',[id]);
  assert.equal((await patch(true)).status,403,'Changing policy requires fresh session-bound proof');
  await db.query('update auth_sessions set step_up_at=now() where id=$1',[id]);
  assert.equal((await patch(true)).status,409,'Administrator must enroll their own factor before enabling mandatory MFA');
  await db.query("update app_users set mfa_enabled=true,mfa_secret_enc='synthetic-policy-fixture-only' where id=$1",[user]);
  await db.query('update auth_sessions set step_up_at=now() where id=$1',[id]);
  assert.equal((await patch(true)).status,200);
  assert.equal((await db.query('select employee_mfa_required from organizations where id=$1',[foreignOrganizationId])).rows[0].employee_mfa_required,false,'A forged organization ID cannot change another tenant');
  const count=async()=>(await db.query("select count(*)::int n from audit_events where organization_id=$1 and action='organization.mfa_policy_changed'",[org])).rows[0].n;
  const audited=await count();assert.ok(audited>0);assert.equal((await patch(true)).status,200);assert.equal(await count(),audited,'Idempotent policy retry does not invent another change');
  assert.equal((await mfa.DELETE(request('DELETE',null,'https://example.invalid/api/auth/mfa'))).status,403,'Individual opt-out is denied even with fresh proof');
  assert.equal((await db.query('select mfa_enabled from app_users where id=$1',[user])).rows[0].mfa_enabled,true);
  await db.query("update organization_memberships set role='member' where organization_id=$1 and user_id=$2",[org,user]);
  assert.equal((await patch(false)).status,403,'A member cannot relax the company policy');
  await db.query('update app_users set mfa_enabled=false,mfa_secret_enc=null where id=$1',[user]);
  assert.equal(await actualSession.getSession(),null,'Existing unenrolled sessions cannot reach direct getSession consumers');
  await assert.rejects(()=>actualSession.requireSession(),error=>error.status===403&&error.code==='mfa_enrollment_required');
  const pending=await actualSession.getSession({allowMfaEnrollment:true});assert.equal(pending.mfaRequired,true);
  const bootstrap=await (await sessionRoute.GET()).json();assert.equal(bootstrap.authenticated,true);assert.equal(bootstrap.security.enrollmentRequired,true);
  assert.equal((await company.GET()).status,403,'Direct business API requests are denied before enrollment');
  assert.equal((await (await mfa.GET()).json()).required,true,'The existing enrollment API remains available');
  await actualSession.createSession({userId:user,organizationId:org,email:current.email,name:current.name,role:'member',persistent:false});
  assert.equal(await actualSession.getSession(),null,'A new session from an alternative credential handoff cannot bypass the policy');
  assert.equal((await actualSession.getSession({allowMfaEnrollment:true})).mfaRequired,true);
 }finally{
  await db.query('update organizations set employee_mfa_required=false where id=$1',[org]);
  await db.query('update app_users set mfa_enabled=$1,mfa_secret_enc=$2,recovery_code_hashes=$3::jsonb where id=$4',[saved.mfa_enabled,saved.mfa_secret_enc,JSON.stringify(saved.recovery_code_hashes),user]);
  await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  await db.query('delete from auth_sessions where user_id=$1 and id<>$2',[user,id]);
  jar.clear();for(const [key,value]of savedCookies)jar.set(key,value);
 }
 console.log('Phase 1 company MFA: real scoped policy/fresh proof/RBAC/audit, opt-out denial, pending enrollment and alternative-session guard passed.');
}
