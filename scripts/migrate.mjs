import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required");
const ssl=process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"};
const pool=new pg.Pool({connectionString:url,ssl,max:1,connectionTimeoutMillis:15_000});
const divergent=new Set([
 "001_initial.sql","002_permissions_operator.sql","003_pilot_support_legal.sql","004_support_diagnostics.sql",
 "005_production_readiness.sql","006_organization_settings.sql","007_support_attachments.sql","008_locale_turkish.sql","009_platform_foundation.sql"
]);

let migrationLockHeld=false;
try{
 await pool.query("select pg_advisory_lock(hashtext($1))",["binso-one-schema-migrations"]);
 migrationLockHeld=true;
 await pool.query(`create table if not exists schema_migrations(
   version text primary key,
   checksum text not null,
   applied_at timestamptz not null default now()
 )`);
 const appliedResult=await pool.query("select version from schema_migrations order by version");
 const applied=new Set(appliedResult.rows.map(row=>row.version));
 const canonicalLineage=applied.has("0001_baseline.sql")||applied.has("0016_self_service_signup.sql");
 const divergentLineage=[...divergent].some(v=>applied.has(v));
 if(divergentLineage&&!canonicalLineage){
   throw new Error("Database uses the retired divergent migration lineage. Production must be recovered with an explicitly reviewed forward migration; automatic reset is forbidden.");
 }
 if(applied.size>0&&!canonicalLineage){
   throw new Error("Unknown database lineage detected. Refusing automatic migration.");
 }
 if(applied.size===0) console.log("Fresh database detected; applying canonical Azure PostgreSQL lineage.");
 const files=(await fs.readdir("database/migrations")).filter(x=>x.endsWith(".sql")).sort();
 for(const file of files){
   if(divergent.has(file)){
     console.log(`Ignoring retired divergent migration ${file}`);
     continue;
   }
   const sql=await fs.readFile(path.join("database/migrations",file),"utf8");
   const checksum=crypto.createHash("sha256").update(sql).digest("hex");
   const existing=await pool.query("select checksum from schema_migrations where version=$1",[file]);
   if(existing.rowCount){
     if(existing.rows[0].checksum!==null&&existing.rows[0].checksum!==checksum)throw new Error(`Migration ${file} was modified after being applied.`);
     console.log(`Skipping ${file} (already applied)`);
     continue;
   }
   console.log(`Applying ${file}`);
   const client=await pool.connect();
   try{
     await client.query("begin");
     await client.query("set local lock_timeout = '15s'");
     await client.query("set local statement_timeout = '5min'");
     await client.query(sql);
     await client.query("insert into schema_migrations(version,checksum) values($1,$2)",[file,checksum]);
     await client.query("commit");
   }catch(error){
     await client.query("rollback");
     throw error;
   }finally{client.release()}
 }
 console.log("Canonical migrations complete");
}finally{
 if(migrationLockHeld){
   try{await pool.query("select pg_advisory_unlock(hashtext($1))",["binso-one-schema-migrations"]);}catch{}
 }
 await pool.end();
}
