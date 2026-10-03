import { NextRequest } from "next/server";
import { apiError, ApiError, json } from "@/lib/server/http";
import { mapStripeSubscriptionStatus, verifyStripeWebhook } from "@/lib/server/stripe";
import { query } from "@/lib/server/db";

function stringValue(value:unknown){
  return typeof value==="string"?value:"";
}

function metadataValue(object:Record<string,unknown>,key:string){
  const metadata=object.metadata;
  if(!metadata||typeof metadata!=="object") return "";
  return stringValue((metadata as Record<string,unknown>)[key]);
}

function unixToIso(value:unknown){
  const seconds=Number(value);
  return Number.isFinite(seconds)&&seconds>0?new Date(seconds*1000).toISOString():null;
}


function invoiceSubscriptionRef(object:Record<string,unknown>){
  const direct=stringValue(object.subscription);
  if(direct) return direct;
  const parent=object.parent;
  if(!parent||typeof parent!=="object") return "";
  const subscriptionDetails=(parent as Record<string,unknown>).subscription_details;
  if(!subscriptionDetails||typeof subscriptionDetails!=="object") return "";
  return stringValue((subscriptionDetails as Record<string,unknown>).subscription);
}

export async function POST(request:NextRequest){
  try{
    const length=Number(request.headers.get("content-length")??"0");
    if(length&&length>262144) throw new ApiError(413,"request_too_large","Webhook ist zu gross.");
    const body=await request.text();
    if(body.length>262144) throw new ApiError(413,"request_too_large","Webhook ist zu gross.");

    const event=verifyStripeWebhook(body,request.headers.get("stripe-signature"));
    const object=event.data.object;
    let tenantId=metadataValue(object,"tenant_id")||null;
    let plan=metadataValue(object,"plan")||null;
    let customerRef=stringValue(object.customer)||null;
    let subscriptionRef=stringValue(object.subscription)||null;
    let subscriptionStatus:string|null=null;
    let currentPeriodEnd:string|null=null;

    if(event.type.startsWith("customer.subscription.")){
      customerRef=stringValue(object.customer)||customerRef;
      subscriptionRef=stringValue(object.id)||subscriptionRef;
      subscriptionStatus=mapStripeSubscriptionStatus(object.status);
      currentPeriodEnd=unixToIso(object.current_period_end);
      tenantId=metadataValue(object,"tenant_id")||tenantId;
      plan=metadataValue(object,"plan")||plan;
    }else if(event.type==="checkout.session.completed"){
      customerRef=stringValue(object.customer)||customerRef;
      subscriptionRef=stringValue(object.subscription)||subscriptionRef;
      subscriptionStatus="active";
      tenantId=metadataValue(object,"tenant_id")||stringValue(object.client_reference_id)||tenantId;
      plan=metadataValue(object,"plan")||plan;
    }else if(event.type==="invoice.payment_failed"){
      customerRef=stringValue(object.customer)||customerRef;
      subscriptionRef=invoiceSubscriptionRef(object)||subscriptionRef;
      if(!subscriptionRef) return json({received:true,ignored:true});
      subscriptionStatus="past_due";
    }else if(event.type==="invoice.paid"){
      customerRef=stringValue(object.customer)||customerRef;
      subscriptionRef=invoiceSubscriptionRef(object)||subscriptionRef;
      if(!subscriptionRef) return json({received:true,ignored:true});
      subscriptionStatus="active";
    }else{
      return json({received:true,ignored:true});
    }

    const applied=await query<{processed:boolean}>(
      "select apply_stripe_billing_event($1,$2,$3,$4,$5,$6,$7,$8) as processed",
      [event.id,event.type,tenantId,customerRef,subscriptionRef,subscriptionStatus,plan,currentPeriodEnd]
    );
    const result=Boolean(applied.rows[0]?.processed);
    return json({received:true,processed:result});
  }catch(error){return apiError(error);}
}
