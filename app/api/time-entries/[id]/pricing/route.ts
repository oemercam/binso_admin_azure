import {NextRequest} from 'next/server';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {timePriceState,bindTimePriceSource,type TimePriceSide} from '@/lib/server/repositories/time-price-sources';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const s=await requireSession(),{id}=await params,side=request.nextUrl.searchParams.get('side')??'sale';
 if(!['purchase','sale'].includes(side))throw new ApiError(400,'price_source_invalid','Bitte die angezeigte Leistung und freigegebene Preisrevision auswählen.');
 return json(await withTenant(s.organizationId,s.userId,c=>timePriceState(c,s,id,side as TimePriceSide),{snapshot:true}));
}catch(error){return apiError(error)}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 assertSameOrigin(request);const s=await requireSession(),{id}=await params,body=await readJson(request,4096);
 return json(await withTenant(s.organizationId,s.userId,c=>bindTimePriceSource(c,s,id,body,request.headers.get('idempotency-key')??'')),201);
}catch(error){return apiError(error)}}
