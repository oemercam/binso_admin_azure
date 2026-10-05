import fs from 'node:fs/promises';
const settings=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
const values=Object.fromEntries(settings.map(x=>[x.name,x.value]));
for(const [name,value] of Object.entries(values))if(value&&/KEY|SECRET/.test(name))console.log(`::add-mask::${value}`);
const source=await fs.readFile('lib/server/stripe.ts','utf8');
const version=source.match(/stripeApiVersion='([^']+)'/)[1];
const key=values.STRIPE_SECRET_KEY;
const names=['STRIPE_PRICE_START_MONTHLY','STRIPE_PRICE_START_YEARLY','STRIPE_PRICE_BUSINESS_MONTHLY','STRIPE_PRICE_BUSINESS_YEARLY','STRIPE_PRICE_PRO_MONTHLY','STRIPE_PRICE_PRO_YEARLY'];
let ready=Boolean(key&&values.STRIPE_WEBHOOK_SECRET);
console.log(JSON.stringify({apiVersion:version,keyConfigured:Boolean(key),webhookSecretConfigured:Boolean(values.STRIPE_WEBHOOK_SECRET),mode:/^(sk|rk)_live_/.test(key??'')?'live':'test-or-unconfigured'}));
async function get(path){try{const r=await fetch('https://api.stripe.com/v1'+path,{headers:{authorization:`Bearer ${key}`,'Stripe-Version':version},signal:AbortSignal.timeout(10000)});return r.ok?await r.json():null;}catch{return null;}}
if(key){const account=await get('/account');console.log(JSON.stringify({accountId:account?.id??null,chargesEnabled:account?.charges_enabled??false,detailsSubmitted:account?.details_submitted??false}));if(!account)ready=false;}
for(const name of names){const id=values[name];const p=key&&id?await get('/prices/'+encodeURIComponent(id)):null;const valid=Boolean(p?.active&&p.currency==='chf'&&p.recurring?.interval===(name.endsWith('YEARLY')?'year':'month')&&p.recurring?.interval_count===1&&Number.isSafeInteger(p.unit_amount)&&p.unit_amount>0);if(!valid)ready=false;console.log(JSON.stringify({setting:name,configured:Boolean(id),valid,amount:valid?p.unit_amount/100:null}));}
console.log(JSON.stringify({billingConfigurationReady:ready,note:'Read-only configuration audit; no charge, webhook delivery or portal session was tested.'}));
if(!ready)console.log('::warning::Stripe configuration incomplete or invalid. Payments are not verified as ready.');
