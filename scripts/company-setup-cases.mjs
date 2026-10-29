import assert from 'node:assert/strict';
/** Runs only inside the migrated disposable registration fixture. */
export async function verifySinglePageCompanySetup({db,load,request,current,foreignOrganizationId}){
 const company=await import(await load('app/api/settings/company/route.ts'));
 const org=current.organizationId,user=current.userId;
 const proof=(await db.query('select step_up_at from auth_sessions where id=$1',[current.sessionId])).rows[0].step_up_at;
 const keys=['name','legal_name','street','building_number','postal_code','city','country_code','iban','qr_iban','vat_rate','payment_terms_days','invoice_intro_text'];
 const before=(await db.query('select '+keys.join(',')+' from organizations where id=$1',[org])).rows[0];
 const foreign=(await db.query('select name from organizations where id=$1',[foreignOrganizationId])).rows[0].name;
 const milestone=(await db.query("select 1 from organization_milestones where organization_id=$1 and milestone='onboarding_completed'",[org])).rows.length;
 const body={name:'Completed fixture company',legalName:'',street:'Testweg',buildingNumber:'2',postalCode:'8000',city:'Zürich',countryCode:'CH',iban:'CH9300762011623852957',qrIban:'',completeCompanySetup:true,completeOnboarding:true,organizationId:foreignOrganizationId};
 const patch=b=>company.PATCH(request('PATCH',b,'https://example.invalid/api/settings/company'));
 const name=async()=>(await db.query('select name from organizations where id=$1',[org])).rows[0].name;
 const ddl=sql=>db.exec?db.exec(sql):db.query(sql);
 try{
  await db.query('update auth_sessions set step_up_at=null where id=$1',[current.sessionId]);
  assert.equal((await patch(body)).status,403,'Bank-bearing company completion requires fresh session proof');assert.equal(await name(),before.name);
  await db.query('update auth_sessions set step_up_at=now() where id=$1',[current.sessionId]);
  assert.equal((await patch({...body,iban:'INVALID'})).status,400);assert.equal(await name(),before.name);
  assert.equal((await patch({...body,street:''})).status,400,'Missing canonical requirements cannot complete the company');assert.equal(await name(),before.name);
  await db.query("update organizations set vat_rate=0,payment_terms_days=0,invoice_intro_text='Keep authored fixture text' where id=$1",[org]);
  const response=await patch(body);assert.equal(response.status,200);const item=(await response.json()).item;assert.equal(item.name,body.name);assert.equal(item.iban,body.iban);assert.equal(Number(item.vat_rate),0);assert.equal(Number(item.payment_terms_days),0);assert.equal(item.invoice_intro_text,'Keep authored fixture text');
  assert.equal((await db.query('select name from organizations where id=$1',[foreignOrganizationId])).rows[0].name,foreign,'Forged tenant ID never changes another company');
  await db.query("update organization_memberships set role='reader' where user_id=$1 and organization_id=$2",[user,org]);assert.equal((await patch({...body,name:'Forbidden'})).status,403);assert.equal(await name(),body.name);
  await db.query('update organization_memberships set role=$1 where user_id=$2 and organization_id=$3',[current.role,user,org]);
  await ddl("create function company_setup_fixture_fail() returns trigger language plpgsql as $$begin raise exception 'isolated completion failure';end$$;create trigger company_setup_fixture_fail before insert on organization_milestones for each row execute function company_setup_fixture_fail()");
  assert.equal((await patch({...body,name:'Must roll back'})).status,500);assert.equal(await name(),body.name,'Failed completion rolls back the company and bank write together');
 }finally{
  await db.query('update auth_sessions set step_up_at=$1 where id=$2',[proof,current.sessionId]);
  await ddl('drop trigger if exists company_setup_fixture_fail on organization_milestones;drop function if exists company_setup_fixture_fail()');
  await db.query('update organization_memberships set role=$1 where user_id=$2 and organization_id=$3',[current.role,user,org]);
  await db.query('update organizations set '+keys.map((k,i)=>k+'=$'+(i+1)).join(',')+' where id=$'+(keys.length+1),[...keys.map(k=>before[k]),org]);
  if(!milestone)await db.query("delete from organization_milestones where organization_id=$1 and milestone='onboarding_completed'",[org]);
 }
 console.log('Single-page company completion: actual API/RLS, fresh-proof and canonical validation, optional-field preservation, role/tenant denial and atomic rollback passed.');
}
