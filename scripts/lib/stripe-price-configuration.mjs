const plans={START:'STRIPE_PRICE_STARTER',BUSINESS:'STRIPE_PRICE_BUSINESS',PRO:'STRIPE_PRICE_PROFESSIONAL'};
function valid(price,interval,live){return Boolean(price?.id?.startsWith('price_')&&price.active&&price.livemode===live&&price.currency==='chf'&&price.recurring?.interval===interval&&price.recurring.interval_count===1&&Number.isSafeInteger(price.unit_amount)&&price.unit_amount>0);}
export async function resolveStripePriceMappings(values,get){
 const result={},live=/^(sk|rk)_live_/.test(values.STRIPE_SECRET_KEY??'');
 if(!values.STRIPE_SECRET_KEY)return result;
 for(const [plan,legacyName] of Object.entries(plans)){
  const legacyId=values[legacyName];if(!legacyId)continue;
  const legacy=await get('/prices/'+encodeURIComponent(legacyId));
  const product=typeof legacy?.product==='string'?legacy.product:legacy?.product?.id;
  if(!product||(!valid(legacy,'month',live)&&!valid(legacy,'year',live)))continue;
  const catalog=await get('/prices?active=true&type=recurring&limit=100&product='+encodeURIComponent(product));
  for(const [suffix,interval] of [['MONTHLY','month'],['YEARLY','year']]){
   const name=`STRIPE_PRICE_${plan}_${suffix}`;if(values[name])continue;
   if(valid(legacy,interval,live)){result[name]=legacy.id;continue;}
   if(catalog?.has_more||!Array.isArray(catalog?.data))continue;
   const matches=catalog.data.filter(p=>valid(p,interval,live)&&(typeof p.product==='string'?p.product:p.product?.id)===product);
   if(matches.length===1)result[name]=matches[0].id;
  }
 }
 return result;
}
