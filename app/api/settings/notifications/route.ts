import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
const kinds=['Rechnungen','Angebote','Support','Zeiterfassung','Produktupdates'];
export async function GET(){try{const s=await requireSession();return json({items:await withTenant(s.organizationId,s.userId,async c=>(await c.query('select kind,email,push from notification_preferences where organization_id=$1 and user_id=$2',[s.organizationId,s.userId])).rows)});}catch(e){return apiError(e)}}
export async function PATCH(request:NextRequest){try{assertSameOrigin(request);const s=await requireSession();const body=await readJson<{kind:string;channel:string;enabled:boolean}>(request,2048);if(!kinds.includes(body.kind)||!['email','push'].includes(body.channel)||typeof body.enabled!=='boolean')throw new ApiError(400,'invalid_preference','Ungültige Einstellung.');await withTenant(s.organizationId,s.userId,c=>c.query(`insert into notification_preferences(organization_id,user_id,kind,${body.channel}) values($1,$2,$3,$4) on conflict(organization_id,user_id,kind) do update set ${body.channel}=excluded.${body.channel},updated_at=now()`,[s.organizationId,s.userId,body.kind,body.enabled]));return json({ok:true});}catch(e){return apiError(e)}}
