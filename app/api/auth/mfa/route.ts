import {NextRequest} from "next/server";
import {getSession} from "@/lib/server/session";
import {query,withTenant} from "@/lib/server/db";
import {ApiError,apiError,assertSameOrigin,json} from "@/lib/server/http";
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {audit} from '@/lib/server/audit';
import {mailLayout,sendMail} from '@/lib/server/email';

export const runtime="nodejs";
export async function GET(){
  try{
    const session=await getSession({allowMfaEnrollment:true});
    if(!session)return json({error:"unauthorized",message:"Anmeldung erforderlich."},401);
    const user=await query<{mfa_enabled:boolean}>("select mfa_enabled from app_users where id=$1 limit 1",[session.userId]);
    const enabled=user.rows[0]?.mfa_enabled===true;
    return json({enabled,required:session.mfaRequired===true,role:session.role,demo:session.isDemo===true});
  }catch(error){return apiError(error);}
}
export async function DELETE(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'mfa-disable',5,15*60_000);
 const session=await getSession();if(!session)throw new ApiError(401,'unauthorized','Anmeldung erforderlich.');
 await requireFreshAuthentication(session);
 await withTenant(session.organizationId,session.userId,async client=>{
  const policy=(await client.query('select employee_mfa_required from organizations where id=$1 for update',[session.organizationId])).rows[0];
  if(policy?.employee_mfa_required)throw new ApiError(403,'mfa_required','Dein Unternehmen verlangt den Authenticator. Er kann nicht einzeln deaktiviert werden.');
  const user=(await client.query("select mfa_enabled from app_users where id=$1 and status='active' for update",[session.userId])).rows[0];
  if(!user?.mfa_enabled)throw new ApiError(409,'mfa_not_enabled','Der Authenticator ist nicht aktiviert.');
  await client.query('update app_users set mfa_enabled=false,mfa_secret_enc=null,mfa_pending_secret_enc=null,mfa_pending_expires_at=null,recovery_code_hashes=\'[]\'::jsonb,updated_at=now() where id=$1',[session.userId]);
  await client.query('delete from auth_sessions where user_id=$1 and id<>$2',[session.userId,session.sessionId]);
  await client.query('update auth_sessions set step_up_at=null where id=$1',[session.sessionId]);
  await audit(client,{organizationId:session.organizationId,userId:session.userId,action:'auth.mfa_disabled',entityType:'app_users',entityId:session.userId});
 });
 let notice='unconfirmed';try{if((await sendMail({to:session.email,subject:'Binso One – Authenticator deaktiviert',text:'Der Authenticator deines Binso-One-Kontos wurde nach Sicherheitsbestätigung deaktiviert. Falls du dies nicht veranlasst hast, ändere dein Passwort und kontaktiere den Support.',html:mailLayout('Authenticator deaktiviert','<p>Der Authenticator deines Binso-One-Kontos wurde nach Sicherheitsbestätigung deaktiviert. Falls du dies nicht veranlasst hast, ändere dein Passwort und kontaktiere den Support.</p>')})).delivered)notice='accepted';}catch{/* Persisted security change is never repeated because a notice is uncertain. */}
 return json({ok:true,notice});
}catch(error){return apiError(error)}
}
