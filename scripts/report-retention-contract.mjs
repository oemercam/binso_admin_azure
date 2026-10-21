import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {reportRetentionScopes,expireReportCopies} from './report-snapshot-retention.mjs';

export async function verifyReportRetention(db){
 await db.exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 const org=randomUUID(),foreign=randomUUID(),pdf=Buffer.from('%PDF-Synthetic derived copy'),hash=createHash('sha256').update(pdf).digest('hex');
 for(const id of [org,foreign])await db.query("insert into organizations(id,name,slug,status,is_demo) values($1,'Synthetic report retention',$2,'active',false)",[id,'retention-'+id]);
 const snapshot=async(scope,expired)=>{const id=randomUUID();await db.query("insert into report_exports(id,organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256,expires_at) values($1,$2,'synthetic-owner','summary','de','kind=summary',$3,now(),$4,$5,now()+case when $6 then interval '-1 day' else interval '1 day' end)",[id,scope,'a'.repeat(64),pdf,hash,expired]);return id;};
 const expired=await snapshot(org,true);await snapshot(org,true);await snapshot(org,true);const active=await snapshot(org,false),other=await snapshot(foreign,true);
 const link=randomUUID(),code=randomUUID();
 await db.query("insert into report_public_links(id,organization_id,export_id,created_by_user_id,recipient,token_hash,token_enc,expires_at) values($1,$2,$3,'synthetic-owner','recipient@example.invalid',$4,'synthetic encrypted capability',now()+interval '-1 day')",[link,org,expired,'b'.repeat(64)]);
 await db.query("insert into report_recipient_codes(id,organization_id,link_id,code_hash,expires_at) values($1,$2,$3,$4,now()+interval '-1 day')",[code,org,link,'c'.repeat(64)]);
 const mail=(await db.query("insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,status,created_by) values($1,$2,'report',$3,'recipient@example.invalid','Synthetic subject','Synthetic message','failed','synthetic-owner') returning id",[org,randomUUID(),expired])).rows[0].id;
 const client={query:async(text,args)=>{const result=await db.query(text,args);if(/^begin/.test(text))await db.exec('set local role binso_runtime');return result;}};
 assert.deepEqual(reportRetentionScopes(),[]);assert.deepEqual(reportRetentionScopes(org+','+org.toUpperCase()),[org]);assert.throws(()=>reportRetentionScopes(org+',invalid'));
 await assert.rejects(()=>expireReportCopies(client,org,{batchSize:0}),/Invalid bounded/);
 assert.deepEqual(await expireReportCopies(client,org,{dryRun:true}),{eligible:3,deleted:0,remaining:3});
 assert.equal((await db.query('select count(*)::int n from report_exports where organization_id=$1',[org])).rows[0].n,4,'Read-only preview leaves every byte present');
 assert.deepEqual(await expireReportCopies(client,org,{dryRun:false,batchSize:2}),{eligible:3,deleted:2,remaining:1},'A bounded batch reports unfinished work explicitly');
 assert.deepEqual(await expireReportCopies(client,org,{dryRun:false,batchSize:2}),{eligible:1,deleted:1,remaining:0});
 assert.deepEqual(await expireReportCopies(client,org,{dryRun:false}),{eligible:0,deleted:0,remaining:0},'Repeated cleanup is idempotent');
 assert.equal((await db.query('select id from report_exports where id=any($1::uuid[])',[ [active,other] ])).rows.length,2,'Active own and unconfigured foreign copies remain');
 assert.equal((await db.query('select id from report_public_links where id=$1',[link])).rows.length,0);assert.equal((await db.query('select id from report_recipient_codes where id=$1',[code])).rows.length,0,'Expired capabilities and codes leave with their copy');
 assert.equal((await db.query('select id from mail_outbox where id=$1',[mail])).rows.length,1,'Actual mail history is retained');
 assert.equal((await db.query("select count(*)::int n from audit_events where organization_id=$1 and action='report.exports.expired'",[org])).rows[0].n,2,'Only nonempty successful batches create audit events');
 const rollback=await snapshot(org,true);
 await db.exec("create function qa_report_retention_audit_failure() returns trigger language plpgsql as $$ begin if new.action='report.exports.expired' then raise exception 'Synthetic retention audit unavailable'; end if; return new; end $$; create trigger qa_report_retention_audit_failure before insert on audit_events for each row execute function qa_report_retention_audit_failure();");
 try{await assert.rejects(()=>expireReportCopies(client,org,{dryRun:false}),/Synthetic retention audit unavailable/);}finally{await db.exec('drop trigger qa_report_retention_audit_failure on audit_events; drop function qa_report_retention_audit_failure();');}
 assert.equal((await db.query('select id from report_exports where id=$1',[rollback])).rows.length,1,'Audit failure restores the entire transaction, not a fake successful cleanup');
 console.log('Report retention: actual migrated/runtime-RLS dry-run, expiry-only bounded deletion, remaining counts, capability/code cascade, retained active/foreign copies and mail history, replay and audit rollback passed. No production cleanup enabled.');
}
