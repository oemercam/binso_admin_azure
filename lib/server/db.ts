import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { env, requireDatabaseUrl } from "@/lib/server/env";

declare global {
  var __binsoPool:Pool|undefined;
}

function createPool(){
  return new Pool({
    connectionString:requireDatabaseUrl(),
    max:env.databasePoolMax,
    ssl:env.databaseSsl?{rejectUnauthorized:env.databaseSslRejectUnauthorized}:undefined,
    idleTimeoutMillis:30_000,
    connectionTimeoutMillis:8_000
  });
}

export function db(){
  if(!global.__binsoPool)global.__binsoPool=createPool();
  return global.__binsoPool;
}

export async function query<T extends QueryResultRow=QueryResultRow>(text:string,params:unknown[]=[]){
  return db().query<T>(text,params);
}

export async function withTransaction<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await db().connect();
  try{
    await client.query("BEGIN");
    const result=await fn(client);
    await client.query("COMMIT");
    return result;
  }catch(error){
    await client.query("ROLLBACK");
    throw error;
  }finally{
    client.release();
  }
}

export async function withTenant<T>(organizationId:string,userId:string,fn:(client:PoolClient)=>Promise<T>):Promise<T>{
  return withTransaction(async client=>{
    await client.query("SELECT set_config('app.organization_id',$1,true)",[organizationId]);
    await client.query("SELECT set_config('app.user_id',$1,true)",[userId]);
    return fn(client);
  });
}

export async function withPlatform<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{
  return withTransaction(async client=>{
    await client.query("SELECT set_config('app.platform_operator','true',true)");
    return fn(client);
  });
}
