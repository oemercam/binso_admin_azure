import 'server-only';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {limitsConfig} from '@/config/limits';
import {env} from '@/lib/server/env';
import {ApiError} from '@/lib/server/http';
import type {BillingCycle,PlanId} from '@/config/domain';
export const stripeApiVersion='2026-09-30.endive';
export type StripeObject=Record<string,unknown>;
export const objectValue=(value:unknown):StripeObject=>value&&typeof value==='object'&&!Array.isArray(value)?value as StripeObject:{};
export const stripeId=(value:unknown):string=>typeof value==='string'?value:typeof objectValue(value).id==='string'?String(objectValue(value).id):'';
export function stripeLiveMode(){return /^(sk|rk)_live_/.test(env.stripeSecretKey??'');}
export function stripeConfigured(){return Boolean(env.stripeSecretKey&&env.stripeWebhookSecret&&(env.appMode!=='production'||stripeLiveMode()));}
function secret(){if(!env.stripeSecretKey)throw new ApiError(503,'billing_unavailable','Stripe ist noch nicht vollständig eingerichtet.');return env.stripeSecretKey;}
async function stripeRequest<T>(path:string,body?:URLSearchParams,idempotencyKey?:string):Promise<T>{
 const headers:Record<string,string>={authorization:`Bearer ${secret()}`,'Stripe-Version':stripeApiVersion};
 if(body)headers['content-type']='application/x-www-form-urlencoded';
 if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
 let response:Response;
 try{response=await fetch(`https://api.stripe.com/v1${path}`,{method:body?'POST':'GET',headers,body,cache:'no-store',signal:AbortSignal.timeout(10000)});}catch{throw new ApiError(503,'stripe_unavailable','Stripe ist momentan nicht erreichbar. Bitte erneut versuchen.');}
 if(!response.ok)throw new ApiError(502,'stripe_request_failed','Stripe konnte die Anfrage nicht verarbeiten. Bitte die Zahlungskonfiguration prüfen.');
 return await response.json() as T;
}
export const retrieveSubscription=(id:string)=>stripeRequest<StripeObject>('/subscriptions/'+encodeURIComponent(id));
export const retrieveInvoice=(id:string)=>stripeRequest<StripeObject>('/invoices/'+encodeURIComponent(id));
export const retrievePrice=(id:string)=>stripeRequest<StripeObject>('/prices/'+encodeURIComponent(id));
export function priceSelection(priceId:string):{plan:PlanId;billing:BillingCycle}|null{
 for(const plan of ['start','business','pro'] as const)for(const billing of ['monthly','yearly'] as const)if(env.stripePrices[plan][billing]===priceId)return {plan,billing};
 return null;
}
export function validatePrice(price:StripeObject,billing:BillingCycle,requireActive=true){
 const recurring=objectValue(price.recurring),amount=Number(price.unit_amount);
 if((requireActive&&price.active!==true)||price.livemode!==stripeLiveMode()||price.currency!=='chf'||recurring.interval!==(billing==='monthly'?'month':'year')||Number(recurring.interval_count)!==1||!Number.isSafeInteger(amount)||amount<=0)throw new ApiError(503,'stripe_price_invalid','Der Stripe-Preis ist nicht als gültiger CHF-Abopreis im konfigurierten Stripe-Modus eingerichtet.');
 return amount/100;
}
export async function createStripeCustomer(input:{email:string;organizationId:string;name:string}){
 const body=new URLSearchParams({email:input.email,name:input.name,'metadata[organization_id]':input.organizationId});
 return stripeRequest<{id:string}>('/customers',body,`binso-customer-${input.organizationId}`);
}
export async function createCheckoutSession(input:{priceId:string;customerId:string;organizationId:string;successUrl:string;cancelUrl:string;requestKey:string}){
 const body=new URLSearchParams({mode:'subscription',customer:input.customerId,'line_items[0][price]':input.priceId,'line_items[0][quantity]':'1',client_reference_id:input.organizationId,'metadata[organization_id]':input.organizationId,'subscription_data[metadata][organization_id]':input.organizationId,success_url:input.successUrl,cancel_url:input.cancelUrl,billing_address_collection:'required','tax_id_collection[enabled]':'true'});
 if(env.stripeAutomaticTax)body.set('automatic_tax[enabled]','true');
 return stripeRequest<{id:string;url:string;expires_at:number}>('/checkout/sessions',body,`binso-checkout-${input.organizationId}-${input.requestKey}`);
}
export const retrieveCheckoutSession=(id:string)=>stripeRequest<StripeObject>('/checkout/sessions/'+encodeURIComponent(id));
export const expireCheckoutSession=(id:string)=>stripeRequest<StripeObject>('/checkout/sessions/'+encodeURIComponent(id)+'/expire',new URLSearchParams());
export async function createPortalSession(input:{customerId:string;returnUrl:string}){return stripeRequest<{url:string}>('/billing_portal/sessions',new URLSearchParams({customer:input.customerId,return_url:input.returnUrl}));}
export function verifyStripeSignature(payload:string,header:string){
 if(!env.stripeWebhookSecret)throw new ApiError(503,'webhook_unavailable','Stripe-Webhook ist nicht eingerichtet.');
 const fields=header.split(',').map(x=>x.split('=',2));const timestamp=fields.find(([k])=>k==='t')?.[1];
 if(!timestamp||!/^\d+$/.test(timestamp)||!Number.isSafeInteger(Number(timestamp))||Math.abs(Date.now()/1000-Number(timestamp))>limitsConfig.stripeWebhookToleranceSeconds)return false;
 const expected=createHmac('sha256',env.stripeWebhookSecret).update(`${timestamp}.${payload}`,'utf8').digest();
 return fields.filter(([k])=>k==='v1').some(([,sig])=>typeof sig==='string'&&/^[a-f0-9]{64}$/i.test(sig)&&timingSafeEqual(expected,Buffer.from(sig,'hex')));
}
