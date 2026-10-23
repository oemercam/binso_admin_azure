import {moneyMinor} from './money';
export const apApprovalRoles=['owner','admin','finance'] as const;
export type APApprovalPolicy={fourEyes:boolean;limits:Record<string,string>};
/** Limits are absolute in each document currency; empty means no extra cap. */
export function normalizeAPApprovalPolicy(value:unknown):APApprovalPolicy{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new RangeError('Invalid AP policy');
 const p=value as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['fourEyes','limits'].includes(k))||typeof p.fourEyes!=='boolean'||!p.limits||typeof p.limits!=='object'||Array.isArray(p.limits))throw new RangeError('Invalid AP policy');
 const limits:Record<string,string>={};
 for(const [key,amount] of Object.entries(p.limits)){
  if(!/^(owner|admin|finance)_(CHF|EUR)$/.test(key)||typeof amount!=='string'||!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount))throw new RangeError('Invalid AP amount limit');
  const cents=moneyMinor(amount);limits[key]=Math.trunc(cents/100)+'.'+String(cents%100).padStart(2,'0');
 }
 return {fourEyes:p.fourEyes,limits};
}
export function apApprovalPolicyAllows(policy:APApprovalPolicy,input:{role:string;actor:string;invoiceCreator:string;matchCreator:string;activeUsers:number;currency:string;amount:string}){
 if(!apApprovalRoles.some(r=>r===input.role)||!['CHF','EUR'].includes(input.currency)||!Number.isSafeInteger(input.activeUsers)||input.activeUsers<1||!/^\d{1,9}(?:\.\d{1,2})?$/.test(input.amount))return false;
 const soloOwner=input.role==='owner'&&input.activeUsers===1;
 if(policy.fourEyes&&!soloOwner&&[input.invoiceCreator,input.matchCreator].includes(input.actor))return false;
 const limit=policy.limits[input.role+'_'+input.currency];return limit===undefined||moneyMinor(input.amount)<=moneyMinor(limit);
}
