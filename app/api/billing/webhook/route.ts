import { NextRequest } from "next/server";
import { apiError, ApiError, json } from "@/lib/server/http";
import { verifyStripeSignature } from "@/lib/server/stripe";
import { env } from "@/lib/server/env";
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
  if(status)status=({trialing:"trial",canceled:"cancelled",unpaid:"past_due",incomplete:"past_due",incomplete_expired:"expired"} as Record<string,string>)[status]??status;
  if(!["trial","active","past_due","cancelled","expired"].includes(status))status="";
  const periodEnd=unixIso(object.current_period_end);
  if(!organizationId&&customerId){
    const found=await withPlatform(async client=>(await client.query<{id:string}>("select organization_id id from organization_subscriptions where billing_customer_id=$1 limit 1",[customerId])).rows[0]);
    organizationId=found?.id??"";
  }
  if(!organizationId)return json({received:true,ignored:true});
  await withPlatform(async client=>{
    const organization=await client.query("select id from organizations where id=$1 and not is_demo",[organizationId]);
    if(!organization.rowCount)throw new ApiError(400,"organization_invalid","Organisation wurde nicht gefunden.");
    const recorded=await client.query("insert into billing_webhook_events(provider,external_event_id,event_type,status,organization_id) values('stripe',$1,$2,'received',$3) on conflict(provider,external_event_id) do nothing returning id",[eventId,type,organizationId]);
    if(!recorded.rowCount)return;
    if(type==="invoice.paid"){
      const amount=Number(object.amount_paid);
      const currency=str(object.currency).toUpperCase();
      const invoiceId=str(object.id);
      const paidAt=unixIso(objectValue(object.status_transitions).paid_at)??unixIso(object.created);
      if(invoiceId&&paidAt&&Number.isSafeInteger(amount)&&amount>0&&["CHF","EUR"].includes(currency)){
        await client.query(`insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency)
          values($1,'stripe',$2,$3::timestamptz::date,$4,$5) on conflict(provider,external_id) do nothing`,
          [organizationId,invoiceId,paidAt,amount/100,currency]);
      }
    }
    const firstItem=objectValue((objectValue(object.items).data as unknown[]|undefined)?.[0]);
    const price=objectValue(firstItem.price);const priceId=str(price.id);
    let plan:string|null=null;
    for(const [key,cycles] of Object.entries(env.stripePrices))if(Object.values(cycles).includes(priceId))plan=key==="start"?"starter":key==="pro"?"professional":key;
    await client.query(`update organization_subscriptions set billing_provider='stripe',billing_customer_id=coalesce(nullif($2,''),billing_customer_id), billing_subscription_id=coalesce(nullif($3,''),billing_subscription_id),status=coalesce(nullif($4,''),status),current_period_end=coalesce($5,current_period_end),plan=coalesce($6,plan),billing_last_event_id=$7,billing_last_synced_at=now(),updated_at=now() where organization_id=$1`,[organizationId,customerId,subscriptionId,status,periodEnd,plan,eventId]);
    await client.query("update billing_webhook_events set status='processed',processed_at=now() where provider='stripe' and external_event_id=$1",[eventId]);

  });
  return json({received:true,processed:true});
 }catch(error){return apiError(error);}
}
