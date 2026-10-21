import {requireOperatorSession} from '@/lib/server/operator/session';
import {authorizeOperator} from '@/lib/server/operator/rbac';
import {NextRequest} from 'next/server';
import {withPlatform} from '@/lib/server/db';
import {platformAudit} from '@/lib/server/operator/audit';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';

/** A separate operator session, never a tenant role, owns this one field. */
export async function GET(){try{
 const session=await requireOperatorSession();authorizeOperator(session,'platform:read');
 const item=await withPlatform(async c=>(await c.query("select language from platform_operator_assignments where user_id=$1 and status='active'",[session.userId])).rows[0]);
 if(!item)throw new ApiError(403,'forbidden','Keine Berechtigung.');
 return json({item});
}catch(error){return apiError(error)}}
export async function PATCH(request:NextRequest){try{
 assertSameOrigin(request);const session=await requireOperatorSession();authorizeOperator(session,'platform:read');
 const body=await readJson<{language?:unknown}>(request,1024);
 if(!body||Array.isArray(body)||typeof body.language!=='string'||!['de','fr','it','en'].includes(body.language)||Object.keys(body).some(key=>key!=='language'))throw new ApiError(400,'language_invalid','Bitte eine verfügbare Sprache wählen.');
 const item=await withPlatform(async c=>{
  const previous=(await c.query("select language from platform_operator_assignments where user_id=$1 and status='active' for update",[session.userId])).rows[0];
  if(!previous)throw new ApiError(403,'forbidden','Keine Berechtigung.');
  if(previous.language===body.language)return previous;
  const result=(await c.query("update platform_operator_assignments set language=$2,updated_at=now() where user_id=$1 and status='active' returning language",[session.userId,body.language])).rows[0];
  await platformAudit({userId:session.userId,userEmail:session.email,action:'operator.preference.language',entityType:'platform_operator_assignments',entityId:session.userId,metadata:{language:body.language}},c);
  return result;
 });
 return json({item});
}catch(error){return apiError(error)}}
