import type {StatisticBounds} from './statistics-period';
export type MetricTrend={percent:number|null;label:string;tone:'positive'|'negative'|'neutral'};
/** An adjacent, equally long inclusive calendar period; never a current balance snapshot. */
export function previousStatisticBounds(bounds:StatisticBounds):StatisticBounds{
 const from=Date.parse(bounds.from+'T00:00:00Z'),to=Date.parse(bounds.to+'T00:00:00Z');
 const duration=to-from+86400000;
 return {from:new Date(from-duration).toISOString().slice(0,10),to:new Date(from-86400000).toISOString().slice(0,10)};
}
export function metricTrend(current:number,previous:number,known:boolean,lowerIsBetter:boolean,label:string):MetricTrend{
 if(!known||!Number.isFinite(current)||!Number.isFinite(previous)||previous===0)return {percent:null,label,tone:'neutral'};
 const percent=(current-previous)/Math.abs(previous)*100;
 if(!Number.isFinite(percent))return {percent:null,label,tone:'neutral'};
 return {percent,label,tone:percent===0?'neutral':(percent>0)!==lowerIsBetter?'positive':'negative'};
}
