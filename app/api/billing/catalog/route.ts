import {requireSession} from '@/lib/server/session';
import {authorize} from '@/lib/server/rbac';
import {apiError,json} from '@/lib/server/http';
import {env} from '@/lib/server/env';
import {plans} from '@/lib/plans';
import {retrievePrice,stripeConfigured,validatePrice,stripeLiveMode} from '@/lib/server/stripe';
export async function GET(){try{
 const session=await requireSession();authorize(session,'billing:read');
 const configured=stripeConfigured()&&!session.isDemo;
 const items=await Promise.all(plans.flatMap(plan=>(['monthly','yearly'] as const).map(async billing=>{
  const id=env.stripePrices[plan.id][billing];if(!configured||!id)return {plan:plan.id,name:plan.name,billing,available:false};
  try{const price=await retrievePrice(id);return {plan:plan.id,name:plan.name,billing,available:true,amount:validatePrice(price,billing),currency:'CHF'};}catch{return {plan:plan.id,name:plan.name,billing,available:false};}
 })));
 return json({configured,live:stripeLiveMode(),demo:session.isDemo===true,items});
}catch(error){return apiError(error)}}
