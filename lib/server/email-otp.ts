import "server-only";
import {createHash,createHmac,randomInt,timingSafeEqual} from "node:crypto";
import type {PoolClient} from "pg";
import {domainConfig} from "@/config/domain";
import {env} from "@/lib/server/env";
import {withTransaction} from "@/lib/server/db";

export type EmailCodePurpose="verify_email"|"login"|"step_up";

function key(){
  if(!env.appEncryptionKey)throw new Error("APP_ENCRYPTION_KEY is required for email OTP.");
  return createHash("sha256").update(env.appEncryptionKey).digest();
}
function normalize(email:string){return email.trim().toLowerCase()}
function hashCode(email:string,purpose:EmailCodePurpose,code:string,sessionId?:string){
  return createHmac("sha256",key()).update(`${purpose}|${normalize(email)}|${code}`+(purpose==='step_up'?'|'+sessionId:'')).digest("hex");
}
function safeEqual(a:string,b:string){
  const left=Buffer.from(a);const right=Buffer.from(b);
  return left.length===right.length&&timingSafeEqual(left,right);
}

export async function issueEmailCode(input:{email:string;purpose:EmailCodePurpose;userId:string;organizationId?:string|null;sessionId?:string}){
  if(input.purpose==='step_up'&&!input.sessionId)throw new Error('A fresh-authentication challenge must be session-bound.');
  const email=normalize(input.email);
  const code=randomInt(0,1_000_000).toString().padStart(6,"0");
  await withTransaction(async(client:PoolClient)=>{
    await client.query("update auth_email_codes set consumed_at=now() where lower(email)=lower($1) and purpose=$2 and session_id is not distinct from $3::uuid and consumed_at is null",[email,input.purpose,input.sessionId??null]);
    await client.query(
      `insert into auth_email_codes(user_id,organization_id,email,purpose,code_hash,expires_at,session_id)
       values($1,$2,$3,$4,$5,now()+($6||' minutes')::interval,$7)`,
      [input.userId,input.organizationId??null,email,input.purpose,hashCode(email,input.purpose,code,input.sessionId),String(domainConfig.emailCodeMinutes),input.sessionId??null]
    );
  });
  return code;
}

export async function consumeEmailCode(input:{email:string;purpose:EmailCodePurpose;code:string;sessionId?:string}){
  if(input.purpose==='step_up'&&!input.sessionId)return false;
  const email=normalize(input.email);
  const code=input.code.replace(/\s/g,"");
  if(!/^\d{6}$/.test(code))return false;
  return withTransaction(async(client:PoolClient)=>{
    const result=await client.query<{id:string;code_hash:string;attempts:number;expires_at:Date}>(
      `select id,code_hash,attempts,expires_at
         from auth_email_codes
        where lower(email)=lower($1) and purpose=$2 and session_id is not distinct from $3::uuid and consumed_at is null
        order by created_at desc limit 1 for update`,
      [email,input.purpose,input.sessionId??null]
    );
    const row=result.rows[0];
    if(!row||row.expires_at.getTime()<=Date.now())return false;
    const attempts=row.attempts+1;
    const ok=safeEqual(row.code_hash,hashCode(email,input.purpose,code,input.sessionId));
    await client.query(
      `update auth_email_codes set attempts=$2,consumed_at=case when $3::boolean or $2>=5 then now() else consumed_at end where id=$1`,
      [row.id,attempts,ok]
    );
    return ok;
  });
}
