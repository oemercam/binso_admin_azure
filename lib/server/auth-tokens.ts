import "server-only";
import {createHash,randomBytes} from "node:crypto";
import type {PoolClient} from "pg";
import {query} from "@/lib/server/db";

export type AuthTokenType="verify_email"|"password_reset"|"invitation";
const hash=(token:string)=>createHash("sha256").update(token).digest("hex");
export async function createAuthToken(input:{type:AuthTokenType;email:string;userId?:string;organizationId?:string;metadata?:Record<string,unknown>;ttlMinutes:number}){
 const token=randomBytes(32).toString("base64url");
 await query(`insert into auth_tokens(user_id,organization_id,email,token_hash,token_type,metadata,expires_at) values($1,$2,$3,$4,$5,$6::jsonb,now()+($7||' minutes')::interval)`,[input.userId||null,input.organizationId||null,input.email,hash(token),input.type,JSON.stringify(input.metadata||{}),String(input.ttlMinutes)]);
 return token;
}
export async function consumeAuthToken(type:AuthTokenType,token:string,executor?:Pick<PoolClient,"query">){
 const sql=`update auth_tokens set consumed_at=now() where token_hash=$1 and token_type=$2 and consumed_at is null and expires_at>now() returning id,user_id,organization_id,email,metadata`;
 const params=[hash(token),type];
 type Row={id:string;user_id:string|null;organization_id:string|null;email:string;metadata:Record<string,unknown>};
 const result=executor?await executor.query<Row>(sql,params):await query<Row>(sql,params);
 return result.rows[0]||null;
}
