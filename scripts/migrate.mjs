import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required");

const MIGRATION_LOCK_ID=173401068;
const ssl=process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"};
const pool=new pg.Pool({
  connectionString:url,
  ssl,
  max:1,
  connectionTimeoutMillis:10_000,
  idleTimeoutMillis:30_000,
  application_name:"binso-one-migrator"
});

const divergent=new Set([
  "001_initial.sql","002_permissions_operator.sql","003_pilot_support_legal.sql","004_support_diagnostics.sql",
  "005_production_readiness.sql","006_organization_settings.sql","007_support_attachments.sql","008_locale_turkish.sql","009_platform_foundation.sql"
]);

const checksum=(sql)=>crypto.createHash("sha256").update(sql).digest("hex");

try{
  const client=await pool.connect();
  try{
    await client.query("select pg_advisory_lock($1)",[MIGRATION_LOCK_ID]);
    await client.query(`create table if not exists schema_migrations(
      version text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`);

    const appliedResult=await client.query("select version,checksum from schema_migrations order by version");
    const applied=new Map(appliedResult.rows.map(row=>[row.version,row.checksum]));
    const canonicalLineage=applied.has("0001_baseline.sql")||applied.has("0016_self_service_signup.sql");
    const divergentLineage=[...divergent].some(version=>applied.has(version));

    if(divergentLineage&&!canonicalLineage){
      throw new Error("Database uses the retired divergent migration lineage (001_initial..009_platform_foundation). Automatic migration is blocked. Migrate to the canonical binso_platform lineage before continuing.");
    }
    if(!canonicalLineage){
      throw new Error("Canonical database baseline 0001_baseline.sql..0016_self_service_signup.sql is required. Refusing to bootstrap from the retired divergent migration set.");
    }

    const files=(await fs.readdir("database/migrations")).filter(file=>file.endsWith(".sql")).sort();
    for(const file of files){
      if(divergent.has(file)){
        console.log(`Ignoring retired divergent migration ${file}`);
        continue;
      }

      const sql=await fs.readFile(path.join("database/migrations",file),"utf8");
      const currentChecksum=checksum(sql);
      const existingChecksum=applied.get(file);
      if(existingChecksum){
        if(existingChecksum!==currentChecksum)throw new Error(`Migration ${file} was modified after being applied.`);
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`Applying ${file}`);
      try{
        await client.query("begin");
        await client.query("set local lock_timeout = '15s'");
        await client.query("set local statement_timeout = '120s'");
        await client.query(sql);
        await client.query("insert into schema_migrations(version,checksum) values($1,$2)",[file,currentChecksum]);
        await client.query("commit");
        applied.set(file,currentChecksum);
      }catch(error){
        await client.query("rollback");
        throw error;
      }
    }
    console.log("Canonical migrations complete");
  }finally{
    try{await client.query("select pg_advisory_unlock($1)",[MIGRATION_LOCK_ID])}catch{}
    client.release();
  }
}finally{
  await pool.end();
}
