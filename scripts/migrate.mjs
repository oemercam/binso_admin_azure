import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required");
const ssl=process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"};
const pool=new pg.Pool({connectionString:url,ssl});

try{
 await pool.query(`create table if not exists schema_migrations(
   version text primary key,
   checksum text not null,
   applied_at timestamptz not null default now()
 )`);
 const files=(await fs.readdir("database/migrations")).filter(x=>x.endsWith(".sql")).sort();
 for(const file of files){
   const sql=await fs.readFile(path.join("database/migrations",file),"utf8");
   const checksum=crypto.createHash("sha256").update(sql).digest("hex");
   const existing=await pool.query("select checksum from schema_migrations where version=$1",[file]);
   if(existing.rowCount){
     if(existing.rows[0].checksum!==checksum)throw new Error(`Migration ${file} was modified after being applied.`);
     console.log(`Skipping ${file} (already applied)`);
     continue;
   }
   console.log(`Applying ${file}`);
   await pool.query(sql);
   await pool.query("insert into schema_migrations(version,checksum) values($1,$2)",[file,checksum]);
 }
 console.log("Migrations complete");
}finally{await pool.end()}
