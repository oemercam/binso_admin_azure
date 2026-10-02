import {readdir,readFile} from "node:fs/promises";
import {join} from "node:path";
import {Pool} from "pg";

async function main(){
  const connectionString=process.env.DATABASE_URL;
  if(!connectionString)throw new Error("DATABASE_URL is required");
  const pool=new Pool({
    connectionString,
    ssl:process.env.DB_SSL==="disable"?false:{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=="false"}
  });
  try{
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations(
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const dir=join(process.cwd(),"db","migrations");
    const files=(await readdir(dir)).filter(name=>name.endsWith(".sql")).sort();
    for(const name of files){
      const applied=await pool.query("SELECT 1 FROM schema_migrations WHERE name=$1",[name]);
      if(applied.rowCount)continue;
      const sql=await readFile(join(dir,name),"utf8");
      const client=await pool.connect();
      try{
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(name) VALUES($1)",[name]);
        await client.query("COMMIT");
        process.stdout.write(`applied ${name}\n`);
      }catch(error){
        await client.query("ROLLBACK");
        throw error;
      }finally{
        client.release();
      }
    }
  }finally{
    await pool.end();
  }
}
main().catch(error=>{
  console.error(error instanceof Error?error.message:"Migration failed");
  process.exitCode=1;
});
