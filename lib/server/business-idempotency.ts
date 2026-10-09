import 'server-only';
import type {PoolClient} from 'pg';
import {createHash} from 'node:crypto';
import {ApiError} from './http';
function stable(value:unknown):unknown{if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,stable(item)]));return value;}
/** The lock, business write and replay record must share the caller's transaction. */
export async function idempotentBusiness<T>(c:PoolClient,input:{organizationId:string;userId:string;operation:string;key:string;body:unknown},write:()=>Promise<T>):Promise<T>{
 if(input.key.length<8||input.key.length>128)throw new ApiError(400,'idempotency_required','Idempotency-Key fehlt oder ist ungültig.');
 const hash=createHash('sha256').update(JSON.stringify(stable({userId:input.userId,body:input.body}))).digest('hex');
 await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[input.organizationId+':'+input.operation+':'+input.key]);
 const previous=(await c.query('select request_hash,response_json from business_idempotency_keys where organization_id=$1 and operation=$2 and idempotency_key=$3',[input.organizationId,input.operation,input.key])).rows[0];
 if(previous){if(previous.request_hash!==hash)throw new ApiError(409,'idempotency_conflict','Die Anfragekennung wurde für andere Angaben verwendet.');return previous.response_json as T;}
 const result=await write();
 await c.query('insert into business_idempotency_keys(organization_id,operation,idempotency_key,request_hash,response_json,created_by_user_id) values($1,$2,$3,$4,$5::jsonb,$6)',[input.organizationId,input.operation,input.key,hash,JSON.stringify(result),input.userId]);
 return result;
}
