import fs from 'node:fs/promises';
const settings=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const values=Object.fromEntries(settings.map(x=>[x.name,x.value]));
for(const [name,value] of Object.entries(values))if(value&&/KEY|SECRET/.test(name))console.log(`::add-mask::${value}`);
const source=await fs.readFile('lib/server/stripe.ts','utf8');
const version=source.match(/stripeApiVersion='([^']+)'/)[1];
const key=values.STRIPE_SECRET_KEY;
const live=/^(sk|rk)_live_/.test(key??'');
const appUrl=(values.APP_URL??'').replace(/\/$/,'');
const webhookUrl=appUrl?appUrl+'/api/billing/webhook':'';
const requiredEvents=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','customer.subscription.paused','customer.subscription.resumed','invoice.paid','invoice.payment_failed','invoice.payment_action_required'];
const names=['STRIPE_PRICE_START_MONTHLY','STRIPE_PRICE_START_YEARLY','STRIPE_PRICE_BUSINESS_MONTHLY','STRIPE_PRICE_BUSINESS_YEARLY','STRIPE_PRICE_PRO_MONTHLY','STRIPE_PRICE_PRO_YEARLY'];
let ready=Boolean(key&&values.STRIPE_WEBHOOK_SECRET&&live&&/^https:\/\//.test(appUrl));
console.log(JSON.stringify({apiVersion:version,keyConfigured:Boolean(key),webhookSecretConfigured:Boolean(values.STRIPE_WEBHOOK_SECRET),mode:live?'live':'not-live',appUrlConfigured:Boolean(appUrl)}));
async function get(path){try{const r=await fetch('https://api.stripe.com/v1'+path,{headers:{authorization:`Bearer ${key}`,'Stripe-Version':version},signal:AbortSignal.timeout(10000)});return r.ok?await r.json():null;}catch{return null;}}
let account=null;
if(key){
 account=await get('/account');
 const accountReady=Boolean(account?.id&&account?.charges_enabled&&account?.payouts_enabled&&account?.details_submitted);
 console.log(JSON.stringify({accountId:account?.id??null,chargesEnabled:account?.charges_enabled??false,payoutsEnabled:account?.payouts_enabled??false,detailsSubmitted:account?.details_submitted??false,accountReady}));
 if(!accountReady)ready=false;
}
for(const name of names){
 const id=values[name];
 const p=key&&id?await get('/prices/'+encodeURIComponent(id)):null;
 const valid=Boolean(p?.active&&p?.livemode===true&&p.currency==='chf'&&p.recurring?.interval===(name.endsWith('YEARLY')?'year':'month')&&p.recurring?.interval_count===1&&Number.isSafeInteger(p.unit_amount)&&p.unit_amount>0);
 if(!valid)ready=false;
 console.log(JSON.stringify({setting:name,configured:Boolean(id),valid,live:p?.livemode===true,amount:valid?p.unit_amount/100:null}));
}
const webhookList=key?await get('/webhook_endpoints?limit=100'):null;
const endpoint=Array.isArray(webhookList?.data)?webhookList.data.find(x=>x?.url===webhookUrl&&x?.livemode===true&&x?.status==='enabled'):null;
const enabledEvents=Array.isArray(endpoint?.enabled_events)?endpoint.enabled_events:[];
const wildcard=enabledEvents.includes('*');
const missingEvents=requiredEvents.filter(x=>!wildcard&&!enabledEvents.includes(x));
const webhookReady=Boolean(endpoint&&missingEvents.length===0&&(endpoint.api_version===version||endpoint.api_version===null));
if(!webhookReady)ready=false;
console.log(JSON.stringify({webhookUrl,webhookFound:Boolean(endpoint),webhookStatus:endpoint?.status??null,webhookLive:endpoint?.livemode===true,webhookApiVersion:endpoint?.api_version??null,missingEvents,webhookReady}));
const portalList=key?await get('/billing_portal/configurations?active=true&is_default=true&limit=10'):null;
const portal=Array.isArray(portalList?.data)?portalList.data.find(x=>x?.active===true&&x?.livemode===true&&x?.is_default===true):null;
const portalReady=Boolean(portal&&portal.features?.invoice_history?.enabled===true&&portal.features?.payment_method_update?.enabled===true&&portal.features?.subscription_cancel?.enabled===true);
if(!portalReady)ready=false;
console.log(JSON.stringify({portalConfigured:Boolean(portal),portalLive:portal?.livemode===true,invoiceHistory:portal?.features?.invoice_history?.enabled===true,paymentMethodUpdate:portal?.features?.payment_method_update?.enabled===true,subscriptionCancel:portal?.features?.subscription_cancel?.enabled===true,portalReady}));
console.log(JSON.stringify({billingProductionReady:ready,note:'Production readiness requires a live key, verified charge/payout capability, six live CHF recurring prices, the enabled production webhook with required events, and an active live default Customer Portal. No charge is created by this audit.'}));
if(!ready){console.log('::error::Stripe production billing configuration is incomplete or invalid.');process.exitCode=1;}
