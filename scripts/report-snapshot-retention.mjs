/** Derived, expired report copies only. Business documents and mail history
 * are deliberately outside this cleanup. No discovery or RLS bypass. */
export function reportRetentionScopes(value=''){
 if(!value.trim())return [];
 const ids=value.split(',').map(id=>id.trim().toLowerCase());
 if(ids.length>1000||ids.some(id=>!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)))throw Error('Report retention requires explicit valid organization IDs (maximum 1000).');
 return [...new Set(ids)];
}
export async function expireReportCopies(client,organizationId,{dryRun=true,batchSize=200}={}){
 const scopes=reportRetentionScopes(organizationId);
 if(scopes.length!==1||scopes[0]!==organizationId.trim().toLowerCase()||!Number.isInteger(batchSize)||batchSize<1||batchSize>1000)throw Error('Invalid bounded report retention scope.');
 await client.query(dryRun?'begin read only':'begin');
 try{
  await client.query("select set_config('app.organization_id',$1,true),set_config('app.user_id','report-retention',true)",[organizationId]);
  if(dryRun){const count=Number((await client.query('select count(*)::int n from report_exports where organization_id=$1 and expires_at<=now()',[organizationId])).rows[0].n);await client.query('rollback');return {eligible:count,deleted:0,remaining:count};}
  const deleted=(await client.query('with expired as (select id from report_exports where organization_id=$1 and expires_at<=now() order by expires_at,id limit $2 for update skip locked) delete from report_exports target using expired where target.organization_id=$1 and target.id=expired.id returning target.id',[organizationId,batchSize])).rows.length;
  if(deleted)await client.query("insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,detail) values($1,'report-retention','System','report.exports.expired','report_export',$2)",[organizationId,JSON.stringify({deletedCopies:deleted})]);
  const remaining=Number((await client.query('select count(*)::int n from report_exports where organization_id=$1 and expires_at<=now()',[organizationId])).rows[0].n);
  await client.query('commit');return {eligible:deleted+remaining,deleted,remaining};
 }catch(error){await client.query('rollback');throw error;}
}
