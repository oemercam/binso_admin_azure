import fs from "node:fs/promises";import path from "node:path";import crypto from "node:crypto";import pg from "pg";
const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");
const pool=new pg.Pool({connectionString:url,ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"},max:1});
try{
 await pool.query(`create table if not exists public.schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())`);
 const files=(await fs.readdir("database/migrations")).filter(x=>x.endsWith(".sql")).sort();
 for(const file of files){const sql=await fs.readFile(path.join("database/migrations",file),"utf8"),checksum=crypto.createHash("sha256").update(sql).digest("hex");const existing=await pool.query("select checksum from schema_migrations where version=$1",[file]);if(existing.rowCount){if(existing.rows[0].checksum!==checksum)throw new Error(`Migration ${file} changed after application.`);continue;}const client=await pool.connect();try{await client.query("begin");await client.query(sql);await client.query("insert into schema_migrations(version,checksum) values($1,$2)",[file,checksum]);await client.query("commit");console.log("Applied",file);}catch(e){await client.query("rollback");throw e}finally{client.release();}}
}finally{await pool.end();}
