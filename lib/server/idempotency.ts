import "server-only";
import {createHash} from "node:crypto";
import type {PoolClient} from "pg";

export function requestHash(value:unknown){return createHash("sha256").update(JSON.stringify(value)).digest("hex")}
export async function getIdempotentResponse(client:PoolClient,input:{organizationId:string;scope:string;key:string;hash:string}){
 const r=await client.query<{request_hash:string;response_status:number|null;response_body:unknown}>(`select request_hash,response_status,response_body from idempotency_keys where organization_id=$1 and scope=$2 and key=$3 and expires_at>now()`,[input.organizationId,input.scope,input.key]);
 const row=r.rows[0];if(!row)return null;if(row.request_hash!==input.hash)throw new Error("Idempotency-Key wurde bereits für eine andere Anfrage verwendet.");if(row.response_status==null)return {pending:true as const};return {pending:false as const,status:row.response_status,body:row.response_body};
}
export async function reserveIdempotency(client:PoolClient,input:{organizationId:string;userId:string;scope:string;key:string;hash:string}){
 await client.query(`insert into idempotency_keys(organization_id,user_id,scope,key,request_hash) values($1,$2,$3,$4,$5) on conflict do nothing`,[input.organizationId,input.userId,input.scope,input.key,input.hash]);
}
export async function completeIdempotency(client:PoolClient,input:{organizationId:string;scope:string;key:string;status:number;body:unknown}){
 await client.query(`update idempotency_keys set response_status=$1,response_body=$2::jsonb where organization_id=$3 and scope=$4 and key=$5`,[input.status,JSON.stringify(input.body),input.organizationId,input.scope,input.key]);
}
