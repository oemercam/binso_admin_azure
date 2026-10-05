import {NextRequest} from 'next/server';
import {apiError,ApiError,json} from '@/lib/server/http';
import {verifyStripeSignature,objectValue} from '@/lib/server/stripe';
import {withPlatform} from '@/lib/server/db';
import {processStripeEvent} from '@/lib/server/repositories/stripe-billing';
export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 const length=Number(request.headers.get('content-length')??'0');
 if(length>262144)throw new ApiError(413,'request_too_large','Webhook ist zu gross.');
 const body=await request.text();if(Buffer.byteLength(body,'utf8')>262144)throw new ApiError(413,'request_too_large','Webhook ist zu gross.');
 const signature=request.headers.get('stripe-signature');
 if(!signature||!verifyStripeSignature(body,signature))throw new ApiError(400,'invalid_signature','Ungültige Stripe-Signatur.');
 let event;try{event=objectValue(JSON.parse(body));}catch{throw new ApiError(400,'invalid_json','Ungültiges Stripe-Ereignis.');}
 return json(await withPlatform(c=>processStripeEvent(c,event)));
}catch(error){return apiError(error)}}
