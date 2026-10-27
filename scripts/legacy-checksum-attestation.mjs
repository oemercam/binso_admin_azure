import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import pg from 'pg';
import {checkSchema,checkMigrationVersions,migrationFiles} from './schema-contract.mjs';
import {acquireMigrationLock} from './migration-lock.mjs';

// A current-source attestation of an already restored and verified legacy schema.
// This does NOT claim that historical SQL bytes were recorded when first applied.
export const legacyVersions=Object.freeze([
 '0001_baseline.sql','0002_auth_memberships.sql','0003_registration_onboarding.sql',
 '0004_subscription_billing.sql','0005_stripe_payment_provider.sql','0006_production_saas.sql',
 '0007_subscription_lifecycle.sql','0008_production_completion.sql','0009_multitenant_rbac_business_model.sql',
 '0010_product_simplicity_devsecops.sql','0011_saas_platform_foundation.sql','0012_v74_production_hardening.sql',
 '0013_v75_complete_product_foundation.sql','0014_v79_demo_access.sql','0015_v82_normalized_business_core.sql',
 '0016_self_service_signup.sql'
]);
export const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
// Keep PostgreSQL's microseconds; JavaScript Date would truncate them and make
// a valid timestamp-bound update fail (or lose precision in the evidence).
const rows=async client=>(await client.query('select version,checksum,applied_at::text as applied_at from public.schema_migrations order by version')).rows;

export async function createAttestationPlan(client,sourceSha){
 if(!/^[a-f0-9]{40}$/.test(sourceSha))throw Error('Full source SHA required');
 const contractBytes=await fs.readFile('database/schema-contract.json','utf8'),contract=JSON.parse(contractBytes);
 const files=await migrationFiles();
 if(JSON.stringify(files)!==JSON.stringify(contract.migrations))throw Error('Source migration inventory differs from schema contract');
 const before=await rows(client),map=new Map(before.map(row=>[row.version,row]));
 await checkMigrationVersions(before);
 const updates=[];
 for(const version of files){
  const checksum=digest(await fs.readFile('database/migrations/'+version,'utf8')),row=map.get(version);
  if(legacyVersions.includes(version)){
   if(row.checksum!==null)throw Error('Expected exactly the approved legacy NULL checksum: '+version);
   updates.push({version,checksum,applied_at:row.applied_at});
  }else if(row.checksum!==checksum)throw Error('Non-legacy checksum mismatch: '+version);
 }
 if(updates.length!==16)throw Error('Expected exactly 16 legacy attestations');
 // Any other legacy/unknown row is preserved, never silently attested.
 await checkSchema(client,contract);
 const metadata=(await client.query('select current_database() as database,current_user as actor')).rows[0];
 if(metadata.database!=='binso_platform')throw Error('Only the active binso_platform database may be attested');
 return {format:1,kind:'current-source legacy checksum attestation',sourceSha,...metadata,
  schemaContractSha256:digest(contractBytes),before,updates};
}

export async function applyAttestation(client,sourceSha,approvedPlanSha256){
 if(!/^[a-f0-9]{64}$/.test(approvedPlanSha256??''))throw Error('Reviewed plan SHA256 required');
 await client.query('begin');
 try{
  await client.query("set local lock_timeout='10s'");
  await client.query("set local statement_timeout='60s'");
  await client.query('lock table public.schema_migrations in share row exclusive mode');
  const plan=await createAttestationPlan(client,sourceSha);
  if(digest(plan)!==approvedPlanSha256)throw Error('Reviewed plan changed; no checksums written');
  for(const update of plan.updates){
   const result=await client.query('update public.schema_migrations set checksum=$1 where version=$2 and checksum is null and applied_at=$3 returning version',[update.checksum,update.version,update.applied_at]);
   if(result.rowCount!==1)throw Error('Legacy row changed during attestation: '+update.version);
  }
  const after=await rows(client);
  const expected=plan.before.map(row=>({...row,checksum:plan.updates.find(update=>update.version===row.version)?.checksum??row.checksum}));
  if(JSON.stringify(after)!==JSON.stringify(expected))throw Error('Unexpected migration metadata mutation');
  await checkMigrationVersions(after,{checksums:true});
  await checkSchema(client,JSON.parse(await fs.readFile('database/schema-contract.json','utf8')));
  await client.query('commit');
  return {planSha256:approvedPlanSha256,sourceSha,appliedAt:new Date().toISOString(),updatedVersions:plan.updates.map(row=>row.version),after};
 }catch(error){await client.query('rollback');throw error;}
}

async function main(){
 const sourceSha=process.env.BINSO_SOURCE_SHA,actualSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(actualSha!==sourceSha)throw Error('Checkout does not match approved source SHA');
 const url=new URL(process.env.DATABASE_URL);
 if(url.hostname!=='binso-platform-db.postgres.database.azure.com'||url.pathname!=='/binso_platform')throw Error('Unexpected production database target');
 // URL SSL parameters take precedence in pg; normalize to strict verification.
 url.searchParams.delete('ssl');url.searchParams.delete('sslcert');url.searchParams.delete('sslkey');url.searchParams.delete('sslrootcert');
 url.searchParams.delete('uselibpqcompat');url.searchParams.set('sslmode','verify-full');
 const pool=new pg.Pool({connectionString:url.href,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:15000});
 let release,client;
 const output='legacy-checksum-evidence';await fs.mkdir(output,{recursive:true});
 try{
  release=await acquireMigrationLock(pool);client=await pool.connect();
  await client.query('begin read only');
  let plan;try{plan=await createAttestationPlan(client,sourceSha)}finally{await client.query('rollback')}
  const planHash=digest(plan);await fs.writeFile(output+'/plan.json',JSON.stringify(plan));
  console.log('Reviewed plan SHA256: '+planHash+'; exactly '+plan.updates.length+' NULL checksums; source '+sourceSha);
  if(process.argv.includes('--apply')){
   if(process.env.BINSO_APPROVE_ATTESTATION_SHA!==sourceSha)throw Error('Exact-source productive attestation approval required');
   const receipt=await applyAttestation(client,sourceSha,process.env.BINSO_APPROVED_PLAN_SHA256);
   await fs.writeFile(output+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');
   console.log('Committed exactly 16 legacy checksum attestations; all existing hashes and timestamps preserved.');
  }
 }finally{client?.release();try{await release?.()}finally{await pool.end()}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
