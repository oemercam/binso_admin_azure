import {NextRequest} from 'next/server';
import {randomUUID} from 'node:crypto';
import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {withTenant} from '@/lib/server/db';
import {stripeConfigured} from '@/lib/server/stripe';
import {startBillingCheckout} from '@/lib/server/repositories/stripe-billing';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {asObject,enumField} from '@/lib/server/validation';
import {enforceRateLimit} from '@/lib/server/rate-limit';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);const s=await requireSession();authorize(s,'billing:write');
 if(!stripeConfigured())throw new ApiError(503,'billing_unavailable','Stripe ist noch nicht vollständig eingerichtet.');
 await enforceRateLimit(request,'checkout:'+s.organizationId,10,60_000);
 const body=asObject(await readJson(request,8000));const plan=enumField(body,'plan',['start','business','pro'] as const),billing=enumField(body,'billing',['monthly','yearly'] as const);
 const requestKey=typeof body.requestKey==='string'?body.requestKey:randomUUID();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey))throw new ApiError(400,'request_key_invalid','Ungültige Checkout-Anfrage.');
 return json(await withTenant(s.organizationId,s.userId,c=>startBillingCheckout(c,s,plan,billing,requestKey)));
}catch(error){return apiError(error)}}
