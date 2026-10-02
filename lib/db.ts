import {Pool, type PoolClient, type QueryResultRow} from "pg";

export type SqlParam=string|number|boolean|null|Date|Buffer;
export interface Database{
  query<T extends QueryResultRow=QueryResultRow>(sql:string,params?:SqlParam[]):Promise<T[]>;
  transaction<T>(work:(db:Database)=>Promise<T>):Promise<T>;
}
export function databaseConfigured(){return Boolean(process.env.DATABASE_URL)}
export function requireDatabase(){if(!databaseConfigured())throw new Error("DATABASE_NOT_CONFIGURED")}

let pool:Pool|undefined;

function connectionPool(){
  requireDatabase();
  if(!pool){
    pool=new Pool({
      connectionString:process.env.DATABASE_URL,
      max:Number(process.env.DB_POOL_MAX||10),
      idleTimeoutMillis:30_000,
      connectionTimeoutMillis:5_000,
      ssl:process.env.DB_SSL==="disable"?false:{rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED!=="false"}
    });
    pool.on("error",()=>{});
  }
  return pool;
}

function clientDatabase(client:PoolClient):Database{
  return {
    async query<T extends QueryResultRow=QueryResultRow>(sql:string,params:SqlParam[]=[]){
      const result=await client.query<T>(sql,params);
      return result.rows;
    },
    async transaction<T>(work:(db:Database)=>Promise<T>){
      return work(clientDatabase(client));
    }
  };
}

export function getDatabase():Database{
  return {
    async query<T extends QueryResultRow=QueryResultRow>(sql:string,params:SqlParam[]=[]){
      const result=await connectionPool().query<T>(sql,params);
      return result.rows;
    },
    async transaction<T>(work:(db:Database)=>Promise<T>){
      const client=await connectionPool().connect();
      try{
        await client.query("BEGIN");
        const result=await work(clientDatabase(client));
        await client.query("COMMIT");
        return result;
      }catch(error){
        await client.query("ROLLBACK");
        throw error;
      }finally{
        client.release();
      }
    }
  };
}

export async function databaseHealth(){
  if(!databaseConfigured())return {configured:false,ok:false,reason:"DATABASE_NOT_CONFIGURED" as const};
  try{
    await connectionPool().query("SELECT 1");
    return {configured:true,ok:true as const};
  }catch{
    return {configured:true,ok:false,reason:"DATABASE_UNAVAILABLE" as const};
  }
}
