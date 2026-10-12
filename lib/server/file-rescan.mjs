import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Only a file selected in an explicit manifest can move out of quarantine.
export async function rescanPendingFile(client,{organization,expected,scan}){
 assert.equal(expected.organization_id,organization);
 assert.match(expected.id,/^[0-9a-f-]{36}$/i);
 assert.match(expected.sha256,/^[0-9a-f]{64}$/);
 assert.ok(Number.isSafeInteger(Number(expected.size_bytes))&&Number(expected.size_bytes)>0);
 await client.query('BEGIN');
 try{
  await client.query("select set_config('app.organization_id',$1,true),set_config('app.user_id','scanner-operator',true)",[organization]);
  const row=(await client.query('select f.scan_status,f.sha256,f.size_bytes,b.body from file_objects f join file_contents b on b.file_id=f.id and b.organization_id=f.organization_id where f.id=$1 and f.organization_id=$2 for update of f,b',[expected.id,organization])).rows[0];
  if(!row||row.scan_status!=='pending'){await client.query('ROLLBACK');return 'skipped';}
  assert.equal(row.sha256,expected.sha256);assert.equal(Number(row.size_bytes),Number(expected.size_bytes));
  const body=Buffer.from(row.body);
  assert.equal(body.length,Number(row.size_bytes));assert.equal(createHash('sha256').update(body).digest('hex'),expected.sha256);
  const result=await scan(body);
  assert.ok(['clean','rejected'].includes(result.status));assert.equal(result.evidence?.sha256,expected.sha256);
  const changed=await client.query("update file_objects set scan_status=$1,scan_evidence=$2::jsonb where id=$3 and organization_id=$4 and scan_status='pending' and sha256=$5 returning id",[result.status,JSON.stringify(result.evidence),expected.id,organization,expected.sha256]);
  assert.equal(changed.rows.length,1);
  await client.query("insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail) values($1,'scanner-operator','Controlled file rescan','file.scan','file',$2,$3)",[organization,expected.id,JSON.stringify({previous:'pending',result:result.status,...result.evidence})]);
  await client.query('COMMIT');return result.status;
 }catch(error){await client.query('ROLLBACK');throw error;}
}
