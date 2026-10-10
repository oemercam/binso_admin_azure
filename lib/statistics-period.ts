import {sumMoney} from './money';

export const statisticPeriods = [1,3,6,12] as const;
export type StatisticPeriod = {months:1|3|6|12|'custom';from:string;to:string};
export type StatisticBounds = {from:string;to:string}; // Both business calendar dates inclusive.
export type StatisticEvent = {date:string;values:Record<string,unknown>};
export type StatisticBucket = {key:string;label:string;from:string;to:string;values:Record<string,number>};
const dayMs=86400000;
const iso=(date:Date)=>date.toISOString().slice(0,10);
const utc=(day:string)=>new Date(day+'T00:00:00Z');
export function validBusinessDay(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(utc(day).getTime())&&iso(utc(day))===day&&day>='1900-01-01'&&day<='9998-12-31';}
export function statisticBounds(period:StatisticPeriod,today:string):StatisticBounds|null{
 if(!validBusinessDay(today))return null;
 if(period.months==='custom')return validBusinessDay(period.from)&&validBusinessDay(period.to)&&period.from<=period.to?{from:period.from,to:period.to}:null;
 if(!statisticPeriods.includes(period.months))return null;
 const end=utc(today),start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-period.months+1,1));
 return {from:iso(start),to:today};
}
export function aggregateStatistics(events:readonly StatisticEvent[],bounds:StatisticBounds,keys:readonly string[]){
 if(!validBusinessDay(bounds.from)||!validBusinessDay(bounds.to)||bounds.from>bounds.to)return {buckets:[] as StatisticBucket[],totals:Object.fromEntries(keys.map(key=>[key,0])),resolution:'day'};
 const start=utc(bounds.from),end=utc(bounds.to),days=Math.round((+end-+start)/dayMs)+1;
 const months=(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth()+1;
 const resolution=days<=14?'day':days<=45?'week':months<=24?'month':'year';
 const yearStep=Math.max(1,Math.ceil((end.getUTCFullYear()-start.getUTCFullYear()+1)/12));
 const buckets:StatisticBucket[]=[];
 let cursor=start;
 while(cursor<=end){
  const next=resolution==='year'?new Date(Date.UTC(cursor.getUTCFullYear()+yearStep,0,1)):resolution==='month'?new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,1)):new Date(+cursor+dayMs*(resolution==='week'?7:1));
  const last=new Date(Math.min(+end,+next-dayMs));
  const label=resolution==='year'?String(cursor.getUTCFullYear())+(yearStep>1?'–'+last.getUTCFullYear():''):resolution==='month'?cursor.toLocaleDateString('de-CH',{month:'short',year:'2-digit',timeZone:'UTC'}):cursor.toLocaleDateString('de-CH',{day:'numeric',month:'numeric',timeZone:'UTC'})+(resolution==='week'?'–'+last.toLocaleDateString('de-CH',{day:'numeric',month:'numeric',timeZone:'UTC'}):'');
  buckets.push({key:iso(cursor),label,from:iso(cursor),to:iso(last),values:Object.fromEntries(keys.map(key=>[key,0]))});cursor=next;
 }
 const values=new Map(buckets.map(bucket=>[bucket.key,Object.fromEntries(keys.map(key=>[key,[] as unknown[]]))]));
 for(const event of events){if(!validBusinessDay(event.date)||event.date<bounds.from||event.date>bounds.to)continue;const bucket=buckets.find(item=>event.date>=item.from&&event.date<=item.to);if(!bucket)continue;for(const key of keys)values.get(bucket.key)![key].push(event.values[key]??0);}
 for(const bucket of buckets)for(const key of keys)bucket.values[key]=sumMoney(values.get(bucket.key)![key]);
 return {buckets,totals:Object.fromEntries(keys.map(key=>[key,sumMoney(buckets.map(bucket=>bucket.values[key]))])),resolution};
}
