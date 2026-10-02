import crypto from "node:crypto";
import { ApiError } from "./http";
import { getBackendEnv } from "./env";

type StripeObject=Record<string,unknown>;

function stripeKey(){
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key) throw new ApiError(503,"billing_not_configured","Zahlungsabwicklung ist nicht konfiguriert.");
  return key;
}

async function stripeRequest<T>(path:string,params:URLSearchParams){
  const response=await fetch("https://api.stripe.com/v1/"+path,{
    method:"POST",
    headers:{
      Authorization:"Bearer "+stripeKey(),
      "Content-Type":"application/x-www-form-urlencoded",
    },
    body:params.toString(),
    cache:"no-store",
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    console.error("Stripe request failed",response.status,typeof payload?.error?.type==="string"?payload.error.type:"unknown");
    throw new ApiError(502,"billing_provider_error","Zahlungsabwicklung konnte die Anfrage nicht verarbeiten.");
  }
  return payload as T;
}

export function stripePriceForPlan(plan:"start"|"business"|"pro"){
  const map={
    start:process.env.STRIPE_PRICE_START,
    business:process.env.STRIPE_PRICE_BUSINESS,
    pro:process.env.STRIPE_PRICE_PRO,
  };
  const price=map[plan];
  if(!price) throw new ApiError(503,"billing_price_not_configured","Preis ist noch nicht für Stripe konfiguriert.");
  return price;
}

export async function createStripeCustomer(input:{tenantId:string;companyName:string;email?:string}){
  const params=new URLSearchParams();
  params.set("name",input.companyName);
  if(input.email) params.set("email",input.email);
  params.set("metadata[tenant_id]",input.tenantId);
  const customer=await stripeRequest<StripeObject>("customers",params);
  if(typeof customer.id!=="string") throw new ApiError(502,"billing_provider_error","Stripe-Kunde konnte nicht erstellt werden.");
  return customer.id;
}

export async function createCheckoutSession(input:{tenantId:string;customerId:string;plan:"start"|"business"|"pro"}){
  const {appUrl}=getBackendEnv();
  const params=new URLSearchParams();
  params.set("mode","subscription");
  params.set("customer",input.customerId);
  params.set("client_reference_id",input.tenantId);
  params.set("line_items[0][price]",stripePriceForPlan(input.plan));
  params.set("line_items[0][quantity]","1");
  params.set("allow_promotion_codes","true");
  params.set("success_url",appUrl+"/einstellungen/abonnement?checkout=success");
  params.set("cancel_url",appUrl+"/einstellungen/abonnement?checkout=cancelled");
  params.set("metadata[tenant_id]",input.tenantId);
  params.set("metadata[plan]",input.plan);
  params.set("subscription_data[metadata][tenant_id]",input.tenantId);
  params.set("subscription_data[metadata][plan]",input.plan);
  const session=await stripeRequest<StripeObject>("checkout/sessions",params);
  if(typeof session.url!=="string") throw new ApiError(502,"billing_provider_error","Stripe Checkout konnte nicht geöffnet werden.");
  return session.url;
}

export async function createPortalSession(customerId:string){
  const {appUrl}=getBackendEnv();
  const params=new URLSearchParams();
  params.set("customer",customerId);
  params.set("return_url",appUrl+"/einstellungen/abonnement");
  const session=await stripeRequest<StripeObject>("billing_portal/sessions",params);
  if(typeof session.url!=="string") throw new ApiError(502,"billing_provider_error","Billing-Portal konnte nicht geöffnet werden.");
  return session.url;
}

export function verifyStripeWebhook(body:string,signature:string|null){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!secret||!signature) throw new ApiError(400,"stripe_signature_missing","Ungültige Webhook-Signatur.");
  const parts=signature.split(",").map(part=>part.trim());
  const timestamp=parts.find(part=>part.startsWith("t="))?.slice(2);
  const signatures=parts.filter(part=>part.startsWith("v1=")).map(part=>part.slice(3));
  if(!timestamp||!signatures.length) throw new ApiError(400,"stripe_signature_invalid","Ungültige Webhook-Signatur.");
  const age=Math.abs(Math.floor(Date.now()/1000)-Number(timestamp));
  if(!Number.isFinite(age)||age>300) throw new ApiError(400,"stripe_signature_expired","Webhook-Signatur ist abgelaufen.");
  const expected=crypto.createHmac("sha256",secret).update(timestamp+"."+body,"utf8").digest("hex");
  const expectedBuffer=Buffer.from(expected,"utf8");
  const valid=signatures.some(value=>{
    const candidate=Buffer.from(value,"utf8");
    return candidate.length===expectedBuffer.length&&crypto.timingSafeEqual(candidate,expectedBuffer);
  });
  if(!valid) throw new ApiError(400,"stripe_signature_invalid","Ungültige Webhook-Signatur.");
  return JSON.parse(body) as {id:string;type:string;created:number;data:{object:StripeObject}};
}

export function mapStripeSubscriptionStatus(value:unknown){
  const status=String(value??"");
  if(status==="trialing") return "trial";
  if(status==="active") return "active";
  if(status==="canceled") return "cancelled";
  if(["past_due","unpaid","incomplete","incomplete_expired","paused"].includes(status)) return "past_due";
  return "past_due";
}
