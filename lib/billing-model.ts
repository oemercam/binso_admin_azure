import {moneyMinor} from './money';

/** Commercial terms only. Totals, tax, discounts and source reservations retain
 * their existing owners. Legacy documents have no inferred BillingTerms. */
export const billingModels=['fixed','time','quantity','mixed','recurring','milestone'] as const;
export type BillingModel=typeof billingModels[number];
type Amount=string|null;
type Currency='CHF'|'EUR';
export type BillingMilestone={id:string;label:string;amount:Amount;completed:boolean};
export type BillingTerms={revision:1;currency:Currency}&(
 |{model:'fixed';amount:Amount}
 |{model:'time'}
 |{model:'quantity'}
 |{model:'mixed';amount:Amount;additionalTime:boolean;quantity:boolean}
 |{model:'recurring';amount:Amount;startsOn:string|null;endsOn:string|null;intervalMonths:1|3|12}
 |{model:'milestone';milestones:BillingMilestone[]}
);
const invalid=()=>new RangeError('Die Angaben zum Abrechnungsmodell sind ungültig.');
function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw invalid();
 return value as Record<string,unknown>;
}
function keys(value:Record<string,unknown>,allowed:readonly string[]){if(Object.keys(value).some(key=>!allowed.includes(key)))throw invalid();}
function amount(value:unknown):Amount{
 if(value===null)return null;
 if(typeof value!=='string'||!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value))throw invalid();
 const cents=moneyMinor(value);return `${Math.floor(cents/100)}.${String(cents%100).padStart(2,'0')}`;
}
function date(value:unknown):string|null{
 if(value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>'9998-12-31')throw invalid();
 const parsed=new Date(value+'T00:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)throw invalid();return value;
}
/** Strict draft contract; incomplete draft terms are distinct from a zero amount. */
export function normalizeBillingTerms(input:unknown):BillingTerms{
 const b=record(input);if(b.revision!==1||typeof b.currency!=='string'||!['CHF','EUR'].includes(b.currency))throw invalid();
 const base={revision:1 as const,currency:b.currency as Currency};
 const common=['revision','currency','model'];
 switch(b.model){
  case 'fixed':keys(b,[...common,'amount']);return {...base,model:b.model,amount:amount(b.amount)};
  case 'time':case 'quantity':keys(b,common);return {...base,model:b.model};
  case 'mixed':
   keys(b,[...common,'amount','additionalTime','quantity']);if(typeof b.additionalTime!=='boolean'||typeof b.quantity!=='boolean')throw invalid();
   return {...base,model:b.model,amount:amount(b.amount),additionalTime:b.additionalTime,quantity:b.quantity};
  case 'recurring':{
   keys(b,[...common,'amount','startsOn','endsOn','intervalMonths']);if(![1,3,12].includes(Number(b.intervalMonths))||typeof b.intervalMonths!=='number')throw invalid();
   const startsOn=date(b.startsOn),endsOn=date(b.endsOn);if(endsOn&&(!startsOn||endsOn<startsOn))throw invalid();
   return {...base,model:b.model,amount:amount(b.amount),startsOn,endsOn,intervalMonths:b.intervalMonths as 1|3|12};
  }
  case 'milestone':{
   keys(b,[...common,'milestones']);if(!Array.isArray(b.milestones)||b.milestones.length>100)throw invalid();
   const ids=new Set<string>();const milestones=b.milestones.map(value=>{
    const m=record(value);keys(m,['id','label','amount','completed']);
    if(typeof m.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(m.id)||typeof m.label!=='string'||m.label.length>200||/[\u0000-\u001f\u007f]/.test(m.label)||typeof m.completed!=='boolean')throw invalid();
    const id=m.id.toLowerCase();if(ids.has(id))throw invalid();ids.add(id);
    return {id,label:m.label.trim(),amount:amount(m.amount),completed:m.completed};
   });return {...base,model:b.model,milestones};
  }
  default:throw invalid();
 }
}
/** Call only at an activation/acceptance boundary, never to block saving a draft. */
export function billingTermsReady(terms:BillingTerms):boolean{
 switch(terms.model){
  case 'fixed':return terms.amount!==null;
  case 'time':case 'quantity':return true;
  case 'mixed':return Number(terms.amount!==null)+Number(terms.additionalTime)+Number(terms.quantity)>=2;
  case 'recurring':return terms.amount!==null&&terms.startsOn!==null;
  case 'milestone':return terms.milestones.length>0&&terms.milestones.every(m=>m.label!==''&&m.amount!==null);
 }
}
/** A calendar period is anchored to the original day, not the previous clipped
 * month. 31 January -> 28 February -> 31 March. No automatic invoice is created. */
export function recurringBillingPeriod(terms:Extract<BillingTerms,{model:'recurring'}>,index:number){
 if(!Number.isSafeInteger(index)||index<0||index>120000||!terms.startsOn)throw invalid();
 const anchor=new Date(terms.startsOn+'T00:00:00Z');
 const boundary=(step:number)=>{
  const month=anchor.getUTCMonth()+step*terms.intervalMonths;
  const first=new Date(Date.UTC(anchor.getUTCFullYear(),month,1));
  if(first.getUTCFullYear()>9999)throw invalid();
  const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
  first.setUTCDate(Math.min(anchor.getUTCDate(),last));return first;
 };
 const start=boundary(index),exclusiveEnd=boundary(index+1);exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate()-1);
 const startsOn=start.toISOString().slice(0,10);let endsOn=exclusiveEnd.toISOString().slice(0,10);
 if(terms.endsOn){if(startsOn>terms.endsOn)throw invalid();if(endsOn>terms.endsOn)endsOn=terms.endsOn;}
 return {startsOn,endsOn};
}
/** Supplement to the existing approved/unbilled source checks, not a replacement.
 * The caller must supply the actual persisted source terms, never client claims. */
export function billingModelAllowsTime(terms:BillingTerms){return terms.model==='time'||terms.model==='mixed'&&terms.additionalTime;}
