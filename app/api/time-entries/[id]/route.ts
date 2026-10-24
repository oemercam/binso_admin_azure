import {NextRequest} from 'next/server';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {reviewTimeEntry} from '@/lib/server/repositories/time-review';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{assertSameOrigin(request);const s=await requireSession();const body=await readJson<{action?:string;note?:string;durationMinutes?:number;description?:string}>(request,2048);
 if(!body.action)throw new ApiError(400,'action_invalid','Ungültige Aktion.');
 const {id}=await params;const action=body.action;
 const item=await withTenant(s.organizationId,s.userId,c=>reviewTimeEntry(c,s,id,{...body,action}));return json({item});
 }catch(e){return apiError(e)}
}
