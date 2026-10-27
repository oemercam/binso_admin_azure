import assert from 'node:assert/strict';
/** Owner-approved customer password login; operator and sensitive-action proof remain separate. */
export async function verifyCompanyMfaPolicy({db,load,actualSession,request,jar,current,foreignOrganizationId}){
 const policy=await import(await load('app/api/settings/security/route.ts'));
 const sessionRoute=await import(await load('app/api/auth/session/route.ts'));
 const company=await import(await load('app/api/settings/company/route.ts'));
 const savedCookies=new Map(jar),org=current.organizationId,user=current.userId;
 const saved=(await db.query('select mfa_enabled,mfa_secret_enc from app_users where id=$1',[user])).rows[0];
 const patch=()=>policy.PATCH(request('PATCH',{required:true,organizationId:foreignOrganizationId},'https://example.invalid/api/settings/security'));
 try{
  await db.query('update organizations set employee_mfa_required=true where id=$1',[org]);
  await db.query('update app_users set mfa_enabled=false,mfa_secret_enc=null where id=$1',[user]);
  assert.equal((await (await policy.GET()).json()).item.required,false,'Customer login does not require historical company MFA');
  assert.equal((await patch()).status,410,'Stale clients cannot re-enable the retired customer-login policy');
  assert.equal((await db.query('select employee_mfa_required from organizations where id=$1',[foreignOrganizationId])).rows[0].employee_mfa_required,false,'No cross-tenant mutation');
  assert.equal((await actualSession.requireSession()).mfaRequired,false);
  const bootstrap=await (await sessionRoute.GET()).json();assert.equal(bootstrap.authenticated,true);assert.equal(bootstrap.security.enrollmentRequired,false);
  assert.equal((await company.GET()).status,200,'Valid customer session can access its company');
  await db.query("update organization_memberships set role='member' where organization_id=$1 and user_id=$2",[org,user]);
  assert.equal((await patch()).status,403,'RBAC remains enforced');
  assert.equal((await policy.GET()).status,403);
 }finally{
  await db.query('update organizations set employee_mfa_required=false where id=$1',[org]);
  await db.query('update app_users set mfa_enabled=$1,mfa_secret_enc=$2 where id=$3',[saved.mfa_enabled,saved.mfa_secret_enc,user]);
  await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  jar.clear();for(const [key,value]of savedCookies)jar.set(key,value);
 }
 console.log('Customer password-login policy: legacy enrollment no longer blocks valid sessions; stale writes, RBAC and tenant isolation verified.');
}
