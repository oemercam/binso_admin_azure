import {sumMoney} from './money';
import type {StatisticEvent} from './statistics-period';
export type FinancialMetricsData={revenueEvents:Array<{date:string;amount:unknown}>;snapshot:{as_of:string;paid:unknown;open:unknown;overdue:unknown;credit_balance:unknown}};
export type CashStatisticsData={financial?:FinancialMetricsData;payments?:Array<{payment_date:string;amount:unknown}>;outflows?:Array<{payment_date:string;amount:unknown}>;refunds?:Array<{payment_date:string;amount:unknown}>;incomplete?:boolean};
/** No invoice volume, approved expenses, or gross payroll are cash payments. */
export function cashStatisticEvents(data:CashStatisticsData):StatisticEvent[]{return [...(data.refunds??[]).map(row=>({date:row.payment_date,values:{income:-sumMoney([row.amount]),costs:0}})),...(data.payments??[]).map(row=>({date:row.payment_date,values:{income:row.amount,costs:0}})),...(data.outflows??[]).map(row=>({date:row.payment_date,values:{income:0,costs:row.amount}}))];}

export function financialStatisticEvents(data:CashStatisticsData):StatisticEvent[]{return [...cashStatisticEvents(data),...(data.financial?.revenueEvents??[]).map(row=>({date:row.date,values:{revenue:row.amount}}))];}
