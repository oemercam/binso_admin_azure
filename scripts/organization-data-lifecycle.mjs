import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const {Pool}=pg;
const databaseUrl=process.env.DATABASE_URL?.trim();
const operation=(process.env.BINSO_DATA_LIFECYCLE_OPERATION??"export").trim().toLowerCase();
const organizationId=(process.env.BINSO_ORGANIZATION_ID??"").trim();
const exportDir=(process.env.BINSO_EXPORT_DIR??"").trim();
const confirm=(process.env.BINSO_DELETE_CONFIRM??"").trim();
const exportConfirmed=(process.env.BINSO_DELETE_EXPORT_CONFIRMED??"").trim().toLowerCase()==="true";

if(!databaseUrl)throw new Error("DATABASE_URL is required.");
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)){
  throw new Error("BINSO_ORGANIZATION_ID must be a valid UUID.");
}
if(!["export","delete"].includes(operation))throw new Error("BINSO_DATA_LIFECYCLE_OPERATION must be export or delete.");

const pool=new Pool({
  connectionString:databaseUrl,
  max:1,
  ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"},
  connectionTimeoutMillis:8000
});

const quoted=value=>'"'+String(value).replaceAll('"','""')+'"';
const sensitiveKey=/(password|secret|token|recovery|hash|encryption|sas|credential)/i;
function sanitize(value){
  if(Array.isArray(value))return value.map(sanitize);
  if(value&&typeof value==="object"&&!Buffer.isBuffer(value)){
    return Object.fromEntries(Object.entries(value).filter(([key])=>!sensitiveKey.test(key)).map(([key,item])=>[key,sanitize(item)]));
  }
  if(Buffer.isBuffer(value))return {encoding:"base64",value:value.toString("base64")};
  if(value instanceof Date)return value.toISOString();
  return value;
}

async function tenantTables(client){
  const result=await client.query(
    `select distinct table_name
       from information_schema.columns
      where table_schema='public' and column_name='organization_id'
      order by table_name`
  );
  return result.rows.map(row=>String(row.table_name)).filter(name=>/^[a-zA-Z0-9_]+$/.test(name));
}

async function exportOrganization(client){
  if(!exportDir)throw new Error("BINSO_EXPORT_DIR is required for export.");
  const organization=(await client.query("select * from organizations where id=$1",[organizationId])).rows[0];
  if(!organization)throw new Error("Organization not found.");
  if(organization.is_demo)throw new Error("Demo organizations are excluded from production customer export.");

  const root=path.resolve(exportDir,organizationId);
  await fs.mkdir(root,{recursive:true,mode:0o700});
  await fs.writeFile(path.join(root,"organization.json"),JSON.stringify(sanitize(organization),null,2),{mode:0o600});

  const counts={organizations:1};
  const tables=await tenantTables(client);
  for(const table of tables){
    if(table==="organizations")continue;
    const result=await client.query(`select * from ${quoted(table)} where organization_id=$1`,[organizationId]);
    counts[table]=result.rowCount??0;
    await fs.writeFile(path.join(root,table+".json"),JSON.stringify(sanitize(result.rows),null,2),{mode:0o600});
  }

  const users=await client.query(
    `select distinct u.*
       from app_users u
       join organization_memberships m on m.user_id=u.id
      where m.organization_id=$1
      order by u.id`,
    [organizationId]
  );
  counts.app_users=users.rowCount??0;
  await fs.writeFile(path.join(root,"app_users.json"),JSON.stringify(sanitize(users.rows),null,2),{mode:0o600});

  const manifest={
    format:"binso-one-organization-export-v1",
    organizationId,
    generatedAt:new Date().toISOString(),
    tables:counts,
    note:"Authentication credentials, password hashes, secrets, tokens and recovery material are intentionally excluded."
  };
  await fs.writeFile(path.join(root,"manifest.json"),JSON.stringify(manifest,null,2),{mode:0o600});
  console.log(JSON.stringify({ok:true,operation:"export",organizationId,exportPath:root,tables:Object.keys(counts).length}));
}

async function deleteOrganization(client){
  if(confirm!==organizationId)throw new Error("BINSO_DELETE_CONFIRM must exactly match BINSO_ORGANIZATION_ID.");
  if(!exportConfirmed)throw new Error("Set BINSO_DELETE_EXPORT_CONFIRMED=true only after a verified export has been secured.");

  await client.query("begin");
  try{
    await client.query("select pg_advisory_xact_lock(hashtext($1))",[organizationId]);
    const organization=(await client.query("select id,status,is_demo from organizations where id=$1 for update",[organizationId])).rows[0];
    if(!organization)throw new Error("Organization not found.");
    if(organization.is_demo)throw new Error("Demo organizations use the sandbox cleanup path, not production deletion.");
    if(organization.status!=="archived")throw new Error("Organization must be archived before final deletion.");

    const activeSubscription=await client.query(
      `select 1 from organization_subscriptions
        where organization_id=$1
          and (status not in ('canceled','expired') or billing_subscription_id is not null)
        limit 1`,
      [organizationId]
    );
    if(activeSubscription.rowCount)throw new Error("Active/trial billing state blocks final deletion.");

    const blobRows=await client.query(
      "select blob_url from file_objects where organization_id=$1 and blob_url is not null",
      [organizationId]
    );

    await client.query("delete from organizations where id=$1",[organizationId]);

    const remaining={};
    for(const table of await tenantTables(client)){
      if(table==="organizations")continue;
      const result=await client.query(`select count(*)::int as n from ${quoted(table)} where organization_id=$1`,[organizationId]);
      if(Number(result.rows[0]?.n??0)>0)remaining[table]=Number(result.rows[0].n);
    }
    if(Object.keys(remaining).length)throw new Error("Tenant rows remain after organization deletion: "+JSON.stringify(remaining));

    await client.query("commit");
    console.log(JSON.stringify({ok:true,operation:"delete",organizationId,externalBlobUrlsToPurge:blobRows.rows.map(row=>row.blob_url).filter(Boolean)}));
  }catch(error){
    await client.query("rollback");
    throw error;
  }
}

try{
  const client=await pool.connect();
  try{
    if(operation==="export")await exportOrganization(client);
    else await deleteOrganization(client);
  }finally{
    client.release();
  }
}finally{
  await pool.end();
}
