import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {pgcrypto} from "@electric-sql/pglite/contrib/pgcrypto";

const db=new PGlite({extensions:{pgcrypto}});
try{
  await db.exec("create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner");
  for(const file of (await fs.readdir("database/migrations")).filter(name=>name.endsWith(".sql")).sort()){
    await db.exec("begin");
    try{
      await db.exec(await fs.readFile("database/migrations/"+file,"utf8"));
      await db.exec("commit");
    }catch(error){
      await db.exec("rollback");
      throw new Error(file+": "+error.message);
    }
  }
  await db.exec("reset role");

  const constraints=await db.query(`
    select con.conname,
           rel.relname as table_name,
           con.confdeltype,
           pg_get_constraintdef(con.oid) as definition
      from pg_constraint con
      join pg_class rel on rel.oid=con.conrelid
      join pg_namespace ns on ns.oid=rel.relnamespace
      join pg_class ref on ref.oid=con.confrelid
     where con.contype='f'
       and ns.nspname='public'
       and ref.relname='organizations'
     order by rel.relname,con.conname
  `);

  const organizationConstraints=constraints.rows.filter(row=>String(row.definition).toLowerCase().includes("organization_id"));
  assert.ok(organizationConstraints.length>0,"Organization foreign-key constraints must exist.");
  const restrictive=organizationConstraints.filter(row=>row.confdeltype!=="c");
  assert.ok(restrictive.length>=1,"Schema fixture must exercise at least one restrictive organization foreign key.");

  const lifecycle=await fs.readFile("scripts/organization-data-lifecycle.mjs","utf8");
  assert.ok(lifecycle.includes("restrictiveOrgFks"),"Final deletion must explicitly handle restrictive direct organization foreign keys.");
  assert.ok(lifecycle.includes("con.confdeltype<>'c'"),"Deletion plan must discover non-cascading organization foreign keys.");
  for(const required of [
    "BINSO_DELETE_CONFIRM",
    "BINSO_DELETE_EXPORT_CONFIRMED",
    "BINSO_EXTERNAL_BLOBS_PURGE_CONFIRMED",
    'organization.status!=="archived"',
    "Active/trial billing state blocks final deletion",
    "Tenant rows remain after organization deletion",
    "rollback"
  ]){
    assert.ok(lifecycle.includes(required),"Lifecycle deletion safeguard missing: "+required);
  }

  console.log("Organization data lifecycle schema and deletion safeguards passed.");
}finally{
  await db.close();
}
