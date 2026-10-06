import "server-only";
import { randomUUID } from "node:crypto";
import { ApiError } from "./http";
import { withPlatform } from "./db";
import { createAuthToken } from "./auth-tokens";
import { hashPassword } from "./password";
import { sendMail, mailLayout } from "./email";
import { env } from "./env";

export async function inviteUser(email:string,data:Record<string,string>){
 const organizationId=data.organization_id||data.tenant_id;if(!organizationId)throw new ApiError(400,"organization_required","Organisation fehlt.");
 const existing=await withPlatform(async c=>(await c.query<{id:string}>("select id from app_users where lower(email)=lower($1) limit 1",[email])).rows[0]);
 const userId=existing?.id??randomUUID();
 if(!existing)await withPlatform(async c=>c.query("insert into app_users(id,email,display_name,status,password_hash) values($1,$2,$3,'invited',$4)",[userId,email,data.name||email,await hashPassword(randomUUID()+randomUUID())]));
 await withPlatform(async c=>{const member=(await c.query("select role,status from organization_memberships where organization_id=$1 and user_id=$2 for update",[organizationId,userId])).rows[0];if(member?.status==='active')throw new ApiError(409,"already_member","Diese Person ist bereits im Team.");return c.query("insert into organization_memberships(organization_id,user_id,role,status,email) values($1,$2,$3,'invited',$4) on conflict(organization_id,user_id) do update set role=excluded.role,status='invited'",[organizationId,userId,data.role||"member",email]);});
 const token=await createAuthToken({type:"invitation",email,userId,organizationId,metadata:data,ttlMinutes:60*24*7});
 const url=`${env.appUrl}/einladung?token=${encodeURIComponent(token)}`;
 await sendMail({to:email,subject:"Einladung zu Binso One",text:`Einladung annehmen: ${url}`,html:mailLayout("Einladung zu Binso One","<p>Du wurdest zu einem Binso One Firmenkonto eingeladen.</p>",{label:"Einladung annehmen",url})});
 return {id:userId,email};
}
