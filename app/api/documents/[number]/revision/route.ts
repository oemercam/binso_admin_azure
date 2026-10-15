import {NextRequest} from 'next/server';
import {apiError,assertSameOrigin,json} from '@/lib/server/http';
import {requireSession} from '@/lib/server/session';
import {withTenant} from '@/lib/server/db';
import {createOfferRevision} from '@/lib/server/offer-revisions';
export async function POST(request:NextRequest,{params}:{params:Promise<{number:string}>}){try{
 assertSameOrigin(request);const s=await requireSession(),{number}=await params;
 const item=await withTenant(s.organizationId,s.userId,c=>createOfferRevision(c,s,number,request.headers.get('idempotency-key')?.trim()??''));
 return json({item},201);
}catch(error){return apiError(error)}}
