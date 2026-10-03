import "server-only";
import pg,{type PoolClient,types} from "pg";
import {getBackendEnv} from "./env";
types.setTypeParser(1700,value=>Number(value));
declare global{var __binsoPgPool:pg.Pool|undefined}
function pool(){if(globalThis.__binsoPgPool)return globalThis.__binsoPgPool;const {databaseUrl}=getBackendEnv();if(!databaseUrl)throw new Error("DATABASE_URL is required.");const p=new pg.Pool({connectionString:databaseUrl,ssl:process.env.DATABASE_SSL==="false"?undefined:{rejectUnauthorized:process.env.DATABASE_SSL_REJECT_UNAUTHORIZED!=="false"},max:Number(process.env.DATABASE_POOL_MAX||10),idleTimeoutMillis:30000,connectionTimeoutMillis:10000});if(process.env.NODE_ENV!=="production")globalThis.__binsoPgPool=p;return p}
export async function query<T extends pg.QueryResultRow=pg.QueryResultRow>(text:string,params:unknown[]=[]){return pool().query<T>(text,params)}
export async function withUser<T>(userId:string|null,fn:(client:PoolClient)=>Promise<T>){const client=await pool().connect();try{await client.query("begin");if(userId){await client.query("set local role binso_app");await client.query("select set_config('app.user_id',$1,true)",[userId]);}const value=await fn(client);await client.query("commit");return value}catch(error){await client.query("rollback");throw error}finally{client.release()}}
export async function withPrivileged<T>(fn:(client:PoolClient)=>Promise<T>){return withUser(null,fn)}
