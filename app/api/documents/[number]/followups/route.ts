import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,json,readJson,ApiError} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {asObject,enumField,stringField} from '@/lib/server/validation';
import {offerFollowupHistory,configureOfferFollowup} from '@/lib/server/offer-followups';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function GET(_request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 const s=await requireSession(),{number}=await params;
 return json(await withTenant(s.organizationId,s.userId,c=>offerFollowupHistory(c,s,number)));
}catch(error){return apiError(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);await enforceRateLimit(request,'offer-followup',20,15*60_000);const s=await requireSession(),{number}=await params,b=asObject(await readJson(request,2048));
 if(Object.keys(b).some(key=>!['action','dueDate','optIn'].includes(key)))throw new ApiError(400,'invalid_body','Ungültige Anfrage.');
 const action=enumField(b,'action',['schedule','cancel'] as const),dueDate=action==='schedule'?stringField(b,'dueDate',{min:10,max:10}):undefined;
 return json(await withTenant(s.organizationId,s.userId,c=>configureOfferFollowup(c,s,number,{action,dueDate,optIn:b.optIn===true})));
}catch(error){return apiError(error);}}
