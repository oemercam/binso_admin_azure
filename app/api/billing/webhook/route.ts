import {NextRequest} from 'next/server';
import {apiError,ApiError,json,readBoundedBody} from '@/lib/server/http';
import {verifyStripeSignature,objectValue} from '@/lib/server/stripe';
import {withPlatform} from '@/lib/server/db';
import {processStripeEvent} from '@/lib/server/repositories/stripe-billing';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 const body=(await readBoundedBody(request,262144)).toString('utf8');
 const signature=request.headers.get('stripe-signature');
 if(!signature||!verifyStripeSignature(body,signature))throw new ApiError(400,'invalid_signature','Ungültige Stripe-Signatur.');
 let event;try{event=objectValue(JSON.parse(body));}catch{throw new ApiError(400,'invalid_json','Ungültiges Stripe-Ereignis.');}
 return json(await withPlatform(c=>processStripeEvent(c,event)));
}catch(error){return apiError(error)}}
