import {limitsConfig} from "@/config/limits";
import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";
import {env} from "@/lib/server/env";

function secret(){if(!env.stripeSecretKey)throw new Error("Stripe is not configured.");return env.stripeSecretKey}
async function stripeRequest<T>(path:string,body:URLSearchParams):Promise<T>{
 const response=await fetch(`https://api.stripe.com/v1${path}`,{method:"POST",headers:{authorization:`Bearer ${secret()}`,"content-type":"application/x-www-form-urlencoded"},body,cache:"no-store"});
 const data=await response.json();if(!response.ok)throw new Error(data?.error?.message||"Stripe request failed.");return data as T;
}
export async function createCheckoutSession(input:{priceId:string;customerEmail:string;organizationId:string;successUrl:string;cancelUrl:string}){const body=new URLSearchParams();body.set("mode","subscription");body.set("line_items[0][price]",input.priceId);body.set("line_items[0][quantity]","1");body.set("customer_email",input.customerEmail);body.set("client_reference_id",input.organizationId);body.set("metadata[organization_id]",input.organizationId);body.set("subscription_data[metadata][organization_id]",input.organizationId);body.set("success_url",input.successUrl);body.set("cancel_url",input.cancelUrl);body.set("allow_promotion_codes","true");return stripeRequest<{id:string;url:string}>("/checkout/sessions",body)}
export async function createPortalSession(input:{customerId:string;returnUrl:string}){const body=new URLSearchParams();body.set("customer",input.customerId);body.set("return_url",input.returnUrl);return stripeRequest<{url:string}>("/billing_portal/sessions",body)}
export async function updateSubscription(input:{subscriptionId:string;cancelAtPeriodEnd:boolean}){const body=new URLSearchParams();body.set("cancel_at_period_end",input.cancelAtPeriodEnd?"true":"false");return stripeRequest<Record<string,unknown>>(`/subscriptions/${encodeURIComponent(input.subscriptionId)}`,body)}
export function verifyStripeSignature(payload:string,signatureHeader:string){
 if(!env.stripeWebhookSecret)throw new Error("Stripe webhook is not configured.");
 const fields=signatureHeader.split(",").map(x=>x.split("=",2) as [string,string]);const timestamp=fields.find(([k])=>k==="t")?.[1];const signatures=fields.filter(([k])=>k==="v1").map(([,v])=>v);if(!timestamp||!signatures.length)return false;
 if(Math.abs(Date.now()/1000-Number(timestamp))>limitsConfig.stripeWebhookToleranceSeconds)return false;
 const expected=createHmac("sha256",env.stripeWebhookSecret).update(`${timestamp}.${payload}`,"utf8").digest("hex");const a=Buffer.from(expected,"hex");return signatures.some(sig=>{try{const b=Buffer.from(sig,"hex");return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}})
}
