import 'server-only';
import type {PoolClient} from 'pg';
import type {BillingCycle,PlanId} from '@/config/domain';
import {subscriptionEntitlements} from '@/lib/subscription-plans';
import {ApiError} from '../http';
import {env} from '../env';
import {createCheckoutSession,retrieveCheckoutSession,expireCheckoutSession,createStripeCustomer,retrievePrice,retrieveSubscription,retrieveInvoice,validatePrice,priceSelection,objectValue,stripeId,stripeLiveMode,type StripeObject} from '../stripe';
import type {SessionUser} from '../session';
const str=(value:unknown)=>typeof value==='string'?value:'';
const iso=(value:unknown)=>{const n=Number(value);return Number.isFinite(n)&&n>0?new Date(n*1000).toISOString():null;};
export async function startBillingCheckout(c:PoolClient,s:SessionUser,plan:PlanId,billing:BillingCycle,requestKey:string){
 const row=(await c.query(`select s.*,o.name,o.is_demo from organization_subscriptions s join organizations o on o.id=s.organization_id where s.organization_id=$1 for update of s`,[s.organizationId])).rows[0];
 if(!row)throw new ApiError(404,'not_found','Organisation nicht gefunden.');
 if(row.is_demo)throw new ApiError(403,'demo_billing_unavailable','In der Demo werden keine Zahlungen ausgelöst.');
 if(row.billing_subscription_id&&!['cancelled','expired'].includes(row.status))throw new ApiError(409,'subscription_exists','Bitte das bestehende Abonnement im Zahlungsportal verwalten.');
 const cached=(await c.query('select * from billing_checkout_sessions where organization_id=$1 and request_key=$2',[s.organizationId,requestKey])).rows[0];
 if(cached&&(cached.plan!==plan||cached.billing_interval!==billing||new Date(cached.expires_at).getTime()<=Date.now()))throw new ApiError(409,'checkout_request_reused','Bitte einen neuen Checkout starten.');
 const open=cached??(await c.query('select * from billing_checkout_sessions where organization_id=$1 and expires_at>now() order by created_at desc limit 1',[s.organizationId])).rows[0];
 if(open&&open.plan===plan&&open.billing_interval===billing){
  const current=await retrieveCheckoutSession(open.stripe_session_id);
  if(current.status==='open')return {url:open.checkout_url};
  if(current.status!=='expired')throw new ApiError(409,'checkout_pending','Stripe verarbeitet den Checkout. Bitte den Abostatus erneut laden.');
  if(cached)throw new ApiError(409,'checkout_request_expired','Der Checkout ist abgelaufen. Bitte die Seite erneut laden.');
  await c.query('update billing_checkout_sessions set expires_at=now() where id=$1',[open.id]);
 }
 if(open&&(open.plan!==plan||open.billing_interval!==billing)){const expired=await expireCheckoutSession(open.stripe_session_id);if(expired.status!=='expired')throw new ApiError(409,'checkout_pending','Der vorherige Checkout muss zuerst abgeschlossen werden.');await c.query('update billing_checkout_sessions set expires_at=now() where id=$1',[open.id]);}
 const priceId=env.stripePrices[plan][billing];if(!priceId)throw new ApiError(503,'stripe_price_missing','Dieser Zahlungszeitraum ist noch nicht eingerichtet.');
 const price=await retrievePrice(priceId);validatePrice(price,billing);
 let customerId=str(row.billing_customer_id);
 if(!customerId){const customer=await createStripeCustomer({organizationId:s.organizationId,email:s.email,name:row.name});customerId=customer.id;if(!/^cus_/.test(customerId))throw new ApiError(502,'stripe_customer_invalid','Stripe-Kunde konnte nicht angelegt werden.');await c.query('update organization_subscriptions set billing_customer_id=$2,updated_at=now() where organization_id=$1',[s.organizationId,customerId]);}
 const returnUrl=`${env.appUrl.replace(/\/$/,'')}/einstellungen/abonnement`;
 const checkout=await createCheckoutSession({priceId,customerId,organizationId:s.organizationId,requestKey,successUrl:returnUrl+'?checkout=success',cancelUrl:returnUrl+'?checkout=cancelled'});
 if(!checkout.id||!checkout.url?.startsWith('https://checkout.stripe.com/')||!iso(checkout.expires_at))throw new ApiError(502,'stripe_checkout_invalid','Stripe Checkout konnte nicht angelegt werden.');
 await c.query('insert into billing_checkout_sessions(organization_id,request_key,plan,billing_interval,stripe_session_id,checkout_url,expires_at) values($1,$2,$3,$4,$5,$6,$7)',[s.organizationId,requestKey,plan,billing,checkout.id,checkout.url,iso(checkout.expires_at)]);
 return {url:checkout.url};
}
export const billingEventTypes=new Set(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','customer.subscription.paused','customer.subscription.resumed','invoice.paid','invoice.payment_failed','invoice.payment_action_required']);
export async function processStripeEvent(c:PoolClient,event:StripeObject){
 const type=str(event.type),eventId=str(event.id),source=objectValue(objectValue(event.data).object);
 if(!/^evt_/.test(eventId)||!type)throw new ApiError(400,'event_invalid','Ungültiges Stripe-Ereignis.');
 if(typeof event.livemode!=='boolean'||event.livemode!==stripeLiveMode())throw new ApiError(400,'stripe_mode_mismatch','Stripe-Modus stimmt nicht mit der Umgebung überein.');
 if(!billingEventTypes.has(type))return {received:true,ignored:true};
 const parent=objectValue(objectValue(source.parent).subscription_details);
 const subscriptionId=type.startsWith('customer.subscription.')?stripeId(source):stripeId(source.subscription)||stripeId(parent.subscription);
 const customerId=stripeId(source.customer);
 if(!subscriptionId||!customerId)return {received:true,ignored:true};
 // Mapping is established before checkout. Never assign a tenant by arbitrary event metadata.
 const row=(await c.query(`select s.*,o.status account_status,o.is_demo from organization_subscriptions s join organizations o on o.id=s.organization_id where s.billing_customer_id=$1 and not o.is_demo for update of s`,[customerId])).rows[0];
 if(!row)return {received:true,ignored:true};
 if(row.billing_subscription_id&&row.billing_subscription_id!==subscriptionId&&!['cancelled','expired'].includes(row.status))return {received:true,ignored:true};
 const recorded=await c.query("insert into billing_webhook_events(provider,external_event_id,event_type,status,organization_id) values('stripe',$1,$2,'received',$3) on conflict(provider,external_event_id) do nothing returning id",[eventId,type,row.organization_id]);
 if(!recorded.rowCount)return {received:true,duplicate:true};
 // Retrieve after acquiring the organization lock. Delayed/out-of-order events
 // cannot replace current Stripe state with an older event snapshot.
 const subscription=await retrieveSubscription(subscriptionId);
 if(stripeId(subscription.customer)!==customerId||str(objectValue(subscription.metadata).organization_id)!==row.organization_id)throw new ApiError(400,'subscription_mapping_invalid','Stripe-Zuordnung stimmt nicht überein.');
 const items=objectValue(subscription.items).data;
 if(!Array.isArray(items)||items.length!==1)throw new ApiError(400,'subscription_items_invalid','Abonnement enthält unerwartete Positionen.');
 const item=objectValue(items[0]),price=objectValue(item.price),selection=priceSelection(stripeId(price));
 if(!selection||Number(item.quantity)!==1)throw new ApiError(400,'subscription_price_unknown','Abopreis ist Binso One nicht zugeordnet.');
 const amount=validatePrice(price,selection.billing,false);
 const status=({active:'active',trialing:'trial',past_due:'past_due',unpaid:'past_due',incomplete:'past_due',incomplete_expired:'expired',canceled:'cancelled',paused:'suspended'} as Record<string,string>)[str(subscription.status)];
 if(!status)throw new ApiError(400,'subscription_status_unknown','Unbekannter Abostatus.');
 const limits=subscriptionEntitlements(selection.plan),canonicalPlan=selection.plan==='start'?'starter':selection.plan==='pro'?'professional':'business';
 await c.query(`update organization_subscriptions set billing_provider='stripe',billing_subscription_id=$2,status=$3,plan=$4,billing_interval=$5,unit_amount_chf=$6,current_period_end=$7,trial_until=$8,cancel_at_period_end=$9,cancelled_at=$10,seats=$11,billing_last_event_id=$12,billing_last_synced_at=now(),updated_at=now() where organization_id=$1`,[row.organization_id,subscriptionId,status,canonicalPlan,selection.billing,amount,iso(item.current_period_end??subscription.current_period_end),iso(subscription.trial_end),subscription.cancel_at_period_end===true,iso(subscription.canceled_at),limits.users,eventId]);
 await c.query(`update organization_entitlements set features=$2,max_users=$3,max_storage_mb=$4,max_monthly_documents=$5,max_api_requests_per_month=$6 where organization_id=$1`,[row.organization_id,limits.features,limits.users,limits.storageMb,limits.monthlyDocuments,limits.monthlyApiRequests]);
 // Billing may not undo administrative suspension or live operator restrictions.
 const restrictions=(await c.query("select scope from organization_restrictions where organization_id=$1 and active and starts_at<=now() and (ends_at is null or ends_at>now()) and removed_at is null",[row.organization_id])).rows;
 const restricted=restrictions.some(x=>x.scope==='all')?'suspended':restrictions.length?'read_only':null;
 const accountStatus=['suspended','archived'].includes(row.account_status)?row.account_status:restricted??(status==='active'?'active':status==='trial'?'trial':'read_only');
 await c.query('update organizations set status=$2,updated_at=now() where id=$1',[row.organization_id,accountStatus]);
 await c.query('update platform_tenants set platform_status=$2,seats=$3,monthly_revenue_chf=$4 where organization_id=$1',[row.organization_id,accountStatus,limits.users,status==='active'?amount/(selection.billing==='yearly'?12:1):0]);
 if(type==='invoice.paid'){
  const invoice=await retrieveInvoice(stripeId(source));
  const cents=Number(invoice.amount_paid),currency=str(invoice.currency).toUpperCase();
  if(stripeId(invoice.customer)!==customerId)throw new ApiError(400,'invoice_mapping_invalid','Rechnung ist einem anderen Stripe-Kunden zugeordnet.');
  const paidAt=iso(objectValue(invoice.status_transitions).paid_at);
  if(invoice.status==='paid'&&paidAt&&Number.isSafeInteger(cents)&&cents>0&&['CHF','EUR'].includes(currency))await c.query("insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency) values($1,'stripe',$2,$3::timestamptz::date,$4,$5) on conflict(provider,external_id) do nothing",[row.organization_id,stripeId(invoice),paidAt,cents/100,currency]);
 }
 await c.query("insert into subscription_events(organization_id,subscription_id,actor_user_id,source,event_type,previous_plan,new_plan,previous_status,new_status) values($1,$2,'stripe','webhook',$3,$4,$5,$6,$7)",[row.organization_id,row.id,type,row.plan,canonicalPlan,row.status,status]);
 await c.query("update billing_webhook_events set status='processed',processed_at=now() where provider='stripe' and external_event_id=$1",[eventId]);
 return {received:true,processed:true};
}
