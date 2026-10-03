import { NextRequest } from "next/server";
import { apiError, ApiError, json } from "@/lib/server/http";
import { verifyStripeSignature } from "@/lib/server/stripe";
import { withPlatform } from "@/lib/server/db";

export const runtime="nodejs";

function objectValue(value:unknown):Record<string,unknown>{return value&&typeof value==="object"?value as Record<string,unknown>:{}}
function str(value:unknown){return typeof value==="string"?value:""}
function meta(object:Record<string,unknown>,key:string){return str(objectValue(object.metadata)[key])}
function unixIso(value:unknown){const n=Number(value);return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null}

export async function POST(request:NextRequest){
 try{
  const length=Number(request.headers.get("content-length")??"0");
  if(length&&length>262144)throw new ApiError(413,"request_too_large","Webhook ist zu gross.");
  const body=await request.text();
  if(body.length>262144)throw new ApiError(413,"request_too_large","Webhook ist zu gross.");
  const signature=request.headers.get("stripe-signature")??"";
  if(!signature)throw new ApiError(400,"invalid_signature","Ungültige Stripe-Signatur.");
  if(!verifyStripeSignature(body,signature))throw new ApiError(400,"invalid_signature","Ungültige Stripe-Signatur.");
  const event=JSON.parse(body) as {id?:string;type?:string;data?:{object?:unknown}};
  const object=objectValue(event.data?.object);const type=str(event.type);const eventId=str(event.id);
  if(!eventId||!type)return json({received:false},400);
  let organizationId=meta(object,"organization_id")||meta(object,"tenant_id")||str(object.client_reference_id);
  let customerId=str(object.customer);let subscriptionId=type.startsWith("customer.subscription.")?str(object.id):str(object.subscription);
  let status=type.startsWith("customer.subscription.")?str(object.status):type==="checkout.session.completed"?"active":type==="invoice.payment_failed"?"past_due":type==="invoice.paid"?"active":"";
  const periodEnd=unixIso(object.current_period_end);
  if(!organizationId&&customerId){
    const found=await withPlatform(async client=>(await client.query<{id:string}>("select id from organizations where stripe_customer_id=$1 limit 1",[customerId])).rows[0]);
    organizationId=found?.id??"";
  }
  if(!organizationId)return json({received:true,ignored:true});
  await withPlatform(async client=>{
    await client.query(`update organizations set stripe_customer_id=coalesce(nullif($2,''),stripe_customer_id), stripe_subscription_id=coalesce(nullif($3,''),stripe_subscription_id), subscription_status=coalesce(nullif($4,''),subscription_status), subscription_current_period_end=coalesce($5,subscription_current_period_end), updated_at=now() where id=$1`,[organizationId,customerId,subscriptionId,status,periodEnd]);
  });
  return json({received:true,processed:true});
 }catch(error){return apiError(error);}
}
