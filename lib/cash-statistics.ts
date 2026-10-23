import {sumMoney} from './money';
import type {StatisticEvent} from './statistics-period';
export type FinancialMetricsData={revenueEvents:Array<{date:string;amount:unknown}>;snapshot:{as_of:string;paid:unknown;open:unknown;overdue:unknown;credit_balance:unknown}};
export type CashStatisticsData={financial?:FinancialMetricsData;payments?:Array<{payment_date:string;amount:unknown}>;outflows?:Array<{payment_date:string;amount:unknown}>;refunds?:Array<{payment_date:string;amount:unknown}>;incomplete?:boolean};
/** No invoice volume, approved expenses, or gross payroll are cash payments. */
export function cashStatisticEvents(data:CashStatisticsData):StatisticEvent[]{return [...(data.refunds??[]).map(row=>({date:row.payment_date,values:{income:-sumMoney([row.amount]),costs:0}})),...(data.payments??[]).map(row=>({date:row.payment_date,values:{income:row.amount,costs:0}})),...(data.outflows??[]).map(row=>({date:row.payment_date,values:{income:0,costs:row.amount}}))];}

export function financialStatisticEvents(data:CashStatisticsData):StatisticEvent[]{return [...cashStatisticEvents(data),...(data.financial?.revenueEvents??[]).map(row=>({date:row.date,values:{revenue:row.amount}}))];}

/** Only a complete, known-empty snapshot may hide first-run zero tiles. Unknown data is not zero. */
export function hasFinancialHistory(data:CashStatisticsData):boolean{
 if(data.incomplete||!data.financial||![data.payments,data.outflows,data.refunds,data.financial.revenueEvents].every(Array.isArray))return true;
 return [data.payments,data.outflows,data.refunds,data.financial.revenueEvents].some(rows=>rows!.length>0)||[data.financial.snapshot.paid,data.financial.snapshot.open,data.financial.snapshot.overdue,data.financial.snapshot.credit_balance].some(value=>value==null||value===''||!Number.isFinite(Number(value))||Number(value)!==0);
}

/** Presentation-only normalization; signed ledger values remain untouched. */
export function comparisonBarWidths(income:number,costs:number){
 const positive=(value:number)=>Number.isFinite(value)?Math.max(0,value):0;
 const received=positive(income),paid=positive(costs),maximum=Math.max(received,paid);
 return {income:maximum?received/maximum*100:0,costs:maximum?paid/maximum*100:0};
}
